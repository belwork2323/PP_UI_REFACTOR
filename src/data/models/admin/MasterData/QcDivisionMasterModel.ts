import {
  emptyMasterDataStats,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";

export type QcDivisionTypeForm = {
  divisionId: number | null;
  divisionName: string;
  displayOrder: number | "";
  isActive: boolean;
};

export type QcDivisionRecord = {
  id: string;
  divisionId: number;
  divisionName: string;
  displayOrder: number;
  isActive: boolean;
  types: QcDivisionTypeForm[];
};

export type QcDivisionListPayload = {
  items: QcDivisionRecord[];
  stats: MasterDataStats;
};

export type QcDivisionFormState = {
  id: string | null;
  divisionId: number | null;
  divisionName: string;
  displayOrder: number | "";
  isActive: boolean;
  types: QcDivisionTypeForm[];
};

export const emptyQcDivisionType = (): QcDivisionTypeForm => ({
  divisionId: null,
  divisionName: "",
  displayOrder: "",
  isActive: true,
});

export const createEmptyQcDivisionForm = (): QcDivisionFormState => ({
  id: null,
  divisionId: null,
  divisionName: "",
  displayOrder: "",
  isActive: true,
  types: [],
});

const mapType = (raw: any): QcDivisionTypeForm => ({
  divisionId: raw?.divisionId != null ? Number(raw.divisionId) : null,
  divisionName: String(raw?.divisionName ?? ""),
  displayOrder: raw?.displayOrder != null ? Number(raw.displayOrder) : "",
  isActive: raw?.isActive !== false,
});

export const QcDivisionRecordModel = {
  fromApi: (raw: any): QcDivisionRecord => ({
    id: String(raw?.id ?? ""),
    divisionId: Number(raw?.divisionId ?? 0),
    divisionName: String(raw?.divisionName ?? ""),
    displayOrder: Number(raw?.displayOrder ?? 0),
    isActive: raw?.isActive !== false,
    types: Array.isArray(raw?.types) ? raw.types.map(mapType) : [],
  }),
};

export const QcDivisionListModel = {
  fromApi: (res: any): QcDivisionListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(QcDivisionRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapQcDivisionRecordToForm = (record: QcDivisionRecord): QcDivisionFormState => ({
  id: record.id,
  divisionId: record.divisionId,
  divisionName: record.divisionName,
  displayOrder: record.displayOrder,
  isActive: record.isActive,
  types: record.types.map((t) => ({ ...t })),
});

const serializeType = (t: QcDivisionTypeForm) => ({
  divisionId: t.divisionId ?? undefined,
  divisionName: t.divisionName.trim(),
  displayOrder: t.displayOrder === "" ? undefined : Number(t.displayOrder),
  isActive: t.isActive,
});

export const buildQcDivisionCreatePayload = (form: QcDivisionFormState) => ({
  divisionId: form.divisionId ?? undefined,
  divisionName: form.divisionName.trim(),
  displayOrder: form.displayOrder === "" ? undefined : Number(form.displayOrder),
  isActive: form.isActive,
  types: form.types.map(serializeType),
});

export const buildQcDivisionUpdatePayload = (form: QcDivisionFormState) => ({
  id: form.id,
  divisionId: form.divisionId ?? undefined,
  divisionName: form.divisionName.trim(),
  displayOrder: form.displayOrder === "" ? undefined : Number(form.displayOrder),
  isActive: form.isActive,
  types: form.types.map(serializeType),
});

export const buildQcDivisionDeletePayload = (id: string) => ({ id });

export const validateQcDivisionForm = (form: QcDivisionFormState): string | null => {
  if (!form.divisionName.trim()) return "Division name is required";
  for (const t of form.types) {
    if (!t.divisionName.trim()) return "Subtype name is required";
  }
  return null;
};

export { emptyMasterDataStats };
