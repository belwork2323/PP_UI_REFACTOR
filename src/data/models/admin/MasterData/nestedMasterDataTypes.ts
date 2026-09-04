/** Nested master-data types that use dedicated panels instead of flat MasterDataList. */
export const NESTED_MASTER_DATA_TYPES = [
  "materials",
  "insulation-specifications",
  "mixing-cycles",
  "curing-cycles",
  "quality-checks",
  "qc-divisions",
] as const;

export type NestedMasterDataType = (typeof NESTED_MASTER_DATA_TYPES)[number];

export const isNestedMasterDataType = (type: string): type is NestedMasterDataType =>
  (NESTED_MASTER_DATA_TYPES as readonly string[]).includes(type);

export type MasterDataReferenceRange = {
  minValue: number | null;
  maxValue: number | null;
  unit: string;
};

export const emptyReferenceRange = (): MasterDataReferenceRange => ({
  minValue: null,
  maxValue: null,
  unit: "",
});

export const parseReferenceRange = (raw: any): MasterDataReferenceRange => ({
  minValue: raw?.minValue == null || raw?.minValue === "" ? null : Number(raw.minValue),
  maxValue: raw?.maxValue == null || raw?.maxValue === "" ? null : Number(raw.maxValue),
  unit: String(raw?.unit ?? ""),
});

export const serializeReferenceRange = (range: MasterDataReferenceRange | null | undefined) => {
  if (!range) return null;
  const hasAny =
    range.minValue != null || range.maxValue != null || String(range.unit ?? "").trim() !== "";
  if (!hasAny) return null;
  return {
    minValue: range.minValue,
    maxValue: range.maxValue,
    unit: String(range.unit ?? "").trim() || null,
  };
};
