/**
 * QC Raw Material Processing validation — same UI gates as manufacturing RMP:
 * - DRAFT: no required-field block
 * - SUBMIT: lot details required per material + weighment (weighment stays in the hook)
 * - Live after submit attempt: clear/update lot errors as the user edits
 */
import type { MaterialItem } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import type { QcDivisionEntry } from "../../../data/models/user/QualityControlFormModel";
import {
  hydratePremixProcessSlot,
  type RawMaterialPrepMaterialProcessSlot,
} from "../../../data/models/user/RawMaterialPreparationModel";
import { rmpUiKeyShowsProcessPanel } from "../../../data/models/user/rmp/rmpMaterialUiRegistry";
import {
  firstRmpValidationErrorMessage,
  validateRmpPremixSlotLive,
  type AddedPremixSelection,
  type RmpValidationAttemptFlags,
} from "../../../data/validation/adapters/rawMaterialPreparation.validation";
import type { ValidationErrors } from "../../../data/validation/submissionIntent";

const str = (value: unknown) => (value == null ? "" : String(value)).trim();

export type QcProcessingValidationFocus = {
  entryId: string;
  fieldPath: string;
};

export const quantityPerPremixForMaterial = (
  materials: MaterialItem[] | null | undefined,
  materialCode: string | null | undefined,
): number => {
  const code = str(materialCode).toUpperCase();
  if (!code) return 0;
  const match = (materials ?? []).find(
    (row) => str(row.materialCode).toUpperCase() === code,
  );
  const qty = Number(match?.quantityPerPremix ?? 0);
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
};

export const lotOptionsForMaterial = (
  materials: MaterialItem[] | null | undefined,
  materialCode: string | null | undefined,
  fallbackLotIds: string[] = [],
): string[] => {
  const code = str(materialCode).toUpperCase();
  const fromSheet =
    code.length > 0
      ? (materials ?? [])
          .filter((row) => str(row.materialCode).toUpperCase() === code)
          .flatMap((row) => {
            const ids = (row.lotIds ?? []).map((lotId) => str(lotId)).filter(Boolean);
            const single = str((row as { lotId?: unknown }).lotId);
            return single ? [...ids, single] : ids;
          })
      : [];
  const merged = [...fromSheet, ...fallbackLotIds.map(str).filter(Boolean)];
  return Array.from(new Set(merged));
};

export const buildSelectionFromProcessingEntry = (
  entry: QcDivisionEntry,
  quantityPerPremix = 0,
): AddedPremixSelection => {
  const code = str(entry.materialCode);
  const premix = Number(entry.premixNo);
  const isLiquid = entry.processSlot === "liquid";
  const gradeCode = str(entry.gradeCode) || undefined;
  const rmpFormTemplate =
    str(entry.rmpFormTemplate).toUpperCase() || undefined;
  return {
    premix: Number.isFinite(premix) && premix > 0 ? premix : 0,
    materialKey: code || entry.entryId,
    solidMaterialCode: isLiquid ? undefined : code,
    liquidMaterialCode: isLiquid ? code : undefined,
    solidGradeCode: isLiquid ? undefined : gradeCode,
    liquidGradeCode: isLiquid ? gradeCode : undefined,
    solidRmpFormTemplate: isLiquid ? undefined : rmpFormTemplate,
    liquidRmpFormTemplate: isLiquid ? rmpFormTemplate : undefined,
    quantityPerPremix: quantityPerPremix > 0 ? quantityPerPremix : undefined,
    selectedProcesses: { solid: !isLiquid, liquid: isLiquid },
  };
};

export const hydrateProcessSlotFromProcessingEntry = (
  entry: QcDivisionEntry,
): RawMaterialPrepMaterialProcessSlot | null => {
  const materialCode = str(entry.savedProcess?.materialCode ?? entry.materialCode);
  if (!materialCode) return null;
  const slot = entry.processSlot === "liquid" ? "liquid" : "solid";
  const gradeCode = str(entry.savedProcess?.gradeCode ?? entry.gradeCode) || undefined;
  const rmpFormTemplate =
    str(entry.rmpFormTemplate).toUpperCase() || "DEFAULT";
  const fallbackProcess = {
    materialId: Number(entry.savedProcess?.materialId ?? entry.materialId ?? 0),
    materialCode,
    materialName:
      str(entry.savedProcess?.materialName ?? entry.materialName ?? materialCode) ||
      materialCode,
    gradeId: entry.savedProcess?.gradeId ?? entry.gradeId ?? null,
    gradeCode: gradeCode ?? null,
    lotDetails: entry.savedProcess?.lotDetails ?? [],
    drying: entry.savedProcess?.drying ?? null,
    sieving: entry.savedProcess?.sieving ?? null,
    apCoarse: entry.savedProcess?.apCoarse ?? null,
    apFine: entry.savedProcess?.apFine ?? null,
    apUltraFine: entry.savedProcess?.apUltraFine ?? null,
    aluminum: entry.savedProcess?.aluminum ?? null,
    doa: entry.savedProcess?.doa ?? null,
    processType: entry.savedProcess?.processType,
    sections: entry.savedProcess?.sections?.length
      ? entry.savedProcess.sections
      : entry.savedSections,
  };
  const hydrated = hydratePremixProcessSlot(
    slot,
    materialCode,
    entry.savedProcess ?? fallbackProcess,
    gradeCode,
    rmpFormTemplate,
  );
  if (!hydrated || !rmpUiKeyShowsProcessPanel(hydrated.uiKey)) return null;
  return hydrated;
};

/** Live / submit lot validation for one QC processing material entry (RMP parity). */
export const validateQcProcessingEntryProcess = (
  entry: QcDivisionEntry,
  attempt: Pick<RmpValidationAttemptFlags, "submit" | "unit">,
  identificationMaterials?: MaterialItem[] | null,
  slotOverride?: RawMaterialPrepMaterialProcessSlot | null,
): Record<string, string> => {
  if (entry.kind !== "PROCESSING_MATERIAL" || !entry.schemaUnavailable) return {};
  const slotState = slotOverride ?? hydrateProcessSlotFromProcessingEntry(entry);
  if (!slotState) return {};
  const qty = quantityPerPremixForMaterial(identificationMaterials, entry.materialCode);
  const selection = buildSelectionFromProcessingEntry(entry, qty);
  const processSlot = entry.processSlot === "liquid" ? "liquid" : "solid";
  return validateRmpPremixSlotLive({
    selection,
    slot: processSlot,
    processForm: slotState.processForm,
    attempt,
    gradeCode: str(entry.gradeCode) || undefined,
  });
};

/** SUBMIT gate: lot errors keyed by entryId. */
export const validateQcProcessingEntriesForSubmit = (
  entries: QcDivisionEntry[],
  identificationMaterials?: MaterialItem[] | null,
): Record<string, Record<string, string>> => {
  const errorsByEntryId: Record<string, Record<string, string>> = {};
  for (const entry of entries) {
    if (entry.kind !== "PROCESSING_MATERIAL" || !entry.schemaUnavailable) continue;
    const errs = validateQcProcessingEntryProcess(
      entry,
      { submit: true, unit: false },
      identificationMaterials,
    );
    if (Object.keys(errs).length > 0) {
      errorsByEntryId[entry.entryId] = errs;
    }
  }
  return errorsByEntryId;
};

export const resolveFirstQcProcessingFocus = (
  errorsByEntryId: Record<string, Record<string, string>>,
  entries: QcDivisionEntry[],
): QcProcessingValidationFocus | null => {
  for (const entry of entries) {
    const errs = errorsByEntryId[entry.entryId];
    if (!errs || !Object.keys(errs).length) continue;
    const fieldPath =
      Object.keys(errs)
        .filter((key) => key.startsWith("lotDetails."))
        .sort()[0] ?? Object.keys(errs).sort()[0];
    if (!fieldPath) continue;
    return { entryId: entry.entryId, fieldPath };
  }
  return null;
};

export const firstQcProcessingValidationMessage = (
  processErrorsByEntryId: Record<string, Record<string, string>>,
  weightmentErrors: ValidationErrors,
): string | undefined =>
  firstRmpValidationErrorMessage(processErrorsByEntryId, weightmentErrors);
