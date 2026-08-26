import dayjs from "dayjs";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { formatDateTimeForApi } from "../../../data/models/user/rawMaterialPreparationApiMapper";
import { isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileRef } from "../../../data/models/common/FileUploadModel";
import { formatToIsoDateInput } from "../../../utils/dateUtils";
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
  OBSERVATIONS?: string;
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
    [formKey(sectionId, "OBSERVATIONS")]: "",
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
  return {
    HE_PUNCTURES: String(values?.[formKey(sectionId, "HE_PUNCTURES")] ?? ""),
    NE_PUNCTURES: String(values?.[formKey(sectionId, "NE_PUNCTURES")] ?? ""),
    LF_PUNCTURES: String(values?.[formKey(sectionId, "LF_PUNCTURES")] ?? ""),
    DISPATCH_DATE_TIME: String(values?.[formKey(sectionId, "DISPATCH_DATE_TIME")] ?? ""),
    OBSERVATIONS: String(values?.[formKey(sectionId, "OBSERVATIONS")] ?? ""),
  };
};

export const setHardwareDispatchValues = (
  values: SchemaFormValues | null | undefined,
  next: QcHardwareDispatchValues,
): SchemaFormValues => {
  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  return {
    ...(values ?? {}),
    [formKey(sectionId, "HE_PUNCTURES")]: next.HE_PUNCTURES ?? "",
    [formKey(sectionId, "NE_PUNCTURES")]: next.NE_PUNCTURES ?? "",
    [formKey(sectionId, "LF_PUNCTURES")]: next.LF_PUNCTURES ?? "",
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: next.DISPATCH_DATE_TIME ?? "",
    [formKey(sectionId, "OBSERVATIONS")]: next.OBSERVATIONS ?? "",
  };
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

  for (const entry of hardwareEntries) {
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
  if (
    !hasValue(dispatch.HE_PUNCTURES) &&
    !hasValue(dispatch.NE_PUNCTURES) &&
    !hasValue(dispatch.LF_PUNCTURES) &&
    !hasValue(dispatch.DISPATCH_DATE_TIME) &&
    !hasValue(dispatch.OBSERVATIONS)
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
          ...(hasValue(dispatch.OBSERVATIONS)
            ? { OBSERVATIONS: String(dispatch.OBSERVATIONS ?? "").trim() }
            : {}),
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
  return {
    [formKey(sectionId, "HE_PUNCTURES")]: String(data.HE_PUNCTURES ?? ""),
    [formKey(sectionId, "NE_PUNCTURES")]: String(data.NE_PUNCTURES ?? ""),
    [formKey(sectionId, "LF_PUNCTURES")]: String(data.LF_PUNCTURES ?? ""),
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: String(data.DISPATCH_DATE_TIME ?? ""),
    [formKey(sectionId, "OBSERVATIONS")]: String(data.OBSERVATIONS ?? ""),
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

const combineUiDateTime = (date: string, time: string): string | undefined => {
  const d = String(date ?? "").trim();
  const t = String(time ?? "").trim();
  if (!d && !t) return undefined;
  if (d && t) return formatDateTimeForApi(`${d} ${t}`) ?? undefined;
  if (d) return formatToIsoDateInput(d) || undefined;
  if (/^\d{1,2}:\d{2}/.test(t)) {
    const parsed = dayjs(`1970-01-01 ${t}`);
    return parsed.isValid() ? parsed.format("HH:mm") : t;
  }
  return undefined;
};

const cutRowToAbradingDetails = (
  row: QcHardwareCutRow,
  dustLabel: "A" | "B",
  startSrNo: number,
): Record<string, unknown>[] => {
  const details: Record<string, unknown>[] = [];
  let srNo = startSrNo;
  const startValue = combineUiDateTime(String(row.DATE ?? ""), String(row.START_TIME ?? ""));
  const endValue = combineUiDateTime(String(row.DATE ?? ""), String(row.END_TIME ?? ""));
  const remarks = String(row.OBSERVATIONS ?? "").trim() || undefined;

  if (startValue) {
    details.push({
      SR_NO: srNo++,
      operation: "Start Date & Time",
      value: startValue,
      remarksObservations: remarks,
    });
  }
  if (endValue) {
    details.push({
      SR_NO: srNo++,
      operation: "End Date & Time",
      value: endValue,
      remarksObservations: remarks,
    });
  }
  if (hasValue(row.DUST_QTY)) {
    details.push({
      SR_NO: srNo++,
      operation: `Dust Weight (in gm) (${dustLabel})`,
      value: String(row.DUST_QTY ?? "").trim(),
      remarksObservations: remarks,
    });
  }
  return details;
};

const buildAbradingOperationPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const firstCut = sanitizeCutRows(
    getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID),
  );
  const secondCut = sanitizeCutRows(
    getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID),
  );
  const abradingDetails = [
    ...cutRowToAbradingDetails(firstCut[0] ?? emptyCutRow(1), "A", 1),
    ...cutRowToAbradingDetails(secondCut[0] ?? emptyCutRow(1), "B", 4),
  ];
  const dustA = Number(firstCut[0]?.DUST_QTY);
  const dustB = Number(secondCut[0]?.DUST_QTY);
  if (Number.isFinite(dustA) && Number.isFinite(dustB)) {
    abradingDetails.push({
      SR_NO: abradingDetails.length + 1,
      operation: "Total Dust Weight (in gm) (A+B)",
      value: String(dustA + dustB),
      remarksObservations: undefined,
    });
  }
  const photoFiles = toFileIdListPayload(
    getHardwareUploadValues(values)[QC_HARDWARE_UPLOAD_PHOTO_KEY],
  );

  return omitEmpty({
    abradingDetails: abradingDetails.map((row, index) => ({
      ...row,
      SR_NO: index + 1,
      attachments: index === 0 && photoFiles.length ? photoFiles : undefined,
    })),
  });
};

const buildPreHeatingPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const rows = sanitizePreheatingRows(getHardwarePreheatingRows(values));
  const row = rows[0];
  if (!row) return {};

  const monitoring: Record<string, unknown>[] = [];
  let srNo = 1;
  if (hasValue(row.DATE)) {
    monitoring.push({
      SR_NO: srNo++,
      parameter: "Date",
      value: formatToIsoDateInput(String(row.DATE)) || String(row.DATE),
      remarks: String(row.OBSERVATIONS ?? "").trim() || undefined,
    });
  }
  if (hasValue(row.START_TIME)) {
    monitoring.push({
      SR_NO: srNo++,
      parameter: "Cycle Start Time",
      value: String(row.START_TIME).trim(),
      remarks: undefined,
    });
  }
  if (hasValue(row.END_TIME)) {
    monitoring.push({
      SR_NO: srNo++,
      parameter: "Cycle End Time",
      value: String(row.END_TIME).trim(),
      remarks: undefined,
    });
  }
  if (hasValue(row.OBSERVATIONS)) {
    monitoring.push({
      SR_NO: srNo++,
      parameter: "Visual Observation After Pre-heating",
      value: String(row.OBSERVATIONS).trim(),
      remarks: undefined,
    });
  }

  const temperatureDuration = hasValue(row.TEMPERATURE)
    ? [
        {
          SR_NO: 1,
          parameter: "Temperature @ 1 Hour",
          value: String(row.TEMPERATURE).trim(),
          remarks: undefined,
        },
      ]
    : [];

  return omitEmpty({
    vacuumBaggingApplied: hasValue(row.VACUUM_LEVEL) ? "YES" : undefined,
    vacuumApplied: hasValue(row.VACUUM_LEVEL) ? Number(row.VACUUM_LEVEL) : undefined,
    temperatureDuration,
    preHeatingMonitoring: monitoring,
  });
};

const buildLinerCoatingPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const rows = sanitizeLinearCoatingRows(getHardwareLinearCoatingRows(values));
  const row = rows[0];
  if (!row) return {};

  const log: Record<string, unknown>[] = [];
  let srNo = 1;
  const pushLog = (parameter: string, value: unknown, remarks?: string) => {
    if (!hasValue(value)) return;
    log.push({
      SR_NO: srNo++,
      parameter,
      value: String(value).trim(),
      remarks: remarks?.trim() || undefined,
    });
  };

  pushLog("Date", formatToIsoDateInput(String(row.DATE ?? "")) || row.DATE, row.OBSERVATIONS);
  pushLog("Start Time", row.START_TIME, row.OBSERVATIONS);
  pushLog("End Time", row.END_TIME, row.OBSERVATIONS);
  pushLog("Rocket Motor Insulation Temp", row.INSULATION_TEMP, row.OBSERVATIONS);
  pushLog("Liner Applied (w/o DCM)", row.LINER_QTY, row.OBSERVATIONS);

  return omitEmpty({
    rh: row.RH || undefined,
    linerApplicationLog: log,
  });
};

const buildDispatchToCastingPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const dispatch = getHardwareDispatchValues(values);
  const details: Record<string, unknown>[] = [];
  let srNo = 1;
  const pushDetail = (parameter: string, value: unknown, remarks?: string) => {
    if (!hasValue(value)) return;
    details.push({
      SR_NO: srNo++,
      parameter,
      value: String(value).trim(),
      remarks: remarks?.trim() || undefined,
    });
  };

  pushDetail("Puncturing at HE (Nos)", dispatch.HE_PUNCTURES);
  pushDetail("Puncturing at NE (Nos)", dispatch.NE_PUNCTURES);
  pushDetail("Puncturing at LF Extension (Nos)", dispatch.LF_PUNCTURES);
  pushDetail("Dispatch Time", combineUiDateTime("", String(dispatch.DISPATCH_DATE_TIME ?? "")));

  const visualObservations = String(dispatch.OBSERVATIONS ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [parameter, ...rest] = line.split(":");
      if (rest.length) {
        return {
          SR_NO: index + 1,
          parameter: parameter.trim(),
          observations: rest.join(":").trim(),
        };
      }
      return { SR_NO: index + 1, parameter: "Observations", observations: line };
    });

  return omitEmpty({
    dispatchVisualObservations: visualObservations,
    dispatchToCastingDetails: details,
  });
};

const buildTceCleaningPayload = (values: SchemaFormValues): Record<string, unknown> => {
  const uploads = getHardwareUploadValues(values);
  const report = toFileIdListPayload(uploads[QC_HARDWARE_UPLOAD_REPORT_KEY]);
  if (!report.length) return {};
  return omitEmpty({
    testReport: report,
  });
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
  return merged;
};

/** Strict Case Preparation DTO for QC create/update (`data.motorDetails[]`). */
export const buildHardwareMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcHardwareMotorSubmissionType = "DRAFT",
): Record<string, unknown> => {
  const merged = values ?? createInitialHardwareProcessValues("ABRADING");
  return omitEmpty({
    motorId,
    motorSubmissionType,
    abradingOperation: buildAbradingOperationPayload(merged),
    tceCleaning: buildTceCleaningPayload(merged),
    preHeating: buildPreHeatingPayload(merged),
    linerCoatingOperation: buildLinerCoatingPayload(merged),
    dispatchToCasting: buildDispatchToCastingPayload(merged),
  });
};

export const listHardwareProcessSubTypes = (): QcHardwareProcessSubType[] =>
  QC_HARDWARE_PROCESS_OPTIONS.map((option) => option.value);

export { getQcHardwareProcessLabel, isQcHardwareProcessSubType };
