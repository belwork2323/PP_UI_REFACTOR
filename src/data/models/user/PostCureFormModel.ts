import {
  createPostCureData,
  formatPostCureMotorOperationLabel,
} from "../../../hooks/user/manufacturing/postCureConfig";
import type { CasePrepDetailSection } from "./CasePreparationFormModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import {
  buildPostCureMotorDetailsPayload,
  buildPostCureSectionsPayload,
  createEmptyPostCureMotorData,
  formatPostCureMotorReceiptDateForApi,
  formatPostCureMotorReceiptDateForUi,
  parsePostCureMotorDataFromApi,
  postCureMotorDataHasUserInput,
  resolvePostCureDataVariant,
  type InhibitionDetailsApi,
  type LooseFlapFillingDetailsApi,
  type PostCureMotorData,
} from "./PostCureMotorDataModel";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";

export type PostCureMotorSession = {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
  formLoaded: boolean;
  postCureData: PostCureMotorData;
};

export type PostCureMotorSubmissionType = "DRAFT" | "SUBMIT";
export type PostCureMotorSubmissionStatus =
  "TO_BE_INITIATED" | "IN_PROGRESS" | "WAITING_FOR_APPROVAL" | "APPROVED" | "REJECTED";

export type PostCureMotorStatusMeta = {
  motorSubmissionType?: PostCureMotorSubmissionType;
  motorSubmissionStatus: PostCureMotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const isPostCureMotorLocked = (status?: PostCureMotorSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isPostCureMotorEditable = (status?: PostCureMotorSubmissionStatus | string | null) =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS" || status === "REJECTED";

export const isPostCureMotorApproverTabDisabled = (
  status?: PostCureMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return !normalized || normalized === "TO_BE_INITIATED";
};

export const isPostCureMotorApproverActionable = (
  status?: PostCureMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

/** Entire form can be approved/rejected once ready for complete approval (same as Case Prep). */
export const canApproverActionEntirePostCureForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: PostCureMotorSubmissionStatus | string | null }>;
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

  // Waiting for Approval means motors are done — show Approve / Reject Form.
  if (statusUpper === "WAITING_FOR_APPROVAL" || status === OPERATION_STATUS.WAITING_FOR_APPROVAL) {
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

export const getPostCureBatchStatusLabel = (status: unknown): string => String(status ?? "").trim();

export type PostCureMotorCounts = {
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  totalMotorCount: number;
};

export const areAllPostCureMotorsApproved = (
  motorStatusById: Record<string, PostCureMotorStatusMeta>,
): boolean => {
  const entries = Object.values(motorStatusById);
  if (entries.length === 0) return false;
  return entries.every(
    (meta) => String(meta.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
};

export const normalizePostCureMotorStatus = (value: unknown): PostCureMotorSubmissionStatus => {
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

export const normalizePostCureMotorSubmissionType = (
  value: unknown,
): PostCureMotorSubmissionType | undefined => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "DRAFT" || raw === "SUBMIT") return raw;
  return undefined;
};

export const mapPostCureMotorStatusesFromApi = (
  details: any,
): Record<string, PostCureMotorStatusMeta> => {
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, PostCureMotorStatusMeta> = {};

  const rootStatuses = Array.isArray(root?.motorStatuses)
    ? root.motorStatuses
    : Array.isArray(details?.motorStatuses)
      ? details.motorStatuses
      : [];

  rootStatuses.forEach((entry: any) => {
    const motorId = String(entry?.motorId ?? "").trim();
    if (!motorId) return;
    statusById[motorId] = {
      motorSubmissionType: normalizePostCureMotorSubmissionType(entry?.motorSubmissionType),
      motorSubmissionStatus: normalizePostCureMotorStatus(entry?.motorSubmissionStatus),
      submittedAt: entry?.submittedAt ?? null,
      reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
      reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
      remarks: entry?.remarks ?? null,
      rejectionReason: entry?.rejectionReason ?? null,
    };
  });

  const payload = details?.postCureDetails ?? details?.preparationDetails ?? details ?? {};
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];
  rawMotors.forEach((motor: any) => {
    const motorId = String(motor?.motorId ?? "").trim();
    if (!motorId) return;
    const existing = statusById[motorId];
    statusById[motorId] = {
      motorSubmissionType:
        normalizePostCureMotorSubmissionType(motor?.motorSubmissionType) ??
        existing?.motorSubmissionType,
      motorSubmissionStatus: normalizePostCureMotorStatus(
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

export type PostCureFormState = ReturnType<typeof createPostCureData>;

export type PostCureDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  operationType?: string;
  status?: string;
  batchType?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motorId?: string;
  motorReceiptDate?: string;
  operation?: string;
  inhibitorType?: string;
  looseFlapFillingDetails?: LooseFlapFillingDetailsApi;
  inhibitionDetails?: InhibitionDetailsApi;
  motors?: Array<{
    motorId: string;
    motorReceiptDate?: string;
    operation?: string;
    inhibitorType?: string;
    operationType?: string;
    motorSubmissionType?: PostCureMotorSubmissionType;
    motorSubmissionStatus?: PostCureMotorSubmissionStatus;
    rejectionReason?: string | null;
    looseFlapFillingDetails?: LooseFlapFillingDetailsApi;
    inhibitionDetails?: InhibitionDetailsApi;
  }>;
  motorStatuses?: Array<{
    motorId: string;
    motorSubmissionType?: PostCureMotorSubmissionType;
    motorSubmissionStatus?: PostCureMotorSubmissionStatus;
    submittedAt?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    remarks?: string | null;
    rejectionReason?: string | null;
  }>;
  allMotorsApproved?: boolean;
  pendingMotorCount?: number;
  approvedMotorCount?: number;
  rejectedMotorCount?: number;
  inProgressMotorCount?: number;
  totalMotorCount?: number;
};

export type PostCureMotorPayload = {
  motorId: string;
  motorReceiptDate: string;
  looseFlapFillingDetails?: LooseFlapFillingDetailsApi;
  inhibitionDetails?: InhibitionDetailsApi;
  motorSubmissionType?: PostCureMotorSubmissionType;
};

export type PostCureFormBody = {
  motors: PostCureMotorPayload[];
};

export const createDefaultPostCureFormState = (): PostCureFormState => createPostCureData();

export const createEmptyPostCureMotorSession = (
  motorId: string,
  motorReceiptDate: string,
  operation: string,
  inhibitorType: string,
): PostCureMotorSession | null => {
  const variant = resolvePostCureDataVariant(operation, inhibitorType);
  if (!variant) return null;

  return {
    motorId,
    motorReceiptDate,
    operation,
    inhibitorType,
    formLoaded: true,
    postCureData: createEmptyPostCureMotorData(variant),
  };
};

export const hydratePostCureMotorSession = (
  motor: Omit<PostCureMotorSession, "postCureData" | "formLoaded"> & {
    apiMotor?: Record<string, unknown>;
  },
): PostCureMotorSession | null => {
  const variant = resolvePostCureDataVariant(motor.operation, motor.inhibitorType);
  if (!variant) return null;

  const postCureData = motor.apiMotor
    ? parsePostCureMotorDataFromApi(motor.apiMotor, variant)
    : createEmptyPostCureMotorData(variant);

  return {
    motorId: motor.motorId,
    motorReceiptDate: motor.motorReceiptDate,
    operation: motor.operation,
    inhibitorType: motor.inhibitorType,
    formLoaded: true,
    postCureData,
  };
};

const mapApiOperationType = (operationType: string) => {
  if (operationType === "LOOSE_FLAP_FILLING") return "loose-flap-filling";
  if (operationType === "INHIBITION") return "inhibition";
  return "";
};

const mapApiInhibitorType = (inhibitorType: string) => {
  if (inhibitorType === "HEMCOAT_3K") return "Hemcoat-3K";
  if (inhibitorType === "NOT_APPLICABLE") return "not-applicable";
  return inhibitorType;
};

const mapDetailsMotorToSession = (
  motor: {
    motorId?: string;
    motorReceiptDate?: string;
    operation?: string;
    inhibitorType?: string;
    operationType?: string;
    looseFlapFillingDetails?: LooseFlapFillingDetailsApi;
    inhibitionDetails?: InhibitionDetailsApi;
  },
  fallback?: { operation?: string; inhibitorType?: string },
): PostCureMotorSession | null => {
  const motorId = String(motor?.motorId ?? "").trim();
  if (!motorId) return null;

  const operationType = String(motor?.operationType ?? "").trim();
  const operation =
    String(motor?.operation ?? "").trim() ||
    mapApiOperationType(operationType) ||
    String(fallback?.operation ?? "");

  const inhibitorType =
    mapApiInhibitorType(String(motor?.inhibitorType ?? "").trim()) ||
    String(fallback?.inhibitorType ?? "");

  return hydratePostCureMotorSession({
    motorId,
    motorReceiptDate: formatPostCureMotorReceiptDateForUi(motor?.motorReceiptDate),
    operation,
    inhibitorType,
    apiMotor: motor as Record<string, unknown>,
  });
};

export const mapPostCureDetailsToFormState = (
  details: Partial<PostCureDetails>,
): PostCureFormState => {
  const defaults = createDefaultPostCureFormState();
  const fallback = {
    operation: String(details?.operation ?? ""),
    inhibitorType: mapApiInhibitorType(String(details?.inhibitorType ?? "").trim()),
  };

  const rawMotors = Array.isArray(details?.motors) ? details.motors : [];
  const motors =
    rawMotors.length > 0
      ? rawMotors
          .map((motor) => mapDetailsMotorToSession(motor, fallback))
          .filter((motor): motor is PostCureMotorSession => motor !== null)
      : details?.motorId
        ? [mapDetailsMotorToSession(details, fallback)].filter(
            (motor): motor is PostCureMotorSession => motor !== null,
          )
        : [];

  const hasLoadedMotors = motors.some((motor) => motor.formLoaded);

  return {
    ...defaults,
    formLoaded: hasLoadedMotors,
    motors,
  };
};

export const mapPostCureFormStateToPayload = (
  form: PostCureFormState,
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: PostCureMotorSubmissionType;
  },
): PostCureFormBody => {
  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  return {
    motors: (form.motors ?? [])
      .filter((motor) => !targetIds || targetIds.has(motor.motorId))
      .map((motor) => ({
        motorId: String(motor.motorId ?? ""),
        motorReceiptDate: formatPostCureMotorReceiptDateForApi(motor.motorReceiptDate),
        ...(motor.formLoaded ? buildPostCureMotorDetailsPayload(motor.postCureData) : {}),
        ...(options?.motorSubmissionType
          ? { motorSubmissionType: options.motorSubmissionType }
          : {}),
      })),
  };
};

export const hasAnyPostCureValue = (form: PostCureFormState) =>
  (form.motors ?? []).some(
    (motor) =>
      [motor.motorId, motor.motorReceiptDate, motor.operation, motor.inhibitorType].some(
        (value) => String(value ?? "").trim().length > 0,
      ) || postCureMotorDataHasUserInput(motor.postCureData),
  );

/** Display column order for Post-Cure detail tables (avoids alphabetical fallback). */
const POST_CURE_COLUMN_PRIORITY = [
  "srNo",
  "SR_NO",
  "sr_no",
  "PARAMETER",
  "SPECIFICATION",
  "RESULT",
  "QC_REPORT",
  "QUALIFICATION_QC_REPORT",
  "LOCATION",
  "FROM_DATE",
  "TO_DATE",
  "QTY_FILLED",
  "QTY_APPLIED",
  "OBSERVATIONS",
  "INGREDIENT",
  "PARTS_BY_WEIGHT",
  "MFG_LOT",
  "QUANTITY",
  "QTY_TAKEN",
];

export const orderPostCureDisplayColumns = (columns: string[]): string[] => {
  const visible = columns.filter((col) => !col.startsWith("_") && !col.endsWith("__fieldType"));
  return [...visible].sort((a, b) => {
    const ai = POST_CURE_COLUMN_PRIORITY.indexOf(a);
    const bi = POST_CURE_COLUMN_PRIORITY.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
};

export type PostCureMotorDetailView = {
  motorId: string;
  motorReceiptDate: string;
  operationLabel: string;
  motorSubmissionType?: PostCureMotorSubmissionType;
  motorSubmissionStatus?: PostCureMotorSubmissionStatus;
  rejectionReason?: string | null;
  sections: CasePrepDetailSection[];
  postCureData: PostCureMotorData;
};

export type PostCureDetailView = {
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
  motors: PostCureMotorDetailView[];
  motorCounts?: PostCureMotorCounts;
};

const parsePostCureDisplaySections = (sections: unknown[] | undefined): CasePrepDetailSection[] =>
  (sections ?? [])
    .map((section) => {
      const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
      return parseCastingCuringSectionData(String(block.sectionId ?? ""), block.sectionData);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

const resolvePostCureMotorSections = (motor: Record<string, unknown>): CasePrepDetailSection[] => {
  if (Array.isArray(motor.sections)) {
    return parsePostCureDisplaySections(motor.sections as unknown[]);
  }

  const operation =
    String(motor.operation ?? "").trim() ||
    mapApiOperationType(String(motor.operationType ?? "").trim());
  const inhibitorType =
    mapApiInhibitorType(String(motor.inhibitorType ?? "").trim()) ||
    String(motor.inhibitorType ?? "").trim();
  const variant = resolvePostCureDataVariant(operation, inhibitorType);

  if (variant && (motor.looseFlapFillingDetails || motor.inhibitionDetails || motor.details)) {
    const apiMotor = {
      ...((motor.details as Record<string, unknown> | undefined) ?? {}),
      looseFlapFillingDetails:
        motor.looseFlapFillingDetails ??
        (motor.details as Record<string, unknown> | undefined)?.looseFlapFillingDetails,
      inhibitionDetails:
        motor.inhibitionDetails ??
        (motor.details as Record<string, unknown> | undefined)?.inhibitionDetails,
      sections: motor.sections,
    };
    const data = parsePostCureMotorDataFromApi(apiMotor, variant);
    return parsePostCureDisplaySections(buildPostCureSectionsPayload(data) as unknown[]);
  }

  const details = (motor.details ?? motor) as Record<string, unknown>;
  if (Array.isArray(details.sections)) {
    return parsePostCureDisplaySections(details.sections as unknown[]);
  }

  return [];
};

export const mapPostCureDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): PostCureDetailView | null => {
  if (!data) return null;

  const details = (data.postCureDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];
  const motorStatuses = mapPostCureMotorStatusesFromApi(data);

  const motors: PostCureMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const src = (entry.details ?? entry) as Record<string, unknown>;
      const motorId = String(entry.motorId ?? src.motorId ?? "").trim();
      const statusMeta = motorStatuses[motorId];
      const operation =
        String(src.operation ?? "").trim() ||
        mapApiOperationType(String(src.operationType ?? "").trim());
      const inhibitorType =
        mapApiInhibitorType(String(src.inhibitorType ?? "").trim()) ||
        String(src.inhibitorType ?? "").trim();

      const variant = resolvePostCureDataVariant(operation, inhibitorType);
      const apiMotor = {
        ...src,
        looseFlapFillingDetails:
          entry.looseFlapFillingDetails ??
          (src.looseFlapFillingDetails as Record<string, unknown> | undefined),
        inhibitionDetails:
          entry.inhibitionDetails ?? (src.inhibitionDetails as Record<string, unknown> | undefined),
        sections: entry.sections ?? src.sections,
      };
      const postCureData = parsePostCureMotorDataFromApi(apiMotor, variant ?? "loose-flap-filling");

      return {
        motorId,
        motorReceiptDate: formatPostCureMotorReceiptDateForUi(src.motorReceiptDate),
        operationLabel: formatPostCureMotorOperationLabel(operation, inhibitorType),
        motorSubmissionType:
          statusMeta?.motorSubmissionType ??
          normalizePostCureMotorSubmissionType(entry.motorSubmissionType),
        motorSubmissionStatus:
          statusMeta?.motorSubmissionStatus ??
          normalizePostCureMotorStatus(entry.motorSubmissionStatus),
        rejectionReason:
          statusMeta?.rejectionReason ?? (entry.rejectionReason as string | null) ?? null,
        sections: resolvePostCureMotorSections(entry),
        postCureData,
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  const derivedCounts: PostCureMotorCounts = {
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
    Partial<PostCureMotorCounts> | undefined;

  return {
    formId: String(data.formId ?? details.formId ?? ""),
    batchId: String(data.batchId ?? details.batchId ?? ""),
    batchType: String(data.batchType ?? details.batchType ?? ""),
    status:
      data.status != null
        ? String(data.status)
        : data.pcStatus != null
          ? String(data.pcStatus)
          : details.status != null
            ? String(details.status)
            : details.pcStatus != null
              ? String(details.pcStatus)
              : undefined,
    formSubmissionType: String(data.formSubmissionType ?? details.formSubmissionType ?? ""),
    createdBy: mapCastingCuringPersonLabel(data.createdBy ?? details.createdBy),
    createdAt:
      data.createdAt != null
        ? String(data.createdAt)
        : details.createdAt != null
          ? String(details.createdAt)
          : null,
    submittedBy: mapCastingCuringPersonLabel(data.submittedBy ?? details.submittedBy),
    submittedAt:
      data.submittedAt != null
        ? String(data.submittedAt)
        : details.submittedAt != null
          ? String(details.submittedAt)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(data.lastUpdatedBy ?? details.lastUpdatedBy),
    lastUpdatedAt:
      data.lastUpdatedAt != null
        ? String(data.lastUpdatedAt)
        : details.lastUpdatedAt != null
          ? String(details.lastUpdatedAt)
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

export class PostCureSubmitResponseModel {
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
    return new PostCureSubmitResponseModel(data);
  }
}

export class PostCureDetailsModel {
  static fromApi(data: any): PostCureDetails {
    const payload = data?.data ?? data ?? {};
    const operationType = String(payload?.operationType ?? "").trim();
    const inhibitorType = String(payload?.inhibitorType ?? "").trim();

    const operation = mapApiOperationType(operationType) || String(payload?.operation ?? "");
    const mappedInhibitorType =
      mapApiInhibitorType(inhibitorType) || String(payload?.inhibitorType ?? "");

    const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      operationType: operationType || undefined,
      status: payload?.status != null ? String(payload.status) : undefined,
      batchType: payload?.batchType != null ? String(payload.batchType) : undefined,
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
      motorId: String(payload?.motorId ?? ""),
      motorReceiptDate: formatPostCureMotorReceiptDateForUi(payload?.motorReceiptDate),
      operation,
      inhibitorType: mappedInhibitorType,
      motors:
        rawMotors.length > 0
          ? rawMotors.map((motor: any) => ({
              motorId: String(motor?.motorId ?? ""),
              motorReceiptDate: formatPostCureMotorReceiptDateForUi(motor?.motorReceiptDate),
              operation: mapApiOperationType(String(motor?.operationType ?? "")) || operation,
              inhibitorType:
                mapApiInhibitorType(String(motor?.inhibitorType ?? "")) || mappedInhibitorType,
              operationType: String(motor?.operationType ?? ""),
              motorSubmissionType: normalizePostCureMotorSubmissionType(motor?.motorSubmissionType),
              motorSubmissionStatus: normalizePostCureMotorStatus(motor?.motorSubmissionStatus),
              rejectionReason: motor?.rejectionReason ?? null,
              looseFlapFillingDetails: motor?.looseFlapFillingDetails,
              inhibitionDetails: motor?.inhibitionDetails,
            }))
          : undefined,
      motorStatuses: Array.isArray(payload?.motorStatuses)
        ? payload.motorStatuses
            .map((entry: any) => ({
              motorId: String(entry?.motorId ?? "").trim(),
              motorSubmissionType: normalizePostCureMotorSubmissionType(entry?.motorSubmissionType),
              motorSubmissionStatus: normalizePostCureMotorStatus(entry?.motorSubmissionStatus),
              submittedAt: entry?.submittedAt ?? null,
              reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
              reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
              remarks: entry?.remarks ?? null,
              rejectionReason: entry?.rejectionReason ?? null,
            }))
            .filter((entry: { motorId: string }) => entry.motorId.length > 0)
        : undefined,
      allMotorsApproved: payload?.allMotorsApproved ?? undefined,
      pendingMotorCount: payload?.pendingMotorCount ?? undefined,
      approvedMotorCount: payload?.approvedMotorCount ?? undefined,
      rejectedMotorCount: payload?.rejectedMotorCount ?? undefined,
      inProgressMotorCount: payload?.inProgressMotorCount ?? undefined,
      totalMotorCount: payload?.totalMotorCount ?? undefined,
    };
  }
}
