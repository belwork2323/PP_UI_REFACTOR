import {
  NDT_RADIOGRAPHY_PLANS,
  type RadiographyPlanKey,
} from "../../../hooks/user/qualityControl/ndtFlowConfig";
import {
  mapNdtDetectorTypeFromApi,
  parseNdtPositiveInt,
} from "../../../hooks/user/qualityControl/ndtApiMappings";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import { mapCastingCuringPersonLabel } from "./CastingCuringFormModel";
import type { BatchMotorRadiographyDetails } from "../admin/BatchManagement/BatchManagementModel";
import { isFileReady, isFileUploadIncomplete, type FileRef } from "../common/FileUploadModel";

export type NDTMotorSubmissionType = "DRAFT" | "SUBMIT";
export type NDTMotorSubmissionStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type NDTMotorStatusMeta = {
  motorSubmissionType?: NDTMotorSubmissionType;
  motorSubmissionStatus: NDTMotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type NDTMotorCounts = {
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  totalMotorCount: number;
};

export const isNDTMotorLocked = (status?: NDTMotorSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isNDTMotorEditable = (status?: NDTMotorSubmissionStatus | string | null) =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS" || status === "REJECTED";

export const isNDTMotorApproverTabDisabled = (
  status?: NDTMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return !normalized || normalized === "TO_BE_INITIATED";
};

export const isNDTMotorApproverActionable = (
  status?: NDTMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

/** Entire form can be approved/rejected once ready for complete approval. */
export const canApproverActionEntireNDTForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: NDTMotorSubmissionStatus | string | null }>;
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

export const normalizeNDTMotorStatus = (value: unknown): NDTMotorSubmissionStatus => {
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

export const normalizeNDTMotorSubmissionType = (
  value: unknown,
): NDTMotorSubmissionType | undefined => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "DRAFT" || raw === "SUBMIT") return raw;
  return undefined;
};

export const mapNDTMotorStatusesFromApi = (details: any): Record<string, NDTMotorStatusMeta> => {
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, NDTMotorStatusMeta> = {};

  const mergeStatusEntry = (motorId: string, entry: any) => {
    const id = String(motorId ?? "").trim();
    if (!id) return;
    const existing = statusById[id];
    statusById[id] = {
      motorSubmissionType:
        normalizeNDTMotorSubmissionType(entry?.motorSubmissionType) ??
        existing?.motorSubmissionType,
      motorSubmissionStatus: normalizeNDTMotorStatus(
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

export const getNDTBatchStatusLabel = (status: unknown): string => String(status ?? "").trim();

export const areAllNDTMotorsApproved = (
  motorStatusById: Record<string, NDTMotorStatusMeta>,
): boolean => {
  const entries = Object.values(motorStatusById);
  if (entries.length === 0) return false;
  return entries.every(
    (meta) => String(meta.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
};

/** @deprecated Prefer FileRef — kept for transitional imports. */
export type NDTFileValue = FileRef | File | string;

export type NDTRadiographyPlanRow = {
  srNo: number;
  sections: string;
  orientations: string;
  sfd: string;
  normalExposures: string;
  tangentialExposures: string;
  detectorType: string;
};

export type NDTExposureRow = {
  sectionNumber: string;
  orientation: string;
  exposureCount: string;
};

export type NDTRadiographyObservationRow = {
  section: string;
  orientation: string;
  observations: string;
  files: FileRef[];
};

export type NDTVisualInspectionRow = {
  observation: string;
  observationNotes?: string;
  isPreset: boolean;
  section: string;
  orientation: string;
  files: FileRef[];
};

export type NDTMotorSession = {
  motorId: string;
  equipment: string[];
  beamEnergies: string[];
  radiographyPlan: string;
  /** Display name from batch casing metadata (optional). */
  radiographyPlanName?: string;
  radiographyPlanRows: NDTRadiographyPlanRow[];
  additionalExposureRows: NDTExposureRow[];
  radiographyObservationRows: NDTRadiographyObservationRow[];
  visualInspectionRows: NDTVisualInspectionRow[];
  visualInspectionMedia: FileRef[];
  signedReport: FileRef | null;
  additionalRemarks: string;
};

export type NDTFormState = {
  batchId: string;
  formLoaded: boolean;
  equipment: string[];
  beamEnergies: string[];
  radiographyPlan: string;
  radiographyPlanRows: NDTRadiographyPlanRow[];
  motors: NDTMotorSession[];
  /** @deprecated Legacy single-motor field kept for API compatibility */
  motorId?: string;
};

const createPresetVisualRows = (): NDTVisualInspectionRow[] =>
  [
    "Rocket motor external surface",
    "Dents/scratch/abnormalities on motor case",
    "Dents/scratch/abnormalities on propellant",
    "Nut & bolt groves cleanliness",
    "Observation on nozzle end flange",
    "Observation on Head End Flange",
    "Port cleanliness",
    "Beading condition",
  ].map((observation) => ({
    observation,
    isPreset: true,
    section: "",
    orientation: "",
    files: [],
  }));

export const createEmptyNDTMotorSession = (motorId: string): NDTMotorSession => ({
  motorId,
  equipment: [],
  beamEnergies: [],
  radiographyPlan: "",
  radiographyPlanName: "",
  radiographyPlanRows: [],
  additionalExposureRows: [{ sectionNumber: "", orientation: "", exposureCount: "" }],
  radiographyObservationRows: [{ section: "", orientation: "", observations: "", files: [] }],
  visualInspectionRows: createPresetVisualRows(),
  visualInspectionMedia: [],
  signedReport: null,
  additionalRemarks: "",
});

export const createMotorSessionFromDraft = (
  motorId: string,
  draft: Pick<
    NDTFormState,
    "equipment" | "beamEnergies" | "radiographyPlan" | "radiographyPlanRows"
  >,
): NDTMotorSession => ({
  ...createEmptyNDTMotorSession(motorId),
  equipment: Array.isArray(draft?.equipment)
    ? draft.equipment
    : draft?.equipment
      ? String(draft.equipment)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  beamEnergies: Array.isArray(draft.beamEnergies) ? draft.beamEnergies : [],
  radiographyPlan: draft.radiographyPlan ?? "",
  radiographyPlanRows:
    draft.radiographyPlanRows?.length > 0
      ? draft.radiographyPlanRows
      : resolveRadiographyPlanRows(draft.radiographyPlan ?? ""),
});

export const normalizeNDTMotorSession = (
  motor: Partial<NDTMotorSession> & { motorId: string },
): NDTMotorSession => {
  const base = createEmptyNDTMotorSession(motor.motorId);
  return {
    ...base,
    ...motor,
    motorId: motor.motorId,
    equipment: motor.equipment ?? base.equipment,
    beamEnergies: Array.isArray(motor.beamEnergies) ? motor.beamEnergies : base.beamEnergies,
    radiographyPlan: motor.radiographyPlan ?? base.radiographyPlan,
    radiographyPlanName: motor.radiographyPlanName ?? base.radiographyPlanName,
    radiographyPlanRows: Array.isArray(motor.radiographyPlanRows)
      ? motor.radiographyPlanRows
      : motor.radiographyPlan
        ? resolveRadiographyPlanRows(motor.radiographyPlan)
        : base.radiographyPlanRows,
    additionalExposureRows: Array.isArray(motor.additionalExposureRows)
      ? motor.additionalExposureRows
      : base.additionalExposureRows,
    radiographyObservationRows: Array.isArray(motor.radiographyObservationRows)
      ? motor.radiographyObservationRows
      : base.radiographyObservationRows,
    visualInspectionRows: Array.isArray(motor.visualInspectionRows)
      ? motor.visualInspectionRows
      : base.visualInspectionRows,
    visualInspectionMedia: Array.isArray(motor.visualInspectionMedia)
      ? motor.visualInspectionMedia
      : base.visualInspectionMedia,
    signedReport: motor.signedReport ?? base.signedReport,
    additionalRemarks: motor.additionalRemarks ?? base.additionalRemarks,
  };
};

export const resolveRadiographyPlanRows = (planKey: string): NDTRadiographyPlanRow[] => {
  const plan = NDT_RADIOGRAPHY_PLANS[planKey as RadiographyPlanKey];
  return plan ? plan.rows.map((row) => ({ ...row })) : [];
};

/** Map rocket-motor-casing batch metadata radiography into NDT motor plan fields. */
export const mapBatchRadiographyDetailsToNdt = (
  details?: BatchMotorRadiographyDetails | null,
): Pick<NDTMotorSession, "radiographyPlan" | "radiographyPlanName" | "radiographyPlanRows"> => {
  if (!details) {
    return { radiographyPlan: "", radiographyPlanName: "", radiographyPlanRows: [] };
  }

  const planId = String(details.radiographyPlanId ?? "").trim();
  const planName = String(details.radiographyPlanName ?? "").trim();
  const radiographyPlanRows = (details.radiographyPlanDetails ?? []).map((row, index) => ({
    srNo: index + 1,
    sections:
      row.numberOfSections != null && Number.isFinite(row.numberOfSections)
        ? String(row.numberOfSections)
        : "",
    orientations:
      row.numberOfOrientations != null && Number.isFinite(row.numberOfOrientations)
        ? String(row.numberOfOrientations)
        : "",
    sfd: row.sfd != null && Number.isFinite(row.sfd) ? String(row.sfd) : "",
    normalExposures:
      row.numberOfNormalExposures != null && Number.isFinite(row.numberOfNormalExposures)
        ? String(row.numberOfNormalExposures)
        : "",
    tangentialExposures:
      row.numberOfTangentialExposures != null && Number.isFinite(row.numberOfTangentialExposures)
        ? String(row.numberOfTangentialExposures)
        : "",
    detectorType: mapNdtDetectorTypeFromApi(String(row.detectorType ?? "")),
  }));

  return {
    radiographyPlan: planId || planName,
    radiographyPlanName: planName,
    radiographyPlanRows,
  };
};

export const createDefaultNDTFormState = (batchId = ""): NDTFormState => ({
  batchId,
  formLoaded: false,
  equipment: [],
  beamEnergies: [],
  radiographyPlan: "",
  radiographyPlanRows: [],
  motors: [],
});

type LegacyNDTFormState = NDTFormState & {
  additionalExposureRows?: NDTExposureRow[];
  radiographyObservationRows?: NDTRadiographyObservationRow[];
  visualInspectionRows?: NDTVisualInspectionRow[];
  visualInspectionMedia?: FileRef[];
  signedReport?: FileRef | null;
  additionalRemarks?: string;
};

export const normalizeNDTFormState = (input?: Partial<LegacyNDTFormState> | null): NDTFormState => {
  const base = createDefaultNDTFormState(input?.batchId ?? "");
  if (!input) return base;

  if (Array.isArray(input.motors)) {
    if (input.motors.length === 0) {
      return {
        ...base,
        formLoaded: Boolean(input.formLoaded),
        equipment: Array.isArray(input?.equipment)
          ? input.equipment
          : input?.equipment
            ? String(input)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
        radiographyPlan: input.radiographyPlan ?? "",
        radiographyPlanRows: Array.isArray(input.radiographyPlanRows)
          ? input.radiographyPlanRows
          : [],
        motorId: input.motorId ?? undefined,
      };
    }
    return {
      batchId: input.batchId ?? base.batchId,
      formLoaded: Boolean(input.formLoaded ?? true),
      equipment: Array.isArray(input?.equipment)
        ? input.equipment
        : input?.equipment
          ? String(input.equipment)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
      radiographyPlan: input.radiographyPlan ?? "",
      radiographyPlanRows: Array.isArray(input.radiographyPlanRows)
        ? input.radiographyPlanRows
        : [],
      motors: input.motors.map((motor) => normalizeNDTMotorSession(motor)),
      motorId: input.motorId ?? input.motors[0]?.motorId,
    };
  }

  const legacyMotorId = String(input.motorId ?? "").trim();
  const hasLegacyData =
    Boolean(input.equipment) ||
    (input.beamEnergies?.length ?? 0) > 0 ||
    Boolean(input.radiographyPlan);

  if (!hasLegacyData) {
    return {
      ...base,
      equipment: Array.isArray(input?.equipment)
        ? input.equipment
        : input?.equipment
          ? String(input.equipment)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
      radiographyPlan: input.radiographyPlan ?? "",
      radiographyPlanRows: Array.isArray(input.radiographyPlanRows)
        ? input.radiographyPlanRows
        : [],
      formLoaded: Boolean(input.formLoaded),
    };
  }

  const draft = {
    equipment: Array.isArray(input?.equipment)
      ? input.equipment
      : input?.equipment
        ? String(input.equipment)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
    radiographyPlan: input.radiographyPlan ?? "",
    radiographyPlanRows: Array.isArray(input.radiographyPlanRows)
      ? input.radiographyPlanRows
      : resolveRadiographyPlanRows(input.radiographyPlan ?? ""),
  };

  const motorSession: NDTMotorSession = normalizeNDTMotorSession({
    ...createMotorSessionFromDraft(legacyMotorId || "MOTOR-1", draft),
    additionalExposureRows: input.additionalExposureRows,
    radiographyObservationRows: input.radiographyObservationRows,
    visualInspectionRows: input.visualInspectionRows,
    visualInspectionMedia: input.visualInspectionMedia,
    signedReport: input.signedReport,
    additionalRemarks: input.additionalRemarks,
  });

  return {
    batchId: input.batchId ?? base.batchId,
    formLoaded: true,
    equipment: draft.equipment,
    beamEnergies: draft.beamEnergies,
    radiographyPlan: draft.radiographyPlan,
    radiographyPlanRows: draft.radiographyPlanRows,
    motors: [motorSession],
    motorId: motorSession.motorId,
  };
};

const hasText = (value?: string | null) => Boolean(String(value ?? "").trim());
const hasFileContent = (ref: FileRef | null | undefined) =>
  Boolean(ref && (isFileReady(ref) || String(ref.fileName ?? "").trim()));
const hasFiles = (files?: FileRef[] | null) =>
  (files ?? []).some((ref) => hasFileContent(ref));

/** Motor has completed FlowBar radiography setup and can show inspection tables. */
export const isNDTMotorSetupReady = (motor?: NDTMotorSession | null): boolean => {
  if (!motor) return false;
  const hasEquipment = Array.isArray(motor.equipment)
    ? motor.equipment.length > 0
    : Boolean(String(motor.equipment ?? "").trim());
  const hasBeamEnergies = Array.isArray(motor.beamEnergies) && motor.beamEnergies.length > 0;
  return hasEquipment && hasBeamEnergies;
};

export const motorHasValue = (motor: NDTMotorSession) => {
  if (
    (motor.equipment?.length ?? 0) > 0 ||
    (motor.beamEnergies?.length ?? 0) > 0 ||
    hasText(motor.radiographyPlan)
  ) {
    return true;
  }
  if (
    motor.additionalExposureRows.some(
      (row) => hasText(row.sectionNumber) || hasText(row.orientation) || hasText(row.exposureCount),
    )
  ) {
    return true;
  }
  if (
    motor.radiographyObservationRows.some(
      (row) =>
        hasText(row.section) ||
        hasText(row.orientation) ||
        hasText(row.observations) ||
        hasFiles(row.files),
    )
  ) {
    return true;
  }
  if (
    motor.visualInspectionRows.some(
      (row) =>
        hasText(row.section) ||
        hasText(row.orientation) ||
        hasText(row.observationNotes) ||
        hasFiles(row.files),
    )
  ) {
    return true;
  }
  if (hasFiles(motor.visualInspectionMedia)) return true;
  if (hasFileContent(motor.signedReport)) return true;
  if (hasText(motor.additionalRemarks)) return true;
  return false;
};

export const hasAnyNDTValue = (form: NDTFormState) => {
  const normalized = normalizeNDTFormState(form);
  return (normalized.motors ?? []).some(motorHasValue);
};

export const hasMotorNDTValue = (form: NDTFormState, motorId: string) => {
  const motor = (form.motors ?? []).find((entry) => entry.motorId === motorId);
  return motor ? motorHasValue(motor) : false;
};

export const collectNdtFileRefsFromForm = (form: {
  motors?: NDTMotorSession[];
}): FileRef[] => {
  const refs: FileRef[] = [];
  for (const motor of form?.motors ?? []) {
    for (const row of motor.radiographyObservationRows ?? []) {
      refs.push(...(row.files ?? []));
    }
    for (const row of motor.visualInspectionRows ?? []) {
      refs.push(...(row.files ?? []));
    }
    refs.push(...(motor.visualInspectionMedia ?? []));
    if (motor.signedReport) refs.push(motor.signedReport);
  }
  return refs;
};

export const hasIncompleteNdtUploads = (form: { motors?: NDTMotorSession[] }): boolean =>
  collectNdtFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromNdtForm = (form: {
  motors?: NDTMotorSession[];
}): string[] =>
  [
    ...new Set(
      collectNdtFileRefsFromForm(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

export const validateNDTMotorsForApi = (motors: NDTMotorSession[]): string | null => {
  const list = (motors ?? []).filter((motor) => String(motor.motorId ?? "").trim());
  if (list.length === 0) return null;

  for (const motor of list) {
    if (!String(motor.equipment ?? "").trim()) {
      return `Equipment is required for motor ${motor.motorId}`;
    }
    if ((motor.beamEnergies ?? []).length === 0) {
      return `Beam energy is required for motor ${motor.motorId}`;
    }
    // if (!String(motor.radiographyPlan ?? "").trim()) {
    //   return `Radiography plan is required for motor ${motor.motorId}`;
    // }

    for (const row of motor.additionalExposureRows ?? []) {
      const hasPartial =
        Boolean(String(row.orientation ?? "").trim()) ||
        Boolean(String(row.exposureCount ?? "").trim());
      if (hasPartial && parseNdtPositiveInt(row.sectionNumber) === null) {
        return `Section number is required for additional exposure rows on motor ${motor.motorId}`;
      }
    }

    for (const row of motor.radiographyObservationRows ?? []) {
      const hasPartial =
        Boolean(String(row.orientation ?? "").trim()) ||
        Boolean(String(row.observations ?? "").trim()) ||
        (row.files?.length ?? 0) > 0;
      if (hasPartial && parseNdtPositiveInt(row.section) === null) {
        return `Section number is required for radiography observation rows on motor ${motor.motorId}`;
      }
    }
  }

  return null;
};

export const buildNDTAddedMotors = (form: NDTFormState) =>
  (form.motors ?? [])
    .filter((motor) => motor.motorId.trim().length > 0)
    .map((motor) => ({ motorId: motor.motorId }));

export type NDTMotorDetailView = NDTMotorSession & {
  radiographyPlanLabel: string;
  beamEnergiesLabel: string;
  motorSubmissionType?: NDTMotorSubmissionType;
  motorSubmissionStatus?: NDTMotorSubmissionStatus;
  rejectionReason?: string | null;
};

export type NDTDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  formSubmissionType?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motors: NDTMotorDetailView[];
  motorCounts?: NDTMotorCounts;
};

export const mapNDTDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): NDTDetailView | null => {
  if (!data) return null;

  const root = data as Record<string, unknown>;
  const nestedFormState = root.data as Partial<NDTFormState> | undefined;
  const formState = normalizeNDTFormState(nestedFormState?.motors ? nestedFormState : root);
  const motorStatuses = mapNDTMotorStatusesFromApi(data);

  const motors: NDTMotorDetailView[] = (formState.motors ?? [])
    .map((motor) => {
      const normalized = normalizeNDTMotorSession(motor);
      const planLabel =
        String(normalized.radiographyPlanName ?? "").trim() ||
        NDT_RADIOGRAPHY_PLANS[normalized.radiographyPlan as RadiographyPlanKey]?.label ||
        normalized.radiographyPlan;
      const statusMeta = motorStatuses[normalized.motorId];
      return {
        ...normalized,
        radiographyPlanLabel: planLabel,
        beamEnergiesLabel: (normalized.beamEnergies ?? []).join(", "),
        motorSubmissionType: statusMeta?.motorSubmissionType,
        motorSubmissionStatus: statusMeta?.motorSubmissionStatus,
        rejectionReason: statusMeta?.rejectionReason ?? null,
      };
    })
    .filter((motor) => motor.motorId.trim().length > 0);

  const workflowInsights = root.workflowInsights as Record<string, unknown> | undefined;
  const formStatus = String(
    root.formStatus ?? workflowInsights?.currentStatus ?? root.status ?? "",
  );

  const countsFromApi = root.motorCounts as Partial<NDTMotorCounts> | undefined;
  const derivedCounts: NDTMotorCounts = {
    pendingMotorCount: motors.filter(
      (m) =>
        !m.motorSubmissionStatus ||
        m.motorSubmissionStatus === "TO_BE_INITIATED" ||
        m.motorSubmissionStatus === "WAITING_FOR_APPROVAL",
    ).length,
    approvedMotorCount: motors.filter((m) => m.motorSubmissionStatus === "APPROVED").length,
    rejectedMotorCount: motors.filter((m) => m.motorSubmissionStatus === "REJECTED").length,
    inProgressMotorCount: motors.filter((m) => m.motorSubmissionStatus === "IN_PROGRESS").length,
    totalMotorCount: motors.length,
  };

  return {
    formId: String(root.formId ?? ""),
    batchId: String(root.batchId ?? formState.batchId ?? ""),
    batchType: root.batchType != null ? String(root.batchType) : "",
    status: formStatus,
    formSubmissionType:
      root.formSubmissionType != null ? String(root.formSubmissionType) : undefined,
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
      pendingMotorCount: Number(
        countsFromApi?.pendingMotorCount ?? derivedCounts.pendingMotorCount,
      ),
      approvedMotorCount: Number(
        countsFromApi?.approvedMotorCount ?? derivedCounts.approvedMotorCount,
      ),
      rejectedMotorCount: Number(
        countsFromApi?.rejectedMotorCount ?? derivedCounts.rejectedMotorCount,
      ),
      inProgressMotorCount: Number(
        countsFromApi?.inProgressMotorCount ?? derivedCounts.inProgressMotorCount,
      ),
      totalMotorCount: Number(countsFromApi?.totalMotorCount ?? derivedCounts.totalMotorCount),
    },
  };
};
