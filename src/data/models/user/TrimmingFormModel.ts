import {
  mapTrimmingMotorStage,
  resolveTrimmingMotorStageNumber,
  type SchemaSectionSubmission,
} from "../../../schema-engine";
import type { CasePrepDetailSection } from "./CasePreparationFormModel";
import { isFileReady, isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileRef } from "../common/FileUploadModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import { formatPrepSectionLabel } from "./RawMaterialPreparationModel";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";

const TRIMMING_SECTION_LABELS: Record<string, string> = {
  TRIMMING_DETAILS: "Trimming Details",
  TRIMMING_COMMON_FORMAT: "Dimensions After Trimming",
  DIMENSIONS_AFTER_TRIMMING: "Dimensions After Trimming",
  TRIMMING_REMARKS: "Remarks & Attachments",
};

const TRIMMING_DETAILS_COLUMN_ORDER = [
  "machineDetails",
  "startDate",
  "completionDate",
  "arborSize",
  "cutterSize",
  "remarks",
] as const;

const TRIMMING_DETAILS_COLUMN_LABELS: Record<string, string> = {
  machineDetails: "Machine Details",
  startDate: "Start Date",
  completionDate: "Completion Date",
  arborSize: "Arbor Size",
  cutterSize: "Cutter Size",
  remarks: "Remarks",
};

const TRIMMING_COMMON_BASE_COLUMNS = ["parameterName", "stage", "specification"] as const;

const TRIMMING_COMMON_BASE_LABELS: Record<string, string> = {
  parameterName: "Parameter",
  stage: "Stage",
  specification: "Specification",
};

const DEFAULT_READING_KEYS = ["R2T", "R2B", "R1R", "R1L"] as const;

const formatTrimmingStageLabel = (stage: unknown, stageName: unknown): string => {
  const name = String(stageName ?? "").trim();
  if (name) return name;
  const raw = String(stage ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "BEFORE_TRIMMING") return "Before Trimming";
  if (raw === "AFTER_TRIMMING") return "After Trimming";
  return String(stage ?? stageName ?? "").trim() || "—";
};

const isTrimmingFileRefLike = (value: unknown): boolean => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  return "fileId" in entry || "fileName" in entry || "mimeType" in entry;
};

const isTrimmingFileRefList = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.some((entry) => isTrimmingFileRefLike(entry) || typeof entry === "string");

const resolveReportDisplayValue = (row: Record<string, unknown>): unknown => {
  const raw =
    row.reportFiles ?? row.reportFile ?? row.reportLink ?? row.reportFiles ?? undefined;
  if (isTrimmingFileRefList(raw) || isTrimmingFileRefLike(raw)) {
    return raw;
  }
  if (row.reportFile && typeof row.reportFile === "object") {
    const file = row.reportFile as Record<string, unknown>;
    const name = String(
      file.originalFileName ?? file.storedFileName ?? file.filePath ?? file.url ?? "",
    ).trim();
    return name;
  }
  return String(row.reportLink ?? "").trim();
};

/** Expand nested readings into table columns matching the user-side trimming form. */
export const parseTrimmingSectionData = (
  sectionId: string,
  sectionData: unknown,
): CasePrepDetailSection => {
  const fields: CasePrepDetailSection["fields"] = [];
  const tables: CasePrepDetailSection["tables"] = [];
  const rows = Array.isArray(sectionData) ? (sectionData as Record<string, unknown>[]) : [];

  if (sectionId === "TRIMMING_DETAILS") {
    const displayRows = rows
      .map((row) => {
        const next: Record<string, unknown> = {};
        TRIMMING_DETAILS_COLUMN_ORDER.forEach((key) => {
          if (row[key] != null) next[key] = row[key];
        });
        return next;
      })
      .filter((row) => Object.values(row).some((value) => String(value ?? "").trim().length > 0));

    if (displayRows.length > 0) {
      const usedColumns = TRIMMING_DETAILS_COLUMN_ORDER.filter((key) =>
        displayRows.some((row) => row[key] != null && String(row[key]).trim() !== ""),
      );
      const columns = usedColumns.length > 0 ? usedColumns : [...TRIMMING_DETAILS_COLUMN_ORDER];

      tables.push({
        blockId: sectionId,
        label: "",
        rows: displayRows,
        columnLabels: Object.fromEntries(
          columns.map((key) => [key, TRIMMING_DETAILS_COLUMN_LABELS[key]]),
        ),
      });
    }

    return {
      sectionId,
      label: TRIMMING_SECTION_LABELS[sectionId] ?? formatPrepSectionLabel(sectionId),
      fields,
      tables,
    };
  }

  if (sectionId === "TRIMMING_COMMON_FORMAT" || sectionId === "DIMENSIONS_AFTER_TRIMMING") {
    const readingKeySet = new Set<string>(DEFAULT_READING_KEYS);
    const flatRows: Record<string, unknown>[] = [];

    rows.forEach((param) => {
      const parameterName = String(
        param.parameterName ?? param.PARAMETER ?? param.parameter ?? "",
      ).trim();
      const stages = Array.isArray(param.stages) ? param.stages : [];

      if (!stages.length) {
        const readings =
          param.readings && typeof param.readings === "object" && !Array.isArray(param.readings)
            ? (param.readings as Record<string, unknown>)
            : {};
        Object.keys(readings).forEach((key) => readingKeySet.add(key));
        flatRows.push({
          parameterName: parameterName || "—",
          stage: formatTrimmingStageLabel(param.stage, param.stageName),
          specification: param.specification ?? "",
          ...readings,
        });
        return;
      }

      stages.forEach((stageEntry) => {
        const stage = (stageEntry ?? {}) as Record<string, unknown>;
        const readings =
          stage.readings && typeof stage.readings === "object" && !Array.isArray(stage.readings)
            ? (stage.readings as Record<string, unknown>)
            : {};
        Object.keys(readings).forEach((key) => readingKeySet.add(key));
        flatRows.push({
          parameterName: parameterName || "—",
          stage: formatTrimmingStageLabel(stage.stage, stage.stageName),
          specification: stage.specification ?? param.specification ?? "",
          ...readings,
        });
      });
    });

    if (flatRows.length > 0) {
      const readingKeys = [
        ...DEFAULT_READING_KEYS.filter((key) => readingKeySet.has(key)),
        ...[...readingKeySet].filter(
          (key) => !(DEFAULT_READING_KEYS as readonly string[]).includes(key),
        ),
      ];
      const columnLabels: Record<string, string> = {
        ...TRIMMING_COMMON_BASE_LABELS,
        ...Object.fromEntries(readingKeys.map((key) => [key, key])),
      };

      tables.push({
        blockId: sectionId,
        label: "",
        rows: flatRows,
        columnLabels,
      });
    }

    return {
      sectionId,
      label: TRIMMING_SECTION_LABELS[sectionId] ?? formatPrepSectionLabel(sectionId),
      fields,
      tables,
    };
  }

  if (sectionId === "TRIMMING_REMARKS") {
    const row = (rows[0] ?? {}) as Record<string, unknown>;
    const remarks = String(row.remarks ?? "").trim();
    const reportValue = resolveReportDisplayValue(row);

    if (remarks) {
      fields.push({ key: "remarks", label: "Remarks", value: remarks });
    }
    if (reportValue) {
      fields.push({ key: "reportFiles", label: "Report", value: reportValue });
    }

    return {
      sectionId,
      label: TRIMMING_SECTION_LABELS[sectionId] ?? formatPrepSectionLabel(sectionId),
      fields,
      tables,
    };
  }

  return {
    ...parseCastingCuringSectionData(sectionId, sectionData),
    label: TRIMMING_SECTION_LABELS[sectionId] ?? formatPrepSectionLabel(sectionId),
  };
};

/** Preserve schema/column order for trimming detail tables (avoid alphabetical sort). */
export const orderTrimmingDisplayColumns = (
  columns: string[],
  preferredOrder: string[] = [],
): string[] => {
  const visible = columns.filter((col) => !col.startsWith("_") && !col.endsWith("__fieldType"));
  if (!preferredOrder.length) {
    // Keep Object.keys insertion order when labels were built intentionally
    return visible;
  }

  const preferred = preferredOrder.filter((col) => visible.includes(col));
  const rest = visible.filter((col) => !preferred.includes(col));
  return [...preferred, ...rest];
};

export type TrimmingMotorSubmissionType = "DRAFT" | "SUBMIT";
export type TrimmingMotorSubmissionStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type TrimmingMotorStatusMeta = {
  motorSubmissionType?: TrimmingMotorSubmissionType;
  motorSubmissionStatus: TrimmingMotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const isTrimmingMotorLocked = (status?: TrimmingMotorSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isTrimmingMotorEditable = (status?: TrimmingMotorSubmissionStatus | string | null) =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS" || status === "REJECTED";

export const isTrimmingMotorApproverTabDisabled = (
  status?: TrimmingMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return !normalized || normalized === "TO_BE_INITIATED";
};

export const isTrimmingMotorApproverActionable = (
  status?: TrimmingMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

/** Entire form can be approved/rejected once ready for complete approval. */
export const canApproverActionEntireTrimmingForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: TrimmingMotorSubmissionStatus | string | null }>;
}): boolean => {
  const status = String(params.status ?? "").trim();
  const statusUpper = status.toUpperCase().replace(/\s+/g, "_");

  if (
    statusUpper === "APPROVED" ||
    statusUpper === "REJECTED" ||
    statusUpper === "COMPLETELY_APPROVED" ||
    status === OPERATION_STATUS.APPROVED ||
    status === OPERATION_STATUS.REJECTED ||
    status === OPERATION_STATUS.COMPLETELY_APPROVED
  ) {
    return false;
  }

  if (
    statusUpper === "WAITING_FOR_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_APPROVAL
  ) {
    return true;
  }

  const formType = String(params.formSubmissionType ?? "")
    .trim()
    .toUpperCase();
  if (formType !== "SUBMIT") return false;

  const motors = params.motors ?? [];
  if (motors.length === 0) return false;
  const allMotorsApproved = motors.every(
    (motor) => String(motor.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
  if (!allMotorsApproved) return false;

  return statusUpper === "WAITING_FOR_APPROVAL" || status === OPERATION_STATUS.WAITING_FOR_APPROVAL;
};

export const getTrimmingBatchStatusLabel = (status: unknown): string => String(status ?? "").trim();

export type TrimmingMotorCounts = {
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  totalMotorCount: number;
};

export const normalizeTrimmingMotorStatus = (value: unknown): TrimmingMotorSubmissionStatus => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (
    normalized === "IN_PROGRESS" ||
    normalized === "WAITING_FOR_APPROVAL" ||
    normalized === "APPROVED" ||
    normalized === "REJECTED"
  ) {
    return normalized;
  }
  return "TO_BE_INITIATED";
};

export const normalizeTrimmingMotorSubmissionType = (
  value: unknown,
): TrimmingMotorSubmissionType | undefined => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "DRAFT" || raw === "SUBMIT") return raw;
  return undefined;
};

export const mapTrimmingMotorStatusesFromApi = (
  details: any,
): Record<string, TrimmingMotorStatusMeta> => {
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, TrimmingMotorStatusMeta> = {};

  const rootStatuses = Array.isArray(root?.motorStatuses)
    ? root.motorStatuses
    : Array.isArray(details?.motorStatuses)
      ? details.motorStatuses
      : [];

  rootStatuses.forEach((entry: any) => {
    const motorId = String(entry?.motorId ?? "").trim();
    if (!motorId) return;
    statusById[motorId] = {
      motorSubmissionType: normalizeTrimmingMotorSubmissionType(entry?.motorSubmissionType),
      motorSubmissionStatus: normalizeTrimmingMotorStatus(entry?.motorSubmissionStatus),
      submittedAt: entry?.submittedAt ?? null,
      reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
      reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
      remarks: entry?.remarks ?? null,
      rejectionReason: entry?.rejectionReason ?? null,
    };
  });

  const payload = details?.trimmingDetails ?? details ?? {};
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];
  rawMotors.forEach((motor: any) => {
    const motorId = String(motor?.motorId ?? "").trim();
    if (!motorId) return;
    const existing = statusById[motorId];
    statusById[motorId] = {
      motorSubmissionType:
        normalizeTrimmingMotorSubmissionType(motor?.motorSubmissionType) ??
        existing?.motorSubmissionType,
      motorSubmissionStatus: normalizeTrimmingMotorStatus(
        motor?.motorSubmissionStatus ?? existing?.motorSubmissionStatus,
      ),
      submittedAt: motor?.submittedAt ?? existing?.submittedAt ?? null,
      reviewedBy: motor?.actionBy ?? motor?.reviewedBy ?? existing?.reviewedBy ?? null,
      reviewedAt: motor?.actionAt ?? motor?.reviewedAt ?? existing?.reviewedAt ?? null,
      remarks: motor?.remarks ?? existing?.remarks ?? null,
      rejectionReason: motor?.rejectionReason ?? existing?.rejectionReason ?? null,
    };
  });

  return statusById;
};

export const areAllTrimmingMotorsApproved = (
  motorStatusById: Record<string, TrimmingMotorStatusMeta>,
): boolean => {
  const entries = Object.values(motorStatusById);
  if (entries.length === 0) return false;
  return entries.every(
    (meta) => String(meta.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
};

export type TrimmingDetailsRow = {
  machineDetails: string;
  startDate: string;
  completionDate: string;
  arborSize: string;
  cutterSize: string;
  remarks: string;
};

export type TrimmingCommonFormatStage = {
  stageName: string; // e.g., "Before Trimming", "After Trimming"
  readings: Record<string, string>;
};

export type TrimmingCommonFormatParameter = {
  parameterId?: string; // UNIQUE IDENTIFIER FOR DB / REACT KEY
  parameterName: string;
  stages: TrimmingCommonFormatStage[];
};

// NEW: Structured document metadata for report files
export type TrimmingReportFile = {
  documentType: string;
  originalFileName: string;
  filePath: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
};

export type TrimmingMotorSession = {
  motorId: string;
  motorStage: number;
  motorReceivedAt: string;
  savedSections?: SchemaSectionSubmission[];
  trimmingDetails: TrimmingDetailsRow[];
  commonFormatParameters: TrimmingCommonFormatParameter[];
  motorRemarks: string;
  reportFiles: FileRef[];
  /** Legacy hydrate only — do not bind UI. */
  reportFile?: TrimmingReportFile | null;
  /** Legacy hydrate only — do not bind UI. */
  reportLink?: string;
};

export const createTrimmingData = () => ({
  selectedMotorStage: null as string | null,
  motors: [] as TrimmingMotorSession[],
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type TrimmingFormState = ReturnType<typeof createTrimmingData>;

export type TrimmingDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  batchType?: string;
  motorReceivedDate?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motorStage?: number | string;
  motors?: Array<{
    motorId?: string;
    motorStage?: number | string;
    motorReceivedAt?: string;
    motorSubmissionType?: TrimmingMotorSubmissionType;
    motorSubmissionStatus?: TrimmingMotorSubmissionStatus;
    rejectionReason?: string | null;
    sections?: SchemaSectionSubmission[];
  }>;
  sections?: SchemaSectionSubmission[];
  motorStatuses?: Array<{
    motorId: string;
    motorSubmissionType?: TrimmingMotorSubmissionType;
    motorSubmissionStatus?: TrimmingMotorSubmissionStatus;
    submittedAt?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    remarks?: string | null;
    rejectionReason?: string | null;
  }>;
};

export type TrimmingMotorSubmission = {
  motorId: string;
  motorStage: number;
  motorReceivedAt: string;
  sections: SchemaSectionSubmission[];
  motorSubmissionType?: TrimmingMotorSubmissionType;
};

export type TrimmingFormBody = {
  motorStage?: number;
  motors?: TrimmingMotorSubmission[];
  sections?: SchemaSectionSubmission[];
};

export const createDefaultTrimmingFormState = (): TrimmingFormState => createTrimmingData();

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

export const createEmptyTrimmingMotorSession = (
  motorId: string,
  motorStage: number | string,
  motorReceivedAt: string,
): TrimmingMotorSession => ({
  motorId,
  motorStage: resolveTrimmingMotorStageNumber({ motorStage }),
  motorReceivedAt,
  savedSections: undefined,
  trimmingDetails: createDefaultTrimmingDetailsRows(),
  commonFormatParameters: createDefaultCommonFormatParameters(),
  motorRemarks: "",
  reportFiles: [],
});

export const mapTrimmingDetailsToFormState = (
  details: Partial<TrimmingDetails>,
): TrimmingFormState => {
  const defaults = createDefaultTrimmingFormState();
  const rawMotors = Array.isArray(details?.motors) ? details.motors : [];
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;
  const motorStage = details?.motorStage;

  const motors: TrimmingMotorSession[] = rawMotors
    .map((motor) => {
      const motorSections = Array.isArray(motor?.sections) ? motor.sections : [];

      // Extract section-specific data if available
      const detailsSection = motorSections.find((s) => s.sectionId === "TRIMMING_DETAILS");
      const commonSection = motorSections.find((s) => s.sectionId === "TRIMMING_COMMON_FORMAT");
      const remarksSection = motorSections.find((s) => s.sectionId === "TRIMMING_REMARKS");

      const remarksData = (remarksSection?.sectionData?.[0] as any) ?? {};

      return {
        motorId: String(motor?.motorId ?? "").trim(),
        motorStage: resolveTrimmingMotorStageNumber({
          motorStage: motor?.motorStage ?? motorStage,
        }),
        motorReceivedAt: String(motor?.motorReceivedAt ?? "").trim(),
        savedSections: motorSections.length > 0 ? motorSections : undefined,
        trimmingDetails:
          (detailsSection?.sectionData as TrimmingDetailsRow[]) ??
          createDefaultTrimmingDetailsRows(),
        commonFormatParameters:
          (commonSection?.sectionData as TrimmingCommonFormatParameter[]) ??
          createDefaultCommonFormatParameters(),
        motorRemarks: remarksData.remarks ?? "",
        reportFiles: parseFileRefs(
          remarksData.reportFiles ?? remarksData.reportFile ?? remarksData.reportLink,
        ),
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  if (motors.length === 0 && savedSections?.length) {
    motors.push({
      motorId: "",
      motorStage: resolveTrimmingMotorStageNumber({ motorStage }),
      motorReceivedAt: "",
      savedSections,
      trimmingDetails: createDefaultTrimmingDetailsRows(),
      commonFormatParameters: createDefaultCommonFormatParameters(),
      motorRemarks: "",
      reportFiles: [],
    });
  }

  return {
    ...defaults,
    selectedMotorStage: motorStage != null ? String(motorStage) : null,
    motors,
    savedSections,
  };
};

export const mapTrimmingFormStateToPayload = (
  form: TrimmingFormState,
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: TrimmingMotorSubmissionType;
  },
): TrimmingFormBody => {
  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  const motors = (form.motors ?? [])
    .filter((motor) => motor.motorId.trim().length > 0)
    .filter((motor) => !targetIds || targetIds.has(motor.motorId))
    .map((motor) => {
      const sections: SchemaSectionSubmission[] = [];

      // 1. Trimming Details
      if (motor.trimmingDetails?.length) {
        sections.push({ sectionId: "TRIMMING_DETAILS", sectionData: motor.trimmingDetails });
      }

      // 2. Trimming Common Format
      if (motor.commonFormatParameters?.length) {
        sections.push({
          sectionId: "TRIMMING_COMMON_FORMAT",
          sectionData: motor.commonFormatParameters,
        });
      }

      // 3. Trimming Remarks & File Upload
      const readyReportFiles = toFileIdListPayload(motor.reportFiles ?? []);
      const legacyReportLink = String(motor.reportLink ?? "").trim();
      if (
        motor.motorRemarks?.trim() ||
        readyReportFiles.length ||
        legacyReportLink
      ) {
        const remarksPayload: Record<string, unknown> = {
          remarks: motor.motorRemarks ?? "",
        };

        if (readyReportFiles.length) {
          remarksPayload.reportFile = readyReportFiles;
        } else if (legacyReportLink) {
          remarksPayload.reportLink = legacyReportLink;
        }

        sections.push({
          sectionId: "TRIMMING_REMARKS",
          sectionData: [remarksPayload],
        });
      }

      return {
        motorId: motor.motorId,
        motorStage: motor.motorStage,
        motorReceivedAt: motor.motorReceivedAt,
        sections,
        ...(options?.motorSubmissionType
          ? { motorSubmissionType: options.motorSubmissionType }
          : {}),
      };
    });

  if (motors.length > 0) {
    return {
      motorStage: motors[0]?.motorStage,
      motors,
    };
  }

  return {
    motorStage: resolveTrimmingMotorStageNumber({ motorStage: form.selectedMotorStage }),
    sections: [],
  };
};

const motorHasTrimmingValue = (motor: TrimmingMotorSession) => {
  if (motor.motorRemarks?.trim()) return true;
  if ((motor.reportFiles ?? []).some((ref) => isFileReady(ref) || ref.fileName?.trim())) {
    return true;
  }
  if (String(motor.reportLink ?? "").trim()) return true;
  if (String(motor.motorReceivedAt ?? "").trim()) return true;

  if (
    motor.trimmingDetails?.some((row) =>
      [
        row.machineDetails,
        row.startDate,
        row.completionDate,
        row.arborSize,
        row.cutterSize,
        row.remarks,
      ].some((value) => String(value ?? "").trim().length > 0),
    )
  ) {
    return true;
  }

  if (
    motor.commonFormatParameters?.some((param) =>
      param.stages.some((stage) =>
        Object.values(stage.readings).some((value) => String(value ?? "").trim().length > 0),
      ),
    )
  ) {
    return true;
  }
  return false;
};

export const hasMotorTrimmingValue = (form: TrimmingFormState, motorId: string) => {
  const motor = (form.motors ?? []).find((entry) => entry.motorId === motorId);
  return motor ? motorHasTrimmingValue(motor) : false;
};

export const hasAnyTrimmingValue = (form: TrimmingFormState) =>
  (form.motors ?? []).some((motor) => motorHasTrimmingValue(motor));

export const collectTrimmingFileRefsFromForm = (form: {
  motors?: TrimmingMotorSession[];
}): FileRef[] => {
  const refs: FileRef[] = [];
  for (const motor of form?.motors ?? []) {
    refs.push(...(motor.reportFiles ?? []));
  }
  return refs;
};

export const hasIncompleteTrimmingUploads = (form: {
  motors?: TrimmingMotorSession[];
}): boolean =>
  collectTrimmingFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromTrimmingForm = (form: {
  motors?: TrimmingMotorSession[];
}): string[] =>
  [
    ...new Set(
      collectTrimmingFileRefsFromForm(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

/** Build final-approval payload from latest saved form details (all motors). */
export const mapTrimmingDetailsFromSavedForm = (
  details: any,
  options?: { motorStatusById?: Record<string, TrimmingMotorStatusMeta> },
): TrimmingFormBody => {
  const payload = details?.trimmingDetails ?? details?.data ?? details ?? {};
  const statusById = options?.motorStatusById ?? mapTrimmingMotorStatusesFromApi(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const motors: TrimmingMotorSubmission[] = rawMotors
    .map((motor: any) => {
      const motorId = String(motor?.motorId ?? "").trim();
      if (!motorId) return null;
      const statusMeta = statusById[motorId];
      return {
        motorId,
        motorStage: resolveTrimmingMotorStageNumber({
          motorStage: motor?.motorStage ?? payload?.motorStage,
        }),
        motorReceivedAt: String(motor?.motorReceivedAt ?? "").trim(),
        sections: Array.isArray(motor?.sections)
          ? motor.sections
          : Array.isArray(motor?.details?.sections)
            ? motor.details.sections
            : [],
        motorSubmissionType:
          statusMeta?.motorSubmissionType ??
          normalizeTrimmingMotorSubmissionType(motor?.motorSubmissionType) ??
          "SUBMIT",
      } as TrimmingMotorSubmission;
    })
    .filter(Boolean) as TrimmingMotorSubmission[];

  return {
    motorStage:
      motors[0]?.motorStage ?? resolveTrimmingMotorStageNumber({ motorStage: payload?.motorStage }),
    motors,
  };
};

export type TrimmingMotorDetailView = {
  motorId: string;
  motorStageLabel: string;
  motorReceivedAt: string;
  motorSubmissionType?: TrimmingMotorSubmissionType;
  motorSubmissionStatus?: TrimmingMotorSubmissionStatus;
  rejectionReason?: string | null;
  sections: CasePrepDetailSection[];
};

export type TrimmingDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  formSubmissionType?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  motors: TrimmingMotorDetailView[];
  motorCounts?: TrimmingMotorCounts;
};

const parseTrimmingDisplaySections = (sections: unknown[] | undefined): CasePrepDetailSection[] =>
  (sections ?? [])
    .map((section) => {
      const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
      return parseTrimmingSectionData(
        String(block.sectionId ?? ""),
        block.sectionData as Record<string, unknown>[] | undefined,
      );
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

const resolveTrimmingMotorSections = (motor: Record<string, unknown>): CasePrepDetailSection[] => {
  if (Array.isArray(motor.sections)) {
    return parseTrimmingDisplaySections(motor.sections as unknown[]);
  }

  const details = (motor.details ?? motor) as Record<string, unknown>;
  if (Array.isArray(details.sections)) {
    return parseTrimmingDisplaySections(details.sections as unknown[]);
  }

  return [];
};

export const mapTrimmingDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): TrimmingDetailView | null => {
  if (!data) return null;

  const details = (data.trimmingDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];
  const motorStatuses = mapTrimmingMotorStatusesFromApi(data);

  const motors: TrimmingMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const src = (entry.details ?? entry) as Record<string, unknown>;
      const motorId = String(entry.motorId ?? src.motorId ?? "").trim();
      const statusMeta = motorStatuses[motorId];
      const motorStage = src.motorStage ?? entry.motorStage;

      return {
        motorId,
        motorStageLabel: mapTrimmingMotorStage(motorStage),
        motorReceivedAt: String(src.motorReceivedAt ?? entry.motorReceivedAt ?? "").trim(),
        motorSubmissionType:
          statusMeta?.motorSubmissionType ??
          normalizeTrimmingMotorSubmissionType(entry.motorSubmissionType),
        motorSubmissionStatus:
          statusMeta?.motorSubmissionStatus ??
          normalizeTrimmingMotorStatus(entry.motorSubmissionStatus),
        rejectionReason:
          statusMeta?.rejectionReason ?? (entry.rejectionReason as string | null) ?? null,
        sections: resolveTrimmingMotorSections(entry),
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  const derivedCounts: TrimmingMotorCounts = {
    pendingMotorCount: 0,
    approvedMotorCount: 0,
    rejectedMotorCount: 0,
    inProgressMotorCount: 0,
    totalMotorCount: motors.length,
  };
  motors.forEach((motor) => {
    const status = String(motor.motorSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
    if (status === "WAITING_FOR_APPROVAL") derivedCounts.pendingMotorCount += 1;
    else if (status === "APPROVED") derivedCounts.approvedMotorCount += 1;
    else if (status === "REJECTED") derivedCounts.rejectedMotorCount += 1;
    else if (status === "IN_PROGRESS") derivedCounts.inProgressMotorCount += 1;
  });

  const motorCountsFromApi = (data.motorCounts ?? details.motorCounts) as
    | Partial<TrimmingMotorCounts>
    | undefined;

  return {
    formId: String(details.formId ?? data.formId ?? ""),
    batchId: String(details.batchId ?? data.batchId ?? ""),
    batchType: details.batchType != null ? String(details.batchType) : "",
    status:
      details.status != null
        ? String(details.status)
        : data.status != null
          ? String(data.status)
          : data.trStatus != null
            ? String(data.trStatus)
            : details.trStatus != null
              ? String(details.trStatus)
              : undefined,
    formSubmissionType: String(data.formSubmissionType ?? details.formSubmissionType ?? ""),
    createdBy: mapCastingCuringPersonLabel(details.createdBy ?? data.createdBy),
    createdAt:
      details.createdAt != null
        ? String(details.createdAt)
        : data.createdAt != null
          ? String(data.createdAt)
          : null,
    submittedBy: mapCastingCuringPersonLabel(details.submittedBy ?? data.submittedBy),
    submittedAt:
      details.submittedAt != null
        ? String(details.submittedAt)
        : data.submittedAt != null
          ? String(data.submittedAt)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(
      details.lastUpdatedBy ?? details.updatedBy ?? data.lastUpdatedBy,
    ),
    lastUpdatedAt:
      details.lastUpdatedAt != null
        ? String(details.lastUpdatedAt)
        : details.updatedAt != null
          ? String(details.updatedAt)
          : data.lastUpdatedAt != null
            ? String(data.lastUpdatedAt)
            : null,
    motors,
    motorCounts: {
      pendingMotorCount: Number(
        motorCountsFromApi?.pendingMotorCount ?? derivedCounts.pendingMotorCount,
      ),
      approvedMotorCount: Number(
        motorCountsFromApi?.approvedMotorCount ?? derivedCounts.approvedMotorCount,
      ),
      rejectedMotorCount: Number(
        motorCountsFromApi?.rejectedMotorCount ?? derivedCounts.rejectedMotorCount,
      ),
      inProgressMotorCount: Number(
        motorCountsFromApi?.inProgressMotorCount ?? derivedCounts.inProgressMotorCount,
      ),
      totalMotorCount: Math.max(
        Number(motorCountsFromApi?.totalMotorCount ?? 0),
        derivedCounts.totalMotorCount,
      ),
    },
  };
};

export class TrimmingSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new TrimmingSubmitResponseModel(data);
  }
}

export class TrimmingDetailsModel {
  static fromApi(data: any): TrimmingDetails {
    const payload = data?.data ?? data ?? {};
    const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      status: payload?.status != null ? String(payload.status) : undefined,
      batchType: payload?.batchType != null ? String(payload.batchType) : undefined,
      motorReceivedDate:
        payload?.motorReceivedDate != null ? String(payload.motorReceivedDate) : null,
      createdBy: mapCastingCuringPersonLabel(payload?.createdBy),
      createdAt: payload?.createdAt != null ? String(payload.createdAt) : null,
      submittedBy: mapCastingCuringPersonLabel(payload?.submittedBy),
      submittedAt: payload?.submittedAt != null ? String(payload.submittedAt) : null,
      lastUpdatedBy: mapCastingCuringPersonLabel(payload?.lastUpdatedBy ?? payload?.updatedBy),
      lastUpdatedAt:
        payload?.lastUpdatedAt != null
          ? String(payload.lastUpdatedAt)
          : payload?.updatedAt != null
            ? String(payload.updatedAt)
            : null,
      motorStage: payload?.motorStage,
      motors:
        rawMotors.length > 0
          ? rawMotors.map((motor: any) => ({
              motorId: String(motor?.motorId ?? ""),
              motorStage: motor?.motorStage,
              motorReceivedAt: String(motor?.motorReceivedAt ?? ""),
              motorSubmissionType: normalizeTrimmingMotorSubmissionType(motor?.motorSubmissionType),
              motorSubmissionStatus: normalizeTrimmingMotorStatus(motor?.motorSubmissionStatus),
              rejectionReason: motor?.rejectionReason ?? null,
              sections: Array.isArray(motor?.sections) ? motor.sections : undefined,
            }))
          : undefined,
      sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
      motorStatuses: Array.isArray(payload?.motorStatuses)
        ? payload.motorStatuses
            .map((entry: any) => ({
              motorId: String(entry?.motorId ?? "").trim(),
              motorSubmissionType: normalizeTrimmingMotorSubmissionType(entry?.motorSubmissionType),
              motorSubmissionStatus: normalizeTrimmingMotorStatus(entry?.motorSubmissionStatus),
              submittedAt: entry?.submittedAt ?? null,
              reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
              reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
              remarks: entry?.remarks ?? null,
              rejectionReason: entry?.rejectionReason ?? null,
            }))
            .filter((entry: { motorId: string }) => entry.motorId.length > 0)
        : undefined,
    };
  }
}
