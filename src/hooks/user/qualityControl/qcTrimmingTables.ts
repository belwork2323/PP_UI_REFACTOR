import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import type {
  TrimmingCommonFormatParameter,
  TrimmingDetailsRow,
  TrimmingReportFile,
} from "../../../data/models/user/TrimmingFormModel";
import {
  isFileReady,
  isFileUploadIncomplete,
  parseFileRefs,
  toFileIdListPayload,
  type FileRef,
} from "../../../data/models/common/FileUploadModel";
import { formatToIsoDateInput, formatToUiDate } from "../../../utils/dateUtils";
import { QC_TRIMMING_SECTION_IDS } from "./qcTrimmingConfig";

export type QcTrimmingMotorSubmissionType = "DRAFT" | "SUBMIT";

/** Session shape stored in division entry `schemaValues` for QC Trimming. */
export type QcTrimmingSessionValues = {
  motorStage?: number | string;
  motorReceivedAt: string;
  trimmingDetails: TrimmingDetailsRow[];
  commonFormatParameters: TrimmingCommonFormatParameter[];
  commonFormatLocations: string[];
  motorRemarks: string;
  reportFiles: FileRef[];
  /** Legacy hydrate only. */
  reportFile?: TrimmingReportFile | null;
  /** Legacy hydrate only. */
  reportLink?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

/** Flatten manufacturing `motors[].details` (or QC flat unit) into one record. */
export const resolveTrimmingDetailSource = (
  rec: Record<string, unknown> | null | undefined,
): Record<string, unknown> => {
  if (!rec) return {};
  const details = asRecord(rec.details);
  return {
    ...rec,
    ...(details ?? {}),
  };
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== "" && value !== null),
  );

const createDefaultTrimmingDetailsRows = (): TrimmingDetailsRow[] => [
  {
    machineDetails: "",
    startDate: "",
    completionDate: "",
    arborSize: "",
    cutterSize: "",
    remarks: "",
  },
];

const createDefaultCommonFormatParameters = (): TrimmingCommonFormatParameter[] => [
  {
    parameterId: "PARAM-001",
    parameterName: "Parameter 1",
    stages: [
      {
        stageName: "Before Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
      {
        stageName: "After Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
    ],
  },
  {
    parameterId: "PARAM-002",
    parameterName: "Parameter 2",
    stages: [
      {
        stageName: "Before Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
      {
        stageName: "After Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
    ],
  },
];

export const createInitialTrimmingValues = (
  motorReceivedAt = "",
): SchemaFormValues =>
  ({
    motorStage: "",
    motorReceivedAt,
    trimmingDetails: createDefaultTrimmingDetailsRows(),
    commonFormatParameters: createDefaultCommonFormatParameters(),
    commonFormatLocations: [],
    motorRemarks: "",
    reportFiles: [],
  }) as SchemaFormValues;

export const getTrimmingSessionFromValues = (
  values: SchemaFormValues | null | undefined,
): QcTrimmingSessionValues => {
  const rec = (values ?? {}) as Record<string, unknown>;
  const details = asArray(rec.trimmingDetails)
    .map((row) => asRecord(row))
    .filter(Boolean) as unknown as TrimmingDetailsRow[];
  const params = asArray(rec.commonFormatParameters)
    .map((row) => asRecord(row))
    .filter(Boolean) as unknown as TrimmingCommonFormatParameter[];
  const locations = asArray(rec.commonFormatLocations)
    .map((loc) => String(loc ?? "").trim())
    .filter(Boolean);

  return {
    motorStage: rec.motorStage as number | string | undefined,
    motorReceivedAt: toTrimmingUiMotorReceivedAt(
      String(rec.motorReceivedAt ?? rec.motorReceivedDate ?? "").trim(),
    ),
    trimmingDetails: details.length ? details : createDefaultTrimmingDetailsRows(),
    commonFormatParameters: params.length ? params : createDefaultCommonFormatParameters(),
    commonFormatLocations: locations,
    motorRemarks: String(rec.motorRemarks ?? "").trim(),
    reportFiles: parseFileRefs(rec.reportFiles ?? rec.reportFile ?? rec.reportLink),
  };
};

export const setTrimmingSessionValues = (
  session: QcTrimmingSessionValues,
): SchemaFormValues =>
  ({
    motorStage: session.motorStage ?? "",
    motorReceivedAt: session.motorReceivedAt ?? "",
    trimmingDetails: session.trimmingDetails ?? createDefaultTrimmingDetailsRows(),
    commonFormatParameters:
      session.commonFormatParameters ?? createDefaultCommonFormatParameters(),
    commonFormatLocations: session.commonFormatLocations ?? [],
    motorRemarks: session.motorRemarks ?? "",
    reportFiles: session.reportFiles ?? [],
  }) as SchemaFormValues;

const findSectionData = (
  sections: SchemaSectionSubmission[] | null | undefined,
  sectionId: string,
): unknown[] => {
  const match = (sections ?? []).find(
    (section) => String(section.sectionId ?? "").trim() === sectionId,
  );
  return asArray(match?.sectionData);
};

export const hydrateTrimmingValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
  options?: { motorReceivedAt?: string },
): SchemaFormValues => {
  const detailsRaw = findSectionData(sections, QC_TRIMMING_SECTION_IDS.DETAILS);
  const commonRaw = findSectionData(sections, QC_TRIMMING_SECTION_IDS.COMMON_FORMAT);
  const remarksRaw = findSectionData(sections, QC_TRIMMING_SECTION_IDS.REMARKS);
  const remarks = asRecord(remarksRaw[0]) ?? {};

  const details = detailsRaw
    .map((row) => asRecord(row))
    .filter(Boolean)
    .map((row) => ({
      machineDetails: String(row!.machineDetails ?? "").trim(),
      startDate: String(row!.startDate ?? "").trim(),
      completionDate: String(row!.completionDate ?? "").trim(),
      arborSize: String(row!.arborSize ?? "").trim(),
      cutterSize: String(row!.cutterSize ?? "").trim(),
      remarks: String(row!.remarks ?? "").trim(),
    }));

  const parameters = commonRaw
    .map((row) => asRecord(row))
    .filter(Boolean) as unknown as TrimmingCommonFormatParameter[];

  const locationSet = new Set<string>();
  parameters.forEach((param) => {
    (param.stages ?? []).forEach((stage) => {
      Object.keys(stage.readings ?? {}).forEach((key) => {
        if (!["R2T", "R2B", "R1R", "R1L"].includes(key)) locationSet.add(key);
      });
    });
  });

  return setTrimmingSessionValues({
    motorReceivedAt: String(options?.motorReceivedAt ?? "").trim(),
    trimmingDetails: details.length ? details : createDefaultTrimmingDetailsRows(),
    commonFormatParameters: parameters.length
      ? parameters
      : createDefaultCommonFormatParameters(),
    commonFormatLocations: Array.from(locationSet),
    motorRemarks: String(remarks.remarks ?? remarks.motorRemarks ?? "").trim(),
    reportFiles: parseFileRefs(
      remarks.reportFiles ?? remarks.reportFile ?? remarks.reportLink,
    ),
  });
};

/** UI datetime/date → API `motorReceivedDate` (`YYYY-MM-DD`). */
export const toTrimmingApiMotorReceivedDate = (value: string | null | undefined): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return formatToIsoDateInput(raw);
};

/** API `motorReceivedDate` / datetime → UI date (`DD-MM-YYYY`, no time). */
export const toTrimmingUiMotorReceivedAt = (value: string | null | undefined): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return formatToUiDate(raw) || raw;
};

export const toTrimmingApiMotorStage = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^\d.-]/g, "").trim());
  return Number.isFinite(numeric) ? numeric : undefined;
};

const readingValue = (readings: Record<string, string> | undefined, key: string) =>
  String(readings?.[key] ?? "").trim();

const operationRowHasData = (row: TrimmingDetailsRow) =>
  [
    row.machineDetails,
    row.startDate,
    row.completionDate,
    row.arborSize,
    row.cutterSize,
    row.remarks,
  ].some(hasValue);

/** Map Trimming Details table → QC `trimmingOperationDetails[]`. */
export const buildTrimmingOperationDetailsPayload = (
  rows: TrimmingDetailsRow[],
): Record<string, unknown>[] =>
  rows
    .filter(operationRowHasData)
    .map((row) =>
      omitEmpty({
        machineDetails: String(row.machineDetails ?? "").trim() || undefined,
        startDate: toTrimmingApiMotorReceivedDate(row.startDate) || undefined,
        completionDate: toTrimmingApiMotorReceivedDate(row.completionDate) || undefined,
        arborSize: String(row.arborSize ?? "").trim() || undefined,
        cutterSize: String(row.cutterSize ?? "").trim() || undefined,
        remarks: String(row.remarks ?? "").trim() || undefined,
      }),
    );

/** Reverse-map QC `trimmingOperationDetails[]` into Trimming Details rows. */
export const hydrateTrimmingDetailsFromOperationDetails = (
  rows: unknown[],
): TrimmingDetailsRow[] => {
  const mapped = rows
    .map((raw) => asRecord(raw))
    .filter(Boolean)
    .map((row) => ({
      machineDetails: String(row!.machineDetails ?? "").trim(),
      startDate: formatToUiDate(String(row!.startDate ?? "").trim()) || String(row!.startDate ?? "").trim(),
      completionDate:
        formatToUiDate(String(row!.completionDate ?? "").trim()) ||
        String(row!.completionDate ?? "").trim(),
      arborSize: String(row!.arborSize ?? "").trim(),
      cutterSize: String(row!.cutterSize ?? "").trim(),
      remarks: String(row!.remarks ?? "").trim(),
    }))
    .filter(operationRowHasData);

  return mapped.length ? mapped : createDefaultTrimmingDetailsRows();
};

/** Map Dimensions After Trimming table → QC `trimmingMeasurementDetails[]`. */
export const buildTrimmingMeasurementDetailsPayload = (
  parameters: TrimmingCommonFormatParameter[],
): Record<string, unknown>[] => {
  const rows: Record<string, unknown>[] = [];
  let srNo = 1;

  parameters.forEach((param) => {
    const dimension = String(param.parameterName ?? "").trim();
    (param.stages ?? []).forEach((stage) => {
      const readings = stage.readings ?? {};
      const specified = String(
        (stage as { specification?: string }).specification ??
          (param as { specification?: string }).specification ??
          "",
      ).trim();
      const measurementStage = String(stage.stageName ?? "").trim();
      const r2t = readingValue(readings, "R2T");
      const r2b = readingValue(readings, "R2B");
      const r1l = readingValue(readings, "R1L");
      const r1r = readingValue(readings, "R1R");
      const hasMeasurement = [specified, r2t, r2b, r1l, r1r].some(Boolean);
      if (!hasMeasurement) return;

      rows.push(
        omitEmpty({
          SR_NO: srNo,
          DIMENSION: dimension || undefined,
          MEASUREMENT_STAGE: measurementStage || undefined,
          SPECIFIED: specified || undefined,
          R1L: r1l || undefined,
          R1R: r1r || undefined,
          R2B: r2b || undefined,
          R2T: r2t || undefined,
        }),
      );
      srNo += 1;
    });
  });

  return rows;
};

/** Reverse-map QC `trimmingMeasurementDetails[]` into common-format parameters. */
export const hydrateCommonFormatFromMeasurementDetails = (
  rows: unknown[],
): TrimmingCommonFormatParameter[] => {
  const grouped = new Map<string, TrimmingCommonFormatParameter>();

  rows.forEach((raw, index) => {
    const row = asRecord(raw);
    if (!row) return;
    const dimension = String(row.DIMENSION ?? row.dimension ?? row.parameterName ?? "").trim();
    if (!dimension) return;
    const stageName = String(
      row.MEASUREMENT_STAGE ?? row.measurementStage ?? row.stageName ?? "",
    ).trim();
    const key = dimension.toUpperCase();
    const existing = grouped.get(key) ?? {
      parameterId: `PARAM-${String(grouped.size + 1).padStart(3, "0")}`,
      parameterName: dimension,
      stages: [],
    };
    existing.stages = [
      ...existing.stages,
      {
        stageName: stageName || `Stage ${index + 1}`,
        specification: String(row.SPECIFIED ?? row.specified ?? row.specification ?? "").trim(),
        readings: {
          R2T: String(row.R2T ?? row.r2t ?? "").trim(),
          R2B: String(row.R2B ?? row.r2b ?? "").trim(),
          R1L: String(row.R1L ?? row.r1l ?? "").trim(),
          R1R: String(row.R1R ?? row.r1r ?? "").trim(),
        },
      },
    ];
    grouped.set(key, existing);
  });

  return Array.from(grouped.values());
};

/** Build manufacturing-compatible sections (seed/hydrate helpers). */
export const buildTrimmingMotorSections = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] => {
  const session = getTrimmingSessionFromValues(values);
  const sections: SchemaSectionSubmission[] = [];

  if (session.trimmingDetails?.length) {
    sections.push({
      sectionId: QC_TRIMMING_SECTION_IDS.DETAILS,
      sectionData: session.trimmingDetails as unknown as Record<string, unknown>[],
    });
  }

  if (session.commonFormatParameters?.length) {
    sections.push({
      sectionId: QC_TRIMMING_SECTION_IDS.COMMON_FORMAT,
      sectionData: session.commonFormatParameters as unknown as Record<string, unknown>[],
    });
  }

  const readyReportFiles = toFileIdListPayload(session.reportFiles ?? []);
  if (session.motorRemarks.trim() || readyReportFiles.length) {
    sections.push({
      sectionId: QC_TRIMMING_SECTION_IDS.REMARKS,
      sectionData: [
        omitEmpty({
          remarks: session.motorRemarks || undefined,
          ...(readyReportFiles.length ? { reportFile: readyReportFiles } : {}),
        }),
      ],
    });
  }

  return sections;
};

/**
 * Flat QC Trimming motor payload for create/update (`data.trimmingDetails[]`).
 * Matches:
 * `{ motorIdNo, motorSubmissionType, motorStage, motorReceivedDate,
 *    trimmingMeasurementDetails, trimmingOperationDetails, trimmingRemarks }`
 */
export const buildTrimmingMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcTrimmingMotorSubmissionType = "DRAFT",
): Record<string, unknown> => {
  const session = getTrimmingSessionFromValues(values);
  const motorStage = toTrimmingApiMotorStage(session.motorStage);
  const motorReceivedDate = toTrimmingApiMotorReceivedDate(session.motorReceivedAt);
  const trimmingOperationDetails = buildTrimmingOperationDetailsPayload(session.trimmingDetails);
  const trimmingMeasurementDetails = buildTrimmingMeasurementDetailsPayload(
    session.commonFormatParameters,
  );
  const readyReportFiles = toFileIdListPayload(session.reportFiles ?? []);
  const trimmingRemarks = omitEmpty({
    remarks: session.motorRemarks || undefined,
    ...(readyReportFiles.length ? { reportFile: readyReportFiles } : {}),
  });

  return omitEmpty({
    motorIdNo: motorId,
    motorSubmissionType,
    motorReceivedDate: motorReceivedDate || undefined,
    motorStage: motorStage ?? undefined,
    trimmingMeasurementDetails:
      trimmingMeasurementDetails.length > 0 ? trimmingMeasurementDetails : undefined,
    trimmingOperationDetails:
      trimmingOperationDetails.length > 0 ? trimmingOperationDetails : undefined,
    ...(Object.keys(trimmingRemarks).length ? { trimmingRemarks } : {}),
  });
};

export const isTrimmingNestedMotorDetail = (rec: Record<string, unknown>) => {
  const source = resolveTrimmingDetailSource(rec);
  if (Array.isArray(source.trimmingMeasurementDetails)) return true;
  if (Array.isArray(source.trimmingOperationDetails)) return true;
  if (asRecord(source.trimmingRemarks)) return true;
  if (Array.isArray(rec.sections) || Array.isArray(source.sections)) {
    return asArray(source.sections ?? rec.sections).some((section) => {
      const sectionId = String(asRecord(section)?.sectionId ?? "")
        .trim()
        .toUpperCase();
      return (
        sectionId === QC_TRIMMING_SECTION_IDS.DETAILS ||
        sectionId === QC_TRIMMING_SECTION_IDS.COMMON_FORMAT ||
        sectionId === QC_TRIMMING_SECTION_IDS.REMARKS
      );
    });
  }
  return (
    Array.isArray(source.trimmingDetails) ||
    Array.isArray(source.commonFormatParameters) ||
    hasValue(source.motorReceivedAt) ||
    hasValue(source.motorReceivedDate) ||
    source.motorStage != null
  );
};

export const hydrateTrimmingValuesFromMotorDetail = (
  rec: Record<string, unknown>,
): SchemaFormValues => {
  const source = resolveTrimmingDetailSource(rec);
  const receivedAt = toTrimmingUiMotorReceivedAt(
    String(source.motorReceivedAt ?? source.motorReceivedDate ?? "").trim(),
  );
  const nested = asArray(source.sections);

  if (nested.length) {
    const fromSections = hydrateTrimmingValuesFromSections(
      nested.map((section) => {
        const sec = asRecord(section);
        return {
          sectionId: String(sec?.sectionId ?? "").trim(),
          sectionData: asArray(sec?.sectionData) as Record<string, unknown>[],
        };
      }),
      { motorReceivedAt: receivedAt },
    );
    return setTrimmingSessionValues({
      ...getTrimmingSessionFromValues(fromSections),
      motorStage: source.motorStage as number | string | undefined,
    });
  }

  const operationRows = asArray(source.trimmingOperationDetails);
  const measurementRows = asArray(source.trimmingMeasurementDetails);
  const fromMeasurements = hydrateCommonFormatFromMeasurementDetails(measurementRows);
  const remarks = asRecord(source.trimmingRemarks) ?? {};

  return setTrimmingSessionValues({
    motorStage: source.motorStage as number | string | undefined,
    motorReceivedAt: receivedAt,
    trimmingDetails: operationRows.length
      ? hydrateTrimmingDetailsFromOperationDetails(operationRows)
      : createDefaultTrimmingDetailsRows(),
    commonFormatParameters: fromMeasurements.length
      ? fromMeasurements
      : createDefaultCommonFormatParameters(),
    commonFormatLocations: [],
    motorRemarks: String(remarks.remarks ?? source.remarks ?? "").trim(),
    reportFiles: parseFileRefs(
      remarks.reportFiles ?? remarks.reportFile ?? remarks.reportLink ?? source.reportLink,
    ),
  });
};

export const trimmingMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const source = resolveTrimmingDetailSource(rec);
  const nested = asArray(source.sections);
  if (nested.length) {
    return nested
      .map((section) => asRecord(section))
      .filter(Boolean)
      .map((section) => ({
        sectionId: String(section!.sectionId ?? "").trim(),
        sectionData: asArray(section!.sectionData) as Record<string, unknown>[],
        motorId,
        motorReceivedDate:
          String(source.motorReceivedAt ?? source.motorReceivedDate ?? "").trim() || undefined,
      })) as SchemaSectionSubmission[];
  }

  // Flat / manufacturing-nested unit shape → expand into sections.
  if (
    Array.isArray(source.trimmingMeasurementDetails) ||
    Array.isArray(source.trimmingOperationDetails) ||
    asRecord(source.trimmingRemarks) ||
    hasValue(source.motorReceivedDate) ||
    hasValue(source.motorReceivedAt)
  ) {
    const values = hydrateTrimmingValuesFromMotorDetail(source);
    const motorReceivedDate =
      String(source.motorReceivedAt ?? source.motorReceivedDate ?? "").trim() || undefined;
    return buildTrimmingMotorSections(values).map((section) => ({
      ...section,
      motorId,
      motorReceivedDate,
    })) as SchemaSectionSubmission[];
  }

  return [];
};

export const trimmingValuesHaveData = (values: SchemaFormValues | null | undefined) => {
  const session = getTrimmingSessionFromValues(values);
  if (hasValue(session.motorReceivedAt) || hasValue(session.motorRemarks)) return true;
  if ((session.reportFiles ?? []).some((ref) => isFileReady(ref) || ref.fileName?.trim())) {
    return true;
  }
  if (hasValue(session.reportLink)) return true;
  if (session.commonFormatParameters.some((param) =>
    (param.stages ?? []).some((stage) =>
      Object.values(stage.readings ?? {}).some((value) => String(value ?? "").trim()),
    ),
  )) {
    return true;
  }
  return session.trimmingDetails.some(operationRowHasData);
};

export const collectTrimmingFileRefsFromQcValues = (
  values: SchemaFormValues | null | undefined,
): FileRef[] => getTrimmingSessionFromValues(values).reportFiles ?? [];

export const hasIncompleteQcTrimmingUploads = (
  values: SchemaFormValues | null | undefined,
): boolean => collectTrimmingFileRefsFromQcValues(values).some(isFileUploadIncomplete);

export const collectTempFileIdsFromQcTrimmingValues = (
  values: SchemaFormValues | null | undefined,
): string[] =>
  [
    ...new Set(
      collectTrimmingFileRefsFromQcValues(values)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];
