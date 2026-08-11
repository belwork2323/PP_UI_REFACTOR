import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
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

export type QcHardwareUploadValues = Record<QcHardwareUploadType, string>;

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
  [QC_HARDWARE_UPLOAD_REPORT_KEY]: "",
  [QC_HARDWARE_UPLOAD_GRAPH_KEY]: "",
  [QC_HARDWARE_UPLOAD_PHOTO_KEY]: "",
});

export const createInitialHardwareUploadValues = (): SchemaFormValues =>
  Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.map((uploadType) => [
      formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, uploadType),
      "",
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
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: next.DISPATCH_DATE_TIME ?? "",
    [formKey(sectionId, "OBSERVATIONS")]: next.OBSERVATIONS ?? "",
  };
};

const readUploadValue = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  uploadType: QcHardwareUploadType,
) => String(values?.[formKey(sectionId, uploadType)] ?? "").trim();

export const getHardwareUploadValues = (
  values: SchemaFormValues | null | undefined,
): QcHardwareUploadValues => {
  const uploads = emptyHardwareUploadValues();
  for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
    const shared = readUploadValue(values, QC_HARDWARE_ATTACHMENTS_SECTION_ID, uploadType);
    if (shared) {
      uploads[uploadType] = shared;
      continue;
    }
    const abrading = readUploadValue(values, QC_HARDWARE_SECTION_IDS.ABRADING, uploadType);
    if (abrading) {
      uploads[uploadType] = abrading;
      continue;
    }
    for (const legacySubType of LEGACY_HARDWARE_UPLOAD_SUB_TYPES) {
      const legacy = readUploadValue(values, QC_HARDWARE_SECTION_IDS[legacySubType], uploadType);
      if (legacy) {
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
      next[uploadType] ?? "",
    ]),
  ),
});

export const setHardwareUploadValue = (
  values: SchemaFormValues | null | undefined,
  uploadType: QcHardwareUploadType,
  value: string,
): SchemaFormValues =>
  setHardwareUploadValues(values, {
    ...getHardwareUploadValues(values),
    [uploadType]: value,
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

const sanitizeHardwareUploadValues = (uploads: QcHardwareUploadValues) =>
  Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.map((uploadType) => [
      uploadType,
      String(uploads[uploadType] ?? "").trim(),
    ]),
  ) as QcHardwareUploadValues;

const extractSectionScalar = (sectionData: unknown, fieldId: string): string => {
  if (!Array.isArray(sectionData)) return "";
  for (const item of sectionData) {
    const rec = asRecord(item);
    if (!rec || !(fieldId in rec)) continue;
    return String(rec[fieldId] ?? "").trim();
  }
  return "";
};

const buildUploadSectionPayload = (
  uploads: QcHardwareUploadValues,
): Record<string, string> => {
  const sanitized = sanitizeHardwareUploadValues(uploads);
  return Object.fromEntries(
    QC_HARDWARE_UPLOAD_TYPES.filter((uploadType) => hasValue(sanitized[uploadType])).map(
      (uploadType) => [uploadType, sanitized[uploadType]],
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
    [QC_HARDWARE_UPLOAD_REPORT_KEY]: "",
    [QC_HARDWARE_UPLOAD_GRAPH_KEY]: "",
    [QC_HARDWARE_UPLOAD_PHOTO_KEY]: "",
  };
  if (!normalizedMotorId) return merged;

  for (const entry of hardwareEntries) {
    if (String(entry.motorId ?? "").trim() !== normalizedMotorId) continue;
    const uploads = getHardwareUploadValues(valuesByEntryId[entry.entryId]?.schemaValues);
    for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
      if (!hasValue(merged[uploadType]) && hasValue(uploads[uploadType])) {
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
      uploads[uploadType] =
        extractSectionScalar(attachmentSection.sectionData, uploadType) ||
        String(nestedRecord?.[uploadType] ?? "").trim();
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
      if (uploads[uploadType]) continue;
      uploads[uploadType] =
        extractSectionScalar(section.sectionData, uploadType) ||
        String(nestedRecord?.[uploadType] ?? "").trim();
    }
  }

  for (const legacySubType of LEGACY_HARDWARE_UPLOAD_SUB_TYPES) {
    const sectionId = QC_HARDWARE_SECTION_IDS[legacySubType];
    const section = (sections ?? []).find(
      (entry) => String(entry.sectionId ?? "").trim() === sectionId,
    );
    if (!section) continue;
    for (const uploadType of QC_HARDWARE_UPLOAD_TYPES) {
      if (uploads[uploadType]) continue;
      uploads[uploadType] = extractSectionScalar(section.sectionData, uploadType);
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

export const listHardwareProcessSubTypes = (): QcHardwareProcessSubType[] =>
  QC_HARDWARE_PROCESS_OPTIONS.map((option) => option.value);

export { getQcHardwareProcessLabel, isQcHardwareProcessSubType };
