import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  emptyReferenceRange,
  parseReferenceRange,
  serializeReferenceRange,
  type MasterDataReferenceRange,
} from "@data/models/admin/MasterData/nestedMasterDataTypes";
import { MASTER_DATA_CODE_PATTERN, MASTER_DATA_CODE_FORMAT_MESSAGE } from "@data/models/admin/MasterData/MasterDataModel";

export type MaterialTypeValue = "SOLID" | "LIQUID";

export type RawMaterialTypeValue = "NORMAL" | "ACEM";

export type PreparationTypeValue =
  | "ADDUCT"
  | "HTPB Blending"
  | "AP Fine"
  | "AP ultrafine";

export const RAW_MATERIAL_TYPE_OPTIONS: { value: RawMaterialTypeValue; label: string }[] = [
  { value: "NORMAL", label: "Non ACEM" },
  { value: "ACEM", label: "ACEM materials" },
];

export const getRawMaterialCategoryLabel = (type: RawMaterialTypeValue): string =>
  type === "ACEM" ? "ACEM materials" : "Non ACEM";

export const PREPARATION_TYPE_OPTIONS: { value: PreparationTypeValue; label: string }[] = [
  { value: "ADDUCT", label: "ADDUCT" },
  { value: "HTPB Blending", label: "HTPB Blending" },
  { value: "AP Fine", label: "AP Fine" },
  { value: "AP ultrafine", label: "AP ultrafine" },
];

const PREPARATION_TYPE_VALUES = new Set<string>(PREPARATION_TYPE_OPTIONS.map((o) => o.value));

export const parseRawMaterialType = (raw: unknown): RawMaterialTypeValue => {
  const value = String(raw ?? "NORMAL").trim().toUpperCase();
  return value === "ACEM" ? "ACEM" : "NORMAL";
};

export const parsePreparationType = (raw: unknown): PreparationTypeValue | "" => {
  const value = String(raw ?? "").trim();
  if (PREPARATION_TYPE_VALUES.has(value)) return value as PreparationTypeValue;
  return "";
};

export type MaterialSpecForm = {
  specificationCode: string;
  specificationName: string;
  referenceRange: MasterDataReferenceRange;
};

export type MaterialGradeForm = {
  gradeId: string;
  gradeCode: string;
  gradeName: string;
  specifications: MaterialSpecForm[];
};

export type MaterialsMasterRecord = MasterDataAuditFields & {
  materialId: number;
  materialCode: string;
  materialName: string;
  materialType: MaterialTypeValue;
  rawMaterialType: RawMaterialTypeValue;
  preparationType: PreparationTypeValue | "";
  isActive: boolean;
  grades: MaterialGradeForm[];
  specifications: MaterialSpecForm[];
};

export type MaterialsMasterListPayload = {
  items: MaterialsMasterRecord[];
  stats: MasterDataStats;
};

export type MaterialsMasterFormState = {
  materialId: number | null;
  materialCode: string;
  materialName: string;
  materialType: MaterialTypeValue;
  rawMaterialType: RawMaterialTypeValue | "";
  preparationType: PreparationTypeValue | "";
  isActive: boolean;
  grades: MaterialGradeForm[];
  specifications: MaterialSpecForm[];
};

export const emptyMaterialSpec = (): MaterialSpecForm => ({
  specificationCode: "",
  specificationName: "",
  referenceRange: emptyReferenceRange(),
});

export const emptyMaterialGrade = (): MaterialGradeForm => ({
  gradeId: "",
  gradeCode: "",
  gradeName: "",
  specifications: [],
});

export const createEmptyMaterialsForm = (): MaterialsMasterFormState => ({
  materialId: null,
  materialCode: "",
  materialName: "",
  materialType: "SOLID",
  rawMaterialType: "",
  preparationType: "",
  isActive: true,
  grades: [],
  specifications: [],
});

const mapSpec = (raw: any): MaterialSpecForm => ({
  specificationCode: String(raw?.specificationCode ?? ""),
  specificationName: String(raw?.specificationName ?? ""),
  referenceRange: parseReferenceRange(raw?.referenceRange),
});

const mapGrade = (raw: any): MaterialGradeForm => ({
  gradeId: String(raw?.gradeId ?? ""),
  gradeCode: String(raw?.gradeCode ?? ""),
  gradeName: String(raw?.gradeName ?? ""),
  specifications: Array.isArray(raw?.specifications) ? raw.specifications.map(mapSpec) : [],
});

export const MaterialsMasterRecordModel = {
  fromApi: (raw: any): MaterialsMasterRecord => ({
    ...parseMasterDataAuditFields(raw),
    materialId: Number(raw?.materialId),
    materialCode: String(raw?.materialCode ?? ""),
    materialName: String(raw?.materialName ?? ""),
    materialType: String(raw?.materialType ?? "SOLID").toUpperCase() === "LIQUID" ? "LIQUID" : "SOLID",
    rawMaterialType: parseRawMaterialType(raw?.rawMaterialType),
    preparationType: parsePreparationType(raw?.preparationType),
    isActive: raw?.isActive !== false,
    grades: Array.isArray(raw?.grades) ? raw.grades.map(mapGrade) : [],
    specifications: Array.isArray(raw?.specifications) ? raw.specifications.map(mapSpec) : [],
  }),
};

export const MaterialsMasterListModel = {
  fromApi: (res: any): MaterialsMasterListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(MaterialsMasterRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapMaterialRecordToForm = (record: MaterialsMasterRecord): MaterialsMasterFormState => ({
  materialId: record.materialId,
  materialCode: record.materialCode,
  materialName: record.materialName,
  materialType: record.materialType,
  rawMaterialType: record.rawMaterialType,
  preparationType: record.preparationType,
  isActive: record.isActive,
  grades: record.grades.map((g) => ({
    ...g,
    specifications: g.specifications.map((s) => ({
      ...s,
      referenceRange: { ...s.referenceRange },
    })),
  })),
  specifications: record.specifications.map((s) => ({
    ...s,
    referenceRange: { ...s.referenceRange },
  })),
});

const validateSpecReferenceRange = (range: MaterialSpecForm["referenceRange"]): string | null => {
  const hasRange = range.minValue != null || range.maxValue != null;
  if (hasRange && range.unitId == null && !String(range.unit ?? "").trim()) {
    return "Unit is required when min or max is provided";
  }
  return null;
};

const serializeSpec = (s: MaterialSpecForm, isEdit: boolean) => {
  const payload: Record<string, unknown> = {
    specificationName: s.specificationName.trim(),
    referenceRange: serializeReferenceRange(s.referenceRange),
  };
  const code = s.specificationCode.trim();
  if (isEdit || code) {
    payload.specificationCode = code;
  }
  return payload;
};

const serializeGrade = (g: MaterialGradeForm, isEdit: boolean) => ({
  gradeId: g.gradeId.trim() || undefined,
  gradeCode: g.gradeCode.trim(),
  gradeName: g.gradeName.trim(),
  specifications: (g.specifications ?? []).map((s) => serializeSpec(s, isEdit)),
});

const buildMaterialsPayloadBody = (form: MaterialsMasterFormState, isEdit: boolean) => {
  const rawMaterialType = form.rawMaterialType === "ACEM" ? "ACEM" : "NORMAL";
  const body: Record<string, unknown> = {
    materialCode: form.materialCode.trim(),
    materialName: form.materialName.trim(),
    materialType: form.materialType,
    rawMaterialType,
    isActive: form.isActive,
    grades: form.grades.map((g) => serializeGrade(g, isEdit)),
    specifications: form.specifications.map((s) => serializeSpec(s, isEdit)),
  };
  if (rawMaterialType === "ACEM") {
    body.preparationType = form.preparationType;
  }
  return body;
};

export const buildMaterialsCreatePayload = (form: MaterialsMasterFormState) =>
  buildMaterialsPayloadBody(form, false);

export const buildMaterialsUpdatePayload = (form: MaterialsMasterFormState) => ({
  materialId: form.materialId,
  ...buildMaterialsPayloadBody(form, true),
});

export const buildMaterialsDeletePayload = (materialId: number) => ({ materialId });

export const validateMaterialsForm = (form: MaterialsMasterFormState, isEdit: boolean): string | null => {
  if (!isEdit) {
    const code = form.materialCode.trim();
    if (!code) return "Material code is required";
    if (!MASTER_DATA_CODE_PATTERN.test(code)) return MASTER_DATA_CODE_FORMAT_MESSAGE;
  }
  if (!form.materialName.trim()) return "Material name is required";
  if (form.rawMaterialType !== "NORMAL" && form.rawMaterialType !== "ACEM") {
    return "Category is required";
  }
  if (form.rawMaterialType === "ACEM") {
    if (!form.preparationType || !PREPARATION_TYPE_VALUES.has(form.preparationType)) {
      return "Preparation type is required for ACEM raw materials";
    }
  }
  if (form.materialType !== "SOLID" && form.materialType !== "LIQUID") {
    return "Material type must be SOLID or LIQUID";
  }
  if (form.grades.length === 0 && form.specifications.length === 0) {
    return "Add at least one grade or top-level specification";
  }
  for (const g of form.grades) {
    if (!g.gradeCode.trim()) return "Grade code is required";
    if (!g.gradeName.trim()) return "Grade name is required";
    for (const s of g.specifications) {
      if (!s.specificationName.trim()) return "Specification name is required";
      const rangeErr = validateSpecReferenceRange(s.referenceRange);
      if (rangeErr) return rangeErr;
    }
  }
  for (const s of form.specifications) {
    if (!s.specificationName.trim()) return "Specification name is required";
    const rangeErr = validateSpecReferenceRange(s.referenceRange);
    if (rangeErr) return rangeErr;
  }
  return null;
};

export { emptyMasterDataStats };
