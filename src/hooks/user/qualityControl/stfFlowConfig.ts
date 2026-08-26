import { STRINGS } from "../../../app/config/strings";
import {
  getBemMotorIdsFromSheet,
  type IdentificationSheet,
} from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  normalizeBatchTypeCode,
  normalizeSubdepartmentBatchStatus,
} from "../../../data/models/user/SubdepartmentBatchModel";
import { OPERATION_STATUS } from "../../operationStatus";
import {
  buildMotorNavGateHelpers,
  isMotorEnabledForWorkflow,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import { mapApprovedMotorsToOptions as mapTrimmingApprovedMotorsToOptions } from "../manufacturing/trimmingFlowConfig";

export type STFBatch = {
  id: number | string;
  batchId: string;
  lotId: string;
  motorId: string;
  motorIds?: string[];
  bemMotorId?: string | string[] | null;
  bemMotorIds?: string[];
  motorType: string;
  motorStage?: string | number;
  batchType?: string | null;
  subBatchType?: string | null;
  projectId?: string;
  projectName?: string;
  numberOfMotors?: number;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  stfStatus: string;
  formId?: string | null;
  subType?: StfSubType | null;
  motorIdNo?: string | null;
  rejectionReason?: string | null;
};

export type StfMotorTypeOption = {
  value: StfSubType;
  label: string;
};

export type StfMotorOption = { value: string; label: string; disabled?: boolean };

export type StfAddedMotor = { motorId: string; subType: StfSubType };

export const isStfMainMotorBatch = (batchType?: string | null) =>
  normalizeBatchTypeCode(batchType) === "MAIN";

export const isStfSubscaleBatch = (batchType?: string | null) =>
  normalizeBatchTypeCode(batchType) === "SUBSCALE";

export const normalizeStfSubBatchType = (raw?: string | null): string => {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!s) return "";
  if (s.includes("QUALIFICATION")) return "QUALIFICATION";
  if (s.includes("EXPERIMENTAL")) return "EXPERIMENTAL";
  return s;
};

export const isStfQualificationSubBatch = (subBatchType?: string | null) =>
  normalizeStfSubBatchType(subBatchType) === "QUALIFICATION";

export const isStfExperimentalSubBatch = (subBatchType?: string | null) =>
  normalizeStfSubBatchType(subBatchType) === "EXPERIMENTAL";

/**
 * Prefer an explicit Subscale from list or details. Batch details may default empty
 * batchType to MAIN, which must not wipe a Subscale list row.
 */
export const resolveStfWorkingBatchType = (
  listBatchType?: string | null,
  detailsBatchType?: string | null,
): string => {
  const listCode = normalizeBatchTypeCode(listBatchType);
  const detailsCode = normalizeBatchTypeCode(detailsBatchType);
  if (listCode === "SUBSCALE" || detailsCode === "SUBSCALE") return "SUBSCALE";
  if (listCode === "MAIN" || detailsCode === "MAIN") return "MAIN";
  return listCode || detailsCode || "";
};

export const resolveStfWorkingSubBatchType = (
  listSubBatchType?: string | null,
  detailsSubBatchType?: string | null,
): string => {
  const listCode = normalizeStfSubBatchType(listSubBatchType);
  const detailsCode = normalizeStfSubBatchType(detailsSubBatchType);
  if (listCode === "EXPERIMENTAL" || detailsCode === "EXPERIMENTAL") return "EXPERIMENTAL";
  if (listCode === "QUALIFICATION" || detailsCode === "QUALIFICATION") return "QUALIFICATION";
  return listCode || detailsCode || "";
};

/**
 * ACEM: seed batch-linked main motors for Main batches and Subscale Qualification.
 * Subscale Experimental is BEM-only.
 */
export const shouldSeedStfMainMotors = (
  batchType?: string | null,
  subBatchType?: string | null,
): boolean => {
  if (isStfMainMotorBatch(batchType)) return true;
  return isStfSubscaleBatch(batchType) && isStfQualificationSubBatch(subBatchType);
};

/**
 * ACEM: BEM No. selection for Main, Subscale Qualification, and Subscale Experimental.
 */
export const shouldShowStfBemMotorSelection = (
  batchType?: string | null,
  subBatchType?: string | null,
): boolean => {
  if (isStfMainMotorBatch(batchType)) return true;
  if (!isStfSubscaleBatch(batchType)) return false;
  return (
    isStfQualificationSubBatch(subBatchType) ||
    isStfExperimentalSubBatch(subBatchType) ||
    !normalizeStfSubBatchType(subBatchType)
  );
};

/** Motors linked to a Main-scale / Qualification batch (from batch details / list row). */
export const resolveStfBatchMotorEntries = (
  batch?: {
    motorId?: string | null;
    motorIds?: Array<string | number> | null;
  } | null,
  batchDetails?: {
    motorId?: string | null;
    motorIds?: Array<string | number> | null;
  } | null,
): StfAddedMotor[] => {
  const collectIds = (source: unknown): string[] => {
    if (!source || typeof source !== "object") return [];
    const row = source as Record<string, unknown>;
    const ids: string[] = [];
    const push = (value: unknown) => {
      const normalized = String(value ?? "").trim();
      if (normalized) ids.push(normalized);
    };

    if (Array.isArray(row.motorIds)) {
      row.motorIds.forEach((value) => push(value));
    }

    if (row.motorId != null) {
      String(row.motorId)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .forEach((id) => push(id));
    }

    return ids.filter((id, index, arr) => arr.indexOf(id) === index);
  };

  const motorIds = collectIds(batchDetails ?? null);
  const fallbackIds = motorIds.length > 0 ? motorIds : collectIds(batch ?? null);
  if (fallbackIds.length === 0) return [];

  return fallbackIds.map((motorId) => ({ motorId, subType: "MAIN_MOTOR" as const }));
};

export const STF_MOTOR_TYPE_OPTIONS: StfMotorTypeOption[] = [
  { value: "BEM", label: "BEM" },
  { value: "MAIN_MOTOR", label: "Main Motor" },
];

export const STF_FLOW_LABELS = {
  motorType: "Motor Type",
  motorTypePlaceholder: "Select motor type",
  motorId: "Motor ID",
  motorIdPlaceholder: "Select motor",
  bemNo: "BEM No.",
  bemNoPlaceholder: "Select BEM number",
  motorCount: "No. of motors",
  motorCountPlaceholder: "Select count",
  loadForm: "Load Form",
  addMotors: "Add Motor",
  addBem: "Add Motor",
  approvedMotorsLoading: "Loading approved motors...",
  setupHint:
    "Main motors are listed below. Select a BEM number from the batch to add BEM motors.",
  setupHintMainMotor: "Select approved motor ID(s), then load or add main motors.",
  setupHintMainMotorLoaded: "Select more main motor IDs below to add additional motors.",
  setupHintBem: "Select a BEM number, then click Add Motor to open its form.",
  setupHintBemLoaded: "Select another BEM number to add more motors.",
  setupHintBemEmpty: "No BEM motors found on this batch identification sheet.",
  motorNavTitle: "Motor navigation",
  motorNavHint: "Switch between motors to fill static testing details.",
  motorCardTitle: "Motor",
  bemCardTitle: "BEM",
  navBack: "Back",
  navNext: "Next",
};

export const mergeStfMockBatches = (apiBatches: STFBatch[]): STFBatch[] => apiBatches;

export const resolveBatchProjectId = (batch?: STFBatch | null) =>
  String(batch?.projectId ?? batch?.projectName ?? "").trim();

export const resolveBatchMotorStage = (batch?: STFBatch | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage == null || stage === "") return "";
  return String(stage).trim();
};

export const resolveStfMotorOptions = (batch?: STFBatch | null): StfMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((value) => ({ value, label: value }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((value) => ({ value, label: value }));
  }

  return [{ value: singleId, label: singleId }];
};

/** Resolve BEM motor dropdown options from batch details / identification sheet metadata. */
export const resolveBemMotorOptionsFromBatchDetails = (
  batchDetails?: {
    identificationSheet?: IdentificationSheet | null;
    bemMotors?: unknown;
    bemMotorIds?: unknown;
    metadata?: unknown;
  } | null,
): StfMotorOption[] => {
  if (!batchDetails) return [];

  const ids = new Set<string>();
  const push = (value: unknown) => {
    if (value == null) return;
    if (typeof value === "string" || typeof value === "number") {
      const normalized = String(value).trim();
      if (normalized) ids.add(normalized);
      return;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      const row = value as Record<string, unknown>;
      // Subscale identification-sheet metadata uses bemMouldNo as the BEM motor id.
      const id = String(
        row.bemMouldNo ?? row.bemNo ?? row.bemMotorNo ?? row.motorId ?? row.motorCode ?? "",
      ).trim();
      if (id) ids.add(id);
    }
  };

  const pushFromMeta = (meta: Record<string, unknown> | null | undefined) => {
    if (!meta) return;
    if (Array.isArray(meta.bemMotors)) meta.bemMotors.forEach(push);
    if (Array.isArray(meta.bemMotorIds)) meta.bemMotorIds.forEach(push);

    const subScale =
      (meta.subScale && typeof meta.subScale === "object"
        ? (meta.subScale as Record<string, unknown>)
        : null) ??
      (meta.subscale && typeof meta.subscale === "object"
        ? (meta.subscale as Record<string, unknown>)
        : null);
    if (!subScale) return;
    if (Array.isArray(subScale.bemMotors)) subScale.bemMotors.forEach(push);
    if (Array.isArray(subScale.bemMotorIds)) subScale.bemMotorIds.forEach(push);
  };

  getBemMotorIdsFromSheet(batchDetails.identificationSheet).forEach((id) => ids.add(id));

  // Also read raw sheet metadata in case subscale was not flattened into metadata.bemMotors.
  const sheetMeta =
    batchDetails.identificationSheet?.metadata &&
    typeof batchDetails.identificationSheet.metadata === "object"
      ? (batchDetails.identificationSheet.metadata as Record<string, unknown>)
      : null;
  pushFromMeta(sheetMeta);

  if (Array.isArray(batchDetails.bemMotors)) batchDetails.bemMotors.forEach(push);
  if (Array.isArray(batchDetails.bemMotorIds)) batchDetails.bemMotorIds.forEach(push);

  const meta =
    batchDetails.metadata && typeof batchDetails.metadata === "object"
      ? (batchDetails.metadata as Record<string, unknown>)
      : null;
  pushFromMeta(meta);

  return Array.from(ids).map((value) => ({ value, label: value }));
};

export const mapApprovedMotorsToOptions = mapTrimmingApprovedMotorsToOptions;

export const mergeStfMotorOptions = (
  approved: StfMotorOption[],
  batch: StfMotorOption[],
): StfMotorOption[] => {
  const seen = new Set<string>();
  const merged: StfMotorOption[] = [];

  for (const option of [...approved, ...batch]) {
    const value = String(option.value ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    merged.push({ value, label: option.label || value });
  }

  return merged;
};

export const getStfMotorCountOptions = (maxCount: number) =>
  Array.from({ length: Math.max(maxCount, 0) }, (_, idx) => ({
    value: String(idx + 1),
    label: String(idx + 1),
  }));

export const getSelectedStfDraftMotorIds = (count: number, draftMotorIds: string[]): string[] =>
  Array.from({ length: count }, (_, idx) => String(draftMotorIds[idx] ?? "").trim()).filter(
    Boolean,
  );

export const resolveEffectiveStfMotorCount = (
  motorCount: number | "",
  draftMotorIds: string[],
): number => {
  const count = motorCount === "" ? 0 : Number(motorCount);
  if (count > 0) return count;
  return draftMotorIds.some((id) => String(id ?? "").trim().length > 0) ? 1 : 0;
};

export const resolveStfMotorCountLimit = ({
  availableMotorOptions,
  batchNumberOfMotors,
}: {
  availableMotorOptions: StfMotorOption[];
  batchNumberOfMotors?: number;
}) => {
  const optionLimit = availableMotorOptions.length;
  const batchLimit = Number(batchNumberOfMotors ?? 0);
  if (batchLimit > 0 && optionLimit > 0) return Math.min(batchLimit, optionLimit);
  if (batchLimit > 0) return batchLimit;
  return Math.max(optionLimit, 1);
};

export const hasStfMotorsOfSubType = (addedMotors: StfAddedMotor[], subType: StfSubType) =>
  addedMotors.some((motor) => motor.subType === subType);

export const canLoadStfMainMotorForm = ({
  motorCount,
  draftMotorIds,
  usedMotorIds,
  hasMainMotors,
  availableMotorOptions,
  maxMotorCount,
}: {
  motorCount: number | "";
  draftMotorIds: string[];
  usedMotorIds: string[];
  hasMainMotors: boolean;
  availableMotorOptions: StfMotorOption[];
  maxMotorCount: number;
}) => {
  if (hasMainMotors) return false;
  if (availableMotorOptions.length === 0 || maxMotorCount <= 0) return false;

  const count = resolveEffectiveStfMotorCount(motorCount, draftMotorIds);
  if (count <= 0 || count > maxMotorCount) return false;

  const selectedIds = getSelectedStfDraftMotorIds(count, draftMotorIds);
  if (selectedIds.length !== count) return false;
  if (new Set(selectedIds).size !== selectedIds.length) return false;
  return !selectedIds.some((id) => usedMotorIds.includes(id));
};

export const canAddStfMainMotors = ({
  motorCount,
  draftMotorIds,
  usedMotorIds,
  usedMainMotorIds,
  hasMainMotors,
  availableMotorOptions,
  maxMotorCount,
}: {
  motorCount: number | "";
  draftMotorIds: string[];
  usedMotorIds: string[];
  usedMainMotorIds: string[];
  hasMainMotors: boolean;
  availableMotorOptions: StfMotorOption[];
  maxMotorCount: number;
}) => {
  if (!hasMainMotors) return false;
  if (availableMotorOptions.length === 0 || maxMotorCount <= 0) return false;

  const count = resolveEffectiveStfMotorCount(motorCount, draftMotorIds);
  if (count <= 0) return false;

  const selectedIds = getSelectedStfDraftMotorIds(count, draftMotorIds);
  if (selectedIds.length !== count) return false;
  if (new Set(selectedIds).size !== selectedIds.length) return false;

  const newIds = selectedIds.filter((id) => !usedMotorIds.includes(id));
  return newIds.length > 0 && usedMainMotorIds.length + newIds.length <= maxMotorCount;
};

/** @deprecated ACEM BEM flow uses Add Motor for first and subsequent motors. */
export const canLoadStfBemForm = (bemNo: string, usedMotorIds: string[], _hasBemMotors?: boolean) => {
  const trimmed = String(bemNo ?? "").trim();
  if (!trimmed) return false;
  return !usedMotorIds.includes(trimmed);
};

/** True when a BEM number is selected and not already in motor navigation. */
export const canAddStfBemMotor = (
  bemNo: string,
  usedMotorIds: string[],
  _hasBemMotors?: boolean,
) => {
  const trimmed = String(bemNo ?? "").trim();
  if (!trimmed) return false;
  return !usedMotorIds.includes(trimmed);
};

/** @deprecated Use canLoadStfMainMotorForm / canLoadStfBemForm */
export const canLoadStfForm = (subType: string, motorIdNo: string) => {
  if (!String(subType ?? "").trim()) return false;
  if (mapStfSubType(subType) === "MAIN_MOTOR") {
    return String(motorIdNo ?? "").trim().length > 0;
  }
  return true;
};

export interface BemMotor {
  motorId: string;
  bemNo?: string;
  motorCode: string;
  stfTestNo?: string;
  status: string;
  createdBy: string;
  createdOn: string;
  formId?: string | null;
  subType?: StfSubType | null;
  rejectionReason?: string | null;
}

const BEM_STATUS_TAB_ORDER = [
  OPERATION_STATUS.TO_BE_INITIATED,
  OPERATION_STATUS.IN_PROGRESS,
  OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  OPERATION_STATUS.WAITING_FOR_APPROVAL,
  OPERATION_STATUS.WAITING_FOR_APPROVAL,
  OPERATION_STATUS.APPROVED,
  OPERATION_STATUS.COMPLETELY_APPROVED,
  OPERATION_STATUS.REJECTED,
] as const;

/**
 * Map `/stf/bem-motor/list` statusCounts (camelCase) onto UI status labels.
 * Tabs are derived only from keys present in the API response.
 */
export const mapBemMotorStatusCountsForUi = (
  server: Record<string, number> | undefined,
  totalRecords: number,
): Record<string, number> => {
  const allKey = STRINGS.USER_BATCH_LIST.FILTER_ALL;
  const byLabel: Record<string, number> = {};

  Object.entries(server ?? {}).forEach(([key, value]) => {
    if (typeof value !== "number") return;
    const label = String(normalizeSubdepartmentBatchStatus(key));
    byLabel[label] = (byLabel[label] ?? 0) + value;
  });

  const sum = Object.values(byLabel).reduce((acc, value) => acc + value, 0);
  return {
    ...byLabel,
    [allKey]: sum > 0 ? sum : totalRecords,
  };
};

/** Status filter tabs: All + statuses returned by list API statusCounts. */
export const resolveBemMotorStatusTabs = (
  statusCounts: Record<string, number> | undefined,
): string[] => {
  const allKey = STRINGS.USER_BATCH_LIST.FILTER_ALL;
  const countKeys = Object.keys(statusCounts ?? {}).filter((key) => key !== allKey);
  if (!countKeys.length) return [allKey];

  const ordered = BEM_STATUS_TAB_ORDER.filter((status) => countKeys.includes(status));
  const extras = countKeys.filter(
    (key) => !BEM_STATUS_TAB_ORDER.includes(key as (typeof BEM_STATUS_TAB_ORDER)[number]),
  );
  return [allKey, ...ordered, ...extras];
};

export type StfNavigationMotor = {
  motorId?: string;
  subType?: StfSubType | string | null;
};

export const isStfMotorEnabledForWorkflow = (
  motorId: string,
  motorCards: StfNavigationMotor[],
  gate: PreviousStageApprovedUnits | null | undefined,
  getStatus: (motorId: string) => string | undefined | null,
  options: {
    facilityType: "ACEM" | "OTHER_BEM";
    subType?: StfSubType | string | null;
  },
): boolean => {
  if (options.facilityType === "OTHER_BEM") return true;
  if (String(options.subType ?? "").toUpperCase() === "BEM") return true;

  const mainMotorIds = motorCards
    .filter((entry) => String(entry.subType ?? "").toUpperCase() !== "BEM")
    .map((entry) => String(entry.motorId ?? "").trim())
    .filter(Boolean);

  return isMotorEnabledForWorkflow(motorId, mainMotorIds, gate, getStatus);
};

export const buildStfMotorNavGateHelpers = (
  motorCards: StfNavigationMotor[],
  previousStageGate: PreviousStageApprovedUnits | null | undefined,
  resolveMotorStatus: (motorId: string) => string | undefined | null,
  facilityType: "ACEM" | "OTHER_BEM",
  messages: {
    previousStage?: string;
    sequential?: string;
  } = {},
) => {
  const mainMotorCards = motorCards.filter(
    (entry) => String(entry.subType ?? "").toUpperCase() !== "BEM",
  );
  const mainMotorGate = buildMotorNavGateHelpers(
    mainMotorCards,
    previousStageGate,
    resolveMotorStatus,
    messages,
  );

  const resolveMainMotorIndex = (index: number) => {
    const entry = motorCards[index];
    if (!entry) return -1;
    return mainMotorCards.findIndex(
      (mainEntry) => String(mainEntry.motorId ?? "").trim() === String(entry.motorId ?? "").trim(),
    );
  };

  return {
    isStfMotorTabEnabled: (index: number) => {
      const entry = motorCards[index];
      if (!entry) return false;
      if (facilityType === "OTHER_BEM") return true;
      if (String(entry.subType ?? "").toUpperCase() === "BEM") return true;
      const mainIndex = resolveMainMotorIndex(index);
      if (mainIndex < 0) return false;
      return mainMotorGate.isMotorTabEnabled(mainIndex);
    },
    getStfMotorTabTooltip: (index: number) => {
      const entry = motorCards[index];
      if (!entry) return undefined;
      if (facilityType === "OTHER_BEM") return undefined;
      if (String(entry.subType ?? "").toUpperCase() === "BEM") return undefined;
      const mainIndex = resolveMainMotorIndex(index);
      if (mainIndex < 0) return undefined;
      return mainMotorGate.getMotorTabTooltip(mainIndex);
    },
    isStfMotorWorkflowEnabled: (
      motorId: string,
      subType?: StfSubType | string | null,
    ) =>
      isStfMotorEnabledForWorkflow(motorId, motorCards, previousStageGate, resolveMotorStatus, {
        facilityType,
        subType,
      }),
  };
};

export type StfSubType = "BEM" | "MAIN_MOTOR";

export const mapStfSubType = (subType?: string | null): StfSubType => {
  const normalized = String(subType ?? "").toUpperCase();
  return normalized === "MAIN_MOTOR" ? "MAIN_MOTOR" : "BEM";
};
