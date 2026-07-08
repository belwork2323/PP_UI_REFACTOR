import { NDT_RADIOGRAPHY_PLANS, type RadiographyPlanKey } from "../../../hooks/user/qualityControl/ndtFlowConfig";
import { parseNdtPositiveInt } from "../../../hooks/user/qualityControl/ndtApiMappings";
import { mapCastingCuringPersonLabel } from "./CastingCuringFormModel";

export type NDTFileValue = File | string;

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
  files: NDTFileValue[];
};

export type NDTVisualInspectionRow = {
  observation: string;
  observationNotes?: string;
  isPreset: boolean;
  section: string;
  orientation: string;
  files: NDTFileValue[];
};

export type NDTMotorSession = {
  motorId: string;
  equipment: string;
  beamEnergies: string[];
  radiographyPlan: string;
  radiographyPlanRows: NDTRadiographyPlanRow[];
  additionalExposureRows: NDTExposureRow[];
  radiographyObservationRows: NDTRadiographyObservationRow[];
  visualInspectionRows: NDTVisualInspectionRow[];
  visualInspectionMedia: NDTFileValue[];
  signedReport: NDTFileValue | null;
  additionalRemarks: string;
};

export type NDTFormState = {
  batchId: string;
  formLoaded: boolean;
  equipment: string;
  beamEnergies: string[];
  radiographyPlan: string;
  radiographyPlanRows: NDTRadiographyPlanRow[];
  motors: NDTMotorSession[];
  /** @deprecated Legacy single-motor field kept for API compatibility */
  motorId?: string;
};

const createPresetVisualRows = (): NDTVisualInspectionRow[] =>
  [
    "Surface Paint/ Finish",
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
  equipment: "",
  beamEnergies: [],
  radiographyPlan: "",
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
  draft: Pick<NDTFormState, "equipment" | "beamEnergies" | "radiographyPlan" | "radiographyPlanRows">,
): NDTMotorSession => ({
  ...createEmptyNDTMotorSession(motorId),
  equipment: draft.equipment ?? "",
  beamEnergies: Array.isArray(draft.beamEnergies) ? draft.beamEnergies : [],
  radiographyPlan: draft.radiographyPlan ?? "",
  radiographyPlanRows:
    draft.radiographyPlanRows?.length > 0
      ? draft.radiographyPlanRows
      : resolveRadiographyPlanRows(draft.radiographyPlan ?? ""),
});

export const normalizeNDTMotorSession = (motor: Partial<NDTMotorSession> & { motorId: string }): NDTMotorSession => {
  const base = createEmptyNDTMotorSession(motor.motorId);
  return {
    ...base,
    ...motor,
    motorId: motor.motorId,
    equipment: motor.equipment ?? base.equipment,
    beamEnergies: Array.isArray(motor.beamEnergies) ? motor.beamEnergies : base.beamEnergies,
    radiographyPlan: motor.radiographyPlan ?? base.radiographyPlan,
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

export const createDefaultNDTFormState = (batchId = ""): NDTFormState => ({
  batchId,
  formLoaded: false,
  equipment: "",
  beamEnergies: [],
  radiographyPlan: "",
  radiographyPlanRows: [],
  motors: [],
});

type LegacyNDTFormState = NDTFormState & {
  additionalExposureRows?: NDTExposureRow[];
  radiographyObservationRows?: NDTRadiographyObservationRow[];
  visualInspectionRows?: NDTVisualInspectionRow[];
  visualInspectionMedia?: NDTFileValue[];
  signedReport?: NDTFileValue | null;
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
        equipment: input.equipment ?? "",
        beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
        radiographyPlan: input.radiographyPlan ?? "",
        radiographyPlanRows: Array.isArray(input.radiographyPlanRows) ? input.radiographyPlanRows : [],
        motorId: input.motorId ?? undefined,
      };
    }
    return {
      batchId: input.batchId ?? base.batchId,
      formLoaded: Boolean(input.formLoaded ?? true),
      equipment: input.equipment ?? "",
      beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
      radiographyPlan: input.radiographyPlan ?? "",
      radiographyPlanRows: Array.isArray(input.radiographyPlanRows) ? input.radiographyPlanRows : [],
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
      equipment: input.equipment ?? "",
      beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
      radiographyPlan: input.radiographyPlan ?? "",
      radiographyPlanRows: Array.isArray(input.radiographyPlanRows) ? input.radiographyPlanRows : [],
      formLoaded: Boolean(input.formLoaded),
    };
  }

  const draft = {
    equipment: input.equipment ?? "",
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
const hasFiles = (files?: NDTFileValue[] | null) => (files?.length ?? 0) > 0;

export const motorHasValue = (motor: NDTMotorSession) => {
  if (hasText(motor.equipment) || (motor.beamEnergies?.length ?? 0) > 0 || hasText(motor.radiographyPlan)) {
    return true;
  }
  if (motor.additionalExposureRows.some((row) => hasText(row.sectionNumber) || hasText(row.orientation) || hasText(row.exposureCount))) {
    return true;
  }
  if (
    motor.radiographyObservationRows.some(
      (row) => hasText(row.section) || hasText(row.orientation) || hasText(row.observations) || hasFiles(row.files),
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
  if (motor.signedReport) return true;
  if (hasText(motor.additionalRemarks)) return true;
  return false;
};

export const hasAnyNDTValue = (form: NDTFormState) => {
  const normalized = normalizeNDTFormState(form);
  return (normalized.motors ?? []).some(motorHasValue);
};

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
    if (!String(motor.radiographyPlan ?? "").trim()) {
      return `Radiography plan is required for motor ${motor.motorId}`;
    }

    for (const row of motor.additionalExposureRows ?? []) {
      const hasPartial =
        Boolean(String(row.orientation ?? "").trim()) || Boolean(String(row.exposureCount ?? "").trim());
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
};

export type NDTDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motors: NDTMotorDetailView[];
};

export const mapNDTDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): NDTDetailView | null => {
  if (!data) return null;

  const root = data as Record<string, unknown>;
  const nestedFormState = root.data as Partial<NDTFormState> | undefined;
  const formState = normalizeNDTFormState(
    nestedFormState?.motors ? nestedFormState : root,
  );
  const motors: NDTMotorDetailView[] = (formState.motors ?? [])
    .map((motor) => {
      const normalized = normalizeNDTMotorSession(motor);
      const planLabel =
        NDT_RADIOGRAPHY_PLANS[normalized.radiographyPlan as RadiographyPlanKey]?.label ??
        normalized.radiographyPlan;
      return {
        ...normalized,
        radiographyPlanLabel: planLabel,
        beamEnergiesLabel: (normalized.beamEnergies ?? []).join(", "),
      };
    })
    .filter((motor) => motor.motorId.trim().length > 0);

  const workflowInsights = root.workflowInsights as Record<string, unknown> | undefined;
  const formStatus = String(root.formStatus ?? workflowInsights?.currentStatus ?? root.status ?? "");

  return {
    formId: String(root.formId ?? ""),
    batchId: String(root.batchId ?? formState.batchId ?? ""),
    batchType: root.batchType != null ? String(root.batchType) : "",
    status: formStatus,
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
  };
};
