import type { MaterialBlock, MaterialFormGroup, MaterialLotBlock, SpecRow } from "./RawMaterialProcurementModel";

export type MaterialMetaFieldErrors = {
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
};

export type LotFieldErrors = {
  lotNo?: string;
};

export type MandatoryValidationMessages = {
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  lotNo: string;
};

export function getMaterialMetaErrors(
  meta: { supplyOrderNo?: string; receiptDate?: string; manufacturerName?: string },
  messages: MandatoryValidationMessages,
  show: boolean
): MaterialMetaFieldErrors {
  if (!show) return {};
  const errors: MaterialMetaFieldErrors = {};
  if (!String(meta.supplyOrderNo ?? "").trim()) errors.supplyOrderNo = messages.supplyOrderNo;
  if (!String(meta.receiptDate ?? "").trim()) errors.receiptDate = messages.receiptDate;
  if (!String(meta.manufacturerName ?? "").trim()) errors.manufacturerName = messages.manufacturerName;
  return errors;
}

export function getLotFieldErrors(
  lot: Pick<MaterialLotBlock, "lotNo">,
  messages: MandatoryValidationMessages,
  show: boolean
): LotFieldErrors {
  if (!show) return {};
  if (!String(lot.lotNo ?? "").trim()) return { lotNo: messages.lotNo };
  return {};
}

export function isMaterialMetaComplete(meta: {
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
}): boolean {
  return (
    Boolean(String(meta.supplyOrderNo ?? "").trim()) &&
    Boolean(String(meta.receiptDate ?? "").trim()) &&
    Boolean(String(meta.manufacturerName ?? "").trim())
  );
}

export function isLotMandatoryComplete(lot: Pick<MaterialLotBlock, "lotNo">): boolean {
  return Boolean(String(lot.lotNo ?? "").trim());
}

export function isMaterialGroupMandatoryComplete(group: MaterialFormGroup): boolean {
  if (!isMaterialMetaComplete(group)) return false;
  return (group.lots ?? []).every(isLotMandatoryComplete);
}

export function isBlockMandatoryComplete(block: MaterialBlock): boolean {
  return isMaterialMetaComplete(block) && isLotMandatoryComplete(block);
}

export function areMaterialGroupsMandatoryComplete(groups: MaterialFormGroup[]): boolean {
  if (!groups.length) return false;
  return groups.every(isMaterialGroupMandatoryComplete);
}

export function areBlocksMandatoryComplete(blocks: MaterialBlock[]): boolean {
  if (!blocks.length) return false;
  return blocks.every(isBlockMandatoryComplete);
}

/** Every specification row must have an analyzed result. */
export function areAllAnalyzedResultsFilled(blocks: MaterialBlock[]): boolean {
  const rows = (blocks ?? []).flatMap((b) => b.rows ?? []);
  if (!rows.length) return false;
  return rows.every((row) => String(row.analysedResult ?? "").trim() !== "");
}

export function isAnalyzedResultMissing(row: Pick<SpecRow, "analysedResult">, showErrors: boolean): boolean {
  return showErrors && !String(row.analysedResult ?? "").trim();
}
