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

export type QualityCheckParamForm = {
  parameterId: string;
  parameterName: string;
  specification: MasterDataReferenceRange;
  noOfSamples: number | "";
};

export type QualityCheckRecord = {
  id: string;
  mixType: string;
  motorStage: number;
  isActive: boolean;
  qualityChecks: QualityCheckParamForm[];
};

export type QualityCheckListPayload = {
  items: QualityCheckRecord[];
  stats: MasterDataStats;
};

export type QualityCheckFormState = {
  id: string | null;
  mixType: string;
  motorStage: number | "";
  isActive: boolean;
  qualityChecks: QualityCheckParamForm[];
};

export const emptyQualityCheckParam = (): QualityCheckParamForm => ({
  parameterId: "",
  parameterName: "",
  specification: emptyReferenceRange(),
  noOfSamples: "",
});

export const createEmptyQualityCheckForm = (): QualityCheckFormState => ({
  id: null,
  mixType: "",
  motorStage: "",
  isActive: true,
  qualityChecks: [],
});

const mapParam = (raw: any): QualityCheckParamForm => ({
  parameterId: String(raw?.parameterId ?? ""),
  parameterName: String(raw?.parameterName ?? ""),
  specification: parseReferenceRange(raw?.specification),
  noOfSamples: raw?.noOfSamples != null ? Number(raw.noOfSamples) : "",
});

export const QualityCheckRecordModel = {
  fromApi: (raw: any): QualityCheckRecord => ({
    id: String(raw?.id ?? ""),
    mixType: String(raw?.mixType ?? ""),
    motorStage: Number(raw?.motorStage ?? 0),
    isActive: raw?.isActive !== false,
    qualityChecks: Array.isArray(raw?.qualityChecks) ? raw.qualityChecks.map(mapParam) : [],
  }),
};

export const QualityCheckListModel = {
  fromApi: (res: any): QualityCheckListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(QualityCheckRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapQualityCheckRecordToForm = (record: QualityCheckRecord): QualityCheckFormState => ({
  id: record.id,
  mixType: record.mixType,
  motorStage: record.motorStage,
  isActive: record.isActive,
  qualityChecks: record.qualityChecks.map((p) => ({
    ...p,
    specification: { ...p.specification },
  })),
});

const serializeParam = (p: QualityCheckParamForm) => ({
  parameterId: p.parameterId.trim() || undefined,
  parameterName: p.parameterName.trim(),
  specification: serializeReferenceRange(p.specification),
  noOfSamples: p.noOfSamples === "" ? undefined : Number(p.noOfSamples),
});

export const buildQualityCheckCreatePayload = (form: QualityCheckFormState) => ({
  mixType: form.mixType.trim(),
  motorStage: Number(form.motorStage),
  isActive: form.isActive,
  qualityChecks: form.qualityChecks.map(serializeParam),
});

export const buildQualityCheckUpdatePayload = (form: QualityCheckFormState) => ({
  id: form.id,
  mixType: form.mixType.trim(),
  motorStage: Number(form.motorStage),
  isActive: form.isActive,
  qualityChecks: form.qualityChecks.map(serializeParam),
});

export const buildQualityCheckDeletePayload = (id: string) => ({ id });

export const validateQualityCheckForm = (form: QualityCheckFormState, isEdit: boolean): string | null => {
  if (!form.mixType.trim()) return "Mix type is required";
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    return "Motor stage is required";
  }
  if (form.qualityChecks.length === 0) return "Add at least one quality check parameter";
  for (const p of form.qualityChecks) {
    if (!p.parameterName.trim()) return "Parameter name is required";
  }
  return null;
};

export { emptyMasterDataStats };
