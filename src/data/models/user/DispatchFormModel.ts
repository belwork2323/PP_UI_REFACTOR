import {
  buildDispatchSectionPayload,
  createDispatchInitialValues,
  DISPATCH_SCHEMA_TYPE,
  mapDispatchDetailsToSchemaValues,
  mapDispatchSchemaValuesToDispatchDetails,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";

export type DispatchMotorSubmissionType = "DRAFT" | "SUBMIT";
export type DispatchMotorSubmissionStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type DispatchMotorStatusMeta = {
  motorSubmissionType?: DispatchMotorSubmissionType;
  motorSubmissionStatus: DispatchMotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const isDispatchMotorLocked = (status?: DispatchMotorSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isDispatchMotorEditable = (status?: DispatchMotorSubmissionStatus | string | null) =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS" || status === "REJECTED";

export const isDispatchMotorApproverTabDisabled = (
  status?: DispatchMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return !normalized || normalized === "TO_BE_INITIATED";
};

export const isDispatchMotorApproverActionable = (
  status?: DispatchMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

export const canApproverActionEntireDispatchForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: DispatchMotorSubmissionStatus | string | null }>;
}): boolean => {
  const status = String(params.status ?? "").trim();
  const statusUpper = status.toUpperCase().replace(/\s+/g, "_");

  if (
    statusUpper === "APPROVED" ||
    statusUpper === "REJECTED" ||
    statusUpper === "FINAL_APPROVAL_COMPLETED" ||
    status === OPERATION_STATUS.APPROVED ||
    status === OPERATION_STATUS.REJECTED ||
    status === OPERATION_STATUS.FINAL_APPROVAL_COMPLETED
  ) {
    return false;
  }

  if (
    statusUpper === "WAITING_FOR_COMPLETE_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL
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

export const normalizeDispatchMotorStatus = (value: unknown): DispatchMotorSubmissionStatus => {
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

export const normalizeDispatchMotorSubmissionType = (
  value: unknown,
): DispatchMotorSubmissionType | undefined => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "DRAFT" || raw === "SUBMIT") return raw;
  return undefined;
};

export const mapDispatchMotorStatusesFromApi = (
  details: any,
): Record<string, DispatchMotorStatusMeta> => {
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, DispatchMotorStatusMeta> = {};

  const mergeStatusEntry = (motorId: string, entry: any) => {
    const id = String(motorId ?? "").trim();
    if (!id) return;
    const existing = statusById[id];
    statusById[id] = {
      motorSubmissionType:
        normalizeDispatchMotorSubmissionType(entry?.motorSubmissionType) ??
        existing?.motorSubmissionType,
      motorSubmissionStatus: normalizeDispatchMotorStatus(
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
      : Array.isArray(details?.data?.motors)
        ? details.data.motors
        : [];

  rawMotors.forEach((motor: any) => {
    mergeStatusEntry(String(motor?.motorId ?? ""), motor);
  });

  return statusById;
};

export const areAllDispatchMotorsApproved = (
  motorStatusById: Record<string, DispatchMotorStatusMeta>,
): boolean => {
  const entries = Object.values(motorStatusById);
  if (entries.length === 0) return false;
  return entries.every(
    (meta) => String(meta.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
};

export type DispatchMotorSetup = {
  motorStage: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
};

export type DispatchMotorSession = {
  motorId: string;
  setup: DispatchMotorSetup;
  schemaFormValues: SchemaFormValues;
  savedSchemaValues?: Record<string, unknown>;
};

export const createDefaultDispatchMotorSetup = (): DispatchMotorSetup => ({
  motorStage: "",
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO",
  ndtMomNo: "",
  finalAcceptanceClearance: "NO",
  finalAcceptanceMomNo: "",
});

export const createEmptyDispatchMotorSession = (motorId: string): DispatchMotorSession => ({
  motorId,
  setup: createDefaultDispatchMotorSetup(),
  schemaFormValues: {},
});

export const hydrateDispatchMotorSession = (
  motorId: string,
  schema: SchemaDocumentV2,
  setup: DispatchMotorSetup,
  savedSchemaValues?: Record<string, unknown>,
): DispatchMotorSession => ({
  motorId,
  setup,
  schemaFormValues: savedSchemaValues
    ? mapDispatchDetailsToSchemaValues(schema, savedSchemaValues)
    : createDispatchInitialValues(schema),
  savedSchemaValues,
});

export const createDispatchData = () => ({
  motorStage: "",
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO",
  ndtMomNo: "",
  finalAcceptanceClearance: "NO",
  finalAcceptanceMomNo: "",
  schemaFormLoaded: false,
  dispatchSchema: null as SchemaDocumentV2 | null,
  motors: [] as DispatchMotorSession[],
});

export type DispatchFormState = ReturnType<typeof createDispatchData>;

export const snapshotDispatchSetupFromForm = (form: DispatchFormState): DispatchMotorSetup => ({
  motorStage: String(form.motorStage ?? ""),
  castingDate: String(form.castingDate ?? ""),
  dispatchDate: String(form.dispatchDate ?? ""),
  dispatchLocation: String(form.dispatchLocation ?? ""),
  ndtClearance: String(form.ndtClearance ?? "NO"),
  ndtMomNo: String(form.ndtMomNo ?? ""),
  finalAcceptanceClearance: String(form.finalAcceptanceClearance ?? "NO"),
  finalAcceptanceMomNo: String(form.finalAcceptanceMomNo ?? ""),
});

export const clearDispatchFormSetup = (form: DispatchFormState): DispatchFormState => ({
  ...form,
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO",
  ndtMomNo: "",
  finalAcceptanceClearance: "NO",
  finalAcceptanceMomNo: "",
});

export type DispatchDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorStage?: string;
  motorId?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: string;
  ndtMomNo?: string;
  finalAcceptanceClearance?: string;
  finalAcceptanceMomNo?: string;
  motors?: Array<{
    motorId: string;
    schemaValues?: Record<string, unknown>;
    setup?: DispatchMotorSetup;
  }>;
  sections?: SchemaSectionSubmission[];
};

export type DispatchFormBody = {
  schemaVersion?: string;
  schemaType?: string;
  motorStage?: string;
  motorId?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: string;
  ndtMomNo?: string;
  finalAcceptanceClearance?: string;
  finalAcceptanceMomNo?: string;
  sections: SchemaSectionSubmission[];
};

export const createDefaultDispatchFormState = (): DispatchFormState => createDispatchData();

export const appendDispatchMotorToState = (
  state: DispatchFormState,
  schema: SchemaDocumentV2,
  motorId: string,
  savedSchemaValues?: Record<string, unknown>,
  setupOverride?: DispatchMotorSetup,
): DispatchFormState => {
  const trimmedId = String(motorId ?? "").trim();
  if (!trimmedId) return state;

  const existing = state.motors ?? [];
  const setup = setupOverride ?? snapshotDispatchSetupFromForm(state);
  const nextSession = hydrateDispatchMotorSession(trimmedId, schema, setup, savedSchemaValues);
  const clearedState = clearDispatchFormSetup(state);

  const alreadyPresent = existing.some((motor) => motor.motorId === trimmedId);
  const nextMotors = alreadyPresent
    ? existing.map((motor) => (motor.motorId === trimmedId ? nextSession : motor))
    : [...existing, nextSession];

  return {
    ...clearedState,
    dispatchSchema: clearedState.dispatchSchema ?? schema,
    motors: nextMotors,
    schemaFormLoaded: true,
  };
};

/** @deprecated Use appendDispatchMotorToState */
export const hydrateDispatchFormState = (
  state: DispatchFormState,
  schema: SchemaDocumentV2,
): DispatchFormState =>
  appendDispatchMotorToState(
    state,
    schema,
    state.motors[0]?.motorId ?? "",
    state.motors[0]?.savedSchemaValues,
  );

const buildDispatchDetailsPayload = (
  schema: SchemaDocumentV2,
  setup: DispatchMotorSetup,
  schemaValues: SchemaFormValues,
) => mapDispatchSchemaValuesToDispatchDetails(schema, schemaValues, setup);

export const mapDispatchDetailsToFormState = (details: DispatchDetails): DispatchFormState => {
  const defaults = createDefaultDispatchFormState();
  const motors = Array.isArray(details?.motors) ? details.motors : [];
  const fallbackSetup: DispatchMotorSetup = {
    motorStage: String(details?.motorStage ?? ""),
    castingDate: String(details?.castingDate ?? ""),
    dispatchDate: String(details?.dispatchDate ?? ""),
    dispatchLocation: String(details?.dispatchLocation ?? ""),
    ndtClearance: String(details?.ndtClearance ?? "NO"),
    ndtMomNo: String(details?.ndtMomNo ?? ""),
    finalAcceptanceClearance: String(details?.finalAcceptanceClearance ?? "NO"),
    finalAcceptanceMomNo: String(details?.finalAcceptanceMomNo ?? ""),
  };

  return {
    ...defaults,
    motors: motors
      .map((motor) => ({
        motorId: String(motor?.motorId ?? "").trim(),
        setup: motor.setup ?? fallbackSetup,
        schemaFormValues: {},
        savedSchemaValues: motor?.schemaValues,
      }))
      .filter((motor) => motor.motorId.length > 0),
    schemaFormLoaded: motors.length > 0,
  };
};

export const mapDispatchFormStateToBackendPayload = (
  form: DispatchFormState,
  batchId: string,
  subDepartmentId: number,
  intent: "DRAFT" | "SUBMIT",
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: DispatchMotorSubmissionType;
  },
) => {
  const schema = form.dispatchSchema;
  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  if (!schema) {
    return {
      batchId,
      subDepartmentId,
      formSubmissionType: intent,
      motors: [],
    };
  }

  const motors = (form.motors ?? [])
    .filter((motor) => String(motor.motorId ?? "").trim())
    .filter((motor) => !targetIds || targetIds.has(motor.motorId))
    .filter((motor) => isDispatchMotorSetupReady(motor))
    .map((motor) => ({
      motorId: motor.motorId,
      dispatchDetails: buildDispatchDetailsPayload(
        schema,
        motor.setup ?? createDefaultDispatchMotorSetup(),
        motor.schemaFormValues ?? {},
      ),
      ...(options?.motorSubmissionType ? { motorSubmissionType: options.motorSubmissionType } : {}),
    }));

  return {
    batchId,
    subDepartmentId,
    formSubmissionType: intent,
    motors,
  };
};

export const mapDispatchFormStateToUpdatePayload = (
  form: DispatchFormState,
  formId: string,
  batchId: string,
  subDepartmentId: number,
  intent: "DRAFT" | "SUBMIT",
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: DispatchMotorSubmissionType;
  },
) => ({
  formId,
  ...mapDispatchFormStateToBackendPayload(form, batchId, subDepartmentId, intent, options),
});

/** Build final-approval payload from latest saved form details (all motors). */
export const mapDispatchDetailsFromSavedForm = (
  details: any,
  options?: { motorStatusById?: Record<string, DispatchMotorStatusMeta> },
) => {
  const payload = details?.data ?? details ?? {};
  const statusById = options?.motorStatusById ?? mapDispatchMotorStatusesFromApi(payload);
  const rawMotors = Array.isArray(payload?.motors)
    ? payload.motors
    : Array.isArray(details?.motors)
      ? details.motors
      : [];

  return {
    motors: rawMotors
      .map((motor: any) => {
        const motorId = String(motor?.motorId ?? "").trim();
        if (!motorId) return null;
        return {
          motorId,
          dispatchDetails: motor?.dispatchDetails ?? {},
          motorSubmissionType:
            statusById[motorId]?.motorSubmissionType ??
            normalizeDispatchMotorSubmissionType(motor?.motorSubmissionType) ??
            "SUBMIT",
        };
      })
      .filter(Boolean),
  };
};

export const mapDispatchFormStateToPayload = (form: DispatchFormState): DispatchFormBody => {
  const schema = form.dispatchSchema;
  const primaryMotor = form.motors[0];
  const primarySetup = primaryMotor?.setup ?? snapshotDispatchSetupFromForm(form);

  return {
    schemaVersion: schema?.schemaVersion,
    schemaType: schema?.schemaType ?? DISPATCH_SCHEMA_TYPE,
    motorStage: primarySetup.motorStage || undefined,
    motorId: primaryMotor?.motorId || undefined,
    castingDate: primarySetup.castingDate || undefined,
    dispatchDate: primarySetup.dispatchDate || undefined,
    dispatchLocation: primarySetup.dispatchLocation || undefined,
    ndtClearance: primarySetup.ndtClearance || undefined,
    ndtMomNo: primarySetup.ndtClearance === "YES" ? primarySetup.ndtMomNo || undefined : undefined,
    finalAcceptanceClearance: primarySetup.finalAcceptanceClearance || undefined,
    finalAcceptanceMomNo:
      primarySetup.finalAcceptanceClearance === "YES"
        ? primarySetup.finalAcceptanceMomNo || undefined
        : undefined,
    sections:
      schema && primaryMotor
        ? buildDispatchSectionPayload(schema, primaryMotor.schemaFormValues ?? {})
        : [],
  };
};

const hasDispatchSetupValue = (setup: DispatchMotorSetup) =>
  [setup.motorStage, setup.castingDate, setup.dispatchDate, setup.dispatchLocation].some(
    (value) => String(value ?? "").trim().length > 0,
  ) ||
  (setup.ndtClearance === "YES" && String(setup.ndtMomNo ?? "").trim().length > 0) ||
  (setup.finalAcceptanceClearance === "YES" &&
    String(setup.finalAcceptanceMomNo ?? "").trim().length > 0);

/** Motor has completed FlowBar setup and can show the schema form. */
export const isDispatchMotorSetupReady = (motor?: DispatchMotorSession | null): boolean => {
  if (!motor) return false;
  return hasDispatchSetupValue(motor.setup ?? createDefaultDispatchMotorSetup());
};

const hasSetupValue = (form: DispatchFormState) =>
  hasDispatchSetupValue(snapshotDispatchSetupFromForm(form)) ||
  (form.motors ?? []).some((motor) =>
    hasDispatchSetupValue(motor.setup ?? createDefaultDispatchMotorSetup()),
  );

export const hasAnyDispatchValue = (form: DispatchFormState) =>
  hasSetupValue(form) ||
  (form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.schemaFormValues ?? {}));

export const hasMotorDispatchValue = (form: DispatchFormState, motorId: string) => {
  const motor = (form.motors ?? []).find((entry) => entry.motorId === motorId);
  if (!motor) return false;
  return (
    hasDispatchSetupValue(motor.setup ?? createDefaultDispatchMotorSetup()) ||
    schemaValuesHaveUserData(motor.schemaFormValues ?? {})
  );
};
