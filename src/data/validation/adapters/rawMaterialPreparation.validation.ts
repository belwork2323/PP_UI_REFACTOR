import { STRINGS } from "@/app/config/strings";
import type { MaterialItem } from "@/data/models/admin/BatchManagement/BatchManagementModel";
import type {
  RawMaterialPrepPremixSession,
  RawMaterialPrepWeightmentDetail,
  RawMaterialPrepWeightmentSheet,
} from "@/data/models/user/RawMaterialPreparationModel";
import { processFormHasUserData } from "@/data/models/user/rmp/defaultSolidProcessForm";
import { validateMaterialProcessForm } from "@/data/models/user/rmp/validateMaterialProcessForm";
import { rmpUiKeyShowsProcessPanel } from "@/data/models/user/rmp/rmpMaterialUiRegistry";
import {
  validateWeightmentSheetAgainstIdentification,
  validateWeightmentRowAgainstSheet,
  weightmentHasMaterialData,
} from "@/data/models/user/rawMaterialWeightmentValidation";
import { getPremixMaterialSessionKey } from "@/hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import { ALPHA_NUM, validateFieldState } from "../fieldValidators";
import {
  premixRequiresWeightmentOnSubmit,
} from "../configs/rawMaterialPreparation.validation.config";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";

const M = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.VALIDATION;

export type AddedPremixSelection = {
  premix: number;
  materialKey: string;
  solidMaterialCode?: string;
  solidGradeCode?: string;
  liquidMaterialCode?: string;
  liquidGradeCode?: string;
  selectedProcesses: { solid?: boolean; liquid?: boolean };
};

export type RawMaterialPrepValidationInput = {
  premixNo?: number;
  addedPremixSelections: AddedPremixSelection[];
  premixSessions: Record<string, RawMaterialPrepPremixSession>;
  weightmentSheet: RawMaterialPrepWeightmentSheet;
  identificationSheetMaterials?: MaterialItem[];
};

export type RawMaterialPrepValidationResult = {
  premixFieldErrors: Record<string, Record<string, string>>;
  weightmentErrors: ValidationErrors;
};

export const weightmentPath = (rowIndex: number, field: string): string =>
  `weightment.details.${rowIndex}.${field}`;

export const weightmentMixerBuildingPath = (): string => "weightment.mixerBuildingNumber";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

type PremixProcessSlotState = RawMaterialPrepPremixSession["solid"];

/** Typed process UI is always ready once a material is selected (no schema fetch). */
export const isPremixProcessSlotReady = (
  selected: boolean,
  _slot: PremixProcessSlotState,
  materialCode: string | undefined,
  _weightmentSheet: RawMaterialPrepWeightmentSheet,
): boolean => {
  if (!selected) return true;
  return Boolean(str(materialCode));
};

/** @deprecated Use isPremixProcessSlotReady */
export const isPremixProcessSlotSchemaReady = isPremixProcessSlotReady;

/** Process has typed form data, or weightment-only coverage when no process panel applies. */
export const premixProcessSlotHasSubmitData = (
  selected: boolean,
  slot: PremixProcessSlotState,
  materialCode: string | undefined,
  weightmentSheet: RawMaterialPrepWeightmentSheet,
): boolean => {
  if (!selected) return false;
  if (!str(materialCode)) return false;
  if (rmpUiKeyShowsProcessPanel(slot.uiKey)) {
    if (processFormHasUserData(slot.processForm)) return true;
  }
  return weightmentHasMaterialData(weightmentSheet, materialCode);
};

export const isPremixSelectionProcessReady = (
  entry: AddedPremixSelection,
  session: RawMaterialPrepPremixSession,
  weightmentSheet: RawMaterialPrepWeightmentSheet,
): boolean =>
  isPremixProcessSlotReady(
    Boolean(entry.selectedProcesses.solid),
    session.solid,
    entry.solidMaterialCode,
    weightmentSheet,
  ) &&
  isPremixProcessSlotReady(
    Boolean(entry.selectedProcesses.liquid),
    session.liquid,
    entry.liquidMaterialCode,
    weightmentSheet,
  );

/** @deprecated Use isPremixSelectionProcessReady */
export const isPremixSelectionSchemaReady = isPremixSelectionProcessReady;

export const premixSelectionHasSubmitData = (
  entry: AddedPremixSelection,
  session: RawMaterialPrepPremixSession,
  weightmentSheet: RawMaterialPrepWeightmentSheet,
): boolean =>
  premixProcessSlotHasSubmitData(
    Boolean(entry.selectedProcesses.solid),
    session.solid,
    entry.solidMaterialCode,
    weightmentSheet,
  ) ||
  premixProcessSlotHasSubmitData(
    Boolean(entry.selectedProcesses.liquid),
    session.liquid,
    entry.liquidMaterialCode,
    weightmentSheet,
  );

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  return Boolean(text) && Number.isFinite(Number(text));
};

function validatePremixProcessSessions(
  input: RawMaterialPrepValidationInput,
  tier: ValidationTier,
): Record<string, Record<string, string>> {
  const intent = tier === "SUBMIT" ? "SUBMIT" : "DRAFT";
  const premixFieldErrors: Record<string, Record<string, string>> = {};

  const selections = input.premixNo
    ? input.addedPremixSelections.filter((entry) => entry.premix === input.premixNo)
    : input.addedPremixSelections;

  for (const entry of selections) {
    const sessionKey = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    const session = input.premixSessions[sessionKey];
    if (!session) continue;

    if (entry.selectedProcesses.solid && rmpUiKeyShowsProcessPanel(session.solid.uiKey)) {
      const errs = validateMaterialProcessForm(
        session.solid.uiKey,
        session.solid.processForm,
        intent,
        {
          materialCode: entry.solidMaterialCode,
          gradeCode: entry.solidGradeCode,
        },
      );
      const errorKey = `${sessionKey}:solid`;
      if (Object.keys(errs).length > 0) {
        premixFieldErrors[errorKey] = errs;
      }
    }

    if (entry.selectedProcesses.liquid && rmpUiKeyShowsProcessPanel(session.liquid.uiKey)) {
      const errs = validateMaterialProcessForm(
        session.liquid.uiKey,
        session.liquid.processForm,
        intent,
        {
          materialCode: entry.liquidMaterialCode,
          gradeCode: entry.liquidGradeCode,
        },
      );
      const errorKey = `${sessionKey}:liquid`;
      if (Object.keys(errs).length > 0) {
        premixFieldErrors[errorKey] = errs;
      }
    }
  }

  return premixFieldErrors;
}

function validateWeightmentForSubmit(
  sheet: RawMaterialPrepWeightmentSheet,
  selections: AddedPremixSelection[],
  identificationMaterials: MaterialItem[],
): ValidationErrors {
  const errors: ValidationErrors = {};
  const requiresWeightment = premixRequiresWeightmentOnSubmit(selections);

  if (requiresWeightment) {
    const mixer = str(sheet.mixerBuildingNumber);
    if (!mixer) {
      errors[weightmentMixerBuildingPath()] = M.mixerBuildingNumber.required;
    } else if (!ALPHA_NUM.test(mixer)) {
      errors[weightmentMixerBuildingPath()] = M.mixerBuildingNumber.invalid;
    }
  }

  const rowFieldChecks: Array<{
    key: keyof RawMaterialPrepWeightmentDetail;
    requiredMsg: string;
    invalidMsg?: string;
    isNumber?: boolean;
  }> = [
    { key: "materialCode", requiredMsg: M.weightmentMaterialCode.required },
    {
      key: "percentage",
      requiredMsg: M.weightmentPercentage.required,
      invalidMsg: M.weightmentPercentage.invalid,
      isNumber: true,
    },
    {
      key: "weightTransferred",
      requiredMsg: M.weightmentWeight.required,
      invalidMsg: M.weightmentWeight.invalid,
      isNumber: true,
    },
    { key: "containerType", requiredMsg: M.weightmentContainerType.required },
    { key: "containerNumber", requiredMsg: M.weightmentContainerNumber.required },
    { key: "weighScaleNumber", requiredMsg: M.weightmentWeighScale.required },
    { key: "weighingDateTime", requiredMsg: M.weightmentWeighingDatetime.required },
  ];

  sheet.weightmentDetails.forEach((row, rowIndex) => {
    const hasAny =
      rowFieldChecks.some(({ key }) => str(row[key])) || str(row.materialName);

    if (!hasAny) return;

    for (const check of rowFieldChecks) {
      const value = row[check.key];
      const text = str(value);
      const path = weightmentPath(rowIndex, check.key);
      if (!text) {
        errors[path] = check.requiredMsg;
      } else if (check.isNumber && !isFiniteNumber(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentWeight.invalid;
      }
    }

    if (sheet.validation.compareWithIdentificationSheet) {
      const sheetErrors = validateWeightmentRowAgainstSheet(row, identificationMaterials, {
        materialNotInSheet: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
        percentageMismatch: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_PERCENTAGE_MISMATCH,
        weightMismatch: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_WEIGHT_MISMATCH,
      });
      if (sheetErrors.materialCode) {
        errors[weightmentPath(rowIndex, "materialCode")] = sheetErrors.materialCode;
      }
      if (sheetErrors.percentage) {
        errors[weightmentPath(rowIndex, "percentage")] = sheetErrors.percentage;
      }
      if (sheetErrors.weightTransferred) {
        errors[weightmentPath(rowIndex, "weightTransferred")] = sheetErrors.weightTransferred;
      }
    }
  });

  return errors;
}

export function validateRawMaterialPreparation(
  input: RawMaterialPrepValidationInput,
  tier: ValidationTier,
): RawMaterialPrepValidationResult {
  const premixFieldErrors = validatePremixProcessSessions(input, tier);
  const weightmentErrors =
    tier === "SUBMIT"
      ? validateWeightmentForSubmit(
          input.weightmentSheet,
          input.premixNo
            ? input.addedPremixSelections.filter((e) => e.premix === input.premixNo)
            : input.addedPremixSelections,
          input.identificationSheetMaterials ?? [],
        )
      : {};

  return { premixFieldErrors, weightmentErrors };
}

export function isWeightmentSubmitComplete(sheet: RawMaterialPrepWeightmentSheet): boolean {
  const mixerState = validateFieldState(sheet.mixerBuildingNumber, {
    valueType: "text",
    required: Boolean(str(sheet.mixerBuildingNumber)),
    pattern: ALPHA_NUM,
  });
  if (str(sheet.mixerBuildingNumber) && mixerState !== "valid") return false;
  return true;
}

export function getWeightmentIdentificationError(
  sheet: RawMaterialPrepWeightmentSheet,
  identificationMaterials: MaterialItem[],
): string | null {
  return validateWeightmentSheetAgainstIdentification(
    sheet.weightmentDetails,
    identificationMaterials,
    sheet.validation.compareWithIdentificationSheet === true,
    {
      materialNotInSheet: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
      percentageMismatch: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_PERCENTAGE_MISMATCH,
      weightMismatch: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_WEIGHT_MISMATCH,
      deviationMessageRequired:
        STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_DEVIATION_MESSAGE_REQUIRED,
      incompleteRow: STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.WEIGHTMENT_INCOMPLETE_ROW,
    },
    sheet.validation,
  );
}
