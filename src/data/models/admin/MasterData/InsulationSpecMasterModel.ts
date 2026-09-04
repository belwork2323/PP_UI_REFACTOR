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

export type InsulationTypeValue = "ROCASIN" | "EPDM" | string;

export type InsulationParameterForm = {
  specificationCode: string;
  specificationName: string;
  referenceRange: MasterDataReferenceRange;
};

export type InsulationCategoryForm = {
  category: string;
  parameters: InsulationParameterForm[];
};

export type InsulationSpecRecord = {
  id: string;
  insulationType: InsulationTypeValue;
  isActive: boolean;
  specifications: InsulationCategoryForm[];
};

export type InsulationSpecListPayload = {
  items: InsulationSpecRecord[];
  stats: MasterDataStats;
};

export type InsulationSpecFormState = {
  id: string | null;
  insulationType: InsulationTypeValue;
  isActive: boolean;
  specifications: InsulationCategoryForm[];
};

export const emptyInsulationParameter = (): InsulationParameterForm => ({
  specificationCode: "",
  specificationName: "",
  referenceRange: emptyReferenceRange(),
});

export const emptyInsulationCategory = (): InsulationCategoryForm => ({
  category: "",
  parameters: [],
});

export const createEmptyInsulationForm = (): InsulationSpecFormState => ({
  id: null,
  insulationType: "",
  isActive: true,
  specifications: [],
});

const mapParameter = (raw: any): InsulationParameterForm => ({
  specificationCode: String(raw?.specificationCode ?? ""),
  specificationName: String(raw?.specificationName ?? ""),
  referenceRange: parseReferenceRange(raw?.referenceRange),
});

const mapCategory = (raw: any): InsulationCategoryForm => ({
  category: String(raw?.category ?? ""),
  parameters: Array.isArray(raw?.parameters) ? raw.parameters.map(mapParameter) : [],
});

export const InsulationSpecRecordModel = {
  fromApi: (raw: any): InsulationSpecRecord => ({
    id: String(raw?.id ?? raw?.insulationType ?? ""),
    insulationType: String(raw?.insulationType ?? ""),
    isActive: raw?.isActive !== false,
    specifications: Array.isArray(raw?.specifications) ? raw.specifications.map(mapCategory) : [],
  }),
};

export const InsulationSpecListModel = {
  fromApi: (res: any): InsulationSpecListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(InsulationSpecRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapInsulationRecordToForm = (record: InsulationSpecRecord): InsulationSpecFormState => ({
  id: record.id,
  insulationType: record.insulationType,
  isActive: record.isActive,
  specifications: record.specifications.map((c) => ({
    category: c.category,
    parameters: c.parameters.map((p) => ({
      ...p,
      referenceRange: { ...p.referenceRange },
    })),
  })),
});

const serializeParameter = (p: InsulationParameterForm) => ({
  specificationCode: p.specificationCode.trim(),
  specificationName: p.specificationName.trim(),
  referenceRange: serializeReferenceRange(p.referenceRange),
});

const serializeCategory = (c: InsulationCategoryForm) => ({
  category: c.category.trim(),
  parameters: (c.parameters ?? []).map(serializeParameter),
});

export const buildInsulationCreatePayload = (form: InsulationSpecFormState) => ({
  insulationType: form.insulationType,
  isActive: form.isActive,
  specifications: form.specifications.map(serializeCategory),
});

export const buildInsulationUpdatePayload = (form: InsulationSpecFormState) => ({
  id: form.id,
  insulationType: form.insulationType,
  isActive: form.isActive,
  specifications: form.specifications.map(serializeCategory),
});

export const buildInsulationDeletePayload = (id: string, insulationType?: string) => ({
  id,
  insulationType,
});

export const validateInsulationForm = (form: InsulationSpecFormState, _isEdit: boolean): string | null => {
  if (!form.insulationType) return "Insulation type is required";
  if (form.specifications.length === 0) return "Add at least one category";
  for (const c of form.specifications) {
    if (!c.category.trim()) return "Category name is required";
    if (c.parameters.length === 0) return `Category "${c.category}" needs at least one parameter`;
    for (const p of c.parameters) {
      if (!p.specificationCode.trim()) return "Parameter code is required";
      if (!p.specificationName.trim()) return "Parameter name is required";
    }
  }
  return null;
};

export { emptyMasterDataStats };
