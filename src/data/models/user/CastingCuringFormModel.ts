import {
  createCastingAndCuringData,
  nextTLabel,
} from "../../../hooks/user/manufacturing/castingAndCuringConfig";

export type CastingCuringPair = { m1: string; m2: string };

export type CastingCuringBowlRow = {
  id?: number;
  bowlNo: string;
  propellantQty: string;
  viscosity: string;
  viscosityTemp: string;
  arrivalTime: string;
  slurry1: string;
  slurry2: string;
};

export type CastingCuringIntervalRow = {
  id?: string;
  label: string;
  m1: string;
  m2: string;
};

export type CastingCuringFormState = {
  bowl: {
    motorIds: CastingCuringPair;
    rows: CastingCuringBowlRow[];
  };
  casting: {
    motorIds: CastingCuringPair;
    r1: CastingCuringPair;
    r2: CastingCuringPair;
    r3: CastingCuringIntervalRow[];
    r4: { param: string; m1: string; m2: string };
    r5a: CastingCuringPair;
    r5b: CastingCuringPair;
    r6: { param: string; m1: string; m2: string };
  };
  curing: {
    motorIds: CastingCuringPair;
    r1: CastingCuringPair;
    r2: CastingCuringPair;
    r3: CastingCuringPair;
    r4: CastingCuringPair;
  };
};

export type CastingCuringDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  bowlDetails: {
    motorIds: CastingCuringPair;
    rows: Array<{
      rowIndex?: number;
      bowlNo: string;
      propellantQty: string;
      viscosity: string;
      viscosityTemp: string;
      arrivalTime: string;
      slurry: CastingCuringPair;
    }>;
  };
  castingDetails: {
    motorIds: CastingCuringPair;
    vacuumBuildUp: CastingCuringPair;
    startCasting: CastingCuringPair;
    vacuumCheckIntervals: Array<{
      intervalIndex?: number;
      label: string;
      m1: string;
      m2: string;
    }>;
    castingDuration: { parameter: string; m1: string; m2: string };
    loadCellReading: {
      initial: CastingCuringPair;
      final: CastingCuringPair;
    };
    totalWeight: { parameter: string; m1: string; m2: string };
  };
  curingDetails: {
    motorIds: CastingCuringPair;
    achievingDesiredTemp: CastingCuringPair;
    curingCycleFollow: CastingCuringPair;
    soaking: CastingCuringPair;
    hardness: CastingCuringPair;
  };
};

const normalizePair = (pair: any): CastingCuringPair => ({
  m1: String(pair?.m1 ?? ""),
  m2: String(pair?.m2 ?? ""),
});

const normalizeBowlRow = (row: any, fallbackBowlNo: string, fallbackId: number): CastingCuringBowlRow => ({
  id: fallbackId,
  bowlNo: String(row?.bowlNo ?? fallbackBowlNo),
  propellantQty: String(row?.propellantQty ?? ""),
  viscosity: String(row?.viscosity ?? ""),
  viscosityTemp: String(row?.viscosityTemp ?? ""),
  arrivalTime: String(row?.arrivalTime ?? ""),
  slurry1: String(row?.slurry1 ?? row?.slurry?.m1 ?? ""),
  slurry2: String(row?.slurry2 ?? row?.slurry?.m2 ?? ""),
});

const normalizeIntervalRow = (row: any, index: number): CastingCuringIntervalRow => ({
  id: String(row?.id ?? `t_${index}`),
  label: String(row?.label ?? nextTLabel([])),
  m1: String(row?.m1 ?? ""),
  m2: String(row?.m2 ?? ""),
});

export const createDefaultCastingCuringFormState = (): CastingCuringFormState => {
  const defaults = createCastingAndCuringData();
  return {
    bowl: {
      motorIds: normalizePair(defaults.bowl.motorIds),
      rows: (defaults.bowl.rows ?? []).map((row: any, index: number) =>
        normalizeBowlRow(row, String(index + 1), index + 1)
      ),
    },
    casting: {
      motorIds: normalizePair(defaults.curingDetails.motorIds),
      r1: normalizePair(defaults.curingDetails.r1),
      r2: normalizePair(defaults.curingDetails.r2),
      r3: (defaults.curingDetails.r3 ?? []).map((row: any, index: number) =>
        normalizeIntervalRow(row, index + 1)
      ),
      r4: {
        param: String(defaults.curingDetails.r4?.param ?? ""),
        m1: String(defaults.curingDetails.r4?.m1 ?? ""),
        m2: String(defaults.curingDetails.r4?.m2 ?? ""),
      },
      r5a: normalizePair(defaults.curingDetails.r5a),
      r5b: normalizePair(defaults.curingDetails.r5b),
      r6: {
        param: String(defaults.curingDetails.r6?.param ?? ""),
        m1: String(defaults.curingDetails.r6?.m1 ?? ""),
        m2: String(defaults.curingDetails.r6?.m2 ?? ""),
      },
    },
    curing: {
      motorIds: normalizePair(defaults.curingDetails2.motorIds),
      r1: normalizePair(defaults.curingDetails2.r1),
      r2: normalizePair(defaults.curingDetails2.r2),
      r3: normalizePair(defaults.curingDetails2.r3),
      r4: normalizePair(defaults.curingDetails2.r4),
    },
  };
};

export const mapCastingCuringDetailsToFormState = (
  details: Partial<CastingCuringDetails>
): CastingCuringFormState => {
  const defaults = createDefaultCastingCuringFormState();
  const bowlRows = Array.isArray(details?.bowlDetails?.rows) ? details.bowlDetails!.rows : [];
  const intervalRows = Array.isArray(details?.castingDetails?.vacuumCheckIntervals)
    ? details.castingDetails!.vacuumCheckIntervals
    : [];

  return {
    bowl: {
      motorIds: normalizePair(details?.bowlDetails?.motorIds ?? defaults.bowl.motorIds),
      rows: bowlRows.length
        ? bowlRows.map((row: any, index: number) => normalizeBowlRow(row, String(index + 1), index + 1))
        : defaults.bowl.rows,
    },
    casting: {
      motorIds: normalizePair(details?.castingDetails?.motorIds ?? defaults.casting.motorIds),
      r1: normalizePair(details?.castingDetails?.vacuumBuildUp ?? defaults.casting.r1),
      r2: normalizePair(details?.castingDetails?.startCasting ?? defaults.casting.r2),
      r3: intervalRows.length
        ? intervalRows.map((row: any, index: number) => normalizeIntervalRow(row, index + 1))
        : defaults.casting.r3,
      r4: {
        param: String(details?.castingDetails?.castingDuration?.parameter ?? defaults.casting.r4.param),
        m1: String(details?.castingDetails?.castingDuration?.m1 ?? defaults.casting.r4.m1),
        m2: String(details?.castingDetails?.castingDuration?.m2 ?? defaults.casting.r4.m2),
      },
      r5a: normalizePair(details?.castingDetails?.loadCellReading?.initial ?? defaults.casting.r5a),
      r5b: normalizePair(details?.castingDetails?.loadCellReading?.final ?? defaults.casting.r5b),
      r6: {
        param: String(details?.castingDetails?.totalWeight?.parameter ?? defaults.casting.r6.param),
        m1: String(details?.castingDetails?.totalWeight?.m1 ?? defaults.casting.r6.m1),
        m2: String(details?.castingDetails?.totalWeight?.m2 ?? defaults.casting.r6.m2),
      },
    },
    curing: {
      motorIds: normalizePair(details?.curingDetails?.motorIds ?? defaults.curing.motorIds),
      r1: normalizePair(details?.curingDetails?.achievingDesiredTemp ?? defaults.curing.r1),
      r2: normalizePair(details?.curingDetails?.curingCycleFollow ?? defaults.curing.r2),
      r3: normalizePair(details?.curingDetails?.soaking ?? defaults.curing.r3),
      r4: normalizePair(details?.curingDetails?.hardness ?? defaults.curing.r4),
    },
  };
};

export const mapCastingCuringFormStateToPayload = (form: CastingCuringFormState) => ({
  bowlDetails: {
    motorIds: normalizePair(form.bowl.motorIds),
    rows: (form.bowl.rows ?? []).map((row) => ({
      bowlNo: String(row.bowlNo ?? ""),
      propellantQty: String(row.propellantQty ?? ""),
      viscosity: String(row.viscosity ?? ""),
      viscosityTemp: String(row.viscosityTemp ?? ""),
      arrivalTime: String(row.arrivalTime ?? ""),
      slurry: {
        m1: String(row.slurry1 ?? ""),
        m2: String(row.slurry2 ?? ""),
      },
    })),
  },
  castingDetails: {
    motorIds: normalizePair(form.casting.motorIds),
    vacuumBuildUp: normalizePair(form.casting.r1),
    startCasting: normalizePair(form.casting.r2),
    vacuumCheckIntervals: (form.casting.r3 ?? []).map((row) => ({
      label: String(row.label ?? ""),
      m1: String(row.m1 ?? ""),
      m2: String(row.m2 ?? ""),
    })),
    castingDuration: {
      parameter: String(form.casting.r4.param ?? ""),
      m1: String(form.casting.r4.m1 ?? ""),
      m2: String(form.casting.r4.m2 ?? ""),
    },
    loadCellReading: {
      initial: normalizePair(form.casting.r5a),
      final: normalizePair(form.casting.r5b),
    },
    totalWeight: {
      parameter: String(form.casting.r6.param ?? ""),
      m1: String(form.casting.r6.m1 ?? ""),
      m2: String(form.casting.r6.m2 ?? ""),
    },
  },
  curingDetails: {
    motorIds: normalizePair(form.curing.motorIds),
    achievingDesiredTemp: normalizePair(form.curing.r1),
    curingCycleFollow: normalizePair(form.curing.r2),
    soaking: normalizePair(form.curing.r3),
    hardness: normalizePair(form.curing.r4),
  },
});

export const hasAnyCastingCuringValue = (form: CastingCuringFormState) => {
  const pairs: CastingCuringPair[] = [
    ...((form.bowl.rows ?? []).flatMap((row) => [
      { m1: String(row.propellantQty ?? ""), m2: "" },
      { m1: String(row.viscosity ?? ""), m2: String(row.viscosityTemp ?? "") },
      { m1: String(row.arrivalTime ?? ""), m2: "" },
      { m1: String(row.slurry1 ?? ""), m2: String(row.slurry2 ?? "") },
    ]) as CastingCuringPair[]),
    form.casting.r1,
    form.casting.r2,
    ...(form.casting.r3 ?? []),
    { m1: String(form.casting.r4.param ?? ""), m2: String(form.casting.r4.m1 ?? "") },
    { m1: String(form.casting.r4.m2 ?? ""), m2: "" },
    form.casting.r5a,
    form.casting.r5b,
    { m1: String(form.casting.r6.param ?? ""), m2: String(form.casting.r6.m1 ?? "") },
    { m1: String(form.casting.r6.m2 ?? ""), m2: "" },
    form.curing.r1,
    form.curing.r2,
    form.curing.r3,
    form.curing.r4,
  ].filter(Boolean) as CastingCuringPair[];

  return pairs.some(
    (pair) => String(pair.m1 ?? "").trim().length > 0 || String(pair.m2 ?? "").trim().length > 0
  );
};

export class CastingCuringSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new CastingCuringSubmitResponseModel(data);
  }
}

export class CastingCuringDetailsModel {
  static fromApi(data: any): CastingCuringDetails {
    const payload = data?.data ?? data ?? {};
    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      bowlDetails: payload?.bowlDetails ?? { motorIds: { m1: "", m2: "" }, rows: [] },
      castingDetails: payload?.castingDetails ?? {
        motorIds: { m1: "", m2: "" },
        vacuumBuildUp: { m1: "", m2: "" },
        startCasting: { m1: "", m2: "" },
        vacuumCheckIntervals: [],
        castingDuration: { parameter: "", m1: "", m2: "" },
        loadCellReading: { initial: { m1: "", m2: "" }, final: { m1: "", m2: "" } },
        totalWeight: { parameter: "", m1: "", m2: "" },
      },
      curingDetails: payload?.curingDetails ?? {
        motorIds: { m1: "", m2: "" },
        achievingDesiredTemp: { m1: "", m2: "" },
        curingCycleFollow: { m1: "", m2: "" },
        soaking: { m1: "", m2: "" },
        hardness: { m1: "", m2: "" },
      },
    };
  }
}
