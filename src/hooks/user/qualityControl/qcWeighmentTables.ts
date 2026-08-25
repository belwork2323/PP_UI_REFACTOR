import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileRef } from "../../../data/models/common/FileUploadModel";
import { formatToIsoDateInput, formatToUiDate } from "../../../utils/dateUtils";
import {
  QC_WEIGHMENT_SECTION_IDS,
  QC_WEIGHMENT_API_PROPELLANT_FORMULA,
  applyQcWeighmentRowComputation,
  emptyQcWeighmentWeightRows,
  type QcWeighmentWeightRow,
} from "./qcWeighmentConfig";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const weighscaleNoKey = () =>
  formKey(QC_WEIGHMENT_SECTION_IDS.WEIGHTSCALE_DETAILS, "WEIGHSCALE_NO");
const calibrationKey = () =>
  formKey(QC_WEIGHMENT_SECTION_IDS.WEIGHTSCALE_DETAILS, "CALIBRATION_DUE_DATE");
const tableKey = () =>
  formKey(QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS, QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS);
const uploadReportKey = () =>
  formKey(QC_WEIGHMENT_SECTION_IDS.ATTACHMENTS, "UPLOAD_REPORT");

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const parseUploadFiles = (...candidates: unknown[]): FileRef[] => {
  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    const refs = parseFileRefs(candidate);
    if (refs.length) return refs;
  }
  return [];
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const toUiDate = (value: unknown) => formatToUiDate(String(value ?? "").trim());

const toApiNumber = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed.replace(",", "."));
  return Number.isFinite(numeric) ? numeric : trimmed;
};

const defaults = emptyQcWeighmentWeightRows();

const normalizeWeightRows = (value: unknown): QcWeighmentWeightRow[] => {
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter(Boolean);
  const mapped = defaults.map((fallback) => {
    const match =
      rows.find((row) => String(row?.SR_NO ?? row?.srNo ?? "").trim().toUpperCase() === fallback.SR_NO) ??
      null;
    return {
      SR_NO: fallback.SR_NO,
      WEIGHT_PARAMETER: pickString(
        match?.WEIGHT_PARAMETER,
        match?.weightParameter,
        fallback.WEIGHT_PARAMETER,
      ),
      WEIGHT_KG: pickString(match?.WEIGHT_KG, match?.weightKg, match?.weight),
      locked: fallback.locked,
    };
  });
  return applyQcWeighmentRowComputation(mapped);
};

export const createInitialWeighmentValues = (): SchemaFormValues => ({
  [weighscaleNoKey()]: "",
  [calibrationKey()]: "",
  [tableKey()]: emptyQcWeighmentWeightRows(),
  [uploadReportKey()]: [] as FileRef[],
});

export const getWeighmentWeighscaleNo = (values: SchemaFormValues | undefined) =>
  pickString(values?.[weighscaleNoKey()]);

export const getWeighmentCalibrationDueDate = (values: SchemaFormValues | undefined) =>
  toUiDate(pickString(values?.[calibrationKey()]));

export const getWeighmentWeightRows = (values: SchemaFormValues | undefined): QcWeighmentWeightRow[] =>
  normalizeWeightRows(values?.[tableKey()]);

export const getWeighmentUploadReport = (
  values: SchemaFormValues | undefined,
): FileRef[] => parseUploadFiles(values?.[uploadReportKey()]);

export const setWeighmentWeighscaleNo = (
  values: SchemaFormValues,
  next: string,
): SchemaFormValues => ({
  ...values,
  [weighscaleNoKey()]: next,
});

export const setWeighmentCalibrationDueDate = (
  values: SchemaFormValues,
  next: string,
): SchemaFormValues => ({
  ...values,
  [calibrationKey()]: next,
});

export const setWeighmentWeightRows = (
  values: SchemaFormValues,
  rows: QcWeighmentWeightRow[],
): SchemaFormValues => ({
  ...values,
  [tableKey()]: applyQcWeighmentRowComputation(rows),
});

export const setWeighmentUploadReport = (
  values: SchemaFormValues,
  files: FileRef[],
): SchemaFormValues => ({
  ...values,
  [uploadReportKey()]: files ?? [],
});

export const weighmentFormValuesHaveUserData = (values: SchemaFormValues | undefined): boolean => {
  if (getWeighmentWeighscaleNo(values) || getWeighmentCalibrationDueDate(values)) return true;
  if (getWeighmentUploadReport(values).length) return true;
  return getWeighmentWeightRows(values).some(
    (row) => String(row.SR_NO).toUpperCase() !== "H" && String(row.WEIGHT_KG ?? "").trim(),
  );
};

const hydrateFromSectionData = (
  values: SchemaFormValues,
  sectionId: string,
  data: Record<string, unknown>,
) => {
  const upper = String(sectionId ?? "").trim().toUpperCase();
  if (!upper || upper === QC_WEIGHMENT_SECTION_IDS.WEIGHTSCALE_DETAILS) {
    const scale = asRecord(data.weighscaleDetails) ?? data;
    const weighscale = pickString(scale.WEIGHSCALE_NO, scale.weighscaleNo);
    const calibration = toUiDate(pickString(scale.CALIBRATION_DUE_DATE, scale.calibrationDueDate));
    if (weighscale) values[weighscaleNoKey()] = weighscale;
    if (calibration) values[calibrationKey()] = calibration;
  }
  if (!upper || upper === QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS) {
    const rows = unwrapWeightRows(
      data.weights ??
        data[QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS] ??
        data.motorWeightDetails ??
        data,
    );
    if (Array.isArray(rows) || asRecord(rows)) {
      values[tableKey()] = normalizeWeightRows(rows);
    }
  }
  if (
    !upper ||
    upper === QC_WEIGHMENT_SECTION_IDS.ATTACHMENTS ||
    upper === QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS
  ) {
    const files = parseUploadFiles(
      data.UPLOAD_REPORT,
      data.uploadReport,
      data.uploadedFiles,
      data.attachments,
    );
    if (files.length) values[uploadReportKey()] = files;
  }
};

export const hydrateWeighmentValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialWeighmentValues();
  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;
    hydrateFromSectionData(values, sectionId, data);
  }
  return values;
};

export const isWeighmentNestedMotorDetail = (rec: Record<string, unknown> | null | undefined) =>
  Boolean(
    rec &&
      (Array.isArray(rec.weights) ||
        Array.isArray(rec.motorWeightDetails) ||
        Array.isArray(rec.MOTOR_WEIGHT_DETAILS)),
  );

const pickMotorId = (rec: Record<string, unknown> | null) =>
  pickString(rec?.motorId, rec?.motorIdNo, rec?.motor_id, rec?.id);

const unwrapWeightRows = (value: unknown, motorId?: string): unknown => {
  if (!Array.isArray(value)) return value;
  const first = asRecord(value[0]);
  if (!first || !Array.isArray(first.weights)) return value;
  const matched =
    (motorId
      ? value.map((item) => asRecord(item)).find((row) => row && pickMotorId(row) === motorId)
      : null) ?? first;
  return Array.isArray(matched?.weights) ? matched.weights : value;
};

const resolveWeightRows = (source: Record<string, unknown>, motorId: string): unknown => {
  if (Array.isArray(source.weights)) return source.weights;
  const list = asArray(source.motorWeightDetails ?? source.MOTOR_WEIGHT_DETAILS);
  const nested = list
    .map((item) => asRecord(item))
    .find((row) => row && (!motorId || pickMotorId(row) === motorId));
  if (nested && Array.isArray(nested.weights)) return nested.weights;
  if (list.length && !pickMotorId(asRecord(list[0]))) return list;
  return [];
};

export const weighmentMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const source = asRecord(rec.details) ?? rec;
  const scale = asRecord(source.weighscaleDetails) ?? source;
  const trimmedMotorId = String(motorId ?? "").trim();
  const withMotor = (section: SchemaSectionSubmission): SchemaSectionSubmission =>
    (trimmedMotorId ? { ...section, motorId: trimmedMotorId } : section) as SchemaSectionSubmission;

  return [
    withMotor({
      sectionId: QC_WEIGHMENT_SECTION_IDS.WEIGHTSCALE_DETAILS,
      sectionData: [
        omitEmpty({
          WEIGHSCALE_NO: pickString(scale.weighscaleNo, scale.WEIGHSCALE_NO, source.weighscaleNo),
          CALIBRATION_DUE_DATE: pickString(
            scale.calibrationDueDate,
            scale.CALIBRATION_DUE_DATE,
            source.calibrationDueDate,
          ),
        }),
      ],
    }),
    withMotor({
      sectionId: QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS,
      sectionData: [
        {
          MOTOR_WEIGHT_DETAILS: resolveWeightRows(source, trimmedMotorId),
        },
      ],
    }),
  ];
};

export const hydrateWeighmentValuesFromRecord = (rec: Record<string, unknown>): SchemaFormValues => {
  const details = asRecord(rec.details) ?? rec;
  if (isWeighmentNestedMotorDetail(rec) || isWeighmentNestedMotorDetail(details)) {
    return hydrateWeighmentValuesFromSections(
      weighmentMotorDetailToSections(rec, pickString(rec.motorIdNo, rec.motorId) || "MOTOR"),
    );
  }
  const values = createInitialWeighmentValues();
  hydrateFromSectionData(values, "", details);
  const nestedSections = asArray(details.sections);
  if (nestedSections.length) {
    return hydrateWeighmentValuesFromSections([
      ...nestedSections.map((section) => section as SchemaSectionSubmission),
    ]);
  }
  return values;
};

export type QcWeighmentMotorSubmissionType = "DRAFT" | "SUBMIT";

const buildWeighmentWeightRowPayload = (row: QcWeighmentWeightRow): Record<string, unknown> => {
  const isPropellant = String(row.SR_NO).trim().toUpperCase() === "H";
  return {
    srNo: row.SR_NO,
    weightParameter: row.WEIGHT_PARAMETER,
    ...(toApiNumber(row.WEIGHT_KG) != null ? { weightKg: toApiNumber(row.WEIGHT_KG) } : {}),
    calculation: {
      formula: isPropellant ? QC_WEIGHMENT_API_PROPELLANT_FORMULA : null,
      autoCalculate: isPropellant,
    },
  };
};

export const buildWeighmentWeighscaleDetails = (
  values: SchemaFormValues | null | undefined,
): Record<string, unknown> =>
  omitEmpty({
    weighscaleNo: getWeighmentWeighscaleNo(values) || undefined,
    calibrationDueDate: formatToIsoDateInput(getWeighmentCalibrationDueDate(values)) || undefined,
  });

/** One motor's weight rows for `data.motorWeightDetails[]`. */
export const buildWeighmentMotorWeightsPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType?: QcWeighmentMotorSubmissionType | null,
): Record<string, unknown> => {
  const uploadedFiles = toFileIdListPayload(getWeighmentUploadReport(values ?? undefined));
  return omitEmpty({
    motorId,
    ...(motorSubmissionType ? { motorSubmissionType } : {}),
    weights: getWeighmentWeightRows(values).map(buildWeighmentWeightRowPayload),
    ...(uploadedFiles.length ? { uploadedFiles } : {}),
  });
};

/** Division `data` for QC Weighment create/update. */
export const buildWeighmentDivisionData = (
  motors: Array<{ motorId: string; values?: SchemaFormValues | null }>,
  motorSubmissionType?: QcWeighmentMotorSubmissionType | null,
): Record<string, unknown> => {
  const withIds = motors.filter((motor) => String(motor.motorId ?? "").trim());
  const scaleSource =
    withIds.find(
      (motor) => getWeighmentWeighscaleNo(motor.values) || getWeighmentCalibrationDueDate(motor.values),
    ) ?? withIds[0];

  return omitEmpty({
    weighscaleDetails: buildWeighmentWeighscaleDetails(scaleSource?.values),
    motorWeightDetails: withIds.map((motor) =>
      buildWeighmentMotorWeightsPayload(
        motor.values,
        String(motor.motorId).trim(),
        motorSubmissionType,
      ),
    ),
  });
};

/** @deprecated Use buildWeighmentDivisionData — kept for older motors[] callers. */
export const buildWeighmentMotorPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcWeighmentMotorSubmissionType = "DRAFT",
): Record<string, unknown> =>
  buildWeighmentMotorWeightsPayload(values, motorId, motorSubmissionType);

export const collectWeighmentFileRefsFromQcValues = (
  values: SchemaFormValues | null | undefined,
): FileRef[] => getWeighmentUploadReport(values ?? undefined);

export const hasIncompleteQcWeighmentUploads = (
  values: SchemaFormValues | null | undefined,
): boolean => collectWeighmentFileRefsFromQcValues(values).some(isFileUploadIncomplete);

export const collectTempFileIdsFromQcWeighmentValues = (
  values: SchemaFormValues | null | undefined,
): string[] =>
  [
    ...new Set(
      collectWeighmentFileRefsFromQcValues(values)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];
