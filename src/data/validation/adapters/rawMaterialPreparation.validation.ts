import { STRINGS } from "@/app/config/strings";
import type { MaterialItem } from "@/data/models/admin/BatchManagement/BatchManagementModel";
import type {
  RawMaterialPrepPremixSession,
  RawMaterialPrepWeightmentDetail,
  RawMaterialPrepWeightmentSheet,
} from "@/data/models/user/RawMaterialPreparationModel";
import {
  createEmptyWeightmentValidation,
  resolveWeightmentPremixMeta,
} from "@/data/models/user/RawMaterialPreparationModel";
import type { RmpMaterialProcessForm } from "@/data/models/user/rmp/defaultSolidProcessForm";
import {
  validateMaterialProcessForm,
  type MaterialProcessValidationIntent,
} from "@/data/models/user/rmp/validateMaterialProcessForm";
import {
  isApRmpFormTemplate,
  normalizeApGradeCode,
  resolveMaterialUiKey,
} from "@/data/models/user/rmp/rmpMaterialUiRegistry";
import { firstValidationError } from "@/data/validation/validationErrors";
import {
  validateWeightmentSheetAgainstIdentification,
  validateWeightmentRowAgainstSheet,
} from "@/data/models/user/rawMaterialWeightmentValidation";
import { getPremixMaterialSessionKey } from "@/hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import { ALPHA_NUM, isFiniteNumber, isValidUiDateTime, str } from "../fieldValidators";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

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
  liquidRmpFormTemplate?: string | null;
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

export const weightmentDeviationMessagePath = (): string =>
  "weightment.validation.deviationMessage";

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

/** Premix numbers represented in the current validation selection set. */
const premixNosForSelections = (selections: AddedPremixSelection[]): Set<number> => {
  const nos = new Set<number>();
  for (const entry of selections) {
    const n = Number(entry.premix);
    if (Number.isFinite(n) && n > 0) nos.add(n);
  }
  return nos;
};

/**
 * Weightment rows are per premix × material. When validating a single premix submit,
 * only that premix's rows are required — other premixes may still be empty/in progress.
 * Legacy rows without premixNo are included when validating a single premix.
 */
const rowBelongsToPremixScope = (
  row: RawMaterialPrepWeightmentDetail,
  targetPremixNos: Set<number>,
): boolean => {
  if (targetPremixNos.size === 0) return true;
  const rowPremix =
    row.premixNo == null || !Number.isFinite(Number(row.premixNo))
      ? null
      : Number(row.premixNo);
  if (rowPremix == null) {
    return targetPremixNos.size === 1;
  }
  return targetPremixNos.has(rowPremix);
};

export type RmpValidationAttemptFlags = {
  format: boolean;
  unit: boolean;
  submit: boolean;
};

/** Submit attempt only — draft/save never gates on required fields. */
export const resolveRmpPremixValidationIntent = (
  attempt: Pick<RmpValidationAttemptFlags, "submit" | "unit">,
): MaterialProcessValidationIntent => (attempt.submit ? "SUBMIT" : "DRAFT");

const prefixApGradeErrors = (
  errors: Record<string, string>,
  gradeCode: string,
  multiGrade: boolean,
): Record<string, string> => {
  if (!multiGrade) return errors;
  const grade = normalizeApGradeCode(gradeCode);
  const prefixed: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    prefixed[`${grade}:${key}`] = message;
  }
  return prefixed;
};

const validateSolidProcessErrors = (
  entry: AddedPremixSelection,
  session: RawMaterialPrepPremixSession,
  intent: MaterialProcessValidationIntent,
): Record<string, string> => {
  const apSlots = session.apGradeSlots;
  if (
    isApRmpFormTemplate(entry.solidRmpFormTemplate) &&
    Array.isArray(apSlots) &&
    apSlots.length > 0
  ) {
    const merged: Record<string, string> = {};
    const multiGrade = apSlots.length > 1;
    for (const card of apSlots) {
      const grade = normalizeApGradeCode(card.gradeCode);
      const uiKey = resolveMaterialUiKey({
        materialCode: entry.solidMaterialCode ?? "",
        slot: "solid",
        gradeCode: grade,
        rmpFormTemplate: "AP",
      });
      const cardErrs = validateMaterialProcessForm(uiKey, card.slot.processForm, intent, {
        materialCode: entry.solidMaterialCode,
        gradeCode: grade,
        quantityPerPremix: entry.quantityPerPremix,
      });
      Object.assign(merged, prefixApGradeErrors(cardErrs, card.gradeCode, multiGrade));
    }
    return merged;
  }

  const uiKey = resolveMaterialUiKey({
    materialCode: entry.solidMaterialCode ?? "",
    slot: "solid",
    gradeCode: entry.solidGradeCode,
    rmpFormTemplate: entry.solidRmpFormTemplate,
  });
  return validateMaterialProcessForm(uiKey, session.solid.processForm, intent, {
    materialCode: entry.solidMaterialCode,
    gradeCode: entry.solidGradeCode,
    quantityPerPremix: entry.quantityPerPremix,
  });
};

const validateLiquidProcessErrors = (
  entry: AddedPremixSelection,
  session: RawMaterialPrepPremixSession,
  intent: MaterialProcessValidationIntent,
): Record<string, string> => {
  const uiKey = resolveMaterialUiKey({
    materialCode: entry.liquidMaterialCode ?? "",
    slot: "liquid",
    gradeCode: entry.liquidGradeCode,
    rmpFormTemplate: entry.liquidRmpFormTemplate ?? entry.solidRmpFormTemplate,
  });
  return validateMaterialProcessForm(uiKey, session.liquid.processForm, intent, {
    materialCode: entry.liquidMaterialCode,
    gradeCode: entry.liquidGradeCode,
    quantityPerPremix: entry.quantityPerPremix,
  });
};

/**
 * Premix material validation:
 * - DRAFT/save: no required gates
 * - SUBMIT: lot details only (process fields optional for all templates)
 */
function validatePremixProcessSessions(
  input: RawMaterialPrepValidationInput,
  intent: MaterialProcessValidationIntent,
): Record<string, Record<string, string>> {
  if (intent === "DRAFT") {
    return {};
  }

  const premixFieldErrors: Record<string, Record<string, string>> = {};
  const selections = input.premixNo
    ? input.addedPremixSelections.filter((entry) => entry.premix === input.premixNo)
    : input.addedPremixSelections;

  for (const entry of selections) {
    const sessionKey = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    const session = input.premixSessions[sessionKey];
    if (!session) {
      const slot =
        entry.selectedProcesses.solid && str(entry.solidMaterialCode)
          ? "solid"
          : entry.selectedProcesses.liquid && str(entry.liquidMaterialCode)
            ? "liquid"
            : null;
      if (slot) {
        premixFieldErrors[`${sessionKey}:${slot}`] = {
          "lotDetails.0.lotId": "This Field is required",
        };
      }
      continue;
    }

    if (entry.selectedProcesses.solid && str(entry.solidMaterialCode)) {
      const errs = validateSolidProcessErrors(entry, session, intent);
      if (Object.keys(errs).length > 0) {
        premixFieldErrors[`${sessionKey}:solid`] = errs;
      }
    }

    if (entry.selectedProcesses.liquid && str(entry.liquidMaterialCode)) {
      const errs = validateLiquidProcessErrors(entry, session, intent);
      if (Object.keys(errs).length > 0) {
        premixFieldErrors[`${sessionKey}:liquid`] = errs;
      }
    }
  }

  return premixFieldErrors;
}

/** Live revalidation after submit attempt (lot details only). */
export function validateRmpPremixSlotLive(params: {
  selection: AddedPremixSelection;
  slot: "solid" | "liquid";
  processForm: RmpMaterialProcessForm;
  attempt: Pick<RmpValidationAttemptFlags, "submit" | "unit">;
  gradeCode?: string;
  apGradeCount?: number;
}): Record<string, string> {
  const intent = resolveRmpPremixValidationIntent(params.attempt);
  if (intent === "DRAFT") {
    return {};
  }
  const materialCode =
    params.slot === "solid"
      ? params.selection.solidMaterialCode
      : params.selection.liquidMaterialCode;
  const uiKey = resolveMaterialUiKey({
    materialCode: materialCode ?? "",
    slot: params.slot,
    gradeCode:
      params.gradeCode ??
      (params.slot === "solid"
        ? params.selection.solidGradeCode
        : params.selection.liquidGradeCode),
    rmpFormTemplate:
      params.slot === "solid"
        ? params.selection.solidRmpFormTemplate
        : (params.selection.liquidRmpFormTemplate ?? params.selection.solidRmpFormTemplate),
  });
  const errors = validateMaterialProcessForm(uiKey, params.processForm, intent, {
    materialCode,
    gradeCode:
      params.gradeCode ??
      (params.slot === "solid"
        ? params.selection.solidGradeCode
        : params.selection.liquidGradeCode),
    quantityPerPremix: params.selection.quantityPerPremix,
  });
  if (params.gradeCode && (params.apGradeCount ?? 0) > 1) {
    return prefixApGradeErrors(errors, params.gradeCode, true);
  }
  return errors;
}

export function validateRmpApGradeCardsLive(params: {
  selection: AddedPremixSelection;
  cards: Array<{ gradeCode: string; slot: { processForm: RmpMaterialProcessForm } }>;
  attempt: Pick<RmpValidationAttemptFlags, "submit" | "unit">;
}): Record<string, string> {
  const merged: Record<string, string> = {};
  const count = params.cards.length;
  for (const card of params.cards) {
    Object.assign(
      merged,
      validateRmpPremixSlotLive({
        selection: params.selection,
        slot: "solid",
        processForm: card.slot.processForm,
        attempt: params.attempt,
        gradeCode: card.gradeCode,
        apGradeCount: count,
      }),
    );
  }
  return merged;
}

export const firstRmpValidationErrorMessage = (
  premixFieldErrors: Record<string, Record<string, string>>,
  weightmentErrors: ValidationErrors,
): string | undefined => {
  for (const slotErrs of Object.values(premixFieldErrors)) {
    for (const message of Object.values(slotErrs)) {
      const text = str(message);
      if (text) return text;
    }
  }
  return firstValidationError(weightmentErrors);
};

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

  const deviationMessage = str(sheet.validation.deviationMessage);
  if (deviationMessage && !ALPHA_NUM.test(deviationMessage)) {
    errors[weightmentDeviationMessagePath()] =
      M.weightmentDeviationMessage?.invalid ??
      "Use letters, numbers, spaces, hyphens, underscores, or slashes only";
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

export function validateWeightmentForSubmit(
  sheet: RawMaterialPrepWeightmentSheet,
  selections: AddedPremixSelection[],
  identificationMaterials: MaterialItem[],
): ValidationErrors {
  const errors: ValidationErrors = {};
  const targetPremixNos = premixNosForSelections(selections);

  // Use this premix's mixer / deviation — never another premix's shared header.
  let mixer = str(sheet.mixerBuildingNumber);
  let validation = sheet.validation ?? createEmptyWeightmentValidation();
  if (targetPremixNos.size === 1) {
    const meta = resolveWeightmentPremixMeta(sheet, [...targetPremixNos][0]);
    mixer = str(meta.mixerBuildingNumber);
    validation = meta.validation;
  }

  if (!mixer) {
    errors[weightmentMixerBuildingPath()] = M.mixerBuildingNumber.required;
  }

  const deviationMessage = str(validation.deviationMessage);
  if (validation.deviationFound === true && !deviationMessage) {
    errors[weightmentDeviationMessagePath()] =
      M.weightmentDeviationMessage?.required ?? RM.WEIGHTMENT_DEVIATION_MESSAGE_REQUIRED;
  } else if (deviationMessage && !ALPHA_NUM.test(deviationMessage)) {
    errors[weightmentDeviationMessagePath()] =
      M.weightmentDeviationMessage?.invalid ??
      "Use letters, numbers, spaces, hyphens, underscores, or slashes only";
  }

  const requiredCodes = materialCodesForSelections(selections);
  const rowsByCode = new Map<string, number[]>();
  sheet.weightmentDetails.forEach((row, index) => {
    if (!rowBelongsToPremixScope(row, targetPremixNos)) return;
    const code = str(row.materialCode).toUpperCase();
    if (!code) return;
    const list = rowsByCode.get(code) ?? [];
    list.push(index);
    rowsByCode.set(code, list);
  });

  for (const code of requiredCodes) {
    const indices = rowsByCode.get(code);
    if (!indices?.length) {
      // Attach missing-material error to first empty in-scope row or invent path for snackbar/focus
      const emptyIndex = sheet.weightmentDetails.findIndex(
        (row) => rowBelongsToPremixScope(row, targetPremixNos) && !str(row.materialCode),
      );
      const scopedIndices = sheet.weightmentDetails
        .map((row, index) => (rowBelongsToPremixScope(row, targetPremixNos) ? index : -1))
        .filter((index) => index >= 0);
      const rowIndex =
        emptyIndex >= 0
          ? emptyIndex
          : scopedIndices.length
            ? scopedIndices[scopedIndices.length - 1]
            : Math.max(0, sheet.weightmentDetails.length - 1);
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

      if (validation.compareWithIdentificationSheet) {
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

  // Also validate any extra started in-scope rows not in required set
  sheet.weightmentDetails.forEach((row, rowIndex) => {
    if (!rowBelongsToPremixScope(row, targetPremixNos)) return;
    const code = str(row.materialCode).toUpperCase();
    if (code && requiredCodes.includes(code)) return;
    const hasAny = WEIGHTMENT_ROW_CHECKS.some(({ key }) => str(row[key])) || str(row.materialName);
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

/** Merge format checks with submit-tier errors when the user has attempted submit. */
export function validateWeightmentErrorsLive(
  sheet: RawMaterialPrepWeightmentSheet,
  selections: AddedPremixSelection[],
  identificationMaterials: MaterialItem[],
  attempt: Pick<RmpValidationAttemptFlags, "submit">,
): ValidationErrors {
  const formatErrors = validateWeightmentLiveFormat(sheet);
  if (!attempt.submit) {
    return formatErrors;
  }
  const submitErrors = validateWeightmentForSubmit(sheet, selections, identificationMaterials);
  return { ...formatErrors, ...submitErrors };
}

export function validateRawMaterialPreparation(
  input: RawMaterialPrepValidationInput,
  tier: ValidationTier,
): RawMaterialPrepValidationResult {
  const selections = input.premixNo
    ? input.addedPremixSelections.filter((e) => e.premix === input.premixNo)
    : input.addedPremixSelections;

  // UNIT (draft save): no required-field validation.
  if (tier === "UNIT") {
    return { premixFieldErrors: {}, weightmentErrors: {} };
  }

  const premixFieldErrors: Record<string, Record<string, string>> = {};

  if (tier === "SUBMIT") {
    const processErrors = validatePremixProcessSessions(input, "SUBMIT");
    for (const [key, errs] of Object.entries(processErrors)) {
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
  const deviationPath = weightmentDeviationMessagePath();
  const weightPaths = Object.keys(weightmentErrors)
    .filter((path) => path !== mixerPath && path !== deviationPath)
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

  if (weightmentErrors[deviationPath]) {
    return { premixNo, fieldPath: deviationPath };
  }

  return null;
}

/** Scroll + focus the control tagged with `data-rmp-field`. */
export function focusRmpField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("rmp-field", fieldPath, root);
}

export function isWeightmentSubmitComplete(sheet: RawMaterialPrepWeightmentSheet): boolean {
  return Boolean(str(sheet.mixerBuildingNumber));
}

export function getWeightmentIdentificationError(
  sheet: RawMaterialPrepWeightmentSheet,
  identificationMaterials: MaterialItem[],
  premixNo?: number | null,
): string | null {
  const scoped =
    premixNo != null && Number.isFinite(Number(premixNo)) && Number(premixNo) > 0
      ? (() => {
          const meta = resolveWeightmentPremixMeta(sheet, Number(premixNo));
          return {
            ...sheet,
            mixerBuildingNumber: meta.mixerBuildingNumber,
            validation: meta.validation,
            weightmentDetails: (sheet.weightmentDetails ?? []).filter((row) => {
              const rowPremix =
                row.premixNo == null || !Number.isFinite(Number(row.premixNo))
                  ? null
                  : Number(row.premixNo);
              return rowPremix === Number(premixNo);
            }),
          };
        })()
      : sheet;

  return validateWeightmentSheetAgainstIdentification(
    scoped.weightmentDetails,
    identificationMaterials,
    scoped.validation.compareWithIdentificationSheet === true,
    {
      materialNotInSheet: RM.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
      percentageMismatch: RM.WEIGHTMENT_PERCENTAGE_MISMATCH,
      weightMismatch: RM.WEIGHTMENT_WEIGHT_MISMATCH,
      deviationMessageRequired: RM.WEIGHTMENT_DEVIATION_MESSAGE_REQUIRED,
      incompleteRow: RM.WEIGHTMENT_INCOMPLETE_ROW,
    },
    scoped.validation,
  );
}
