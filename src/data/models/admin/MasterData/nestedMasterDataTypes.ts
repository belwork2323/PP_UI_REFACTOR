import {
  masterDataNumericFieldHasValue,
  parseMasterDataOptionalNumber,
} from "@data/models/admin/MasterData/masterDataNumericInput";

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
  /** Raw decimal text while editing; parsed only on save/validation */
  minValue: string;
  maxValue: string;
  unitId: number | null;
  unit: string;
};

export const emptyReferenceRange = (): MasterDataReferenceRange => ({
  minValue: "",
  maxValue: "",
  unitId: null,
  unit: "",
});

const toRangeInputString = (raw: unknown): string => {
  if (raw == null || raw === "") return "";
  return String(raw);
};

export const parseReferenceRange = (raw: any): MasterDataReferenceRange => ({
  minValue: toRangeInputString(raw?.minValue),
  maxValue: toRangeInputString(raw?.maxValue),
  unitId: raw?.unitId == null || raw?.unitId === "" ? null : Number(raw.unitId),
  unit: String(raw?.unit ?? ""),
});

export const formatMasterDataReferenceRangeLabel = (
  range: MasterDataReferenceRange | null | undefined,
): string => {
  if (!range) return "N/A";
  const unitSuffix = range.unit ? ` ${range.unit}` : "";
  const min = range.minValue.trim();
  const max = range.maxValue.trim();
  if (min && max) {
    return `${min} - ${max}${unitSuffix}`;
  }
  if (min) {
    return `>= ${min}${unitSuffix}`;
  }
  if (max) {
    return `<= ${max}${unitSuffix}`;
  }
  return unitSuffix.trim() || "N/A";
};

export const serializeReferenceRange = (range: MasterDataReferenceRange | null | undefined) => {
  if (!range) return null;
  const minNum = parseMasterDataOptionalNumber(range.minValue);
  const maxNum = parseMasterDataOptionalNumber(range.maxValue);
  const hasAny =
    minNum != null ||
    maxNum != null ||
    range.unitId != null ||
    String(range.unit ?? "").trim() !== "" ||
    masterDataNumericFieldHasValue(range.minValue) ||
    masterDataNumericFieldHasValue(range.maxValue);
  if (!hasAny) return null;
  const payload: Record<string, unknown> = {};
  if (minNum != null) payload.minValue = minNum;
  if (maxNum != null) payload.maxValue = maxNum;
  if (String(range.unit ?? "").trim()) {
    payload.unit = String(range.unit).trim();
  }
  if (range.unitId != null) {
    payload.unitId = range.unitId;
  }
  return payload;
};
