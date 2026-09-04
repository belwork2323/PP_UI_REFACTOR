import { STRINGS } from "@/app/config/strings";
import type { MaterialItem } from "@/data/models/admin/BatchManagement/BatchManagementModel";
import type {
  RawMaterialPrepPremixSession,
  RawMaterialPrepWeightmentDetail,
  RawMaterialPrepWeightmentSheet,
} from "@/data/models/user/RawMaterialPreparationModel";
import { validateSchemaFormValues } from "@/data/models/user/schemaFormValidation";
import {
  validateWeightmentSheetAgainstIdentification,
  validateWeightmentRowAgainstSheet,
} from "@/data/models/user/rawMaterialWeightmentValidation";
import { getPremixMaterialSessionKey } from "@/hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import type { SchemaDocumentV2 } from "@/schema-engine/types";
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

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  return Boolean(text) && Number.isFinite(Number(text));
};

function validatePremixSchemaSessions(
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

    if (entry.selectedProcesses.solid && session.solid.schema) {
      const schema = session.solid.schema as SchemaDocumentV2;
      const errs = validateSchemaFormValues(
        schema,
        session.solid.formValues ?? {},
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

    if (entry.selectedProcesses.liquid && session.liquid.schema) {
      const schema = session.liquid.schema as SchemaDocumentV2;
      const errs = validateSchemaFormValues(
        schema,
        session.liquid.formValues ?? {},
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
    { key: "percentage", requiredMsg: M.weightmentPercentage.required, invalidMsg: M.weightmentPercentage.invalid, isNumber: true },
    { key: "weightTransferred", requiredMsg: M.weightmentWeight.required, invalidMsg: M.weightmentWeight.invalid, isNumber: true },
    { key: "containerType", requiredMsg: M.weightmentContainerType.required },
    { key: "containerNumber", requiredMsg: M.weightmentContainerNumber.required },
    { key: "weighScaleNumber", requiredMsg: M.weightmentWeighScale.required },
    { key: "weighingDateTime", requiredMsg: M.weightmentWeighingDatetime.required },
  ];

  sheet.weightmentDetails.forEach((row, rowIndex) => {
    const hasAny =
      rowFieldChecks.some(({ key }) => str(row[key])) ||
      str(row.materialName);

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
      if (sheetErrors.materialCode) errors[weightmentPath(rowIndex, "materialCode")] = sheetErrors.materialCode;
      if (sheetErrors.percentage) errors[weightmentPath(rowIndex, "percentage")] = sheetErrors.percentage;
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
  const premixFieldErrors = validatePremixSchemaSessions(input, tier);
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
