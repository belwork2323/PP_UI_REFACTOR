export class DimensionalParameterModel {
  paramId: string;
  paramName: string;
  referenceRange: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };

  constructor(payload: any) {
    this.paramId = payload?.paramId ?? "";
    this.paramName = payload?.paramName ?? "";
    this.referenceRange = {
      minValue: payload?.referenceRange?.minValue ?? null,
      maxValue: payload?.referenceRange?.maxValue ?? null,
      unit: payload?.referenceRange?.unit ?? null,
    };
  }

  get formattedRange(): string {
    const { minValue, maxValue, unit } = this.referenceRange;
    const unitSuffix = unit ? ` ${unit}` : "";

    if (minValue != null && maxValue != null) return `${minValue} - ${maxValue}${unitSuffix}`;
    if (minValue != null) return `>= ${minValue}${unitSuffix}`;
    if (maxValue != null) return `<= ${maxValue}${unitSuffix}`;
    return "N/A";
  }
}

export class DimensionalParametersListModel {
  motorType: string;
  parameters: DimensionalParameterModel[];

  constructor(payload: any) {
    this.motorType = payload?.motorType ?? "";
    this.parameters = Array.isArray(payload?.parameters)
      ? payload.parameters.map((item: any) => new DimensionalParameterModel(item))
      : [];
  }

  static fromApi(apiResponse: any): DimensionalParametersListModel {
    return new DimensionalParametersListModel(apiResponse?.data ?? {});
  }
}

export class SolidProcessItemModel {
  processId: string;
  processKey: string;
  label: string;
  description: string;

  constructor(payload: any) {
    this.processId = payload?.processId ?? "";
    this.processKey = payload?.processKey ?? "";
    this.label = payload?.label ?? "";
    this.description = payload?.description ?? "";
  }
}

export class SolidProcessesListModel {
  processes: SolidProcessItemModel[];

  constructor(payload: any) {
    this.processes = Array.isArray(payload?.processes)
      ? payload.processes.map((item: any) => new SolidProcessItemModel(item))
      : [];
  }

  static fromApi(apiResponse: any): SolidProcessesListModel {
    return new SolidProcessesListModel(apiResponse?.data ?? {});
  }
}

export class MotorStageListItemModel {
  motorStage: string;
  noOfmotors: number;
  /** Derived from list order when API does not return an explicit id */
  motorTypeId: number;

  constructor(payload: any, index: number) {
    this.motorStage = String(payload?.motorStage ?? "").trim();
    this.noOfmotors = Number(payload?.noOfmotors ?? payload?.noOfMotors ?? 0);
    this.motorTypeId = index + 1;
  }
}

export class MotorsStageListModel {
  stages: MotorStageListItemModel[];

  constructor(stages: MotorStageListItemModel[] = []) {
    this.stages = stages;
  }

  static fromApi(apiResponse: any): MotorsStageListModel {
    const raw = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
    return new MotorsStageListModel(
      raw.map((item: any, index: number) => new MotorStageListItemModel(item, index))
    );
  }
}

export type AvailableMotorOption = {
  motorCasingId: string;
  motorId: string;
  motorStage: string;
  motorNo: string;
  projectId: string;
  status: string;
};

export class AvailableMotorModel implements AvailableMotorOption {
  motorCasingId: string;
  motorId: string;
  motorStage: string;
  motorNo: string;
  projectId: string;
  status: string;

  constructor(payload: Record<string, unknown>) {
    this.motorCasingId = String(payload?.motorCasingId ?? "").trim();
    this.motorId = String(payload?.motorId ?? payload?.motorNo ?? "").trim();
    this.motorStage = String(payload?.motorStage ?? "").trim();
    this.motorNo = String(payload?.motorNo ?? payload?.motorId ?? "").trim();
    this.projectId = String(payload?.projectId ?? "").trim();
    this.status = String(payload?.status ?? "").trim();
  }
}

export class AvailableMotorsListModel {
  motors: AvailableMotorModel[];

  constructor(motors: AvailableMotorModel[] = []) {
    this.motors = motors;
  }

  static fromApi(apiResponse: { data?: unknown }): AvailableMotorsListModel {
    const data = apiResponse?.data;
    let motors: unknown[] = [];
    let projectId = "";
    let motorStage = "";

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      motors = Array.isArray(obj.motors) ? obj.motors : [];
      projectId = String(obj.projectId ?? "");
      motorStage = String(obj.motorStage ?? "");
    } else if (Array.isArray(data)) {
      motors = data;
    }

    return new AvailableMotorsListModel(
      motors
        .map((item) => {
          const row = item as Record<string, unknown>;
          return new AvailableMotorModel({
            ...row,
            projectId: row.projectId ?? projectId,
            motorStage: row.motorStage ?? motorStage,
          });
        })
        .filter((m) => m.motorId || m.motorCasingId),
    );
  }
}
