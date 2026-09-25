/** Nested master-data types that use dedicated panels instead of flat MasterDataList. */
export const NESTED_MASTER_DATA_TYPES = [
  "materials",
  "insulation-specifications",
  "dimensional-parameters",
  "mixing-cycles",
  "curing-cycles",
] as const;

/** Master types hidden from admin Master Data Management UI. */
export const EXCLUDED_MASTER_DATA_TYPES = ["qc-divisions", "quality-checks"] as const;

export type NestedMasterDataType = (typeof NESTED_MASTER_DATA_TYPES)[number];

export const isNestedMasterDataType = (type: string): type is NestedMasterDataType =>
  (NESTED_MASTER_DATA_TYPES as readonly string[]).includes(type);

export type MasterDataReferenceRange = {
  minValue: number | null;
  maxValue: number | null;
  unitId: number | null;
  unit: string;
};

export const emptyReferenceRange = (): MasterDataReferenceRange => ({
  minValue: null,
  maxValue: null,
  unitId: null,
  unit: "",
});

export const parseReferenceRange = (raw: any): MasterDataReferenceRange => ({
  minValue: raw?.minValue == null || raw?.minValue === "" ? null : Number(raw.minValue),
  maxValue: raw?.maxValue == null || raw?.maxValue === "" ? null : Number(raw.maxValue),
  unitId: raw?.unitId == null || raw?.unitId === "" ? null : Number(raw.unitId),
  unit: String(raw?.unit ?? ""),
});

export const formatMasterDataReferenceRangeLabel = (
  range: MasterDataReferenceRange | null | undefined,
): string => {
  if (!range) return "N/A";
  const unitSuffix = range.unit ? ` ${range.unit}` : "";
  if (range.minValue != null && range.maxValue != null) {
    return `${range.minValue} - ${range.maxValue}${unitSuffix}`;
  }
  if (range.minValue != null) {
    return `>= ${range.minValue}${unitSuffix}`;
  }
  if (range.maxValue != null) {
    return `<= ${range.maxValue}${unitSuffix}`;
  }
  return unitSuffix.trim() || "N/A";
};

export const serializeReferenceRange = (range: MasterDataReferenceRange | null | undefined) => {
  if (!range) return null;
  const hasAny =
    range.minValue != null ||
    range.maxValue != null ||
    range.unitId != null ||
    String(range.unit ?? "").trim() !== "";
  if (!hasAny) return null;
  const payload: Record<string, unknown> = {
    minValue: range.minValue,
    maxValue: range.maxValue,
  };
  // Always persist display unit when known. unitId alone is ignored by specs that only store `unit`.
  if (String(range.unit ?? "").trim()) {
    payload.unit = String(range.unit).trim();
  }
  if (range.unitId != null) {
    payload.unitId = range.unitId;
  }
  return payload;
};
