import { STRINGS } from "../../../app/config/strings";
import type { CuringProcessSetup } from "../../../data/models/user/CastingCuringFormModel";
import type { SchemaDocument, SchemaFormValues } from "../../../schemaManagement";

const S = STRINGS.MANUFACTURING.CASTING_CURING;

export type CastingCuringMotorOption = {
  value: string;
  label: string;
};

export type CastingCuringAddedMotor = {
  motorId: string;
  motorReceivedAt: string;
};

export const CASTING_TYPE_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Pair", label: "Pair" },
  { value: "Triple", label: "Triple" },
  { value: "Others", label: "Others" },
] as const;

export const FALLBACK_CASTING_STATION_OPTIONS = [
  { value: "15A", label: "15A" },
  { value: "15B", label: "15B" },
  { value: "15C", label: "15C" },
  { value: "15J", label: "15J" },
] as const;

export const CURING_OVEN_OPTIONS = [
  { value: "15A", label: "15A" },
  { value: "15B", label: "15B" },
  { value: "15C", label: "15C" },
  { value: "15E", label: "15E" },
  { value: "15F", label: "15F" },
] as const;

export const CURING_TYPE_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Confined Curing", label: "Confined Curing" },
  { value: "Nitrogen Pressure Curing", label: "Nitrogen Pressure Curing" },
] as const;

export const CURING_CONFIGURATION_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Multiple", label: "Multiple" },
] as const;

export const CURING_OVENS_UTILIZED_OPTIONS = [
  { value: "One", label: "One" },
  { value: "Multiple", label: "Multiple" },
] as const;

export const CURING_MOTORS_TO_CURE_OPTIONS = [1, 2, 3, 4, 5, 6].map((count) => ({
  value: String(count),
  label: String(count),
}));

export type CastingProcessSetupDraft = {
  initialVacuum: string;
  castingVacuumPressure: string;
  soakingVacuumPressure: string;
  finalMixCount: string;
};

const hasNumericValue = (value: string) => String(value ?? "").trim().length > 0;

export const resolveCastingMotorCount = (castingType: string, customCount: number | "") => {
  const normalized = String(castingType ?? "").trim().toLowerCase();
  if (normalized === "single") return 1;
  if (normalized === "pair") return 2;
  if (normalized === "triple") return 3;
  return customCount === "" ? 0 : Number(customCount);
};

export const resolveCastingCuringMotorOptions = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
  projectName?: string;
} | null): CastingCuringMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((id) => ({ value: id, label: id }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((id) => ({ value: id, label: id }));
  }

  return [{ value: singleId, label: singleId }];
};

export const getCastingMotorCountOptions = (motorOptions: CastingCuringMotorOption[]) =>
  Array.from({ length: Math.max(motorOptions.length, 1) }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));

export const getSelectedCastingDraftMotorIds = (
  count: number,
  draftMotorIds: string[],
): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(Boolean);

export const canLoadCuringForm = ({
  setup,
  curingFormLoaded,
}: {
  setup: CuringProcessSetup;
  curingFormLoaded: boolean;
}) => {
  if (curingFormLoaded) return false;
  if (!String(setup.oven ?? "").trim()) return false;
  if (!String(setup.curingType ?? "").trim()) return false;
  if (!String(setup.configuration ?? "").trim()) return false;
  if (!String(setup.ovensUtilized ?? "").trim()) return false;
  if (String(setup.configuration).toLowerCase() === "multiple" && setup.motorsToCureCount === "") {
    return false;
  }
  return true;
};

export const canLoadCastingForm = ({
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  usedMotorIds,
  availableMotorOptions,
  setup,
  castingFormLoaded,
}: {
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  usedMotorIds: string[];
  availableMotorOptions: CastingCuringMotorOption[];
  setup: CastingProcessSetupDraft;
  castingFormLoaded: boolean;
}) => {
  if (castingFormLoaded) return false;
  if (!String(castingType ?? "").trim() || !String(castingStation ?? "").trim()) return false;
  if (!String(motorReceivedAt ?? "").trim()) return false;
  if (
    !hasNumericValue(setup.initialVacuum) ||
    !hasNumericValue(setup.castingVacuumPressure) ||
    !hasNumericValue(setup.soakingVacuumPressure) ||
    !hasNumericValue(setup.finalMixCount)
  ) {
    return false;
  }

  const count = resolveCastingMotorCount(castingType, motorCount);
  if (count <= 0) return false;

  if (availableMotorOptions.length === 0) return true;

  const selectedIds = getSelectedCastingDraftMotorIds(count, draftMotorIds);
  return (
    selectedIds.length === count &&
    new Set(selectedIds).size === count &&
    selectedIds.every((id) => !usedMotorIds.includes(id))
  );
};

/** @deprecated Use canLoadCastingForm */
export const canStartCastingCuringForm = ({
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  usedMotorIds,
  schemasReady,
  availableMotorOptions,
  setup = {
    initialVacuum: "",
    castingVacuumPressure: "",
    soakingVacuumPressure: "",
    finalMixCount: "",
  },
  castingFormLoaded = schemasReady,
}: {
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  usedMotorIds: string[];
  schemasReady: boolean;
  availableMotorOptions: CastingCuringMotorOption[];
  setup?: CastingProcessSetupDraft;
  castingFormLoaded?: boolean;
}) =>
  canLoadCastingForm({
    castingType,
    castingStation,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    usedMotorIds,
    availableMotorOptions,
    setup,
    castingFormLoaded,
  });

export const CASTING_CURING_FLOW_LABELS = {
  castingProcessTitle: S.CASTING_PROCESS_TITLE,
  castingType: S.FLOW_CASTING_TYPE,
  castingTypePlaceholder: S.FLOW_CASTING_TYPE_PLACEHOLDER,
  castingStation: S.FLOW_CASTING_STATION,
  castingStationPlaceholder: S.FLOW_CASTING_STATION_PLACEHOLDER,
  motorCount: S.FLOW_MOTOR_COUNT,
  motorCountPlaceholder: S.FLOW_MOTOR_COUNT_PLACEHOLDER,
  motorId: S.FLOW_MOTOR_ID,
  motorIdPlaceholder: S.FLOW_MOTOR_ID_PLACEHOLDER,
  motorReceivedAt: S.FLOW_MOTOR_RECEIVED_AT,
  motorReceivedAtPlaceholder: S.FLOW_MOTOR_RECEIVED_AT_PLACEHOLDER,
  initialVacuum: S.FLOW_INITIAL_VACUUM,
  initialVacuumPlaceholder: S.FLOW_INITIAL_VACUUM_PLACEHOLDER,
  castingVacuumPressure: S.FLOW_CASTING_VACUUM_PRESSURE,
  castingVacuumPressurePlaceholder: S.FLOW_CASTING_VACUUM_PRESSURE_PLACEHOLDER,
  soakingVacuumPressure: S.FLOW_SOAKING_VACUUM_PRESSURE,
  soakingVacuumPressurePlaceholder: S.FLOW_SOAKING_VACUUM_PRESSURE_PLACEHOLDER,
  finalMixCount: S.FLOW_FINAL_MIX_COUNT,
  finalMixCountPlaceholder: S.FLOW_FINAL_MIX_COUNT_PLACEHOLDER,
  loadCastingForm: S.FLOW_LOAD_CASTING_FORM,
  loadCuringForm: S.FLOW_LOAD_CURING_FORM,
  saveCastingContinue: S.FLOW_SAVE_CASTING_CONTINUE,
  removeCastingCard: S.REMOVE_CASTING_CARD,
  removeCastingCardHint: S.REMOVE_CASTING_CARD_HINT,
  sectionTabCasting: S.SECTION_TAB_CASTING,
  sectionTabCuring: S.SECTION_TAB_CURING,
  curingProcessTitle: S.CURING_PROCESS_TITLE,
  curingSelectOven: S.CURING_SELECT_OVEN,
  curingSelectOvenPlaceholder: S.CURING_SELECT_OVEN_PLACEHOLDER,
  curingType: S.CURING_TYPE,
  curingTypePlaceholder: S.CURING_TYPE_PLACEHOLDER,
  curingConfiguration: S.CURING_CONFIGURATION,
  curingConfigurationPlaceholder: S.CURING_CONFIGURATION_PLACEHOLDER,
  curingMotorsToCure: S.CURING_MOTORS_TO_CURE,
  curingMotorsToCurePlaceholder: S.CURING_MOTORS_TO_CURE_PLACEHOLDER,
  curingOvensUtilized: S.CURING_OVENS_UTILIZED,
  curingOvensUtilizedPlaceholder: S.CURING_OVENS_UTILIZED_PLACEHOLDER,
  curingOvensMatchHint: S.CURING_OVENS_MATCH_HINT,
  startForm: S.FLOW_START_FORM,
  schemaLoading: S.SCHEMA_LOADING,
  curingNextStepHint: S.CURING_NEXT_STEP_HINT,
};

export const resolveMotorStage = (batch?: { motorStage?: unknown; motorType?: unknown } | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage && typeof stage === "object") {
    const record = stage as { motorStageId?: number; id?: number };
    const parsed = Number(record.motorStageId ?? record.id ?? 1);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  const numeric = Number(stage);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return 1;
};

const IGNORED_VALUE_KEYS = new Set(["displayValue", "srNo", "_cycleKey"]);

const valueHasUserData = (value: unknown): boolean => {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some((item) =>
      item && typeof item === "object"
        ? Object.entries(item as Record<string, unknown>).some(
            ([key, nestedValue]) =>
              !IGNORED_VALUE_KEYS.has(key) && valueHasUserData(nestedValue),
          )
        : String(item ?? "").trim().length > 0,
    );
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, nestedValue]) =>
        !IGNORED_VALUE_KEYS.has(key) && valueHasUserData(nestedValue),
    );
  }
  return String(value).trim().length > 0;
};

const rowHasUserData = (row: Record<string, unknown>) =>
  Object.entries(row).some(
    ([key, value]) => !IGNORED_VALUE_KEYS.has(key) && valueHasUserData(value),
  );

export const sectionHasUserData = (sectionId: string, values: SchemaFormValues): boolean => {
  const rows = values[sectionId];
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) => row && typeof row === "object" && rowHasUserData(row as Record<string, unknown>));
};

export const isMotorCastingComplete = (
  castingSchema: SchemaDocument | null,
  formValues: SchemaFormValues,
): boolean => {
  const sections = castingSchema?.sections ?? [];
  if (!sections.length) return false;
  return sections.every((section) => sectionHasUserData(section.sectionId, formValues));
};

export const isCastingCompleteForAllMotors = (form: {
  castingSchema: SchemaDocument | null;
  motors?: Array<{ formValues: SchemaFormValues }>;
}) => {
  const { castingSchema, motors } = form;
  if (!castingSchema || !motors?.length) return false;
  return motors.every((motor) => isMotorCastingComplete(castingSchema, motor.formValues ?? {}));
};

export const isCastingCuringFormStarted = (motors?: Array<unknown>) => (motors?.length ?? 0) > 0;
