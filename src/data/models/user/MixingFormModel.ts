import {
  createProcessParticularRows,
  createQualityCheckRows,
  isQuadObservedLayout,
  MixingOperation,
  normalizeQualityCheckParameterKey,
  type QualityObservedLayout,
} from "../../../hooks/user/manufacturing/mixingConfig";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import { normalizeApproverBatchStatus } from "../approver/ApproverBatchListModel";
import {
  getPremixStatusLabel,
  type PremixSubmissionStatus,
} from "./RawMaterialPreparationModel";
import { formatSubdepartmentBatchTypeLabel, normalizeSubdepartmentBatchStatus } from "./SubdepartmentBatchModel";

export type ProcessParticularRow = {
  operationId: number;
  operation?: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

export type QualityCheckRow = {
  parameter: string;
  parameterId: string;
  specification: string;
  observedLayout: QualityObservedLayout;
  observed1: string;
  observed2: string;
  observed3: string;
  observed4: string;
  sampleCount?: number;
};

export type PremixEntry = {
  premixNo: string;
  mixerType: string;
  bldgNo: string;
  bowlId: string;
  bowlTrialDate: string;
  bowlTrialObservations: string;
  premixDate: string;
  premixQuantity: string;
  mixingCycle?: string;
  mixingCycleId?: string;
  mixingCycleCode?: string;
  mixingCycleName?: string;
  processParticulars: ProcessParticularRow[];
  qualityChecks: QualityCheckRow[];
  mixCardSubmissionStatus?: MixCardSubmissionStatus;
  rejectionReason?: string | null;
  remarks?: string | null;
};

export type FinalMixEntry = {
  mixNo: string;
  linkedPremixNo: string;
  mixerType: string;
  bldgNo: string;
  bowlId: string;
  mixingCycle: string;
  mixingCycleId?: string;
  mixingCycleCode?: string;
  mixingCycleName?: string;
  processParticulars: ProcessParticularRow[];
  qualityChecks: QualityCheckRow[];
  mixCardSubmissionStatus?: MixCardSubmissionStatus;
  rejectionReason?: string | null;
  remarks?: string | null;
};

/** Same lifecycle statuses as RMP premix / Case Prep motor partial approval. */
export type MixCardSubmissionStatus = PremixSubmissionStatus;

export type MixCardStageType = "PREMIX" | "FINAL_MIX";

export type MixingApproverCard = {
  mixCardId: string;
  stageType: MixCardStageType;
  cardNo: string;
  label: string;
  mixCardSubmissionStatus: MixCardSubmissionStatus;
  rejectionReason?: string | null;
  remarks?: string | null;
  premix?: PremixEntry;
  finalMix?: FinalMixEntry;
};

export type MixCardCounts = {
  pendingMixCardCount: number;
  approvedMixCardCount: number;
  rejectedMixCardCount: number;
  inProgressMixCardCount: number;
  toBeInitiatedMixCardCount: number;
  totalMixCardCount: number;
};

export const buildMixCardId = (stageType: MixCardStageType, cardNo: string | number) =>
  `${stageType}-${String(cardNo).trim()}`;

export const normalizeMixCardStatus = (
  status: unknown,
): MixCardSubmissionStatus => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (
    normalized === "TO_BE_INITIATED" ||
    normalized === "IN_PROGRESS" ||
    normalized === "WAITING_FOR_APPROVAL" ||
    normalized === "APPROVED" ||
    normalized === "REJECTED" ||
    normalized === "FINAL_APPROVAL_COMPLETED"
  ) {
    return normalized as MixCardSubmissionStatus;
  }
  return "TO_BE_INITIATED";
};

export const isMixCardApproverTabDisabled = (
  status?: MixCardSubmissionStatus | string | null,
): boolean => !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS";

export const isMixCardApproverActionable = (
  status?: MixCardSubmissionStatus | string | null,
): boolean => status === "WAITING_FOR_APPROVAL";

export type MixCardStatusMeta = {
  mixCardSubmissionStatus: MixCardSubmissionStatus;
  mixCardSubmissionType?: "DRAFT" | "SUBMIT" | string | null;
  rejectionReason?: string | null;
  remarks?: string | null;
};

export const isMixCardLocked = (status?: MixCardSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isMixCardEditable = (status?: MixCardSubmissionStatus | string | null) =>
  !status ||
  status === "TO_BE_INITIATED" ||
  status === "IN_PROGRESS" ||
  status === "REJECTED";

/** Entire form can be approved/rejected once submitted and every mix card is approved. */
export const canApproverActionEntireMixingForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  mixCards?: Array<{ mixCardSubmissionStatus?: MixCardSubmissionStatus | string | null }>;
}): boolean => {
  const formType = String(params.formSubmissionType ?? "").trim().toUpperCase();
  if (formType !== "SUBMIT") return false;

  const mixCards = params.mixCards ?? [];
  if (mixCards.length === 0) return false;
  const allApproved = mixCards.every(
    (card) => String(card.mixCardSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
  if (!allApproved) return false;

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

  return (
    statusUpper === "WAITING_FOR_COMPLETE_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL ||
    status === OPERATION_STATUS.WAITING_FOR_APPROVAL ||
    statusUpper === "WAITING_FOR_APPROVAL"
  );
};

export const getMixCardStatusLabel = (status?: MixCardSubmissionStatus | string | null) =>
  getPremixStatusLabel(status as PremixSubmissionStatus);

export const getMixingBatchStatusLabel = (status: unknown): string =>
  String(normalizeSubdepartmentBatchStatus(status));

/** Derive a card status from batch/form status when per-card API fields are absent. */
export const stubMixCardStatusFromFormStatus = (
  formStatus: unknown,
): MixCardSubmissionStatus => {
  const status = String(formStatus ?? "").trim();
  const statusUpper = status.toUpperCase().replace(/\s+/g, "_");

  if (
    statusUpper === "WAITING_FOR_COMPLETE_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL ||
    statusUpper === "FINAL_APPROVAL_COMPLETED" ||
    status === OPERATION_STATUS.FINAL_APPROVAL_COMPLETED ||
    statusUpper === "APPROVED" ||
    status === OPERATION_STATUS.APPROVED
  ) {
    return "APPROVED";
  }

  if (statusUpper === "REJECTED" || status === OPERATION_STATUS.REJECTED) {
    return "REJECTED";
  }

  if (
    statusUpper === "WAITING_FOR_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_APPROVAL ||
    statusUpper === "WAITING_FOR_PARTIAL_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL
  ) {
    return "WAITING_FOR_APPROVAL";
  }

  if (statusUpper === "IN_PROGRESS" || status === OPERATION_STATUS.IN_PROGRESS) {
    return "IN_PROGRESS";
  }

  return "TO_BE_INITIATED";
};

export const buildMixingApproverCards = (detailView: {
  premixCards?: PremixEntry[];
  finalMixCards?: FinalMixEntry[];
} | null | undefined): MixingApproverCard[] => {
  if (!detailView) return [];

  const premixCards = (detailView.premixCards ?? []).map((premix) => {
    const cardNo = String(premix.premixNo ?? "").trim() || "0";
    return {
      mixCardId: buildMixCardId("PREMIX", cardNo),
      stageType: "PREMIX" as const,
      cardNo,
      label: `Premix ${cardNo}`,
      mixCardSubmissionStatus: normalizeMixCardStatus(
        premix.mixCardSubmissionStatus ?? "TO_BE_INITIATED",
      ),
      rejectionReason: premix.rejectionReason ?? null,
      remarks: premix.remarks ?? null,
      premix,
    };
  });

  const finalMixCards = (detailView.finalMixCards ?? []).map((entry) => {
    const cardNo = String(entry.mixNo ?? "").trim() || "0";
    return {
      mixCardId: buildMixCardId("FINAL_MIX", cardNo),
      stageType: "FINAL_MIX" as const,
      cardNo,
      label: `Final Mix ${cardNo}`,
      mixCardSubmissionStatus: normalizeMixCardStatus(
        entry.mixCardSubmissionStatus ?? "TO_BE_INITIATED",
      ),
      rejectionReason: entry.rejectionReason ?? null,
      remarks: entry.remarks ?? null,
      finalMix: entry,
    };
  });

  return [...premixCards, ...finalMixCards];
};

export type MixingFormState = {
  premixCards: PremixEntry[];
  finalMixCards: FinalMixEntry[];
};
export type MixingStage = {
  stageType: string;
  premixes: any[];
};
export type MixingDetails = {
  formId: string;
  batchId: string;
  batchType?: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  createdBy?: unknown;
  createdAt?: string;
  submittedBy?: unknown;
  submittedAt?: string | null;
  identificationSheet?: {
    mixerType?: unknown;
    bldgNo?: unknown;
  };
  mixingCycle?: {
    operations?: unknown[];
    [key: string]: unknown;
  };
  mixingDetails?: {
    stages: MixingStage[];
  };
};

const coerceFieldValue = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    const nested = value as { parsedValue?: unknown; source?: unknown; value?: unknown };
    if (nested.parsedValue != null && nested.parsedValue !== "") {
      return String(nested.parsedValue).trim();
    }
    if (nested.source != null && nested.source !== "") {
      return String(nested.source).trim();
    }
    if (nested.value != null && nested.value !== "") {
      return String(nested.value).trim();
    }
    return "";
  }
  return String(value).trim();
};

const formatSpecificationValue = (specification: any) => {
  if (!specification || typeof specification !== "object") {
    return coerceFieldValue(specification);
  }
  const minValue = coerceFieldValue(specification?.minValue);
  const maxValue = coerceFieldValue(specification?.maxValue);
  const unit = coerceFieldValue(specification?.unit);
  if (!minValue && !maxValue && !unit) {
    return "";
  }
  if (minValue && maxValue) {
    return `${minValue} - ${maxValue}${unit ? ` ${unit}` : ""}`.trim();
  }
  if (minValue || maxValue) {
    return `${minValue || maxValue}${unit ? ` ${unit}` : ""}`.trim();
  }
  return unit;
};

const resolveSampleCount = (value: unknown, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return Math.max(1, Math.min(4, fallback));
  return Math.max(1, Math.min(4, Math.floor(parsed)));
};

const resolveOperationLabel = (row: any, fallbackId?: number): string => {
  const named = String(
    row?.operationName ?? row?.operation ?? row?.operationLabel ?? "",
  ).trim();
  if (named) return named;
  const operationId = Number(row?.operationId ?? fallbackId ?? 0);
  if (Number.isFinite(operationId) && operationId > 0) {
    return `Operation ${operationId}`;
  }
  return "";
};

const mapApiProcessRows = (rows: any[]): ProcessParticularRow[] =>
  rows.map((row) => {
    const operationId = Number(row.operationId);
    return {
      operationId,
      operation: resolveOperationLabel(row, operationId),
      rpm: String(row.rpm ?? ""),
      time: String(row.time ?? ""),
      temp: String(row.temp ?? ""),
      vacuum: String(row.vacuum ?? ""),
    };
  });

const normalizeProcessRow = (
  row: any,
  fallbackOperation = "",
  fallbackId?: number,
): ProcessParticularRow => {
  const operationId = Number(row?.operationId ?? fallbackId ?? 0);
  return {
    operationId,
    operation:
      String(row?.operation ?? row?.operationLabel ?? fallbackOperation).trim() ||
      resolveOperationLabel(row, operationId),
    rpm: String(row?.rpm ?? ""),
    time: String(row?.time ?? ""),
    temp: String(row?.temp ?? ""),
    vacuum: String(row?.vacuum ?? ""),
  };
};

/** Merge cycle-master operation labels onto saved process-particular values. */
export const mergeProcessParticularsWithOperations = (
  operations: Array<{ operationId: number; operationName?: string; sequenceNo?: number }>,
  existingRows: ProcessParticularRow[] = [],
): ProcessParticularRow[] => {
  if (!operations.length) {
    return existingRows.map((row) => ({
      ...row,
      operation: String(row.operation ?? "").trim() || resolveOperationLabel(row, row.operationId),
    }));
  }

  const existingById = new Map(
    existingRows.map((row) => [Number(row.operationId), row] as const),
  );
  const hasAnyIdMatch = operations.some((operation) =>
    existingById.has(Number(operation.operationId)),
  );

  // When operation IDs from the cycle master don't match saved rows, keep values and
  // attach names by index so enrichment never wipes RPM/time/temp/vacuum.
  if (existingRows.length > 0 && !hasAnyIdMatch) {
    return existingRows.map((row, index) => {
      const operation = operations[index];
      return {
        ...row,
        operation: String(
          operation?.operationName ??
            row.operation ??
            resolveOperationLabel(row, row.operationId),
        ),
      };
    });
  }

  return operations.map((operation, index) => {
    const existing =
      existingById.get(Number(operation.operationId)) ?? existingRows[index];
    return {
      operationId: Number(operation.operationId),
      operation: String(
        operation.operationName ??
          existing?.operation ??
          resolveOperationLabel(operation, operation.operationId),
      ),
      rpm: String(existing?.rpm ?? ""),
      time: String(existing?.time ?? ""),
      temp: String(existing?.temp ?? ""),
      vacuum: String(existing?.vacuum ?? ""),
    };
  });
};

/** Resolve premix/final-mix operations from flexible mixing-cycle details payloads. */
export const resolveMixingCycleOperations = (
  data: Record<string, unknown> | null | undefined,
): {
  premixOperations: Array<{ operationId: number; operationName?: string; sequenceNo?: number }>;
  finalMixOperations: Array<{ operationId: number; operationName?: string; sequenceNo?: number }>;
} => {
  const root = (data ?? {}) as Record<string, any>;
  const cycles = (root.cycles ?? root) as Record<string, any>;

  const asOperations = (value: unknown) =>
    Array.isArray(value)
      ? value.map((entry: any) => ({
          operationId: Number(entry?.operationId ?? entry?.id ?? 0),
          operationName: String(entry?.operationName ?? entry?.name ?? "").trim() || undefined,
          sequenceNo:
            entry?.sequenceNo != null && Number.isFinite(Number(entry.sequenceNo))
              ? Number(entry.sequenceNo)
              : undefined,
        }))
      : [];

  return {
    premixOperations: asOperations(
      cycles.premixOperations ??
        cycles.premixCycle?.operations ??
        cycles.premix?.operations ??
        root.premixOperations,
    ),
    finalMixOperations: asOperations(
      cycles.finalMixOperations ??
        cycles.finalMixCycle?.operations ??
        cycles.finalMix?.operations ??
        root.finalMixOperations,
    ),
  };
};

const normalizeQualityRow = (row: any, fallback: QualityCheckRow): QualityCheckRow => {
  const sampleCount = resolveSampleCount(
    row?.sampleCount ?? row?.noOfSamples,
    fallback.sampleCount ?? (fallback.observedLayout === "quad" ? 4 : 1),
  );
  return {
    parameter: String(row?.parameter ?? fallback.parameter),
    parameterId: String(row?.parameterId ?? fallback.parameterId),
    specification: String(row?.specification ?? fallback.specification),
    observedLayout: sampleCount > 1 ? "quad" : "single",
    sampleCount,
    observed1: String(row?.observed1 ?? ""),
    observed2: String(row?.observed2 ?? ""),
    observed3: String(row?.observed3 ?? ""),
    observed4: String(row?.observed4 ?? ""),
  };
};

export const createEmptyPremixEntry = (premixNo: number): PremixEntry => ({
  premixNo: String(premixNo),
  mixerType: "",
  bldgNo: "",
  bowlId: "",
  bowlTrialDate: "",
  bowlTrialObservations: "",
  premixDate: "",
  premixQuantity: "",
  mixingCycle: "",
  mixingCycleId: "",
  processParticulars: [],
  qualityChecks: createQualityCheckRows([]),
});

export const createPremixEntryWithDefaults = (
  premixNo: number,
  mixerType?: string | null,
  bldgNo?: string | null,
  batchSize?: string,
  mixingDate?: string,
): PremixEntry => ({
  ...createEmptyPremixEntry(premixNo),
  mixerType: String(mixerType ?? ""),
  bldgNo: String(bldgNo ?? ""),
  premixQuantity: String(batchSize ?? ""),
  premixDate: String(mixingDate ?? ""),
});

export const createEmptyFinalMixEntry = (mixNo: number): FinalMixEntry => ({
  mixNo: String(mixNo),
  linkedPremixNo: "",
  mixerType: "",
  bldgNo: "",
  bowlId: "",
  mixingCycle: "",
  mixingCycleId: "",
  processParticulars: [],
  qualityChecks: createQualityCheckRows([]),
});

export const createFinalMixEntryWithDefaults = (
  mixNo: number,
  mixerType?: string | null,
  bldgNo?: string | null,
): FinalMixEntry => ({
  ...createEmptyFinalMixEntry(mixNo),
  mixerType: String(mixerType ?? ""),
  bldgNo: String(bldgNo ?? ""),
});

/** Resolves linked premix from FINAL_MIX API entry (premixNo when linkedPremixNo is omitted). */
const resolveApiLinkedPremixNo = (entry: Record<string, unknown> | null | undefined): string => {
  const explicit =
    entry?.linkedPremixNo ??
    (entry?.linkedPremix as { premixNo?: unknown } | undefined)?.premixNo ??
    entry?.linkedPremixNumber ??
    entry?.parentPremixNo;

  if (explicit != null && String(explicit).trim() !== "") {
    return coerceFieldValue(explicit);
  }

  return coerceFieldValue(entry?.premixNo);
};

const normalizeFinalMixEntry = (
  entry: Partial<FinalMixEntry> & Record<string, unknown>,
  fallbackNo: number,
): FinalMixEntry => {
  const qualityChecks = mergeQualityChecks(createQualityCheckRows([]), entry.qualityChecks ?? []);
  const mixingCycleSource =
    entry.mixingCycle ?? entry.finalMixCycle ?? entry.mixingCycleCode ?? "";

  return {
    mixNo: coerceFieldValue(entry.mixNo ?? fallbackNo),
    linkedPremixNo: coerceFieldValue(entry.linkedPremixNo ?? ""),
    mixerType: String(entry.mixerType ?? ""),
    bldgNo: String(entry.bldgNo ?? ""),
    bowlId: String(entry.bowlId ?? ""),
    mixingCycle:
      typeof entry.mixingCycle === "string" && entry.mixingCycle.trim()
        ? entry.mixingCycle.trim()
        : resolveApiMixingCycleDisplayValue(mixingCycleSource),
    mixingCycleId: coerceFieldValue(
      (entry as any)?.mixingCycle?.id ??
        (entry as any)?.finalMixCycleId ??
        (entry as any)?.mixingCycleId ??
        "",
    ),
    mixingCycleCode: coerceFieldValue(
      entry.mixingCycleCode ??
        (entry as any)?.mixingCycle?.mixingCycleCode ??
        (entry as any)?.mixingCycleId ??
        "",
    ),
    mixingCycleName: String(
      entry.mixingCycleName ?? (entry as any)?.mixingCycle?.mixingCycleName ?? "",
    ),
    qualityChecks,
    processParticulars: resolveProcessParticulars(entry),
  };
};

export const createDefaultMixingFormState = (): MixingFormState => ({
  premixCards: [],
  finalMixCards: [],
});

const resolveApiMixingCycleValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null || typeof value !== "object") {
    return "";
  }

  const cycle = value as Record<string, unknown>;
  return String(
    cycle.mixingCycleName ??
      cycle.mixingCycleCode ??
      cycle.mixingCycleId ??
      cycle.cycleName ??
      cycle.cycleId ??
      "",
  ).trim();
};

export const resolveApiMixingCycleDisplayValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null || typeof value !== "object") {
    return "";
  }

  const cycle = value as Record<string, unknown>;
  const name = String(cycle.mixingCycleName ?? cycle.cycleName ?? "").trim();
  const code = String(cycle.mixingCycleCode ?? cycle.cycleCode ?? cycle.cycleId ?? "").trim();

  if (name) {
    if (code && !name.includes(code)) {
      return `${name} (${code})`;
    }
    return name;
  }

  return code;
};

const resolveProcessParticulars = (
  premix: Partial<PremixEntry> & { operations?: MixingOperation[] },
): ProcessParticularRow[] => {
  if (Array.isArray(premix.processParticulars) && premix.processParticulars.length > 0) {
    return premix.processParticulars.map((row, index) =>
      normalizeProcessRow(row, row.operation, index + 1),
    );
  }

  if (premix.operations?.length) {
    return createProcessParticularRows(premix.operations);
  }

  return [];
};

type QualityCheckApiKind = "homogeneity" | "moisture" | "viscosity" | "temperature";

const QUALITY_CHECK_KIND_BY_KEY: Record<string, QualityCheckApiKind> = {
  homogeneity: "homogeneity",
  moisture: "moisture",
  moisturepercent: "moisture",
  eomviscosity: "viscosity",
  eomtemperature: "temperature",
};

const normalizePremixEntry = (
  premix: Partial<PremixEntry> & Record<string, unknown>,
  fallbackNo: number,
): PremixEntry => {
  const qualityChecks = mergeQualityChecks(createQualityCheckRows([]), premix.qualityChecks ?? []);
  const mixingCycleSource =
    premix.mixingCycle ?? (premix as any)?.mixingCycle ?? premix.mixingCycleCode ?? "";

  return {
    premixNo: coerceFieldValue(premix.premixNo ?? fallbackNo),
    mixerType: String(premix.mixerType ?? ""),
    bldgNo: String(premix.bldgNo ?? ""),
    bowlId: String(premix.bowlId ?? ""),
    bowlTrialDate: String(premix.bowlTrialDate ?? ""),
    bowlTrialObservations: String(premix.bowlTrialObservations ?? ""),
    premixDate: String(premix.premixDate ?? ""),
    premixQuantity: String(premix.premixQuantity ?? ""),
    mixingCycle:
      typeof premix.mixingCycle === "string" && premix.mixingCycle.trim()
        ? premix.mixingCycle.trim()
        : resolveApiMixingCycleDisplayValue(mixingCycleSource),
    mixingCycleId: coerceFieldValue(
      premix.mixingCycleId ??
        (premix as any)?.mixingCycle?.mixingCycleCode ??
        (premix as any)?.Id ??
        "",
    ),
    mixingCycleCode: coerceFieldValue(
      premix.mixingCycleCode ?? (premix as any)?.mixingCycle?.mixingCycleCode ?? "",
    ),
    mixingCycleName: String(
      premix.mixingCycleName ?? (premix as any)?.mixingCycle?.mixingCycleName ?? "",
    ),
    processParticulars: resolveProcessParticulars(premix),
    qualityChecks,
  };
};

const resolveApiProcessParticulars = (entry: Record<string, unknown> | null | undefined) => {
  const rows =
    (entry as any)?.processParticulars ??
    (entry as any)?.processParticular ??
    (entry as any)?.operations ??
    [];
  return Array.isArray(rows) ? rows : [];
};

export const mapMixingDetailsToFormState = (details: Partial<MixingDetails>): MixingFormState => {
  const identificationSheet = (details?.identificationSheet ?? null) as {
    mixerType?: unknown;
    bldgNo?: unknown;
    date?: unknown;
    batchSize?: unknown;
  } | null;
  const stages =
    details?.mixingDetails?.stages ??
    (details as any)?.stages ??
    [];

  const premixStage = stages.find(
    (stage) => String(stage?.stageType ?? "").toUpperCase() === "PREMIX",
  );

  const finalMixStage = stages.find(
    (stage) => String(stage?.stageType ?? "").toUpperCase() === "FINAL_MIX",
  );

  const apiPremixes = premixStage?.premixes ?? [];
  const apiFinalMixes = finalMixStage?.premixes ?? [];

  const globalMixingCycleLabel = resolveApiMixingCycleDisplayValue((details as any)?.mixingCycle);
  const operations = (details as any)?.mixingCycle?.operations ?? [];
  return {
    premixCards: apiPremixes.map((premix: any, index: number) => {
      const apiProcessRows = resolveApiProcessParticulars(premix);
      return normalizePremixEntry(
        {
          premixNo: premix.premixNo,

          mixerType: String(
            premix?.mixerConfiguration?.mixerId ?? identificationSheet?.mixerType ?? "",
          ),
          bldgNo: String(
            premix?.mixerConfiguration?.bldgNo ?? identificationSheet?.bldgNo ?? "",
          ),
          bowlId: premix?.mixerConfiguration?.bowlId ?? "",

          bowlTrialDate: premix?.trialDetails?.trialDate ?? "",

          bowlTrialObservations: premix?.trialDetails?.observations ?? "",

          // prefer explicit mix date; fallback to identification sheet date
          premixDate: premix?.mixDetails?.mixDate ?? String(identificationSheet?.date ?? ""),

          // prefer explicit mix quantity; fallback to identification sheet batch size
          premixQuantity: coerceFieldValue(
            premix?.mixDetails?.mixQuantity ?? identificationSheet?.batchSize,
          ),

          mixingCycle:
            resolveApiMixingCycleDisplayValue(
              premix?.mixingCycle ?? premix?.mixingCycleCode ?? globalMixingCycleLabel,
            ) ||
            globalMixingCycleLabel ||
            "",
          mixingCycleCode: coerceFieldValue(
            premix?.mixingCycle?.mixingCycleCode ??
              (details as any)?.mixingCycle?.mixingCycleCode ??
              "",
          ),
          mixingCycleName: String(
            premix?.mixingCycle?.mixingCycleName ??
              (details as any)?.mixingCycle?.mixingCycleName ??
              "",
          ),

          processParticulars:
            apiProcessRows.length > 0
              ? mapApiProcessRows(apiProcessRows)
              : createProcessParticularRows(operations),

          qualityChecks: premix?.qualityChecks ?? [],
        },
        Number(premix?.premixNo) || index + 1,
      );
    }),

    finalMixCards: apiFinalMixes.map((entry: any, index: number) => {
      const apiProcessRows = resolveApiProcessParticulars(entry);
      return normalizeFinalMixEntry(
        {
          mixNo: entry?.premixNo ?? entry?.finalMixNo ?? entry?.mixNo ?? index + 1,

          linkedPremixNo: resolveApiLinkedPremixNo(entry),

          mixerType: String(
            entry?.mixerConfiguration?.mixerId ?? identificationSheet?.mixerType ?? "",
          ),
          bldgNo: String(
            entry?.mixerConfiguration?.bldgNo ?? identificationSheet?.bldgNo ?? "",
          ),
          bowlId: entry?.mixerConfiguration?.bowlId ?? "",

          mixingCycle: resolveApiMixingCycleDisplayValue(
            entry.mixingCycle ??
              entry.finalMixCycle ??
              entry.mixingCycleCode ??
              globalMixingCycleLabel,
          ),
          mixingCycleCode: coerceFieldValue(entry?.mixingCycle?.mixingCycleCode ?? ""),
          mixingCycleName: String(entry?.mixingCycle?.mixingCycleName ?? ""),

          qualityChecks: entry?.qualityChecks ?? [],
          processParticulars:
            apiProcessRows.length > 0
              ? mapApiProcessRows(apiProcessRows)
              : createProcessParticularRows(operations),
        },
        Number(entry?.premixNo) || index + 1,
      );
    }),
  };
};

const mapProcessRowsToApi = (rows: ProcessParticularRow[]) =>
  rows.map((row) => ({
    operationId: row.operationId,
    rpm: row.rpm,
    time: row.time,
    temp: row.temp,
    vacuum: row.vacuum,
  }));
const mapQualityChecksToApi = (rows: QualityCheckRow[]) =>
  rows.map((row) => {
    const observations = [];
    const sampleCount = resolveSampleCount(
      row.sampleCount,
      isQuadObservedLayout(row.observedLayout) ? 4 : 1,
    );
    const observedValues = [row.observed1, row.observed2, row.observed3, row.observed4];

    for (let index = 0; index < sampleCount; index += 1) {
      const value = String(observedValues[index] ?? "").trim();
      if (!value) continue;
      observations.push({
        sampleNo: index + 1,
        value,
      });
    }

    return {
      parameterId: row.parameterId,
      observations,
    };
  });
const mapProcessRows = (
  operations: MixingOperation[] = [],
  apiRows: any[] = [],
): ProcessParticularRow[] => {
  return operations.map((operation) => {
    const apiRow = apiRows.find((row) => Number(row.operationId) === Number(operation.operationId));

    return {
      operationId: Number(operation.operationId),
      operation: operation.operationName,
      rpm: String(apiRow?.rpm ?? ""),
      time: String(apiRow?.time ?? ""),
      temp: String(apiRow?.temp ?? ""),
      vacuum: String(apiRow?.vacuum ?? ""),
    };
  });
};

const mapApiQualityChecksToRows = (apiRows: any[] = []): QualityCheckRow[] =>
  apiRows.map((row) => {
    const observations = Array.isArray(row?.observations) ? row.observations : [];
    const maxSample = observations.reduce(
      (max, obs) => Math.max(max, Number(obs?.sampleNo) || 0),
      0,
    );
    const sampleCount = resolveSampleCount(
      row?.noOfSamples ?? row?.sampleCount,
      Math.max(1, maxSample),
    );

    return {
      parameterId: String(row?.parameterId ?? "").trim(),
      parameter: String(row?.parameterName ?? row?.parameter ?? row?.parameterId ?? "").trim(),
      specification: formatSpecificationValue(row?.specification),
      observedLayout: sampleCount > 1 ? "quad" : "single",
      sampleCount,
      observed1: String(observations.find((o) => Number(o?.sampleNo) === 1)?.value ?? ""),
      observed2: String(observations.find((o) => Number(o?.sampleNo) === 2)?.value ?? ""),
      observed3: String(observations.find((o) => Number(o?.sampleNo) === 3)?.value ?? ""),
      observed4: String(observations.find((o) => Number(o?.sampleNo) === 4)?.value ?? ""),
    };
  });

const mergeQualityChecks = (
  masterRows: QualityCheckRow[],
  apiRows: any[] = [],
): QualityCheckRow[] => {
  if (!masterRows.length) {
    return mapApiQualityChecksToRows(apiRows);
  }

  return masterRows.map((master) => {
    const api = apiRows.find((row) => row.parameterId === master.parameterId);

    return {
      ...master,
      observed1: String(api?.observations?.find((o: any) => Number(o?.sampleNo) === 1)?.value ?? ""),
      observed2: String(api?.observations?.find((o: any) => Number(o?.sampleNo) === 2)?.value ?? ""),
      observed3: String(api?.observations?.find((o: any) => Number(o?.sampleNo) === 3)?.value ?? ""),
      observed4: String(api?.observations?.find((o: any) => Number(o?.sampleNo) === 4)?.value ?? ""),
    };
  });
};

export const mapMixingFormStateToPayload = (
  form: MixingFormState,
  options?: {
    targetMixCardId?: string | null;
    mixCardSubmissionType?: "DRAFT" | "SUBMIT" | null;
    mixCardStatusById?: Record<string, MixCardStatusMeta>;
  },
) => {
  const targetMixCardId = String(options?.targetMixCardId ?? "").trim();
  const intentType = options?.mixCardSubmissionType ?? null;
  const statusById = options?.mixCardStatusById ?? {};

  const resolveCardSubmissionType = (mixCardId: string) => {
    if (targetMixCardId && mixCardId === targetMixCardId && intentType) {
      return intentType;
    }
    return statusById[mixCardId]?.mixCardSubmissionType ?? null;
  };

  const payload = {
    mixingDetails: {
      stages: [
        {
          stageType: "PREMIX",

          premixes: (form.premixCards ?? []).map((premix) => {
            const mixCardId = buildMixCardId("PREMIX", premix.premixNo);
            return {
              premixNo: Number(premix.premixNo) || 0,
              mixCardSubmissionType: resolveCardSubmissionType(mixCardId),

              mixerConfiguration: {
                mixerId: premix.mixerType,
                bldgNo: premix.bldgNo,
                bowlId: premix.bowlId,
              },

              trialDetails: {
                trialDate: premix.bowlTrialDate || null,
                observations: premix.bowlTrialObservations,
              },

              mixDetails: {
                mixDate: premix.premixDate || null,
                mixQuantity: premix.premixQuantity || null,
              },

              mixingCycle: {
                mixingCycleCode: premix.mixingCycleCode,
                mixingCycleName: premix.mixingCycle || null,
              },

              processParticulars: mapProcessRowsToApi(premix.processParticulars ?? []),
              qualityChecks: mapQualityChecksToApi(premix.qualityChecks),
            };
          }),
        },

        {
          stageType: "FINAL_MIX",

          premixes: (form.finalMixCards ?? []).map((entry) => {
            const mixCardId = buildMixCardId("FINAL_MIX", entry.mixNo);
            return {
              premixNo: Number(entry.mixNo) || 0,
              mixCardSubmissionType: resolveCardSubmissionType(mixCardId),

              linkedPremixNo: Number(entry.linkedPremixNo) || null,

              mixerConfiguration: {
                mixerId: entry.mixerType,
                bldgNo: entry.bldgNo,
                bowlId: entry.bowlId,
              },

              mixingCycle: {
                mixingCycleCode: entry.mixingCycleCode || entry.mixingCycle || null,
                mixingCycleName: entry.mixingCycle || null,
              },

              processParticulars: mapProcessRowsToApi(entry.processParticulars ?? []),
              qualityChecks: mapQualityChecksToApi(entry.qualityChecks),
            };
          }),
        },
      ],
    },
  };

  return payload;
};

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const premixHasValue = (premix: PremixEntry) => {
  const headerFilled =
    hasValue(premix.mixerType) ||
    hasValue(premix.bldgNo) ||
    hasValue(premix.bowlId) ||
    hasValue(premix.bowlTrialDate) ||
    hasValue(premix.bowlTrialObservations) ||
    hasValue(premix.premixDate) ||
    hasValue(premix.premixQuantity) ||
    hasValue(premix.mixingCycle);

  const processFilled = (premix.processParticulars ?? []).some((row) =>
    [row.rpm, row.time, row.temp, row.vacuum].some(hasValue),
  );

  const qualityFilled = (premix.qualityChecks ?? []).some((row) => {
    if (isQuadObservedLayout(row.observedLayout)) {
      return [row.observed1, row.observed2, row.observed3, row.observed4].some(hasValue);
    }
    return hasValue(row.observed1);
  });

  return headerFilled || processFilled || qualityFilled;
};

const finalMixHasValue = (entry: FinalMixEntry) => {
  const headerFilled =
    hasValue(entry.linkedPremixNo) ||
    hasValue(entry.mixerType) ||
    hasValue(entry.bldgNo) ||
    hasValue(entry.bowlId) ||
    hasValue(entry.mixingCycle);

  const processFilled = (entry.processParticulars ?? []).some((row) =>
    [row.rpm, row.time, row.temp, row.vacuum].some(hasValue),
  );

  const qualityFilled = (entry.qualityChecks ?? []).some((row) => {
    if (isQuadObservedLayout(row.observedLayout)) {
      return [row.observed1, row.observed2, row.observed3, row.observed4].some(hasValue);
    }
    return hasValue(row.observed1);
  });

  return headerFilled || processFilled || qualityFilled;
};

export const hasMixCardValue = (
  form: MixingFormState,
  stageType: MixCardStageType,
  cardNo: string | number,
) => {
  const normalizedNo = String(cardNo).trim();
  if (stageType === "PREMIX") {
    const card = (form.premixCards ?? []).find(
      (entry) => String(entry.premixNo).trim() === normalizedNo,
    );
    return card ? premixHasValue(card) : false;
  }
  const card = (form.finalMixCards ?? []).find(
    (entry) => String(entry.mixNo).trim() === normalizedNo,
  );
  return card ? finalMixHasValue(card) : false;
};

export const hasAnyMixingValue = (form: MixingFormState) =>
  (form.premixCards ?? []).some(premixHasValue) ||
  (form.finalMixCards ?? []).some(finalMixHasValue);

export type MixingDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status: string;
  formSubmissionType: string;
  submittedBy: string;
  submittedAt: string;
  createdBy: string;
  createdAt: string;
  premixCards: PremixEntry[];
  finalMixCards: FinalMixEntry[];
  mixCardCounts?: MixCardCounts;
};

export const formatMixingPersonDisplay = (value: unknown): string => {
  if (!value) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "—";
  }
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    const name = String(person.fullName ?? person.name ?? "").trim();
    const id = String(person.id ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id || "—";
  }
  return "—";
};

const resolveApiMixCardStatus = (
  entry: Record<string, unknown> | null | undefined,
  fallback: MixCardSubmissionStatus,
): MixCardSubmissionStatus => {
  const explicit =
    entry?.mixCardSubmissionStatus ??
    entry?.premixSubmissionStatus ??
    entry?.submissionStatus ??
    entry?.status;
  if (explicit == null || String(explicit).trim() === "") {
    return fallback;
  }
  return normalizeMixCardStatus(explicit);
};

const mapMixCardStatusesFromApi = (
  data: Record<string, unknown>,
): Record<string, { mixCardSubmissionStatus: MixCardSubmissionStatus; rejectionReason?: string | null; remarks?: string | null }> => {
  const result: Record<
    string,
    {
      mixCardSubmissionStatus: MixCardSubmissionStatus;
      rejectionReason?: string | null;
      remarks?: string | null;
    }
  > = {};

  const lists = [
    data.mixCardStatuses,
    data.premixStatuses,
    (data.mixingDetails as Record<string, unknown> | undefined)?.mixCardStatuses,
  ];

  lists.forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((raw) => {
      const entry = raw as Record<string, unknown>;
      const stageType = String(entry.stageType ?? entry.mixType ?? "")
        .trim()
        .toUpperCase();
      const cardNo = String(
        entry.premixNo ?? entry.mixNo ?? entry.finalMixNo ?? entry.cardNo ?? "",
      ).trim();
      if (!cardNo) return;
      const resolvedStage: MixCardStageType =
        stageType === "FINAL_MIX" ? "FINAL_MIX" : "PREMIX";
      const id = buildMixCardId(resolvedStage, cardNo);
      result[id] = {
        mixCardSubmissionStatus: normalizeMixCardStatus(entry.mixCardSubmissionStatus ?? entry.status),
        rejectionReason: (entry.rejectionReason as string | null | undefined) ?? null,
        remarks: (entry.remarks as string | null | undefined) ?? null,
      };
    });
  });

  return result;
};

export const mapMixingDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): MixingDetailView | null => {
  if (!data) return null;

  const formState = mapMixingDetailsToFormState(data as Partial<MixingDetails>);
  const formStatus = normalizeApproverBatchStatus(data.status);
  const stubStatus = stubMixCardStatusFromFormStatus(data.status ?? formStatus);
  const statusById = mapMixCardStatusesFromApi(data);
  const stages = ((data.mixingDetails as { stages?: any[] } | undefined)?.stages ??
    []) as Array<{ stageType?: string; premixes?: any[] }>;

  const premixApiByNo = new Map<string, Record<string, unknown>>();
  const finalMixApiByNo = new Map<string, Record<string, unknown>>();
  stages.forEach((stage) => {
    const stageType = String(stage?.stageType ?? "").toUpperCase();
    (stage?.premixes ?? []).forEach((entry) => {
      const cardNo = String(entry?.premixNo ?? entry?.mixNo ?? "").trim();
      if (!cardNo) return;
      if (stageType === "FINAL_MIX") finalMixApiByNo.set(cardNo, entry);
      else premixApiByNo.set(cardNo, entry);
    });
  });

  const premixCards = formState.premixCards.map((card) => {
    const cardNo = String(card.premixNo).trim();
    const id = buildMixCardId("PREMIX", cardNo);
    const apiEntry = premixApiByNo.get(cardNo);
    const statusMeta = statusById[id];
    return {
      ...card,
      mixCardSubmissionStatus:
        statusMeta?.mixCardSubmissionStatus ??
        resolveApiMixCardStatus(apiEntry, stubStatus),
      rejectionReason:
        statusMeta?.rejectionReason ??
        (apiEntry?.rejectionReason as string | null | undefined) ??
        null,
      remarks:
        statusMeta?.remarks ?? (apiEntry?.remarks as string | null | undefined) ?? null,
    };
  });

  const finalMixCards = formState.finalMixCards.map((card) => {
    const cardNo = String(card.mixNo).trim();
    const id = buildMixCardId("FINAL_MIX", cardNo);
    const apiEntry = finalMixApiByNo.get(cardNo);
    const statusMeta = statusById[id];
    return {
      ...card,
      mixCardSubmissionStatus:
        statusMeta?.mixCardSubmissionStatus ??
        resolveApiMixCardStatus(apiEntry, stubStatus),
      rejectionReason:
        statusMeta?.rejectionReason ??
        (apiEntry?.rejectionReason as string | null | undefined) ??
        null,
      remarks:
        statusMeta?.remarks ?? (apiEntry?.remarks as string | null | undefined) ?? null,
    };
  });

  const mixCards = buildMixingApproverCards({ premixCards, finalMixCards });
  const mixCardCountsFromApi = (data.mixCardCounts ??
    (data.mixingDetails as Record<string, unknown> | undefined)?.mixCardCounts) as
    | Partial<MixCardCounts>
    | undefined;

  const derivedCounts: MixCardCounts = {
    pendingMixCardCount: 0,
    approvedMixCardCount: 0,
    rejectedMixCardCount: 0,
    inProgressMixCardCount: 0,
    toBeInitiatedMixCardCount: 0,
    totalMixCardCount: mixCards.length,
  };
  mixCards.forEach((card) => {
    const status = String(card.mixCardSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
    if (status === "WAITING_FOR_APPROVAL") derivedCounts.pendingMixCardCount += 1;
    else if (status === "APPROVED") derivedCounts.approvedMixCardCount += 1;
    else if (status === "REJECTED") derivedCounts.rejectedMixCardCount += 1;
    else if (status === "IN_PROGRESS") derivedCounts.inProgressMixCardCount += 1;
    else derivedCounts.toBeInitiatedMixCardCount += 1;
  });

  const apiTotal = Number(mixCardCountsFromApi?.totalMixCardCount ?? 0);
  if (apiTotal > derivedCounts.totalMixCardCount) {
    derivedCounts.toBeInitiatedMixCardCount += apiTotal - derivedCounts.totalMixCardCount;
    derivedCounts.totalMixCardCount = apiTotal;
  }

  return {
    formId: String(data.formId ?? ""),
    batchId: String(data.batchId ?? ""),
    batchType: formatSubdepartmentBatchTypeLabel(String(data.batchType ?? "")),
    status: formStatus,
    formSubmissionType: String(data.formSubmissionType ?? ""),
    submittedBy: formatMixingPersonDisplay(data.submittedBy),
    submittedAt: String(data.submittedAt ?? ""),
    createdBy: formatMixingPersonDisplay(data.createdBy),
    createdAt: String(data.createdAt ?? data.createdOn ?? ""),
    premixCards,
    finalMixCards,
    mixCardCounts: {
      pendingMixCardCount:
        Number(mixCardCountsFromApi?.pendingMixCardCount ?? derivedCounts.pendingMixCardCount) ||
        derivedCounts.pendingMixCardCount,
      approvedMixCardCount:
        Number(mixCardCountsFromApi?.approvedMixCardCount ?? derivedCounts.approvedMixCardCount) ||
        derivedCounts.approvedMixCardCount,
      rejectedMixCardCount:
        Number(mixCardCountsFromApi?.rejectedMixCardCount ?? derivedCounts.rejectedMixCardCount) ||
        derivedCounts.rejectedMixCardCount,
      inProgressMixCardCount:
        Number(
          mixCardCountsFromApi?.inProgressMixCardCount ?? derivedCounts.inProgressMixCardCount,
        ) || derivedCounts.inProgressMixCardCount,
      toBeInitiatedMixCardCount: derivedCounts.toBeInitiatedMixCardCount,
      totalMixCardCount: derivedCounts.totalMixCardCount,
    },
  };
};

export class MixingSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new MixingSubmitResponseModel(data);
  }
}

export class MixingDetailsModel {
  static fromApi(data: any): MixingDetails & Record<string, unknown> {
    const payload = data?.data ?? data ?? {};

    return {
      ...payload,
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      batchType: String(payload?.batchType ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      status: String(payload?.status ?? ""),
      createdBy: payload?.createdBy,
      createdAt: payload?.createdAt ?? payload?.createdOn,
      submittedBy: payload?.submittedBy,
      submittedAt: payload?.submittedAt,
      mixingDetails: payload?.mixingDetails ?? {
        stages: [],
      },
    };
  }
}

export const mapBackendQualityChecksToRows = (qualityChecks: any): QualityCheckRow[] => {
  const definitions = Array.isArray(qualityChecks) ? qualityChecks : [];
  return definitions.map((entry: any) => {
    const parameterId = String(entry?.parameterId ?? "").trim();
    const parameter = String(entry?.parameterName ?? entry?.parameter ?? "").trim();
    const specification = formatSpecificationValue(entry?.specification);
    const sampleCount = resolveSampleCount(entry?.noOfSamples ?? entry?.sampleCount, 1);

    return {
      parameterId,
      parameter,
      specification,
      observedLayout: sampleCount > 1 ? "quad" : "single",
      sampleCount,
      observed1: "",
      observed2: "",
      observed3: "",
      observed4: "",
    };
  });
};
