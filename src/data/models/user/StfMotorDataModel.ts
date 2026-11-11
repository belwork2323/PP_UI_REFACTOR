import {
  asArray,
  asRecord,
  pickField,
  str,
  toApiDateTime,
  toApiNumber,
  toUiDateTime,
} from "./castingCuringFieldCodec";
import {
  isFileUploadIncomplete,
  type FileRef,
} from "../common/FileUploadModel";

export type StfMotorDataVariant = "MAIN_MOTOR" | "BEM";

/** Fixed MAIN ballistic parameter rows (Channel 1 only). */
export const STF_MAIN_BALLISTIC_PARAMETERS = [
  { key: "CHAMBER_PRESSURE_AVG", label: "Chamber Pressure (Avg)" },
  { key: "CHAMBER_PRESSURE_MAX", label: "Chamber Pressure (Max)" },
  { key: "AVERAGE_THRUST_KGF", label: "Average Thrust (kgf)" },
  { key: "MAX_THRUST_KGF", label: "Max Thrust (kgf)" },
  { key: "IGNITION_DELAY_MSEC", label: "Ignition delay (msec)" },
  { key: "ACTION_TIME_SEC", label: "Action Time (sec)" },
  { key: "TOTAL_IMPULSE_TON_SEC", label: "Total Impulse (Ton. Sec)" },
  { key: "CSTAR_CORRECTED", label: "Cstar (corrected)" },
  { key: "ISP_DELIVERED_SEC", label: "Isp Delivered (sec)" },
  { key: "ISP_70_1_033", label: "Isp (70:1.033)" },
] as const;

export type StfMainBallisticParameterKey =
  (typeof STF_MAIN_BALLISTIC_PARAMETERS)[number]["key"];

/** Fixed BEM ballistic parameter rows (Channel 1 / Channel 2). */
export const STF_BEM_BALLISTIC_PARAMETERS = [
  { key: "PRESSURE_THRUST", label: "Pressure / Thrust" },
  { key: "SENSOR_SENSITIVITY", label: "Sensor sensitivity" },
  { key: "IGNITION_DELAY", label: "Ignition delay" },
  { key: "ACTION_TIME", label: "Action time" },
  { key: "BURN_TIME", label: "Burn time" },
  { key: "AVERAGE_IN_BURN_TIME", label: "Average in Burn time" },
  { key: "AVERAGE_IN_ACTION_TIME", label: "Average in Action time" },
  { key: "AREA_IN_BURN_TIME", label: "Area in Burn Time" },
  { key: "AREA_IN_ACTION_TIME", label: "Area in Action time" },
  { key: "CSTAR_ISP", label: "Cstar/Isp" },
] as const;

export type StfBemBallisticParameterKey =
  (typeof STF_BEM_BALLISTIC_PARAMETERS)[number]["key"];

export const STF_BEM_WT_OF_GRAIN_OPTIONS = ["40", "20", "2"] as const;
export const STF_BEM_GRAIN_CONFIGURATION_OPTIONS = [
  "6 STAR PETAL",
  "10 POINT STAR",
  "ID & OD",
  "ID & BOTH END",
] as const;

export type StfMainTestHeader = {
  FIRING_DATE: string;
  AMBIENT_TEMPERATURE: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfMainNozzleDetails = {
  BEFORE_DT: string;
  BEFORE_DE: string;
  AFTER_DT: string;
  AFTER_DE: string;
  NOZZLE_EROSION_RATE_MM_S: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfMainMotorDataSection = {
  PROPELLANT_WEIGHT_KG: string;
  AVG_BEM_BURN_RATE_MM_S: string;
  N_VALUE: string;
  PROPELLANT_DENSITY: string;
  GAMMA: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfMainBallisticRow = {
  PARAMETER: StfMainBallisticParameterKey;
  PARAMETER_LABEL: string;
  CHANNEL_1: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfMainBurnRate = {
  BURN_RATE_MM_S: string;
  PRESSURE_ABS_KSC: string;
  N_VALUE: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfMainMotorData = {
  variant: "MAIN_MOTOR";
  TEST_HEADER: StfMainTestHeader;
  NOZZLE_DETAILS: StfMainNozzleDetails;
  MAIN_MOTOR_DATA: StfMainMotorDataSection;
  BALLISTIC_PARAMETERS: StfMainBallisticRow[];
  BURN_RATE: StfMainBurnRate;
};

export type StfBemTestHeader = {
  LOADING_NO: string;
  FIRING_NO: string;
  FIRING_DATE: string;
  TEMPERATURE: string;
  RH: string;
  WT_OF_GRAIN: string;
  GRAIN_CONFIGURATION: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfBemIgniterDetails = {
  TYPE: string;
  SR_NO_AND_LOT_NO: string;
  CHARGE_MASS_GM: string;
  COMPOSITION: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfBemNozzleDetails = {
  BEFORE_DT: string;
  BEFORE_DE: string;
  AFTER_DT: string;
  AFTER_DE: string;
  NOZZLE_CLOSURE_THICKNESS_MM: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfBemDataSection = {
  PROPELLANT_WEIGHT_KG: string;
  CONDITIONING_TEMPERATURE: string;
  N_VALUE: string;
  WEB_THICKNESS_AVERAGE_MIN: string;
  WEB_THICKNESS_STD_DEV: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfBemBallisticRow = {
  PARAMETER: StfBemBallisticParameterKey;
  PARAMETER_LABEL: string;
  CHANNEL_1: string;
  CHANNEL_2: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfBemBurnRate = {
  BURN_RATE_MM_S: string;
  PRESSURE_ABS_KSC: string;
  /** QC Division QA Remarks (API: qaRemarks). */
  QA_REMARKS: string;
};

export type StfBemMotorData = {
  variant: "BEM";
  TEST_HEADER: StfBemTestHeader;
  IGNITER_DETAILS: StfBemIgniterDetails;
  NOZZLE_DETAILS: StfBemNozzleDetails;
  BEM_DATA: StfBemDataSection;
  BALLISTIC_PARAMETERS: StfBemBallisticRow[];
  BURN_RATE: StfBemBurnRate;
};

export type StfMotorData = StfMainMotorData | StfBemMotorData;

/** MAIN-only nested staticTestingDetails shape. */
export type StfMainTestHeaderApi = {
  firingDate?: string;
  ambientTemperature?: number;
  qaRemarks?: string;
};

export type StfMainNozzleDetailsApi = {
  beforeDt?: number;
  beforeDe?: number;
  afterDt?: number;
  afterDe?: number;
  nozzleErosionRateMmS?: number;
  qaRemarks?: string;
};

export type StfMainMotorDataApi = {
  propellantWeightKg?: number;
  avgBemBurnRateMmS?: number;
  nValue?: number;
  propellantDensity?: number;
  gamma?: number;
  qaRemarks?: string;
};

export type StfMainBallisticParameterApi = {
  parameter?: string;
  channel1?: string;
  qaRemarks?: string;
};

export type StfMainBurnRateApi = {
  burnRateMmS?: number;
  pressureAbsKsc?: number;
  nValue?: number;
  qaRemarks?: string;
};

export type StfMainStaticTestingDetailsApi = {
  testHeader?: StfMainTestHeaderApi;
  nozzleDetails?: StfMainNozzleDetailsApi;
  mainMotorData?: StfMainMotorDataApi;
  ballisticParameters?: StfMainBallisticParameterApi[];
  burnRate?: StfMainBurnRateApi;
};

/** BEM-only nested staticTestingDetails shape. */
export type StfBemTestHeaderApi = {
  loadingNo?: string;
  firingNo?: string;
  firingDate?: string;
  temperature?: number;
  rh?: number;
  wtOfGrain?: string;
  grainConfiguration?: string;
  qaRemarks?: string;
};

export type StfBemIgniterDetailsApi = {
  type?: string;
  srNoAndLotNo?: string;
  chargeMassGm?: number;
  composition?: string;
  qaRemarks?: string;
};

export type StfBemNozzleDetailsApi = {
  beforeDt?: number;
  beforeDe?: number;
  afterDt?: number;
  afterDe?: number;
  nozzleClosureThicknessMm?: number;
  qaRemarks?: string;
};

export type StfBemDataApi = {
  propellantWeightKg?: number;
  conditioningTemperature?: number;
  nValue?: number;
  webThicknessAverageMin?: number;
  webThicknessStdDev?: number;
  qaRemarks?: string;
};

export type StfBemBallisticParameterApi = {
  parameter?: string;
  channel1?: string;
  channel2?: string;
  qaRemarks?: string;
};

export type StfBemBurnRateApi = {
  burnRateMmS?: number;
  pressureAbsKsc?: number;
  qaRemarks?: string;
};

export type StfBemStaticTestingDetailsApi = {
  testHeader?: StfBemTestHeaderApi;
  igniterDetails?: StfBemIgniterDetailsApi;
  nozzleDetails?: StfBemNozzleDetailsApi;
  bemData?: StfBemDataApi;
  ballisticParameters?: StfBemBallisticParameterApi[];
  burnRate?: StfBemBurnRateApi;
};

export type StfStaticTestingDetailsApi =
  | StfMainStaticTestingDetailsApi
  | StfBemStaticTestingDetailsApi;

export const createEmptyStfMainMotorData = (): StfMainMotorData => ({
  variant: "MAIN_MOTOR",
  TEST_HEADER: {
    FIRING_DATE: "",
    AMBIENT_TEMPERATURE: "",
    QA_REMARKS: "",
  },
  NOZZLE_DETAILS: {
    BEFORE_DT: "",
    BEFORE_DE: "",
    AFTER_DT: "",
    AFTER_DE: "",
    NOZZLE_EROSION_RATE_MM_S: "",
    QA_REMARKS: "",
  },
  MAIN_MOTOR_DATA: {
    PROPELLANT_WEIGHT_KG: "",
    AVG_BEM_BURN_RATE_MM_S: "",
    N_VALUE: "",
    PROPELLANT_DENSITY: "",
    GAMMA: "",
    QA_REMARKS: "",
  },
  BALLISTIC_PARAMETERS: STF_MAIN_BALLISTIC_PARAMETERS.map((row) => ({
    PARAMETER: row.key,
    PARAMETER_LABEL: row.label,
    CHANNEL_1: "",
    QA_REMARKS: "",
  })),
  BURN_RATE: {
    BURN_RATE_MM_S: "",
    PRESSURE_ABS_KSC: "",
    N_VALUE: "",
    QA_REMARKS: "",
  },
});

export const createEmptyStfBemMotorData = (): StfBemMotorData => ({
  variant: "BEM",
  TEST_HEADER: {
    LOADING_NO: "",
    FIRING_NO: "",
    FIRING_DATE: "",
    TEMPERATURE: "",
    RH: "",
    WT_OF_GRAIN: "",
    GRAIN_CONFIGURATION: "",
    QA_REMARKS: "",
  },
  IGNITER_DETAILS: {
    TYPE: "",
    SR_NO_AND_LOT_NO: "",
    CHARGE_MASS_GM: "",
    COMPOSITION: "",
    QA_REMARKS: "",
  },
  NOZZLE_DETAILS: {
    BEFORE_DT: "",
    BEFORE_DE: "",
    AFTER_DT: "",
    AFTER_DE: "",
    NOZZLE_CLOSURE_THICKNESS_MM: "",
    QA_REMARKS: "",
  },
  BEM_DATA: {
    PROPELLANT_WEIGHT_KG: "",
    CONDITIONING_TEMPERATURE: "",
    N_VALUE: "",
    WEB_THICKNESS_AVERAGE_MIN: "",
    WEB_THICKNESS_STD_DEV: "",
    QA_REMARKS: "",
  },
  BALLISTIC_PARAMETERS: STF_BEM_BALLISTIC_PARAMETERS.map((row) => ({
    PARAMETER: row.key,
    PARAMETER_LABEL: row.label,
    CHANNEL_1: "",
    CHANNEL_2: "",
    QA_REMARKS: "",
  })),
  BURN_RATE: {
    BURN_RATE_MM_S: "",
    PRESSURE_ABS_KSC: "",
    QA_REMARKS: "",
  },
});

export const createEmptyStfMotorData = (variant: StfMotorDataVariant): StfMotorData =>
  variant === "MAIN_MOTOR" ? createEmptyStfMainMotorData() : createEmptyStfBemMotorData();

const hasUserContent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(hasUserContent);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, entry]) => {
      if (
        key === "CHANNEL" ||
        key === "PARAMETER" ||
        key === "PARAMETER_LABEL" ||
        key === "variant"
      ) {
        return false;
      }
      return hasUserContent(entry);
    });
  }
  return false;
};

export const stfMotorDataHasUserInput = (data: StfMotorData | null | undefined): boolean =>
  Boolean(data && hasUserContent(data));

const mapRowFields = <T extends Record<string, string>>(
  preset: T,
  saved: Record<string, unknown>,
): T => {
  const next = { ...preset };
  (Object.keys(preset) as Array<keyof T>).forEach((key) => {
    const keyStr = String(key);
    // Prefer UI key; for QA_REMARKS also accept API camelCase qaRemarks (never mfg remarks).
    const value =
      keyStr === "QA_REMARKS"
        ? pickField(saved, "QA_REMARKS", "qaRemarks")
        : pickField(saved, keyStr);
    if (value !== undefined && value !== null) {
      next[key] = str(value) as T[keyof T];
    }
  });
  return next;
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  ) as Partial<T>;

const numOrOmit = (value: unknown): number | undefined => toApiNumber(value);

const buildMainTestHeader = (row: StfMainTestHeader): StfMainTestHeaderApi =>
  omitEmpty({
    firingDate: toApiDateTime(row.FIRING_DATE) || undefined,
    ambientTemperature: numOrOmit(row.AMBIENT_TEMPERATURE),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildMainNozzleDetails = (row: StfMainNozzleDetails): StfMainNozzleDetailsApi =>
  omitEmpty({
    beforeDt: numOrOmit(row.BEFORE_DT),
    beforeDe: numOrOmit(row.BEFORE_DE),
    afterDt: numOrOmit(row.AFTER_DT),
    afterDe: numOrOmit(row.AFTER_DE),
    nozzleErosionRateMmS: numOrOmit(row.NOZZLE_EROSION_RATE_MM_S),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildMainMotorData = (row: StfMainMotorDataSection): StfMainMotorDataApi =>
  omitEmpty({
    propellantWeightKg: numOrOmit(row.PROPELLANT_WEIGHT_KG),
    avgBemBurnRateMmS: numOrOmit(row.AVG_BEM_BURN_RATE_MM_S),
    nValue: numOrOmit(row.N_VALUE),
    propellantDensity: numOrOmit(row.PROPELLANT_DENSITY),
    gamma: numOrOmit(row.GAMMA),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildMainBallisticParameters = (
  rows: StfMainBallisticRow[],
): StfMainBallisticParameterApi[] =>
  rows
    .map((row) =>
      omitEmpty({
        parameter: row.PARAMETER.trim() || undefined,
        channel1: row.CHANNEL_1.trim() || undefined,
        qaRemarks: row.QA_REMARKS.trim() || undefined,
      }),
    )
    .filter((row) => Object.keys(row).length > 0);

const buildMainBurnRate = (row: StfMainBurnRate): StfMainBurnRateApi =>
  omitEmpty({
    burnRateMmS: numOrOmit(row.BURN_RATE_MM_S),
    pressureAbsKsc: numOrOmit(row.PRESSURE_ABS_KSC),
    nValue: numOrOmit(row.N_VALUE),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildBemTestHeader = (row: StfBemTestHeader): StfBemTestHeaderApi =>
  omitEmpty({
    loadingNo: row.LOADING_NO.trim() || undefined,
    firingNo: row.FIRING_NO.trim() || undefined,
    firingDate: toApiDateTime(row.FIRING_DATE) || undefined,
    temperature: numOrOmit(row.TEMPERATURE),
    rh: numOrOmit(row.RH),
    wtOfGrain: row.WT_OF_GRAIN.trim() || undefined,
    grainConfiguration: row.GRAIN_CONFIGURATION.trim() || undefined,
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildBemIgniterDetails = (row: StfBemIgniterDetails): StfBemIgniterDetailsApi =>
  omitEmpty({
    type: row.TYPE.trim() || undefined,
    srNoAndLotNo: row.SR_NO_AND_LOT_NO.trim() || undefined,
    chargeMassGm: numOrOmit(row.CHARGE_MASS_GM),
    composition: row.COMPOSITION.trim() || undefined,
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildBemNozzleDetails = (row: StfBemNozzleDetails): StfBemNozzleDetailsApi =>
  omitEmpty({
    beforeDt: numOrOmit(row.BEFORE_DT),
    beforeDe: numOrOmit(row.BEFORE_DE),
    afterDt: numOrOmit(row.AFTER_DT),
    afterDe: numOrOmit(row.AFTER_DE),
    nozzleClosureThicknessMm: numOrOmit(row.NOZZLE_CLOSURE_THICKNESS_MM),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildBemData = (row: StfBemDataSection): StfBemDataApi =>
  omitEmpty({
    propellantWeightKg: numOrOmit(row.PROPELLANT_WEIGHT_KG),
    conditioningTemperature: numOrOmit(row.CONDITIONING_TEMPERATURE),
    nValue: numOrOmit(row.N_VALUE),
    webThicknessAverageMin: numOrOmit(row.WEB_THICKNESS_AVERAGE_MIN),
    webThicknessStdDev: numOrOmit(row.WEB_THICKNESS_STD_DEV),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const buildBemBallisticParameters = (
  rows: StfBemBallisticRow[],
): StfBemBallisticParameterApi[] =>
  rows
    .map((row) =>
      omitEmpty({
        parameter: row.PARAMETER.trim() || undefined,
        channel1: row.CHANNEL_1.trim() || undefined,
        channel2: row.CHANNEL_2.trim() || undefined,
        qaRemarks: row.QA_REMARKS.trim() || undefined,
      }),
    )
    .filter((row) => Object.keys(row).length > 0);

const buildBemBurnRate = (row: StfBemBurnRate): StfBemBurnRateApi =>
  omitEmpty({
    burnRateMmS: numOrOmit(row.BURN_RATE_MM_S),
    pressureAbsKsc: numOrOmit(row.PRESSURE_ABS_KSC),
    qaRemarks: row.QA_REMARKS.trim() || undefined,
  });

const hasNestedDtoShape = (details: Record<string, unknown>, variant: StfMotorDataVariant) => {
  if (variant === "BEM") {
    return Boolean(
      details.testHeader ||
        details.igniterDetails ||
        details.nozzleDetails ||
        details.bemData ||
        details.ballisticParameters ||
        details.burnRate,
    );
  }
  return Boolean(
    details.testHeader ||
      details.nozzleDetails ||
      details.mainMotorData ||
      details.ballisticParameters ||
      details.burnRate,
  );
};

const parseMainTestHeader = (
  preset: StfMainTestHeader,
  source?: Record<string, unknown>,
): StfMainTestHeader => ({
  ...mapRowFields(preset, {
    AMBIENT_TEMPERATURE: pickField(source ?? {}, "ambientTemperature", "AMBIENT_TEMPERATURE"),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  }),
  FIRING_DATE:
    toUiDateTime(pickField(source ?? {}, "firingDate", "FIRING_DATE")) ||
    str(pickField(source ?? {}, "firingDate", "FIRING_DATE")),
});

const parseMainNozzleDetails = (
  preset: StfMainNozzleDetails,
  source?: Record<string, unknown>,
): StfMainNozzleDetails =>
  mapRowFields(preset, {
    BEFORE_DT: pickField(source ?? {}, "beforeDt", "BEFORE_DT"),
    BEFORE_DE: pickField(source ?? {}, "beforeDe", "BEFORE_DE"),
    AFTER_DT: pickField(source ?? {}, "afterDt", "AFTER_DT"),
    AFTER_DE: pickField(source ?? {}, "afterDe", "AFTER_DE"),
    NOZZLE_EROSION_RATE_MM_S: pickField(
      source ?? {},
      "nozzleErosionRateMmS",
      "NOZZLE_EROSION_RATE_MM_S",
    ),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseMainMotorDataSection = (
  preset: StfMainMotorDataSection,
  source?: Record<string, unknown>,
): StfMainMotorDataSection =>
  mapRowFields(preset, {
    PROPELLANT_WEIGHT_KG: pickField(source ?? {}, "propellantWeightKg", "PROPELLANT_WEIGHT_KG"),
    AVG_BEM_BURN_RATE_MM_S: pickField(
      source ?? {},
      "avgBemBurnRateMmS",
      "AVG_BEM_BURN_RATE_MM_S",
    ),
    N_VALUE: pickField(source ?? {}, "nValue", "N_VALUE"),
    PROPELLANT_DENSITY: pickField(source ?? {}, "propellantDensity", "PROPELLANT_DENSITY"),
    GAMMA: pickField(source ?? {}, "gamma", "GAMMA"),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseMainBallisticParameters = (
  presetRows: StfMainBallisticRow[],
  savedRows: unknown,
): StfMainBallisticRow[] => {
  const rows = asArray(savedRows);
  const byParameter = new Map<string, Record<string, unknown>>();
  rows.forEach((row) => {
    const saved = asRecord(row);
    if (!saved) return;
    const key = str(pickField(saved, "parameter", "PARAMETER"));
    if (key) byParameter.set(key, saved);
  });
  return presetRows.map((preset, index) => {
    const saved = byParameter.get(preset.PARAMETER) ?? asRecord(rows[index]) ?? {};
    return {
      PARAMETER: preset.PARAMETER,
      PARAMETER_LABEL: preset.PARAMETER_LABEL,
      CHANNEL_1: str(pickField(saved, "channel1", "CHANNEL_1")),
      QA_REMARKS: str(pickField(saved, "qaRemarks", "QA_REMARKS")),
    };
  });
};

const parseMainBurnRate = (
  preset: StfMainBurnRate,
  source?: Record<string, unknown>,
): StfMainBurnRate =>
  mapRowFields(preset, {
    BURN_RATE_MM_S: pickField(source ?? {}, "burnRateMmS", "BURN_RATE_MM_S"),
    PRESSURE_ABS_KSC: pickField(source ?? {}, "pressureAbsKsc", "PRESSURE_ABS_KSC"),
    N_VALUE: pickField(source ?? {}, "nValue", "N_VALUE"),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseBemTestHeader = (
  preset: StfBemTestHeader,
  source?: Record<string, unknown>,
): StfBemTestHeader => ({
  ...mapRowFields(preset, {
    LOADING_NO: pickField(source ?? {}, "loadingNo", "LOADING_NO"),
    FIRING_NO: pickField(source ?? {}, "firingNo", "FIRING_NO"),
    TEMPERATURE: pickField(source ?? {}, "temperature", "TEMPERATURE"),
    RH: pickField(source ?? {}, "rh", "RH"),
    WT_OF_GRAIN: pickField(source ?? {}, "wtOfGrain", "WT_OF_GRAIN"),
    GRAIN_CONFIGURATION: pickField(source ?? {}, "grainConfiguration", "GRAIN_CONFIGURATION"),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  }),
  FIRING_DATE:
    toUiDateTime(pickField(source ?? {}, "firingDate", "FIRING_DATE")) ||
    str(pickField(source ?? {}, "firingDate", "FIRING_DATE")),
});

const parseBemIgniterDetails = (
  preset: StfBemIgniterDetails,
  source?: Record<string, unknown>,
): StfBemIgniterDetails =>
  mapRowFields(preset, {
    TYPE: pickField(source ?? {}, "type", "TYPE"),
    SR_NO_AND_LOT_NO: pickField(source ?? {}, "srNoAndLotNo", "SR_NO_AND_LOT_NO"),
    CHARGE_MASS_GM: pickField(source ?? {}, "chargeMassGm", "CHARGE_MASS_GM"),
    COMPOSITION: pickField(source ?? {}, "composition", "COMPOSITION"),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseBemNozzleDetails = (
  preset: StfBemNozzleDetails,
  source?: Record<string, unknown>,
): StfBemNozzleDetails =>
  mapRowFields(preset, {
    BEFORE_DT: pickField(source ?? {}, "beforeDt", "BEFORE_DT"),
    BEFORE_DE: pickField(source ?? {}, "beforeDe", "BEFORE_DE"),
    AFTER_DT: pickField(source ?? {}, "afterDt", "AFTER_DT"),
    AFTER_DE: pickField(source ?? {}, "afterDe", "AFTER_DE"),
    NOZZLE_CLOSURE_THICKNESS_MM: pickField(
      source ?? {},
      "nozzleClosureThicknessMm",
      "NOZZLE_CLOSURE_THICKNESS_MM",
    ),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseBemData = (
  preset: StfBemDataSection,
  source?: Record<string, unknown>,
): StfBemDataSection =>
  mapRowFields(preset, {
    PROPELLANT_WEIGHT_KG: pickField(source ?? {}, "propellantWeightKg", "PROPELLANT_WEIGHT_KG"),
    CONDITIONING_TEMPERATURE: pickField(
      source ?? {},
      "conditioningTemperature",
      "CONDITIONING_TEMPERATURE",
    ),
    N_VALUE: pickField(source ?? {}, "nValue", "N_VALUE"),
    WEB_THICKNESS_AVERAGE_MIN: pickField(
      source ?? {},
      "webThicknessAverageMin",
      "WEB_THICKNESS_AVERAGE_MIN",
    ),
    WEB_THICKNESS_STD_DEV: pickField(
      source ?? {},
      "webThicknessStdDev",
      "WEB_THICKNESS_STD_DEV",
    ),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseBemBallisticParameters = (
  presetRows: StfBemBallisticRow[],
  savedRows: unknown,
): StfBemBallisticRow[] => {
  const rows = asArray(savedRows);
  const byParameter = new Map<string, Record<string, unknown>>();
  rows.forEach((row) => {
    const saved = asRecord(row);
    if (!saved) return;
    const key = str(pickField(saved, "parameter", "PARAMETER"));
    if (key) byParameter.set(key, saved);
  });
  return presetRows.map((preset, index) => {
    const saved = byParameter.get(preset.PARAMETER) ?? asRecord(rows[index]) ?? {};
    return {
      PARAMETER: preset.PARAMETER,
      PARAMETER_LABEL: preset.PARAMETER_LABEL,
      CHANNEL_1: str(pickField(saved, "channel1", "CHANNEL_1")),
      CHANNEL_2: str(pickField(saved, "channel2", "CHANNEL_2")),
      QA_REMARKS: str(pickField(saved, "qaRemarks", "QA_REMARKS")),
    };
  });
};

const parseBemBurnRate = (
  preset: StfBemBurnRate,
  source?: Record<string, unknown>,
): StfBemBurnRate =>
  mapRowFields(preset, {
    BURN_RATE_MM_S: pickField(source ?? {}, "burnRateMmS", "BURN_RATE_MM_S"),
    PRESSURE_ABS_KSC: pickField(source ?? {}, "pressureAbsKsc", "PRESSURE_ABS_KSC"),
    QA_REMARKS: pickField(source ?? {}, "qaRemarks", "QA_REMARKS"),
  });

const parseBemFromNestedDto = (details: Record<string, unknown>): StfBemMotorData => {
  const empty = createEmptyStfBemMotorData();
  return {
    variant: "BEM",
    TEST_HEADER: parseBemTestHeader(empty.TEST_HEADER, asRecord(details.testHeader) ?? undefined),
    IGNITER_DETAILS: parseBemIgniterDetails(
      empty.IGNITER_DETAILS,
      asRecord(details.igniterDetails) ?? undefined,
    ),
    NOZZLE_DETAILS: parseBemNozzleDetails(
      empty.NOZZLE_DETAILS,
      asRecord(details.nozzleDetails) ?? undefined,
    ),
    BEM_DATA: parseBemData(empty.BEM_DATA, asRecord(details.bemData) ?? undefined),
    BALLISTIC_PARAMETERS: parseBemBallisticParameters(
      empty.BALLISTIC_PARAMETERS,
      details.ballisticParameters,
    ),
    BURN_RATE: parseBemBurnRate(empty.BURN_RATE, asRecord(details.burnRate) ?? undefined),
  };
};

const parseMainFromNestedDto = (details: Record<string, unknown>): StfMainMotorData => {
  const empty = createEmptyStfMainMotorData();
  return {
    variant: "MAIN_MOTOR",
    TEST_HEADER: parseMainTestHeader(empty.TEST_HEADER, asRecord(details.testHeader) ?? undefined),
    NOZZLE_DETAILS: parseMainNozzleDetails(
      empty.NOZZLE_DETAILS,
      asRecord(details.nozzleDetails) ?? undefined,
    ),
    MAIN_MOTOR_DATA: parseMainMotorDataSection(
      empty.MAIN_MOTOR_DATA,
      asRecord(details.mainMotorData) ?? undefined,
    ),
    BALLISTIC_PARAMETERS: parseMainBallisticParameters(
      empty.BALLISTIC_PARAMETERS,
      details.ballisticParameters,
    ),
    BURN_RATE: parseMainBurnRate(empty.BURN_RATE, asRecord(details.burnRate) ?? undefined),
  };
};

const parseFromNestedDto = (
  details: Record<string, unknown>,
  variant: StfMotorDataVariant,
): StfMotorData => {
  if (variant === "BEM") {
    return parseBemFromNestedDto(details);
  }
  return parseMainFromNestedDto(details);
};

const collectStfFileRefsFromMotorData = (_data: StfMotorData | null | undefined): FileRef[] => [];

export const parseStfMotorDataFromApi = (
  motor: Record<string, unknown> | null | undefined,
  variant: StfMotorDataVariant,
): StfMotorData => {
  const staticDetails = asRecord(motor?.staticTestingDetails) ?? asRecord(motor);
  if (staticDetails && hasNestedDtoShape(staticDetails, variant)) {
    return parseFromNestedDto(staticDetails, variant);
  }

  // No legacy section remapping — empty form when nested DTO is absent.
  return createEmptyStfMotorData(variant);
};

export const buildStfMotorStaticTestingDetails = (
  data: StfMotorData,
): StfStaticTestingDetailsApi => {
  if (data.variant === "MAIN_MOTOR") {
    const ballistic = buildMainBallisticParameters(data.BALLISTIC_PARAMETERS);
    return omitEmpty({
      testHeader: buildMainTestHeader(data.TEST_HEADER),
      nozzleDetails: buildMainNozzleDetails(data.NOZZLE_DETAILS),
      mainMotorData: buildMainMotorData(data.MAIN_MOTOR_DATA),
      ballisticParameters: ballistic.length ? ballistic : undefined,
      burnRate: buildMainBurnRate(data.BURN_RATE),
    }) as StfMainStaticTestingDetailsApi;
  }

  const ballistic = buildBemBallisticParameters(data.BALLISTIC_PARAMETERS);
  return omitEmpty({
    testHeader: buildBemTestHeader(data.TEST_HEADER),
    igniterDetails: buildBemIgniterDetails(data.IGNITER_DETAILS),
    nozzleDetails: buildBemNozzleDetails(data.NOZZLE_DETAILS),
    bemData: buildBemData(data.BEM_DATA),
    ballisticParameters: ballistic.length ? ballistic : undefined,
    burnRate: buildBemBurnRate(data.BURN_RATE),
  }) as StfBemStaticTestingDetailsApi;
};

export const collectStfFileRefsFromForm = (form: {
  motors?: Array<{ stfData?: StfMotorData | null }>;
}): FileRef[] => {
  const refs: FileRef[] = [];
  for (const motor of form?.motors ?? []) {
    refs.push(...collectStfFileRefsFromMotorData(motor.stfData));
  }
  return refs;
};

export const hasIncompleteStfUploads = (form: {
  motors?: Array<{ stfData?: StfMotorData | null }>;
}): boolean => collectStfFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromStfForm = (form: {
  motors?: Array<{ stfData?: StfMotorData | null }>;
}): string[] =>
  [
    ...new Set(
      collectStfFileRefsFromForm(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];
