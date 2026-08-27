import dayjs from "dayjs";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileRef } from "../../../data/models/common/FileUploadModel";
import { formatToUiDate, UI_DATETIME_FORMAT } from "../../../utils/dateUtils";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";
import {
  QC_HARDWARE_ATTACHMENTS_SECTION_ID,
  QC_HARDWARE_PROCESS_OPTIONS,
  QC_HARDWARE_SECTION_IDS,
  getHardwareSectionIdForSubType,
  getQcHardwareProcessLabel,
  isQcHardwareProcessSubType,
  resolveHardwareUploadAnchorEntry,
  type QcHardwareProcessSubType,
} from "./qcHardwareConfig";

export type QcHardwareCutRow = {
  SR_NO?: number | string;
  DATE?: string;
  START_TIME?: string;
  END_TIME?: string;
  DUST_QTY?: string;
  OBSERVATIONS?: string;
};

export type QcHardwarePreheatingRow = {
  SR_NO?: number | string;
  DATE?: string;
  START_TIME?: string;
  END_TIME?: string;
  OVEN_NUMBER?: string;
  BUILDING_NO?: string;
  TEMPERATURE?: string;
  VACUUM_LEVEL?: string;
  OBSERVATIONS?: string;
};

export type QcHardwareLinearCoatingRow = {
  SR_NO?: number | string;
  DATE?: string;
  START_TIME?: string;
  END_TIME?: string;
  LINER_QTY?: string;
  INSULATION_TEMP?: string;
  RH?: string;
  OBSERVATIONS?: string;
};

export type QcHardwareDispatchValues = {
  HE_PUNCTURES?: string;
  NE_PUNCTURES?: string;
  LF_PUNCTURES?: string;
  DISPATCH_DATE_TIME?: string;
  /** @deprecated Prefer VISUAL_OBSERVATIONS rows; kept for legacy seed/merge. */
  OBSERVATIONS?: string;
};

export type QcHardwareVisualObservationRow = {
  SR_NO?: number | string;
  PARAMETER?: string;
  OBSERVATIONS?: string;
  REMARKS?: string;
};

export const QC_HARDWARE_UPLOAD_REPORT_KEY = "UPLOAD_REPORT";
export const QC_HARDWARE_UPLOAD_GRAPH_KEY = "UPLOAD_GRAPH";
export const QC_HARDWARE_UPLOAD_PHOTO_KEY = "UPLOAD_PHOTO";

export const QC_HARDWARE_UPLOAD_TYPES = [
  QC_HARDWARE_UPLOAD_REPORT_KEY,
  QC_HARDWARE_UPLOAD_GRAPH_KEY,
  QC_HARDWARE_UPLOAD_PHOTO_KEY,
] as const;

export type QcHardwareUploadType = (typeof QC_HARDWARE_UPLOAD_TYPES)[number];

export type QcHardwareUploadValues = Record<QcHardwareUploadType, FileRef[]>;

export const QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID = "FIRST_CUT";
export const QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID = "SECOND_CUT";
export const QC_HARDWARE_PREHEATING_TABLE_ID = "PREHEATING_DETAILS";
export const QC_HARDWARE_LINEAR_COATING_TABLE_ID = "LINEAR_COATING_DETAILS";
export const QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID = "VISUAL_OBSERVATIONS";

/** Same presets as Case Prep dispatch visual observations. */
export const QC_HARDWARE_DISPATCH_VISUAL_PRESETS = [
  "Liner Coated Rubber Surface Visual Observation",
  "Observations Over Loose Flap / Bellow Bonding",
] as const;

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const parseUploadFiles = (...candidates: unknown[]): FileRef[] => {
  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    const refs = parseFileRefs(candidate);
    if (refs.length) return refs;
  }
  return [];
};

const uploadListHasFiles = (refs: FileRef[] | undefined) =>
  Array.isArray(refs) && refs.length > 0;

const emptyCutRow = (srNo = 1): QcHardwareCutRow => ({
  SR_NO: srNo,
  DATE: "",
  START_TIME: "",
  END_TIME: "",
  DUST_QTY: "",
  OBSERVATIONS: "",
});

const emptyPreheatingRow = (srNo = 1): QcHardwarePreheatingRow => ({
  SR_NO: srNo,
  DATE: "",
  START_TIME: "",
  END_TIME: "",
  OVEN_NUMBER: "",
  BUILDING_NO: "",
  TEMPERATURE: "",
  VACUUM_LEVEL: "",
  OBSERVATIONS: "",
});

const emptyLinearCoatingRow = (srNo = 1): QcHardwareLinearCoatingRow => ({
  SR_NO: srNo,
  DATE: "",
  START_TIME: "",
  END_TIME: "",
  LINER_QTY: "",
  INSULATION_TEMP: "",
  RH: "",
  OBSERVATIONS: "",
});

const emptyVisualObservationRows = (): QcHardwareVisualObservationRow[] =>
  QC_HARDWARE_DISPATCH_VISUAL_PRESETS.map((parameter, index) => ({
    SR_NO: index + 1,
    PARAMETER: parameter,
    OBSERVATIONS: "",
    REMARKS: "",
  }));

const normalizeVisualObservationRows = (
  rows: QcHardwareVisualObservationRow[] | null | undefined,
): QcHardwareVisualObservationRow[] => {
  const incoming = Array.isArray(rows) ? rows : [];
  const byParameter = new Map(
    incoming
      .map((row) => [String(row.PARAMETER ?? "").trim().toLowerCase(), row] as const)
      .filter(([key]) => Boolean(key)),
  );
  const presets = emptyVisualObservationRows().map((preset, index) => {
    const saved = byParameter.get(String(preset.PARAMETER ?? "").trim().toLowerCase());
    if (!saved) return { ...preset, SR_NO: index + 1 };
    byParameter.delete(String(preset.PARAMETER ?? "").trim().toLowerCase());
    return {
      SR_NO: index + 1,
      PARAMETER: preset.PARAMETER,
      OBSERVATIONS: String(saved.OBSERVATIONS ?? "").trim(),
      REMARKS: String(saved.REMARKS ?? "").trim(),
    };
  });
  const extras = [...byParameter.values()]
    .filter(
      (row) =>
        hasValue(row.PARAMETER) || hasValue(row.OBSERVATIONS) || hasValue(row.REMARKS),
    )
    .map((row, index) => ({
      SR_NO: presets.length + index + 1,
      PARAMETER: String(row.PARAMETER ?? "").trim(),
      OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim(),
      REMARKS: String(row.REMARKS ?? "").trim(),
    }));
  return [...presets, ...extras];
};

const emptyHardwareUploadValues = (): QcHardwareUploadValues => ({
  [QC_HARDWARE_UPLOAD_REPORT_KEY]: [],
  [QC_HARDWARE_UPLOAD_GRAPH_KEY]: [],
  [QC_HARDWARE_UPLOAD_PHOTO_KEY]: [],
});

export const createInitialHardwareUploadValues = (): SchemaFormValues =>
  Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.map((uploadType) => [
      formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, uploadType),
      [] as FileRef[],
    ]),
  );

const LEGACY_HARDWARE_UPLOAD_SUB_TYPES: QcHardwareProcessSubType[] = [
  "PREHEATING",
  "LINEAR_COATING",
  "DISPATCH",
];

const normalizeCutRows = (rows: QcHardwareCutRow[]) =>
  rows.map((row, index) => ({
    ...row,
    SR_NO: row.SR_NO ?? index + 1,
  }));

const normalizePreheatingRows = (rows: QcHardwarePreheatingRow[]) =>
  rows.map((row, index) => ({
    ...row,
    SR_NO: row.SR_NO ?? index + 1,
  }));

const normalizeLinearCoatingRows = (rows: QcHardwareLinearCoatingRow[]) =>
  rows.map((row, index) => ({
    ...row,
    SR_NO: row.SR_NO ?? index + 1,
  }));

const extractTableRows = <T extends Record<string, unknown>>(
  sectionData: unknown,
  tableId: string,
): T[] => {
  if (!Array.isArray(sectionData)) return [];
  for (const item of sectionData) {
    if (!item || typeof item !== "object") continue;
    const tableValue = (item as Record<string, unknown>)[tableId];
    if (Array.isArray(tableValue)) {
      return tableValue.filter((row) => row && typeof row === "object") as T[];
    }
    if (tableValue && typeof tableValue === "object") {
      const nestedRows = (tableValue as Record<string, unknown>).rows;
      if (Array.isArray(nestedRows)) {
        return nestedRows.filter((row) => row && typeof row === "object") as T[];
      }
    }
  }
  return [];
};

const readRowsFromValues = <T extends Record<string, unknown>>(
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

export const createInitialHardwareProcessValues = (
  subType: QcHardwareProcessSubType,
): SchemaFormValues => {
  const sectionId = QC_HARDWARE_SECTION_IDS[subType];
  if (subType === "ABRADING") {
    return {
      ...createInitialHardwareUploadValues(),
      [formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID)]: [emptyCutRow(1)],
      [formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID)]: [emptyCutRow(1)],
    };
  }
  if (subType === "PREHEATING") {
    return {
      [formKey(sectionId, QC_HARDWARE_PREHEATING_TABLE_ID)]: [emptyPreheatingRow(1)],
    };
  }
  if (subType === "LINEAR_COATING") {
    return {
      [formKey(sectionId, QC_HARDWARE_LINEAR_COATING_TABLE_ID)]: [emptyLinearCoatingRow(1)],
    };
  }
  return {
    [formKey(sectionId, "HE_PUNCTURES")]: "",
    [formKey(sectionId, "NE_PUNCTURES")]: "",
    [formKey(sectionId, "LF_PUNCTURES")]: "",
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: "",
    [formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]:
      emptyVisualObservationRows(),
  };
};

export const getHardwareAbradingRows = (
  values: SchemaFormValues | null | undefined,
  tableId:
    | typeof QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID
    | typeof QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID,
): QcHardwareCutRow[] => {
  const key = formKey(QC_HARDWARE_SECTION_IDS.ABRADING, tableId);
  return normalizeCutRows(
    readRowsFromValues<QcHardwareCutRow>(values, key, [emptyCutRow(1)]),
  );
};

export const setHardwareAbradingRows = (
  values: SchemaFormValues | null | undefined,
  tableId:
    | typeof QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID
    | typeof QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID,
  rows: QcHardwareCutRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_HARDWARE_SECTION_IDS.ABRADING, tableId)]: normalizeCutRows(rows),
});

export const getHardwarePreheatingRows = (
  values: SchemaFormValues | null | undefined,
): QcHardwarePreheatingRow[] => {
  const key = formKey(QC_HARDWARE_SECTION_IDS.PREHEATING, QC_HARDWARE_PREHEATING_TABLE_ID);
  return normalizePreheatingRows(
    readRowsFromValues<QcHardwarePreheatingRow>(values, key, [emptyPreheatingRow(1)]),
  );
};

export const setHardwarePreheatingRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcHardwarePreheatingRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_HARDWARE_SECTION_IDS.PREHEATING, QC_HARDWARE_PREHEATING_TABLE_ID)]:
    normalizePreheatingRows(rows),
});

export const getHardwareLinearCoatingRows = (
  values: SchemaFormValues | null | undefined,
): QcHardwareLinearCoatingRow[] => {
  const key = formKey(
    QC_HARDWARE_SECTION_IDS.LINEAR_COATING,
    QC_HARDWARE_LINEAR_COATING_TABLE_ID,
  );
  return normalizeLinearCoatingRows(
    readRowsFromValues<QcHardwareLinearCoatingRow>(values, key, [emptyLinearCoatingRow(1)]),
  );
};

export const setHardwareLinearCoatingRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcHardwareLinearCoatingRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_HARDWARE_SECTION_IDS.LINEAR_COATING, QC_HARDWARE_LINEAR_COATING_TABLE_ID)]:
    normalizeLinearCoatingRows(rows),
});

export const getHardwareDispatchValues = (
  values: SchemaFormValues | null | undefined,
): QcHardwareDispatchValues => {
  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  const visualRows = getHardwareDispatchVisualObservationRows(values);
  const legacyObservations = String(values?.[formKey(sectionId, "OBSERVATIONS")] ?? "").trim();
  const fromRows = visualRows
    .map((row) => {
      const body = String(row.OBSERVATIONS ?? "").trim() || String(row.REMARKS ?? "").trim();
      const parameter = String(row.PARAMETER ?? "").trim();
      if (!body) return "";
      return parameter ? `${parameter}: ${body}` : body;
    })
    .filter(Boolean)
    .join("\n");
  return {
    HE_PUNCTURES: String(values?.[formKey(sectionId, "HE_PUNCTURES")] ?? ""),
    NE_PUNCTURES: String(values?.[formKey(sectionId, "NE_PUNCTURES")] ?? ""),
    LF_PUNCTURES: String(values?.[formKey(sectionId, "LF_PUNCTURES")] ?? ""),
    DISPATCH_DATE_TIME: String(values?.[formKey(sectionId, "DISPATCH_DATE_TIME")] ?? ""),
    OBSERVATIONS: fromRows || legacyObservations,
  };
};

export const getHardwareDispatchVisualObservationRows = (
  values: SchemaFormValues | null | undefined,
): QcHardwareVisualObservationRow[] => {
  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  const key = formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID);
  const rawRows = readRowsFromValues<QcHardwareVisualObservationRow>(
    values,
    key,
    emptyVisualObservationRows(),
  );
  const normalized = normalizeVisualObservationRows(rawRows);
  // Migrate legacy flat OBSERVATIONS string into the first preset row when rows are empty.
  const legacy = String(values?.[formKey(sectionId, "OBSERVATIONS")] ?? "").trim();
  if (
    legacy &&
    !normalized.some((row) => hasValue(row.OBSERVATIONS) || hasValue(row.REMARKS))
  ) {
    return normalized.map((row, index) =>
      index === 0 ? { ...row, OBSERVATIONS: legacy } : row,
    );
  }
  return normalized;
};

export const setHardwareDispatchVisualObservationRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcHardwareVisualObservationRow[],
): SchemaFormValues => {
  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  const next = { ...(values ?? {}) };
  delete next[formKey(sectionId, "OBSERVATIONS")];
  return {
    ...next,
    [formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]:
      normalizeVisualObservationRows(rows),
  };
};

export const setHardwareDispatchValues = (
  values: SchemaFormValues | null | undefined,
  next: QcHardwareDispatchValues,
): SchemaFormValues => {
  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  const current = values ?? {};
  let result: SchemaFormValues = {
    ...current,
    [formKey(sectionId, "HE_PUNCTURES")]: next.HE_PUNCTURES ?? "",
    [formKey(sectionId, "NE_PUNCTURES")]: next.NE_PUNCTURES ?? "",
    [formKey(sectionId, "LF_PUNCTURES")]: next.LF_PUNCTURES ?? "",
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: next.DISPATCH_DATE_TIME ?? "",
  };
  // Preserve structured visual observations; only fall back to legacy string when needed.
  if (
    !result[formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)] &&
    next.OBSERVATIONS != null
  ) {
    result = setHardwareDispatchVisualObservationRows(
      result,
      emptyVisualObservationRows().map((row, index) =>
        index === 0 ? { ...row, OBSERVATIONS: next.OBSERVATIONS ?? "" } : row,
      ),
    );
  } else if (!result[formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]) {
    result = {
      ...result,
      [formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]:
        emptyVisualObservationRows(),
    };
  }
  return result;
};

const readUploadValue = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  uploadType: QcHardwareUploadType,
): FileRef[] => parseUploadFiles(values?.[formKey(sectionId, uploadType)]);

export const getHardwareUploadValues = (
  values: SchemaFormValues | null | undefined,
): QcHardwareUploadValues => {
  const uploads = emptyHardwareUploadValues();
  for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
    const shared = readUploadValue(values, QC_HARDWARE_ATTACHMENTS_SECTION_ID, uploadType);
    if (uploadListHasFiles(shared)) {
      uploads[uploadType] = shared;
      continue;
    }
    const abrading = readUploadValue(values, QC_HARDWARE_SECTION_IDS.ABRADING, uploadType);
    if (uploadListHasFiles(abrading)) {
      uploads[uploadType] = abrading;
      continue;
    }
    for (const legacySubType of LEGACY_HARDWARE_UPLOAD_SUB_TYPES) {
      const legacy = readUploadValue(values, QC_HARDWARE_SECTION_IDS[legacySubType], uploadType);
      if (uploadListHasFiles(legacy)) {
        uploads[uploadType] = legacy;
        break;
      }
    }
  }
  return uploads;
};

export const setHardwareUploadValues = (
  values: SchemaFormValues | null | undefined,
  next: QcHardwareUploadValues,
): SchemaFormValues => ({
  ...(values ?? {}),
  ...Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.map((uploadType) => [
      formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, uploadType),
      next[uploadType] ?? [],
    ]),
  ),
});

export const setHardwareUploadValue = (
  values: SchemaFormValues | null | undefined,
  uploadType: QcHardwareUploadType,
  value: FileRef[],
): SchemaFormValues =>
  setHardwareUploadValues(values, {
    ...getHardwareUploadValues(values),
    [uploadType]: value ?? [],
  });

export const mergeHardwareUploadValuesIntoEntryValues = (
  values: SchemaFormValues | null | undefined,
  uploads: QcHardwareUploadValues,
): SchemaFormValues => setHardwareUploadValues(values, uploads);

const cutRowHasData = (row: QcHardwareCutRow) =>
  hasValue(row.DATE) ||
  hasValue(row.START_TIME) ||
  hasValue(row.END_TIME) ||
  hasValue(row.DUST_QTY) ||
  hasValue(row.OBSERVATIONS);

export const hardwareAbradingCutsHaveData = (
  firstCut: QcHardwareCutRow[],
  secondCut: QcHardwareCutRow[],
) => [...firstCut, ...secondCut].some(cutRowHasData);

export const hardwareProcessValuesHaveUserData = (
  values: SchemaFormValues | null | undefined,
  subType: QcHardwareProcessSubType,
): boolean => {
  if (!values) return false;
  if (subType === "ABRADING") {
    const uploads = getHardwareUploadValues(values);
    return (
      hardwareAbradingCutsHaveData(
        getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID),
        getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID),
      ) ||
      QC_HARDWARE_UPLOAD_TYPES.some((uploadType) => uploadListHasFiles(uploads[uploadType]))
    );
  }
  if (subType === "PREHEATING") {
    return getHardwarePreheatingRows(values).some(preheatingRowHasData);
  }
  if (subType === "LINEAR_COATING") {
    return getHardwareLinearCoatingRows(values).some(linearCoatingRowHasData);
  }
  const dispatch = getHardwareDispatchValues(values);
  return (
    hasValue(dispatch.HE_PUNCTURES) ||
    hasValue(dispatch.NE_PUNCTURES) ||
    hasValue(dispatch.LF_PUNCTURES) ||
    hasValue(dispatch.DISPATCH_DATE_TIME) ||
    getHardwareDispatchVisualObservationRows(values).some(
      (row) => hasValue(row.OBSERVATIONS) || hasValue(row.REMARKS),
    )
  );
};

const preheatingRowHasData = (row: QcHardwarePreheatingRow) =>
  hasValue(row.DATE) ||
  hasValue(row.START_TIME) ||
  hasValue(row.END_TIME) ||
  hasValue(row.OVEN_NUMBER) ||
  hasValue(row.BUILDING_NO) ||
  hasValue(row.TEMPERATURE) ||
  hasValue(row.VACUUM_LEVEL) ||
  hasValue(row.OBSERVATIONS);

const linearCoatingRowHasData = (row: QcHardwareLinearCoatingRow) =>
  hasValue(row.DATE) ||
  hasValue(row.START_TIME) ||
  hasValue(row.END_TIME) ||
  hasValue(row.LINER_QTY) ||
  hasValue(row.INSULATION_TEMP) ||
  hasValue(row.RH) ||
  hasValue(row.OBSERVATIONS);

const sanitizeCutRows = (rows: QcHardwareCutRow[]) =>
  normalizeCutRows(rows.filter(cutRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    DATE: String(row.DATE ?? "").trim(),
    START_TIME: String(row.START_TIME ?? "").trim(),
    END_TIME: String(row.END_TIME ?? "").trim(),
    DUST_QTY: String(row.DUST_QTY ?? "").trim(),
    OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim(),
  }));

const sanitizePreheatingRows = (rows: QcHardwarePreheatingRow[]) =>
  normalizePreheatingRows(rows.filter(preheatingRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    DATE: String(row.DATE ?? "").trim(),
    START_TIME: String(row.START_TIME ?? "").trim(),
    END_TIME: String(row.END_TIME ?? "").trim(),
    OVEN_NUMBER: String(row.OVEN_NUMBER ?? "").trim(),
    BUILDING_NO: String(row.BUILDING_NO ?? "").trim(),
    TEMPERATURE: String(row.TEMPERATURE ?? "").trim(),
    VACUUM_LEVEL: String(row.VACUUM_LEVEL ?? "").trim(),
    OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim(),
  }));

const sanitizeLinearCoatingRows = (rows: QcHardwareLinearCoatingRow[]) =>
  normalizeLinearCoatingRows(rows.filter(linearCoatingRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    DATE: String(row.DATE ?? "").trim(),
    START_TIME: String(row.START_TIME ?? "").trim(),
    END_TIME: String(row.END_TIME ?? "").trim(),
    LINER_QTY: String(row.LINER_QTY ?? "").trim(),
    INSULATION_TEMP: String(row.INSULATION_TEMP ?? "").trim(),
    RH: String(row.RH ?? "").trim(),
    OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim(),
  }));

const sanitizeHardwareUploadValues = (uploads: QcHardwareUploadValues): QcHardwareUploadValues =>
  Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.map((uploadType) => [
      uploadType,
      parseUploadFiles(uploads[uploadType]),
    ]),
  ) as QcHardwareUploadValues;

const extractSectionUploadFiles = (
  sectionData: unknown,
  fieldId: string,
): FileRef[] => {
  if (!Array.isArray(sectionData)) return [];
  for (const item of sectionData) {
    const rec = asRecord(item);
    if (!rec || !(fieldId in rec)) continue;
    const refs = parseUploadFiles(rec[fieldId]);
    if (refs.length) return refs;
  }
  return [];
};

const buildUploadSectionPayload = (
  uploads: QcHardwareUploadValues,
): Record<string, ReturnType<typeof toFileIdListPayload>> => {
  const sanitized = sanitizeHardwareUploadValues(uploads);
  return Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.filter((uploadType) => uploadListHasFiles(sanitized[uploadType])).map(
      (uploadType) => [uploadType, toFileIdListPayload(sanitized[uploadType])],
    ),
  );
};

export const collectHardwareUploadValuesForMotor = (
  motorId: string,
  hardwareEntries: QcDivisionEntry[],
  valuesByEntryId: Record<string, { schemaValues?: SchemaFormValues } | undefined>,
): QcHardwareUploadValues => {
  const normalizedMotorId = String(motorId ?? "").trim();
  const merged: QcHardwareUploadValues = {
    [QC_HARDWARE_UPLOAD_REPORT_KEY]: [],
    [QC_HARDWARE_UPLOAD_GRAPH_KEY]: [],
    [QC_HARDWARE_UPLOAD_PHOTO_KEY]: [],
  };
  if (!normalizedMotorId) return merged;

  // Prefer Abrading (upload anchor) first so shared Graph/Report/Photo win.
  const ordered = [...hardwareEntries].sort((a, b) => {
    const aAbrading = a.subType === "ABRADING" ? 0 : 1;
    const bAbrading = b.subType === "ABRADING" ? 0 : 1;
    return aAbrading - bAbrading;
  });

  for (const entry of ordered) {
    if (String(entry.motorId ?? "").trim() !== normalizedMotorId) continue;
    const uploads = getHardwareUploadValues(valuesByEntryId[entry.entryId]?.schemaValues);
    for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
      if (!uploadListHasFiles(merged[uploadType]) && uploadListHasFiles(uploads[uploadType])) {
        merged[uploadType] = uploads[uploadType];
      }
    }
  }

  return merged;
};

export const buildHardwareAttachmentsSectionPayloadFromUploads = (
  uploads: QcHardwareUploadValues,
): SchemaSectionSubmission[] => {
  const uploadFields = buildUploadSectionPayload(uploads);
  if (!Object.keys(uploadFields).length) return [];
  return [
    {
      sectionId: QC_HARDWARE_ATTACHMENTS_SECTION_ID,
      sectionData: [{ attachmentDetails: uploadFields }],
    },
  ];
};

/** Embed shared motor uploads into a process section as attachmentDetails only (no flat UPLOAD_* dupes). */
export const mergeHardwareAttachmentDetailsIntoSectionData = (
  sectionDataItem: Record<string, unknown>,
  uploads: QcHardwareUploadValues,
): Record<string, unknown> => {
  const uploadFields = buildUploadSectionPayload(uploads);
  if (!Object.keys(uploadFields).length) return sectionDataItem;

  const rest = { ...sectionDataItem };
  delete rest[QC_HARDWARE_UPLOAD_REPORT_KEY];
  delete rest[QC_HARDWARE_UPLOAD_GRAPH_KEY];
  delete rest[QC_HARDWARE_UPLOAD_PHOTO_KEY];
  return {
    ...rest,
    attachmentDetails: {
      ...(asRecord(sectionDataItem.attachmentDetails) ?? {}),
      ...uploadFields,
    },
  };
};

/**
 * Put attachmentDetails on every hardware process section for the motor,
 * plus the dedicated HARDWARE_ATTACHMENTS section — attachmentDetails only.
 */
export const applyHardwareAttachmentsToMotorSections = (
  sections: Array<SchemaSectionSubmission & { motorId?: string }>,
  hardwareEntries: QcDivisionEntry[],
  valuesByEntryId: Record<string, { schemaValues?: SchemaFormValues } | undefined>,
): Array<SchemaSectionSubmission & { motorId?: string }> => {
  const uploadsByMotor = new Map<string, QcHardwareUploadValues>();

  const resolveUploads = (motorId: string) => {
    const existing = uploadsByMotor.get(motorId);
    if (existing) return existing;
    const uploads = collectHardwareUploadValuesForMotor(
      motorId,
      hardwareEntries,
      valuesByEntryId,
    );
    uploadsByMotor.set(motorId, uploads);
    return uploads;
  };

  return sections.map((section) => {
    const motorId = String(section.motorId ?? "").trim();
    if (!motorId) return section;

    const uploads = resolveUploads(motorId);
    const uploadFields = buildUploadSectionPayload(uploads);
    if (!Object.keys(uploadFields).length) return section;

    const sectionId = String(section.sectionId ?? "").trim();
    const rows = asArray(section.sectionData);
    if (!rows.length) {
      if (sectionId === QC_HARDWARE_ATTACHMENTS_SECTION_ID) {
        return {
          ...section,
          sectionData: [{ attachmentDetails: uploadFields }],
        };
      }
      return section;
    }

    return {
      ...section,
      sectionData: rows.map((row) => {
        const rec = asRecord(row);
        if (!rec) return row;
        return mergeHardwareAttachmentDetailsIntoSectionData(rec, uploads);
      }),
    };
  });
};

export const buildHardwareProcessSectionPayload = (
  values: SchemaFormValues | null | undefined,
  subType: string,
): SchemaSectionSubmission[] => {
  if (!isQcHardwareProcessSubType(subType)) return [];
  const sectionId = QC_HARDWARE_SECTION_IDS[subType];

  if (subType === "ABRADING") {
    const firstCut = sanitizeCutRows(
      getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID),
    );
    const secondCut = sanitizeCutRows(
      getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID),
    );
    if (!firstCut.length && !secondCut.length) return [];
    return [
      {
        sectionId,
        subType,
        sectionData: [
          {
            ...(firstCut.length
              ? { [QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID]: { rows: firstCut } }
              : {}),
            ...(secondCut.length
              ? { [QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID]: { rows: secondCut } }
              : {}),
          },
        ],
      },
    ];
  }

  if (subType === "PREHEATING") {
    const rows = sanitizePreheatingRows(getHardwarePreheatingRows(values));
    if (!rows.length) return [];
    return [
      {
        sectionId,
        subType,
        sectionData: [{ [QC_HARDWARE_PREHEATING_TABLE_ID]: { rows } }],
      },
    ];
  }

  if (subType === "LINEAR_COATING") {
    const rows = sanitizeLinearCoatingRows(getHardwareLinearCoatingRows(values));
    if (!rows.length) return [];
    return [
      {
        sectionId,
        subType,
        sectionData: [{ [QC_HARDWARE_LINEAR_COATING_TABLE_ID]: { rows } }],
      },
    ];
  }

  const dispatch = getHardwareDispatchValues(values);
  const visualRows = getHardwareDispatchVisualObservationRows(values);
  const hasVisual = visualRows.some(
    (row) => hasValue(row.OBSERVATIONS) || hasValue(row.REMARKS),
  );
  if (
    !hasValue(dispatch.HE_PUNCTURES) &&
    !hasValue(dispatch.NE_PUNCTURES) &&
    !hasValue(dispatch.LF_PUNCTURES) &&
    !hasValue(dispatch.DISPATCH_DATE_TIME) &&
    !hasVisual
  ) {
    return [];
  }
  return [
    {
      sectionId,
      subType,
      sectionData: [
        {
          ...(hasValue(dispatch.HE_PUNCTURES)
            ? { HE_PUNCTURES: String(dispatch.HE_PUNCTURES ?? "").trim() }
            : {}),
          ...(hasValue(dispatch.NE_PUNCTURES)
            ? { NE_PUNCTURES: String(dispatch.NE_PUNCTURES ?? "").trim() }
            : {}),
          ...(hasValue(dispatch.LF_PUNCTURES)
            ? { LF_PUNCTURES: String(dispatch.LF_PUNCTURES ?? "").trim() }
            : {}),
          ...(hasValue(dispatch.DISPATCH_DATE_TIME)
            ? { DISPATCH_DATE_TIME: String(dispatch.DISPATCH_DATE_TIME ?? "").trim() }
            : {}),
          [QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID]: visualRows,
        },
      ],
    },
  ];
};

export const buildHardwareAttachmentsSectionPayload = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] =>
  buildHardwareAttachmentsSectionPayloadFromUploads(getHardwareUploadValues(values));

export const hydrateHardwareUploadValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): QcHardwareUploadValues => {
  const uploads = emptyHardwareUploadValues();
  const attachmentSection = (sections ?? []).find(
    (entry) => String(entry.sectionId ?? "").trim() === QC_HARDWARE_ATTACHMENTS_SECTION_ID,
  );
  if (attachmentSection) {
    const nested = asRecord(asArray(attachmentSection.sectionData)[0])?.attachmentDetails;
    const nestedRecord = asRecord(nested);
    for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
      const fromFlat = extractSectionUploadFiles(attachmentSection.sectionData, uploadType);
      uploads[uploadType] = uploadListHasFiles(fromFlat)
        ? fromFlat
        : parseUploadFiles(nestedRecord?.[uploadType]);
    }
    return uploads;
  }

  const allProcessSubTypes: QcHardwareProcessSubType[] = [
    "ABRADING",
    "PREHEATING",
    "LINEAR_COATING",
    "DISPATCH",
  ];
  for (const processSubType of allProcessSubTypes) {
    const sectionId = QC_HARDWARE_SECTION_IDS[processSubType];
    const section = (sections ?? []).find(
      (entry) => String(entry.sectionId ?? "").trim() === sectionId,
    );
    if (!section) continue;
    const nested = asRecord(asArray(section.sectionData)[0])?.attachmentDetails;
    const nestedRecord = asRecord(nested);
    for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
      if (uploadListHasFiles(uploads[uploadType])) continue;
      const fromFlat = extractSectionUploadFiles(section.sectionData, uploadType);
      uploads[uploadType] = uploadListHasFiles(fromFlat)
        ? fromFlat
        : parseUploadFiles(nestedRecord?.[uploadType]);
    }
  }

  for (const legacySubType of LEGACY_HARDWARE_UPLOAD_SUB_TYPES) {
    const sectionId = QC_HARDWARE_SECTION_IDS[legacySubType];
    const section = (sections ?? []).find(
      (entry) => String(entry.sectionId ?? "").trim() === sectionId,
    );
    if (!section) continue;
    for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
      if (uploadListHasFiles(uploads[uploadType])) continue;
      uploads[uploadType] = extractSectionUploadFiles(section.sectionData, uploadType);
    }
  }

  return uploads;
};

export const hydrateHardwareProcessValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
  subType: string,
): SchemaFormValues => {
  if (!isQcHardwareProcessSubType(subType)) return createInitialHardwareProcessValues("ABRADING");
  const sectionId = getHardwareSectionIdForSubType(subType) ?? QC_HARDWARE_SECTION_IDS[subType];
  const section = (sections ?? []).find(
    (entry) => String(entry.sectionId ?? "").trim() === sectionId,
  );
  if (!section) return createInitialHardwareProcessValues(subType);

  if (subType === "ABRADING") {
    const first = extractTableRows<QcHardwareCutRow>(
      section.sectionData,
      QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID,
    );
    const second = extractTableRows<QcHardwareCutRow>(
      section.sectionData,
      QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID,
    );
    return {
      [formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID)]:
        first.length > 0 ? normalizeCutRows(first) : [emptyCutRow(1)],
      [formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID)]:
        second.length > 0 ? normalizeCutRows(second) : [emptyCutRow(1)],
    };
  }

  if (subType === "PREHEATING") {
    const rows = extractTableRows<QcHardwarePreheatingRow>(
      section.sectionData,
      QC_HARDWARE_PREHEATING_TABLE_ID,
    );
    return {
      [formKey(sectionId, QC_HARDWARE_PREHEATING_TABLE_ID)]:
        rows.length > 0 ? normalizePreheatingRows(rows) : [emptyPreheatingRow(1)],
    };
  }

  if (subType === "LINEAR_COATING") {
    const rows = extractTableRows<QcHardwareLinearCoatingRow>(
      section.sectionData,
      QC_HARDWARE_LINEAR_COATING_TABLE_ID,
    );
    return {
      [formKey(sectionId, QC_HARDWARE_LINEAR_COATING_TABLE_ID)]:
        rows.length > 0 ? normalizeLinearCoatingRows(rows) : [emptyLinearCoatingRow(1)],
    };
  }

  const data = asRecord(asArray(section.sectionData)[0]) ?? {};
  const visualFromSection = extractTableRows<QcHardwareVisualObservationRow>(
    section.sectionData,
    QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID,
  );
  const legacyObservations = String(data.OBSERVATIONS ?? "").trim();
  return {
    [formKey(sectionId, "HE_PUNCTURES")]: String(data.HE_PUNCTURES ?? ""),
    [formKey(sectionId, "NE_PUNCTURES")]: String(data.NE_PUNCTURES ?? ""),
    [formKey(sectionId, "LF_PUNCTURES")]: String(data.LF_PUNCTURES ?? ""),
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: String(data.DISPATCH_DATE_TIME ?? ""),
    [formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]:
      normalizeVisualObservationRows(
        visualFromSection.length
          ? visualFromSection
          : legacyObservations
            ? emptyVisualObservationRows().map((row, index) =>
                index === 0 ? { ...row, OBSERVATIONS: legacyObservations } : row,
              )
            : emptyVisualObservationRows(),
      ),
  };
};

export const buildHardwareAttachmentsSectionsForForm = (
  hardwareEntries: QcDivisionEntry[],
  valuesByEntryId: Record<string, { schemaValues?: SchemaFormValues } | undefined>,
): SchemaSectionSubmission[] => {
  const motorsSeen = new Set<string>();
  const sections: SchemaSectionSubmission[] = [];

  for (const entry of hardwareEntries) {
    const motorId = String(entry.motorId ?? "").trim();
    if (!motorId || motorsSeen.has(motorId)) continue;
    motorsSeen.add(motorId);

    const uploads = collectHardwareUploadValuesForMotor(
      motorId,
      hardwareEntries,
      valuesByEntryId,
    );
    const payload = buildHardwareAttachmentsSectionPayloadFromUploads(uploads);
    sections.push(
      ...payload.map((section) => ({
        ...section,
        motorId,
      })),
    );
  }

  return sections;
};

/** Saved hardware uploads may live on flat sections or per-entry savedSections (motorDetails shape). */
export const collectHardwareMotorSections = (
  motorId: string,
  hardwareEntries: QcDivisionEntry[],
  savedSections?: SchemaSectionSubmission[] | null,
): SchemaSectionSubmission[] => {
  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return [];

  const fromFlat = (savedSections ?? []).filter((section) => {
    const sectionMotorId = String((section as { motorId?: string }).motorId ?? "").trim();
    return !sectionMotorId || sectionMotorId === normalizedMotorId;
  });

  const fromEntries: SchemaSectionSubmission[] = [];
  hardwareEntries.forEach((entry) => {
    if (String(entry.motorId ?? "").trim() !== normalizedMotorId) return;
    fromEntries.push(...(entry.savedSections ?? []));
  });

  if (!fromFlat.length) return fromEntries;
  if (!fromEntries.length) return fromFlat;

  const seen = new Set<string>();
  const merged: SchemaSectionSubmission[] = [];
  [...fromFlat, ...fromEntries].forEach((section) => {
    const key = `${String(section.sectionId ?? "").trim()}:${String((section as { motorId?: string }).motorId ?? "").trim()}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(section);
  });
  return merged;
};

export type QcHardwareMotorSubmissionType = "DRAFT" | "SUBMIT";

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const pickApiField = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const cutRowToApiRow = (row: QcHardwareCutRow, index: number) =>
  omitEmpty({
    srNo: index + 1,
    date: row.DATE,
    startTime: row.START_TIME,
    endTime: row.END_TIME,
    dustQty: row.DUST_QTY,
    observations: row.OBSERVATIONS,
  });

const preheatingRowToApiRow = (row: QcHardwarePreheatingRow, index: number) =>
  omitEmpty({
    srNo: index + 1,
    date: row.DATE,
    startTime: row.START_TIME,
    endTime: row.END_TIME,
    ovenNumber: row.OVEN_NUMBER,
    buildingNo: row.BUILDING_NO,
    temperature: row.TEMPERATURE,
    vacuumLevel: row.VACUUM_LEVEL,
    observations: row.OBSERVATIONS,
  });

const linerRowToApiRow = (row: QcHardwareLinearCoatingRow, index: number) =>
  omitEmpty({
    srNo: index + 1,
    date: row.DATE,
    startTime: row.START_TIME,
    endTime: row.END_TIME,
    linerQty: row.LINER_QTY,
    insulationTemp: row.INSULATION_TEMP,
    rh: row.RH,
    observations: row.OBSERVATIONS,
  });

const dispatchToApi = (values: SchemaFormValues | null | undefined) => {
  const dispatch = getHardwareDispatchValues(values);
  const visualObservations = getHardwareDispatchVisualObservationRows(values).map((row, index) => ({
    srNo: index + 1,
    parameter: String(row.PARAMETER ?? "").trim(),
    observations: String(row.OBSERVATIONS ?? "").trim(),
    remarks: String(row.REMARKS ?? "").trim() || null,
  }));
  return omitEmpty({
    hePunctures: dispatch.HE_PUNCTURES,
    nePunctures: dispatch.NE_PUNCTURES,
    lfPunctures: dispatch.LF_PUNCTURES,
    dispatchDateTime: dispatch.DISPATCH_DATE_TIME,
    visualObservations,
  });
};

const buildHardwareAbradingPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const firstCut = sanitizeCutRows(
    getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID),
  ).map((row, index) => cutRowToApiRow(row, index));
  const secondCut = sanitizeCutRows(
    getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID),
  ).map((row, index) => cutRowToApiRow(row, index));
  return omitEmpty({
    firstCut,
    secondCut,
  });
};

const buildHardwarePreheatingPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const rows = sanitizePreheatingRows(getHardwarePreheatingRows(values)).map((row, index) =>
    preheatingRowToApiRow(row, index),
  );
  return rows.length ? { rows } : {};
};

const buildHardwareLinerCoatingPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const rows = sanitizeLinearCoatingRows(getHardwareLinearCoatingRows(values)).map((row, index) =>
    linerRowToApiRow(row, index),
  );
  return rows.length ? { rows } : {};
};

const buildHardwareDispatchPayload = (values: SchemaFormValues): Record<string, unknown> =>
  dispatchToApi(values);

const buildHardwareAttachmentsPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const uploads = sanitizeHardwareUploadValues(getHardwareUploadValues(values));
  // Always emit all three keys (including empty arrays) — matches create/update API contract.
  return {
    uploadReport: toFileIdListPayload(uploads[QC_HARDWARE_UPLOAD_REPORT_KEY]),
    uploadGraph: toFileIdListPayload(uploads[QC_HARDWARE_UPLOAD_GRAPH_KEY]),
    uploadPhoto: toFileIdListPayload(uploads[QC_HARDWARE_UPLOAD_PHOTO_KEY]),
  };
};

const formatApiDateForUi = (value: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return formatToUiDate(raw);
  return raw;
};

const mapDispatchVisualObservationsFromApi = (
  dispatch: Record<string, unknown>,
): QcHardwareVisualObservationRow[] => {
  const apiRows = asArray(dispatch.visualObservations)
    .map((row) => {
      const rec = asRecord(row);
      if (!rec) return null;
      return {
        SR_NO: Number(rec.srNo ?? rec.SR_NO) || undefined,
        PARAMETER: String(rec.parameter ?? rec.PARAMETER ?? "").trim(),
        OBSERVATIONS: String(rec.observations ?? rec.OBSERVATIONS ?? "").trim(),
        REMARKS: String(rec.remarks ?? rec.REMARKS ?? "").trim(),
      } satisfies QcHardwareVisualObservationRow;
    })
    .filter((row): row is QcHardwareVisualObservationRow => Boolean(row));

  if (apiRows.length) return normalizeVisualObservationRows(apiRows);

  const flat = pickApiField(dispatch, "observations", "OBSERVATIONS");
  if (!flat) return emptyVisualObservationRows();
  return normalizeVisualObservationRows(
    emptyVisualObservationRows().map((row, index) =>
      index === 0 ? { ...row, OBSERVATIONS: flat } : row,
    ),
  );
};

export const listHardwareMotorsFromDetailData = (detailData: unknown): Record<string, unknown>[] => {
  const root = asRecord(detailData);
  if (!root) return [];
  const buckets = [
    asRecord(root.data),
    root,
    asRecord(root.__manufacturingDivisionData),
    asRecord(root.__qcFormDivisionData),
    asRecord(asRecord(root.__manufacturingDivisionData)?.data),
    asRecord(asRecord(root.__qcFormDivisionData)?.data),
  ].filter(Boolean) as Record<string, unknown>[];
  const motors: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const bucket of buckets) {
    const casePrep = asRecord(bucket.casePreparationDetails);
    for (const motor of [
      ...asArray(bucket.motorDetails),
      ...asArray(bucket.motors),
      ...asArray(casePrep?.motors),
    ]) {
      const rec = asRecord(motor);
      if (!rec) continue;
      const motorId = String(rec.motorId ?? rec.motorIdNo ?? rec.id ?? "").trim();
      const key = motorId || JSON.stringify(rec);
      if (seen.has(key)) continue;
      seen.add(key);
      motors.push(rec);
    }
  }

  return motors;
};

const splitAbradingDateTimeValue = (value: unknown): { date: string; time: string } => {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: "", time: "" };

  if (raw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) {
      return {
        date: parsed.format("DD-MM-YYYY"),
        time: parsed.format("HH:mm"),
      };
    }
  }

  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return {
      date: "",
      time: `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`,
    };
  }

  return { date: formatToUiDate(raw), time: "" };
};

const mapAbradingDetailItemsToCutRows = (abradingDetails: unknown[]): QcHardwareCutRow[] => {
  const rows: QcHardwareCutRow[] = [];
  let current: Partial<QcHardwareCutRow> = {};

  const flush = () => {
    if (!cutRowHasData(current as QcHardwareCutRow)) {
      current = {};
      return;
    }
    rows.push({
      SR_NO: rows.length + 1,
      DATE: String(current.DATE ?? ""),
      START_TIME: String(current.START_TIME ?? ""),
      END_TIME: String(current.END_TIME ?? ""),
      DUST_QTY: String(current.DUST_QTY ?? ""),
      OBSERVATIONS: String(current.OBSERVATIONS ?? ""),
    });
    current = {};
  };

  for (const item of abradingDetails) {
    const rec = asRecord(item);
    if (!rec) continue;
    const operation = String(rec.operation ?? "").trim();
    const value = String(rec.value ?? "").trim();
    const remarks = String(rec.remarksObservations ?? rec.remarks ?? "").trim();

    if (/^Start Date & Time$/i.test(operation)) {
      flush();
      const { date, time } = splitAbradingDateTimeValue(value);
      current.DATE = date;
      current.START_TIME = time;
      if (remarks) current.OBSERVATIONS = remarks;
      continue;
    }

    if (/^End Date & Time$/i.test(operation)) {
      const { date, time } = splitAbradingDateTimeValue(value);
      if (!current.DATE && date) current.DATE = date;
      current.END_TIME = time;
      if (remarks && !current.OBSERVATIONS) current.OBSERVATIONS = remarks;
      continue;
    }

    if (/Dust Weight/i.test(operation) && !/Total/i.test(operation)) {
      current.DUST_QTY = value;
    }
  }

  flush();
  return rows;
};

const isAbradingHeaderRow = (rec: Record<string, unknown>) =>
  String(rec.type ?? "").toLowerCase() === "header" ||
  ("label" in rec && !("operation" in rec));

const isSecondCutHeaderLabel = (label: string) => /2nd|second/i.test(label);

/** Map Case Prep / legacy `abradingDetails` rows into First Cut and Second Cut tables. */
export const mapAbradingDetailsToFirstAndSecondCut = (
  abradingDetails: unknown[],
): { firstCut: QcHardwareCutRow[]; secondCut: QcHardwareCutRow[] } => {
  const firstItems: unknown[] = [];
  const secondItems: unknown[] = [];
  let target = firstItems;

  for (const item of abradingDetails) {
    const rec = asRecord(item);
    if (!rec) continue;
    if (isAbradingHeaderRow(rec)) {
      const label = String(rec.label ?? rec.operation ?? "").trim();
      if (isSecondCutHeaderLabel(label)) {
        target = secondItems;
      } else if (/1st|first/i.test(label)) {
        target = firstItems;
      }
      continue;
    }
    target.push(item);
  }

  if (firstItems.length > 0 || secondItems.length > 0) {
    return {
      firstCut: mapAbradingDetailItemsToCutRows(firstItems),
      secondCut: mapAbradingDetailItemsToCutRows(secondItems),
    };
  }

  const allRows = mapAbradingDetailItemsToCutRows(abradingDetails);
  return {
    firstCut: allRows[0] != null ? [allRows[0]] : [],
    secondCut: allRows[1] != null ? [allRows[1]] : [],
  };
};

export const resolveAbradingCutsFromRecord = (
  abrading: Record<string, unknown>,
): { firstCut: QcHardwareCutRow[]; secondCut: QcHardwareCutRow[] } => {
  const firstFromApi = asArray(abrading.firstCut).map(apiCutRowToFormRow);
  const secondFromApi = asArray(abrading.secondCut).map(apiCutRowToFormRow);
  if (firstFromApi.length > 0 || secondFromApi.length > 0) {
    return { firstCut: firstFromApi, secondCut: secondFromApi };
  }

  const firstFromSections = extractTableRows<QcHardwareCutRow>(
    [abrading],
    QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID,
  );
  const secondFromSections = extractTableRows<QcHardwareCutRow>(
    [abrading],
    QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID,
  );
  if (firstFromSections.length > 0 || secondFromSections.length > 0) {
    return { firstCut: firstFromSections, secondCut: secondFromSections };
  }

  return mapAbradingDetailsToFirstAndSecondCut(asArray(abrading.abradingDetails));
};

const apiCutRowToFormRow = (row: unknown, index: number): QcHardwareCutRow => {
  const rec = asRecord(row) ?? {};
  return {
    SR_NO: Number(pickApiField(rec, "srNo", "SR_NO")) || index + 1,
    DATE: formatApiDateForUi(pickApiField(rec, "date", "DATE")),
    START_TIME: pickApiField(rec, "startTime", "START_TIME"),
    END_TIME: pickApiField(rec, "endTime", "END_TIME"),
    DUST_QTY: pickApiField(rec, "dustQty", "DUST_QTY"),
    OBSERVATIONS: pickApiField(rec, "observations", "OBSERVATIONS"),
  };
};

const apiPreheatingRowToFormRow = (row: unknown, index: number): QcHardwarePreheatingRow => {
  const rec = asRecord(row) ?? {};
  return {
    SR_NO: Number(pickApiField(rec, "srNo", "SR_NO")) || index + 1,
    DATE: formatApiDateForUi(pickApiField(rec, "date", "DATE")),
    START_TIME: pickApiField(rec, "startTime", "START_TIME"),
    END_TIME: pickApiField(rec, "endTime", "END_TIME"),
    OVEN_NUMBER: pickApiField(rec, "ovenNumber", "OVEN_NUMBER"),
    BUILDING_NO: pickApiField(rec, "buildingNo", "BUILDING_NO"),
    TEMPERATURE: pickApiField(rec, "temperature", "TEMPERATURE"),
    VACUUM_LEVEL: pickApiField(rec, "vacuumLevel", "VACUUM_LEVEL"),
    OBSERVATIONS: pickApiField(rec, "observations", "OBSERVATIONS"),
  };
};

const apiLinerRowToFormRow = (row: unknown, index: number): QcHardwareLinearCoatingRow => {
  const rec = asRecord(row) ?? {};
  return {
    SR_NO: Number(pickApiField(rec, "srNo", "SR_NO")) || index + 1,
    DATE: formatApiDateForUi(pickApiField(rec, "date", "DATE")),
    START_TIME: pickApiField(rec, "startTime", "START_TIME"),
    END_TIME: pickApiField(rec, "endTime", "END_TIME"),
    LINER_QTY: pickApiField(rec, "linerQty", "LINER_QTY"),
    INSULATION_TEMP: pickApiField(rec, "insulationTemp", "INSULATION_TEMP"),
    RH: pickApiField(rec, "rh", "RH"),
    OBSERVATIONS: pickApiField(rec, "observations", "OBSERVATIONS"),
  };
};

const hydrateHardwareAttachmentsFromMotorDetail = (
  attachments: unknown,
): QcHardwareUploadValues => {
  const rec = asRecord(attachments) ?? {};
  return {
    [QC_HARDWARE_UPLOAD_REPORT_KEY]: parseFileRefs(
      rec.uploadReport ?? rec.UPLOAD_REPORT ?? rec.upload_report,
    ),
    [QC_HARDWARE_UPLOAD_GRAPH_KEY]: parseFileRefs(
      rec.uploadGraph ?? rec.UPLOAD_GRAPH ?? rec.upload_graph,
    ),
    [QC_HARDWARE_UPLOAD_PHOTO_KEY]: parseFileRefs(
      rec.uploadPhoto ?? rec.UPLOAD_PHOTO ?? rec.upload_photo,
    ),
  };
};

export const isHardwareNestedMotorDetail = (motor: Record<string, unknown>) =>
  Boolean(
    motor.abrading ||
      motor.abradingOperation ||
      motor.preheating ||
      motor.preHeating ||
      motor.linerCoating ||
      motor.linerCoatingOperation ||
      motor.dispatch ||
      motor.dispatchToCasting ||
      motor.attachments ||
      motor.tceCleaning,
  );

const resolveAbradingCutsForMotor = (
  motor: Record<string, unknown>,
): { firstCut: QcHardwareCutRow[]; secondCut: QcHardwareCutRow[] } => {
  const sources = [
    asRecord(motor.abrading),
    asRecord(motor.abradingOperation),
    asRecord(asRecord(motor.details)?.abradingOperation),
  ].filter(Boolean) as Record<string, unknown>[];

  for (const source of sources) {
    const cuts = resolveAbradingCutsFromRecord(source);
    if (hardwareAbradingCutsHaveData(cuts.firstCut, cuts.secondCut)) {
      return cuts;
    }
  }

  return { firstCut: [], secondCut: [] };
};

export const findHardwareMotorDetailInData = (
  detailData: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return null;

  const root = asRecord(detailData);
  const manufacturingRoot = asRecord(root?.__manufacturingDivisionData);
  const candidates = [
    detailData,
    root?.__qcFormDivisionData,
    root?.__manufacturingDivisionData,
    root?.data,
    manufacturingRoot,
  ].filter((candidate, index, list) => candidate != null && list.indexOf(candidate) === index);

  for (const candidate of candidates) {
    for (const rec of listHardwareMotorsFromDetailData(candidate)) {
      const id = String(rec.motorId ?? rec.motorIdNo ?? rec.id ?? "").trim();
      if (id === normalizedMotorId && isHardwareNestedMotorDetail(rec)) return rec;
    }
  }

  return null;
};

export const hydrateHardwareValuesFromMotorDetail = (
  motor: Record<string, unknown>,
): SchemaFormValues => {
  const abradingSectionId = QC_HARDWARE_SECTION_IDS.ABRADING;
  const preheatingSectionId = QC_HARDWARE_SECTION_IDS.PREHEATING;
  const linerSectionId = QC_HARDWARE_SECTION_IDS.LINEAR_COATING;
  const dispatchSectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;

  const { firstCut, secondCut } = resolveAbradingCutsForMotor(motor);

  const preheating = asRecord(motor.preheating) ?? asRecord(motor.preHeating) ?? {};
  const preheatingRows = asArray(preheating.rows).map(apiPreheatingRowToFormRow);

  const linerCoating =
    asRecord(motor.linerCoating) ?? asRecord(motor.linerCoatingOperation) ?? {};
  const linerRows = asArray(linerCoating.rows).map(apiLinerRowToFormRow);

  const dispatch = asRecord(motor.dispatch) ?? asRecord(motor.dispatchToCasting) ?? {};
  const uploads = hydrateHardwareAttachmentsFromMotorDetail(motor.attachments);

  let values: SchemaFormValues = {
    ...createInitialHardwareProcessValues("ABRADING"),
    [formKey(abradingSectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID)]:
      firstCut.length > 0 ? normalizeCutRows(firstCut) : [emptyCutRow(1)],
    [formKey(abradingSectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID)]:
      secondCut.length > 0 ? normalizeCutRows(secondCut) : [emptyCutRow(1)],
    [formKey(preheatingSectionId, QC_HARDWARE_PREHEATING_TABLE_ID)]:
      preheatingRows.length > 0 ? normalizePreheatingRows(preheatingRows) : [emptyPreheatingRow(1)],
    [formKey(linerSectionId, QC_HARDWARE_LINEAR_COATING_TABLE_ID)]:
      linerRows.length > 0 ? normalizeLinearCoatingRows(linerRows) : [emptyLinearCoatingRow(1)],
    [formKey(dispatchSectionId, "HE_PUNCTURES")]: pickApiField(dispatch, "hePunctures", "HE_PUNCTURES"),
    [formKey(dispatchSectionId, "NE_PUNCTURES")]: pickApiField(dispatch, "nePunctures", "NE_PUNCTURES"),
    [formKey(dispatchSectionId, "LF_PUNCTURES")]: pickApiField(dispatch, "lfPunctures", "LF_PUNCTURES"),
    [formKey(dispatchSectionId, "DISPATCH_DATE_TIME")]: pickApiField(
      dispatch,
      "dispatchDateTime",
      "DISPATCH_DATE_TIME",
    ),
    [formKey(dispatchSectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]:
      mapDispatchVisualObservationsFromApi(dispatch),
  };

  values = mergeHardwareUploadValuesIntoEntryValues(values, uploads);
  return values;
};

export const sliceHardwareEntrySchemaValues = (
  merged: SchemaFormValues,
  subType: QcHardwareProcessSubType,
): SchemaFormValues => {
  const initial = createInitialHardwareProcessValues(subType);
  const sliced: SchemaFormValues = { ...initial };
  for (const key of Object.keys(initial)) {
    if (key in merged) {
      sliced[key] = merged[key];
    }
  }
  if (subType === "ABRADING") {
    return mergeHardwareUploadValuesIntoEntryValues(sliced, getHardwareUploadValues(merged));
  }
  return sliced;
};

export const collectHardwareFileRefsFromQcValues = (
  values: SchemaFormValues | null | undefined,
): FileRef[] => {
  const uploads = getHardwareUploadValues(values);
  return QC_HARDWARE_UPLOAD_TYPES.flatMap((uploadType) => uploads[uploadType] ?? []);
};

export const hasIncompleteQcHardwareUploads = (
  values: SchemaFormValues | null | undefined,
): boolean => collectHardwareFileRefsFromQcValues(values).some(isFileUploadIncomplete);

export const collectTempFileIdsFromQcHardwareValues = (
  values: SchemaFormValues | null | undefined,
): string[] =>
  [
    ...new Set(
      collectHardwareFileRefsFromQcValues(values)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

export const mergeHardwareMotorSchemaValues = (
  hardwareEntries: QcDivisionEntry[],
  valuesByEntryId: Record<string, { schemaValues?: SchemaFormValues } | undefined>,
): SchemaFormValues => {
  const merged = createInitialHardwareProcessValues("ABRADING");
  hardwareEntries.forEach((entry) => {
    const subType = String(entry.subType ?? "");
    if (!isQcHardwareProcessSubType(subType)) return;
    const values = valuesByEntryId[entry.entryId]?.schemaValues;
    if (!values) return;
    Object.assign(merged, values);
  });

  // Shared uploads live on the Abrading (anchor) entry — re-apply after merge so a
  // later process Object.assign cannot wipe HARDWARE_ATTACHMENTS::* keys.
  const motorId = String(hardwareEntries[0]?.motorId ?? "").trim();
  if (!motorId) return merged;
  return mergeHardwareUploadValuesIntoEntryValues(
    merged,
    collectHardwareUploadValuesForMotor(motorId, hardwareEntries, valuesByEntryId),
  );
};

/** UI-aligned QC create/update payload (`data.motorDetails[]`). */
export const buildHardwareMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcHardwareMotorSubmissionType = "DRAFT",
): Record<string, unknown> => {
  const merged = values ?? createInitialHardwareProcessValues("ABRADING");
  const attachments = buildHardwareAttachmentsPayload(merged);
  return omitEmpty({
    motorId,
    motorSubmissionType,
    abrading: buildHardwareAbradingPayload(merged),
    preheating: buildHardwarePreheatingPayload(merged),
    linerCoating: buildHardwareLinerCoatingPayload(merged),
    dispatch: buildHardwareDispatchPayload(merged),
    // Always send attachments object (API expects uploadReport/Graph/Photo keys).
    attachments,
  });
};

export const listHardwareProcessSubTypes = (): QcHardwareProcessSubType[] =>
  QC_HARDWARE_PROCESS_OPTIONS.map((option) => option.value);

export { getQcHardwareProcessLabel, isQcHardwareProcessSubType };
