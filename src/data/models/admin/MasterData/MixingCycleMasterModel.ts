import {
  emptyMasterDataStats,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";

export type MixingOperationForm = {
  operationId: number | null;
  sequenceNo: number | null;
  operationName: string;
};

export type MixingCycleGroupForm = {
  premixOperations: MixingOperationForm[];
  finalMixOperations: MixingOperationForm[];
};

export type MixingCycleRecord = {
  id: number;
  mixingCycleCode: string;
  mixingCycleName: string;
  description: string;
  motorStage: number;
  isActive: boolean;
  cycles: MixingCycleGroupForm;
};

export type MixingCycleListPayload = {
  items: MixingCycleRecord[];
  stats: MasterDataStats;
};

export type MixingCycleFormState = {
  id: number | null;
  mixingCycleCode: string;
  mixingCycleName: string;
  description: string;
  motorStage: number | "";
  isActive: boolean;
  cycles: MixingCycleGroupForm;
};

export const emptyMixingOperation = (): MixingOperationForm => ({
  operationId: null,
  sequenceNo: null,
  operationName: "",
});

export const createEmptyMixingCycleForm = (): MixingCycleFormState => ({
  id: null,
  mixingCycleCode: "",
  mixingCycleName: "",
  description: "",
  motorStage: "",
  isActive: true,
  cycles: { premixOperations: [], finalMixOperations: [] },
});

const mapOp = (raw: any): MixingOperationForm => ({
  operationId: raw?.operationId != null ? Number(raw.operationId) : null,
  sequenceNo: raw?.sequenceNo != null ? Number(raw.sequenceNo) : null,
  operationName: String(raw?.operationName ?? ""),
});

const mapCycles = (raw: any): MixingCycleGroupForm => ({
  premixOperations: Array.isArray(raw?.premixOperations) ? raw.premixOperations.map(mapOp) : [],
  finalMixOperations: Array.isArray(raw?.finalMixOperations) ? raw.finalMixOperations.map(mapOp) : [],
});

export const MixingCycleRecordModel = {
  fromApi: (raw: any): MixingCycleRecord => ({
    id: Number(raw?.id),
    mixingCycleCode: String(raw?.mixingCycleCode ?? ""),
    mixingCycleName: String(raw?.mixingCycleName ?? ""),
    description: String(raw?.description ?? ""),
    motorStage: Number(raw?.motorStage ?? 0),
    isActive: raw?.isActive !== false,
    cycles: mapCycles(raw?.cycles),
  }),
};

export const MixingCycleListModel = {
  fromApi: (res: any): MixingCycleListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(MixingCycleRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapMixingRecordToForm = (record: MixingCycleRecord): MixingCycleFormState => ({
  id: record.id,
  mixingCycleCode: record.mixingCycleCode,
  mixingCycleName: record.mixingCycleName,
  description: record.description,
  motorStage: record.motorStage,
  isActive: record.isActive,
  cycles: {
    premixOperations: record.cycles.premixOperations.map((o) => ({ ...o })),
    finalMixOperations: record.cycles.finalMixOperations.map((o) => ({ ...o })),
  },
});

const serializeOp = (o: MixingOperationForm) => ({
  operationId: o.operationId ?? undefined,
  sequenceNo: o.sequenceNo ?? undefined,
  operationName: o.operationName.trim(),
});

export const buildMixingCycleCreatePayload = (form: MixingCycleFormState) => ({
  mixingCycleName: form.mixingCycleName.trim(),
  description: form.description.trim() || undefined,
  motorStage: Number(form.motorStage),
  isActive: form.isActive,
  cycles: {
    premixOperations: form.cycles.premixOperations.map(serializeOp),
    finalMixOperations: form.cycles.finalMixOperations.map(serializeOp),
  },
});

export const buildMixingCycleUpdatePayload = (form: MixingCycleFormState) => ({
  id: form.id,
  mixingCycleCode: form.mixingCycleCode,
  mixingCycleName: form.mixingCycleName.trim(),
  description: form.description.trim() || undefined,
  motorStage: Number(form.motorStage),
  isActive: form.isActive,
  cycles: {
    premixOperations: form.cycles.premixOperations.map(serializeOp),
    finalMixOperations: form.cycles.finalMixOperations.map(serializeOp),
  },
});

export const buildMixingCycleDeletePayload = (id: number) => ({ id });

export const validateMixingCycleForm = (form: MixingCycleFormState): string | null => {
  if (!form.mixingCycleName.trim()) return "Mixing cycle name is required";
  if (form.motorStage === "" || Number.isNaN(Number(form.motorStage))) {
    return "Motor stage is required";
  }
  for (const o of [...form.cycles.premixOperations, ...form.cycles.finalMixOperations]) {
    if (!o.operationName.trim()) return "Operation name is required";
  }
  return null;
};

export { emptyMasterDataStats };
