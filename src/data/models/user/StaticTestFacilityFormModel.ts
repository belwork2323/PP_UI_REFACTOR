import { mapStfSubType, type StfSubType } from "../../../hooks/user/qualityControl/stfFlowConfig";
import {
  buildStfMotorStaticTestingDetails,
  createEmptyStfMotorData,
  parseStfMotorDataFromApi,
  stfMotorDataHasUserInput,
  type StfMotorData,
  type StfStaticTestingDetailsApi,
} from "./StfMotorDataModel";

export type { StfSubType };

export const FORM_SECTIONS_KEY = "formSections";

export type StfMotorSubmissionType = "DRAFT" | "SUBMIT";
export type StfMotorSubmissionStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type StfMotorStatusMeta = {
  motorSubmissionType?: StfMotorSubmissionType;
  motorSubmissionStatus: StfMotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

const normalizeStfMotorSubmissionType = (
  value?: string | null,
): StfMotorSubmissionType | undefined => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "DRAFT" || raw === "SUBMIT") return raw;
  return undefined;
};

const normalizeStfMotorSubmissionStatus = (value?: string | null): StfMotorSubmissionStatus => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "IN_PROGRESS";
  if (raw === "WAITING_FOR_APPROVAL") return "WAITING_FOR_APPROVAL";
  if (raw === "APPROVED") return "APPROVED";
  if (raw === "REJECTED") return "REJECTED";
  return "TO_BE_INITIATED";
};

export const isStfMotorEditable = (status?: StfMotorSubmissionStatus | string | null) => {
  const normalized = normalizeStfMotorSubmissionStatus(status);
  return (
    normalized === "TO_BE_INITIATED" || normalized === "IN_PROGRESS" || normalized === "REJECTED"
  );
};

export const mapStfMotorStatusesFromApi = (details: any): Record<string, StfMotorStatusMeta> => {
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, StfMotorStatusMeta> = {};

  const mergeStatusEntry = (motorId: string, entry: any) => {
    const id = String(motorId ?? "").trim();
    if (!id) return;
    const existing = statusById[id];
    statusById[id] = {
      motorSubmissionType:
        normalizeStfMotorSubmissionType(entry?.motorSubmissionType) ??
        existing?.motorSubmissionType,
      motorSubmissionStatus: normalizeStfMotorSubmissionStatus(
        entry?.motorSubmissionStatus ?? existing?.motorSubmissionStatus,
      ),
      submittedAt: entry?.submittedAt ?? existing?.submittedAt ?? null,
      reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? existing?.reviewedBy ?? null,
      reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? existing?.reviewedAt ?? null,
      remarks: entry?.remarks ?? existing?.remarks ?? null,
      rejectionReason: entry?.rejectionReason ?? existing?.rejectionReason ?? null,
    };
  };

  const recordCandidate =
    details?.motorStatuses &&
    !Array.isArray(details.motorStatuses) &&
    typeof details.motorStatuses === "object"
      ? details.motorStatuses
      : root?.motorStatuses &&
          !Array.isArray(root.motorStatuses) &&
          typeof root.motorStatuses === "object"
        ? root.motorStatuses
        : null;

  if (recordCandidate) {
    Object.entries(recordCandidate as Record<string, any>).forEach(([motorId, entry]) => {
      mergeStatusEntry(String(entry?.motorId ?? motorId), entry);
    });
  }

  const rootStatuses = Array.isArray(root?.motorStatuses)
    ? root.motorStatuses
    : Array.isArray(details?.motorStatuses)
      ? details.motorStatuses
      : [];

  rootStatuses.forEach((entry: any) => {
    mergeStatusEntry(String(entry?.motorId ?? ""), entry);
  });

  const rawMotors = Array.isArray(root?.motors)
    ? root.motors
    : Array.isArray(details?.motors)
      ? details.motors
      : [];

  rawMotors.forEach((motor: any) => {
    mergeStatusEntry(String(motor?.motorId ?? ""), motor);
  });

  return statusById;
};

/** Read per-motor STF Test No. from form/details (`motors[]` and `motorStatuses[]`). */
export const mapStfTestNoByMotorIdFromApi = (details: any): Record<string, string> => {
  const root = details?.data ?? details ?? {};
  const byId: Record<string, string> = {};

  const merge = (motorId: unknown, stfTestNo: unknown) => {
    const id = String(motorId ?? "").trim();
    const value = String(stfTestNo ?? "").trim();
    if (!id || !value) return;
    byId[id] = value;
  };

  const statusRows = Array.isArray(root?.motorStatuses)
    ? root.motorStatuses
    : Array.isArray(details?.motorStatuses)
      ? details.motorStatuses
      : [];
  statusRows.forEach((entry: any) => merge(entry?.motorId, entry?.stfTestNo));

  const motorRows = Array.isArray(root?.motors)
    ? root.motors
    : Array.isArray(details?.motors)
      ? details.motors
      : [];
  motorRows.forEach((entry: any) => merge(entry?.motorId, entry?.stfTestNo));

  return byId;
};

export const applyStfTestNoToFormMotors = (
  form: StaticTestFacilityFormState,
  stfTestNoById: Record<string, string>,
): StaticTestFacilityFormState => ({
  ...form,
  motors: (form.motors ?? []).map((motor) => ({
    ...motor,
    stfTestNo: String(motor.stfTestNo ?? stfTestNoById[motor.motorId] ?? "").trim(),
  })),
});

// ============================================================================
// Core Form & Session Types
// ============================================================================

export type StfMotorSession = {
  motorId: string;
  subType: StfSubType;
  stfTestNo?: string;
  formLoaded: boolean;
  stfData: StfMotorData;
};

export const createEmptyStfMotorSession = (
  motorId: string,
  subType: StfSubType,
): StfMotorSession => ({
  motorId,
  subType,
  stfTestNo: "",
  formLoaded: true,
  stfData: createEmptyStfMotorData(subType),
});

export const normalizeStfMotorSession = (
  motor: Partial<StfMotorSession> & { motorId: string; subType: StfSubType },
): StfMotorSession => {
  const subType = motor.subType;
  const base = createEmptyStfMotorSession(motor.motorId, subType);
  return {
    ...base,
    stfTestNo: String(motor.stfTestNo ?? "").trim(),
    formLoaded: motor.formLoaded ?? true,
    stfData: motor.stfData ?? base.stfData,
  };
};

export const createStfData = () => ({
  formLoaded: false,
  subType: null as StfSubType | null,
  motors: [] as StfMotorSession[],
  motorId: null as string | null,
  bemNo: null as string | null,
  stfTestNo: null as string | null,
});

export type StaticTestFacilityFormState = ReturnType<typeof createStfData>;

export const createDefaultStaticTestFacilityFormState = (): StaticTestFacilityFormState =>
  createStfData();

const hydrateStfMotorSessionFromApi = (
  motorId: string,
  subType: StfSubType,
  apiMotor?: Record<string, unknown> | null,
  stfTestNo?: string | null,
): StfMotorSession => ({
  motorId,
  subType,
  stfTestNo: String(stfTestNo ?? "").trim(),
  formLoaded: true,
  stfData: parseStfMotorDataFromApi(apiMotor ?? null, subType),
});

// ============================================================================
// 1. Generic STF Batch / Form Submission API Models & Mappers
// ============================================================================

export type StaticTestFacilityDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  subType?: StfSubType | string | null;
  motorIdNo?: string | null;
  sections?: FormSectionPayload[];
  motors?: Array<{
    motorId?: string;
    subType?: StfSubType | string | null;
    stfTestNo?: string | null;
    staticTestingDetails?: Record<string, unknown>;
  }>;
};

export type StfBatchMotorItem = {
  motorId: string;
  subType: StfSubType;
  stfTestNo?: string;
  motorSubmissionType?: StfMotorSubmissionType;
  staticTestingDetails: StfStaticTestingDetailsApi;
};

/** Payload structure for POST /api/v1/user/stf/create */
export type CreateStfBatchFormPayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: StfBatchMotorItem[];
};

/** Payload structure for PUT /api/v1/user/stf/update/{formId} */
export type UpdateStfBatchFormPayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: StfBatchMotorItem[];
};

export const mapStaticTestFacilityDetailsToFormState = (
  details: Partial<StaticTestFacilityDetails>,
): StaticTestFacilityFormState => {
  const defaults = createDefaultStaticTestFacilityFormState();
  const subType = details?.subType ? mapStfSubType(details.subType) : null;

  const motorsFromApi = Array.isArray(details?.motors) ? details.motors : [];
  const motors: StfMotorSession[] =
    motorsFromApi.length > 0
      ? motorsFromApi
          .map((motor) => {
            const motorId = String(motor?.motorId ?? "").trim();
            if (!motorId) return null;
            const motorSubType = motor?.subType
              ? mapStfSubType(motor.subType)
              : (subType ?? "MAIN_MOTOR");
            return hydrateStfMotorSessionFromApi(
              motorId,
              motorSubType,
              motor as Record<string, unknown>,
              (motor as { stfTestNo?: string })?.stfTestNo,
            );
          })
          .filter((motor): motor is StfMotorSession => Boolean(motor))
      : [];

  const legacySections = Array.isArray(details?.sections) ? details.sections : undefined;
  const legacyMotorId = String(details?.motorIdNo ?? "").trim();

  if (!motors.length && legacySections?.length && legacyMotorId) {
    motors.push(
      hydrateStfMotorSessionFromApi(
        legacyMotorId,
        subType ?? "MAIN_MOTOR",
        { staticTestingDetails: { [FORM_SECTIONS_KEY]: legacySections } },
      ),
    );
  }

  return {
    ...defaults,
    subType,
    formLoaded: motors.length > 0,
    motors,
  };
};

export const mapFormStateToCreateStfBatchPayload = (params: {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  formState: StaticTestFacilityFormState;
}): CreateStfBatchFormPayload => {
  const motors = (params.formState.motors ?? []).filter((motor) => motor.motorId.trim());

  return {
    batchId: params.batchId,
    subDepartmentId: params.subDepartmentId,
    formSubmissionType: params.formSubmissionType,
    motors: motors.map((motor) => ({
      motorId: motor.motorId,
      subType: motor.subType,
      stfTestNo: String(motor.stfTestNo ?? "").trim() || undefined,
      staticTestingDetails: buildStfMotorStaticTestingDetails(motor.stfData),
    })),
  };
};

export const mapFormStateToUpdateStfBatchPayload = (params: {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  formState: StaticTestFacilityFormState;
}): UpdateStfBatchFormPayload => {
  const batchPayload = mapFormStateToCreateStfBatchPayload(params);
  return {
    formId: params.formId,
    ...batchPayload,
  };
};

// ============================================================================
// 2. Standalone BEM Motor Master API Models & Mappers
// ============================================================================

/** Payload structure for POST /api/v1/user/stf/bem-motor/create */
export type CreateBemMotorPayload = {
  motorId: string;
  subDepartmentId: number;
  subType: "BEM" | string;
  stfTestNo: string | unknown;
  formSubmissionType: "DRAFT" | "SUBMIT";
  staticTestingDetails: StfStaticTestingDetailsApi;
};

/** Payload structure for PUT /api/v1/user/stf/bem-motor/update */
export type UpdateBemMotorPayload = {
  motorId: string;
  subDepartmentId: number;
  stfTestNo: string | unknown;
  subType?: "BEM" | string;
  formSubmissionType: "DRAFT" | "SUBMIT";
  staticTestingDetails: StfStaticTestingDetailsApi;
};

export type BemMotorDetailsResponse = {
  bemNo?: string;
  motorId?: string;
  motorCode?: string;
  stfTestNo?: string;
  subDepartmentId?: number;
  subType?: string;
  status?: string;
  sections?: FormSectionPayload[];
  staticTestingDetails?: {
    [FORM_SECTIONS_KEY]?: FormSectionPayload[];
    [key: string]: unknown;
  };
  workflowInsights?: {
    rejectionReason?: string;
  };
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
};

export const mapBemDetailsResponseToFormState = (
  data: BemMotorDetailsResponse,
): StaticTestFacilityFormState => {
  const defaults = createDefaultStaticTestFacilityFormState();
  const bemNo = String(data.bemNo ?? data.motorCode ?? data.motorId ?? "").trim();
  const stfTestNo = String(data.stfTestNo ?? "").trim();
  const bemMotorSession = hydrateStfMotorSessionFromApi(
    bemNo,
    "BEM",
    {
      staticTestingDetails: data.staticTestingDetails,
      sections: data.sections,
    },
    stfTestNo,
  );

  return {
    ...defaults,
    bemNo,
    stfTestNo,
    subType: "BEM",
    motors: [bemMotorSession],
    formLoaded: true,
  };
};

// ============================================================================
// General Form Helper Functions
// ============================================================================

export const resolveStfFormSubTypes = (form: StaticTestFacilityFormState): StfSubType[] => {
  const subTypes = new Set<StfSubType>();
  if (form.subType) subTypes.add(form.subType);
  for (const motor of form.motors ?? []) {
    if (motor.motorId.trim()) subTypes.add(motor.subType);
  }
  return Array.from(subTypes);
};

export const hasAnyStaticTestFacilityValue = (form: StaticTestFacilityFormState): boolean =>
  (form.motors ?? []).some((motor) => stfMotorDataHasUserInput(motor.stfData));

export const hasMotorStaticTestFacilityValue = (
  form: StaticTestFacilityFormState,
  motorId: string,
): boolean => {
  const motor = (form.motors ?? []).find((entry) => entry.motorId === motorId);
  if (!motor) return false;
  return stfMotorDataHasUserInput(motor.stfData);
};

export type StfNavigationMotor = { motorId: string; subType: StfSubType };

export const buildStfAddedMotors = (form: StaticTestFacilityFormState): StfNavigationMotor[] => {
  const motors = (form.motors ?? []).filter((motor) => motor.motorId.trim());
  if (motors.length > 0) {
    return motors.map((motor) => ({ motorId: motor.motorId, subType: motor.subType }));
  }
  if (form.bemNo?.trim()) {
    return [{ motorId: form.bemNo.trim(), subType: "BEM" }];
  }
  return [];
};

/** Merge user-added motors with batch-seeded entries (same logic as motor navigation tabs). */
export const resolveStfNavigationMotors = (
  addedMotors: StfNavigationMotor[] = [],
  batchMotorEntries: StfNavigationMotor[] = [],
): StfNavigationMotor[] => {
  const fromAdded = addedMotors.filter((entry) => Boolean(entry?.motorId?.trim()));
  const fromBatch = batchMotorEntries.filter((entry) => Boolean(entry?.motorId?.trim()));

  if (fromAdded.length === 0) return fromBatch;

  const seen = new Set(fromAdded.map((entry) => entry.motorId));
  const merged = [...fromAdded];
  fromBatch.forEach((entry) => {
    if (!seen.has(entry.motorId)) {
      seen.add(entry.motorId);
      merged.push(entry);
    }
  });
  return merged;
};

export const resolveStfMotorSubmissionTypeForPayload = (
  statusMeta?: StfMotorStatusMeta,
  override?: StfMotorSubmissionType,
): StfMotorSubmissionType => {
  if (override) return override;
  if (statusMeta?.motorSubmissionType) return statusMeta.motorSubmissionType;

  const status = normalizeStfMotorSubmissionStatus(statusMeta?.motorSubmissionStatus);
  if (status === "WAITING_FOR_APPROVAL" || status === "APPROVED") return "SUBMIT";
  return "DRAFT";
};

export interface FormSectionPayload {
  sectionId: string;
  sectionData: Record<string, any>[];
}

export type StaticTestingDetailsPayload = StfStaticTestingDetailsApi;

const buildStfMotorStaticTestingDetailsFromSession = (motor: StfMotorSession) =>
  buildStfMotorStaticTestingDetails(motor.stfData);

// Main mapper supporting both batch motors and single BEM payload
export const mapStaticTestFacilityFormStateToPayload = (
  form: StaticTestFacilityFormState,
  options?: {
    navigationMotors?: StfNavigationMotor[];
    motorStatusById?: Record<string, StfMotorStatusMeta>;
    targetMotorIds?: string[];
    motorSubmissionType?: StfMotorSubmissionType;
  },
) => {
  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  const navigationMotors = options?.navigationMotors?.length
    ? options.navigationMotors
    : buildStfAddedMotors(form);

  const sessionById = new Map(
    (form.motors ?? [])
      .filter((motor) => String(motor.motorId ?? "").trim())
      .map((motor) => [motor.motorId, motor]),
  );

  const statusById = options?.motorStatusById ?? {};

  const motorsToMap = targetIds
    ? navigationMotors.filter((navMotor) => targetIds.has(navMotor.motorId))
    : navigationMotors;

  return {
    motors: motorsToMap.map((navMotor) => {
      const motorId = String(navMotor.motorId ?? "").trim();
      const session =
        sessionById.get(motorId) ?? createEmptyStfMotorSession(motorId, navMotor.subType);
      const statusMeta = statusById[motorId];
      const submissionTypeOverride =
        targetIds?.has(motorId) && options?.motorSubmissionType
          ? options.motorSubmissionType
          : undefined;

      return {
        motorId,
        subType: navMotor.subType,
        stfTestNo: String(session.stfTestNo ?? "").trim() || undefined,
        motorSubmissionType: resolveStfMotorSubmissionTypeForPayload(
          statusMeta,
          submissionTypeOverride,
        ),
        staticTestingDetails: buildStfMotorStaticTestingDetailsFromSession(session),
      };
    }),
  };
};

export const mapStfDetailsFromSavedForm = (
  details: any,
  options?: { motorStatusById?: Record<string, StfMotorStatusMeta> },
) => {
  const root = details?.data ?? details ?? {};
  const rawMotors = Array.isArray(root?.motors) ? root.motors : [];
  const statusById = options?.motorStatusById ?? mapStfMotorStatusesFromApi(details);

  return {
    motors: rawMotors
      .map((motor: any) => {
        const motorId = String(motor?.motorId ?? "").trim();
        if (!motorId) return null;
        const statusMeta = statusById[motorId];
        return {
          motorId,
          subType: motor?.subType ? mapStfSubType(motor.subType) : "MAIN_MOTOR",
          stfTestNo: String(motor?.stfTestNo ?? "").trim() || undefined,
          motorSubmissionType:
            statusMeta?.motorSubmissionType ??
            normalizeStfMotorSubmissionType(motor?.motorSubmissionType) ??
            "SUBMIT",
          staticTestingDetails: motor?.staticTestingDetails ?? {},
        };
      })
      .filter(Boolean),
  };
};
