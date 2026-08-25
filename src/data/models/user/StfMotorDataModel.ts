import {
  asArray,
  asRecord,
  pickField,
  str,
  toApiDate,
  toApiDateTime,
  toApiNumber,
  toUiDate,
  toUiDateTime,
} from "./castingCuringFieldCodec";
import {
  isFileUploadIncomplete,
  parseFileRefs,
  toFileIdPayloadOrNull,
  type FileIdPayload,
  type FileRef,
} from "../common/FileUploadModel";

export type StfMotorDataVariant = "MAIN_MOTOR" | "BEM";

type LegacySection = { sectionId: string; sectionData: Record<string, unknown>[] };

const SENSOR_CHANNELS = ["PR1", "PR2", "TH1", "TH2", "FP"] as const;
const GRAIN_SIDES = ["Side I", "Side II"] as const;

export type StfMainIgniterRow = {
  CONTAINER_TYPE: string;
  COMPOSITION: string;
  WEIGHT_OF_COMPOSITION: string;
  SQUIB_RESISTANCE: string;
  REMARKS: string;
};

export type StfMainNozzleRow = {
  NOZZLE_CLOSURE_MATERIAL: string;
  MOTHER_GRAPHITE: string;
  NOZZLE_INSERT: string;
  DT_BEFORE: string;
  DE_BEFORE: string;
  DT_AFTER: string;
  DE_AFTER: string;
  REMARKS: string;
};

export type StfMainTestingDetails = {
  THROAT_DIAMETER: string;
  PROPELLANT_WEIGHT: string;
  WEB_THICKNESS: string;
  N_VALUE: string;
  CONDITIONING_TEMPERATURE: string;
  AMBIENT_TEMPERATURE: string;
  RH_PERCENT: string;
};

export type StfMainSensorRow = {
  CHANNEL: string;
  SENSOR: string;
  SENSITIVITY: string;
  MAX_EXPECTED: string;
  SENSOR_RANGE: string;
  FILTER_HZ: string;
  IA_NO: string;
  IA_GAIN: string;
  EXT_VOLTAGE: string;
  OFFSET_VALUE: string;
  PRELOADING: string;
};

export type StfMainResultRow = {
  AVERAGE_PRESSURE: string;
  PEAK_PRESSURE: string;
  TB: string;
  BURN_RATE: string;
  C_STAR: string;
  ISP: string;
};

export type StfMainMotorData = {
  variant: "MAIN_MOTOR";
  IGNITER_DETAILS: StfMainIgniterRow;
  NOZZLE_DETAILS: StfMainNozzleRow;
  TESTING_DETAILS: StfMainTestingDetails;
  SENSOR_CONFIGURATION: StfMainSensorRow[];
  STATIC_TEST_RESULT: StfMainResultRow;
  UPLOAD_PT_CURVE: { PT_CURVE_FILE: FileRef[] };
};

export type StfBemConditioningDetails = {
  FROM_DATE_TIME: string;
  TO_DATE_TIME: string;
  TEMPERATURE: string;
  RH: string;
  OBSERVATION: string;
};

export type StfBemGrainRow = {
  SIDE: string;
  OD: string;
  A: string;
  B: string;
  C: string;
  LENGTH: string;
  WEIGHT: string;
};

export type StfBemHardwareDetails = {
  HEAD_END_NO: string;
  NOZZLE_END_NO: string;
  RETAINER_RING_NO: string;
  CASING_NO: string;
  CASING_OD: string;
  CASING_ID: string;
  CASING_LENGTH: string;
  FIRING_NO: string;
};

export type StfBemIgniterDetails = StfMainIgniterRow;

export type StfBemNozzleRow = {
  NOZZLE_CLOSURE_MATERIAL: string;
  THROAT_MATERIAL: string;
  MOTHER_GRAPHITE: string;
  NOZZLE_INSERT: string;
  BEFORE_D1: string;
  BEFORE_D2: string;
  AFTER_D1: string;
  AFTER_D2: string;
  REMARKS: string;
};

export type StfBemTestingDetails = {
  THROAT_DIAMETER: string;
  WT_OF_PROPELLANT: string;
  WEB_THICKNESS: string;
  N_VALUE: string;
  CONDITIONING_TEMP: string;
  AMBIENT_TEMP: string;
  RH: string;
};

export type StfBemSensorRow = {
  CHANNEL: string;
  SENSOR: string;
  SENSITIVITY: string;
  MAX_RANGE: string;
  SENSOR_RANGE: string;
  FILTER_HZ: string;
  IA_NO: string;
  IA_GAIN: string;
  EXT_V: string;
  OFFSET_VALUE: string;
  PRELOADING: string;
};

export type StfBemResultRow = {
  AVG_PRESSURE: string;
  PEAK_PRESSURE: string;
  TB: string;
  BURN_RATE: string;
  C_STAR: string;
  ISP: string;
};

export type StfBemMotorData = {
  variant: "BEM";
  CONDITIONING_DETAILS: StfBemConditioningDetails;
  GRAIN_DIMENSION: StfBemGrainRow[];
  BEM_HARDWARE_DETAILS: StfBemHardwareDetails;
  IGNITER_DETAILS: StfBemIgniterDetails;
  NOZZLE_DETAILS: StfBemNozzleRow;
  TESTING_DETAILS: StfBemTestingDetails;
  SENSOR_CONFIGURATION: StfBemSensorRow[];
  RESULT_DETAILS: StfBemResultRow;
  UPLOAD_PT_CURVE: { PT_CURVE_UPLOAD: FileRef[] };
};

export type StfMotorData = StfMainMotorData | StfBemMotorData;

export type StfIgniterDetailsApi = {
  containerType?: string;
  composition?: string;
  weightOfComposition?: number;
  squibResistance?: number;
  remarks?: string;
};

export type StfMainNozzleDetailsApi = {
  nozzleClosureMaterial?: string;
  motherGraphite?: string;
  nozzleInsert?: string;
  dtBefore?: number;
  deBefore?: number;
  dtAfter?: number;
  deAfter?: number;
  remarks?: string;
};

export type StfBemNozzleDetailsApi = {
  nozzleClosureMaterial?: string;
  throatMaterial?: number;
  motherGraphite?: string;
  nozzleInsert?: string;
  beforeD1?: number;
  beforeD2?: number;
  afterD1?: number;
  afterD2?: number;
  remarks?: string;
};

export type StfTestingDetailsApi = {
  throatDiameter?: number;
  propellantWeight?: number;
  webThickness?: number;
  nValue?: number;
  conditioningTemperature?: number;
  ambientTemperature?: number;
  rhPercent?: number;
};

export type StfSensorConfigurationApi = {
  channel?: string;
  sensor?: string;
  sensitivity?: number;
  maxExpected?: number;
  sensorRange?: number;
  filterHz?: number;
  iaNo?: string;
  iaGain?: number;
  extVoltage?: number;
  offsetValue?: number;
  preloading?: number;
};

export type StfResultDetailsApi = {
  averagePressure?: number;
  peakPressure?: number;
  tb?: number;
  burnRate?: number;
  cStar?: number;
  isp?: number;
};

export type StfConditioningDetailsApi = {
  fromDateTime?: string;
  toDateTime?: string;
  temperature?: number;
  rh?: number;
  observation?: string;
};

export type StfGrainDimensionApi = {
  side?: string;
  od?: number;
  a?: number;
  b?: number;
  c?: number;
  length?: number;
  weight?: number;
};

export type StfBemHardwareDetailsApi = {
  headEndNo?: string;
  nozzleEndNo?: string;
  retainerRingNo?: string;
  casingNo?: string;
  casingOd?: number;
  casingId?: number;
  casingLength?: number;
  firingNo?: string;
};

export type StfStaticTestingDetailsApi = {
  igniterDetails?: StfIgniterDetailsApi;
  nozzleDetails?: StfMainNozzleDetailsApi | StfBemNozzleDetailsApi;
  testingDetails?: StfTestingDetailsApi;
  sensorConfigurations?: StfSensorConfigurationApi[];
  resultDetails?: StfResultDetailsApi;
  ptCurveFile?: FileIdPayload;
  conditioningDetails?: StfConditioningDetailsApi;
  grainDimensions?: StfGrainDimensionApi[];
  bemHardwareDetails?: StfBemHardwareDetailsApi;
};

const emptyStr = () => "";

const createMainSensorRows = (): StfMainSensorRow[] =>
  SENSOR_CHANNELS.map((channel) => ({
    CHANNEL: channel,
    SENSOR: "",
    SENSITIVITY: "",
    MAX_EXPECTED: "",
    SENSOR_RANGE: "",
    FILTER_HZ: "",
    IA_NO: "",
    IA_GAIN: "",
    EXT_VOLTAGE: "",
    OFFSET_VALUE: "",
    PRELOADING: "",
  }));

const createBemSensorRows = (): StfBemSensorRow[] =>
  SENSOR_CHANNELS.map((channel) => ({
    CHANNEL: channel,
    SENSOR: "",
    SENSITIVITY: "",
    MAX_RANGE: "",
    SENSOR_RANGE: "",
    FILTER_HZ: "",
    IA_NO: "",
    IA_GAIN: "",
    EXT_V: "",
    OFFSET_VALUE: "",
    PRELOADING: "",
  }));

const createGrainRows = (): StfBemGrainRow[] =>
  GRAIN_SIDES.map((side) => ({
    SIDE: side,
    OD: "",
    A: "",
    B: "",
    C: "",
    LENGTH: "",
    WEIGHT: "",
  }));

export const createEmptyStfMainMotorData = (): StfMainMotorData => ({
  variant: "MAIN_MOTOR",
  IGNITER_DETAILS: {
    CONTAINER_TYPE: "",
    COMPOSITION: "",
    WEIGHT_OF_COMPOSITION: "",
    SQUIB_RESISTANCE: "",
    REMARKS: "",
  },
  NOZZLE_DETAILS: {
    NOZZLE_CLOSURE_MATERIAL: "",
    MOTHER_GRAPHITE: "",
    NOZZLE_INSERT: "",
    DT_BEFORE: "",
    DE_BEFORE: "",
    DT_AFTER: "",
    DE_AFTER: "",
    REMARKS: "",
  },
  TESTING_DETAILS: {
    THROAT_DIAMETER: "",
    PROPELLANT_WEIGHT: "",
    WEB_THICKNESS: "",
    N_VALUE: "",
    CONDITIONING_TEMPERATURE: "",
    AMBIENT_TEMPERATURE: "",
    RH_PERCENT: "",
  },
  SENSOR_CONFIGURATION: createMainSensorRows(),
  STATIC_TEST_RESULT: {
    AVERAGE_PRESSURE: "",
    PEAK_PRESSURE: "",
    TB: "",
    BURN_RATE: "",
    C_STAR: "",
    ISP: "",
  },
  UPLOAD_PT_CURVE: { PT_CURVE_FILE: [] },
});

export const createEmptyStfBemMotorData = (): StfBemMotorData => ({
  variant: "BEM",
  CONDITIONING_DETAILS: {
    FROM_DATE_TIME: "",
    TO_DATE_TIME: "",
    TEMPERATURE: "",
    RH: "",
    OBSERVATION: "",
  },
  GRAIN_DIMENSION: createGrainRows(),
  BEM_HARDWARE_DETAILS: {
    HEAD_END_NO: "",
    NOZZLE_END_NO: "",
    RETAINER_RING_NO: "",
    CASING_NO: "",
    CASING_OD: "",
    CASING_ID: "",
    CASING_LENGTH: "",
    FIRING_NO: "",
  },
  IGNITER_DETAILS: {
    CONTAINER_TYPE: "",
    COMPOSITION: "",
    WEIGHT_OF_COMPOSITION: "",
    SQUIB_RESISTANCE: "",
    REMARKS: "",
  },
  NOZZLE_DETAILS: {
    NOZZLE_CLOSURE_MATERIAL: "",
    THROAT_MATERIAL: "",
    MOTHER_GRAPHITE: "",
    NOZZLE_INSERT: "",
    BEFORE_D1: "",
    BEFORE_D2: "",
    AFTER_D1: "",
    AFTER_D2: "",
    REMARKS: "",
  },
  TESTING_DETAILS: {
    THROAT_DIAMETER: "",
    WT_OF_PROPELLANT: "",
    WEB_THICKNESS: "",
    N_VALUE: "",
    CONDITIONING_TEMP: "",
    AMBIENT_TEMP: "",
    RH: "",
  },
  SENSOR_CONFIGURATION: createBemSensorRows(),
  RESULT_DETAILS: {
    AVG_PRESSURE: "",
    PEAK_PRESSURE: "",
    TB: "",
    BURN_RATE: "",
    C_STAR: "",
    ISP: "",
  },
  UPLOAD_PT_CURVE: { PT_CURVE_UPLOAD: [] },
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
      if (key === "CHANNEL" || key === "SIDE" || key === "variant") return false;
      return hasUserContent(entry);
    });
  }
  return false;
};

export const stfMotorDataHasUserInput = (data: StfMotorData | null | undefined): boolean =>
  Boolean(data && hasUserContent(data));

const sectionRow = (sections: LegacySection[] | undefined, sectionId: string) => {
  const section = (sections ?? []).find((entry) => entry.sectionId === sectionId);
  return asRecord(asArray(section?.sectionData)[0]) ?? {};
};

const nestedTableRows = (row: Record<string, unknown>, sectionId: string): unknown[] => {
  const nested = row[sectionId];
  if (Array.isArray(nested)) return nested;
  return asArray(nested);
};

const mapRowFields = <T extends Record<string, string>>(
  preset: T,
  saved: Record<string, unknown>,
): T => {
  const next = { ...preset };
  (Object.keys(preset) as Array<keyof T>).forEach((key) => {
    const value = pickField(saved, String(key));
    if (value !== undefined && value !== null) {
      next[key] = str(value) as T[keyof T];
    }
  });
  return next;
};

const mapTableRows = <T extends Record<string, string>>(
  presetRows: T[],
  savedRows: unknown,
  readonlyKeys: Array<keyof T> = [],
): T[] => {
  const rows = asArray(savedRows);
  if (!rows.length) return presetRows;
  return presetRows.map((preset, index) => {
    const saved = asRecord(rows[index]) ?? {};
    const merged = mapRowFields(preset, saved);
    readonlyKeys.forEach((key) => {
      merged[key] = preset[key];
    });
    return merged;
  });
};

const extractSections = (motor?: Record<string, unknown> | null): LegacySection[] => {
  const staticDetails = asRecord(motor?.staticTestingDetails) ?? asRecord(motor);
  const formSections = staticDetails?.formSections;
  if (Array.isArray(formSections) && formSections.length) {
    return formSections as LegacySection[];
  }
  if (Array.isArray(motor?.sections) && motor.sections.length) {
    return motor.sections as LegacySection[];
  }
  return [];
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

const buildIgniterDetails = (row: StfMainIgniterRow): StfIgniterDetailsApi =>
  omitEmpty({
    containerType: row.CONTAINER_TYPE.trim() || undefined,
    composition: row.COMPOSITION.trim() || undefined,
    weightOfComposition: numOrOmit(row.WEIGHT_OF_COMPOSITION),
    squibResistance: numOrOmit(row.SQUIB_RESISTANCE),
    remarks: row.REMARKS.trim() || undefined,
  });

const buildMainNozzleDetails = (row: StfMainNozzleRow): StfMainNozzleDetailsApi =>
  omitEmpty({
    nozzleClosureMaterial: row.NOZZLE_CLOSURE_MATERIAL.trim() || undefined,
    motherGraphite: row.MOTHER_GRAPHITE.trim() || undefined,
    nozzleInsert: row.NOZZLE_INSERT.trim() || undefined,
    dtBefore: numOrOmit(row.DT_BEFORE),
    deBefore: numOrOmit(row.DE_BEFORE),
    dtAfter: numOrOmit(row.DT_AFTER),
    deAfter: numOrOmit(row.DE_AFTER),
    remarks: row.REMARKS.trim() || undefined,
  });

const buildBemNozzleDetails = (row: StfBemNozzleRow): StfBemNozzleDetailsApi =>
  omitEmpty({
    nozzleClosureMaterial: row.NOZZLE_CLOSURE_MATERIAL.trim() || undefined,
    throatMaterial: numOrOmit(row.THROAT_MATERIAL),
    motherGraphite: row.MOTHER_GRAPHITE.trim() || undefined,
    nozzleInsert: row.NOZZLE_INSERT.trim() || undefined,
    beforeD1: numOrOmit(row.BEFORE_D1),
    beforeD2: numOrOmit(row.BEFORE_D2),
    afterD1: numOrOmit(row.AFTER_D1),
    afterD2: numOrOmit(row.AFTER_D2),
    remarks: row.REMARKS.trim() || undefined,
  });

const buildMainTestingDetails = (row: StfMainTestingDetails): StfTestingDetailsApi =>
  omitEmpty({
    throatDiameter: numOrOmit(row.THROAT_DIAMETER),
    propellantWeight: numOrOmit(row.PROPELLANT_WEIGHT),
    webThickness: numOrOmit(row.WEB_THICKNESS),
    nValue: numOrOmit(row.N_VALUE),
    conditioningTemperature: numOrOmit(row.CONDITIONING_TEMPERATURE),
    ambientTemperature: numOrOmit(row.AMBIENT_TEMPERATURE),
    rhPercent: numOrOmit(row.RH_PERCENT),
  });

const buildBemTestingDetails = (row: StfBemTestingDetails): StfTestingDetailsApi =>
  omitEmpty({
    throatDiameter: numOrOmit(row.THROAT_DIAMETER),
    propellantWeight: numOrOmit(row.WT_OF_PROPELLANT),
    webThickness: numOrOmit(row.WEB_THICKNESS),
    nValue: numOrOmit(row.N_VALUE),
    conditioningTemperature: numOrOmit(row.CONDITIONING_TEMP),
    ambientTemperature: numOrOmit(row.AMBIENT_TEMP),
    rhPercent: numOrOmit(row.RH),
  });

const buildMainSensorConfigurations = (
  rows: StfMainSensorRow[],
): StfSensorConfigurationApi[] =>
  rows
    .map((row) =>
      omitEmpty({
        channel: row.CHANNEL.trim() || undefined,
        sensor: row.SENSOR.trim() || undefined,
        sensitivity: numOrOmit(row.SENSITIVITY),
        maxExpected: numOrOmit(row.MAX_EXPECTED),
        sensorRange: numOrOmit(row.SENSOR_RANGE),
        filterHz: numOrOmit(row.FILTER_HZ),
        iaNo: row.IA_NO.trim() || undefined,
        iaGain: numOrOmit(row.IA_GAIN),
        extVoltage: numOrOmit(row.EXT_VOLTAGE),
        offsetValue: numOrOmit(row.OFFSET_VALUE),
        preloading: numOrOmit(row.PRELOADING),
      }),
    )
    .filter((row) => Object.keys(row).length > 0);

const buildBemSensorConfigurations = (rows: StfBemSensorRow[]): StfSensorConfigurationApi[] =>
  rows
    .map((row) =>
      omitEmpty({
        channel: row.CHANNEL.trim() || undefined,
        sensor: row.SENSOR.trim() || undefined,
        sensitivity: numOrOmit(row.SENSITIVITY),
        maxExpected: numOrOmit(row.MAX_RANGE),
        sensorRange: numOrOmit(row.SENSOR_RANGE),
        filterHz: numOrOmit(row.FILTER_HZ),
        iaNo: row.IA_NO.trim() || undefined,
        iaGain: numOrOmit(row.IA_GAIN),
        extVoltage: numOrOmit(row.EXT_V),
        offsetValue: numOrOmit(row.OFFSET_VALUE),
        preloading: numOrOmit(row.PRELOADING),
      }),
    )
    .filter((row) => Object.keys(row).length > 0);

const buildMainResultDetails = (row: StfMainResultRow): StfResultDetailsApi =>
  omitEmpty({
    averagePressure: numOrOmit(row.AVERAGE_PRESSURE),
    peakPressure: numOrOmit(row.PEAK_PRESSURE),
    tb: numOrOmit(row.TB),
    burnRate: numOrOmit(row.BURN_RATE),
    cStar: numOrOmit(row.C_STAR),
    isp: numOrOmit(row.ISP),
  });

const buildBemResultDetails = (row: StfBemResultRow): StfResultDetailsApi =>
  omitEmpty({
    averagePressure: numOrOmit(row.AVG_PRESSURE),
    peakPressure: numOrOmit(row.PEAK_PRESSURE),
    tb: numOrOmit(row.TB),
    burnRate: numOrOmit(row.BURN_RATE),
    cStar: numOrOmit(row.C_STAR),
    isp: numOrOmit(row.ISP),
  });

const buildConditioningDetails = (row: StfBemConditioningDetails): StfConditioningDetailsApi =>
  omitEmpty({
    fromDateTime: toApiDateTime(row.FROM_DATE_TIME),
    toDateTime: toApiDateTime(row.TO_DATE_TIME),
    temperature: numOrOmit(row.TEMPERATURE),
    rh: numOrOmit(row.RH),
    observation: row.OBSERVATION.trim() || undefined,
  });

const buildGrainDimensions = (rows: StfBemGrainRow[]): StfGrainDimensionApi[] =>
  rows
    .map((row) =>
      omitEmpty({
        side: row.SIDE.trim() || undefined,
        od: numOrOmit(row.OD),
        a: numOrOmit(row.A),
        b: numOrOmit(row.B),
        c: numOrOmit(row.C),
        length: numOrOmit(row.LENGTH),
        weight: numOrOmit(row.WEIGHT),
      }),
    )
    .filter((row) => Object.keys(row).length > 0);

const buildBemHardwareDetails = (row: StfBemHardwareDetails): StfBemHardwareDetailsApi =>
  omitEmpty({
    headEndNo: row.HEAD_END_NO.trim() || undefined,
    nozzleEndNo: row.NOZZLE_END_NO.trim() || undefined,
    retainerRingNo: row.RETAINER_RING_NO.trim() || undefined,
    casingNo: row.CASING_NO.trim() || undefined,
    casingOd: numOrOmit(row.CASING_OD),
    casingId: numOrOmit(row.CASING_ID),
    casingLength: numOrOmit(row.CASING_LENGTH),
    firingNo: row.FIRING_NO.trim() || undefined,
  });

const hasNestedDtoShape = (details: Record<string, unknown>) =>
  Boolean(
    details.igniterDetails ||
      details.nozzleDetails ||
      details.testingDetails ||
      details.sensorConfigurations ||
      details.resultDetails ||
      details.conditioningDetails ||
      details.grainDimensions ||
      details.bemHardwareDetails ||
      details.ptCurveFile,
  );

const parseIgniterDetails = (
  preset: StfMainIgniterRow,
  source?: Record<string, unknown>,
): StfMainIgniterRow =>
  mapRowFields(preset, {
    CONTAINER_TYPE: pickField(source ?? {}, "containerType", "CONTAINER_TYPE"),
    COMPOSITION: pickField(source ?? {}, "composition", "COMPOSITION"),
    WEIGHT_OF_COMPOSITION: pickField(source ?? {}, "weightOfComposition", "WEIGHT_OF_COMPOSITION"),
    SQUIB_RESISTANCE: pickField(source ?? {}, "squibResistance", "SQUIB_RESISTANCE"),
    REMARKS: pickField(source ?? {}, "remarks", "REMARKS"),
  });

const parseMainNozzleDetails = (
  preset: StfMainNozzleRow,
  source?: Record<string, unknown>,
): StfMainNozzleRow =>
  mapRowFields(preset, {
    NOZZLE_CLOSURE_MATERIAL: pickField(source ?? {}, "nozzleClosureMaterial", "NOZZLE_CLOSURE_MATERIAL"),
    MOTHER_GRAPHITE: pickField(source ?? {}, "motherGraphite", "MOTHER_GRAPHITE"),
    NOZZLE_INSERT: pickField(source ?? {}, "nozzleInsert", "NOZZLE_INSERT"),
    DT_BEFORE: pickField(source ?? {}, "dtBefore", "DT_BEFORE"),
    DE_BEFORE: pickField(source ?? {}, "deBefore", "DE_BEFORE"),
    DT_AFTER: pickField(source ?? {}, "dtAfter", "DT_AFTER"),
    DE_AFTER: pickField(source ?? {}, "deAfter", "DE_AFTER"),
    REMARKS: pickField(source ?? {}, "remarks", "REMARKS"),
  });

const parseBemNozzleDetails = (
  preset: StfBemNozzleRow,
  source?: Record<string, unknown>,
): StfBemNozzleRow =>
  mapRowFields(preset, {
    NOZZLE_CLOSURE_MATERIAL: pickField(source ?? {}, "nozzleClosureMaterial", "NOZZLE_CLOSURE_MATERIAL"),
    THROAT_MATERIAL: pickField(source ?? {}, "throatMaterial", "THROAT_MATERIAL"),
    MOTHER_GRAPHITE: pickField(source ?? {}, "motherGraphite", "MOTHER_GRAPHITE"),
    NOZZLE_INSERT: pickField(source ?? {}, "nozzleInsert", "NOZZLE_INSERT"),
    BEFORE_D1: pickField(source ?? {}, "beforeD1", "BEFORE_D1"),
    BEFORE_D2: pickField(source ?? {}, "beforeD2", "BEFORE_D2"),
    AFTER_D1: pickField(source ?? {}, "afterD1", "AFTER_D1"),
    AFTER_D2: pickField(source ?? {}, "afterD2", "AFTER_D2"),
    REMARKS: pickField(source ?? {}, "remarks", "REMARKS"),
  });

const parseTestingDetailsMain = (
  preset: StfMainTestingDetails,
  source?: Record<string, unknown>,
): StfMainTestingDetails =>
  mapRowFields(preset, {
    THROAT_DIAMETER: pickField(source ?? {}, "throatDiameter", "THROAT_DIAMETER"),
    PROPELLANT_WEIGHT: pickField(source ?? {}, "propellantWeight", "PROPELLANT_WEIGHT"),
    WEB_THICKNESS: pickField(source ?? {}, "webThickness", "WEB_THICKNESS"),
    N_VALUE: pickField(source ?? {}, "nValue", "N_VALUE"),
    CONDITIONING_TEMPERATURE: pickField(
      source ?? {},
      "conditioningTemperature",
      "CONDITIONING_TEMPERATURE",
    ),
    AMBIENT_TEMPERATURE: pickField(source ?? {}, "ambientTemperature", "AMBIENT_TEMPERATURE"),
    RH_PERCENT: pickField(source ?? {}, "rhPercent", "RH_PERCENT"),
  });

const parseTestingDetailsBem = (
  preset: StfBemTestingDetails,
  source?: Record<string, unknown>,
): StfBemTestingDetails =>
  mapRowFields(preset, {
    THROAT_DIAMETER: pickField(source ?? {}, "throatDiameter", "THROAT_DIAMETER"),
    WT_OF_PROPELLANT: pickField(source ?? {}, "propellantWeight", "WT_OF_PROPELLANT", "PROPELLANT_WEIGHT"),
    WEB_THICKNESS: pickField(source ?? {}, "webThickness", "WEB_THICKNESS"),
    N_VALUE: pickField(source ?? {}, "nValue", "N_VALUE"),
    CONDITIONING_TEMP: pickField(source ?? {}, "conditioningTemperature", "CONDITIONING_TEMP", "CONDITIONING_TEMPERATURE"),
    AMBIENT_TEMP: pickField(source ?? {}, "ambientTemperature", "AMBIENT_TEMP", "AMBIENT_TEMPERATURE"),
    RH: pickField(source ?? {}, "rhPercent", "RH", "RH_PERCENT"),
  });

const parseMainSensorConfigurations = (
  presetRows: StfMainSensorRow[],
  savedRows: unknown,
): StfMainSensorRow[] => {
  const rows = asArray(savedRows);
  return presetRows.map((preset, index) => {
    const saved = asRecord(rows[index]) ?? {};
    return {
      CHANNEL: preset.CHANNEL,
      SENSOR: str(pickField(saved, "sensor", "SENSOR")),
      SENSITIVITY: str(pickField(saved, "sensitivity", "SENSITIVITY")),
      MAX_EXPECTED: str(pickField(saved, "maxExpected", "MAX_EXPECTED", "MAX_RANGE")),
      SENSOR_RANGE: str(pickField(saved, "sensorRange", "SENSOR_RANGE")),
      FILTER_HZ: str(pickField(saved, "filterHz", "FILTER_HZ")),
      IA_NO: str(pickField(saved, "iaNo", "IA_NO")),
      IA_GAIN: str(pickField(saved, "iaGain", "IA_GAIN")),
      EXT_VOLTAGE: str(pickField(saved, "extVoltage", "EXT_VOLTAGE", "EXT_V")),
      OFFSET_VALUE: str(pickField(saved, "offsetValue", "OFFSET_VALUE")),
      PRELOADING: str(pickField(saved, "preloading", "PRELOADING")),
    };
  });
};

const parseBemSensorConfigurations = (
  presetRows: StfBemSensorRow[],
  savedRows: unknown,
): StfBemSensorRow[] => {
  const rows = asArray(savedRows);
  return presetRows.map((preset, index) => {
    const saved = asRecord(rows[index]) ?? {};
    return {
      CHANNEL: preset.CHANNEL,
      SENSOR: str(pickField(saved, "sensor", "SENSOR")),
      SENSITIVITY: str(pickField(saved, "sensitivity", "SENSITIVITY")),
      MAX_RANGE: str(pickField(saved, "maxExpected", "MAX_RANGE", "MAX_EXPECTED")),
      SENSOR_RANGE: str(pickField(saved, "sensorRange", "SENSOR_RANGE")),
      FILTER_HZ: str(pickField(saved, "filterHz", "FILTER_HZ")),
      IA_NO: str(pickField(saved, "iaNo", "IA_NO")),
      IA_GAIN: str(pickField(saved, "iaGain", "IA_GAIN")),
      EXT_V: str(pickField(saved, "extVoltage", "EXT_V", "EXT_VOLTAGE")),
      OFFSET_VALUE: str(pickField(saved, "offsetValue", "OFFSET_VALUE")),
      PRELOADING: str(pickField(saved, "preloading", "PRELOADING")),
    };
  });
};

const parseMainResultDetails = (
  preset: StfMainResultRow,
  source?: Record<string, unknown>,
): StfMainResultRow =>
  mapRowFields(preset, {
    AVERAGE_PRESSURE: pickField(source ?? {}, "averagePressure", "AVERAGE_PRESSURE", "AVG_PRESSURE"),
    PEAK_PRESSURE: pickField(source ?? {}, "peakPressure", "PEAK_PRESSURE"),
    TB: pickField(source ?? {}, "tb", "TB"),
    BURN_RATE: pickField(source ?? {}, "burnRate", "BURN_RATE"),
    C_STAR: pickField(source ?? {}, "cStar", "C_STAR"),
    ISP: pickField(source ?? {}, "isp", "ISP"),
  });

const parseBemResultDetails = (
  preset: StfBemResultRow,
  source?: Record<string, unknown>,
): StfBemResultRow =>
  mapRowFields(preset, {
    AVG_PRESSURE: pickField(source ?? {}, "averagePressure", "AVG_PRESSURE", "AVERAGE_PRESSURE"),
    PEAK_PRESSURE: pickField(source ?? {}, "peakPressure", "PEAK_PRESSURE"),
    TB: pickField(source ?? {}, "tb", "TB"),
    BURN_RATE: pickField(source ?? {}, "burnRate", "BURN_RATE"),
    C_STAR: pickField(source ?? {}, "cStar", "C_STAR"),
    ISP: pickField(source ?? {}, "isp", "ISP"),
  });

const parseFromNestedDto = (
  details: Record<string, unknown>,
  variant: StfMotorDataVariant,
): StfMotorData => {
  const igniter = asRecord(details.igniterDetails);
  const nozzle = asRecord(details.nozzleDetails);
  const testing = asRecord(details.testingDetails);
  const sensors = details.sensorConfigurations;
  const results = asRecord(details.resultDetails);
  const ptCurveFile = parseFileRefs(
    details.ptCurveFile ?? pickField(details, "ptCurveUpload", "PT_CURVE_FILE"),
  );

  if (variant === "MAIN_MOTOR") {
    const empty = createEmptyStfMainMotorData();
    return {
      variant: "MAIN_MOTOR",
      IGNITER_DETAILS: parseIgniterDetails(empty.IGNITER_DETAILS, igniter ?? undefined),
      NOZZLE_DETAILS: parseMainNozzleDetails(empty.NOZZLE_DETAILS, nozzle ?? undefined),
      TESTING_DETAILS: parseTestingDetailsMain(empty.TESTING_DETAILS, testing ?? undefined),
      SENSOR_CONFIGURATION: parseMainSensorConfigurations(empty.SENSOR_CONFIGURATION, sensors),
      STATIC_TEST_RESULT: parseMainResultDetails(empty.STATIC_TEST_RESULT, results ?? undefined),
      UPLOAD_PT_CURVE: { PT_CURVE_FILE: ptCurveFile },
    };
  }

  const empty = createEmptyStfBemMotorData();
  const conditioning = asRecord(details.conditioningDetails);
  const hardware = asRecord(details.bemHardwareDetails);
  const grainDimensions = details.grainDimensions ?? details.grainDimension;

  return {
    variant: "BEM",
    CONDITIONING_DETAILS: {
      ...mapRowFields(empty.CONDITIONING_DETAILS, {
        TEMPERATURE: pickField(conditioning ?? {}, "temperature", "TEMPERATURE"),
        RH: pickField(conditioning ?? {}, "rh", "RH"),
        OBSERVATION: pickField(conditioning ?? {}, "observation", "OBSERVATION"),
      }),
      FROM_DATE_TIME:
        toUiDateTime(pickField(conditioning ?? {}, "fromDateTime", "FROM_DATE_TIME")) ||
        str(pickField(conditioning ?? {}, "fromDateTime", "FROM_DATE_TIME")),
      TO_DATE_TIME:
        toUiDateTime(pickField(conditioning ?? {}, "toDateTime", "TO_DATE_TIME")) ||
        str(pickField(conditioning ?? {}, "toDateTime", "TO_DATE_TIME")),
    },
    GRAIN_DIMENSION: mapTableRows(
      empty.GRAIN_DIMENSION,
      grainDimensions,
      ["SIDE"],
    ),
    BEM_HARDWARE_DETAILS: mapRowFields(empty.BEM_HARDWARE_DETAILS, {
      HEAD_END_NO: pickField(hardware ?? {}, "headEndNo", "HEAD_END_NO"),
      NOZZLE_END_NO: pickField(hardware ?? {}, "nozzleEndNo", "NOZZLE_END_NO"),
      RETAINER_RING_NO: pickField(hardware ?? {}, "retainerRingNo", "RETAINER_RING_NO"),
      CASING_NO: pickField(hardware ?? {}, "casingNo", "CASING_NO"),
      CASING_OD: pickField(hardware ?? {}, "casingOd", "CASING_OD"),
      CASING_ID: pickField(hardware ?? {}, "casingId", "CASING_ID"),
      CASING_LENGTH: pickField(hardware ?? {}, "casingLength", "CASING_LENGTH"),
      FIRING_NO: pickField(hardware ?? {}, "firingNo", "FIRING_NO"),
    }),
    IGNITER_DETAILS: parseIgniterDetails(empty.IGNITER_DETAILS, igniter ?? undefined),
    NOZZLE_DETAILS: parseBemNozzleDetails(empty.NOZZLE_DETAILS, nozzle ?? undefined),
    TESTING_DETAILS: parseTestingDetailsBem(empty.TESTING_DETAILS, testing ?? undefined),
    SENSOR_CONFIGURATION: parseBemSensorConfigurations(empty.SENSOR_CONFIGURATION, sensors),
    RESULT_DETAILS: parseBemResultDetails(empty.RESULT_DETAILS, results ?? undefined),
    UPLOAD_PT_CURVE: { PT_CURVE_UPLOAD: ptCurveFile },
  };
};

const collectStfFileRefsFromMotorData = (data: StfMotorData | null | undefined): FileRef[] => {
  if (!data) return [];
  if (data.variant === "MAIN_MOTOR") return data.UPLOAD_PT_CURVE.PT_CURVE_FILE ?? [];
  return data.UPLOAD_PT_CURVE.PT_CURVE_UPLOAD ?? [];
};

export const parseStfMotorDataFromApi = (
  motor: Record<string, unknown> | null | undefined,
  variant: StfMotorDataVariant,
): StfMotorData => {
  const staticDetails = asRecord(motor?.staticTestingDetails) ?? asRecord(motor);
  if (staticDetails && hasNestedDtoShape(staticDetails)) {
    return parseFromNestedDto(staticDetails, variant);
  }

  const sections = extractSections(motor);
  if (variant === "MAIN_MOTOR") {
    const empty = createEmptyStfMainMotorData();
    const igniter = sectionRow(sections, "IGNITER_DETAILS");
    const nozzle = sectionRow(sections, "NOZZLE_DETAILS");
    const testing = sectionRow(sections, "TESTING_DETAILS");
    const sensor = sectionRow(sections, "SENSOR_CONFIGURATION");
    const resultRow = sectionRow(sections, "STATIC_TEST_RESULT");
    const result =
      Object.keys(resultRow).length > 0 ? resultRow : sectionRow(sections, "RESULT_DETAILS");
    const upload = sectionRow(sections, "UPLOAD_PT_CURVE");
    return {
      variant: "MAIN_MOTOR",
      IGNITER_DETAILS: mapRowFields(empty.IGNITER_DETAILS, igniter),
      NOZZLE_DETAILS: mapRowFields(empty.NOZZLE_DETAILS, nozzle),
      TESTING_DETAILS: mapRowFields(empty.TESTING_DETAILS, testing),
      SENSOR_CONFIGURATION: mapTableRows(
        empty.SENSOR_CONFIGURATION,
        nestedTableRows(sensor, "SENSOR_CONFIGURATION").length
          ? nestedTableRows(sensor, "SENSOR_CONFIGURATION")
          : sensor.SENSOR_CONFIGURATION ?? sensor.rows,
        ["CHANNEL"],
      ),
      STATIC_TEST_RESULT: parseMainResultDetails(empty.STATIC_TEST_RESULT, result),
      UPLOAD_PT_CURVE: {
        PT_CURVE_FILE: parseFileRefs(pickField(upload, "PT_CURVE_FILE", "ptCurveFile")),
      },
    };
  }

  const empty = createEmptyStfBemMotorData();
  const conditioning = sectionRow(sections, "CONDITIONING_DETAILS");
  const grain = sectionRow(sections, "GRAIN_DIMENSION");
  const hardware = sectionRow(sections, "BEM_HARDWARE_DETAILS");
  const igniter = sectionRow(sections, "IGNITER_DETAILS");
  const nozzle = sectionRow(sections, "NOZZLE_DETAILS");
  const testing = sectionRow(sections, "TESTING_DETAILS");
  const sensor = sectionRow(sections, "SENSOR_CONFIGURATION");
  const result = sectionRow(sections, "RESULT_DETAILS");
  const upload = sectionRow(sections, "UPLOAD_PT_CURVE");

  return {
    variant: "BEM",
    CONDITIONING_DETAILS: {
      ...mapRowFields(empty.CONDITIONING_DETAILS, conditioning),
      FROM_DATE_TIME: toUiDate(pickField(conditioning, "FROM_DATE_TIME", "fromDateTime")) || str(pickField(conditioning, "FROM_DATE_TIME")),
      TO_DATE_TIME: toUiDate(pickField(conditioning, "TO_DATE_TIME", "toDateTime")) || str(pickField(conditioning, "TO_DATE_TIME")),
    },
    GRAIN_DIMENSION: mapTableRows(
      empty.GRAIN_DIMENSION,
      nestedTableRows(grain, "GRAIN_DIMENSION").length
        ? nestedTableRows(grain, "GRAIN_DIMENSION")
        : grain.GRAIN_DIMENSION ?? grain.rows,
      ["SIDE"],
    ),
    BEM_HARDWARE_DETAILS: mapRowFields(empty.BEM_HARDWARE_DETAILS, hardware),
    IGNITER_DETAILS: mapRowFields(empty.IGNITER_DETAILS, igniter),
    NOZZLE_DETAILS: mapRowFields(empty.NOZZLE_DETAILS, nozzle),
    TESTING_DETAILS: mapRowFields(empty.TESTING_DETAILS, testing),
    SENSOR_CONFIGURATION: mapTableRows(
      empty.SENSOR_CONFIGURATION,
      nestedTableRows(sensor, "SENSOR_CONFIGURATION").length
        ? nestedTableRows(sensor, "SENSOR_CONFIGURATION")
        : sensor.SENSOR_CONFIGURATION ?? sensor.rows,
      ["CHANNEL"],
    ),
    RESULT_DETAILS: mapRowFields(empty.RESULT_DETAILS, result),
    UPLOAD_PT_CURVE: {
      PT_CURVE_UPLOAD: parseFileRefs(
        pickField(upload, "PT_CURVE_UPLOAD", "ptCurveUpload", "PT_CURVE_FILE", "ptCurveFile"),
      ),
    },
  };
};

export const buildStfMotorStaticTestingDetails = (
  data: StfMotorData,
): StfStaticTestingDetailsApi => {
  if (data.variant === "MAIN_MOTOR") {
    const sensors = buildMainSensorConfigurations(data.SENSOR_CONFIGURATION);
    return omitEmpty({
      igniterDetails: buildIgniterDetails(data.IGNITER_DETAILS),
      nozzleDetails: buildMainNozzleDetails(data.NOZZLE_DETAILS),
      testingDetails: buildMainTestingDetails(data.TESTING_DETAILS),
      sensorConfigurations: sensors.length ? sensors : undefined,
      resultDetails: buildMainResultDetails(data.STATIC_TEST_RESULT),
      ptCurveFile: toFileIdPayloadOrNull(data.UPLOAD_PT_CURVE.PT_CURVE_FILE) ?? undefined,
    }) as StfStaticTestingDetailsApi;
  }

  const sensors = buildBemSensorConfigurations(data.SENSOR_CONFIGURATION);
  const grains = buildGrainDimensions(data.GRAIN_DIMENSION);
  return omitEmpty({
    conditioningDetails: buildConditioningDetails(data.CONDITIONING_DETAILS),
    grainDimensions: grains.length ? grains : undefined,
    bemHardwareDetails: buildBemHardwareDetails(data.BEM_HARDWARE_DETAILS),
    igniterDetails: buildIgniterDetails(data.IGNITER_DETAILS),
    nozzleDetails: buildBemNozzleDetails(data.NOZZLE_DETAILS),
    testingDetails: buildBemTestingDetails(data.TESTING_DETAILS),
    sensorConfigurations: sensors.length ? sensors : undefined,
    resultDetails: buildBemResultDetails(data.RESULT_DETAILS),
    ptCurveFile: toFileIdPayloadOrNull(data.UPLOAD_PT_CURVE.PT_CURVE_UPLOAD) ?? undefined,
  }) as StfStaticTestingDetailsApi;
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
