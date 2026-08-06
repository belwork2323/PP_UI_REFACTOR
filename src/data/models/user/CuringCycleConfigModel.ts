export type CuringCycleItem = {
  sequenceNo: number;
  temperature: number;
  durationMinutes: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  propellantPressure?: number;
  hotWaterCirculation: string;
};

export type CuringCycleConfig = {
  motorStage: number;
  motorStageName: string;
  curingType: string;
  showPropellantPressure: boolean;
  cycles: CuringCycleItem[];
};

const mapCycleItem = (item: Record<string, unknown>): CuringCycleItem => ({
  sequenceNo: Number(item.sequenceNo ?? 0),
  temperature: Number(item.temperature ?? 0),
  durationMinutes: Number(item.durationMinutes ?? 0),
  startDate: String(item.startDate ?? ""),
  startTime: String(item.startTime ?? ""),
  endDate: String(item.endDate ?? ""),
  endTime: String(item.endTime ?? ""),
  propellantPressure:
    item.propellantPressure == null ? undefined : Number(item.propellantPressure),
  hotWaterCirculation: String(item.hotWaterCirculation ?? ""),
});

export class CuringCycleConfigModel {
  static fromApi(response: { data?: Record<string, unknown> } | Record<string, unknown>): CuringCycleConfig {
    const data = (response as { data?: Record<string, unknown> })?.data ?? response;
    const record = (data ?? {}) as Record<string, unknown>;
    const cycles = Array.isArray(record.cycles)
      ? record.cycles.map((cycle) => mapCycleItem(cycle as Record<string, unknown>))
      : [];

    const motorStage = Number(record.motorStage ?? record.stage ?? 0);
    const motorStageNameRaw = String(
      record.motorStageName ?? record.stageName ?? record.motorStageLabel ?? "",
    ).trim();

    return {
      motorStage,
      motorStageName:
        motorStageNameRaw ||
        (Number.isFinite(motorStage) && motorStage >= 0 && motorStage <= 3
          ? `Stage ${motorStage}`
          : ""),
      curingType: String(record.curingType ?? ""),
      showPropellantPressure: Boolean(record.showPropellantPressure),
      cycles,
    };
  }
}
