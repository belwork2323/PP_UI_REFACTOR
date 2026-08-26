import {
  fileIdsFromFormRefs,
  isFileUploadIncomplete,
  parseFileRefs,
  type FileRef,
} from "../common/FileUploadModel";
import { formatToUiDate } from "../../../utils/dateUtils";

export type CasePrepOption = { value: string; label: string };

export const ABRADING_WHEEL_OPTIONS: readonly CasePrepOption[] = [
  { value: "G60", label: "G60" },
  { value: "G36", label: "G36" },
] as const;

export const VACUUM_BAGGING_OPTIONS: readonly CasePrepOption[] = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
] as const;

export const PRE_HEATING_RECIPE_OPTIONS: readonly CasePrepOption[] = [
  {
    value: "85_90C_6HR_10HR_VACUUM",
    label: "85-90°C for 6 hrs with 10 hrs vacuum",
  },
  { value: "105C_8HR", label: "105°C for 8 hrs" },
  { value: "OTHERS", label: "Others" },
] as const;

export const LINER_TYPE_OPTIONS: readonly CasePrepOption[] = [
  { value: "PEDCOAT", label: "PEDCOAT" },
  { value: "HEMCOAT_3L", label: "HEMCOAT-3L" },
  { value: "HEMCOAT_3L_M", label: "HEMCOAT-3L-M" },
  { value: "OTHERS", label: "Others" },
] as const;

export type PreHeatingRecipeValue =
  | "85_90C_6HR_10HR_VACUUM"
  | "105C_8HR"
  | "OTHERS"
  | "";

export type AbradingWheelValue = "G60" | "G36" | "";
export type VacuumBaggingValue = "YES" | "NO" | "";
export type LinerTypeValue = "PEDCOAT" | "HEMCOAT_3L" | "HEMCOAT_3L_M" | "OTHERS" | "";

export type CasePrepAbradingHeaderRow = {
  type: "header";
  label: string;
};

export type CasePrepAbradingDataRow = {
  type?: "data";
  operation: string;
  value: string;
  remarksObservations: string;
  attachments: FileRef[];
  valueFieldType?: string;
  readonly?: boolean;
};

export type CasePrepAbradingDetailsRow = CasePrepAbradingHeaderRow | CasePrepAbradingDataRow;

export type CasePrepParameterRow = {
  parameter: string;
  value: string;
  remarks: string;
  valueFieldType?: string;
  readonly?: boolean;
};

export type CasePrepObservationRow = {
  parameter: string;
  observations: string;
  remarks?: string;
  valueFieldType?: string;
  readonly?: boolean;
};

export type CasePrepIngredientRow = {
  srNo: number;
  materialName: string;
  ingredient: string;
  mfgLot: string;
  partsByWeight: string;
  quantityTaken: string;
  totalQuantity: string;
};

export type CasePrepQualificationParameterRow = {
  srNo: number;
  parameter: string;
  specification: string;
  result: string;
  readonly?: boolean;
};

export type CasePrepAbradingOperationData = {
  typeOfCasing: string;
  typeOfInsulation: string;
  abradingWheelType: AbradingWheelValue | string;
  abradingDetails: CasePrepAbradingDetailsRow[];
};

export type CasePrepBellowBondingData = {
  adhesiveDetails: string;
  heBellowDimension: string;
  heMotorPastingDateTime: string;
  neBellowDimension: string;
  neMotorPastingDateTime: string;
  numberOfSpacers: string;
  pastingDetails: string;
  remarks: string;
};

export type CasePrepTceCleaningData = {
  tceCleaningDateTime: string;
  solventUsedQtyKg: string;
  observation: string;
  testReport: FileRef | null;
};

export type CasePrepPreHeatingData = {
  vacuumBaggingApplied: VacuumBaggingValue | string;
  vacuumApplied: string;
  preHeatingRecipe: PreHeatingRecipeValue | string;
  otherTemperature: string;
  otherDuration: string;
  temperatureDuration: CasePrepParameterRow[];
  preHeatingMonitoring: CasePrepParameterRow[];
  preHeatingDate?: string;
};

export type CasePrepLinerCoatingOperationData = {
  linerType: LinerTypeValue | string;
  otherLinerType: string;
  batchNo: string;
  batchSize: string;
  premixIngredients: CasePrepIngredientRow[];
  finalMixIngredients: CasePrepIngredientRow[];
  qualifyingSubscaleBatchNo: string;
  qualificationParameters: CasePrepQualificationParameterRow[];
  linerApplicationLog: CasePrepParameterRow[];
  linerCoatingDate?: string;
  rh?: string;
};

export type CasePrepDispatchToCastingData = {
  dispatchVisualObservations: CasePrepObservationRow[];
  dispatchToCastingDetails: CasePrepParameterRow[];
};

export type CasePrepMotorData = {
  abradingOperation: CasePrepAbradingOperationData;
  bellowBonding: CasePrepBellowBondingData;
  tceCleaning: CasePrepTceCleaningData;
  preHeating: CasePrepPreHeatingData;
  linerCoatingOperation: CasePrepLinerCoatingOperationData;
  dispatchToCasting: CasePrepDispatchToCastingData;
};

export type CasePrepMotorSectionPayload = {
  sectionId: string;
  sectionData: unknown[];
};

const ABRADING_DUST_A = "Dust Weight (in gm) (A)";
const ABRADING_DUST_B = "Dust Weight (in gm) (B)";
const ABRADING_DUST_TOTAL = "Total Dust Weight (in gm) (A+B)";

const PRE_HEATING_RECIPE_ROW_COUNTS: Record<string, number> = {
  "85_90C_6HR_10HR_VACUUM": 6,
  "105C_8HR": 8,
};

const PRE_HEATING_MONITORING_PRESETS: Array<{ parameter: string; valueFieldType: string }> = [
  { parameter: "Date", valueFieldType: "date" },
  { parameter: "Oven Start Time", valueFieldType: "time" },
  { parameter: "Cycle Start Time", valueFieldType: "time" },
  { parameter: "Cycle End Time", valueFieldType: "time" },
  { parameter: "Visual Observation After Pre-heating", valueFieldType: "textarea" },
];

const LINER_APPLICATION_LOG_PRESETS: Array<{ parameter: string; valueFieldType: string }> = [
  { parameter: "Date", valueFieldType: "date" },
  { parameter: "Oven Out Time", valueFieldType: "time" },
  { parameter: "Rocket Motor Insulation Temp", valueFieldType: "number" },
  { parameter: "Rocket Motor RPM", valueFieldType: "number" },
  { parameter: "Boom Speed", valueFieldType: "number" },
  { parameter: "Start Temperature", valueFieldType: "number" },
  { parameter: "Start Time", valueFieldType: "time" },
  { parameter: "End Time", valueFieldType: "time" },
  { parameter: "Number of Passes", valueFieldType: "number" },
  { parameter: "Liner Applied (w/o DCM)", valueFieldType: "text" },
  { parameter: "Rotation Start Time", valueFieldType: "time" },
  { parameter: "Rotation End Time", valueFieldType: "time" },
  { parameter: "Storage Temperature", valueFieldType: "number" },
];

const QUALIFICATION_PARAMETER_PRESETS: Array<{
  parameter: string;
  specification: string;
}> = [
  { parameter: "SBS", specification: ">=5" },
  { parameter: "TBS", specification: ">=5" },
  { parameter: "Peel Strength", specification: ">=0.6" },
  { parameter: "Moisture", specification: "<=0.25" },
];

const DISPATCH_VISUAL_PRESETS = [
  "Liner Coated Rubber Surface Visual Observation",
  "Observations Over Loose Flap / Bellow Bonding",
] as const;

const DISPATCH_DETAILS_PRESETS: Array<{ parameter: string; valueFieldType: string }> = [
  { parameter: "Puncturing at HE (Nos)", valueFieldType: "number" },
  { parameter: "Puncturing at NE (Nos)", valueFieldType: "number" },
  { parameter: "Puncturing at LF Extension (Nos)", valueFieldType: "number" },
  { parameter: "Dispatch Time", valueFieldType: "datetime" },
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const createParameterRow = (
  parameter: string,
  valueFieldType?: string,
  readonly = true,
): CasePrepParameterRow => ({
  parameter,
  value: "",
  remarks: "",
  ...(valueFieldType ? { valueFieldType } : {}),
  readonly,
});

const createObservationRow = (parameter: string, readonly = true): CasePrepObservationRow => ({
  parameter,
  observations: "",
  remarks: "",
  readonly,
});

const createQualificationRow = (
  srNo: number,
  parameter: string,
  specification: string,
): CasePrepQualificationParameterRow => ({
  srNo,
  parameter,
  specification,
  result: "",
  readonly: true,
});

const isAbradingHeaderRow = (row: CasePrepAbradingDetailsRow): row is CasePrepAbradingHeaderRow =>
  row.type === "header";

export const createEmptyCasePrepAbradingDetails = (): CasePrepAbradingDetailsRow[] => [
  { type: "header", label: "1st Cut" },
  {
    operation: "Start Date & Time",
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "datetime",
    readonly: true,
  },
  {
    operation: "End Date & Time",
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "datetime",
    readonly: true,
  },
  {
    operation: ABRADING_DUST_A,
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "number",
    readonly: true,
  },
  { type: "header", label: "2nd Cut" },
  {
    operation: "Start Date & Time",
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "datetime",
    readonly: true,
  },
  {
    operation: "End Date & Time",
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "datetime",
    readonly: true,
  },
  {
    operation: ABRADING_DUST_B,
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "number",
    readonly: true,
  },
  {
    operation: ABRADING_DUST_TOTAL,
    value: "",
    remarksObservations: "",
    attachments: [],
    valueFieldType: "number",
    readonly: true,
  },
];

const createEmptyPreHeatingMonitoring = (): CasePrepParameterRow[] =>
  PRE_HEATING_MONITORING_PRESETS.map((row) =>
    createParameterRow(row.parameter, row.valueFieldType),
  );

const createEmptyLinerApplicationLog = (): CasePrepParameterRow[] =>
  LINER_APPLICATION_LOG_PRESETS.map((row) =>
    createParameterRow(row.parameter, row.valueFieldType),
  );

const createEmptyQualificationParameters = (): CasePrepQualificationParameterRow[] =>
  QUALIFICATION_PARAMETER_PRESETS.map((row, index) =>
    createQualificationRow(index + 1, row.parameter, row.specification),
  );

const createEmptyDispatchVisualObservations = (): CasePrepObservationRow[] =>
  DISPATCH_VISUAL_PRESETS.map((parameter) => createObservationRow(parameter));

const createEmptyDispatchToCastingDetails = (): CasePrepParameterRow[] =>
  DISPATCH_DETAILS_PRESETS.map((row) => createParameterRow(row.parameter, row.valueFieldType));

export const createEmptyCasePrepMotorData = (): CasePrepMotorData => ({
  abradingOperation: {
    typeOfCasing: "",
    typeOfInsulation: "",
    abradingWheelType: "",
    abradingDetails: createEmptyCasePrepAbradingDetails(),
  },
  bellowBonding: {
    adhesiveDetails: "",
    heBellowDimension: "",
    heMotorPastingDateTime: "",
    neBellowDimension: "",
    neMotorPastingDateTime: "",
    numberOfSpacers: "",
    pastingDetails: "",
    remarks: "",
  },
  tceCleaning: {
    tceCleaningDateTime: "",
    solventUsedQtyKg: "",
    observation: "",
    testReport: null,
  },
  preHeating: {
    vacuumBaggingApplied: "",
    vacuumApplied: "",
    preHeatingRecipe: "",
    otherTemperature: "",
    otherDuration: "",
    temperatureDuration: [],
    preHeatingMonitoring: createEmptyPreHeatingMonitoring(),
    preHeatingDate: "",
  },
  linerCoatingOperation: {
    linerType: "",
    otherLinerType: "",
    batchNo: "",
    batchSize: "",
    premixIngredients: [],
    finalMixIngredients: [],
    qualifyingSubscaleBatchNo: "",
    qualificationParameters: createEmptyQualificationParameters(),
    linerApplicationLog: createEmptyLinerApplicationLog(),
    linerCoatingDate: "",
    rh: "",
  },
  dispatchToCasting: {
    dispatchVisualObservations: createEmptyDispatchVisualObservations(),
    dispatchToCastingDetails: createEmptyDispatchToCastingDetails(),
  },
});

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = str(value).trim().replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export const computeAbradingTotalDustWeight = (
  rows: CasePrepAbradingDetailsRow[],
): CasePrepAbradingDetailsRow[] => {
  let dustA: number | null = null;
  let dustB: number | null = null;

  for (const row of rows) {
    if (isAbradingHeaderRow(row)) continue;
    const operation = str(row.operation).trim();
    if (operation === ABRADING_DUST_A) dustA = parseNumeric(row.value);
    if (operation === ABRADING_DUST_B) dustB = parseNumeric(row.value);
  }

  if (dustA === null || dustB === null) return rows;

  const total = String(dustA + dustB);
  return rows.map((row) => {
    if (isAbradingHeaderRow(row)) return row;
    if (str(row.operation).trim() !== ABRADING_DUST_TOTAL) return row;
    return { ...row, value: total };
  });
};

const resolveTemperatureDurationCount = (
  recipe: string,
  otherDuration: string,
): number => {
  const normalized = str(recipe).trim();
  if (normalized in PRE_HEATING_RECIPE_ROW_COUNTS) {
    return PRE_HEATING_RECIPE_ROW_COUNTS[normalized];
  }
  if (normalized === "OTHERS") {
    const n = parseNumeric(otherDuration);
    if (n === null) return 0;
    return Math.max(0, Math.min(12, Math.floor(n)));
  }
  return 0;
};

const buildTemperatureDurationRows = (
  count: number,
  previous: CasePrepParameterRow[],
): CasePrepParameterRow[] => {
  const byParameter = new Map(
    previous.map((row) => [str(row.parameter).trim(), row] as const),
  );
  return Array.from({ length: count }, (_, index) => {
    const parameter = `Temperature @ ${index + 1} Hour`;
    const existing = byParameter.get(parameter);
    return {
      parameter,
      value: existing?.value ?? "",
      remarks: existing?.remarks ?? "",
      valueFieldType: existing?.valueFieldType ?? "number",
      readonly: true,
    };
  });
};

export const syncPreHeatingTemperatureDurationRows = (
  data: CasePrepMotorData,
): CasePrepMotorData => {
  const count = resolveTemperatureDurationCount(
    data.preHeating.preHeatingRecipe,
    data.preHeating.otherDuration,
  );
  return {
    ...data,
    preHeating: {
      ...data.preHeating,
      temperatureDuration: buildTemperatureDurationRows(
        count,
        data.preHeating.temperatureDuration ?? [],
      ),
    },
  };
};

const META_KEYS = new Set([
  "type",
  "label",
  "parameter",
  "operation",
  "valueFieldType",
  "readonly",
  "srNo",
  "specification",
  "materialName",
  "ingredient",
  "mfgLot",
]);

const hasUserContent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (Array.isArray(value)) return value.some((item) => hasUserContent(item));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, entry]) => {
      if (key.startsWith("_") || META_KEYS.has(key)) return false;
      return hasUserContent(entry);
    });
  }
  return false;
};

export const casePrepMotorDataHasUserInput = (data: CasePrepMotorData): boolean =>
  hasUserContent(data);

const stripRowForPayload = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key === "valueFieldType" || key.endsWith("__fieldType") || key === "readonly") return;
    if (key.startsWith("_")) return;
    out[key] = value;
  });
  return out;
};

const toApiNumber = (value: unknown): number | undefined => {
  const raw = str(value).trim().replace(/,/g, "");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** YYYY-MM-DD for LocalDate-style cells (monitoring / application log Date rows). */
const toApiDateOnly = (value: unknown): string => {
  const raw = str(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmy = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const isoDate = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoDate ? isoDate[1] : raw;
};

/** Prefer dedicated date field; else first monitoring/log row named "Date". */
const resolveSectionDateForUi = (
  dedicatedDate: unknown,
  parameterRows: unknown,
): string => {
  const fromField = formatToUiDate(str(dedicatedDate));
  if (fromField) return fromField;

  if (!Array.isArray(parameterRows)) return "";
  for (const entry of parameterRows) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (str(row.parameter).trim().toLowerCase() !== "date") continue;
    return formatToUiDate(str(row.value));
  }
  return "";
};

/** Copy UI date into the first parameter row named "Date" when that cell is empty. */
const applyDateToParameterRows = (
  rows: CasePrepParameterRow[],
  dateValue: string,
): CasePrepParameterRow[] => {
  if (!dateValue) return rows;
  let applied = false;
  return rows.map((row) => {
    if (applied) return row;
    if (str(row.parameter).trim().toLowerCase() !== "date") return row;
    if (str(row.value).trim()) return row;
    applied = true;
    return { ...row, value: dateValue };
  });
};

/** Instant fields: match API sample `2026-08-12T02:00:00Z` (drop millis). */
const toApiInstant = (value: unknown): string => {
  const raw = str(value).trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?Z$/i);
  if (match) return `${match[1]}Z`;
  return raw;
};

const abradingRowsForPayload = (rows: CasePrepAbradingDetailsRow[]): unknown[] => {
  let srNo = 0;
  return rows
    .filter((row) => !isAbradingHeaderRow(row))
    .map((row) => {
      srNo += 1;
      const valueRaw = str(row.value).trim();
      const value =
        row.valueFieldType === "datetime" || /T\d{2}:\d{2}/.test(valueRaw)
          ? toApiInstant(valueRaw) || valueRaw
          : valueRaw;
      return stripRowForPayload({
        SR_NO: srNo,
        operation: row.operation,
        value,
        remarksObservations: row.remarksObservations,
        attachments: fileIdsFromFormRefs(row.attachments),
      });
    });
};

const parameterRowsForPayload = (rows: CasePrepParameterRow[]): unknown[] =>
  rows.map((row, index) =>
    stripRowForPayload({
      SR_NO: index + 1,
      parameter: row.parameter,
      value: row.value,
      remarks: row.remarks,
    }),
  );

const observationRowsForPayload = (rows: CasePrepObservationRow[]): unknown[] =>
  rows.map((row, index) =>
    stripRowForPayload({
      SR_NO: index + 1,
      parameter: row.parameter,
      observations: row.observations,
      // Always include remarks (user input); null when blank so the key is not dropped.
      remarks: str(row.remarks ?? "").trim() || null,
    }),
  );

const ingredientRowsForPayload = (rows: CasePrepIngredientRow[]): unknown[] =>
  rows.map((row, index) => {
    const partsByWeight = toApiNumber(row.partsByWeight);
    const quantityTaken = toApiNumber(row.quantityTaken);
    // Always send totalQuantity as user input only (number, or null when blank — never copy quantityTaken).
    const totalQuantityRaw = str(row.totalQuantity).trim();
    const totalQuantity = totalQuantityRaw ? toApiNumber(totalQuantityRaw) ?? null : null;
    return {
      srNo: row.srNo || index + 1,
      materialName: str(row.materialName).trim(),
      ingredient: str(row.ingredient).trim(),
      mfgLot: str(row.mfgLot).trim(),
      ...(partsByWeight !== undefined ? { partsByWeight } : {}),
      ...(quantityTaken !== undefined ? { quantityTaken } : {}),
      totalQuantity,
    };
  });

const qualificationRowsForPayload = (rows: CasePrepQualificationParameterRow[]): unknown[] =>
  rows.map((row, index) =>
    stripRowForPayload({
      srNo: row.srNo || index + 1,
      parameter: row.parameter,
      specification: row.specification,
      result: row.result,
    }),
  );

/** Nested motor details matching create/update API (`casePreparationDetails.motors[]`). */
export type CasePrepMotorDetailsPayload = {
  abradingOperation: Record<string, unknown>;
  bellowBonding: Record<string, unknown>;
  tceCleaning: Record<string, unknown>;
  preHeating: Record<string, unknown>;
  linerCoatingOperation: Record<string, unknown>;
  dispatchToCasting: Record<string, unknown>;
};

export const CASE_PREP_MOTOR_SECTION_KEYS = [
  "abradingOperation",
  "bellowBonding",
  "tceCleaning",
  "preHeating",
  "linerCoatingOperation",
  "dispatchToCasting",
] as const;

export type CasePrepMotorSectionKey = (typeof CASE_PREP_MOTOR_SECTION_KEYS)[number];

export const buildCasePrepMotorDetailsPayload = (
  data: CasePrepMotorData,
): CasePrepMotorDetailsPayload => {
  const synced = syncPreHeatingTemperatureDurationRows(data);
  const abradingDetails = computeAbradingTotalDustWeight(
    synced.abradingOperation.abradingDetails,
  );
  const numberOfSpacers = toApiNumber(synced.bellowBonding.numberOfSpacers);
  const solventUsedQtyKg = toApiNumber(synced.tceCleaning.solventUsedQtyKg);
  const vacuumApplied = toApiNumber(synced.preHeating.vacuumApplied);
  const batchSize = toApiNumber(synced.linerCoatingOperation.batchSize);
  const recipe = str(synced.preHeating.preHeatingRecipe).trim();
  const linerTypeRaw = str(synced.linerCoatingOperation.linerType).trim();
  const otherLinerType = str(synced.linerCoatingOperation.otherLinerType).trim();
  // Backend LinerCoatingOperation has no `otherLinerType` — send the custom value as linerType.
  const linerType =
    linerTypeRaw.toUpperCase() === "OTHERS" && otherLinerType ? otherLinerType : linerTypeRaw;
  const vacuumBaggingApplied = str(synced.preHeating.vacuumBaggingApplied).trim();
  const heMotorPastingDateTime = toApiInstant(synced.bellowBonding.heMotorPastingDateTime);
  const neMotorPastingDateTime = toApiInstant(synced.bellowBonding.neMotorPastingDateTime);
  const tceCleaningDateTime = toApiInstant(synced.tceCleaning.tceCleaningDateTime);

  // Fold UI dates into monitoring/application-log "Date" rows when empty (display sync).
  // preHeatingDate / linerCoatingDate are also sent as dedicated API fields.
  const preHeatingDate = toApiDateOnly(synced.preHeating.preHeatingDate);
  const linerCoatingDate = toApiDateOnly(synced.linerCoatingOperation.linerCoatingDate);
  const preHeatingMonitoring = applyDateToParameterRows(
    synced.preHeating.preHeatingMonitoring,
    preHeatingDate,
  );
  const linerApplicationLog = applyDateToParameterRows(
    synced.linerCoatingOperation.linerApplicationLog,
    linerCoatingDate,
  );

  return {
    abradingOperation: {
      typeOfCasing: str(synced.abradingOperation.typeOfCasing).trim(),
      typeOfInsulation: str(synced.abradingOperation.typeOfInsulation).trim(),
      abradingWheelType: str(synced.abradingOperation.abradingWheelType).trim(),
      abradingDetails: abradingRowsForPayload(abradingDetails),
    },
    bellowBonding: {
      adhesiveDetails: str(synced.bellowBonding.adhesiveDetails).trim(),
      heBellowDimension: str(synced.bellowBonding.heBellowDimension).trim(),
      ...(heMotorPastingDateTime ? { heMotorPastingDateTime } : {}),
      neBellowDimension: str(synced.bellowBonding.neBellowDimension).trim(),
      ...(neMotorPastingDateTime ? { neMotorPastingDateTime } : {}),
      ...(numberOfSpacers !== undefined ? { numberOfSpacers } : {}),
      pastingDetails: str(synced.bellowBonding.pastingDetails).trim(),
      remarks: str(synced.bellowBonding.remarks).trim(),
    },
    tceCleaning: {
      ...(tceCleaningDateTime ? { tceCleaningDateTime } : {}),
      ...(solventUsedQtyKg !== undefined ? { solventUsedQtyKg } : {}),
      observation: str(synced.tceCleaning.observation).trim(),
      testReport: fileIdsFromFormRefs(
        synced.tceCleaning.testReport ? [synced.tceCleaning.testReport] : [],
      )[0] ?? null,
    },
    preHeating: {
      vacuumBaggingApplied,
      ...(vacuumBaggingApplied === "YES" && vacuumApplied !== undefined ? { vacuumApplied } : {}),
      preHeatingRecipe: recipe,
      ...(preHeatingDate ? { preHeatingDate } : {}),
      // Do not send otherTemperature / otherDuration — not on API DTO.
      temperatureDuration: parameterRowsForPayload(synced.preHeating.temperatureDuration),
      preHeatingMonitoring: parameterRowsForPayload(preHeatingMonitoring),
    },
    linerCoatingOperation: {
      linerType,
      // Do not send otherLinerType — not on API DTO (custom value sent as linerType).
      ...(linerCoatingDate ? { linerCoatingDate } : {}),
      batchNo: str(synced.linerCoatingOperation.batchNo).trim(),
      ...(batchSize !== undefined ? { batchSize } : {}),
      premixIngredients: ingredientRowsForPayload(synced.linerCoatingOperation.premixIngredients),
      finalMixIngredients: ingredientRowsForPayload(
        synced.linerCoatingOperation.finalMixIngredients,
      ),
      qualifyingSubscaleBatchNo: str(
        synced.linerCoatingOperation.qualifyingSubscaleBatchNo,
      ).trim(),
      qualificationParameters: qualificationRowsForPayload(
        synced.linerCoatingOperation.qualificationParameters,
      ),
      linerApplicationLog: parameterRowsForPayload(linerApplicationLog),
      ...(str(synced.linerCoatingOperation.rh ?? "").trim()
        ? { rh: str(synced.linerCoatingOperation.rh).trim() }
        : {}),
    },
    dispatchToCasting: {
      dispatchVisualObservations: observationRowsForPayload(
        synced.dispatchToCasting.dispatchVisualObservations,
      ),
      dispatchToCastingDetails: parameterRowsForPayload(
        synced.dispatchToCasting.dispatchToCastingDetails,
      ),
    },
  };
};

/** @deprecated Use buildCasePrepMotorDetailsPayload */
export const buildCasePrepMotorSectionsPayload = (
  data: CasePrepMotorData,
): CasePrepMotorSectionPayload[] => {
  const details = buildCasePrepMotorDetailsPayload(data);
  return CASE_PREP_MOTOR_SECTION_KEYS.map((sectionId) => ({
    sectionId,
    sectionData: [details[sectionId]],
  }));
};

const firstSectionRow = (
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
  sectionId: string,
): Record<string, unknown> => {
  const match = (sections ?? []).find(
    (section) => str(section.sectionId).trim() === sectionId,
  );
  const rows = asArray(match?.sectionData);
  return asRecord(rows[0]) ?? {};
};

const resolveSectionRecord = (
  source: Record<string, unknown> | null,
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
  sectionId: CasePrepMotorSectionKey,
): Record<string, unknown> => {
  const nested = asRecord(source?.[sectionId]);
  if (nested) return nested;
  return firstSectionRow(sections, sectionId);
};

const parseAbradingDetails = (value: unknown): CasePrepAbradingDetailsRow[] => {
  const empty = createEmptyCasePrepAbradingDetails();
  const rows = asArray(value);
  if (!rows.length) return empty;

  type SavedAbradingRow = CasePrepAbradingDataRow & { srNo: number };
  const savedDataRows: SavedAbradingRow[] = [];
  const parsedWithHeaders: CasePrepAbradingDetailsRow[] = [];

  rows.forEach((item, index) => {
    const rec = asRecord(item) ?? {};
    if (str(rec.type).toLowerCase() === "header" || ("label" in rec && !("operation" in rec))) {
      parsedWithHeaders.push({
        type: "header" as const,
        label: str(rec.label ?? rec.operation ?? ""),
      });
      return;
    }

    const srNoRaw = Number(rec.SR_NO ?? rec.srNo ?? 0);
    const srNo = Number.isFinite(srNoRaw) && srNoRaw > 0 ? srNoRaw : savedDataRows.length + 1;
    const dataRow: SavedAbradingRow = {
      operation: str(rec.operation ?? ""),
      value: str(rec.value ?? ""),
      remarksObservations: str(rec.remarksObservations ?? rec.remarks ?? ""),
      attachments: parseFileRefs(rec.attachments),
      valueFieldType: str(rec.valueFieldType ?? rec.value__fieldType ?? "") || undefined,
      readonly: rec.readonly === true,
      srNo,
    };
    savedDataRows.push(dataRow);
    parsedWithHeaders.push(dataRow);
  });

  const hasHeaders = parsedWithHeaders.some((row) => isAbradingHeaderRow(row));
  if (hasHeaders) {
    // API already includes section headers — keep order, drop helper srNo.
    return parsedWithHeaders.map((row) => {
      if (isAbradingHeaderRow(row)) return row;
      const { srNo: _srNo, ...rest } = row as SavedAbradingRow;
      return rest;
    });
  }

  // Headerless payload (SR_NO 1..n) — merge onto UI presets by serial order so
  // duplicate operation labels (1st vs 2nd Cut "Start Date & Time") stay distinct.
  const bySrNo = new Map(savedDataRows.map((row) => [row.srNo, row] as const));
  let dataOrdinal = 0;

  return empty.map((preset) => {
    if (isAbradingHeaderRow(preset)) return preset;
    dataOrdinal += 1;
    const saved = bySrNo.get(dataOrdinal) ?? savedDataRows[dataOrdinal - 1];
    if (!saved) return preset;
    return {
      ...preset,
      value: saved.value,
      remarksObservations: saved.remarksObservations,
      attachments: saved.attachments?.length ? saved.attachments : preset.attachments,
      valueFieldType: saved.valueFieldType || preset.valueFieldType,
    };
  });
};

const mergeParameterPresets = (
  presets: CasePrepParameterRow[],
  value: unknown,
): CasePrepParameterRow[] => {
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  if (!rows.length) return presets;

  const byParameter = new Map(
    rows.map((row) => [str(row.parameter).trim().toLowerCase(), row] as const),
  );

  const merged = presets.map((preset) => {
    const saved = byParameter.get(preset.parameter.trim().toLowerCase());
    if (!saved) return preset;
    return {
      ...preset,
      value: str(saved.value ?? preset.value),
      remarks: str(saved.remarks ?? preset.remarks),
      valueFieldType:
        str(saved.valueFieldType ?? saved.value__fieldType ?? "") || preset.valueFieldType,
    };
  });

  const presetKeys = new Set(presets.map((row) => row.parameter.trim().toLowerCase()));
  const extras = rows
    .filter((row) => !presetKeys.has(str(row.parameter).trim().toLowerCase()))
    .map((row) => ({
      parameter: str(row.parameter ?? ""),
      value: str(row.value ?? ""),
      remarks: str(row.remarks ?? ""),
      valueFieldType: str(row.valueFieldType ?? row.value__fieldType ?? "") || undefined,
      readonly: row.readonly === true,
    }));

  return [...merged, ...extras];
};

const parseTemperatureDuration = (value: unknown): CasePrepParameterRow[] => {
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  return rows.map((row) => ({
    parameter: str(row.parameter ?? ""),
    value: str(row.value ?? ""),
    remarks: str(row.remarks ?? ""),
    valueFieldType: str(row.valueFieldType ?? row.value__fieldType ?? "") || "number",
    readonly: true,
  }));
};

const parseObservationRows = (
  presets: CasePrepObservationRow[],
  value: unknown,
): CasePrepObservationRow[] => {
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  if (!rows.length) return presets;

  const byParameter = new Map(
    rows.map((row) => [str(row.parameter).trim().toLowerCase(), row] as const),
  );

  return presets.map((preset) => {
    const saved = byParameter.get(preset.parameter.trim().toLowerCase());
    if (!saved) return preset;
    return {
      ...preset,
      observations: str(saved.observations ?? saved.value ?? preset.observations),
      remarks: str(saved.remarks ?? preset.remarks ?? ""),
    };
  });
};

const parseIngredientRows = (value: unknown): CasePrepIngredientRow[] =>
  asArray(value)
    .map((item, index) => {
      const row = asRecord(item);
      if (!row) return null;
      return {
        srNo: Number(row.srNo ?? row.SR_NO ?? index + 1) || index + 1,
        materialName: str(row.materialName ?? ""),
        ingredient: str(row.ingredient ?? ""),
        mfgLot: str(row.mfgLot ?? ""),
        partsByWeight: str(row.partsByWeight ?? ""),
        quantityTaken: str(row.quantityTaken ?? ""),
        totalQuantity: str(row.totalQuantity ?? ""),
      };
    })
    .filter((row): row is CasePrepIngredientRow => Boolean(row));

const parseQualificationRows = (value: unknown): CasePrepQualificationParameterRow[] => {
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  if (!rows.length) return createEmptyQualificationParameters();

  const presets = createEmptyQualificationParameters();
  const byParameter = new Map(
    rows.map((row) => [str(row.parameter).trim().toLowerCase(), row] as const),
  );

  const merged = presets.map((preset) => {
    const saved = byParameter.get(preset.parameter.trim().toLowerCase());
    if (!saved) return preset;
    return {
      ...preset,
      specification: str(saved.specification ?? preset.specification),
      result: str(saved.result ?? ""),
    };
  });

  const presetKeys = new Set(presets.map((row) => row.parameter.trim().toLowerCase()));
  const extras = rows
    .filter((row) => !presetKeys.has(str(row.parameter).trim().toLowerCase()))
    .map((row, index) => ({
      srNo: Number(row.srNo ?? presets.length + index + 1) || presets.length + index + 1,
      parameter: str(row.parameter ?? ""),
      specification: str(row.specification ?? ""),
      result: str(row.result ?? ""),
      readonly: row.readonly === true,
    }));

  return [...merged, ...extras];
};

export const parseCasePrepMotorDataFromApi = (
  motorOrSections?:
    | Record<string, unknown>
    | Array<{ sectionId?: string; sectionData?: unknown[] }>
    | null,
): CasePrepMotorData => {
  const empty = createEmptyCasePrepMotorData();
  if (!motorOrSections) return empty;

  const legacySections = Array.isArray(motorOrSections) ? motorOrSections : undefined;
  const nestedSource =
    !Array.isArray(motorOrSections) && motorOrSections
      ? (motorOrSections as Record<string, unknown>)
      : null;

  const hasNested = CASE_PREP_MOTOR_SECTION_KEYS.some((key) => asRecord(nestedSource?.[key]));
  if (!hasNested && !legacySections?.length) return empty;

  const abrading = resolveSectionRecord(nestedSource, legacySections, "abradingOperation");
  const bellow = resolveSectionRecord(nestedSource, legacySections, "bellowBonding");
  const tce = resolveSectionRecord(nestedSource, legacySections, "tceCleaning");
  const preHeating = resolveSectionRecord(nestedSource, legacySections, "preHeating");
  const liner = resolveSectionRecord(nestedSource, legacySections, "linerCoatingOperation");
  const dispatch = resolveSectionRecord(nestedSource, legacySections, "dispatchToCasting");

  const parsed: CasePrepMotorData = {
    abradingOperation: {
      typeOfCasing: str(abrading.typeOfCasing ?? empty.abradingOperation.typeOfCasing),
      typeOfInsulation: str(
        abrading.typeOfInsulation ?? empty.abradingOperation.typeOfInsulation,
      ),
      abradingWheelType: str(
        abrading.abradingWheelType ?? empty.abradingOperation.abradingWheelType,
      ),
      abradingDetails: parseAbradingDetails(abrading.abradingDetails),
    },
    bellowBonding: {
      adhesiveDetails: str(bellow.adhesiveDetails ?? ""),
      heBellowDimension: str(bellow.heBellowDimension ?? ""),
      heMotorPastingDateTime: str(bellow.heMotorPastingDateTime ?? ""),
      neBellowDimension: str(bellow.neBellowDimension ?? ""),
      neMotorPastingDateTime: str(bellow.neMotorPastingDateTime ?? ""),
      numberOfSpacers: str(bellow.numberOfSpacers ?? ""),
      pastingDetails: str(bellow.pastingDetails ?? ""),
      remarks: str(bellow.remarks ?? ""),
    },
    tceCleaning: {
      tceCleaningDateTime: str(tce.tceCleaningDateTime ?? ""),
      solventUsedQtyKg: str(tce.solventUsedQtyKg ?? ""),
      observation: str(tce.observation ?? ""),
      testReport: parseFileRefs(tce.testReport)[0] ?? null,
    },
    preHeating: {
      vacuumBaggingApplied: str(preHeating.vacuumBaggingApplied ?? ""),
      vacuumApplied: str(preHeating.vacuumApplied ?? ""),
      preHeatingRecipe: str(preHeating.preHeatingRecipe ?? ""),
      otherTemperature: str(preHeating.otherTemperature ?? ""),
      otherDuration: str(preHeating.otherDuration ?? ""),
      temperatureDuration: parseTemperatureDuration(preHeating.temperatureDuration),
      preHeatingMonitoring: mergeParameterPresets(
        empty.preHeating.preHeatingMonitoring,
        preHeating.preHeatingMonitoring,
      ),
      preHeatingDate: resolveSectionDateForUi(
        preHeating.preHeatingDate,
        preHeating.preHeatingMonitoring,
      ),
    },
    linerCoatingOperation: {
      linerType: str(liner.linerType ?? ""),
      otherLinerType: str(liner.otherLinerType ?? ""),
      batchNo: str(liner.batchNo ?? ""),
      batchSize: str(liner.batchSize ?? ""),
      premixIngredients: parseIngredientRows(liner.premixIngredients),
      finalMixIngredients: parseIngredientRows(liner.finalMixIngredients),
      qualifyingSubscaleBatchNo: str(liner.qualifyingSubscaleBatchNo ?? ""),
      qualificationParameters: parseQualificationRows(liner.qualificationParameters),
      linerApplicationLog: mergeParameterPresets(
        empty.linerCoatingOperation.linerApplicationLog,
        liner.linerApplicationLog,
      ),
      linerCoatingDate: resolveSectionDateForUi(
        liner.linerCoatingDate,
        liner.linerApplicationLog,
      ),
      rh: str(liner.rh ?? ""),
    },
    dispatchToCasting: {
      dispatchVisualObservations: parseObservationRows(
        empty.dispatchToCasting.dispatchVisualObservations,
        dispatch.dispatchVisualObservations,
      ),
      dispatchToCastingDetails: mergeParameterPresets(
        empty.dispatchToCasting.dispatchToCastingDetails,
        dispatch.dispatchToCastingDetails,
      ),
    },
  };

  return syncPreHeatingTemperatureDurationRows({
    ...parsed,
    abradingOperation: {
      ...parsed.abradingOperation,
      abradingDetails: computeAbradingTotalDustWeight(parsed.abradingOperation.abradingDetails),
    },
  });
};

/** @deprecated Use parseCasePrepMotorDataFromApi */
export const parseCasePrepMotorDataFromSections = (
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
): CasePrepMotorData => parseCasePrepMotorDataFromApi(sections);

export const collectCasePrepFileRefsFromMotorData = (data: CasePrepMotorData | null | undefined): FileRef[] => {
  if (!data) return [];
  const refs: FileRef[] = [];
  for (const row of data.abradingOperation?.abradingDetails ?? []) {
    if (row && typeof row === "object" && "attachments" in row && Array.isArray((row as CasePrepAbradingDataRow).attachments)) {
      refs.push(...((row as CasePrepAbradingDataRow).attachments ?? []));
    }
  }
  if (data.tceCleaning?.testReport) refs.push(data.tceCleaning.testReport);
  return refs;
};

export const collectCasePrepFileRefsFromForm = (form: {
  motors?: Array<{ data?: CasePrepMotorData | null }>;
  subscaleData?: CasePrepMotorData | null;
}): FileRef[] => {
  const refs: FileRef[] = [];
  for (const motor of form?.motors ?? []) {
    refs.push(...collectCasePrepFileRefsFromMotorData(motor?.data));
  }
  refs.push(...collectCasePrepFileRefsFromMotorData(form?.subscaleData));
  return refs;
};

export const hasIncompleteCasePrepUploads = (form: {
  motors?: Array<{ data?: CasePrepMotorData | null }>;
  subscaleData?: CasePrepMotorData | null;
}): boolean => collectCasePrepFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromCasePrepForm = (form: {
  motors?: Array<{ data?: CasePrepMotorData | null }>;
  subscaleData?: CasePrepMotorData | null;
}): string[] =>
  [
    ...new Set(
      collectCasePrepFileRefsFromForm(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

