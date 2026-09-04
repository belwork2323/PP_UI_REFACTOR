import {
  emptyMasterDataStats,
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

export type MaterialsMasterRecord = {
  materialId: number;
  materialCode: string;
  materialName: string;
  materialType: MaterialTypeValue;
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
    materialId: Number(raw?.materialId),
    materialCode: String(raw?.materialCode ?? ""),
    materialName: String(raw?.materialName ?? ""),
    materialType: String(raw?.materialType ?? "SOLID").toUpperCase() === "LIQUID" ? "LIQUID" : "SOLID",
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

const serializeSpec = (s: MaterialSpecForm) => ({
  specificationCode: s.specificationCode.trim(),
  specificationName: s.specificationName.trim(),
  referenceRange: serializeReferenceRange(s.referenceRange),
});

const serializeGrade = (g: MaterialGradeForm) => ({
  gradeId: g.gradeId.trim() || undefined,
  gradeCode: g.gradeCode.trim(),
  gradeName: g.gradeName.trim(),
  specifications: (g.specifications ?? []).map(serializeSpec),
});

export const buildMaterialsCreatePayload = (form: MaterialsMasterFormState) => ({
  materialCode: form.materialCode.trim(),
  materialName: form.materialName.trim(),
  materialType: form.materialType,
  isActive: form.isActive,
  grades: form.grades.map(serializeGrade),
  specifications: form.specifications.map(serializeSpec),
});

export const buildMaterialsUpdatePayload = (form: MaterialsMasterFormState) => ({
  materialId: form.materialId,
  materialCode: form.materialCode.trim(),
  materialName: form.materialName.trim(),
  materialType: form.materialType,
  isActive: form.isActive,
  grades: form.grades.map(serializeGrade),
  specifications: form.specifications.map(serializeSpec),
});

export const buildMaterialsDeletePayload = (materialId: number) => ({ materialId });

export const validateMaterialsForm = (form: MaterialsMasterFormState, isEdit: boolean): string | null => {
  if (!isEdit) {
    const code = form.materialCode.trim();
    if (!code) return "Material code is required";
    if (!MASTER_DATA_CODE_PATTERN.test(code)) return MASTER_DATA_CODE_FORMAT_MESSAGE;
  }
  if (!form.materialName.trim()) return "Material name is required";
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
      if (!s.specificationCode.trim()) return "Specification code is required";
      if (!s.specificationName.trim()) return "Specification name is required";
    }
  }
  for (const s of form.specifications) {
    if (!s.specificationCode.trim()) return "Specification code is required";
    if (!s.specificationName.trim()) return "Specification name is required";
  }
  return null;
};

export { emptyMasterDataStats };
