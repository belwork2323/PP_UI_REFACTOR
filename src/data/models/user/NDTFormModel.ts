import { NDT_RADIOGRAPHY_PLANS, type RadiographyPlanKey } from "../../../hooks/user/qualityControl/ndtFlowConfig";

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
  isPreset: boolean;
  section: string;
  orientation: string;
  files: NDTFileValue[];
};

export type NDTMotorSession = {
  motorId: string;
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
  additionalExposureRows: [{ sectionNumber: "", orientation: "", exposureCount: "" }],
  radiographyObservationRows: [{ section: "", orientation: "", observations: "", files: [] }],
  visualInspectionRows: createPresetVisualRows(),
  visualInspectionMedia: [],
  signedReport: null,
  additionalRemarks: "",
});

export const normalizeNDTMotorSession = (motor: Partial<NDTMotorSession> & { motorId: string }): NDTMotorSession => {
  const base = createEmptyNDTMotorSession(motor.motorId);
  return {
    ...base,
    ...motor,
    motorId: motor.motorId,
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

  const motorSession: NDTMotorSession = normalizeNDTMotorSession({
    motorId: legacyMotorId || "MOTOR-1",
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
    equipment: input.equipment ?? "",
    beamEnergies: Array.isArray(input.beamEnergies) ? input.beamEnergies : [],
    radiographyPlan: input.radiographyPlan ?? "",
    radiographyPlanRows: Array.isArray(input.radiographyPlanRows)
      ? input.radiographyPlanRows
      : resolveRadiographyPlanRows(input.radiographyPlan ?? ""),
    motors: [motorSession],
    motorId: motorSession.motorId,
  };
};

const hasText = (value?: string | null) => Boolean(String(value ?? "").trim());
const hasFiles = (files?: NDTFileValue[] | null) => (files?.length ?? 0) > 0;

export const motorHasValue = (motor: NDTMotorSession) => {
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
      (row) => hasText(row.section) || hasText(row.orientation) || hasFiles(row.files),
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
  if (hasText(normalized.batchId) || hasText(normalized.equipment)) return true;
  if ((normalized.beamEnergies ?? []).length > 0) return true;
  if (hasText(normalized.radiographyPlan)) return true;
  return (normalized.motors ?? []).some(motorHasValue);
};

export const buildNDTAddedMotors = (form: NDTFormState) =>
  (form.motors ?? [])
    .filter((motor) => motor.motorId.trim().length > 0)
    .map((motor) => ({ motorId: motor.motorId }));
