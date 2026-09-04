import {
  emptyMasterDataStats,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";

export type CuringCycleStepForm = {
  sequenceNo: number | null;
  temperature: number | "";
  durationMinutes: number | "";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  propellantPressure: number | "";
  hotWaterCirculation: string;
};

export type CuringCycleRecord = {
  id: string;
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
  id: string | null;
  motorStage: number | "";
  motorStageName: string;
  curingType: string;
  showPropellantPressure: boolean;
  isActive: boolean;
  cycles: CuringCycleStepForm[];
};

export const emptyCuringCycleStep = (): CuringCycleStepForm => ({
  sequenceNo: null,
  temperature: "",
  durationMinutes: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  propellantPressure: "",
  hotWaterCirculation: "",
});

export const createEmptyCuringCycleForm = (): CuringCycleFormState => ({
  id: null,
  motorStage: "",
  motorStageName: "",
  curingType: "",
  showPropellantPressure: false,
  isActive: true,
  cycles: [],
});

const mapStep = (raw: any): CuringCycleStepForm => ({
  sequenceNo: raw?.sequenceNo != null ? Number(raw.sequenceNo) : null,
  temperature: raw?.temperature != null ? Number(raw.temperature) : "",
  durationMinutes: raw?.durationMinutes != null ? Number(raw.durationMinutes) : "",
  startDate: String(raw?.startDate ?? ""),
  startTime: String(raw?.startTime ?? ""),
  endDate: String(raw?.endDate ?? ""),
  endTime: String(raw?.endTime ?? ""),
  propellantPressure: raw?.propellantPressure != null ? Number(raw.propellantPressure) : "",
  hotWaterCirculation: String(raw?.hotWaterCirculation ?? ""),
});

export const CuringCycleRecordModel = {
  fromApi: (raw: any): CuringCycleRecord => ({
    id: String(raw?.id ?? ""),
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
  motorStage: record.motorStage,
  motorStageName: record.motorStageName,
  curingType: record.curingType,
  showPropellantPressure: record.showPropellantPressure,
  isActive: record.isActive,
  cycles: record.cycles.map((c) => ({ ...c })),
});

const serializeStep = (c: CuringCycleStepForm) => ({
  sequenceNo: c.sequenceNo ?? undefined,
  temperature: c.temperature === "" ? undefined : Number(c.temperature),
  durationMinutes: c.durationMinutes === "" ? undefined : Number(c.durationMinutes),
  startDate: c.startDate.trim() || undefined,
  startTime: c.startTime.trim() || undefined,
  endDate: c.endDate.trim() || undefined,
  endTime: c.endTime.trim() || undefined,
  propellantPressure: c.propellantPressure === "" ? undefined : Number(c.propellantPressure),
  hotWaterCirculation: c.hotWaterCirculation.trim() || undefined,
});

export const buildCuringCycleCreatePayload = (form: CuringCycleFormState) => ({
  motorStage: Number(form.motorStage),
  motorStageName: form.motorStageName.trim() || undefined,
  curingType: form.curingType.trim(),
  showPropellantPressure: form.showPropellantPressure,
  isActive: form.isActive,
  cycles: form.cycles.map(serializeStep),
});

export const buildCuringCycleUpdatePayload = (form: CuringCycleFormState) => ({
  id: form.id,
  motorStage: Number(form.motorStage),
  motorStageName: form.motorStageName.trim() || undefined,
  curingType: form.curingType.trim(),
  showPropellantPressure: form.showPropellantPressure,
  isActive: form.isActive,
  cycles: form.cycles.map(serializeStep),
});

export const buildCuringCycleDeletePayload = (id: string) => ({ id });

export const validateCuringCycleForm = (form: CuringCycleFormState, isEdit: boolean): string | null => {
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    return "Motor stage is required";
  }
  if (!form.curingType.trim()) return "Curing type is required";
  return null;
};

export { emptyMasterDataStats };
