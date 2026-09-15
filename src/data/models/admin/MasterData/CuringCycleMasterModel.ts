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
  propellantPressure: number | "";
  hotWaterCirculation: string;
  isActive: boolean;
  isExisting?: boolean;
};

export type CuringCycleRecord = MasterDataAuditFields & {
  id: number;
  curingCycleCode: string;
  motorStage: number;
  motorStageName: string;
  curingType: string;
  showPropellantPressure: boolean;
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
  motorStage: number | "";
  motorStageName: string;
  curingType: string;
  showPropellantPressure: boolean;
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
  propellantPressure: "",
  hotWaterCirculation: "",
  isActive: true,
  isExisting: false,
});

export const createEmptyCuringCycleForm = (): CuringCycleFormState => ({
  id: null,
  curingCycleCode: "",
  motorStage: "",
  motorStageName: "",
  curingType: "",
  showPropellantPressure: false,
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
  propellantPressure: raw?.propellantPressure != null ? Number(raw.propellantPressure) : "",
  hotWaterCirculation: String(raw?.hotWaterCirculation ?? ""),
  isActive: raw?.isActive !== false,
});

export const CuringCycleRecordModel = {
  fromApi: (raw: any): CuringCycleRecord => ({
    ...parseMasterDataAuditFields(raw),
    id: Number(raw?.id),
    curingCycleCode: String(raw?.curingCycleCode ?? ""),
    motorStage: Number(raw?.motorStage ?? 0),
    motorStageName: String(raw?.motorStageName ?? ""),
    curingType: String(raw?.curingType ?? ""),
    showPropellantPressure: Boolean(raw?.showPropellantPressure),
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
  motorStage: record.motorStage,
  motorStageName: record.motorStageName,
  curingType: record.curingType,
  showPropellantPressure: record.showPropellantPressure,
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
  propellantPressure: c.propellantPressure === "" ? undefined : Number(c.propellantPressure),
  hotWaterCirculation: c.hotWaterCirculation.trim() || undefined,
  isActive: c.isActive,
});

export const buildCuringCycleCreatePayload = (form: CuringCycleFormState) => ({
  motorStage: Number(form.motorStage),
  curingType: form.curingType.trim(),
  showPropellantPressure: form.showPropellantPressure,
  isActive: form.isActive,
  cycles: form.cycles.map(serializeStep),
});

export const buildCuringCycleUpdatePayload = (form: CuringCycleFormState) => ({
  id: form.id,
  motorStage: Number(form.motorStage),
  curingType: form.curingType.trim(),
  showPropellantPressure: form.showPropellantPressure,
  isActive: form.isActive,
  cycles: form.cycles.map(serializeStep),
});

export const buildCuringCycleDeletePayload = (id: number) => ({ id });

export type CuringCycleStepFieldErrors = {
  temperature?: string;
  durationMinutes?: string;
};

export type CuringCycleFieldErrors = {
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
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    errors.motorStage = "Motor stage is required";
  }
  if (!form.curingType.trim()) {
    errors.curingType = "Curing type is required";
  } else if (!isCuringTypeValue(form.curingType.trim())) {
    errors.curingType = "Select a valid curing type";
  }
  if (!isEdit && form.motorStage !== "" && !errors.motorStage) {
    const stage = Number(form.motorStage);
    const duplicate = existing.some((item) => item.motorStage === stage);
    if (duplicate) {
      errors.motorStage = `Curing cycle already exists for stage ${stage}`;
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
