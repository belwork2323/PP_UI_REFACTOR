import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  firstFieldErrorMessage,
  validateMasterDataNameField,
} from "@data/models/admin/MasterData/masterDataFieldValidators";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export type MixingOperationForm = {
  operationId: number | null;
  sequenceNo: number | null;
  operationName: string;
  isActive: boolean;
  isExisting?: boolean;
};

export type MixingCycleGroupForm = {
  premixOperations: MixingOperationForm[];
  finalMixOperations: MixingOperationForm[];
};

export type MixingCycleRecord = MasterDataAuditFields & {
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

export const formatMotorStageLabel = (
  motorStage: number | string | null | undefined,
  options: AppDropdownOption[] = [],
): string => {
  const value = motorStage == null || motorStage === "" ? "" : String(motorStage);
  if (!value) return "—";
  const match = options.find((option) => option.value === value);
  return match?.label ?? `Stage ${value}`;
};

export const emptyMixingOperation = (): MixingOperationForm => ({
  operationId: null,
  sequenceNo: null,
  operationName: "",
  isActive: true,
  isExisting: false,
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
  isActive: raw?.isActive !== false,
});

const mapCycles = (raw: any): MixingCycleGroupForm => ({
  premixOperations: Array.isArray(raw?.premixOperations) ? raw.premixOperations.map(mapOp) : [],
  finalMixOperations: Array.isArray(raw?.finalMixOperations) ? raw.finalMixOperations.map(mapOp) : [],
});

export const MixingCycleRecordModel = {
  fromApi: (raw: any): MixingCycleRecord => ({
    ...parseMasterDataAuditFields(raw),
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
    premixOperations: record.cycles.premixOperations.map((o) => ({ ...o, isExisting: true })),
    finalMixOperations: record.cycles.finalMixOperations.map((o) => ({ ...o, isExisting: true })),
  },
});

const serializeOp = (o: MixingOperationForm) => ({
  operationId: o.operationId ?? undefined,
  sequenceNo: o.sequenceNo ?? undefined,
  operationName: o.operationName.trim(),
  isActive: o.isActive,
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

export type MixingOperationFieldErrors = { operationName?: string };

export type MixingCycleFieldErrors = {
  mixingCycleName?: string;
  motorStage?: string;
  premixOperations?: MixingOperationFieldErrors[];
  finalMixOperations?: MixingOperationFieldErrors[];
  form?: string;
};

const mapOperationErrors = (
  ops: MixingOperationForm[],
  isEdit: boolean,
): MixingOperationFieldErrors[] =>
  ops.map((op) => {
    if (isEdit && op.isExisting) return {};
    const err = validateMasterDataNameField(op.operationName, "Operation name");
    return err ? { operationName: err } : {};
  });

export const getMixingCycleFieldErrors = (
  form: MixingCycleFormState,
  isEdit = false,
): MixingCycleFieldErrors => {
  const errors: MixingCycleFieldErrors = {};
  const nameError = validateMasterDataNameField(form.mixingCycleName, "Mixing cycle name");
  if (nameError) errors.mixingCycleName = nameError;
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    errors.motorStage = "Motor stage is required";
  }
  if (!isEdit && form.cycles.premixOperations.length === 0) {
    errors.form = "Add at least one premix operation";
    return errors;
  }
  if (!isEdit && form.cycles.finalMixOperations.length === 0) {
    errors.form = "Add at least one final mix operation";
    return errors;
  }
  errors.premixOperations = mapOperationErrors(form.cycles.premixOperations, isEdit);
  errors.finalMixOperations = mapOperationErrors(form.cycles.finalMixOperations, isEdit);
  return errors;
};

export const getMixingCycleValidationMessage = (errors: MixingCycleFieldErrors): string | null =>
  firstFieldErrorMessage(errors);

export const validateMixingCycleForm = (form: MixingCycleFormState, isEdit = false): string | null =>
  getMixingCycleValidationMessage(getMixingCycleFieldErrors(form, isEdit));

export { emptyMasterDataStats };
