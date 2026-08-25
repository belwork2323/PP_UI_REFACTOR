import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import type { QcApiSubType, QcInhibitorType } from "../../../schema-engine/adapters/qc.adapter";
import { isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileRef } from "../../../data/models/common/FileUploadModel";
import { formatToIsoDateInput, formatToUiDate } from "../../../utils/dateUtils";
import {
  QC_POST_CURE_FIELD_LABELS,
  QC_POST_CURE_HE_NE_PRESET,
  QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
  QC_POST_CURE_IR1_QUALIFICATION_PRESET,
  QC_POST_CURE_LF_QUALIFICATION_PRESET,
  QC_POST_CURE_OPERATION_INHIBITION,
  QC_POST_CURE_OPERATION_LOOSE_FLAP,
  QC_POST_CURE_SECTION_IDS,
  QC_POST_CURE_SUB_TYPE_INHIBITION,
  QC_POST_CURE_SUB_TYPE_LOOSE_FLAP,
  QC_POST_CURE_TABLE_IDS,
  type QcPostCureLocationRow,
  type QcPostCureQualificationRow,
} from "./qcPostCureConfig";

export type QcPostCureMotorSubmissionType = "DRAFT" | "SUBMIT";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

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

/** Preserve spaces while typing; only used for free-text table cells. */
const pickEditableString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const value = String(candidate);
    if (value.toLowerCase() === "null") continue;
    return value;
  }
  return "";
};

const normalizeLocationKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

const locationsMatch = (a: unknown, b: unknown) => {
  const left = normalizeLocationKey(a);
  const right = normalizeLocationKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
};

const parametersMatch = (a: unknown, b: unknown) => {
  const left = normalizeLocationKey(a);
  const right = normalizeLocationKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
};

const pickSrNo = (row: Record<string, unknown> | null | undefined) => {
  const raw = row?.SR_NO ?? row?.srNo ?? row?.SrNo;
  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? asNumber : null;
};

const emptyLocationRows = (withQty?: "QTY_FILLED" | "QTY_APPLIED"): QcPostCureLocationRow[] =>
  QC_POST_CURE_HE_NE_PRESET.map((row) => ({
    SR_NO: row.SR_NO,
    LOCATION: row.LOCATION,
    FROM_DATE: "",
    TO_DATE: "",
    OBSERVATIONS: "",
    ...(withQty === "QTY_FILLED" ? { QTY_FILLED: "" } : null),
    ...(withQty === "QTY_APPLIED" ? { QTY_APPLIED: "" } : null),
  }));

const emptyQualificationRows = (
  preset: Array<Pick<QcPostCureQualificationRow, "SR_NO" | "PARAMETER" | "SPECIFICATION">>,
  withQcReport = false,
): QcPostCureQualificationRow[] =>
  preset.map((row) => ({
    SR_NO: row.SR_NO,
    PARAMETER: row.PARAMETER,
    SPECIFICATION: row.SPECIFICATION,
    RESULT: "",
    ...(withQcReport ? { QC_REPORT: [] as FileRef[] } : null),
  }));

const normalizeLocationRows = (
  value: unknown,
  withQty?: "QTY_FILLED" | "QTY_APPLIED",
): QcPostCureLocationRow[] => {
  const defaults = emptyLocationRows(withQty);
  const rows = asArray(value);
  if (!rows.length) return defaults;
  return defaults.map((fallback, index) => {
    const row =
      asRecord(rows[index]) ??
      asRecord(
        rows.find((item) => {
          const rec = asRecord(item);
          if (!rec) return false;
          const srNo = pickSrNo(rec);
          return (
            srNo === fallback.SR_NO ||
            locationsMatch(rec.LOCATION ?? rec.location, fallback.LOCATION)
          );
        }),
      );
    return {
      SR_NO: fallback.SR_NO,
      LOCATION: fallback.LOCATION,
      FROM_DATE: formatToUiDate(pickString(row?.FROM_DATE, row?.fromDate)),
      TO_DATE: formatToUiDate(pickString(row?.TO_DATE, row?.toDate)),
      OBSERVATIONS: pickEditableString(row?.OBSERVATIONS, row?.observations),
      ...(withQty === "QTY_FILLED"
        ? {
            QTY_FILLED: pickString(
              row?.QTY_FILLED,
              row?.qtyFilled,
              row?.QTY,
              typeof row?.qtyFilled === "number" ? String(row.qtyFilled) : "",
            ),
          }
        : null),
      ...(withQty === "QTY_APPLIED"
        ? {
            QTY_APPLIED: pickString(
              row?.QTY_APPLIED,
              row?.qtyApplied,
              row?.QTY,
              typeof row?.qtyApplied === "number" ? String(row.qtyApplied) : "",
            ),
          }
        : null),
    };
  });
};

const normalizeQualificationRows = (
  value: unknown,
  preset: Array<Pick<QcPostCureQualificationRow, "SR_NO" | "PARAMETER" | "SPECIFICATION">>,
  withQcReport = false,
): QcPostCureQualificationRow[] => {
  const defaults = emptyQualificationRows(preset, withQcReport);
  const rows = asArray(value);
  if (!rows.length) return defaults;
  return defaults.map((fallback, index) => {
    const row =
      asRecord(rows[index]) ??
      asRecord(
        rows.find((item) => {
          const rec = asRecord(item);
          if (!rec) return false;
          const srNo = pickSrNo(rec);
          return (
            srNo === fallback.SR_NO ||
            parametersMatch(rec.PARAMETER ?? rec.parameter, fallback.PARAMETER)
          );
        }),
      );
    return {
      SR_NO: fallback.SR_NO,
      PARAMETER: fallback.PARAMETER,
      SPECIFICATION: fallback.SPECIFICATION,
      RESULT: pickEditableString(row?.RESULT, row?.result),
      ...(withQcReport
        ? { QC_REPORT: parseUploadFiles(row?.QC_REPORT, row?.qcReport) }
        : null),
    };
  });
};

/** True when Post Cure form values contain user/API data beyond presets. */
export const postCureFormValuesHaveUserData = (values: SchemaFormValues | null | undefined) => {
  if (!values) return false;
  return Object.values(values).some((value) => {
    if (value == null || value === "") return false;
    if (!Array.isArray(value)) return String(value).trim().length > 0;
    return value.some((row) => {
      if (!row || typeof row !== "object") return false;
      return Object.entries(row as Record<string, unknown>).some(([field, fieldValue]) => {
        if (
          field === "SR_NO" ||
          field === "LOCATION" ||
          field === "PARAMETER" ||
          field === "SPECIFICATION"
        ) {
          return false;
        }
        return String(fieldValue ?? "").trim().length > 0;
      });
    });
  });
};

export const createInitialLooseFlapValues = (): SchemaFormValues => {
  const section = QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING;
  return {
    [formKey(section, QC_POST_CURE_TABLE_IDS.BELLOW_BONDING)]: emptyLocationRows(),
    [formKey(section, "LF_EPOXY_BATCH_NO")]: "",
    [formKey(section, "LF_EPOXY_PREPARATION_DATE")]: "",
    [formKey(section, QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION)]: emptyQualificationRows(
      QC_POST_CURE_LF_QUALIFICATION_PRESET,
    ),
    [formKey(section, "LF_EPOXY_QC_REPORT")]: [] as FileRef[],
    [formKey(section, QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING)]: emptyLocationRows("QTY_FILLED"),
  };
};

export const createInitialIr1Values = (): SchemaFormValues => {
  const qual = QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION;
  const app = QC_POST_CURE_SECTION_IDS.APPLICATION;
  return {
    [formKey(qual, "IR1_BATCH_NO")]: "",
    [formKey(qual, "IR1_PREPARATION_DATE")]: "",
    [formKey(qual, QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION)]: emptyQualificationRows(
      QC_POST_CURE_IR1_QUALIFICATION_PRESET,
    ),
    [formKey(qual, "IR1_QC_REPORT")]: [] as FileRef[],
    [formKey(app, QC_POST_CURE_TABLE_IDS.APPLICATION)]: emptyLocationRows("QTY_APPLIED"),
    [formKey(app, "DISPATCH_DATE")]: "",
    [formKey(app, "DISPATCH_STATION")]: "",
  };
};

export const createInitialHemcoatValues = (): SchemaFormValues => {
  const qual = QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION;
  const app = QC_POST_CURE_SECTION_IDS.APPLICATION;
  return {
    [formKey(qual, "HEMCOAT_3K_BATCH_NO")]: "",
    [formKey(qual, "HEMCOAT_3K_PREPARATION_DATE")]: "",
    [formKey(qual, QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION)]: emptyQualificationRows(
      QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
      true,
    ),
    [formKey(app, QC_POST_CURE_TABLE_IDS.APPLICATION)]: emptyLocationRows("QTY_APPLIED"),
    [formKey(app, "DISPATCH_DATE")]: "",
    [formKey(app, "DISPATCH_STATION")]: "",
  };
};

export const createInitialNotApplicableValues = (): SchemaFormValues => {
  const section = QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE;
  return {
    [formKey(section, "DISPATCH_DATE")]: "",
    [formKey(section, "DISPATCH_STATION")]: "",
    [formKey(section, "REMARKS")]: "",
  };
};

export const createInitialPostCureValues = (
  subType?: string | null,
  inhibitorType?: string | null,
): SchemaFormValues => {
  if (subType === QC_POST_CURE_SUB_TYPE_LOOSE_FLAP) return createInitialLooseFlapValues();
  if (subType === QC_POST_CURE_SUB_TYPE_INHIBITION) {
    if (inhibitorType === "IR1") return createInitialIr1Values();
    if (inhibitorType === "HEMCOAT-3K") return createInitialHemcoatValues();
    if (inhibitorType === "NOT_APPLICABLE") return createInitialNotApplicableValues();
  }
  return {};
};

export const getPostCureField = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  field: string,
) => String(values?.[formKey(sectionId, field)] ?? "");

export const setPostCureField = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  field: string,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(sectionId, field)]: value,
});

export const getPostCureFileField = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  field: string,
): FileRef[] => parseUploadFiles(values?.[formKey(sectionId, field)]);

export const setPostCureFileField = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  field: string,
  files: FileRef[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(sectionId, field)]: files ?? [],
});

export const getPostCureLocationRows = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  tableId: string,
  withQty?: "QTY_FILLED" | "QTY_APPLIED",
) => normalizeLocationRows(values?.[formKey(sectionId, tableId)], withQty);

export const setPostCureLocationRows = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  tableId: string,
  rows: QcPostCureLocationRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(sectionId, tableId)]: rows,
});

export const getPostCureQualificationRows = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  tableId: string,
  preset: Array<Pick<QcPostCureQualificationRow, "SR_NO" | "PARAMETER" | "SPECIFICATION">>,
  withQcReport = false,
) => normalizeQualificationRows(values?.[formKey(sectionId, tableId)], preset, withQcReport);

export const setPostCureQualificationRows = (
  values: SchemaFormValues | null | undefined,
  sectionId: string,
  tableId: string,
  rows: QcPostCureQualificationRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(sectionId, tableId)]: rows,
});

const mergeSectionRowIntoValues = (
  values: SchemaFormValues,
  sectionId: string,
  data: Record<string, unknown>,
) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value == null) return;
    values[formKey(sectionId, key)] = value as SchemaFormValues[string];
  });
};

/** Map legacy combined batch/date fields into split Batch No + Date fields when needed. */
const splitBatchPreparation = (raw: string): { batchNo: string; preparationDate: string } => {
  const text = String(raw ?? "").trim();
  if (!text) return { batchNo: "", preparationDate: "" };
  const dateMatch = text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})/);
  if (!dateMatch || dateMatch.index == null) return { batchNo: text, preparationDate: "" };
  const preparationDate = dateMatch[1];
  const batchNo = `${text.slice(0, dateMatch.index)} ${text.slice(dateMatch.index + preparationDate.length)}`
    .replace(/[|/,\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { batchNo, preparationDate };
};

const hydrateLooseFlapFromData = (
  values: SchemaFormValues,
  data: Record<string, unknown>,
  options?: { replaceAll?: boolean },
) => {
  const section = QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING;
  const replaceAll = options?.replaceAll === true;
  const nestedQual = asRecord(data.qualificationDetails);

  const bellow =
    data[QC_POST_CURE_TABLE_IDS.BELLOW_BONDING] ??
    data.BELLOW_REMOVAL_TABLE ??
    data.BELLOW_REMOVAL_DETAILS ??
    data.bellowBondingDetails ??
    data.bellowRemovalTable;
  if (bellow != null || replaceAll) {
    values[formKey(section, QC_POST_CURE_TABLE_IDS.BELLOW_BONDING)] = normalizeLocationRows(bellow);
  }

  let batchNo = pickString(
    data.LF_EPOXY_BATCH_NO,
    data.QUALIFICATION_BATCH_NO,
    data.lfEpoxyBatchNo,
    data.batchNo,
    nestedQual?.batchNo,
    nestedQual?.LF_EPOXY_BATCH_NO,
  );
  let prepDate = formatToUiDate(
    pickString(
      data.LF_EPOXY_PREPARATION_DATE,
      data.QUALIFICATION_PREPARATION_DATE,
      data.lfEpoxyPreparationDate,
      data.preparationDate,
      nestedQual?.preparationDate,
      nestedQual?.LF_EPOXY_PREPARATION_DATE,
    ),
  );
  if (!batchNo && !prepDate) {
    const split = splitBatchPreparation(
      pickString(data.LF_EPOXY_BATCH_PREPARATION, data.BATCH_NO_WITH_DATE, data.batchNoWithDate),
    );
    batchNo = split.batchNo;
    prepDate = formatToUiDate(split.preparationDate);
  }
  if (batchNo || replaceAll) {
    values[formKey(section, "LF_EPOXY_BATCH_NO")] = batchNo;
  }
  if (prepDate || replaceAll) {
    values[formKey(section, "LF_EPOXY_PREPARATION_DATE")] = prepDate;
  }

  const qualification =
    data[QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION] ??
    data.QUALIFICATION_TABLE ??
    data.lfEpoxyQualification ??
    (asArray(data.qualificationDetails).length > 0 ? data.qualificationDetails : null) ??
    nestedQual?.qualification ??
    nestedQual?.QUALIFICATION_TABLE ??
    data.qualification;
  if (qualification != null || replaceAll) {
    values[formKey(section, QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION)] =
      normalizeQualificationRows(qualification, QC_POST_CURE_LF_QUALIFICATION_PRESET);
  }

  const qcReport = parseUploadFiles(
    data.LF_EPOXY_QC_REPORT,
    data.QUALIFICATION_QC_REPORT,
    data.lfEpoxyQcReport,
    data.QC_REPORT,
    data.qcReport,
    nestedQual?.qcReport,
    nestedQual?.LF_EPOXY_QC_REPORT,
  );
  if (qcReport.length || replaceAll) {
    values[formKey(section, "LF_EPOXY_QC_REPORT")] = qcReport;
  }

  const filling =
    data[QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING] ??
    data.LF_FILLING_TABLE ??
    data.lfEpoxyFillingDetails ??
    data.fillingDetails;
  if (filling != null || replaceAll) {
    values[formKey(section, QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING)] = normalizeLocationRows(
      filling,
      "QTY_FILLED",
    );
  }
};

const hydrateIr1FromData = (values: SchemaFormValues, data: Record<string, unknown>) => {
  const qual = QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION;
  const nestedQual = asRecord(data.qualificationDetails) ?? {};
  let batchNo = pickString(
    data.IR1_BATCH_NO,
    data.QUALIFICATION_BATCH_NO,
    data.IR1_FINAL_MIX_BATCH_NO,
    data.ir1BatchNo,
    data.batchNo,
    nestedQual.batchNo,
    nestedQual.IR1_BATCH_NO,
  );
  let prepDate = formatToUiDate(
    pickString(
      data.IR1_PREPARATION_DATE,
      data.QUALIFICATION_PREPARATION_DATE,
      data.IR1_FINAL_MIX_DATE,
      data.ir1PreparationDate,
      data.preparationDate,
      nestedQual.preparationDate,
      nestedQual.IR1_PREPARATION_DATE,
    ),
  );
  if (!batchNo && !prepDate) {
    const split = splitBatchPreparation(
      pickString(data.IR1_BATCH_PREPARATION, data.BATCH_NO_WITH_DATE, data.batchNoWithDate),
    );
    batchNo = split.batchNo;
    prepDate = formatToUiDate(split.preparationDate);
  }
  values[formKey(qual, "IR1_BATCH_NO")] = batchNo;
  values[formKey(qual, "IR1_PREPARATION_DATE")] = prepDate;
  values[formKey(qual, QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION)] = normalizeQualificationRows(
    data[QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION] ??
      data.QUALIFICATION_TABLE ??
      data.ir1Qualification ??
      nestedQual.qualification ??
      nestedQual.IR1_QUALIFICATION ??
      nestedQual.qualificationDetails,
    QC_POST_CURE_IR1_QUALIFICATION_PRESET,
  );
  values[formKey(qual, "IR1_QC_REPORT")] = parseUploadFiles(
    data.IR1_QC_REPORT,
    data.QUALIFICATION_QC_REPORT,
    data.ir1QcReport,
    data.QC_REPORT,
    data.qcReport,
    nestedQual.qcReport,
    nestedQual.IR1_QC_REPORT,
  );
};

const hydrateHemcoatFromData = (values: SchemaFormValues, data: Record<string, unknown>) => {
  const qual = QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION;
  const nestedQual = asRecord(data.qualificationDetails) ?? {};
  let batchNo = pickString(
    data.HEMCOAT_3K_BATCH_NO,
    data.QUALIFICATION_BATCH_NO,
    data.HEMCOAT_FINAL_MIX_BATCH_NO,
    data.hemcoat3kBatchNo,
    data.batchNo,
    nestedQual.batchNo,
    nestedQual.HEMCOAT_3K_BATCH_NO,
  );
  let prepDate = formatToUiDate(
    pickString(
      data.HEMCOAT_3K_PREPARATION_DATE,
      data.QUALIFICATION_PREPARATION_DATE,
      data.HEMCOAT_FINAL_MIX_DATE,
      data.hemcoat3kPreparationDate,
      data.preparationDate,
      nestedQual.preparationDate,
      nestedQual.HEMCOAT_3K_PREPARATION_DATE,
    ),
  );
  if (!batchNo && !prepDate) {
    const split = splitBatchPreparation(
      pickString(
        data.HEMCOAT_3K_BATCH_PREPARATION,
        data.hemcoat3kBatchPreparation,
        data.BATCH_NO_WITH_DATE,
      ),
    );
    batchNo = split.batchNo;
    prepDate = formatToUiDate(split.preparationDate);
  }
  if (batchNo) values[formKey(qual, "HEMCOAT_3K_BATCH_NO")] = batchNo;
  if (prepDate) values[formKey(qual, "HEMCOAT_3K_PREPARATION_DATE")] = prepDate;

  const qualRows = normalizeQualificationRows(
    data[QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION] ??
      data.QUALIFICATION_TABLE ??
      data.hemcoatQualification ??
      nestedQual.qualification ??
      nestedQual.HEMCOAT_3K_QUALIFICATION,
    QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
    true,
  );
  const sharedReport = parseUploadFiles(
    data.QUALIFICATION_QC_REPORT,
    data.QC_REPORT,
    data.qcReport,
    nestedQual.qcReport,
  );
  values[formKey(qual, QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION)] = sharedReport.length
    ? qualRows.map((row, index) =>
        index === 0
          ? {
              ...row,
              QC_REPORT:
                Array.isArray(row.QC_REPORT) && row.QC_REPORT.length
                  ? row.QC_REPORT
                  : sharedReport,
            }
          : row,
      )
    : qualRows;
};

const hydrateApplicationFromData = (values: SchemaFormValues, data: Record<string, unknown>) => {
  const app = QC_POST_CURE_SECTION_IDS.APPLICATION;
  values[formKey(app, QC_POST_CURE_TABLE_IDS.APPLICATION)] = normalizeLocationRows(
    data[QC_POST_CURE_TABLE_IDS.APPLICATION] ??
      data.INHIBITION_APPLICATION_TABLE ??
      data.inhibitionApplicationDetails ??
      data.applicationDetails,
    "QTY_APPLIED",
  );

  let dispatchDate = formatToUiDate(pickString(data.DISPATCH_DATE, data.dispatchDate));
  let dispatchStation = pickString(data.DISPATCH_STATION, data.dispatchStation);
  if (!dispatchDate || !dispatchStation) {
    const combined = pickString(data.DISPATCH_DATE_STATION, data.dispatchDateStation);
    if (combined) {
      const dateMatch = combined.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch.index != null) {
        if (!dispatchDate) dispatchDate = formatToUiDate(dateMatch[1]);
        if (!dispatchStation) {
          dispatchStation = `${combined.slice(0, dateMatch.index)} ${combined.slice(
            dateMatch.index + dateMatch[1].length,
          )}`
            .replace(/[|/,\-–—]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } else if (!dispatchStation) {
        dispatchStation = combined;
      }
    }
  }
  if (dispatchDate) values[formKey(app, "DISPATCH_DATE")] = dispatchDate;
  if (dispatchStation) values[formKey(app, "DISPATCH_STATION")] = dispatchStation;
};

const hydrateNotApplicableFromData = (values: SchemaFormValues, data: Record<string, unknown>) => {
  const section = QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE;
  values[formKey(section, "DISPATCH_DATE")] = formatToUiDate(
    pickString(data.DISPATCH_DATE, data.dispatchDate),
  );
  values[formKey(section, "DISPATCH_STATION")] = pickString(
    data.DISPATCH_STATION,
    data.dispatchStation,
  );
  values[formKey(section, "REMARKS")] = pickString(data.REMARKS, data.remarks);
};

const isLooseFlapManufacturingSection = (sectionId: string) =>
  [
    "BELLOW_REMOVAL_DETAILS",
    "LOOSE_FLAP_EPOXY_PREPARATION",
    "QUALIFICATION_DETAILS",
    "LF_EPOXY_FILLING_DETAILS",
    QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING,
  ].includes(sectionId);

export const hydratePostCureValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
  subType?: string | null,
  inhibitorType?: string | null,
): SchemaFormValues => {
  const values = createInitialPostCureValues(subType, inhibitorType);
  const resolvedSubType = String(subType ?? "").trim().toUpperCase();
  const resolvedInhibitor = String(inhibitorType ?? "").trim().toUpperCase();

  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;

    // Manufacturing Loose Flap sections (split across multiple sectionIds).
    if (
      resolvedSubType === QC_POST_CURE_SUB_TYPE_LOOSE_FLAP ||
      isLooseFlapManufacturingSection(sectionId)
    ) {
      if (sectionId === "BELLOW_REMOVAL_DETAILS" || data.BELLOW_REMOVAL_TABLE != null) {
        hydrateLooseFlapFromData(values, {
          BELLOW_REMOVAL_TABLE: data.BELLOW_REMOVAL_TABLE ?? data.BELLOW_BONDING_DETAILS,
        });
        continue;
      }
      if (sectionId === "QUALIFICATION_DETAILS" || data.QUALIFICATION_TABLE != null) {
        hydrateLooseFlapFromData(values, data);
        // For inhibition, QUALIFICATION_DETAILS maps to inhibitor qualification instead.
        if (resolvedSubType === QC_POST_CURE_SUB_TYPE_INHIBITION) {
          if (resolvedInhibitor === "IR1") hydrateIr1FromData(values, data);
          else if (resolvedInhibitor === "HEMCOAT-3K") hydrateHemcoatFromData(values, data);
        }
        continue;
      }
      if (
        sectionId === "LF_EPOXY_FILLING_DETAILS" ||
        data.LF_FILLING_TABLE != null ||
        data.LF_EPOXY_FILLING_DETAILS != null
      ) {
        hydrateLooseFlapFromData(values, {
          LF_FILLING_TABLE:
            data.LF_FILLING_TABLE ??
            data.LF_EPOXY_FILLING_DETAILS ??
            data[QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING],
        });
        continue;
      }
      if (sectionId === QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING) {
        hydrateLooseFlapFromData(values, data, { replaceAll: true });
        continue;
      }
    }

    if (
      sectionId === QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION ||
      sectionId === "IR1_QUALIFICATION" ||
      data.IR1_BATCH_NO != null
    ) {
      hydrateIr1FromData(values, data);
      continue;
    }

    if (
      sectionId === QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION ||
      sectionId === "HEMCOAT_3K_QUALIFICATION" ||
      data.HEMCOAT_3K_BATCH_NO != null ||
      data.HEMCOAT_3K_BATCH_PREPARATION != null
    ) {
      hydrateHemcoatFromData(values, data);
      continue;
    }

    if (
      sectionId === QC_POST_CURE_SECTION_IDS.APPLICATION ||
      sectionId === "INHIBITION_APPLICATION_DETAILS" ||
      data.INHIBITION_APPLICATION_TABLE != null
    ) {
      hydrateApplicationFromData(values, data);
      continue;
    }

    if (sectionId === "DISPATCH_DETAILS") {
      if (resolvedInhibitor === "NOT_APPLICABLE") {
        hydrateNotApplicableFromData(values, data);
      } else {
        hydrateApplicationFromData(values, data);
      }
      continue;
    }

    if (
      sectionId === QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE ||
      sectionId === "INHIBITION_NOT_APPLICABLE"
    ) {
      hydrateNotApplicableFromData(values, data);
      continue;
    }

    // Fallback: merge raw keys into the matching section scope.
    mergeSectionRowIntoValues(values, sectionId, data);
  }

  return values;
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const toApiDate = (value: string) => formatToIsoDateInput(value) || undefined;

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const mapLocationRowsForApi = (
  rows: QcPostCureLocationRow[],
  withQty?: "QTY_FILLED" | "QTY_APPLIED",
) =>
  rows.map((row) =>
    omitEmpty({
      srNo: row.SR_NO,
      location: row.LOCATION || undefined,
      fromDate: toApiDate(String(row.FROM_DATE ?? "")),
      toDate: toApiDate(String(row.TO_DATE ?? "")),
      ...(withQty === "QTY_FILLED"
        ? {
            qtyFilled:
              toFiniteNumber(row.QTY_FILLED) ??
              (String(row.QTY_FILLED ?? "").trim() || undefined),
          }
        : null),
      ...(withQty === "QTY_APPLIED"
        ? {
            qtyApplied:
              toFiniteNumber(row.QTY_APPLIED) ??
              (String(row.QTY_APPLIED ?? "").trim() || undefined),
          }
        : null),
      observations: String(row.OBSERVATIONS ?? "").trim() || undefined,
    }),
  );

const mapQualificationRowsForApi = (rows: QcPostCureQualificationRow[], withQcReport = false) =>
  rows.map((row) => {
    const reportPayload = withQcReport ? toFileIdListPayload(row.QC_REPORT) : [];
    return omitEmpty({
      srNo: row.SR_NO,
      parameter: row.PARAMETER || undefined,
      specification: row.SPECIFICATION || undefined,
      result: String(row.RESULT ?? "").trim() || undefined,
      ...(withQcReport && reportPayload.length ? { qcReport: reportPayload } : null),
    });
  });

const mapLocationRowsFromApi = (
  value: unknown,
  withQty?: "QTY_FILLED" | "QTY_APPLIED",
): unknown[] =>
  asArray(value).map((item, index) => {
    const row = asRecord(item) ?? {};
    return {
      SR_NO: Number(row.srNo ?? row.SR_NO) || index + 1,
      LOCATION: pickString(row.location, row.LOCATION),
      FROM_DATE:
        formatToUiDate(String(row.fromDate ?? row.FROM_DATE ?? "")) ||
        pickString(row.fromDate, row.FROM_DATE),
      TO_DATE:
        formatToUiDate(String(row.toDate ?? row.TO_DATE ?? "")) ||
        pickString(row.toDate, row.TO_DATE),
      OBSERVATIONS: pickEditableString(row.observations, row.OBSERVATIONS),
      ...(withQty === "QTY_FILLED"
        ? { QTY_FILLED: pickString(row.qtyFilled, row.QTY_FILLED, row.QTY) }
        : null),
      ...(withQty === "QTY_APPLIED"
        ? { QTY_APPLIED: pickString(row.qtyApplied, row.QTY_APPLIED, row.QTY) }
        : null),
    };
  });

const mapQualificationRowsFromApi = (value: unknown, withQcReport = false): unknown[] =>
  asArray(value).map((item, index) => {
    const row = asRecord(item) ?? {};
    return {
      SR_NO: Number(row.srNo ?? row.SR_NO) || index + 1,
      PARAMETER: pickString(row.parameter, row.PARAMETER),
      SPECIFICATION: pickString(row.specification, row.SPECIFICATION),
      RESULT: pickEditableString(row.result, row.RESULT),
      ...(withQcReport
        ? { QC_REPORT: parseUploadFiles(row.qcReport, row.QC_REPORT) }
        : null),
    };
  });

const buildLooseFlapFillingDetailsPayload = (
  values: SchemaFormValues | null | undefined,
): Record<string, unknown> => {
  const section = QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING;
  const bellowRows = getPostCureLocationRows(values, section, QC_POST_CURE_TABLE_IDS.BELLOW_BONDING);
  const qualRows = getPostCureQualificationRows(
    values,
    section,
    QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION,
    QC_POST_CURE_LF_QUALIFICATION_PRESET,
  );
  const fillingRows = getPostCureLocationRows(
    values,
    section,
    QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING,
    "QTY_FILLED",
  );

  return omitEmpty({
    bellowRemovalDetails: mapLocationRowsForApi(bellowRows),
    epoxyPreparationIngredients: omitEmpty({
      batchNo: getPostCureField(values, section, "LF_EPOXY_BATCH_NO") || undefined,
      preparationDate: toApiDate(getPostCureField(values, section, "LF_EPOXY_PREPARATION_DATE")),
    }),
    qualificationDetails: omitEmpty({
      batchNo: getPostCureField(values, section, "LF_EPOXY_BATCH_NO") || undefined,
      preparationDate: toApiDate(getPostCureField(values, section, "LF_EPOXY_PREPARATION_DATE")),
      parameters: mapQualificationRowsForApi(qualRows),
      qcReport: (() => {
        const files = toFileIdListPayload(
          getPostCureFileField(values, section, "LF_EPOXY_QC_REPORT"),
        );
        return files.length ? files : undefined;
      })(),
    }),
    fillingDetails: mapLocationRowsForApi(fillingRows, "QTY_FILLED"),
  });
};

const buildInhibitionDetailsPayload = (
  values: SchemaFormValues | null | undefined,
  inhibitorType: string,
): Record<string, unknown> => {
  const app = QC_POST_CURE_SECTION_IDS.APPLICATION;
  const resolvedInhibitor = String(inhibitorType ?? "").trim().toUpperCase();

  if (resolvedInhibitor === "NOT_APPLICABLE") {
    const section = QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE;
    return {
      inhibitorType: "NOT_APPLICABLE",
      qualificationDetails: {},
      applicationDetails: [],
      ...omitEmpty({
        dispatchDate: toApiDate(getPostCureField(values, section, "DISPATCH_DATE")),
        dispatchStation: getPostCureField(values, section, "DISPATCH_STATION") || undefined,
        remarks: getPostCureField(values, section, "REMARKS") || undefined,
      }),
    };
  }

  if (resolvedInhibitor === "HEMCOAT-3K") {
    const qual = QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION;
    const qualRows = getPostCureQualificationRows(
      values,
      qual,
      QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION,
      QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
      true,
    );
    const applicationRows = getPostCureLocationRows(
      values,
      app,
      QC_POST_CURE_TABLE_IDS.APPLICATION,
      "QTY_APPLIED",
    );
    return {
      inhibitorType: "HEMCOAT-3K",
      qualificationDetails: omitEmpty({
        batchNo: getPostCureField(values, qual, "HEMCOAT_3K_BATCH_NO") || undefined,
        preparationDate: toApiDate(
          getPostCureField(values, qual, "HEMCOAT_3K_PREPARATION_DATE"),
        ),
        parameters: mapQualificationRowsForApi(qualRows, true),
        qcReport: (() => {
          const fromRows = toFileIdListPayload(qualRows[0]?.QC_REPORT);
          return fromRows.length ? fromRows : undefined;
        })(),
      }),
      applicationDetails: mapLocationRowsForApi(applicationRows, "QTY_APPLIED"),
      ...omitEmpty({
        dispatchDate: toApiDate(getPostCureField(values, app, "DISPATCH_DATE")),
        dispatchStation: getPostCureField(values, app, "DISPATCH_STATION") || undefined,
      }),
    };
  }

  // Default IR1 (and any unknown inhibitor → IR1 shape with given type).
  const qual = QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION;
  const qualRows = getPostCureQualificationRows(
    values,
    qual,
    QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION,
    QC_POST_CURE_IR1_QUALIFICATION_PRESET,
  );
  const applicationRows = getPostCureLocationRows(
    values,
    app,
    QC_POST_CURE_TABLE_IDS.APPLICATION,
    "QTY_APPLIED",
  );
  const type = resolvedInhibitor || "IR1";
  return {
    inhibitorType: type,
    qualificationDetails: omitEmpty({
      batchNo: getPostCureField(values, qual, "IR1_BATCH_NO") || undefined,
      preparationDate: toApiDate(getPostCureField(values, qual, "IR1_PREPARATION_DATE")),
      parameters: mapQualificationRowsForApi(qualRows),
      qcReport: (() => {
        const files = toFileIdListPayload(
          getPostCureFileField(values, qual, "IR1_QC_REPORT"),
        );
        return files.length ? files : undefined;
      })(),
    }),
    applicationDetails: mapLocationRowsForApi(applicationRows, "QTY_APPLIED"),
    ...omitEmpty({
      dispatchDate: toApiDate(getPostCureField(values, app, "DISPATCH_DATE")),
      dispatchStation: getPostCureField(values, app, "DISPATCH_STATION") || undefined,
    }),
  };
};

/**
 * Nested Post Cure motor payload for create/update (`data.postCureMotorDetails[]`).
 */
export const buildPostCureMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcPostCureMotorSubmissionType = "DRAFT",
  subType?: string | null,
  inhibitorType?: string | null,
): Record<string, unknown> => {
  const resolvedSubType = String(subType ?? "").trim().toUpperCase();
  const resolvedInhibitor = String(inhibitorType ?? "").trim().toUpperCase();
  const operationType =
    resolvedSubType === QC_POST_CURE_SUB_TYPE_INHIBITION
      ? QC_POST_CURE_OPERATION_INHIBITION
      : QC_POST_CURE_OPERATION_LOOSE_FLAP;

  const base = omitEmpty({
    motorId,
    motorSubmissionType,
    operationType,
    ...(resolvedInhibitor ? { inhibitorType: resolvedInhibitor } : {}),
  });

  if (resolvedSubType === QC_POST_CURE_SUB_TYPE_LOOSE_FLAP) {
    return {
      ...base,
      looseFlapFillingDetails: buildLooseFlapFillingDetailsPayload(values),
    };
  }

  if (resolvedSubType === QC_POST_CURE_SUB_TYPE_INHIBITION) {
    return {
      ...base,
      inhibitionDetails: buildInhibitionDetailsPayload(values, resolvedInhibitor || "IR1"),
    };
  }

  return {
    ...base,
    looseFlapFillingDetails: buildLooseFlapFillingDetailsPayload(values),
  };
};

export const isPostCureNestedMotorDetail = (rec: Record<string, unknown>) => {
  if (asRecord(rec.looseFlapFillingDetails) || asRecord(rec.inhibitionDetails)) return true;
  const details = asRecord(rec.details);
  if (asRecord(details?.looseFlapFillingDetails) || asRecord(details?.inhibitionDetails)) {
    return true;
  }
  return false;
};

/** Flatten nested create/update post-cure motor into form sections for hydrate. */
export const postCureMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];
  const details = asRecord(rec.details) ?? {};
  const loose =
    asRecord(rec.looseFlapFillingDetails) ?? asRecord(details.looseFlapFillingDetails);
  const inhibition =
    asRecord(rec.inhibitionDetails) ?? asRecord(details.inhibitionDetails);

  if (loose) {
    const qualification =
      asArray(loose.qualificationDetails).length > 0
        ? loose.qualificationDetails
        : asArray(asRecord(loose.qualificationDetails)?.qualification).length
          ? asRecord(loose.qualificationDetails)?.qualification
          : loose.qualification ?? loose.lfEpoxyQualification;

    sections.push({
      sectionId: QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING,
      sectionData: [
        omitEmpty({
          [QC_POST_CURE_TABLE_IDS.BELLOW_BONDING]: mapLocationRowsFromApi(
            loose.bellowBondingDetails ?? loose.BELLOW_BONDING_DETAILS,
          ),
          LF_EPOXY_BATCH_NO: pickString(loose.batchNo, loose.lfEpoxyBatchNo, loose.LF_EPOXY_BATCH_NO),
          LF_EPOXY_PREPARATION_DATE: pickString(
            loose.preparationDate,
            loose.lfEpoxyPreparationDate,
            loose.LF_EPOXY_PREPARATION_DATE,
          ),
          [QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION]: mapQualificationRowsFromApi(qualification),
          LF_EPOXY_QC_REPORT: loose.qcReport ?? loose.lfEpoxyQcReport ?? loose.LF_EPOXY_QC_REPORT,
          [QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING]: mapLocationRowsFromApi(
            loose.fillingDetails ?? loose.lfEpoxyFillingDetails ?? loose.LF_EPOXY_FILLING_DETAILS,
            "QTY_FILLED",
          ),
        }),
      ],
      motorId,
      subType: QC_POST_CURE_SUB_TYPE_LOOSE_FLAP,
    } as SchemaSectionSubmission);
  }

  if (inhibition) {
    const inhibitor = pickString(inhibition.inhibitorType, rec.inhibitorType).toUpperCase();
    const qualDetails = asRecord(inhibition.qualificationDetails) ?? {};
    const applicationRows = mapLocationRowsFromApi(
      inhibition.applicationDetails ?? inhibition.INHIBITION_APPLICATION_DETAILS,
      "QTY_APPLIED",
    );

    if (inhibitor === "NOT_APPLICABLE") {
      sections.push({
        sectionId: QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE,
        sectionData: [
          omitEmpty({
            DISPATCH_DATE: pickString(
              inhibition.dispatchDate,
              qualDetails.dispatchDate,
              inhibition.DISPATCH_DATE,
            ),
            DISPATCH_STATION: pickString(
              inhibition.dispatchStation,
              qualDetails.dispatchStation,
              inhibition.DISPATCH_STATION,
            ),
            REMARKS: pickString(inhibition.remarks, qualDetails.remarks, inhibition.REMARKS),
          }),
        ],
        motorId,
        subType: QC_POST_CURE_SUB_TYPE_INHIBITION,
        inhibitorType: "NOT_APPLICABLE",
      } as SchemaSectionSubmission);
      return sections;
    }

    if (inhibitor === "HEMCOAT-3K") {
      sections.push({
        sectionId: QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION,
        sectionData: [
          omitEmpty({
            HEMCOAT_3K_BATCH_NO: pickString(
              qualDetails.batchNo,
              qualDetails.hemcoat3kBatchNo,
              qualDetails.HEMCOAT_3K_BATCH_NO,
            ),
            HEMCOAT_3K_PREPARATION_DATE: pickString(
              qualDetails.preparationDate,
              qualDetails.hemcoat3kPreparationDate,
              qualDetails.HEMCOAT_3K_PREPARATION_DATE,
            ),
            [QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION]: mapQualificationRowsFromApi(
              qualDetails.qualification ??
                qualDetails.hemcoat3kQualification ??
                qualDetails.HEMCOAT_3K_QUALIFICATION,
              true,
            ),
          }),
        ],
        motorId,
        subType: QC_POST_CURE_SUB_TYPE_INHIBITION,
        inhibitorType: "HEMCOAT-3K",
      } as SchemaSectionSubmission);
    } else {
      sections.push({
        sectionId: QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION,
        sectionData: [
          omitEmpty({
            IR1_BATCH_NO: pickString(
              qualDetails.batchNo,
              qualDetails.ir1BatchNo,
              qualDetails.IR1_BATCH_NO,
            ),
            IR1_PREPARATION_DATE: pickString(
              qualDetails.preparationDate,
              qualDetails.ir1PreparationDate,
              qualDetails.IR1_PREPARATION_DATE,
            ),
            [QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION]: mapQualificationRowsFromApi(
              qualDetails.qualification ??
                qualDetails.ir1Qualification ??
                qualDetails.IR1_QUALIFICATION,
            ),
            IR1_QC_REPORT:
              qualDetails.qcReport ?? qualDetails.ir1QcReport ?? qualDetails.IR1_QC_REPORT,
          }),
        ],
        motorId,
        subType: QC_POST_CURE_SUB_TYPE_INHIBITION,
        inhibitorType: (inhibitor || "IR1") as QcInhibitorType,
      } as SchemaSectionSubmission);
    }

    sections.push({
      sectionId: QC_POST_CURE_SECTION_IDS.APPLICATION,
      sectionData: [
        omitEmpty({
          [QC_POST_CURE_TABLE_IDS.APPLICATION]: applicationRows,
          DISPATCH_DATE: pickString(inhibition.dispatchDate, inhibition.DISPATCH_DATE),
          DISPATCH_STATION: pickString(inhibition.dispatchStation, inhibition.DISPATCH_STATION),
        }),
      ],
      motorId,
      subType: QC_POST_CURE_SUB_TYPE_INHIBITION,
      inhibitorType: (inhibitor || "IR1") as QcInhibitorType,
    } as SchemaSectionSubmission);
  }

  // Legacy motors[].sections still present on some responses.
  for (const section of [...asArray(rec.sections), ...asArray(details.sections)]) {
    const sec = asRecord(section);
    if (!sec) continue;
    sections.push({
      ...(sec as unknown as SchemaSectionSubmission),
      motorId,
    } as unknown as SchemaSectionSubmission);
  }

  return sections;
};

export const hydratePostCureValuesFromMotorDetail = (
  rec: Record<string, unknown>,
  subType?: string | null,
  inhibitorType?: string | null,
): SchemaFormValues => {
  const details = asRecord(rec.details) ?? {};
  const loose =
    asRecord(rec.looseFlapFillingDetails) ?? asRecord(details.looseFlapFillingDetails);
  const inhibition =
    asRecord(rec.inhibitionDetails) ?? asRecord(details.inhibitionDetails);
  const hasLoose = Boolean(loose && Object.keys(loose).length > 0);
  const hasInhibition = Boolean(inhibition && Object.keys(inhibition).length > 0);
  const resolvedInhibitor =
    String(inhibitorType ?? "").trim() ||
    pickString(inhibition?.inhibitorType, rec.inhibitorType);
  const resolvedSubType =
    String(subType ?? "").trim() ||
    (hasLoose
      ? QC_POST_CURE_SUB_TYPE_LOOSE_FLAP
      : hasInhibition
        ? QC_POST_CURE_SUB_TYPE_INHIBITION
        : "");

  if (hasLoose || hasInhibition) {
    const values = createInitialPostCureValues(resolvedSubType || null, resolvedInhibitor || null);
    if (hasLoose && loose) {
      hydrateLooseFlapFromData(values, loose, { replaceAll: true });
    }
    if (hasInhibition && inhibition) {
      const inhibitor = pickString(inhibition.inhibitorType, rec.inhibitorType).toUpperCase();
      if (inhibitor === "NOT_APPLICABLE") {
        hydrateNotApplicableFromData(values, inhibition);
      } else if (inhibitor === "HEMCOAT-3K") {
        hydrateHemcoatFromData(values, inhibition);
        hydrateApplicationFromData(values, inhibition);
      } else {
        hydrateIr1FromData(values, inhibition);
        hydrateApplicationFromData(values, inhibition);
      }
    }
    return values;
  }

  return hydratePostCureValuesFromSections(
    postCureMotorDetailToSections(rec, pickString(rec.motorIdNo, rec.motorId) || "MOTOR"),
    resolvedSubType || null,
    resolvedInhibitor || null,
  );
};

const buildLooseFlapSection = (values: SchemaFormValues | null | undefined): SchemaSectionSubmission => {
  const section = QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING;
  return {
    sectionId: section,
    sectionData: [
      omitEmpty({
        [QC_POST_CURE_TABLE_IDS.BELLOW_BONDING]: getPostCureLocationRows(
          values,
          section,
          QC_POST_CURE_TABLE_IDS.BELLOW_BONDING,
        ),
        LF_EPOXY_BATCH_NO: getPostCureField(values, section, "LF_EPOXY_BATCH_NO") || undefined,
        LF_EPOXY_PREPARATION_DATE:
          getPostCureField(values, section, "LF_EPOXY_PREPARATION_DATE") || undefined,
        [QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION]: getPostCureQualificationRows(
          values,
          section,
          QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION,
          QC_POST_CURE_LF_QUALIFICATION_PRESET,
        ),
        LF_EPOXY_QC_REPORT: (() => {
          const files = getPostCureFileField(values, section, "LF_EPOXY_QC_REPORT");
          return files.length ? files : undefined;
        })(),
        [QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING]: getPostCureLocationRows(
          values,
          section,
          QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING,
          "QTY_FILLED",
        ),
      }),
    ],
  };
};

const buildIr1Sections = (values: SchemaFormValues | null | undefined): SchemaSectionSubmission[] => {
  const qual = QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION;
  const app = QC_POST_CURE_SECTION_IDS.APPLICATION;
  return [
    {
      sectionId: qual,
      sectionData: [
        omitEmpty({
          IR1_BATCH_NO: getPostCureField(values, qual, "IR1_BATCH_NO") || undefined,
          IR1_PREPARATION_DATE: getPostCureField(values, qual, "IR1_PREPARATION_DATE") || undefined,
          [QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION]: getPostCureQualificationRows(
            values,
            qual,
            QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION,
            QC_POST_CURE_IR1_QUALIFICATION_PRESET,
          ),
          IR1_QC_REPORT: (() => {
            const files = getPostCureFileField(values, qual, "IR1_QC_REPORT");
            return files.length ? files : undefined;
          })(),
        }),
      ],
    },
    {
      sectionId: app,
      sectionData: [
        omitEmpty({
          [QC_POST_CURE_TABLE_IDS.APPLICATION]: getPostCureLocationRows(
            values,
            app,
            QC_POST_CURE_TABLE_IDS.APPLICATION,
            "QTY_APPLIED",
          ),
          DISPATCH_DATE: getPostCureField(values, app, "DISPATCH_DATE") || undefined,
          DISPATCH_STATION: getPostCureField(values, app, "DISPATCH_STATION") || undefined,
        }),
      ],
    },
  ];
};

const buildHemcoatSections = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] => {
  const qual = QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION;
  const app = QC_POST_CURE_SECTION_IDS.APPLICATION;
  return [
    {
      sectionId: qual,
      sectionData: [
        omitEmpty({
          HEMCOAT_3K_BATCH_NO: getPostCureField(values, qual, "HEMCOAT_3K_BATCH_NO") || undefined,
          HEMCOAT_3K_PREPARATION_DATE:
            getPostCureField(values, qual, "HEMCOAT_3K_PREPARATION_DATE") || undefined,
          [QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION]: getPostCureQualificationRows(
            values,
            qual,
            QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION,
            QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
            true,
          ),
        }),
      ],
    },
    {
      sectionId: app,
      sectionData: [
        omitEmpty({
          [QC_POST_CURE_TABLE_IDS.APPLICATION]: getPostCureLocationRows(
            values,
            app,
            QC_POST_CURE_TABLE_IDS.APPLICATION,
            "QTY_APPLIED",
          ),
          DISPATCH_DATE: getPostCureField(values, app, "DISPATCH_DATE") || undefined,
          DISPATCH_STATION: getPostCureField(values, app, "DISPATCH_STATION") || undefined,
        }),
      ],
    },
  ];
};

const buildNotApplicableSection = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission => {
  const section = QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE;
  return {
    sectionId: section,
    sectionData: [
      omitEmpty({
        DISPATCH_DATE: getPostCureField(values, section, "DISPATCH_DATE") || undefined,
        DISPATCH_STATION: getPostCureField(values, section, "DISPATCH_STATION") || undefined,
        REMARKS: getPostCureField(values, section, "REMARKS") || undefined,
      }),
    ],
  };
};

/**
 * Legacy section payload (internal hydrate / manufacturing seed).
 * Create/update uses {@link buildPostCureMotorDetailPayload} → `data.postCureMotorDetails[]`.
 */
export const buildPostCureSectionPayload = (
  values: SchemaFormValues | null | undefined,
  subType?: string | null,
  inhibitorType?: string | null,
  motorId?: string | null,
): SchemaSectionSubmission[] => {
  let sections: SchemaSectionSubmission[] = [];
  if (subType === QC_POST_CURE_SUB_TYPE_LOOSE_FLAP) {
    sections = [buildLooseFlapSection(values)];
  } else if (subType === QC_POST_CURE_SUB_TYPE_INHIBITION) {
    if (inhibitorType === "IR1") sections = buildIr1Sections(values);
    else if (inhibitorType === "HEMCOAT-3K") sections = buildHemcoatSections(values);
    else if (inhibitorType === "NOT_APPLICABLE") sections = [buildNotApplicableSection(values)];
  }

  const trimmedMotorId = String(motorId ?? "").trim();
  if (!trimmedMotorId) return sections;

  return sections.map((section) => ({
    ...section,
    motorId: trimmedMotorId,
    subType: (subType as QcApiSubType) ?? undefined,
    ...(inhibitorType ? { inhibitorType: inhibitorType as QcInhibitorType } : null),
  })) as SchemaSectionSubmission[];
};

export const collectPostCureFileRefsFromQcValues = (
  values: SchemaFormValues | null | undefined,
): FileRef[] => {
  if (!values) return [];
  const refs: FileRef[] = [];
  const loose = QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING;
  const ir1 = QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION;
  const hemcoat = QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION;
  refs.push(...getPostCureFileField(values, loose, "LF_EPOXY_QC_REPORT"));
  refs.push(...getPostCureFileField(values, ir1, "IR1_QC_REPORT"));
  for (const row of getPostCureQualificationRows(
    values,
    hemcoat,
    QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION,
    QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
    true,
  )) {
    refs.push(...parseUploadFiles(row.QC_REPORT));
  }
  return refs;
};

export const hasIncompleteQcPostCureUploads = (
  values: SchemaFormValues | null | undefined,
): boolean => collectPostCureFileRefsFromQcValues(values).some(isFileUploadIncomplete);

export const collectTempFileIdsFromQcPostCureValues = (
  values: SchemaFormValues | null | undefined,
): string[] =>
  [
    ...new Set(
      collectPostCureFileRefsFromQcValues(values)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

export const postCureFieldLabels = QC_POST_CURE_FIELD_LABELS;
