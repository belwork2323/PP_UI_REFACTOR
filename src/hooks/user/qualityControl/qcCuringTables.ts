import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  toApiDate,
  toApiDateTime,
  toApiTime,
} from "../../../data/models/user/castingCuringFieldCodec";
import { formatToUiDate } from "../../../utils/dateUtils";
import {
  QC_CURING_CYCLE_PRESET_ROWS,
  QC_CURING_SECTION_IDS,
  QC_CURING_SUBSCALE_PARAMETER_PRESET_ROWS,
  formatQcSubscaleArticleTypeLabel,
  subscaleArticleTypeSortOrder,
  normalizeQcCuringType,
  toQcSubscaleArticleTypeApi,
  type QcCuringSetupField,
  type QcCuringSubType,
  curingSubTypeShowsPeakPressureAchieved,
  curingSubTypeShowsPropellantPressure,
} from "./qcCuringConfig";

export type QcCuringMotorSubmissionType = "DRAFT" | "SUBMIT";

export const QC_CURING_API_SECTION_IDS = {
  CURING_TABLE: "CURING_TABLE",
  POST_CURING: "POST_CURING_DETAILS",
  SUBSCALE: "SUBSCALE_ARTICLES_CURING",
} as const;

export type QcCuringCycleRow = {
  SR_NO?: number | string;
  TEMPERATURE?: string;
  DURATION?: string;
  START_DATE?: string;
  START_TIME?: string;
  END_DATE?: string;
  END_TIME?: string;
  ACTUAL_DURATION?: string;
  PROPELLANT_PRESSURE?: string;
  PEAK_PRESSURE_ACHIEVED?: string;
  HOT_WATER_STATUS?: string;
  REMARKS?: string;
};

export type QcCuringPressureRow = {
  PEAK_PRESSURE?: string;
  TEMPERATURE?: string;
  TIME?: string;
};

export type QcCuringSubscaleParameterRow = {
  SR_NO?: number | string;
  OVEN_NO?: string;
  ARTICLE_TYPE?: string;
  PARAMETER?: string;
  BEM_NO?: string;
  WHEEL_PEEL_NO?: string;
  CARTON_NO?: string;
  CONTROL_GRAIN_NO?: string;
};

export type QcCuringSubscaleField =
  | "NUMBER_OF_OVENS"
  | "CURING_START_DATE"
  | "CYCLE_START_TIME"
  | "CURING_COMPLETE_DATE"
  | "CYCLE_END_TIME"
  | "BEM_AVERAGE_SHORE_A_HARDNESS"
  | "CARTON_AVERAGE_SHORE_A_HARDNESS"
  | "SUBSCALE_VISUAL_OBSERVATIONS";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const normalizeRows = <T extends { SR_NO?: number | string }>(rows: T[]) =>
  rows.map((row, index) => ({
    ...row,
    SR_NO: row.SR_NO ?? index + 1,
  }));

const readTableRows = <T extends Record<string, unknown>>(
  values: SchemaFormValues | null | undefined,
  key: string,
  fallback: T[],
): T[] => {
  const raw = values?.[key];
  if (Array.isArray(raw) && raw.length) {
    return raw.filter((row) => row && typeof row === "object") as T[];
  }
  const rec = asRecord(raw);
  if (rec && Array.isArray(rec.rows) && rec.rows.length) {
    return rec.rows.filter((row) => row && typeof row === "object") as T[];
  }
  return fallback;
};

const emptyCycleRow = (srNo: number, preset?: Partial<QcCuringCycleRow>): QcCuringCycleRow => ({
  SR_NO: srNo,
  TEMPERATURE: "",
  DURATION: "",
  START_DATE: "",
  START_TIME: "",
  END_DATE: "",
  END_TIME: "",
  ACTUAL_DURATION: "",
  PROPELLANT_PRESSURE: "",
  PEAK_PRESSURE_ACHIEVED: "",
  HOT_WATER_STATUS: "",
  REMARKS: "",
  ...preset,
});

/** Empty cycle rows only — manufacturing/API seed fills real values (no Amb-40 presets). */
const defaultCycleRows = (): QcCuringCycleRow[] =>
  Array.from({ length: Math.max(1, QC_CURING_CYCLE_PRESET_ROWS.length) }, (_, index) =>
    emptyCycleRow(index + 1),
  );

const normalizeCycleTimeValue = (value: unknown): string => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const emptyPressureRow = (): QcCuringPressureRow => ({
  PEAK_PRESSURE: "",
  TEMPERATURE: "",
  TIME: "",
});

const emptySubscaleParameterRow = (srNo: number, preset?: Partial<QcCuringSubscaleParameterRow>) => ({
  SR_NO: srNo,
  OVEN_NO: "",
  ARTICLE_TYPE: "",
  PARAMETER: "",
  BEM_NO: "",
  WHEEL_PEEL_NO: "",
  CARTON_NO: "",
  CONTROL_GRAIN_NO: "",
  ...preset,
});

const defaultSubscaleParameterRows = (): QcCuringSubscaleParameterRow[] =>
  QC_CURING_SUBSCALE_PARAMETER_PRESET_ROWS.map((row) =>
    emptySubscaleParameterRow(Number(row.SR_NO), row),
  );

const TEMPERATURE_API_ALIASES = ["parameter", "PARAMETER", "temperature", "TEMPERATURE"] as const;

const pickApiTemperatureValue = (row: Record<string, unknown>): string => {
  for (const key of TEMPERATURE_API_ALIASES) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const raw = String(value).trim();
    if (raw) return raw;
  }
  return "";
};

const pickApiBemMouldNo = (row: Record<string, unknown>): string => {
  for (const key of ["bemMouldNo", "BEM_MOULD_NO", "bemNo", "BEM_NO"] as const) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const raw = String(value).trim();
    if (raw) return raw;
  }
  return "";
};

const pickApiOptionalString = (row: Record<string, unknown>, keys: readonly string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const raw = String(value).trim();
    if (raw) return raw;
  }
  return "";
};

/** One row per article: Article Type, Parameter, mould no under BEM No. only. */
export const mapApiSubscaleCuringTableToParameterRows = (
  curingTable: unknown[],
): QcCuringSubscaleParameterRow[] => {
  const presetRows = defaultSubscaleParameterRows();
  const articles = curingTable
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .sort(
      (left, right) =>
        subscaleArticleTypeSortOrder(left.articleType ?? left.ARTICLE_TYPE) -
        subscaleArticleTypeSortOrder(right.articleType ?? right.ARTICLE_TYPE),
    );

  if (!articles.length) return presetRows;

  const mappedRows = articles.map((article, index) => {
    const articleType = article.articleType ?? article.ARTICLE_TYPE;
    return {
      SR_NO: index + 1,
      OVEN_NO: "",
      ARTICLE_TYPE: formatQcSubscaleArticleTypeLabel(articleType),
      PARAMETER: pickApiTemperatureValue(article),
      // Manufacturing sends bemMouldNo for every article — always show under BEM No.
      BEM_NO: pickApiBemMouldNo(article),
      WHEEL_PEEL_NO: pickApiOptionalString(article, ["wheelPeelNo", "WHEEL_PEEL_NO"]),
      CARTON_NO: pickApiOptionalString(article, ["cartonNo", "CARTON_NO"]),
      CONTROL_GRAIN_NO: pickApiOptionalString(article, ["controlGrainNo", "CONTROL_GRAIN_NO"]),
    };
  });

  while (mappedRows.length < presetRows.length) {
    mappedRows.push({
      ...presetRows[mappedRows.length],
      SR_NO: mappedRows.length + 1,
    });
  }

  return mappedRows.slice(0, Math.max(mappedRows.length, presetRows.length));
};

export const createInitialCuringValues = (_subType?: QcCuringSubType | ""): SchemaFormValues => ({
  [formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "MOTOR_STAGE")]: "",
  [formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "CURING_TYPE")]: _subType ? String(_subType) : "",
  [formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "OVEN")]: "",
  [formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "OVEN_NUMBER")]: "",
  [formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "MOTOR_POSITIONING_DATE_TIME")]: "",
  [formKey(QC_CURING_SECTION_IDS.CYCLE_DETAILS, "CURING_CYCLE_DETAILS")]: defaultCycleRows(),
  [formKey(QC_CURING_SECTION_IDS.PRESSURE_DETAILS, "PRESSURE_CURING_DETAILS")]: [
    emptyPressureRow(),
  ],
  [formKey(QC_CURING_SECTION_IDS.POST_CURING, "VISUAL_OBSERVATIONS")]: "",
  [formKey(QC_CURING_SECTION_IDS.POST_CURING, "PRESSURE_PLATE_REMOVAL_DATE_TIME")]: "",
  [formKey(QC_CURING_SECTION_IDS.POST_CURING, "SHORE_A_HARDNESS")]: "",
  [formKey(QC_CURING_SECTION_IDS.POST_CURING, "DISPATCH_DATE_TIME")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "NUMBER_OF_OVENS")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_PARAMETER_TABLE")]: defaultSubscaleParameterRows(),
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_START_DATE")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CYCLE_START_TIME")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_COMPLETE_DATE")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CYCLE_END_TIME")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "BEM_AVERAGE_SHORE_A_HARDNESS")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CARTON_AVERAGE_SHORE_A_HARDNESS")]: "",
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "SUBSCALE_VISUAL_OBSERVATIONS")]: "",
});

const getField = (values: SchemaFormValues | null | undefined, sectionId: string, field: string) =>
  String(values?.[formKey(sectionId, field)] ?? "");

const setField = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  field: string,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(sectionId, field)]: value,
});

export const getCuringSetupField = (
  values: SchemaFormValues | null | undefined,
  field: QcCuringSetupField,
) => getField(values, QC_CURING_SECTION_IDS.MOTOR_SETUP, field);

export const setCuringSetupField = (
  values: SchemaFormValues | null | undefined,
  field: QcCuringSetupField,
  value: string,
) => setField(values, QC_CURING_SECTION_IDS.MOTOR_SETUP, field, value);

export const getCuringTypeFromValues = (
  values: SchemaFormValues | null | undefined,
  fallback?: string | null,
): QcCuringSubType | "" =>
  normalizeQcCuringType(getCuringSetupField(values, "CURING_TYPE")) ||
  normalizeQcCuringType(fallback) ||
  "";

export const curingValuesShowPressureDetails = (
  values: SchemaFormValues | null | undefined,
  fallbackSubType?: string | null,
) => curingSubTypeShowsPeakPressureAchieved(getCuringTypeFromValues(values, fallbackSubType));

export const getCuringCycleRows = (values: SchemaFormValues | null | undefined): QcCuringCycleRow[] =>
  normalizeRows(
    readTableRows<QcCuringCycleRow>(
      values,
      formKey(QC_CURING_SECTION_IDS.CYCLE_DETAILS, "CURING_CYCLE_DETAILS"),
      defaultCycleRows(),
    ),
  );

export const setCuringCycleRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCuringCycleRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CURING_SECTION_IDS.CYCLE_DETAILS, "CURING_CYCLE_DETAILS")]: normalizeRows(rows),
});

export const getCuringPressureRows = (
  values: SchemaFormValues | null | undefined,
): QcCuringPressureRow[] => {
  const rows = readTableRows<QcCuringPressureRow>(
    values,
    formKey(QC_CURING_SECTION_IDS.PRESSURE_DETAILS, "PRESSURE_CURING_DETAILS"),
    [emptyPressureRow()],
  );
  return rows.length ? rows : [emptyPressureRow()];
};

export const setCuringPressureRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCuringPressureRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CURING_SECTION_IDS.PRESSURE_DETAILS, "PRESSURE_CURING_DETAILS")]: rows.length
    ? rows
    : [emptyPressureRow()],
});

export const getCuringPostField = (
  values: SchemaFormValues | null | undefined,
  field:
    | "VISUAL_OBSERVATIONS"
    | "PRESSURE_PLATE_REMOVAL_DATE_TIME"
    | "SHORE_A_HARDNESS"
    | "DISPATCH_DATE_TIME",
) => getField(values, QC_CURING_SECTION_IDS.POST_CURING, field);

export const setCuringPostField = (
  values: SchemaFormValues | null | undefined,
  field:
    | "VISUAL_OBSERVATIONS"
    | "PRESSURE_PLATE_REMOVAL_DATE_TIME"
    | "SHORE_A_HARDNESS"
    | "DISPATCH_DATE_TIME",
  value: string,
) => setField(values, QC_CURING_SECTION_IDS.POST_CURING, field, value);

export const getCuringSubscaleField = (
  values: SchemaFormValues | null | undefined,
  field: QcCuringSubscaleField,
) => getField(values, QC_CURING_SECTION_IDS.SUBSCALE, field);

export const setCuringSubscaleField = (
  values: SchemaFormValues | null | undefined,
  field: QcCuringSubscaleField,
  value: string,
) => setField(values, QC_CURING_SECTION_IDS.SUBSCALE, field, value);

export const getCuringSubscaleParameterRows = (
  values: SchemaFormValues | null | undefined,
): QcCuringSubscaleParameterRow[] =>
  normalizeRows(
    readTableRows<QcCuringSubscaleParameterRow>(
      values,
      formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_PARAMETER_TABLE"),
      defaultSubscaleParameterRows(),
    ),
  );

export const setCuringSubscaleParameterRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCuringSubscaleParameterRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_PARAMETER_TABLE")]: normalizeRows(rows),
});

const cycleRowHasData = (row: QcCuringCycleRow) =>
  Object.entries(row).some(([key, value]) => key !== "SR_NO" && hasValue(value));

const pressureRowHasData = (row: QcCuringPressureRow) =>
  hasValue(row.PEAK_PRESSURE) || hasValue(row.TEMPERATURE) || hasValue(row.TIME);

const subscaleRowHasData = (row: QcCuringSubscaleParameterRow) =>
  Object.entries(row).some(([key, value]) => key !== "SR_NO" && hasValue(value));

const sanitizeCycleRows = (rows: QcCuringCycleRow[]) =>
  normalizeRows(rows.filter(cycleRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    TEMPERATURE: String(row.TEMPERATURE ?? "").trim(),
    DURATION: String(row.DURATION ?? "").trim(),
    START_DATE: String(row.START_DATE ?? "").trim(),
    START_TIME: String(row.START_TIME ?? "").trim(),
    END_DATE: String(row.END_DATE ?? "").trim(),
    END_TIME: String(row.END_TIME ?? "").trim(),
    ACTUAL_DURATION: String(row.ACTUAL_DURATION ?? "").trim(),
    PROPELLANT_PRESSURE: String(row.PROPELLANT_PRESSURE ?? "").trim(),
    PEAK_PRESSURE_ACHIEVED: String(row.PEAK_PRESSURE_ACHIEVED ?? "").trim(),
    HOT_WATER_STATUS: String(row.HOT_WATER_STATUS ?? "").trim(),
    REMARKS: String(row.REMARKS ?? "").trim(),
  }));

const sanitizePressureRows = (rows: QcCuringPressureRow[]) =>
  rows.filter(pressureRowHasData).map((row) => ({
    PEAK_PRESSURE: String(row.PEAK_PRESSURE ?? "").trim(),
    TEMPERATURE: String(row.TEMPERATURE ?? "").trim(),
    TIME: String(row.TIME ?? "").trim(),
  }));

const sanitizeSubscaleRows = (rows: QcCuringSubscaleParameterRow[]) =>
  normalizeRows(rows.filter(subscaleRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    OVEN_NO: String(row.OVEN_NO ?? "").trim(),
    ARTICLE_TYPE: String(row.ARTICLE_TYPE ?? "").trim(),
    PARAMETER: String(row.PARAMETER ?? "").trim(),
    BEM_NO: String(row.BEM_NO ?? "").trim(),
    WHEEL_PEEL_NO: String(row.WHEEL_PEEL_NO ?? "").trim(),
    CARTON_NO: String(row.CARTON_NO ?? "").trim(),
    CONTROL_GRAIN_NO: String(row.CONTROL_GRAIN_NO ?? "").trim(),
  }));

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const toApiScalar = (value: unknown): string | number | undefined => {
  const numeric = toFiniteNumber(value);
  if (numeric != null) return numeric;
  const raw = String(value ?? "").trim();
  return raw || undefined;
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== "" && value !== null),
  );

const mapCycleRowsForApi = (
  rows: ReturnType<typeof sanitizeCycleRows>,
  subType: string | null | undefined,
) =>
  rows.map((row) =>
    omitEmpty({
      srNo: toFiniteNumber(row.SR_NO) ?? row.SR_NO,
      temperature: toApiScalar(row.TEMPERATURE),
      time: toApiScalar(row.DURATION),
      startDate: toApiDate(row.START_DATE),
      startTime: toApiTime(row.START_TIME),
      endDate: toApiDate(row.END_DATE),
      endTime: toApiTime(row.END_TIME),
      actualDurationMinutes: toApiScalar(row.ACTUAL_DURATION),
      propellantPressure: curingSubTypeShowsPropellantPressure(subType)
        ? toApiScalar(row.PROPELLANT_PRESSURE)
        : undefined,
      peakPressureAchieved: curingSubTypeShowsPeakPressureAchieved(subType)
        ? toApiScalar(row.PEAK_PRESSURE_ACHIEVED)
        : undefined,
      hotWaterStatus: row.HOT_WATER_STATUS || undefined,
      remarks: row.REMARKS || undefined,
    }),
  );

/** Subscale curingTable: 6 UI columns only (mould IDs always under bemNo). */
const mapSubscaleRowsForApi = (rows: ReturnType<typeof sanitizeSubscaleRows>) =>
  rows.map((row) => ({
    articleType: toQcSubscaleArticleTypeApi(row.ARTICLE_TYPE) || null,
    parameter: toApiScalar(row.PARAMETER) ?? null,
    bemNo: row.BEM_NO || null,
    wheelPeelNo: row.WHEEL_PEEL_NO || null,
    cartonNo: row.CARTON_NO || null,
    controlGrainNo: row.CONTROL_GRAIN_NO || null,
  }));

const mapQcCuringTypeForApi = (subType: string) => {
  const normalized = normalizeQcCuringType(subType);
  if (normalized === "NORMAL") return "NORMAL_CURING";
  if (normalized === "CONFINED") return "CONFINED_CURING";
  if (normalized === "N2_PRESSURE") return "N2_PRESSURE_CURING";
  return normalized || undefined;
};

const buildSubscaleDetailsPayload = (values: SchemaFormValues | null | undefined) => {
  const ovenNumber =
    getCuringSubscaleField(values, "NUMBER_OF_OVENS") ||
    getCuringSetupField(values, "OVEN_NUMBER");
  const curingTable = mapSubscaleRowsForApi(sanitizeSubscaleRows(getCuringSubscaleParameterRows(values)));
  const subscale = {
    ovenNumber: ovenNumber || null,
    curingStartDate: toApiDate(getCuringSubscaleField(values, "CURING_START_DATE")) ?? null,
    cycleStartTime: toApiTime(getCuringSubscaleField(values, "CYCLE_START_TIME")) ?? null,
    curingCompleteDate: toApiDate(getCuringSubscaleField(values, "CURING_COMPLETE_DATE")) ?? null,
    cycleEndTime: toApiTime(getCuringSubscaleField(values, "CYCLE_END_TIME")) ?? null,
    bemAverageShoreAHardness:
      toApiScalar(getCuringSubscaleField(values, "BEM_AVERAGE_SHORE_A_HARDNESS")) ?? null,
    cartonAverageShoreAHardness:
      toApiScalar(getCuringSubscaleField(values, "CARTON_AVERAGE_SHORE_A_HARDNESS")) ?? null,
    visualObservations: getCuringSubscaleField(values, "SUBSCALE_VISUAL_OBSERVATIONS") || null,
    curingTable,
  };
  const hasScalar = [
    subscale.ovenNumber,
    subscale.curingStartDate,
    subscale.cycleStartTime,
    subscale.curingCompleteDate,
    subscale.cycleEndTime,
    subscale.bemAverageShoreAHardness,
    subscale.cartonAverageShoreAHardness,
    subscale.visualObservations,
  ].some((value) => value != null && value !== "");
  if (!hasScalar && !curingTable.length) return undefined;
  return subscale;
};

/** Nested QC create/update DTO for `data.curingDetails[]`. */
export const buildCuringMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcCuringMotorSubmissionType = "DRAFT",
  fallbackSubType?: string | null,
): Record<string, unknown> => {
  const curingType = getCuringTypeFromValues(values, fallbackSubType);
  const motorStage = getCuringSetupField(values, "MOTOR_STAGE");
  const oven = getCuringSetupField(values, "OVEN");
  const ovenNumber =
    getCuringSetupField(values, "OVEN_NUMBER") ||
    getCuringSubscaleField(values, "NUMBER_OF_OVENS");
  const motorPositioning = getCuringSetupField(values, "MOTOR_POSITIONING_DATE_TIME");

  const cycleRows = mapCycleRowsForApi(sanitizeCycleRows(getCuringCycleRows(values)), curingType);
  const visualObservation = getCuringPostField(values, "VISUAL_OBSERVATIONS");
  const postCuringDetails = omitEmpty({
    visualObservation: visualObservation || undefined,
    pressurePlateRemovalDateTime: toApiDateTime(
      getCuringPostField(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME"),
    ),
    shoreAHardness: toApiScalar(getCuringPostField(values, "SHORE_A_HARDNESS")),
    decoringDispatchDateTime: toApiDateTime(getCuringPostField(values, "DISPATCH_DATE_TIME")),
  });

  const subscaleDetails = buildSubscaleDetailsPayload(values);

  return omitEmpty({
    motorId,
    motorSubmissionType,
    motorStage: motorStage || undefined,
    curingType: curingType ? mapQcCuringTypeForApi(curingType) : undefined,
    oven: oven || undefined,
    ovenNumber: ovenNumber || undefined,
    motorReceivedAt: toApiDateTime(motorPositioning),
    curingSections: {
      curingCycles: { curingTable: cycleRows },
      ...(Object.keys(postCuringDetails).length ? { postCuringDetails } : {}),
    },
    ...(subscaleDetails ? { subscaleDetails } : {}),
  });
};

export const isCuringNestedMotorDetail = (rec: Record<string, unknown>) => {
  if (asRecord(rec.curingSetup) || asRecord(rec.curingSections) || asRecord(rec.subscaleDetails)) {
    return true;
  }
  if (Array.isArray(rec.curingSections)) return true;
  const details = asRecord(rec.details);
  return Boolean(
    asRecord(details?.curingSetup) ||
      asRecord(details?.curingSections) ||
      asRecord(details?.subscaleDetails),
  );
};

export const mapApiCuringCycleRowToForm = (
  row: Record<string, unknown>,
  index: number,
): QcCuringCycleRow => ({
  SR_NO: Number(row.srNo ?? row.SR_NO ?? index + 1),
  TEMPERATURE: String(row.temperature ?? row.TEMPERATURE ?? "").trim(),
  DURATION: String(
    row.durationMinutes ?? row.time ?? row.DURATION ?? row.TIME ?? "",
  ).trim(),
  START_DATE:
    formatToUiDate(String(row.startDate ?? row.START_DATE ?? "")) ||
    String(row.startDate ?? row.START_DATE ?? "").trim(),
  START_TIME: normalizeCycleTimeValue(row.startTime ?? row.START_TIME),
  END_DATE:
    formatToUiDate(String(row.endDate ?? row.END_DATE ?? "")) ||
    String(row.endDate ?? row.END_DATE ?? "").trim(),
  END_TIME: normalizeCycleTimeValue(row.endTime ?? row.END_TIME),
  ACTUAL_DURATION: String(row.actualDurationMinutes ?? row.ACTUAL_DURATION ?? "").trim(),
  PROPELLANT_PRESSURE: String(row.propellantPressure ?? row.PROPELLANT_PRESSURE ?? "").trim(),
  PEAK_PRESSURE_ACHIEVED: String(
    row.peakPressureAchieved ?? row.PEAK_PRESSURE_ACHIEVED ?? row.PEAK_PRESSURE ?? "",
  ).trim(),
  HOT_WATER_STATUS: String(
    row.hotWaterStatus ?? row.hotWaterCirculation ?? row.HOT_WATER_STATUS ?? "",
  ).trim(),
  REMARKS: String(row.remarks ?? row.REMARKS ?? "").trim(),
});

/** Flatten nested create/update curing motor into form sections for hydrate. */
export const curingMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];
  const nestedSections =
    asRecord(rec.curingSections) ?? asRecord(asRecord(rec.details)?.curingSections);
  if (nestedSections && !Array.isArray(rec.curingSections)) {
    const curingSetup = asRecord(rec.curingSetup) ?? asRecord(asRecord(rec.details)?.curingSetup);
    const setup = omitEmpty({
      MOTOR_STAGE: curingSetup?.configuration ?? rec.motorStage,
      CURING_TYPE: curingSetup?.curingType ?? rec.curingType,
      OVEN: curingSetup?.oven ?? rec.oven,
      OVEN_NUMBER:
        curingSetup?.ovenNo ?? curingSetup?.ovenNumber ?? rec.ovenNumber ?? rec.ovenNo,
      MOTOR_POSITIONING_DATE_TIME:
        rec.motorReceivedAt ??
        rec.motorPositioningDateTime ??
        curingSetup?.motorPositioningDateTime,
    });
    if (Object.keys(setup).length) {
      sections.push({
        sectionId: QC_CURING_SECTION_IDS.MOTOR_SETUP,
        sectionData: [setup],
        motorId,
      } as SchemaSectionSubmission);
    }

    const cycles = asRecord(nestedSections.curingCycles);
    const cycleRows = asArray(cycles?.curingTable)
      .map((row, index) => mapApiCuringCycleRowToForm(asRecord(row) ?? {}, index))
      .filter((row) => Object.values(row).some((value) => String(value ?? "").trim()));
    if (cycleRows.length) {
      sections.push({
        sectionId: QC_CURING_SECTION_IDS.CYCLE_DETAILS,
        sectionData: [{ CURING_CYCLE_DETAILS: cycleRows }],
        motorId,
      } as SchemaSectionSubmission);
    }

    const post = asRecord(nestedSections.postCuringDetails);
    if (post) {
      const visual = String(post.visualObservation ?? post.VISUAL_OBSERVATION ?? "").trim();
      const other = String(post.otherObservations ?? post.OTHER_OBSERVATIONS ?? "").trim();
      const visualCombined = [visual, other && other.toLowerCase() !== "na" ? other : ""]
        .filter(Boolean)
        .join("; ");
      sections.push({
        sectionId: QC_CURING_SECTION_IDS.POST_CURING,
        sectionData: [
          {
            VISUAL_OBSERVATIONS: visualCombined,
            PRESSURE_PLATE_REMOVAL_DATE_TIME: String(
              post.pressurePlateRemovalDateTime ?? post.PRESSURE_PLATE_REMOVAL_DATE_TIME ?? "",
            ),
            SHORE_A_HARDNESS: String(post.shoreAHardness ?? post.SHORE_A_HARDNESS ?? ""),
            DISPATCH_DATE_TIME: String(
              post.decoringDispatchDateTime ?? post.DISPATCH_DATE_TIME ?? "",
            ),
          },
        ],
        motorId,
      } as SchemaSectionSubmission);
    }

    const subscale =
      asRecord(rec.subscaleDetails) ??
      asRecord(asRecord(rec.details)?.subscaleDetails) ??
      {};
    const parameterRows = mapApiSubscaleCuringTableToParameterRows(asArray(subscale.curingTable));
    const subscaleSection = omitEmpty({
      NUMBER_OF_OVENS: String(
        subscale.ovenNumber ?? subscale.numberOfOvens ?? rec.ovenNumber ?? "",
      ),
      CURING_START_DATE: String(subscale.curingStartDate ?? ""),
      CYCLE_START_TIME: String(subscale.cycleStartTime ?? ""),
      CURING_COMPLETE_DATE: String(subscale.curingCompleteDate ?? ""),
      CYCLE_END_TIME: String(subscale.cycleEndTime ?? ""),
      BEM_AVERAGE_SHORE_A_HARDNESS: String(subscale.bemAverageShoreAHardness ?? ""),
      CARTON_AVERAGE_SHORE_A_HARDNESS: String(subscale.cartonAverageShoreAHardness ?? ""),
      SUBSCALE_VISUAL_OBSERVATIONS: String(subscale.visualObservations ?? ""),
      ...(parameterRows.some((row) => String(row.BEM_NO ?? "").trim() || String(row.PARAMETER ?? "").trim())
        ? { CURING_PARAMETER_TABLE: parameterRows }
        : {}),
    });
    if (Object.keys(subscaleSection).length) {
      sections.push({
        sectionId: QC_CURING_SECTION_IDS.SUBSCALE,
        sectionData: [subscaleSection],
        motorId,
      } as SchemaSectionSubmission);
    }

    return sections;
  }

  const setup = omitEmpty({
    MOTOR_STAGE: rec.motorStage,
    CURING_TYPE: rec.curingType,
    OVEN: rec.oven,
    OVEN_NUMBER: rec.ovenNumber,
    MOTOR_POSITIONING_DATE_TIME: rec.motorPositioningDateTime,
  });
  if (Object.keys(setup).length) {
    sections.push({
      sectionId: QC_CURING_SECTION_IDS.MOTOR_SETUP,
      sectionData: [setup],
      motorId,
    } as SchemaSectionSubmission);
  }

  const curingSections = [
    ...asArray(rec.curingSections),
    ...asArray(asRecord(rec.details)?.curingSections),
  ];
  for (const section of curingSections) {
    const sec = asRecord(section);
    if (!sec) continue;
    const sectionId = String(sec.sectionId ?? "").trim();
    const sectionData = asArray(sec.sectionData);

    if (sectionId === QC_CURING_API_SECTION_IDS.CURING_TABLE) {
      const rows = sectionData
        .map((row, index) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row))
        .map((row, index) => mapApiCuringCycleRowToForm(row, index));
      if (rows.length) {
        sections.push({
          sectionId: QC_CURING_SECTION_IDS.CYCLE_DETAILS,
          sectionData: [{ CURING_CYCLE_DETAILS: rows }],
          motorId,
        } as SchemaSectionSubmission);
      }
      continue;
    }

    if (sectionId === QC_CURING_API_SECTION_IDS.POST_CURING) {
      const post = asRecord(sectionData[0]) ?? {};
      sections.push({
        sectionId: QC_CURING_SECTION_IDS.POST_CURING,
        sectionData: [
          {
            VISUAL_OBSERVATIONS: String(post.visualObservations ?? post.VISUAL_OBSERVATIONS ?? ""),
            PRESSURE_PLATE_REMOVAL_DATE_TIME: String(
              post.pressurePlateRemovalDateTime ?? post.PRESSURE_PLATE_REMOVAL_DATE_TIME ?? "",
            ),
            SHORE_A_HARDNESS: String(post.shoreAHardness ?? post.SHORE_A_HARDNESS ?? ""),
            DISPATCH_DATE_TIME: String(
              post.deCoringDispatchDateTime ?? post.DISPATCH_DATE_TIME ?? "",
            ),
          },
        ],
        motorId,
      } as SchemaSectionSubmission);
      continue;
    }

    if (sectionId === QC_CURING_API_SECTION_IDS.SUBSCALE) {
      const subscale = asRecord(sectionData[0]) ?? {};
      const table = asArray(subscale.curingParameterTable ?? subscale.CURING_PARAMETER_TABLE);
      sections.push({
        sectionId: QC_CURING_SECTION_IDS.SUBSCALE,
        sectionData: [
          {
            NUMBER_OF_OVENS: String(subscale.numberOfOvens ?? subscale.NUMBER_OF_OVENS ?? ""),
            CURING_START_DATE: String(subscale.curingStartDate ?? subscale.CURING_START_DATE ?? ""),
            CYCLE_START_TIME: String(subscale.cycleStartTime ?? subscale.CYCLE_START_TIME ?? ""),
            CURING_COMPLETE_DATE: String(
              subscale.curingCompleteDate ?? subscale.CURING_COMPLETE_DATE ?? "",
            ),
            CYCLE_END_TIME: String(subscale.cycleEndTime ?? subscale.CYCLE_END_TIME ?? ""),
            BEM_AVERAGE_SHORE_A_HARDNESS: String(
              subscale.bemAverageShoreAHardness ?? subscale.BEM_AVERAGE_SHORE_A_HARDNESS ?? "",
            ),
            CARTON_AVERAGE_SHORE_A_HARDNESS: String(
              subscale.cartonAverageShoreAHardness ?? subscale.CARTON_AVERAGE_SHORE_A_HARDNESS ?? "",
            ),
            SUBSCALE_VISUAL_OBSERVATIONS: String(
              subscale.visualObservations ?? subscale.SUBSCALE_VISUAL_OBSERVATIONS ?? "",
            ),
            ...(table.length
              ? {
                  CURING_PARAMETER_TABLE: mapApiSubscaleCuringTableToParameterRows(table),
                }
              : {}),
          },
        ],
        motorId,
      } as SchemaSectionSubmission);
      continue;
    }

    sections.push({
      ...(sec as SchemaSectionSubmission),
      motorId,
    });
  }

  return sections;
};

/** Legacy section payload (internal hydrate / manufacturing seed). */
export const buildCuringSectionPayload = (
  values: SchemaFormValues | null | undefined,
  subType?: string | null,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];

  const setup: Record<string, string> = {};
  const curingType = getCuringTypeFromValues(values, subType);
  const motorStage = getCuringSetupField(values, "MOTOR_STAGE");
  const oven = getCuringSetupField(values, "OVEN");
  const ovenNumber = getCuringSetupField(values, "OVEN_NUMBER");
  const motorPositioning = getCuringSetupField(values, "MOTOR_POSITIONING_DATE_TIME");
  if (motorStage) setup.MOTOR_STAGE = motorStage;
  if (curingType) setup.CURING_TYPE = curingType;
  if (oven) setup.OVEN = oven;
  if (ovenNumber) setup.OVEN_NUMBER = ovenNumber;
  if (motorPositioning) setup.MOTOR_POSITIONING_DATE_TIME = motorPositioning;
  if (Object.keys(setup).length) {
    sections.push({
      sectionId: QC_CURING_SECTION_IDS.MOTOR_SETUP,
      sectionData: [setup],
    });
  }

  const resolvedSubType = curingType;

  const cycleRows = sanitizeCycleRows(getCuringCycleRows(values)).map((row) => {
    const next = { ...row };
    if (!curingSubTypeShowsPropellantPressure(resolvedSubType)) {
      next.PROPELLANT_PRESSURE = "";
    }
    if (!curingSubTypeShowsPeakPressureAchieved(resolvedSubType)) {
      next.PEAK_PRESSURE_ACHIEVED = "";
    }
    return next;
  });
  if (cycleRows.length) {
    sections.push({
      sectionId: QC_CURING_SECTION_IDS.CYCLE_DETAILS,
      sectionData: [{ CURING_CYCLE_DETAILS: cycleRows }],
    });
  }

  // Peak / propellant pressure are captured per cycle row — no separate pressure section.

  const post = {
    VISUAL_OBSERVATIONS: getCuringPostField(values, "VISUAL_OBSERVATIONS"),
    PRESSURE_PLATE_REMOVAL_DATE_TIME: getCuringPostField(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME"),
    SHORE_A_HARDNESS: getCuringPostField(values, "SHORE_A_HARDNESS"),
    DISPATCH_DATE_TIME: getCuringPostField(values, "DISPATCH_DATE_TIME"),
  };
  if (Object.values(post).some(hasValue)) {
    sections.push({
      sectionId: QC_CURING_SECTION_IDS.POST_CURING,
      sectionData: [post],
    });
  }

  const subscaleFields = {
    NUMBER_OF_OVENS: getCuringSubscaleField(values, "NUMBER_OF_OVENS"),
    CURING_START_DATE: getCuringSubscaleField(values, "CURING_START_DATE"),
    CYCLE_START_TIME: getCuringSubscaleField(values, "CYCLE_START_TIME"),
    CURING_COMPLETE_DATE: getCuringSubscaleField(values, "CURING_COMPLETE_DATE"),
    CYCLE_END_TIME: getCuringSubscaleField(values, "CYCLE_END_TIME"),
    BEM_AVERAGE_SHORE_A_HARDNESS: getCuringSubscaleField(values, "BEM_AVERAGE_SHORE_A_HARDNESS"),
    CARTON_AVERAGE_SHORE_A_HARDNESS: getCuringSubscaleField(
      values,
      "CARTON_AVERAGE_SHORE_A_HARDNESS",
    ),
    SUBSCALE_VISUAL_OBSERVATIONS: getCuringSubscaleField(values, "SUBSCALE_VISUAL_OBSERVATIONS"),
  };
  const subscaleRows = sanitizeSubscaleRows(getCuringSubscaleParameterRows(values));
  if (Object.values(subscaleFields).some(hasValue) || subscaleRows.length) {
    sections.push({
      sectionId: QC_CURING_SECTION_IDS.SUBSCALE,
      sectionData: [
        {
          ...subscaleFields,
          ...(subscaleRows.length ? { CURING_PARAMETER_TABLE: subscaleRows } : {}),
        },
      ],
    });
  }

  return sections;
};

const extractTableRows = <T extends Record<string, unknown>>(
  sectionData: unknown,
  tableId: string,
): T[] => {
  const data = asRecord(asArray(sectionData)[0]);
  if (!data) return [];
  const tableValue = data[tableId];
  if (Array.isArray(tableValue)) {
    return tableValue.filter((row) => row && typeof row === "object") as T[];
  }
  if (tableValue && typeof tableValue === "object") {
    const nestedRows = (tableValue as Record<string, unknown>).rows;
    if (Array.isArray(nestedRows)) {
      return nestedRows.filter((row) => row && typeof row === "object") as T[];
    }
  }
  return [];
};

export const hydrateCuringValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialCuringValues();

  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;

    if (sectionId === QC_CURING_SECTION_IDS.MOTOR_SETUP) {
      values[formKey(sectionId, "MOTOR_STAGE")] = String(data.MOTOR_STAGE ?? "");
      values[formKey(sectionId, "CURING_TYPE")] = String(
        data.CURING_TYPE ?? data.curingType ?? "",
      );
      values[formKey(sectionId, "OVEN")] = String(data.OVEN ?? "");
      values[formKey(sectionId, "OVEN_NUMBER")] = String(data.OVEN_NUMBER ?? "");
      values[formKey(sectionId, "MOTOR_POSITIONING_DATE_TIME")] = String(
        data.MOTOR_POSITIONING_DATE_TIME ?? "",
      );
      continue;
    }

    if (sectionId === QC_CURING_SECTION_IDS.CYCLE_DETAILS) {
      const nestedRows = extractTableRows<QcCuringCycleRow>(
        section.sectionData,
        "CURING_CYCLE_DETAILS",
      );
      const directRows = asArray(section.sectionData)
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row));
      const rows = nestedRows.length
        ? nestedRows
        : directRows.map((row, index) => mapApiCuringCycleRowToForm(row, index));
      if (rows.length) {
        values[formKey(sectionId, "CURING_CYCLE_DETAILS")] = normalizeRows(rows);
      }
      continue;
    }

    if (sectionId === "CURING_TABLE" || sectionId === "CURING_CYCLES") {
      const nestedRows = extractTableRows<Record<string, unknown>>(section.sectionData, "CURING_TABLE");
      const directRows = asArray(section.sectionData)
        .map((row) => asRecord(row))
        .filter((row): row is Record<string, unknown> => Boolean(row));
      const source = nestedRows.length ? nestedRows : directRows;
      if (source.length) {
        values[formKey(QC_CURING_SECTION_IDS.CYCLE_DETAILS, "CURING_CYCLE_DETAILS")] = normalizeRows(
          source.map((row, index) => mapApiCuringCycleRowToForm(row, index)),
        );
      }
      continue;
    }

    if (sectionId === QC_CURING_SECTION_IDS.PRESSURE_DETAILS) {
      const rows = extractTableRows<QcCuringPressureRow>(
        section.sectionData,
        "PRESSURE_CURING_DETAILS",
      );
      if (rows.length) {
        values[formKey(sectionId, "PRESSURE_CURING_DETAILS")] = rows;
      }
      continue;
    }

    if (sectionId === QC_CURING_SECTION_IDS.POST_CURING) {
      values[formKey(sectionId, "VISUAL_OBSERVATIONS")] = String(data.VISUAL_OBSERVATIONS ?? "");
      values[formKey(sectionId, "PRESSURE_PLATE_REMOVAL_DATE_TIME")] = String(
        data.PRESSURE_PLATE_REMOVAL_DATE_TIME ?? "",
      );
      values[formKey(sectionId, "SHORE_A_HARDNESS")] = String(data.SHORE_A_HARDNESS ?? "");
      values[formKey(sectionId, "DISPATCH_DATE_TIME")] = String(data.DISPATCH_DATE_TIME ?? "");
      continue;
    }

    if (sectionId === QC_CURING_SECTION_IDS.SUBSCALE) {
      const fields = [
        "NUMBER_OF_OVENS",
        "CURING_START_DATE",
        "CYCLE_START_TIME",
        "CURING_COMPLETE_DATE",
        "CYCLE_END_TIME",
        "BEM_AVERAGE_SHORE_A_HARDNESS",
        "CARTON_AVERAGE_SHORE_A_HARDNESS",
        "SUBSCALE_VISUAL_OBSERVATIONS",
      ] as const;
      fields.forEach((field) => {
        const raw = data[field];
        values[formKey(sectionId, field)] =
          field.includes("DATE") && raw ? formatToUiDate(String(raw)) || String(raw) : String(raw ?? "");
      });
      const rows = extractTableRows<QcCuringSubscaleParameterRow>(
        section.sectionData,
        "CURING_PARAMETER_TABLE",
      );
      if (rows.length) {
        values[formKey(sectionId, "CURING_PARAMETER_TABLE")] = normalizeRows(rows);
      }
    }
  }

  return values;
};
