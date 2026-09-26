import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import { formatMotorStageLabel } from "@data/models/admin/MasterData/MixingCycleMasterModel";
import {
  CURING_TYPE_OPTIONS,
  isCuringTypeValue,
} from "@data/models/admin/MasterData/curingTypeOptions";
import { firstFieldErrorMessage } from "@data/models/admin/MasterData/masterDataFieldValidators";

export type CuringCycleStepForm = {
  stepId: number | null;
  sequenceNo: number | null;
  temperature: number | "";
  durationMinutes: number | "";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  hotWaterCirculation: string;
  isActive: boolean;
  isExisting?: boolean;
};

export type CuringCycleRecord = MasterDataAuditFields & {
  id: number;
  curingCycleCode: string;
  projectId: string;
  motorStage: number;
  motorStageName: string;
  curingType: string;
  isActive: boolean;
  cycles: CuringCycleStepForm[];
};

export type CuringCycleListPayload = {
  items: CuringCycleRecord[];
  stats: MasterDataStats;
};

export type CuringCycleFormState = {
  id: number | null;
  curingCycleCode: string;
  projectId: string;
  motorStage: number | "";
  motorStageName: string;
  curingType: string;
  isActive: boolean;
  cycles: CuringCycleStepForm[];
};

export const emptyCuringCycleStep = (): CuringCycleStepForm => ({
  stepId: null,
  sequenceNo: null,
  temperature: "",
  durationMinutes: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  hotWaterCirculation: "",
  isActive: true,
  isExisting: false,
});

export const createEmptyCuringCycleForm = (): CuringCycleFormState => ({
  id: null,
  curingCycleCode: "",
  projectId: "",
  motorStage: "",
  motorStageName: "",
  curingType: "",
  isActive: true,
  cycles: [],
});

const mapStep = (raw: any): CuringCycleStepForm => ({
  stepId: raw?.stepId != null ? Number(raw.stepId) : null,
  sequenceNo: raw?.sequenceNo != null ? Number(raw.sequenceNo) : null,
  temperature: raw?.temperature != null ? Number(raw.temperature) : "",
  durationMinutes: raw?.durationMinutes != null ? Number(raw.durationMinutes) : "",
  startDate: String(raw?.startDate ?? ""),
  startTime: String(raw?.startTime ?? ""),
  endDate: String(raw?.endDate ?? ""),
  endTime: String(raw?.endTime ?? ""),
  hotWaterCirculation: String(raw?.hotWaterCirculation ?? ""),
  isActive: raw?.isActive !== false,
});

export const CuringCycleRecordModel = {
  fromApi: (raw: any): CuringCycleRecord => ({
    ...parseMasterDataAuditFields(raw),
    id: Number(raw?.id),
    curingCycleCode: String(raw?.curingCycleCode ?? ""),
    projectId: String(raw?.projectId ?? ""),
    motorStage: Number(raw?.motorStage ?? 0),
    motorStageName: String(raw?.motorStageName ?? ""),
    curingType: String(raw?.curingType ?? ""),
    isActive: raw?.isActive !== false,
    cycles: Array.isArray(raw?.cycles) ? raw.cycles.map(mapStep) : [],
  }),
};

export const CuringCycleListModel = {
  fromApi: (res: any): CuringCycleListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(CuringCycleRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapCuringRecordToForm = (record: CuringCycleRecord): CuringCycleFormState => ({
  id: record.id,
  curingCycleCode: record.curingCycleCode,
  projectId: record.projectId,
  motorStage: record.motorStage,
  motorStageName: record.motorStageName,
  curingType: record.curingType,
  isActive: record.isActive,
  cycles: record.cycles.map((c) => ({ ...c, isExisting: true })),
});

const serializeStep = (c: CuringCycleStepForm) => ({
  stepId: c.stepId ?? undefined,
  sequenceNo: c.sequenceNo ?? undefined,
  temperature: c.temperature === "" ? undefined : Number(c.temperature),
  durationMinutes: c.durationMinutes === "" ? undefined : Number(c.durationMinutes),
  startDate: c.startDate.trim() || undefined,
  startTime: c.startTime.trim() || undefined,
  endDate: c.endDate.trim() || undefined,
  endTime: c.endTime.trim() || undefined,
  hotWaterCirculation: c.hotWaterCirculation.trim() || undefined,
  isActive: c.isActive,
});

export const buildCuringCycleCreatePayload = (form: CuringCycleFormState) => ({
  projectId: form.projectId.trim(),
  motorStage: Number(form.motorStage),
  curingType: form.curingType.trim(),
  isActive: form.isActive,
  cycles: form.cycles.map(serializeStep),
});

export const buildCuringCycleUpdatePayload = (form: CuringCycleFormState) => ({
  id: form.id,
  projectId: form.projectId.trim(),
  motorStage: Number(form.motorStage),
  curingType: form.curingType.trim(),
  isActive: form.isActive,
  cycles: form.cycles.map(serializeStep),
});

export const buildCuringCycleDeletePayload = (id: number) => ({ id });

export type CuringCycleStepFieldErrors = {
  temperature?: string;
  durationMinutes?: string;
};

export type CuringCycleFieldErrors = {
  projectId?: string;
  motorStage?: string;
  curingType?: string;
  cycles?: CuringCycleStepFieldErrors[];
  form?: string;
};

export const getCuringCycleFieldErrors = (
  form: CuringCycleFormState,
  isEdit: boolean,
  existing: CuringCycleRecord[] = [],
): CuringCycleFieldErrors => {
  const errors: CuringCycleFieldErrors = {};
  if (!isEdit && !form.projectId.trim()) {
    errors.projectId = "Project is required";
  }
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    errors.motorStage = "Motor stage is required";
  }
  if (!form.curingType.trim()) {
    errors.curingType = "Curing type is required";
  } else if (!isCuringTypeValue(form.curingType.trim())) {
    errors.curingType = "Select a valid curing type";
  }
  if (
    !isEdit &&
    form.isActive &&
    form.projectId.trim() &&
    form.motorStage !== "" &&
    !errors.motorStage &&
    !errors.projectId
  ) {
    const stage = Number(form.motorStage);
    const projectId = form.projectId.trim();
    const duplicate = existing.some(
      (item) =>
        item.isActive &&
        item.projectId === projectId &&
        item.motorStage === stage &&
        (form.id == null || item.id !== form.id),
    );
    if (duplicate) {
      errors.motorStage = `Curing cycle already exists and is active for this project and motor stage ${stage}`;
    }
  }
  if (!isEdit && form.cycles.length === 0) {
    errors.form = "Add at least one cycle step";
    return errors;
  }
  errors.cycles = form.cycles.map((step) => {
    if (isEdit && step.isExisting) return {};
    const stepErrors: CuringCycleStepFieldErrors = {};
    if (step.temperature === "" || Number.isNaN(Number(step.temperature))) {
      stepErrors.temperature = "Temperature is required";
    }
    if (step.durationMinutes === "" || Number.isNaN(Number(step.durationMinutes))) {
      stepErrors.durationMinutes = "Duration is required";
    }
    return stepErrors;
  });
  return errors;
};

export const getCuringCycleValidationMessage = (errors: CuringCycleFieldErrors): string | null =>
  firstFieldErrorMessage(errors);

export const validateCuringCycleForm = (
  form: CuringCycleFormState,
  isEdit: boolean,
  existing: CuringCycleRecord[] = [],
): string | null => getCuringCycleValidationMessage(getCuringCycleFieldErrors(form, isEdit, existing));

export { emptyMasterDataStats, formatMotorStageLabel, CURING_TYPE_OPTIONS };
