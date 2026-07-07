import type { NDTFileValue } from "../../../data/models/user/NDTFormModel";
import { NDT_VISUAL_INSPECTION_PRESETS } from "./ndtFlowConfig";

const toApiEnum = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const createBidirectionalMap = <TUi extends string, TApi extends string>(
  pairs: readonly (readonly [TUi, TApi])[],
) => {
  const uiToApi = new Map<string, string>(pairs);
  const apiToUi = new Map<string, string>(pairs.map(([ui, api]) => [api, ui]));

  return {
    toApi: (uiValue: string): string => {
      const trimmed = String(uiValue ?? "").trim();
      if (!trimmed) return "";
      return uiToApi.get(trimmed) ?? trimmed;
    },
    fromApi: (apiValue: string): string => {
      const trimmed = String(apiValue ?? "").trim();
      if (!trimmed) return "";
      return apiToUi.get(trimmed) ?? trimmed;
    },
  };
};

const equipmentMap = createBidirectionalMap([
  ["4 MeV LINAC", "4_MEV_LINAC"],
  ["2/6 MeV LINAC", "2_6_MEV_LINAC"],
  ["6/9 MeV LINAC", "6_9_MEV_LINAC"],
  ["9/15 MeV LINAC", "9_15_MEV_LINAC"],
  ["450 KeV X ray Machine", "450_KEV_XRAY_MACHINE"],
] as const);

const beamEnergyMap = createBidirectionalMap([
  ["2 MeV", "2_MEV"],
  ["4 MeV", "4_MEV"],
  ["6 MeV", "6_MEV"],
  ["9 MeV", "9_MEV"],
  ["15 MeV", "15_MEV"],
  ["450 KeV", "450_KEV"],
] as const);

const detectorTypeMap = createBidirectionalMap([
  ["Imaging Plate", "IMAGING_PLATE"],
  ["DR Panel", "DR"],
  ["Film", "FILM"],
] as const);

export const NDT_ORIENTATION_OPTIONS = [
  { value: "0_DEGREE", label: "0°" },
  { value: "45_DEGREE", label: "45°" },
  { value: "90_DEGREE", label: "90°" },
  { value: "180_DEGREE", label: "180°" },
  { value: "270_DEGREE", label: "270°" },
] as const;

const orientationMap = createBidirectionalMap(
  NDT_ORIENTATION_OPTIONS.map((option) => [option.label, option.value] as const),
);

const observationTypeMap = createBidirectionalMap([
  ["Surface Paint/ Finish", "SURFACE_PAINT_FINISH"],
  ["Dents/scratch/abnormalities on motor case", "DENTS_SCRATCHES_MOTOR_CASE"],
  ["Dents/scratch/abnormalities on propellant", "DENTS_SCRATCHES_PROPELLANT"],
  ["Nut & bolt groves cleanliness", "NUT_BOLT_GROOVES_CLEANLINESS"],
  ["Observation on nozzle end flange", "NOZZLE_END_FLANGE_OBSERVATION"],
  ["Observation on Head End Flange", "HEAD_END_FLANGE_OBSERVATION"],
  ["Port cleanliness", "PORT_CLEANLINESS"],
  ["Beading condition", "BEADING_CONDITION"],
] as const);

const radiographyPlanMap = createBidirectionalMap([
  ["PLAN_STANDARD", "PLAN-001"],
  ["PLAN_EXTENDED", "PLAN-002"],
  ["PLAN_TANGENTIAL", "PLAN-003"],
] as const);

export const NDT_CUSTOM_OBSERVATION_TYPE = "ANY_OTHER_OBSERVATION";

/** Strip non-digit characters from numeric NDT fields (section, exposure count). */
export const sanitizeNdtNumericInput = (value: string): string => value.replace(/\D/g, "");

/** Parse a UI numeric string to a non-negative integer, or null when empty/invalid. */
export const parseNdtPositiveInt = (
  value: string | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  const trimmed = sanitizeNdtNumericInput(String(value).trim());
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

export const mapNdtEquipmentToApi = (value: string) => equipmentMap.toApi(value);
export const mapNdtEquipmentFromApi = (value: string) => equipmentMap.fromApi(value);

export const mapNdtBeamEnergyToApi = (value: string) => beamEnergyMap.toApi(value);
export const mapNdtBeamEnergiesToApi = (values: string[] = []) =>
  values.map(mapNdtBeamEnergyToApi).filter(Boolean);
export const mapNdtBeamEnergyFromApi = (value: string) => beamEnergyMap.fromApi(value);
export const mapNdtBeamEnergiesFromApi = (values: string[] = []) =>
  values.map(mapNdtBeamEnergyFromApi).filter(Boolean);

export const mapNdtDetectorTypeToApi = (value: string) => detectorTypeMap.toApi(value);
export const mapNdtDetectorTypeFromApi = (value: string) => detectorTypeMap.fromApi(value);

export const mapNdtOrientationToApi = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (NDT_ORIENTATION_OPTIONS.some((option) => option.value === trimmed)) return trimmed;
  return orientationMap.toApi(trimmed) || toApiEnum(trimmed);
};

export const mapNdtOrientationFromApi = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (NDT_ORIENTATION_OPTIONS.some((option) => option.value === trimmed)) return trimmed;
  return orientationMap.fromApi(trimmed) || trimmed;
};

export const mapNdtObservationTypeToApi = (presetLabel: string) =>
  observationTypeMap.toApi(presetLabel);

export const mapNdtObservationTypeFromApi = (apiValue: string) =>
  observationTypeMap.fromApi(apiValue);

export const mapNdtRadiographyPlanToApi = (value: string) => radiographyPlanMap.toApi(value);
export const mapNdtRadiographyPlanFromApi = (value: string) => radiographyPlanMap.fromApi(value);

export const isNdtPresetObservationLabel = (value: string) =>
  (NDT_VISUAL_INSPECTION_PRESETS as readonly string[]).includes(value);

export const fileToNdtApiRef = (file: NDTFileValue | null | undefined): string | null => {
  if (!file) return null;
  if (typeof file === "string") {
    const trimmed = file.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return `pending-upload://${encodeURIComponent(file.name)}`;
};

export const filesToNdtApiRefs = (files: NDTFileValue[] = []): string[] =>
  files.map(fileToNdtApiRef).filter((ref): ref is string => Boolean(ref));
