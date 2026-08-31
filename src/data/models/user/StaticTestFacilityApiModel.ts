import {
  FORM_SECTIONS_KEY,
  mapStaticTestFacilityDetailsToFormState,
  mapStfMotorStatusesFromApi,
  mapStfTestNoByMotorIdFromApi,
  type BemMotorDetailsResponse,
  type StfMotorSubmissionStatus,
  type StfMotorSubmissionType,
} from "./StaticTestFacilityFormModel";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import { mapStfSubType } from "../../../hooks/user/qualityControl/stfFlowConfig";
import {
  parseStfMotorDataFromApi,
  type StfMotorData,
  type StfStaticTestingDetailsApi,
} from "./StfMotorDataModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import {
  formatCasePrepSectionLabel,
  type CasePrepDetailSection,
} from "./CasePreparationFormModel";

type LegacySectionSubmission = { sectionId?: string; sectionData?: unknown };

export type STFSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type STFMotorPayload = {
  motorId: string;
  subType: string;
  stfTestNo?: string;
  motorSubmissionType?: StfMotorSubmissionType;
  staticTestingDetails: StfStaticTestingDetailsApi;
};

// ============================================================================
// Response & Details Models
// ============================================================================

export class STFSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): STFSubmitResponseModel {
    return new STFSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class BEMSubmitResponseModel {
  bemMotorId: string;
  bemNo: string;
  status: string;

  constructor(payload: { bemMotorId?: string; bemNo?: string; status?: string }) {
    this.bemMotorId = payload.bemMotorId ?? "";
    this.bemNo = payload.bemNo ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): BEMSubmitResponseModel {
    return new BEMSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class STFDetailsModel {
  formId: string;
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: string;
  formStatus: string;
  subType: string;
  motorIdNo: string;
  sections: LegacySectionSubmission[];
  motors: Array<{
    motorId: string;
    subType?: string;
    stfTestNo?: string;
    motorSubmissionType?: StfMotorSubmissionType;
    motorSubmissionStatus?: StfMotorSubmissionStatus;
    staticTestingDetails?: Record<string, unknown>;
  }>;
  motorStatuses: Array<{
    motorId: string;
    subType?: string;
    stfTestNo?: string;
    motorSubmissionType?: StfMotorSubmissionType;
    motorSubmissionStatus?: StfMotorSubmissionStatus;
  }>;
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  totalMotorCount: number;
  allMotorsApproved: boolean;
  createdBy: unknown;
  createdAt: string | null;
  submittedBy: unknown;
  submittedAt: string | null;
  lastUpdatedBy: unknown;
  lastUpdatedAt: string | null;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.batchType = payload?.batchType ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.formStatus = String(payload?.formStatus ?? payload?.status ?? "");
    this.subType = payload?.subType ?? "";
    this.motorIdNo = payload?.motorIdNo ?? "";
    this.motors = extractMotorsFromPayload(payload);
    this.sections = extractSectionsFromPayload(payload);
    this.motorStatuses = Array.isArray(payload?.motorStatuses)
      ? payload.motorStatuses.map((entry: any) => ({
          motorId: String(entry?.motorId ?? "").trim(),
          subType: entry?.subType != null ? String(entry.subType) : undefined,
          stfTestNo: String(entry?.stfTestNo ?? "").trim() || undefined,
          motorSubmissionType: entry?.motorSubmissionType,
          motorSubmissionStatus: entry?.motorSubmissionStatus,
        }))
      : [];
    this.pendingMotorCount = Number(payload?.pendingMotorCount ?? 0);
    this.approvedMotorCount = Number(payload?.approvedMotorCount ?? 0);
    this.rejectedMotorCount = Number(payload?.rejectedMotorCount ?? 0);
    this.inProgressMotorCount = Number(payload?.inProgressMotorCount ?? 0);
    this.totalMotorCount = Number(payload?.totalMotorCount ?? 0);
    this.allMotorsApproved = Boolean(payload?.allMotorsApproved);
    this.createdBy = payload?.createdBy ?? null;
    this.createdAt = payload?.createdAt ?? payload?.createdOn ?? null;
    this.submittedBy = payload?.submittedBy ?? null;
    this.submittedAt = payload?.submittedAt ?? payload?.submittedOn ?? null;
    this.lastUpdatedBy = payload?.lastUpdatedBy ?? payload?.updatedBy ?? null;
    this.lastUpdatedAt = payload?.lastUpdatedAt ?? payload?.updatedAt ?? payload?.updatedOn ?? null;

    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? this.formStatus,
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): STFDetailsModel {
    return new STFDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: STFDetailsModel) {
    return mapStaticTestFacilityDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      subType: model.subType,
      motorIdNo: model.motorIdNo,
      sections: model.sections,
      motors: model.motors,
    });
  }

  static toPlainRecord(
    model: STFDetailsModel | Record<string, unknown> | null | undefined,
  ): Record<string, unknown> | null {
    if (!model) return null;
    if (model instanceof STFDetailsModel) {
      return {
        formId: model.formId,
        batchId: model.batchId,
        batchType: model.batchType,
        subDepartmentId: model.subDepartmentId,
        formSubmissionType: model.formSubmissionType,
        formStatus: model.formStatus,
        subType: model.subType,
        motorIdNo: model.motorIdNo,
        sections: model.sections,
        motors: model.motors,
        motorStatuses: model.motorStatuses,
        pendingMotorCount: model.pendingMotorCount,
        approvedMotorCount: model.approvedMotorCount,
        rejectedMotorCount: model.rejectedMotorCount,
        inProgressMotorCount: model.inProgressMotorCount,
        totalMotorCount: model.totalMotorCount,
        allMotorsApproved: model.allMotorsApproved,
        createdBy: model.createdBy,
        createdAt: model.createdAt,
        submittedBy: model.submittedBy,
        submittedAt: model.submittedAt,
        lastUpdatedBy: model.lastUpdatedBy,
        lastUpdatedAt: model.lastUpdatedAt,
        workflowInsights: model.workflowInsights,
      };
    }
    return model as Record<string, unknown>;
  }
}

export class BEMMotorDetailsModel implements BemMotorDetailsResponse {
  bemMotorId: string;
  bemNo: string;
  stfTestNo?: string;
  motorCode?: string;
  subDepartmentId: number;
  subType: string;
  status: string;
  sections: LegacySectionSubmission[];
  staticTestingDetails?: {
    [FORM_SECTIONS_KEY]?: LegacySectionSubmission[];
    [key: string]: unknown;
  };
  createdBy: unknown;
  createdAt: string | null;
  submittedBy: unknown;
  submittedAt: string | null;
  lastUpdatedBy: unknown;
  lastUpdatedAt: string | null;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.bemMotorId = payload?.bemMotorId ?? payload?.id ?? "";
    this.bemNo = payload?.bemNo ?? payload?.motorCode ?? payload?.motorId ?? "";
    this.motorCode = payload?.motorCode;
    this.stfTestNo = payload?.stfTestNo;
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.subType = payload?.subType ?? "BEM";
    this.status = payload?.status ?? payload?.formStatus ?? "";
    this.sections = extractSectionsFromPayload(payload);
    this.staticTestingDetails = payload?.staticTestingDetails;
    this.createdBy = payload?.createdBy ?? null;
    this.createdAt = payload?.createdAt ?? payload?.createdOn ?? null;
    this.submittedBy = payload?.submittedBy ?? null;
    this.submittedAt = payload?.submittedAt ?? payload?.submittedOn ?? null;
    this.lastUpdatedBy = payload?.lastUpdatedBy ?? payload?.updatedBy ?? null;
    this.lastUpdatedAt = payload?.lastUpdatedAt ?? payload?.updatedAt ?? payload?.updatedOn ?? null;

    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? this.status,
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): BEMMotorDetailsModel {
    return new BEMMotorDetailsModel(apiResponse?.data ?? {});
  }
}

// ============================================================================
// Payload Extraction & API Transformation Helpers
// ============================================================================

const extractMotorsFromPayload = (
  payload: any,
): Array<{
  motorId: string;
  subType: string;
  stfTestNo?: string;
  motorSubmissionType?: StfMotorSubmissionType;
  motorSubmissionStatus?: StfMotorSubmissionStatus;
  staticTestingDetails: Record<string, unknown>;
}> => {
  const motors = payload?.motors;
  if (!Array.isArray(motors)) return [];

  return motors
    .map((motor) => {
      const motorId = String(motor?.motorId ?? "").trim();
      if (!motorId) return null;
      return {
        motorId,
        subType: String(motor?.subType ?? ""),
        stfTestNo: String(motor?.stfTestNo ?? "").trim(),
        motorSubmissionType: motor?.motorSubmissionType,
        motorSubmissionStatus: motor?.motorSubmissionStatus,
        staticTestingDetails: motor?.staticTestingDetails ?? {},
      };
    })
    .filter(Boolean) as Array<{
    motorId: string;
    subType: string;
    stfTestNo: string;
    motorSubmissionType?: StfMotorSubmissionType;
    motorSubmissionStatus?: StfMotorSubmissionStatus;
    staticTestingDetails: Record<string, unknown>;
  }>;
};

const extractSectionsFromPayload = (payload: any): LegacySectionSubmission[] => {
  if (Array.isArray(payload?.sections) && payload.sections.length > 0) {
    return payload.sections;
  }

  if (Array.isArray(payload?.staticTestingDetails?.formSections)) {
    return payload.staticTestingDetails.formSections;
  }

  const motors = extractMotorsFromPayload(payload);
  if (motors.length > 0) {
    const formSections = motors[0]?.staticTestingDetails?.[FORM_SECTIONS_KEY];
    if (Array.isArray(formSections) && formSections.length > 0) {
      return formSections as LegacySectionSubmission[];
    }
  }

  return [];
};

// ============================================================================
// STF & BEM Display Transformation Helpers
// ============================================================================

export type StfMotorDetailView = {
  motorId: string;
  subType: string;
  subTypeLabel: string;
  stfTestNo?: string;
  motorSubmissionType?: StfMotorSubmissionType;
  motorSubmissionStatus?: StfMotorSubmissionStatus;
  rejectionReason?: string | null;
  sections: CasePrepDetailSection[];
  stfData: StfMotorData;
};

export type StfMotorCounts = {
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  totalMotorCount: number;
};

export type StfDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  bemNo?: string;
  stfTestNo?: string;
  formSubmissionType?: string;
  status?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  motors: StfMotorDetailView[];
  motorCounts?: StfMotorCounts;
};

export const isStfMotorApproverTabDisabled = (
  status?: StfMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return !normalized || normalized === "TO_BE_INITIATED";
};

export const isStfMotorApproverActionable = (
  status?: StfMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

/** Entire form can be approved/rejected once ready for complete approval. */
export const canApproverActionEntireStfForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: StfMotorSubmissionStatus | string | null }>;
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

const normalizeStfDetailSections = (
  sections: CasePrepDetailSection[],
): CasePrepDetailSection[] =>
  // Preserve first-row / API key order (avoid A–Z sort from shared parser).
  sections.map((section) => ({
    ...section,
    tables: section.tables.map((table) => {
      const preferred: string[] = [];
      const seen = new Set<string>();
      table.rows.forEach((row) => {
        Object.keys(row ?? {}).forEach((key) => {
          if (key.startsWith("_") || key.endsWith("__fieldType") || seen.has(key)) return;
          seen.add(key);
          preferred.push(key);
        });
      });
      if (!preferred.length) return table;
      const columnLabels = Object.fromEntries(
        preferred.map((column) => [
          column,
          table.columnLabels[column] ?? formatCasePrepSectionLabel(column),
        ]),
      );
      return { ...table, columnLabels };
    }),
  }));

const parseStfDisplaySections = (
  sections: unknown[] | undefined,
): CasePrepDetailSection[] => {
  const parsed = (sections ?? [])
    .map((section) => {
      const block = section as LegacySectionSubmission;
      return parseCastingCuringSectionData(String(block.sectionId ?? ""), block.sectionData);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

  return normalizeStfDetailSections(parsed);
};

const parseStfStructuredDetails = (
  details: Record<string, unknown>,
): CasePrepDetailSection[] => {
  const parsed = Object.entries(details)
    .filter(([key]) => key !== FORM_SECTIONS_KEY)
    .map(([key, value]) => {
      if (Array.isArray(value)) return parseCastingCuringSectionData(key, value);
      if (value && typeof value === "object") return parseCastingCuringSectionData(key, [value]);
      return parseCastingCuringSectionData(key, [{ [key]: value }]);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

  return normalizeStfDetailSections(parsed);
};

const resolveStfMotorSections = (
  motor: { staticTestingDetails?: Record<string, unknown> },
  legacySections?: LegacySectionSubmission[],
): CasePrepDetailSection[] => {
  const details = motor.staticTestingDetails ?? {};
  const formSections = details[FORM_SECTIONS_KEY];

  if (Array.isArray(formSections) && formSections.length > 0) {
    return parseStfDisplaySections(formSections as unknown[]);
  }

  if (legacySections?.length) {
    return parseStfDisplaySections(legacySections as unknown[]);
  }

  const structuredKeys = Object.keys(details).filter((key) => key !== FORM_SECTIONS_KEY);
  if (structuredKeys.length > 0) {
    return parseStfStructuredDetails(details);
  }

  return [];
};

const formatStfSubTypeLabel = (subType?: string | null) => {
  const normalized = subType ? mapStfSubType(subType) : null;
  if (normalized === "BEM") return "BEM";
  if (normalized === "MAIN_MOTOR") return "Main Motor";
  return subType ? String(subType) : "Motor";
};

export const mapStfDetailsForDisplay = (
  data: Record<string, unknown> | STFDetailsModel | null | undefined,
): StfDetailView | null => {
  const plain = data instanceof STFDetailsModel ? STFDetailsModel.toPlainRecord(data) : data;
  if (!plain) return null;

  const root = plain as Record<string, unknown>;
  const legacySections = Array.isArray(root.sections)
    ? (root.sections as LegacySectionSubmission[])
    : undefined;
  const rawMotors = Array.isArray(root.motors) ? root.motors : [];
  const rawMotorStatuses = Array.isArray(root.motorStatuses) ? root.motorStatuses : [];
  const workflowInsights = root.workflowInsights as Record<string, unknown> | undefined;
  const statusById = mapStfMotorStatusesFromApi(root);
  const stfTestNoById = mapStfTestNoByMotorIdFromApi(root);

  type RawMotorEntry = {
    motorId?: string;
    subType?: string;
    stfTestNo?: string;
    motorSubmissionType?: StfMotorSubmissionType;
    motorSubmissionStatus?: StfMotorSubmissionStatus;
    staticTestingDetails?: Record<string, unknown>;
  };

  const buildMotorDetailView = (
    motorId: string,
    statusEntry: RawMotorEntry | undefined,
    dataEntry: RawMotorEntry | undefined,
    legacySectionsForMotor?: LegacySectionSubmission[],
  ): StfMotorDetailView | null => {
    if (!motorId) return null;

    const statusMeta = statusById[motorId];
    const subType = String(statusEntry?.subType ?? dataEntry?.subType ?? root.subType ?? "").trim();
    const schemaSubType = mapStfSubType(subType);
    const stfData = parseStfMotorDataFromApi(dataEntry ?? null, schemaSubType);
    const sections = dataEntry
      ? resolveStfMotorSections(dataEntry, legacySectionsForMotor)
      : [];
    const stfTestNo =
      String(
        dataEntry?.stfTestNo ?? statusEntry?.stfTestNo ?? stfTestNoById[motorId] ?? "",
      ).trim() || undefined;

    return {
      motorId,
      subType,
      subTypeLabel: formatStfSubTypeLabel(subType),
      stfTestNo,
      motorSubmissionType:
        statusMeta?.motorSubmissionType ??
        statusEntry?.motorSubmissionType ??
        dataEntry?.motorSubmissionType,
      motorSubmissionStatus:
        statusMeta?.motorSubmissionStatus ??
        statusEntry?.motorSubmissionStatus ??
        dataEntry?.motorSubmissionStatus,
      rejectionReason: statusMeta?.rejectionReason ?? null,
      sections,
      stfData,
    };
  };

  // Details / approver navigation: only motors present in `motors[]`
  // (submitted / saved with form data). `motorStatuses[]` still supplies status
  // for those motors, but TO_BE_INITIATED entries not in `motors[]` are omitted.
  const statusEntryById = new Map<string, RawMotorEntry>();
  rawMotorStatuses.forEach((statusRow) => {
    const statusEntry = statusRow as RawMotorEntry;
    const motorId = String(statusEntry.motorId ?? "").trim();
    if (motorId) statusEntryById.set(motorId, statusEntry);
  });

  let motors: StfMotorDetailView[] = rawMotors
    .map((motor, index) => {
      const entry = motor as RawMotorEntry;
      const motorId = String(entry.motorId ?? "").trim();
      return buildMotorDetailView(
        motorId,
        statusEntryById.get(motorId),
        entry,
        index === 0 ? legacySections : undefined,
      );
    })
    .filter((motor) => motor != null) as StfMotorDetailView[];

  if (!motors.length && legacySections?.length) {
    const legacyMotorId = String(root.motorIdNo ?? root.motorId ?? "Motor").trim();
    const statusMeta = statusById[legacyMotorId];
    motors.push({
      motorId: legacyMotorId,
      subType: String(root.subType ?? ""),
      subTypeLabel: formatStfSubTypeLabel(String(root.subType ?? "")),
      stfTestNo:
        String(
          stfTestNoById[legacyMotorId] ?? (root as { stfTestNo?: string }).stfTestNo ?? "",
        ).trim() || undefined,
      motorSubmissionType: statusMeta?.motorSubmissionType,
      motorSubmissionStatus: statusMeta?.motorSubmissionStatus,
      rejectionReason: statusMeta?.rejectionReason ?? null,
      sections: parseStfDisplaySections(legacySections as unknown[]),
      stfData: parseStfMotorDataFromApi(
        { staticTestingDetails: { [FORM_SECTIONS_KEY]: legacySections } },
        mapStfSubType(String(root.subType ?? "")),
      ),
    });
  }

  const derivedCounts: StfMotorCounts = {
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

  return {
    formId: String(root.formId ?? ""),
    batchId: String(root.batchId ?? ""),
    batchType: root.batchType != null ? String(root.batchType) : "",
    formSubmissionType:
      root.formSubmissionType != null ? String(root.formSubmissionType) : undefined,
    status: String(root.formStatus ?? workflowInsights?.currentStatus ?? root.status ?? ""),
    createdBy: mapCastingCuringPersonLabel(root.createdBy),
    createdAt:
      root.createdAt != null
        ? String(root.createdAt)
        : root.createdOn != null
          ? String(root.createdOn)
          : null,
    submittedBy: mapCastingCuringPersonLabel(root.submittedBy),
    submittedAt:
      root.submittedAt != null
        ? String(root.submittedAt)
        : root.submittedOn != null
          ? String(root.submittedOn)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(root.lastUpdatedBy ?? root.updatedBy),
    lastUpdatedAt:
      root.lastUpdatedAt != null
        ? String(root.lastUpdatedAt)
        : root.updatedAt != null
          ? String(root.updatedAt)
          : root.updatedOn != null
            ? String(root.updatedOn)
            : null,
    motors,
    motorCounts: {
      pendingMotorCount: Number(root.pendingMotorCount ?? derivedCounts.pendingMotorCount),
      approvedMotorCount: Number(root.approvedMotorCount ?? derivedCounts.approvedMotorCount),
      rejectedMotorCount: Number(root.rejectedMotorCount ?? derivedCounts.rejectedMotorCount),
      inProgressMotorCount: Number(root.inProgressMotorCount ?? derivedCounts.inProgressMotorCount),
      totalMotorCount: Number(root.totalMotorCount ?? derivedCounts.totalMotorCount),
    },
  };
};

export const mapBemDetailsForDisplay = (
  data: Record<string, unknown> | BEMMotorDetailsModel | null | undefined,
): StfDetailView | null => {
  if (!data) return null;

  const root =
    data instanceof BEMMotorDetailsModel
      ? ({
          bemMotorId: data.bemMotorId,
          bemNo: data.bemNo,
          motorId: data.bemNo,
          motorCode: data.motorCode,
          stfTestNo: data.stfTestNo,
          status: data.status,
          sections: data.sections,
          staticTestingDetails: data.staticTestingDetails,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          createdOn: data.createdAt,
          submittedBy: data.submittedBy,
          submittedAt: data.submittedAt,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.lastUpdatedAt,
          updatedBy: data.lastUpdatedBy,
          updatedOn: data.lastUpdatedAt,
          workflowInsights: data.workflowInsights,
        } as Record<string, unknown>)
      : (data as Record<string, unknown>);

  const bemNo = String(root.bemNo ?? root.motorId ?? root.motorCode ?? "BEM Motor").trim();
  const stfTestNo = String(root.stfTestNo ?? "").trim() || undefined;
  const legacySections = Array.isArray(root.sections)
    ? (root.sections as LegacySectionSubmission[])
    : undefined;
  const staticTestingDetails =
    (root.staticTestingDetails as Record<string, unknown> | undefined) ??
    (legacySections?.length ? { [FORM_SECTIONS_KEY]: legacySections } : undefined);

  const bemMotorPayload = {
    staticTestingDetails: staticTestingDetails ?? {},
    sections: legacySections,
  };

  // Same section resolution as ACEM motors — supports formSections and nested DTO shapes.
  const displaySections = resolveStfMotorSections(
    { staticTestingDetails: staticTestingDetails ?? {} },
    legacySections,
  );

  return {
    formId: String(root.bemMotorId ?? root.id ?? root.motorId ?? bemNo),
    batchId: "",
    batchType: "BEM",
    bemNo,
    stfTestNo,
    status: String(
      root.status ??
        (root.workflowInsights as Record<string, unknown> | undefined)?.currentStatus ??
        "",
    ),
    createdBy: mapCastingCuringPersonLabel(root.createdBy),
    createdAt:
      root.createdAt != null
        ? String(root.createdAt)
        : root.createdOn != null
          ? String(root.createdOn)
          : null,
    submittedBy: mapCastingCuringPersonLabel(root.submittedBy),
    submittedAt:
      root.submittedAt != null
        ? String(root.submittedAt)
        : root.submittedOn != null
          ? String(root.submittedOn)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(root.lastUpdatedBy ?? root.updatedBy),
    lastUpdatedAt:
      root.lastUpdatedAt != null
        ? String(root.lastUpdatedAt)
        : root.updatedAt != null
          ? String(root.updatedAt)
          : root.updatedOn != null
            ? String(root.updatedOn)
            : null,
    motors: [
      {
        motorId: bemNo,
        subType: "BEM",
        subTypeLabel: "BEM",
        stfTestNo,
        motorSubmissionStatus: (String(root.status ?? "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_") || undefined) as StfMotorSubmissionStatus | undefined,
        sections: displaySections,
        stfData: parseStfMotorDataFromApi(bemMotorPayload, "BEM"),
      },
    ],
  };
};
