import { STRINGS } from "../../../app/config/strings";
import type { CuringProcessSetup } from "../../../data/models/user/CastingCuringFormModel";
import {
  getFinalMixPremixesFromSheet,
  getRocketMotorCasingMotorIdsFromSheet,
  type IdentificationSheet,
} from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import type { SchemaBlock, SchemaDocumentV2, SchemaFormValues } from "../../../schema-engine";
import { scopedFormKey } from "../../../schema-engine/state/formState";

const S = STRINGS.MANUFACTURING.CASTING_CURING;

export type CastingCuringMotorOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type CastingCuringAddedMotor = {
  motorId: string;
  motorReceivedAt: string;
  castingStation?: string;
};

export type CastingMotorDraftEntry = {
  motorId: string;
  castingStation: string;
  motorReceivedAt: string;
};

export const createEmptyCastingMotorDraftEntry = (): CastingMotorDraftEntry => ({
  motorId: "",
  castingStation: "",
  motorReceivedAt: "",
});

export const resizeCastingMotorDrafts = (
  count: number,
  prev: CastingMotorDraftEntry[],
): CastingMotorDraftEntry[] =>
  Array.from(
    { length: Math.max(count, 0) },
    (_, idx) => prev[idx] ?? createEmptyCastingMotorDraftEntry(),
  );

export const CASTING_TYPE_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Pair", label: "Pair" },
  { value: "Triple", label: "Triple" },
  { value: "Others", label: "Others" },
] as const;

export type CastingCuringBatchMotorSource = {
  batchId?: string;
  formId?: string;
  batchType?: string;
  motorId?: string;
  motorIds?: Array<string | number>;
  numberOfMotors?: number | string;
  numberOfPremix?: number | string;
  projectId?: string;
  projectName?: string;
  motorStage?: unknown;
  motorType?: unknown;
  identificationSheet?: IdentificationSheet | null;
};

export const enrichCastingCuringBatchFromDetails = <T extends CastingCuringBatchMotorSource>(
  batch: T,
  batchDetails: CastingCuringBatchMotorSource | null | undefined,
): T => {
  if (!batchDetails) return batch;

  const identificationSheet = batchDetails.identificationSheet ?? batch.identificationSheet ?? null;
  const motorIdsFromRocketMotorCasing = getRocketMotorCasingMotorIdsFromSheet(identificationSheet);

  const resolvedMotorIds = (
    batchDetails.motorIds?.length
      ? batchDetails.motorIds
      : motorIdsFromRocketMotorCasing.length
        ? motorIdsFromRocketMotorCasing
        : batch.motorIds
  )
    ?.map((id) => String(id).trim())
    .filter(Boolean);

  return {
    ...batch,
    batchType: batch.batchType ?? batchDetails.batchType ?? batch.batchType,
    motorIds: resolvedMotorIds?.length ? resolvedMotorIds : batch.motorIds,
    numberOfMotors: resolvedMotorIds?.length ?? batchDetails.numberOfMotors ?? batch.numberOfMotors,
    motorId: resolvedMotorIds?.length ? resolvedMotorIds.join(", ") : batch.motorId,
    projectId: batch.projectId ?? batchDetails.projectId ?? batch.projectId,
    projectName: batch.projectName ?? batchDetails.projectName ?? batch.projectName,
    motorStage: batch.motorStage ?? batchDetails.motorStage ?? batch.motorType ?? batch.motorStage,
    numberOfPremix:
      batchDetails.numberOfPremix ??
      batchDetails.identificationSheet?.numberOfPremix ??
      batch.numberOfPremix ??
      batch.identificationSheet?.numberOfPremix,
    identificationSheet,
    stageProgress:
      (batchDetails as { stageProgress?: unknown }).stageProgress ??
      (batch as { stageProgress?: unknown }).stageProgress,
    currentStage:
      (batchDetails as { currentStage?: unknown }).currentStage ??
      (batch as { currentStage?: unknown }).currentStage,
  };
};

/** Motor count is driven by motorIds length when present. */
export const resolveCastingCuringBatchMotorCount = (
  batch?: CastingCuringBatchMotorSource | null,
): number => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  if (ids.length > 0) return ids.length;

  const fromBatch = Number(batch?.numberOfMotors ?? 0);
  if (Number.isFinite(fromBatch) && fromBatch > 0) return fromBatch;

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return 0;

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed.length : 1;
};

/** Final mix bowl rows follow FINAL_MIX premixes from batch mixing metadata. */
export const resolveCastingFinalMixCount = (
  batch?: Pick<CastingCuringBatchMotorSource, "numberOfPremix" | "identificationSheet"> | null,
): number => {
  const fromMixing = getFinalMixPremixesFromSheet(batch?.identificationSheet).length;
  if (fromMixing > 0) return fromMixing;

  const count = Number(batch?.numberOfPremix ?? batch?.identificationSheet?.numberOfPremix ?? 1);
  return Number.isFinite(count) && count > 0 ? count : 1;
};

const CASTING_TYPE_REQUIRED_MOTORS: Record<string, number> = {
  single: 1,
  pair: 2,
  triple: 3,
};

export const resolveCastingTypeOptionsForBatch = (
  batchMotorCount: number,
): CastingCuringMotorOption[] =>
  CASTING_TYPE_OPTIONS.map((option) => {
    const key = option.value.toLowerCase();

    if (batchMotorCount <= 0) {
      return { value: option.value, label: option.label, disabled: true };
    }

    if (key === "others") {
      return {
        value: option.value,
        label: option.label,
        disabled: batchMotorCount <= 3,
      };
    }

    const requiredMotors = CASTING_TYPE_REQUIRED_MOTORS[key] ?? Number.MAX_SAFE_INTEGER;
    return {
      value: option.value,
      label: option.label,
      disabled: requiredMotors > batchMotorCount,
    };
  });

export const shouldShowMotorsToProcessField = (batchMotorCount: number, castingType: string) =>
  batchMotorCount > 3 && String(castingType).toLowerCase() === "others";

export const resolveCastingMotorDraftCount = (castingType: string, motorCount: number | "") =>
  resolveCastingMotorCount(castingType, motorCount);

export const resolveCastingMotorCount = (castingType: string, customCount: number | "") => {
  const normalized = String(castingType ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "single") return 1;
  if (normalized === "pair") return 2;
  if (normalized === "triple") return 3;
  return customCount === "" ? 0 : Number(customCount);
};

export const canSubmitCastingMotorDraft = ({
  castingType,
  motorCount,
  castingMotorDrafts,
  usedMotorIds,
  availableMotorOptions,
  maxMotorCount,
}: {
  castingType: string;
  motorCount: number | "";
  castingMotorDrafts: CastingMotorDraftEntry[];
  usedMotorIds: string[];
  availableMotorOptions: CastingCuringMotorOption[];
  maxMotorCount: number;
}) => {
  if (!String(castingType ?? "").trim()) return false;

  const count = resolveCastingMotorCount(castingType, motorCount);
  if (count <= 0 || count > maxMotorCount) return false;
  if (castingMotorDrafts.length !== count) return false;

  const rowsComplete = castingMotorDrafts.every(
    (row) =>
      String(row.motorId ?? "").trim() &&
      String(row.castingStation ?? "").trim() &&
      String(row.motorReceivedAt ?? "").trim(),
  );
  if (!rowsComplete) return false;

  const selectedIds = castingMotorDrafts
    .map((row) => String(row.motorId ?? "").trim())
    .filter(Boolean);
  if (selectedIds.length !== count || new Set(selectedIds).size !== count) return false;
  if (selectedIds.some((id) => usedMotorIds.includes(id))) return false;

  if (availableMotorOptions.length === 0) return true;

  const selectableOptions = filterUnusedCastingCuringMotorOptions(
    availableMotorOptions,
    usedMotorIds,
  );
  if (selectableOptions.length === 0) return false;

  return selectedIds.every((id) => selectableOptions.some((option) => option.value === id));
};

export const resolveCastingCuringMotorOptions = (
  batch?: {
    motorId?: string;
    motorIds?: Array<string | number>;
    numberOfMotors?: number | string;
    projectName?: string;
  } | null,
): CastingCuringMotorOption[] => {
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

/** Navigation tabs include every batch motor; saved form rows fill in receipt metadata. */
export const mergeCastingCuringMotorsFromBatchAndForm = (
  batch?: CastingCuringBatchMotorSource | null,
  formMotors: CastingCuringAddedMotor[] = [],
): CastingCuringAddedMotor[] => {
  const fromBatch = resolveCastingCuringMotorOptions(batch).map((option) => ({
    motorId: option.value,
    motorReceivedAt: "",
    castingStation: "",
  }));
  if (!fromBatch.length) return formMotors;

  const formById = new Map(formMotors.map((motor) => [motor.motorId, motor]));
  return fromBatch.map(
    (entry) =>
      formById.get(entry.motorId) ?? {
        motorId: entry.motorId,
        motorReceivedAt: "",
        castingStation: "",
      },
  );
};

export const getCastingCuringOrderedMotorIds = (
  batch?: CastingCuringBatchMotorSource | null,
  formMotors: CastingCuringAddedMotor[] = [],
): string[] =>
  mergeCastingCuringMotorsFromBatchAndForm(batch, formMotors).map((motor) => motor.motorId);

export const filterUnusedCastingCuringMotorOptions = (
  options: CastingCuringMotorOption[],
  usedMotorIds: string[],
): CastingCuringMotorOption[] => {
  const used = new Set(usedMotorIds.map((id) => String(id).trim()).filter(Boolean));
  return options.filter((option) => !used.has(option.value));
};

export const resolveCastingCuringMotorOptionsForSlot = (
  availableMotorOptions: CastingCuringMotorOption[],
  usedMotorIds: string[],
  castingMotorDrafts: CastingMotorDraftEntry[],
  slotIndex: number,
): CastingCuringMotorOption[] => {
  const currentValue = String(castingMotorDrafts[slotIndex]?.motorId ?? "").trim();
  const selectedInOtherSlots = new Set(
    castingMotorDrafts
      .map((row, idx) => (idx !== slotIndex ? String(row.motorId ?? "").trim() : ""))
      .filter(Boolean),
  );
  const used = new Set([
    ...usedMotorIds.map((id) => String(id).trim()).filter(Boolean),
    ...selectedInOtherSlots,
  ]);

  return availableMotorOptions.map((option) => ({
    ...option,
    disabled: option.value !== currentValue && used.has(option.value),
  }));
};

export const resolveCastingCuringMotorCountLimit = ({
  batch,
  batchMotorOptions,
  usedMotorIds,
  castingFormLoaded,
}: {
  batch?: CastingCuringBatchMotorSource | null;
  batchMotorOptions: CastingCuringMotorOption[];
  usedMotorIds: string[];
  castingFormLoaded: boolean;
}) => {
  const batchTotal = resolveCastingCuringBatchMotorCount(batch);
  const unusedCount = filterUnusedCastingCuringMotorOptions(batchMotorOptions, usedMotorIds).length;

  if (castingFormLoaded) return Math.max(unusedCount, 0);

  if (batchTotal > 0 && unusedCount > 0) return Math.min(batchTotal, unusedCount);
  if (batchTotal > 0) return batchTotal;
  return Math.max(unusedCount, 0);
};

export const getCastingMotorCountOptions = (maxCount: number) => {
  const count = Math.max(maxCount, 0);
  return Array.from({ length: count }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));
};

export const getSelectedCastingDraftMotorIds = (count: number, draftMotorIds: string[]): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(
    Boolean,
  );

export const buildCuringOvenNoOptions = (noOfOvenAvailable: number | null | undefined) => {
  const count = Math.max(0, Number(noOfOvenAvailable) || 0);
  return Array.from({ length: count }, (_, idx) => {
    const n = idx + 1;
    return {
      value: String(n),
      label: STRINGS.MANUFACTURING.CASTING_CURING.CURING_OVEN_NO_OPTION(n),
    };
  });
};

export const canLoadCuringForm = ({
  setup,
  curingFormLoaded,
}: {
  setup: CuringProcessSetup;
  curingFormLoaded: boolean;
}) => {
  if (curingFormLoaded) return false;
  return Boolean(String(setup.oven ?? "").trim() && String(setup.ovenNo ?? "").trim());
};

export const canAddCastingCuringMotors = (params: {
  castingFormLoaded: boolean;
  castingType: string;
  motorCount: number | "";
  castingMotorDrafts: CastingMotorDraftEntry[];
  usedMotorIds: string[];
  availableMotorOptions: CastingCuringMotorOption[];
  maxMotorCount: number;
}) => params.castingFormLoaded && canSubmitCastingMotorDraft(params);

export const canLoadCastingForm = (params: {
  castingType: string;
  motorCount: number | "";
  castingMotorDrafts: CastingMotorDraftEntry[];
  usedMotorIds: string[];
  availableMotorOptions: CastingCuringMotorOption[];
  castingFormLoaded: boolean;
  maxMotorCount: number;
}) => !params.castingFormLoaded && canSubmitCastingMotorDraft(params);

/** @deprecated Use canLoadCastingForm */
export const canStartCastingCuringForm = ({
  castingType,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  usedMotorIds,
  schemasReady,
  availableMotorOptions,
  castingFormLoaded = schemasReady,
  maxMotorCount = Number.MAX_SAFE_INTEGER,
  castingStation: _castingStation,
  castingMotorDrafts,
}: {
  castingType: string;
  castingStation?: string;
  motorCount: number | "";
  draftMotorIds?: string[];
  motorReceivedAt?: string;
  usedMotorIds: string[];
  schemasReady: boolean;
  availableMotorOptions: CastingCuringMotorOption[];
  castingFormLoaded?: boolean;
  maxMotorCount?: number;
  castingMotorDrafts?: CastingMotorDraftEntry[];
}) => {
  const count = resolveCastingMotorCount(castingType, motorCount);
  const resolvedDrafts =
    castingMotorDrafts ??
    resizeCastingMotorDrafts(
      count,
      (draftMotorIds ?? []).map((motorId, index) => ({
        motorId,
        castingStation: _castingStation ?? "",
        motorReceivedAt: index === 0 ? (motorReceivedAt ?? "") : "",
      })),
    );

  return canLoadCastingForm({
    castingType,
    motorCount,
    castingMotorDrafts: resolvedDrafts,
    usedMotorIds,
    availableMotorOptions,
    castingFormLoaded,
    maxMotorCount: maxMotorCount ?? Number.MAX_SAFE_INTEGER,
  });
};

export const CASTING_CURING_FLOW_LABELS = {
  castingProcessTitle: S.CASTING_PROCESS_TITLE,
  castingType: S.FLOW_CASTING_TYPE,
  castingTypePlaceholder: S.FLOW_CASTING_TYPE_PLACEHOLDER,
  castingStation: S.FLOW_CASTING_STATION,
  castingStationPlaceholder: S.FLOW_CASTING_STATION_PLACEHOLDER,
  batchMotorsAvailable: S.FLOW_BATCH_MOTORS_AVAILABLE,
  motorsToProcess: S.FLOW_MOTORS_TO_PROCESS,
  motorsToProcessPlaceholder: S.FLOW_MOTORS_TO_PROCESS_PLACEHOLDER,
  motorRowTitle: S.FLOW_MOTOR_ROW_TITLE,
  motorCount: S.FLOW_MOTOR_COUNT,
  motorCountPlaceholder: S.FLOW_MOTOR_COUNT_PLACEHOLDER,
  motorId: S.FLOW_MOTOR_ID,
  motorIdPlaceholder: S.FLOW_MOTOR_ID_PLACEHOLDER,
  motorReceivedAt: S.FLOW_MOTOR_RECEIVED_AT,
  motorReceivedAtPlaceholder: S.FLOW_MOTOR_RECEIVED_AT_PLACEHOLDER,
  loadCastingForm: S.FLOW_LOAD_CASTING_FORM,
  addMotors: S.ADD_MOTORS_ACTION,
  loadCuringForm: S.FLOW_LOAD_CURING_FORM,
  saveCastingContinue: S.FLOW_SAVE_CASTING_CONTINUE,
  removeCastingCard: S.REMOVE_CASTING_CARD,
  removeCastingCardHint: S.REMOVE_CASTING_CARD_HINT,
  sectionTabCasting: S.SECTION_TAB_CASTING,
  sectionTabCuring: S.SECTION_TAB_CURING,
  curingProcessTitle: S.CURING_PROCESS_TITLE,
  curingSelectOven: S.CURING_SELECT_OVEN,
  curingSelectOvenPlaceholder: S.CURING_SELECT_OVEN_PLACEHOLDER,
  curingSelectOvenNo: S.CURING_SELECT_OVEN_NO,
  curingSelectOvenNoPlaceholder: S.CURING_SELECT_OVEN_NO_PLACEHOLDER,
  curingType: S.CURING_TYPE,
  curingTypePlaceholder: S.CURING_TYPE_PLACEHOLDER,
  curingConfiguration: S.CURING_CONFIGURATION,
  curingConfigurationPlaceholder: S.CURING_CONFIGURATION_PLACEHOLDER,
  curingMotorsToCure: S.CURING_MOTORS_TO_CURE,
  curingMotorsToCurePlaceholder: S.CURING_MOTORS_TO_CURE_PLACEHOLDER,
  curingOvensUtilized: S.CURING_OVENS_UTILIZED,
  curingOvensUtilizedPlaceholder: S.CURING_OVENS_UTILIZED_PLACEHOLDER,
  curingOvensMatchHint: S.CURING_OVENS_MATCH_HINT,
  curingCycleMatrixTitle: S.CURING_CYCLE_MATRIX_TITLE,
  curingMatrixProjectName: S.CURING_MATRIX_PROJECT_NAME,
  curingMatrixProjectId: S.CURING_MATRIX_PROJECT_ID,
  curingMatrixBatchId: S.CURING_MATRIX_BATCH_ID,
  curingMatrixDurationHint: S.CURING_MATRIX_DURATION_HINT,
  curingMatrixDurationPlaceholder: S.CURING_MATRIX_DURATION_PLACEHOLDER,
  curingMatrixAddRow: S.CURING_MATRIX_ADD_ROW,
  curingMatrixAddColumn: S.CURING_MATRIX_ADD_COLUMN,
  curingMatrixAddColumnPlaceholder: S.CURING_MATRIX_ADD_COLUMN_PLACEHOLDER,
  curingMatrixNoStages: S.CURING_MATRIX_NO_STAGES,
  curingStagesLoading: S.CURING_STAGES_LOADING,
  curingMotorStage: S.CURING_MOTOR_STAGE,
  curingCyclesLoading: S.CURING_CYCLES_LOADING,
  startForm: S.FLOW_START_FORM,
  schemaLoading: S.SCHEMA_LOADING,
  curingNextStepHint: S.CURING_NEXT_STEP_HINT,
};

export const resolveMotorStage = (batch?: { motorStage?: unknown; motorType?: unknown } | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage && typeof stage === "object") {
    const record = stage as { motorStageId?: number; id?: number };
    const parsed = Number(record.motorStageId ?? record.id);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 3) return parsed;
    return 1;
  }

  const numeric = Number(stage);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 3) return numeric;
  return 1;
};

export const formatCuringTypeLabel = (curingType: string) => {
  const normalized = String(curingType ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "NORMAL_CURING") return S.CURING_TYPE_NORMAL;
  if (normalized === "CONFINED_CURING") return S.CURING_TYPE_CONFINED;
  if (normalized === "NITROGEN_PRESSURE_CURING") return S.CURING_TYPE_NITROGEN_PRESSURE;
  return curingType || "—";
};

export const formatMotorStageLabel = (
  config?: { motorStage?: number; motorStageName?: string } | null,
  batch?: { motorStage?: unknown; motorType?: unknown } | null,
) => {
  const fromConfig = String(config?.motorStageName ?? "").trim();
  if (fromConfig) return fromConfig;

  const stage =
    config?.motorStage != null && Number.isFinite(Number(config.motorStage))
      ? Number(config.motorStage)
      : resolveMotorStage(batch);

  if (Number.isFinite(stage) && stage >= 0 && stage <= 3) {
    return `Stage ${stage}`;
  }

  return "";
};

const IGNORED_VALUE_KEYS = new Set(["displayValue", "srNo", "_cycleKey"]);

const valueHasUserData = (value: unknown): boolean => {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some((item) =>
      item && typeof item === "object"
        ? Object.entries(item as Record<string, unknown>).some(
            ([key, nestedValue]) => !IGNORED_VALUE_KEYS.has(key) && valueHasUserData(nestedValue),
          )
        : String(item ?? "").trim().length > 0,
    );
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, nestedValue]) => !IGNORED_VALUE_KEYS.has(key) && valueHasUserData(nestedValue),
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
  return rows.some(
    (row) => row && typeof row === "object" && rowHasUserData(row as Record<string, unknown>),
  );
};

const isDisplayBlock = (block: SchemaBlock) => block.type === "display";

const blockHasUserDataInValues = (
  block: SchemaBlock,
  formValues: SchemaFormValues,
  scope: string,
): boolean => {
  if (block.type === "display") return true;

  if (block.type === "section") {
    if (block.repeat) {
      return valueHasUserData(formValues[block.id]);
    }
    const children = block.children ?? [];
    if (!children.length) return true;
    return children.every((child) => blockHasUserDataInValues(child, formValues, block.id));
  }

  if (block.type === "group") {
    if (block.repeat) {
      return valueHasUserData(formValues[block.id]);
    }
    const children = block.children ?? [];
    if (!children.length) return true;
    return children.every((child) => blockHasUserDataInValues(child, formValues, scope));
  }

  if (block.type === "field" || block.type === "table" || block.type === "matrix") {
    return valueHasUserData(formValues[scopedFormKey(scope, block.id)]);
  }

  return true;
};

export const isMotorCastingComplete = (
  castingSchema: SchemaDocumentV2 | null,
  formValues: SchemaFormValues,
): boolean => {
  const sections = castingSchema?.data?.sections ?? [];
  if (!sections.length) return false;

  return sections.every((section) => {
    const children = (section.children ?? []).filter((block) => !isDisplayBlock(block));
    if (!children.length) return true;
    return children.every((block) => blockHasUserDataInValues(block, formValues, section.id));
  });
};

export const isCastingCompleteForAllMotors = (form: {
  castingSchema: SchemaDocumentV2 | null;
  motors?: Array<{ formValues: SchemaFormValues }>;
}) => {
  const { castingSchema, motors } = form;
  if (!castingSchema || !motors?.length) return false;
  return motors.every((motor) => isMotorCastingComplete(castingSchema, motor.formValues ?? {}));
};

export const isCastingCuringFormStarted = (motors?: Array<unknown>) => (motors?.length ?? 0) > 0;
