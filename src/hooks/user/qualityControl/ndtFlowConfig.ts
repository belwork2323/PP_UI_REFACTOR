import type { NDTRadiographyPlanRow } from "../../../data/models/user/NDTFormModel";
import type { NDTFormState } from "../../../data/models/user/NDTFormModel";

export type NDTBatch = {
  id: number | string;
  lotId?: string;
  batchId: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  ndtStatus: string;
  formId?: string | null;
  draftData?: NDTFormState | null;
  rejectionReason?: string | null;
};

export const NDT_EQUIPMENT_OPTIONS = [
  "4 MeV LINAC",
  "2/6 MeV LINAC",
  "6/9 MeV LINAC",
  "9/15 MeV LINAC",
  "450 KeV X ray Machine",
] as const;

export const NDT_BEAM_ENERGY_OPTIONS = [
  "2 MeV",
  "4 MeV",
  "6 MeV",
  "9 MeV",
  "15 MeV",
  "450 KeV",
] as const;

export type RadiographyPlanKey = "PLAN_STANDARD" | "PLAN_EXTENDED" | "PLAN_TANGENTIAL";

export const NDT_RADIOGRAPHY_PLANS: Record<
  RadiographyPlanKey,
  { label: string; rows: NDTRadiographyPlanRow[] }
> = {
  PLAN_STANDARD: {
    label: "Standard Radiography Plan",
    rows: [
      {
        srNo: 1,
        sections: "4",
        orientations: "2",
        sfd: "1200",
        normalExposures: "8",
        tangentialExposures: "2",
        detectorType: "Imaging Plate",
      },
      {
        srNo: 2,
        sections: "6",
        orientations: "3",
        sfd: "1400",
        normalExposures: "12",
        tangentialExposures: "4",
        detectorType: "DR Panel",
      },
    ],
  },
  PLAN_EXTENDED: {
    label: "Extended Coverage Plan",
    rows: [
      {
        srNo: 1,
        sections: "8",
        orientations: "4",
        sfd: "1500",
        normalExposures: "16",
        tangentialExposures: "6",
        detectorType: "Imaging Plate",
      },
    ],
  },
  PLAN_TANGENTIAL: {
    label: "Tangential Emphasis Plan",
    rows: [
      {
        srNo: 1,
        sections: "5",
        orientations: "2",
        sfd: "1100",
        normalExposures: "6",
        tangentialExposures: "8",
        detectorType: "Film",
      },
      {
        srNo: 2,
        sections: "3",
        orientations: "1",
        sfd: "1000",
        normalExposures: "4",
        tangentialExposures: "6",
        detectorType: "Film",
      },
    ],
  },
};

export const NDT_VISUAL_INSPECTION_PRESETS = [
  "Surface Paint/ Finish",
  "Dents/scratch/abnormalities on motor case",
  "Dents/scratch/abnormalities on propellant",
  "Nut & bolt groves cleanliness",
  "Observation on nozzle end flange",
  "Observation on Head End Flange",
  "Port cleanliness",
  "Beading condition",
] as const;

export type NDTMotorOption = { value: string; label: string; disabled?: boolean };

export type NDTAddedMotor = { motorId: string };

export const NDT_FLOW_LABELS = {
  equipment: "Equipment utilized for radiography work",
  equipmentPlaceholder: "Select equipment",
  beamEnergies: "X ray beam energy used for radiography",
  beamEnergiesPlaceholder: "Select beam energy",
  radiographyPlan: "Radiography plan",
  radiographyPlanPlaceholder: "Select plan",
  motorCount: "No. of motors",
  motorCountPlaceholder: "Select count",
  motorId: "Motor ID",
  motorIdPlaceholder: "Select motor",
  loadForm: "Load Form",
  addMotors: "Add Motors",
  setupHint: "Select radiography setup details and motor IDs, then load the form.",
  motorNavTitle: "Motor navigation",
  motorNavHint: "Switch between motors to fill inspection details.",
  motorCardTitle: "Motor",
  navBack: "Back",
  navNext: "Next",
} as const;

export const getNDTMotorCountOptions = (maxCount: number) =>
  Array.from({ length: Math.max(maxCount, 0) }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));

export const getSelectedNDTDraftMotorIds = (count: number, draftMotorIds: string[]): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(Boolean);

export const resolveEffectiveNDTMotorCount = (motorCount: number | "", draftMotorIds: string[]): number => {
  const count = motorCount === "" ? 0 : Number(motorCount);
  if (count > 0) return count;
  return draftMotorIds.some((id) => String(id ?? "").trim().length > 0) ? 1 : 0;
};

export const getCastedMotorsForBatch = (_batchId?: string | null): string[] => {
  return [];
};

export const resolveNDTMotorOptions = (batch?: { batchId?: string; motorId?: string; motorIds?: string[] } | null) => {
  const ids = Array.isArray(batch?.motorIds) ? batch.motorIds : [];
  const casted = getCastedMotorsForBatch(batch?.batchId);
  const merged = [...ids, ...casted, batch?.motorId ?? ""].map((id) => String(id ?? "").trim()).filter(Boolean);
  const unique = Array.from(new Set(merged));
  return unique.map((value) => ({ value, label: value }));
};

export const resolveNDTMotorCountLimit = ({
  availableMotorOptions,
  batchNumberOfMotors,
}: {
  availableMotorOptions: NDTMotorOption[];
  batchNumberOfMotors?: number;
}) => {
  const optionLimit = availableMotorOptions.length;
  const batchLimit = Number(batchNumberOfMotors ?? 0);
  if (batchLimit > 0 && optionLimit > 0) return Math.min(batchLimit, optionLimit);
  if (batchLimit > 0) return batchLimit;
  return Math.max(optionLimit, 1);
};

export const canLoadNDTForm = ({
  equipment,
  beamEnergies,
  radiographyPlan,
  motorCount,
  draftMotorIds,
  usedMotorIds,
  ndtFormLoaded,
  availableMotorOptions,
  maxMotorCount,
}: {
  equipment: string;
  beamEnergies: string[];
  radiographyPlan: string;
  motorCount: number | "";
  draftMotorIds: string[];
  usedMotorIds: string[];
  ndtFormLoaded: boolean;
  availableMotorOptions: NDTMotorOption[];
  maxMotorCount: number;
}) => {
  if (ndtFormLoaded) return false;
  if (!equipment.trim() || beamEnergies.length === 0 || !radiographyPlan.trim()) return false;
  if (availableMotorOptions.length === 0 || maxMotorCount <= 0) return false;

  const count = resolveEffectiveNDTMotorCount(motorCount, draftMotorIds);
  if (count <= 0 || count > maxMotorCount) return false;

  const selectedIds = getSelectedNDTDraftMotorIds(count, draftMotorIds);
  if (selectedIds.length !== count) return false;
  if (new Set(selectedIds).size !== selectedIds.length) return false;
  return !selectedIds.some((id) => usedMotorIds.includes(id));
};

export const canAddNDTMotors = ({
  equipment,
  beamEnergies,
  radiographyPlan,
  motorCount,
  draftMotorIds,
  usedMotorIds,
  ndtFormLoaded,
  availableMotorOptions,
  maxMotorCount,
}: {
  equipment: string;
  beamEnergies: string[];
  radiographyPlan: string;
  motorCount: number | "";
  draftMotorIds: string[];
  usedMotorIds: string[];
  ndtFormLoaded: boolean;
  availableMotorOptions: NDTMotorOption[];
  maxMotorCount: number;
}) => {
  if (!ndtFormLoaded) return false;
  if (!equipment.trim() || beamEnergies.length === 0 || !radiographyPlan.trim()) return false;
  if (availableMotorOptions.length === 0 || maxMotorCount <= 0) return false;

  const count = resolveEffectiveNDTMotorCount(motorCount, draftMotorIds);
  if (count <= 0) return false;

  const selectedIds = getSelectedNDTDraftMotorIds(count, draftMotorIds);
  if (selectedIds.length !== count) return false;
  if (new Set(selectedIds).size !== selectedIds.length) return false;

  const newIds = selectedIds.filter((id) => !usedMotorIds.includes(id));
  return newIds.length > 0 && usedMotorIds.length + newIds.length <= maxMotorCount;
};
