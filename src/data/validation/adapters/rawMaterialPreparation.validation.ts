import { STRINGS } from "@/app/config/strings";
import type { MaterialItem } from "@/data/models/admin/BatchManagement/BatchManagementModel";
import type {
  RawMaterialPrepPremixSession,
  RawMaterialPrepWeightmentDetail,
  RawMaterialPrepWeightmentSheet,
} from "@/data/models/user/RawMaterialPreparationModel";
import { validateLotDetailsForPremix } from "@/data/models/user/rmp/validateMaterialProcessForm";
import {
  validateWeightmentSheetAgainstIdentification,
  validateWeightmentRowAgainstSheet,
} from "@/data/models/user/rawMaterialWeightmentValidation";
import { getPremixMaterialSessionKey } from "@/hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import {
  ALPHA_NUM,
  isFiniteNumber,
  isValidUiDateTime,
  str,
} from "../fieldValidators";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";

const M = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.VALIDATION;
const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;

export type AddedPremixSelection = {
  premix: number;
  materialKey: string;
  solidMaterialCode?: string;
  solidGradeCode?: string;
  solidRmpFormTemplate?: string | null;
  liquidMaterialCode?: string;
  liquidGradeCode?: string;
  quantityPerPremix?: number;
  lotIds?: string[];
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

export type RmpValidationFocusTarget = {
  premixNo: number;
  materialKey?: string;
  slot?: "solid" | "liquid";
  /** Dot path: lotDetails.0.lotId | weightment.details.0.materialCode | weightment.mixerBuildingNumber */
  fieldPath: string;
};

export const weightmentPath = (rowIndex: number, field: string): string =>
  `weightment.details.${rowIndex}.${field}`;

export const weightmentMixerBuildingPath = (): string => "weightment.mixerBuildingNumber";

type PremixProcessSlotState = RawMaterialPrepPremixSession["solid"];

/** Typed process UI is ready once a material is selected. */
export const isPremixProcessSlotReady = (
  selected: boolean,
  _slot: PremixProcessSlotState,
  materialCode: string | undefined,
  _weightmentSheet: RawMaterialPrepWeightmentSheet,
): boolean => {
  if (!selected) return true;
  return Boolean(str(materialCode));
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

const materialCodesForSelections = (selections: AddedPremixSelection[]): string[] => {
  const codes = new Set<string>();
  for (const entry of selections) {
    if (entry.selectedProcesses.solid && str(entry.solidMaterialCode)) {
      codes.add(str(entry.solidMaterialCode).toUpperCase());
    }
    if (entry.selectedProcesses.liquid && str(entry.liquidMaterialCode)) {
      codes.add(str(entry.liquidMaterialCode).toUpperCase());
    }
  }
  return Array.from(codes);
};

/** Lots-only for each selected solid/liquid material (no process fields). */
function validatePremixLotSessions(
  input: RawMaterialPrepValidationInput,
  intent: "DRAFT" | "SUBMIT",
): Record<string, Record<string, string>> {
  const premixFieldErrors: Record<string, Record<string, string>> = {};
  const selections = input.premixNo
    ? input.addedPremixSelections.filter((entry) => entry.premix === input.premixNo)
    : input.addedPremixSelections;

  for (const entry of selections) {
    const sessionKey = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    const session = input.premixSessions[sessionKey];
    if (!session) continue;

    if (entry.selectedProcesses.solid && str(entry.solidMaterialCode)) {
      const errs = validateLotDetailsForPremix(
        session.solid.processForm.lotDetails,
        intent,
        entry.quantityPerPremix,
      );
      if (Object.keys(errs).length > 0) {
        premixFieldErrors[`${sessionKey}:solid`] = errs;
      }
    }

    if (entry.selectedProcesses.liquid && str(entry.liquidMaterialCode)) {
      const errs = validateLotDetailsForPremix(
        session.liquid.processForm.lotDetails,
        intent,
        entry.quantityPerPremix,
      );
      if (Object.keys(errs).length > 0) {
        premixFieldErrors[`${sessionKey}:liquid`] = errs;
      }
    }
  }

  return premixFieldErrors;
}

const WEIGHTMENT_ROW_CHECKS: Array<{
  key: keyof RawMaterialPrepWeightmentDetail;
  requiredMsg: string;
  invalidMsg?: string;
  kind: "text" | "number" | "datetime" | "alphaNum";
}> = [
  {
    key: "materialCode",
    requiredMsg: M.weightmentMaterialCode.required,
    kind: "text",
  },
  {
    key: "containerType",
    requiredMsg: M.weightmentContainerType.required,
    kind: "text",
  },
  {
    key: "containerNumber",
    requiredMsg: M.weightmentContainerNumber.required,
    invalidMsg: M.weightmentContainerNumber.invalid,
    kind: "alphaNum",
  },
  {
    key: "weighScaleNumber",
    requiredMsg: M.weightmentWeighScale.required,
    invalidMsg: M.weightmentWeighScale.invalid,
    kind: "number",
  },
  {
    key: "weightTransferred",
    requiredMsg: M.weightmentWeight.required,
    invalidMsg: M.weightmentWeight.invalid,
    kind: "number",
  },
  {
    key: "weighingDateTime",
    requiredMsg: M.weightmentWeighingDatetime.required,
    invalidMsg: M.weightmentWeighingDatetime.invalid,
    kind: "datetime",
  },
];

/** Live FORMAT checks for a weighment row / mixer field (non-empty values only). */
export function validateWeightmentLiveFormat(
  sheet: RawMaterialPrepWeightmentSheet,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const mixer = str(sheet.mixerBuildingNumber);
  if (mixer) {
    // Dropdown value — no ALPHA_NUM needed; leave empty unless somehow invalid
  }

  sheet.weightmentDetails.forEach((row, rowIndex) => {
    const name = str(row.materialName);
    if (name && !ALPHA_NUM.test(name)) {
      errors[weightmentPath(rowIndex, "materialName")] =
        M.weightmentMaterialName?.invalid ??
        "Use letters, numbers, spaces, hyphens, underscores, or slashes only";
    }

    for (const check of WEIGHTMENT_ROW_CHECKS) {
      const text = str(row[check.key]);
      if (!text) continue;
      const path = weightmentPath(rowIndex, check.key);
      if (check.kind === "number" && !isFiniteNumber(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentWeight.invalid;
      } else if (check.kind === "datetime" && !isValidUiDateTime(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentWeighingDatetime.invalid;
      } else if (check.kind === "alphaNum" && !ALPHA_NUM.test(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentContainerNumber.invalid;
      }
    }
  });

  return errors;
}

function validateWeightmentForSubmit(
  sheet: RawMaterialPrepWeightmentSheet,
  selections: AddedPremixSelection[],
  identificationMaterials: MaterialItem[],
): ValidationErrors {
  const errors: ValidationErrors = {};

  const mixer = str(sheet.mixerBuildingNumber);
  if (!mixer) {
    errors[weightmentMixerBuildingPath()] = M.mixerBuildingNumber.required;
  }

  const requiredCodes = materialCodesForSelections(selections);
  const rowsByCode = new Map<string, number[]>();
  sheet.weightmentDetails.forEach((row, index) => {
    const code = str(row.materialCode).toUpperCase();
    if (!code) return;
    const list = rowsByCode.get(code) ?? [];
    list.push(index);
    rowsByCode.set(code, list);
  });

  for (const code of requiredCodes) {
    const indices = rowsByCode.get(code);
    if (!indices?.length) {
      // Attach missing-material error to first empty row or invent path for snackbar/focus
      const emptyIndex = sheet.weightmentDetails.findIndex((row) => !str(row.materialCode));
      const rowIndex = emptyIndex >= 0 ? emptyIndex : Math.max(0, sheet.weightmentDetails.length - 1);
      errors[weightmentPath(rowIndex, "materialCode")] =
        M.weightmentMaterialCode.required + ` (${code})`;
      continue;
    }

    for (const rowIndex of indices) {
      const row = sheet.weightmentDetails[rowIndex];
      for (const check of WEIGHTMENT_ROW_CHECKS) {
        const text = str(row[check.key]);
        const path = weightmentPath(rowIndex, check.key);
        if (!text) {
          errors[path] = check.requiredMsg;
        } else if (check.kind === "number" && !isFiniteNumber(text)) {
          errors[path] = check.invalidMsg ?? M.weightmentWeight.invalid;
        } else if (check.kind === "datetime" && !isValidUiDateTime(text)) {
          errors[path] = check.invalidMsg ?? M.weightmentWeighingDatetime.invalid;
        } else if (check.kind === "alphaNum" && !ALPHA_NUM.test(text)) {
          errors[path] = check.invalidMsg ?? M.weightmentContainerNumber.invalid;
        }
      }

      const name = str(row.materialName);
      if (name && !ALPHA_NUM.test(name)) {
        errors[weightmentPath(rowIndex, "materialName")] =
          M.weightmentMaterialName?.invalid ??
          "Use letters, numbers, spaces, hyphens, underscores, or slashes only";
      }

      if (sheet.validation.compareWithIdentificationSheet) {
        const sheetErrors = validateWeightmentRowAgainstSheet(row, identificationMaterials, {
          materialNotInSheet: RM.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
          percentageMismatch: RM.WEIGHTMENT_PERCENTAGE_MISMATCH,
          weightMismatch: RM.WEIGHTMENT_WEIGHT_MISMATCH,
        });
        if (sheetErrors.materialCode) {
          errors[weightmentPath(rowIndex, "materialCode")] = sheetErrors.materialCode;
        }
        if (sheetErrors.weightTransferred) {
          errors[weightmentPath(rowIndex, "weightTransferred")] = sheetErrors.weightTransferred;
        }
      }
    }
  }

  // Also validate any extra started rows not in required set
  sheet.weightmentDetails.forEach((row, rowIndex) => {
    const code = str(row.materialCode).toUpperCase();
    if (code && requiredCodes.includes(code)) return;
    const hasAny =
      WEIGHTMENT_ROW_CHECKS.some(({ key }) => str(row[key])) || str(row.materialName);
    if (!hasAny) return;
    for (const check of WEIGHTMENT_ROW_CHECKS) {
      const text = str(row[check.key]);
      const path = weightmentPath(rowIndex, check.key);
      if (!text) {
        errors[path] = check.requiredMsg;
      } else if (check.kind === "number" && !isFiniteNumber(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentWeight.invalid;
      } else if (check.kind === "datetime" && !isValidUiDateTime(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentWeighingDatetime.invalid;
      } else if (check.kind === "alphaNum" && !ALPHA_NUM.test(text)) {
        errors[path] = check.invalidMsg ?? M.weightmentContainerNumber.invalid;
      }
    }
  });

  return errors;
}

export function validateRawMaterialPreparation(
  input: RawMaterialPrepValidationInput,
  tier: ValidationTier,
): RawMaterialPrepValidationResult {
  const selections = input.premixNo
    ? input.addedPremixSelections.filter((e) => e.premix === input.premixNo)
    : input.addedPremixSelections;

  const premixFieldErrors: Record<string, Record<string, string>> = {};

  // Draft (UNIT) and submit both require lot details; submit also requires weighment below.
  if (tier === "UNIT" || tier === "SUBMIT") {
    const lotErrors = validatePremixLotSessions(input, "SUBMIT");
    for (const [key, errs] of Object.entries(lotErrors)) {
      premixFieldErrors[key] = { ...(premixFieldErrors[key] ?? {}), ...errs };
    }
  }

  const weightmentErrors =
    tier === "SUBMIT"
      ? validateWeightmentForSubmit(
          input.weightmentSheet,
          selections,
          input.identificationSheetMaterials ?? [],
        )
      : tier === "FORMAT"
        ? validateWeightmentLiveFormat(input.weightmentSheet)
        : {};

  return { premixFieldErrors, weightmentErrors };
}

/** Resolve first error for snackbar focus / tab switch. */
export function resolveFirstRmpValidationFocus(
  premixNo: number,
  selections: AddedPremixSelection[],
  premixFieldErrors: Record<string, Record<string, string>>,
  weightmentErrors: ValidationErrors,
  weightmentSheet?: RawMaterialPrepWeightmentSheet,
): RmpValidationFocusTarget | null {
  const ordered = selections.filter((e) => e.premix === premixNo);

  // Lots first (material order), then weighment
  for (const entry of ordered) {
    const sessionKey = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    for (const slot of ["solid", "liquid"] as const) {
      const errs = premixFieldErrors[`${sessionKey}:${slot}`];
      if (!errs || !Object.keys(errs).length) continue;
      const fieldPath =
        Object.keys(errs)
          .filter((k) => k.startsWith("lotDetails."))
          .sort()[0] ?? Object.keys(errs)[0];
      return { premixNo, materialKey: entry.materialKey, slot, fieldPath };
    }
  }

  const mixerPath = weightmentMixerBuildingPath();
  const weightPaths = Object.keys(weightmentErrors)
    .filter((path) => path !== mixerPath)
    .sort();
  if (weightPaths.length) {
    const fieldPath = weightPaths[0];
    let materialKey: string | undefined;
    const rowMatch = fieldPath.match(/^weightment\.details\.(\d+)\./);
    if (rowMatch && weightmentSheet) {
      const row = weightmentSheet.weightmentDetails[Number(rowMatch[1])];
      const code = str(row?.materialCode || row?.scopeMaterialCode).toUpperCase();
      if (code) {
        const entry = ordered.find(
          (e) =>
            str(e.solidMaterialCode).toUpperCase() === code ||
            str(e.liquidMaterialCode).toUpperCase() === code,
        );
        materialKey = entry?.materialKey;
      }
    }
    return { premixNo, materialKey, fieldPath };
  }

  if (weightmentErrors[mixerPath]) {
    return { premixNo, fieldPath: mixerPath };
  }

  return null;
}

/** Scroll + focus the control tagged with `data-rmp-field`. */
export function focusRmpField(fieldPath: string, root: ParentNode = document): boolean {
  if (!fieldPath) return false;
  const selector = `[data-rmp-field="${fieldPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable =
    el.matches("input, select, textarea, button, [tabindex]")
      ? el
      : el.querySelector<HTMLElement>("input, select, textarea, button, [tabindex]");
  if (focusable) {
    try {
      focusable.focus({ preventScroll: true });
    } catch {
      focusable.focus?.();
    }
  }
  return true;
}

export function isWeightmentSubmitComplete(sheet: RawMaterialPrepWeightmentSheet): boolean {
  return Boolean(str(sheet.mixerBuildingNumber));
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
      materialNotInSheet: RM.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
      percentageMismatch: RM.WEIGHTMENT_PERCENTAGE_MISMATCH,
      weightMismatch: RM.WEIGHTMENT_WEIGHT_MISMATCH,
      deviationMessageRequired: RM.WEIGHTMENT_DEVIATION_MESSAGE_REQUIRED,
      incompleteRow: RM.WEIGHTMENT_INCOMPLETE_ROW,
    },
    sheet.validation,
  );
}

