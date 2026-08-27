import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { formatToIsoDateInput, formatToUiDate } from "../../../utils/dateUtils";
import { QC_CASTING_SECTION_IDS } from "./qcCastingConfig";

export type QcCastingMandrelRow = {
  SR_NO?: number | string;
  READING_WITHOUT_CUP?: string;
  READING_WITH_BOTTOM_CUP?: string;
};

export type QcCastingTableRow = {
  SR_NO?: number | string;
  FINAL_MIX_BOWL_NO?: string;
  PROPELLANT_QTY?: string;
  INITIAL_UNLOADING_VISCOSITY?: string;
  CASTING_START_TIME?: string;
  CASTING_COMPLETION_TIME?: string;
  SLURRY_CAST_FROM_EACH_BOWL?: string;
  REMARKS?: string;
};

export type QcCastingWeightmentRow = {
  LOAD_CELL_INITIAL?: string;
  LOAD_CELL_FINAL?: string;
  TOTAL_WEIGHT?: string;
};

export type QcCastingPressurePlateRow = {
  SR_NO?: number | string;
  START_TIME?: string;
  END_TIME?: string;
  PRESSURE_SENSOR_USED?: string;
  INITIAL_PRESSURE_READING?: string;
  OBSERVATIONS?: string;
};

export type QcCastingMotorSubmissionType = "DRAFT" | "SUBMIT";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const toFiniteNumber = (value: unknown): number | undefined => {
  const raw = String(value ?? "")
    .trim()
    .replace(/,/g, "");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const formatWeightmentNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
};

/** Auto total weight = final − initial (matches API example 1500 − 1000 = 500). */
export const calcWeightmentTotalWeight = (
  initial: unknown,
  finalReading: unknown,
): string => {
  const a = toFiniteNumber(initial);
  const b = toFiniteNumber(finalReading);
  if (a == null || b == null) return "";
  return formatWeightmentNumber(b - a);
};

export const applyWeightmentFieldChange = (
  row: QcCastingWeightmentRow,
  field: keyof QcCastingWeightmentRow,
  value: string,
): QcCastingWeightmentRow => {
  const next: QcCastingWeightmentRow = { ...row, [field]: value };
  if (field === "LOAD_CELL_INITIAL" || field === "LOAD_CELL_FINAL") {
    next.TOTAL_WEIGHT = calcWeightmentTotalWeight(next.LOAD_CELL_INITIAL, next.LOAD_CELL_FINAL);
  }
  return next;
};

const emptyWeightmentRow = (): QcCastingWeightmentRow => ({
  LOAD_CELL_INITIAL: "",
  LOAD_CELL_FINAL: "",
  TOTAL_WEIGHT: "",
});

const fillWeightmentTotalIfEmpty = (row: QcCastingWeightmentRow): QcCastingWeightmentRow => ({
  ...row,
  TOTAL_WEIGHT:
    String(row.TOTAL_WEIGHT ?? "").trim() ||
    calcWeightmentTotalWeight(row.LOAD_CELL_INITIAL, row.LOAD_CELL_FINAL),
});

const firstWeightmentRow = (rows: QcCastingWeightmentRow[]): QcCastingWeightmentRow =>
  rows[0] ?? emptyWeightmentRow();

/** HH:mm → hours number for API; plain number stays numeric. */
const toSoakingDurationApi = (value: string): number | string | undefined => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const time = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (time) {
    const hours = Number(time[1]);
    const minutes = Number(time[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return trimmed;
    const total = hours + minutes / 60;
    return minutes === 0 ? hours : Number(total.toFixed(2));
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : trimmed;
};

const fromSoakingDurationApi = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${String(hours).padStart(2, "0")}:${String(Math.max(0, minutes)).padStart(2, "0")}`;
  }
  const raw = String(value).trim();
  if (/^\d{1,2}:\d{2}/.test(raw)) {
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return raw;
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  const n = Number(raw);
  if (Number.isFinite(n) && !raw.includes(":")) return fromSoakingDurationApi(n);
  return raw;
};

const toApiDate = (value: string) => formatToIsoDateInput(value) || undefined;

const normalizeTimeValue = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const emptyMandrelRow = (srNo = 1): QcCastingMandrelRow => ({
  SR_NO: srNo,
  READING_WITHOUT_CUP: "",
  READING_WITH_BOTTOM_CUP: "",
});

const emptyCastingRow = (srNo = 1): QcCastingTableRow => ({
  SR_NO: srNo,
  FINAL_MIX_BOWL_NO: "",
  PROPELLANT_QTY: "",
  INITIAL_UNLOADING_VISCOSITY: "",
  CASTING_START_TIME: "",
  CASTING_COMPLETION_TIME: "",
  SLURRY_CAST_FROM_EACH_BOWL: "",
  REMARKS: "",
});

const emptyPressurePlateRow = (srNo = 1): QcCastingPressurePlateRow => ({
  SR_NO: srNo,
  START_TIME: "",
  END_TIME: "",
  PRESSURE_SENSOR_USED: "",
  INITIAL_PRESSURE_READING: "",
  OBSERVATIONS: "",
});

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

export const createInitialCastingValues = (): SchemaFormValues => ({
  [formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE")]: "",
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE")]: "",
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY")]: [emptyMandrelRow(1)],
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "DATE_OF_CASTING")]: "",
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "RH_PERCENT")]: "",
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "VACUUM_MAINTAINED")]: "",
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE")]: [emptyCastingRow(1)],
  [formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS")]: [emptyWeightmentRow()],
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "SOAKING_DURATION")]: "",
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_ASSEMBLY_REQUIRED")]: "",
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS")]: [emptyPressurePlateRow(1)],
});

export const getCastingType = (values: SchemaFormValues | null | undefined) =>
  String(values?.[formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE")] ?? "");

export const setCastingType = (
  values: SchemaFormValues | null | undefined,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE")]: value,
});

export const getCastingAssemblyDate = (values: SchemaFormValues | null | undefined) =>
  String(values?.[formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE")] ?? "");

export const setCastingAssemblyDate = (
  values: SchemaFormValues | null | undefined,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE")]: value,
});

export const getCastingMandrelRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingMandrelRow[] =>
  normalizeRows(
    readTableRows<QcCastingMandrelRow>(
      values,
      formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY"),
      [emptyMandrelRow(1)],
    ),
  );

export const setCastingMandrelRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingMandrelRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY")]: normalizeRows(rows),
});

export const getCastingPropellantField = (
  values: SchemaFormValues | null | undefined,
  field: "DATE_OF_CASTING" | "RH_PERCENT" | "VACUUM_MAINTAINED",
) => String(values?.[formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, field)] ?? "");

export const setCastingPropellantField = (
  values: SchemaFormValues | null | undefined,
  field: "DATE_OF_CASTING" | "RH_PERCENT" | "VACUUM_MAINTAINED",
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, field)]: value,
});

export const getCastingTableRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingTableRow[] =>
  normalizeRows(
    readTableRows<QcCastingTableRow>(
      values,
      formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE"),
      [emptyCastingRow(1)],
    ),
  );

export const setCastingTableRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingTableRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE")]: normalizeRows(rows),
});

export const getCastingWeightmentRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingWeightmentRow[] => {
  const rows = readTableRows<QcCastingWeightmentRow>(
    values,
    formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS"),
    [emptyWeightmentRow()],
  );
  return [firstWeightmentRow(rows)];
};

export const setCastingWeightmentRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingWeightmentRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS")]: [
    rows[0] ?? emptyWeightmentRow(),
  ],
});

export const getCastingPostCastField = (
  values: SchemaFormValues | null | undefined,
  field: "SOAKING_DURATION" | "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
) => String(values?.[formKey(QC_CASTING_SECTION_IDS.POST_CAST, field)] ?? "");

export const setCastingPostCastField = (
  values: SchemaFormValues | null | undefined,
  field: "SOAKING_DURATION" | "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, field)]: value,
});

export const getCastingPressurePlateRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingPressurePlateRow[] =>
  normalizeRows(
    readTableRows<QcCastingPressurePlateRow>(
      values,
      formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS"),
      [emptyPressurePlateRow(1)],
    ),
  );

export const setCastingPressurePlateRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingPressurePlateRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS")]: normalizeRows(rows),
});

const mandrelRowHasData = (row: QcCastingMandrelRow) =>
  hasValue(row.READING_WITHOUT_CUP) || hasValue(row.READING_WITH_BOTTOM_CUP);

const castingRowHasData = (row: QcCastingTableRow) =>
  hasValue(row.FINAL_MIX_BOWL_NO) ||
  hasValue(row.PROPELLANT_QTY) ||
  hasValue(row.INITIAL_UNLOADING_VISCOSITY) ||
  hasValue(row.CASTING_START_TIME) ||
  hasValue(row.CASTING_COMPLETION_TIME) ||
  hasValue(row.SLURRY_CAST_FROM_EACH_BOWL) ||
  hasValue(row.REMARKS);

const weightmentRowHasData = (row: QcCastingWeightmentRow) =>
  hasValue(row.LOAD_CELL_INITIAL) || hasValue(row.LOAD_CELL_FINAL);

const pressurePlateRowHasData = (row: QcCastingPressurePlateRow) =>
  hasValue(row.START_TIME) ||
  hasValue(row.END_TIME) ||
  hasValue(row.PRESSURE_SENSOR_USED) ||
  hasValue(row.INITIAL_PRESSURE_READING) ||
  hasValue(row.OBSERVATIONS);

const sanitizeMandrelRows = (rows: QcCastingMandrelRow[]) =>
  normalizeRows(rows.filter(mandrelRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    READING_WITHOUT_CUP: String(row.READING_WITHOUT_CUP ?? "").trim(),
    READING_WITH_BOTTOM_CUP: String(row.READING_WITH_BOTTOM_CUP ?? "").trim(),
  }));

const sanitizeCastingRows = (rows: QcCastingTableRow[]) =>
  normalizeRows(rows.filter(castingRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    FINAL_MIX_BOWL_NO: String(row.FINAL_MIX_BOWL_NO ?? "").trim(),
    PROPELLANT_QTY: String(row.PROPELLANT_QTY ?? "").trim(),
    INITIAL_UNLOADING_VISCOSITY: String(row.INITIAL_UNLOADING_VISCOSITY ?? "").trim(),
    CASTING_START_TIME: String(row.CASTING_START_TIME ?? "").trim(),
    CASTING_COMPLETION_TIME: String(row.CASTING_COMPLETION_TIME ?? "").trim(),
    SLURRY_CAST_FROM_EACH_BOWL: String(row.SLURRY_CAST_FROM_EACH_BOWL ?? "").trim(),
    REMARKS: String(row.REMARKS ?? "").trim(),
  }));

const sanitizeWeightmentRow = (rows: QcCastingWeightmentRow[]): QcCastingWeightmentRow => {
  const row = fillWeightmentTotalIfEmpty(rows[0] ?? emptyWeightmentRow());
  return {
    LOAD_CELL_INITIAL: String(row.LOAD_CELL_INITIAL ?? "").trim(),
    LOAD_CELL_FINAL: String(row.LOAD_CELL_FINAL ?? "").trim(),
    TOTAL_WEIGHT: String(row.TOTAL_WEIGHT ?? "").trim(),
  };
};

const sanitizePressurePlateRows = (rows: QcCastingPressurePlateRow[]) =>
  normalizeRows(rows.filter(pressurePlateRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    START_TIME: String(row.START_TIME ?? "").trim(),
    END_TIME: String(row.END_TIME ?? "").trim(),
    PRESSURE_SENSOR_USED: String(row.PRESSURE_SENSOR_USED ?? "").trim(),
    INITIAL_PRESSURE_READING: String(row.INITIAL_PRESSURE_READING ?? "").trim(),
    OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim(),
  }));

const mapMandrelRowsForApi = (rows: ReturnType<typeof sanitizeMandrelRows>) =>
  rows.map((row) => ({
    srNo: row.SR_NO,
    readingWithoutCup: toFiniteNumber(row.READING_WITHOUT_CUP) ?? row.READING_WITHOUT_CUP,
    readingWithBottomCup:
      toFiniteNumber(row.READING_WITH_BOTTOM_CUP) ?? row.READING_WITH_BOTTOM_CUP,
  }));

const mapCastingDetailsForApi = (rows: ReturnType<typeof sanitizeCastingRows>) =>
  rows.map((row) => ({
    srNo: row.SR_NO,
    finalMixBowlNo: row.FINAL_MIX_BOWL_NO,
    propellantQty: toFiniteNumber(row.PROPELLANT_QTY) ?? row.PROPELLANT_QTY,
    initialUnloadingViscosity:
      toFiniteNumber(row.INITIAL_UNLOADING_VISCOSITY) ?? row.INITIAL_UNLOADING_VISCOSITY,
    castingStartTime: row.CASTING_START_TIME,
    castingCompletionTime: row.CASTING_COMPLETION_TIME,
    slurryCastFromEachBowl:
      toFiniteNumber(row.SLURRY_CAST_FROM_EACH_BOWL) ?? row.SLURRY_CAST_FROM_EACH_BOWL,
    remarks: row.REMARKS,
  }));

const mapWeightmentDetailsForApi = (row: QcCastingWeightmentRow) => {
  const initial = toFiniteNumber(row.LOAD_CELL_INITIAL);
  const finalReading = toFiniteNumber(row.LOAD_CELL_FINAL);
  const totalWeight =
    toFiniteNumber(row.TOTAL_WEIGHT) ?? toFiniteNumber(calcWeightmentTotalWeight(initial, finalReading));
  return {
    loadCellReading: {
      ...(initial != null ? { initial } : {}),
      ...(finalReading != null ? { final: finalReading } : {}),
    },
    ...(totalWeight != null ? { totalWeight } : {}),
  };
};

const mapPressurePlateDetailsForApi = (rows: ReturnType<typeof sanitizePressurePlateRows>) =>
  rows.map((row) => ({
    srNo: row.SR_NO,
    startTime: row.START_TIME,
    endTime: row.END_TIME,
    pressureSensorUsed: row.PRESSURE_SENSOR_USED,
    initialPressureReading:
      toFiniteNumber(row.INITIAL_PRESSURE_READING) ?? row.INITIAL_PRESSURE_READING,
    observations: row.OBSERVATIONS,
  }));

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const buildQcCastingSectionsPayload = (
  values: SchemaFormValues | null | undefined,
): Record<string, unknown> => {
  const mandrelRows = sanitizeMandrelRows(getCastingMandrelRows(values));
  const castingRows = sanitizeCastingRows(getCastingTableRows(values));
  const weightmentRow = sanitizeWeightmentRow(getCastingWeightmentRows(values));
  const soakingDuration = getCastingPostCastField(values, "SOAKING_DURATION");
  const pressureRequired = getCastingPostCastField(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED");
  const pressureRows =
    pressureRequired === "YES" ? sanitizePressurePlateRows(getCastingPressurePlateRows(values)) : [];
  const dateOfCasting = toApiDate(getCastingPropellantField(values, "DATE_OF_CASTING"));
  const rhPercent = toFiniteNumber(getCastingPropellantField(values, "RH_PERCENT"));
  const vacuumMaintained = toFiniteNumber(
    getCastingPropellantField(values, "VACUUM_MAINTAINED"),
  );

  const finalAssemblyDetails =
    mandrelRows.length || hasValue(getCastingAssemblyDate(values)) || weightmentRowHasData(weightmentRow)
      ? {
          motorCasing: [
            omitEmpty({
              mandrelMeasurements: mandrelRows.map((row, index) =>
                omitEmpty({
                  srNo: Number(row.SR_NO) || index + 1,
                  aMock: toFiniteNumber(row.READING_WITHOUT_CUP),
                  bMock: toFiniteNumber(row.READING_WITH_BOTTOM_CUP),
                }),
              ),
              emptyMotorWeight: toFiniteNumber(weightmentRow.TOTAL_WEIGHT),
            }),
          ],
        }
      : undefined;

  const castingProcess =
    castingRows.length ||
    hasValue(dateOfCasting) ||
    rhPercent != null ||
    vacuumMaintained != null
      ? omitEmpty({
          dateOfCasting: dateOfCasting || undefined,
          finalMixBowlDetails: castingRows.map((row, index) =>
            omitEmpty({
              srNo: Number(row.SR_NO) || index + 1,
              bowlId: row.FINAL_MIX_BOWL_NO || undefined,
              bowlReceiptTime: row.CASTING_START_TIME || undefined,
              initialWeight: toFiniteNumber(row.PROPELLANT_QTY),
              finalWeight: toFiniteNumber(row.SLURRY_CAST_FROM_EACH_BOWL),
              dcOpenTime: row.CASTING_START_TIME || undefined,
              dcCloseTime: row.CASTING_COMPLETION_TIME || undefined,
            }),
          ),
          castingFromBowlDetails: castingRows.map((row, index) =>
            omitEmpty({
              srNo: Number(row.SR_NO) || index + 1,
              bowlId: row.FINAL_MIX_BOWL_NO || undefined,
              rh: rhPercent,
              viscosity: toFiniteNumber(row.INITIAL_UNLOADING_VISCOSITY),
              slurryCast: toFiniteNumber(row.SLURRY_CAST_FROM_EACH_BOWL),
              remarks: row.REMARKS || undefined,
            }),
          ),
          initialVacuum: vacuumMaintained,
          vacuumPressureCasting: vacuumMaintained,
          vacuumPressureSoaking: vacuumMaintained,
        })
      : undefined;

  const slurryCastDetails = castingRows.length
    ? {
        slurryCastFromBowls: [
          ...castingRows.map((row, index) =>
            omitEmpty({
              rowKey: String(Number(row.SR_NO) || index + 1),
              fmMotorLabel: row.FINAL_MIX_BOWL_NO || undefined,
              slurryCast: toFiniteNumber(row.SLURRY_CAST_FROM_EACH_BOWL),
            }),
          ),
          omitEmpty({
            rowKey: "TOTAL",
            fmMotorLabel: "Total Slurry Cast",
            slurryCast: castingRows.reduce((sum, row) => {
              const n = toFiniteNumber(row.SLURRY_CAST_FROM_EACH_BOWL);
              return sum + (n ?? 0);
            }, 0),
          }),
        ],
      }
    : undefined;

  const weightmentDetails = weightmentRowHasData(weightmentRow)
    ? omitEmpty({
        loadCellReading: omitEmpty({
          initial: toFiniteNumber(weightmentRow.LOAD_CELL_INITIAL),
          final: toFiniteNumber(weightmentRow.LOAD_CELL_FINAL),
        }),
        totalWeight: toFiniteNumber(weightmentRow.TOTAL_WEIGHT),
      })
    : undefined;

  const firstPressure = pressureRows[0];
  const postCastOperations =
    hasValue(soakingDuration) || hasValue(pressureRequired) || pressureRows.length
      ? omitEmpty({
          postCastTable: [
            ...(hasValue(soakingDuration)
              ? [{ srNo: 1, activity: "Soaking Time", details: soakingDuration }]
              : []),
            ...(firstPressure?.PRESSURE_SENSOR_USED
              ? [
                  {
                    srNo: hasValue(soakingDuration) ? 2 : 1,
                    activity: "Pressure sensor details (If applicable)",
                    details: firstPressure.PRESSURE_SENSOR_USED,
                  },
                ]
              : []),
            ...(firstPressure?.INITIAL_PRESSURE_READING
              ? [
                  {
                    srNo:
                      (hasValue(soakingDuration) ? 1 : 0) +
                      (firstPressure.PRESSURE_SENSOR_USED ? 1 : 0) +
                      1,
                    activity: "Initial pressure reading (If applicable)",
                    details: firstPressure.INITIAL_PRESSURE_READING,
                  },
                ]
              : []),
          ],
          ...(pressureRequired === "YES"
            ? {
                pressurePlateAssemblyRequired: "YES",
                pressurePlateDetails: mapPressurePlateDetailsForApi(pressureRows),
              }
            : hasValue(pressureRequired)
              ? { pressurePlateAssemblyRequired: pressureRequired }
              : {}),
        })
      : undefined;

  return omitEmpty({
    finalAssemblyDetails,
    castingProcess,
    slurryCastDetails,
    weightmentDetails,
    postCastOperations,
  });
};

/** Nested Casting/Curing direct DTO for QC create/update (`data.motorDetails[]`). */
export const buildCastingMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcCastingMotorSubmissionType = "DRAFT",
  options?: { motorReceivedAt?: string; castingStation?: string },
): Record<string, unknown> => {
  const castingType = getCastingType(values).trim();
  const assemblyDate = toApiDate(getCastingAssemblyDate(values));

  return omitEmpty({
    motorId,
    motorSubmissionType,
    ...(options?.motorReceivedAt ? { motorReceivedAt: options.motorReceivedAt } : {}),
    ...(assemblyDate ? { motorReceivedAt: `${assemblyDate}T00:00:00` } : {}),
    setup: omitEmpty({
      castingType: castingType || undefined,
      castingStation: options?.castingStation || undefined,
    }),
    castingSections: buildQcCastingSectionsPayload(values),
  });
};

/** Legacy section payload (internal hydrate / manufacturing seed). */
export const buildCastingSectionPayload = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];
  const castingType = getCastingType(values);
  if (hasValue(castingType)) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.SELECTION,
      sectionData: [{ CASTING_TYPE: castingType }],
    });
  }

  const assemblyDate = getCastingAssemblyDate(values);
  const mandrelRows = sanitizeMandrelRows(getCastingMandrelRows(values));
  if (hasValue(assemblyDate) || mandrelRows.length) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY,
      sectionData: [
        {
          ...(hasValue(assemblyDate) ? { ASSEMBLY_DATE: assemblyDate } : {}),
          ...(mandrelRows.length ? { MANDREL_ASSEMBLY: mandrelRows } : {}),
        },
      ],
    });
  }

  const propellantFields = {
    DATE_OF_CASTING: getCastingPropellantField(values, "DATE_OF_CASTING"),
    RH_PERCENT: getCastingPropellantField(values, "RH_PERCENT"),
    VACUUM_MAINTAINED: getCastingPropellantField(values, "VACUUM_MAINTAINED"),
  };
  const castingRows = sanitizeCastingRows(getCastingTableRows(values));
  if (
    hasValue(propellantFields.DATE_OF_CASTING) ||
    hasValue(propellantFields.RH_PERCENT) ||
    hasValue(propellantFields.VACUUM_MAINTAINED) ||
    castingRows.length
  ) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.PROPELLANT_CASTING,
      sectionData: [
        {
          ...(hasValue(propellantFields.DATE_OF_CASTING)
            ? { DATE_OF_CASTING: propellantFields.DATE_OF_CASTING }
            : {}),
          ...(hasValue(propellantFields.RH_PERCENT)
            ? { RH_PERCENT: propellantFields.RH_PERCENT }
            : {}),
          ...(hasValue(propellantFields.VACUUM_MAINTAINED)
            ? { VACUUM_MAINTAINED: propellantFields.VACUUM_MAINTAINED }
            : {}),
          ...(castingRows.length ? { CASTING_TABLE: castingRows } : {}),
        },
      ],
    });
  }

  const weightmentRow = sanitizeWeightmentRow(getCastingWeightmentRows(values));
  if (weightmentRowHasData(weightmentRow)) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.WEIGHTMENT,
      sectionData: [{ WEIGHTMENT_DETAILS: [weightmentRow] }],
    });
  }

  const soakingDuration = getCastingPostCastField(values, "SOAKING_DURATION");
  const pressureRequired = getCastingPostCastField(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED");
  const pressureRows =
    pressureRequired === "YES"
      ? sanitizePressurePlateRows(getCastingPressurePlateRows(values))
      : [];
  if (hasValue(soakingDuration) || hasValue(pressureRequired) || pressureRows.length) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.POST_CAST,
      sectionData: [
        {
          ...(hasValue(soakingDuration) ? { SOAKING_DURATION: soakingDuration } : {}),
          ...(hasValue(pressureRequired)
            ? { PRESSURE_PLATE_ASSEMBLY_REQUIRED: pressureRequired }
            : {}),
          ...(pressureRows.length ? { PRESSURE_PLATE_DETAILS: pressureRows } : {}),
        },
      ],
    });
  }

  return sections;
};

const pickRowField = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") return String(row[key]).trim();
  }
  return "";
};

const mapApiMandrelRows = (rows: unknown[]): QcCastingMandrelRow[] =>
  rows
    .map((row, index) => {
      const rec = asRecord(row);
      if (!rec) return null;
      const withoutCup =
        pickRowField(
          rec,
          "readingWithoutCup",
          "READING_WITHOUT_CUP",
          "aFinal",
          "A_FINAL",
          "afinal",
          "aMock",
          "amock",
          "A_MOCK",
        ) || "";
      const withCup =
        pickRowField(
          rec,
          "readingWithBottomCup",
          "READING_WITH_BOTTOM_CUP",
          "bFinal",
          "B_FINAL",
          "bfinal",
          "bMock",
          "bmock",
          "B_MOCK",
        ) || "";
      if (!withoutCup && !withCup) return null;
      return {
        SR_NO: Number(pickRowField(rec, "srNo", "SR_NO")) || index + 1,
        READING_WITHOUT_CUP: withoutCup,
        READING_WITH_BOTTOM_CUP: withCup,
      } satisfies QcCastingMandrelRow;
    })
    .filter(Boolean) as QcCastingMandrelRow[];

/** Merge finalMixBowlDetails + castingFromBowlDetails (same bowl / srNo) into one UI row. */
const mergeCastingProcessBowlRows = (
  finalMixRows: unknown[],
  fromBowlRows: unknown[],
): Record<string, unknown>[] => {
  const byKey = new Map<string, Record<string, unknown>>();

  const keyFor = (rec: Record<string, unknown>, index: number) => {
    const bowl = String(rec.bowlId ?? rec.BOWL_ID ?? "").trim();
    if (bowl) return `bowl:${bowl}`;
    return `sr:${String(rec.srNo ?? rec.SR_NO ?? index + 1)}`;
  };

  finalMixRows.forEach((row, index) => {
    const rec = asRecord(row);
    if (!rec) return;
    byKey.set(keyFor(rec, index), { ...rec });
  });

  fromBowlRows.forEach((row, index) => {
    const rec = asRecord(row);
    if (!rec) return;
    const key = keyFor(rec, index);
    byKey.set(key, { ...(byKey.get(key) ?? {}), ...rec });
  });

  if (byKey.size) return Array.from(byKey.values());
  return [...finalMixRows, ...fromBowlRows]
    .map((row) => asRecord(row))
    .filter(Boolean) as Record<string, unknown>[];
};

const mapApiCastingDetailRows = (rows: unknown[]): QcCastingTableRow[] =>
  rows
    .map((row, index) => {
      const rec = asRecord(row);
      if (!rec) return null;
      return {
        SR_NO: Number(pickRowField(rec, "srNo", "SR_NO")) || index + 1,
        FINAL_MIX_BOWL_NO: pickRowField(
          rec,
          "finalMixBowlNo",
          "FINAL_MIX_BOWL_NO",
          "bowlId",
          "BOWL_ID",
          "fmMotorLabel",
        ),
        PROPELLANT_QTY: pickRowField(
          rec,
          "propellantQty",
          "PROPELLANT_QTY",
          "initialWeight",
          "INITIAL_WEIGHT",
        ),
        INITIAL_UNLOADING_VISCOSITY: pickRowField(
          rec,
          "initialUnloadingViscosity",
          "INITIAL_UNLOADING_VISCOSITY",
          "viscosity",
          "VISCOSITY",
        ),
        CASTING_START_TIME: normalizeTimeValue(
          pickRowField(rec, "castingStartTime", "CASTING_START_TIME", "bowlReceiptTime", "dcOpenTime"),
        ),
        CASTING_COMPLETION_TIME: normalizeTimeValue(
          pickRowField(
            rec,
            "castingCompletionTime",
            "CASTING_COMPLETION_TIME",
            "dcCloseTime",
            "ballValveOpenTime",
          ),
        ),
        SLURRY_CAST_FROM_EACH_BOWL: pickRowField(
          rec,
          "slurryCastFromEachBowl",
          "SLURRY_CAST_FROM_EACH_BOWL",
          "slurryCast",
          "SLURRY_CAST",
          "finalWeight",
        ),
        // QC payload stores remarks on castingFromBowlDetails.motorId (see buildQcCastingSectionsPayload).
        REMARKS: (() => {
          const direct = pickRowField(rec, "remarks", "REMARKS");
          if (direct) return direct;
          const maybe = pickRowField(rec, "motorId", "MOTOR_ID");
          // Ignore values that look like real motor IDs.
          if (!maybe || /^RMC-/i.test(maybe)) return "";
          return maybe;
        })(),
      } satisfies QcCastingTableRow;
    })
    .filter(Boolean) as QcCastingTableRow[];

const mapApiWeightmentRow = (value: unknown): QcCastingWeightmentRow | null => {
  const rec = asRecord(value) ?? asRecord(asArray(value)[0]);
  if (!rec) return null;
  const loadCell = asRecord(rec.loadCellReading) ?? asRecord(rec.LOAD_CELL_READING);
  const initial = pickRowField(
    { ...(loadCell ?? {}), ...rec },
    "initial",
    "INITIAL",
    "LOAD_CELL_INITIAL",
  );
  const finalReading = pickRowField(
    { ...(loadCell ?? {}), ...rec },
    "final",
    "FINAL",
    "LOAD_CELL_FINAL",
  );
  return fillWeightmentTotalIfEmpty({
    LOAD_CELL_INITIAL: String(initial ?? ""),
    LOAD_CELL_FINAL: String(finalReading ?? ""),
    TOTAL_WEIGHT: String(pickRowField(rec, "totalWeight", "TOTAL_WEIGHT") ?? ""),
  });
};

const mapApiPressurePlateRows = (rows: unknown[]): QcCastingPressurePlateRow[] =>
  rows
    .map((row, index) => {
      const rec = asRecord(row);
      if (!rec) return null;
      return {
        SR_NO: Number(pickRowField(rec, "srNo", "SR_NO")) || index + 1,
        START_TIME: String(pickRowField(rec, "startTime", "START_TIME")),
        END_TIME: String(pickRowField(rec, "endTime", "END_TIME")),
        PRESSURE_SENSOR_USED: String(
          pickRowField(rec, "pressureSensorUsed", "PRESSURE_SENSOR_USED"),
        ),
        INITIAL_PRESSURE_READING: String(
          pickRowField(rec, "initialPressureReading", "INITIAL_PRESSURE_READING"),
        ),
        OBSERVATIONS: String(pickRowField(rec, "observations", "OBSERVATIONS")),
      } satisfies QcCastingPressurePlateRow;
    })
    .filter(Boolean) as QcCastingPressurePlateRow[];

export const isCastingNestedMotorDetail = (motor: Record<string, unknown>) =>
  Boolean(
    motor.setup ||
      motor.castingSections ||
      asRecord(motor.details)?.castingSections ||
      motor.castingSelection ||
      motor.finalAssembly ||
      motor.propellantCasting ||
      motor.weightmentDetails ||
      motor.postCastOperations,
  );

/** Convert nested Casting motorDetails item → section rows for hydrateCastingValuesFromSections. */
export const castingMotorDetailToSections = (
  motor: Record<string, unknown>,
  motorId?: string,
): SchemaSectionSubmission[] => {
  const id =
    String(motorId ?? motor.motorIdNo ?? motor.motorId ?? motor.id ?? "").trim() || undefined;

  const castingSections =
    asRecord(motor.castingSections) ?? asRecord(asRecord(motor.details)?.castingSections);
  if (castingSections) {
    const sections: SchemaSectionSubmission[] = [];
    const setup = asRecord(motor.setup) ?? asRecord(asRecord(motor.details)?.setup);
    if (setup) {
      sections.push({
        sectionId: QC_CASTING_SECTION_IDS.SELECTION,
        ...(id ? { motorId: id } : {}),
        sectionData: [
          { CASTING_TYPE: String(setup.castingType ?? setup.CASTING_TYPE ?? "") },
        ],
      });
    }

    const assemblyDateRaw = String(
      motor.motorReceivedAt ??
        motor.MOTOR_RECEIVED_AT ??
        asRecord(motor.details)?.motorReceivedAt ??
        "",
    ).trim();
    const assemblyDate = formatToUiDate(assemblyDateRaw) || assemblyDateRaw;

    const finalAssemblyDetails = asRecord(castingSections.finalAssemblyDetails);
    const motorCasing = asRecord(asArray(finalAssemblyDetails?.motorCasing)[0]);
    const mandrelRows = mapApiMandrelRows(
      asArray(motorCasing?.mandrelMeasurements ?? motorCasing?.MANDREL_MEASUREMENTS),
    );
    if (motorCasing || assemblyDate) {
      sections.push({
        sectionId: QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY,
        ...(id ? { motorId: id } : {}),
        sectionData: [
          {
            ...(assemblyDate ? { ASSEMBLY_DATE: assemblyDate } : {}),
            ...(mandrelRows.length ? { MANDREL_ASSEMBLY: mandrelRows } : {}),
          },
        ],
      });
    }

    const castingProcess = asRecord(castingSections.castingProcess);
    if (castingProcess) {
      const mergedBowlRows = mergeCastingProcessBowlRows(
        asArray(castingProcess.finalMixBowlDetails ?? castingProcess.FINAL_MIX_BOWL_DETAILS),
        asArray(
          castingProcess.castingFromBowlDetails ?? castingProcess.CASTING_FROM_BOWL_DETAILS,
        ),
      );
      // slurryCastDetails can fill slurry cast when process rows omit it
      const slurryRows = asArray(
        asRecord(castingSections.slurryCastDetails)?.slurryCastFromBowls,
      );
      slurryRows.forEach((row) => {
        const rec = asRecord(row);
        if (!rec) return;
        const label = String(rec.fmMotorLabel ?? rec.bowlId ?? "").trim();
        const slurry = pickRowField(rec, "slurryCast", "SLURRY_CAST");
        if (!label || !slurry) return;
        const match = mergedBowlRows.find(
          (bowl) => String(bowl.bowlId ?? bowl.BOWL_ID ?? "").trim() === label,
        );
        if (match && !pickRowField(match, "slurryCast", "SLURRY_CAST")) {
          match.slurryCast = slurry;
        }
      });

      const firstFromBowl = asRecord(mergedBowlRows[0]) ?? {};
      const dateRaw = String(
        castingProcess.dateOfCasting ?? castingProcess.DATE_OF_CASTING ?? "",
      ).trim();
      sections.push({
        sectionId: QC_CASTING_SECTION_IDS.PROPELLANT_CASTING,
        ...(id ? { motorId: id } : {}),
        sectionData: [
          {
            ...(dateRaw
              ? { DATE_OF_CASTING: formatToUiDate(dateRaw) || dateRaw }
              : {}),
            RH_PERCENT: pickRowField(firstFromBowl, "rh", "RH", "RH_PERCENT"),
            VACUUM_MAINTAINED: String(
              castingProcess.initialVacuum ??
                castingProcess.vacuumPressureCasting ??
                castingProcess.vacuumPressureSoaking ??
                "",
            ),
            CASTING_TABLE: mapApiCastingDetailRows(mergedBowlRows),
          },
        ],
      });
    }

    const weightmentDetails =
      asRecord(castingSections.weightmentDetails) ??
      asRecord(castingSections.WEIGHTMENT_DETAILS);
    if (weightmentDetails) {
      const mappedWeightment = mapApiWeightmentRow(weightmentDetails);
      if (mappedWeightment && weightmentRowHasData(mappedWeightment)) {
        sections.push({
          sectionId: QC_CASTING_SECTION_IDS.WEIGHTMENT,
          ...(id ? { motorId: id } : {}),
          sectionData: [{ WEIGHTMENT_DETAILS: [mappedWeightment] }],
        });
      }
    } else if (motorCasing) {
      const emptyWeight = pickRowField(motorCasing, "emptyMotorWeight", "EMPTY_MOTOR_WEIGHT");
      if (emptyWeight) {
        sections.push({
          sectionId: QC_CASTING_SECTION_IDS.WEIGHTMENT,
          ...(id ? { motorId: id } : {}),
          sectionData: [
            {
              WEIGHTMENT_DETAILS: [
                {
                  TOTAL_WEIGHT: emptyWeight,
                  LOAD_CELL_INITIAL: "",
                  LOAD_CELL_FINAL: "",
                },
              ],
            },
          ],
        });
      }
    }

    const postCastOperations = asRecord(castingSections.postCastOperations);
    if (postCastOperations) {
      const postCastTable = asArray(postCastOperations.postCastTable);
      const soakingRow = postCastTable.find((row) =>
        /soaking/i.test(String(asRecord(row)?.activity ?? "")),
      );
      const pressureSensorRow = postCastTable.find((row) =>
        /pressure sensor/i.test(String(asRecord(row)?.activity ?? "")),
      );
      const initialPressureRow = postCastTable.find((row) =>
        /initial pressure/i.test(String(asRecord(row)?.activity ?? "")),
      );
      const pressurePlateRow = postCastTable.find((row) =>
        /pressure\s*plate/i.test(String(asRecord(row)?.activity ?? "")),
      );
      const pressureDetailsRows = mapApiPressurePlateRows(
        asArray(
          postCastOperations.pressurePlateDetails ?? postCastOperations.PRESSURE_PLATE_DETAILS,
        ),
      );
      const sensor = String(asRecord(pressureSensorRow)?.details ?? "").trim();
      const initialPressure = String(asRecord(initialPressureRow)?.details ?? "").trim();
      const pressureObs = String(asRecord(pressurePlateRow)?.details ?? "").trim();
      const pressureRequired = String(
        postCastOperations.pressurePlateAssemblyRequired ??
          postCastOperations.PRESSURE_PLATE_ASSEMBLY_REQUIRED ??
          (pressureDetailsRows.length || sensor || initialPressure || pressureObs ? "YES" : ""),
      ).trim();

      sections.push({
        sectionId: QC_CASTING_SECTION_IDS.POST_CAST,
        ...(id ? { motorId: id } : {}),
        sectionData: [
          {
            SOAKING_DURATION: fromSoakingDurationApi(asRecord(soakingRow)?.details),
            ...(pressureRequired
              ? { PRESSURE_PLATE_ASSEMBLY_REQUIRED: pressureRequired }
              : {}),
            ...(pressureDetailsRows.length
              ? { PRESSURE_PLATE_DETAILS: pressureDetailsRows }
              : sensor || initialPressure || pressureObs
                ? {
                    PRESSURE_PLATE_DETAILS: [
                      {
                        SR_NO: 1,
                        START_TIME: "",
                        END_TIME: "",
                        PRESSURE_SENSOR_USED: sensor,
                        INITIAL_PRESSURE_READING: initialPressure,
                        OBSERVATIONS: pressureObs,
                      },
                    ],
                  }
                : {}),
          },
        ],
      });
    }

    return sections;
  }

  const sections: SchemaSectionSubmission[] = [];

  const setup = asRecord(motor.setup);
  if (setup && !asRecord(motor.castingSelection)) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.SELECTION,
      ...(id ? { motorId: id } : {}),
      sectionData: [
        {
          CASTING_TYPE: String(setup.castingType ?? setup.CASTING_TYPE ?? ""),
        },
      ],
    });
  }

  const selection = asRecord(motor.castingSelection);
  if (selection) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.SELECTION,
      ...(id ? { motorId: id } : {}),
      sectionData: [
        {
          CASTING_TYPE: String(selection.castingType ?? selection.CASTING_TYPE ?? ""),
        },
      ],
    });
  }

  const finalAssembly = asRecord(motor.finalAssembly);
  if (finalAssembly) {
    const assemblyDateRaw = String(
      finalAssembly.assemblyDate ?? finalAssembly.ASSEMBLY_DATE ?? "",
    );
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY,
      ...(id ? { motorId: id } : {}),
      sectionData: [
        {
          ASSEMBLY_DATE: formatToUiDate(assemblyDateRaw) || assemblyDateRaw,
          MANDREL_ASSEMBLY: mapApiMandrelRows(asArray(finalAssembly.mandrelAssembly)),
        },
      ],
    });
  }

  const propellant = asRecord(motor.propellantCasting);
  if (propellant) {
    const dateRaw = String(propellant.dateOfCasting ?? propellant.DATE_OF_CASTING ?? "");
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.PROPELLANT_CASTING,
      ...(id ? { motorId: id } : {}),
      sectionData: [
        {
          DATE_OF_CASTING: formatToUiDate(dateRaw) || dateRaw,
          RH_PERCENT: String(propellant.rhPercent ?? propellant.RH_PERCENT ?? ""),
          VACUUM_MAINTAINED: String(
            propellant.vacuumMaintained ?? propellant.VACUUM_MAINTAINED ?? "",
          ),
          CASTING_TABLE: mapApiCastingDetailRows(
            asArray(propellant.castingDetails ?? propellant.CASTING_TABLE),
          ),
        },
      ],
    });
  }

  const weightmentRow = mapApiWeightmentRow(motor.weightmentDetails);
  if (weightmentRow && weightmentRowHasData(weightmentRow)) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.WEIGHTMENT,
      ...(id ? { motorId: id } : {}),
      sectionData: [{ WEIGHTMENT_DETAILS: [weightmentRow] }],
    });
  }

  const postCast = asRecord(motor.postCastOperations);
  if (postCast) {
    const soaking = asRecord(postCast.soakingDetails);
    const pressureAssembly = asRecord(postCast.pressurePlateAssembly);
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.POST_CAST,
      ...(id ? { motorId: id } : {}),
      sectionData: [
        {
          SOAKING_DURATION: fromSoakingDurationApi(
            soaking?.soakingDuration ?? soaking?.SOAKING_DURATION ?? postCast.SOAKING_DURATION,
          ),
          PRESSURE_PLATE_ASSEMBLY_REQUIRED: String(
            pressureAssembly?.required ??
              pressureAssembly?.REQUIRED ??
              postCast.PRESSURE_PLATE_ASSEMBLY_REQUIRED ??
              "",
          ),
          PRESSURE_PLATE_DETAILS: mapApiPressurePlateRows(
            asArray(postCast.pressurePlateDetails),
          ),
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

export const hydrateCastingValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialCastingValues();

  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;

    if (sectionId === QC_CASTING_SECTION_IDS.SELECTION) {
      values[formKey(sectionId, "CASTING_TYPE")] = String(data.CASTING_TYPE ?? "");
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY) {
      values[formKey(sectionId, "ASSEMBLY_DATE")] = String(data.ASSEMBLY_DATE ?? "");
      const rows = extractTableRows<QcCastingMandrelRow>(section.sectionData, "MANDREL_ASSEMBLY");
      if (rows.length) {
        values[formKey(sectionId, "MANDREL_ASSEMBLY")] = normalizeRows(rows);
      }
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.PROPELLANT_CASTING) {
      values[formKey(sectionId, "DATE_OF_CASTING")] = String(data.DATE_OF_CASTING ?? "");
      values[formKey(sectionId, "RH_PERCENT")] = String(data.RH_PERCENT ?? "");
      values[formKey(sectionId, "VACUUM_MAINTAINED")] = String(data.VACUUM_MAINTAINED ?? "");
      const rows = extractTableRows<QcCastingTableRow>(section.sectionData, "CASTING_TABLE");
      if (rows.length) {
        values[formKey(sectionId, "CASTING_TABLE")] = normalizeRows(rows);
      }
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.WEIGHTMENT) {
      const rows = extractTableRows<QcCastingWeightmentRow>(
        section.sectionData,
        "WEIGHTMENT_DETAILS",
      );
      const mapped = mapApiWeightmentRow(rows[0] ?? data.WEIGHTMENT_DETAILS ?? data);
      if (mapped) {
        values[formKey(sectionId, "WEIGHTMENT_DETAILS")] = [mapped];
      }
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.POST_CAST) {
      values[formKey(sectionId, "SOAKING_DURATION")] = fromSoakingDurationApi(
        data.SOAKING_DURATION,
      );
      values[formKey(sectionId, "PRESSURE_PLATE_ASSEMBLY_REQUIRED")] = String(
        data.PRESSURE_PLATE_ASSEMBLY_REQUIRED ?? "",
      );
      const rows = extractTableRows<QcCastingPressurePlateRow>(
        section.sectionData,
        "PRESSURE_PLATE_DETAILS",
      );
      if (rows.length) {
        values[formKey(sectionId, "PRESSURE_PLATE_DETAILS")] = normalizeRows(rows);
      }
    }
  }

  return values;
};
