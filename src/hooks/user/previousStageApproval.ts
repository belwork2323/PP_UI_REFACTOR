import {
  findStageEntryForSubDepartment,
  normalizeSubdepartmentBatchStatus,
} from "../../data/models/user/SubdepartmentBatchModel";
import { OPERATION_STATUS } from "../operationStatus";

export type PartialFlowUnitKind = "premix" | "motor";

export type StageProgressUnitStatus = {
  premixNo?: number | string | null;
  motorId?: string | null;
  division?: string | null;
  subType?: string | null;
  premixSubmissionStatus?: string | null;
  motorSubmissionStatus?: string | null;
  status?: string | null;
};

export type StageProgressEntry = {
  subDepartmentId?: number | null;
  subDepartmentName?: string | null;
  status?: string | null;
  premixStatuses?: StageProgressUnitStatus[] | null;
  motorStatuses?: StageProgressUnitStatus[] | null;
  finalMixStatuses?: StageProgressUnitStatus[] | null;
};

export type PreviousStageApprovedUnits = {
  /** Starter subdept (RMP premix / Case Prep motor) — all units enabled */
  enableAll: boolean;
  kind: PartialFlowUnitKind | null;
  previousSubDepartmentId: number | null;
  previousSubDepartmentName: string | null;
  approvedPremixNos: Set<number>;
  approvedMotorIds: Set<string>;
  /** Mixing final-mix units, when gated separately from premix. */
  approvedFinalMixNos?: Set<number>;
};

type SubDeptRef = {
  subDepartmentId?: number | null;
  slugs?: { subDept?: string | null } | null;
  subDepartmentName?: string | null;
};

const PREMIX_STARTER_SLUGS = new Set(["raw-material-prep", "raw-material-preparation"]);
const MOTOR_STARTER_SLUGS = new Set(["case-preparation"]);

/** Prior stage that must have approved the unit before the current subdept can work on it. */
const PREDECESSOR_BY_SLUG: Record<
  string,
  { kind: PartialFlowUnitKind; predecessors: string[] }
> = {
  mixing: {
    kind: "premix",
    predecessors: ["raw-material-prep", "raw-material-preparation"],
  },
  "casting-and-curing": {
    kind: "motor",
    predecessors: ["case-preparation"],
  },
  "post-cure-operations": {
    kind: "motor",
    predecessors: ["casting-and-curing"],
  },
  trimming: {
    kind: "motor",
    predecessors: ["post-cure-operations"],
  },
  ndt: {
    kind: "motor",
    predecessors: ["trimming", "post-cure-operations", "casting-and-curing"],
  },
  "static-test-facility": {
    kind: "motor",
    predecessors: [
      "qc-division",
      "quality-control",
      "ndt",
      "trimming",
      "post-cure-operations",
      "casting-and-curing",
    ],
  },
  dispatch: {
    kind: "motor",
    predecessors: ["static-test-facility", "ndt", "trimming", "post-cure-operations"],
  },
};

const APPROVED_UNIT_STATUSES = new Set([
  "APPROVED",
  "COMPLETELY_APPROVED",
]);

const normalizeSlug = (slug?: string | null) =>
  String(slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

const isApprovedUnitStatus = (status: unknown) => {
  const upper = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (APPROVED_UNIT_STATUSES.has(upper)) return true;
  const normalized = normalizeSubdepartmentBatchStatus(status);
  return (
    normalized === OPERATION_STATUS.APPROVED ||
    normalized === OPERATION_STATUS.COMPLETELY_APPROVED
  );
};

const emptyResult = (
  kind: PartialFlowUnitKind | null,
  enableAll: boolean,
): PreviousStageApprovedUnits => ({
  enableAll,
  kind,
  previousSubDepartmentId: null,
  previousSubDepartmentName: null,
  approvedPremixNos: new Set(),
  approvedMotorIds: new Set(),
});

const asStageEntries = (stages: unknown): StageProgressEntry[] => {
  if (!Array.isArray(stages)) return [];
  return stages.filter((entry) => entry && typeof entry === "object") as StageProgressEntry[];
};

/** Prefer stageProgress order; overlay currentStage by subDepartmentId for latest statuses. */
const mergeStageProgress = (
  stageProgress?: unknown,
  currentStage?: unknown,
): StageProgressEntry[] => {
  const progress = asStageEntries(stageProgress);
  const current = asStageEntries(currentStage);
  if (!progress.length) return current;
  if (!current.length) return progress;

  const currentById = new Map<number, StageProgressEntry>();
  current.forEach((stage) => {
    const id = Number(stage.subDepartmentId);
    if (Number.isFinite(id) && id > 0) currentById.set(id, stage);
  });

  const merged = progress.map((stage) => {
    const id = Number(stage.subDepartmentId);
    return (Number.isFinite(id) && id > 0 && currentById.get(id)) || stage;
  });

  current.forEach((stage) => {
    const id = Number(stage.subDepartmentId);
    if (!Number.isFinite(id) || id <= 0) return;
    if (!merged.some((entry) => Number(entry.subDepartmentId) === id)) {
      merged.push(stage);
    }
  });

  return merged;
};

const collectApprovedPremixNos = (entry: StageProgressEntry | null): Set<number> => {
  const ids = new Set<number>();
  if (!entry) return ids;
  const rows = [
    ...(Array.isArray(entry.premixStatuses) ? entry.premixStatuses : []),
    ...(Array.isArray(entry.finalMixStatuses) ? entry.finalMixStatuses : []),
  ];
  rows.forEach((row) => {
    const status = row.premixSubmissionStatus ?? row.status;
    if (!isApprovedUnitStatus(status)) return;
    const premixNo = Number(row.premixNo);
    if (Number.isFinite(premixNo) && premixNo > 0) ids.add(premixNo);
  });
  return ids;
};

const collectApprovedMotorIds = (entry: StageProgressEntry | null): Set<string> => {
  const ids = new Set<string>();
  if (!entry) return ids;
  const rows = Array.isArray(entry.motorStatuses) ? entry.motorStatuses : [];
  rows.forEach((row) => {
    const status = row.motorSubmissionStatus ?? row.status;
    if (!isApprovedUnitStatus(status)) return;
    const motorId = String(row.motorId ?? "").trim();
    if (motorId) ids.add(motorId);
  });
  return ids;
};

/** QC divisions that use motors as units — STF requires approval in every one. */
const QC_MOTOR_UNIT_DIVISIONS = new Set([
  "HARDWARE",
  "CASTING",
  "CURING",
  "DE_CORING",
  "TRIMMING",
  "POST_CURE",
  "NDT",
  "QC",
  "WEIGHTMENT",
]);

const normalizeQcMotorDivision = (value: unknown): string => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!raw) return "";
  if (raw === "DECORING" || raw === "DE_CORING") return "DE_CORING";
  if (raw === "POSTCURE" || raw === "POST_CURE") return "POST_CURE";
  if (raw === "PROPELLANT_PROPERTIES" || raw === "PROPELLANT") return "QC";
  if (raw === "WEIGHMENT" || raw === "WEIGHTMENT") return "WEIGHTMENT";
  return raw;
};

const normalizeStageNameKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** QC Quality Control catalog — not QC NDT or Static Test Facility. */
const isQcQualityControlStage = (stage: StageProgressEntry): boolean => {
  const sub = normalizeStageNameKey(stage.subDepartmentName);
  if (!sub || sub === "ndt" || sub === "statictestfacility") return false;
  return sub === "qualitycontrol" || sub === "qcdivision" || sub === "qc";
};

const findQcQualityControlStage = (stages: StageProgressEntry[]): StageProgressEntry | null => {
  const matches = stages.filter(isQcQualityControlStage);
  if (!matches.length) return null;
  const withMotorRows = matches.find((stage) =>
    Array.isArray(stage.motorStatuses) ? stage.motorStatuses.length > 0 : false,
  );
  return withMotorRows ?? matches[matches.length - 1] ?? null;
};

/**
 * Enable a motor in STF only when every motor-unit QC division in stage
 * progress has APPROVED that motor. Partial approval (e.g. Hardware only)
 * must not unlock STF.
 */
const collectMotorsApprovedInAllQcMotorDivisions = (
  entry: StageProgressEntry | null,
): Set<string> => {
  const ids = new Set<string>();
  if (!entry) return ids;

  const rows = Array.isArray(entry.motorStatuses) ? entry.motorStatuses : [];
  const tagged = rows.filter((row) => {
    const division = normalizeQcMotorDivision(row.division);
    return Boolean(division) && QC_MOTOR_UNIT_DIVISIONS.has(division);
  });

  if (!tagged.length) return collectApprovedMotorIds(entry);

  const requiredDivisions = new Set(
    tagged.map((row) => normalizeQcMotorDivision(row.division)).filter(Boolean),
  );
  const byMotor = new Map<string, Map<string, boolean>>();

  tagged.forEach((row) => {
    const motorId = String(row.motorId ?? "").trim();
    const division = normalizeQcMotorDivision(row.division);
    if (!motorId || !division) return;
    const approved = isApprovedUnitStatus(row.motorSubmissionStatus ?? row.status);
    if (!byMotor.has(motorId)) byMotor.set(motorId, new Map());
    const divisionMap = byMotor.get(motorId)!;
    const previous = divisionMap.get(division);
    divisionMap.set(division, previous === undefined ? approved : previous && approved);
  });

  byMotor.forEach((divisionMap, motorId) => {
    const complete = [...requiredDivisions].every((division) => divisionMap.get(division) === true);
    if (complete) ids.add(motorId);
  });

  return ids;
};

const resolveStfPreviousStageApprovedUnits = (
  stages: StageProgressEntry[],
  fallback: PreviousStageApprovedUnits,
): PreviousStageApprovedUnits => {
  const qcStage = findQcQualityControlStage(stages);
  if (!qcStage) return fallback;

  return {
    enableAll: false,
    kind: "motor",
    previousSubDepartmentId: Number(qcStage.subDepartmentId ?? 0) || null,
    previousSubDepartmentName: String(qcStage.subDepartmentName ?? "").trim() || "Quality Control",
    approvedPremixNos: new Set(),
    approvedMotorIds: collectMotorsApprovedInAllQcMotorDivisions(qcStage),
  };
};

const resolveSubDepartmentIdsForSlugs = (
  slugs: string[],
  subDepartments: SubDeptRef[] | undefined | null,
): number[] => {
  const wanted = new Set(slugs.map(normalizeSlug).filter(Boolean));
  if (!wanted.size || !Array.isArray(subDepartments)) return [];
  return subDepartments
    .filter((sd) => wanted.has(normalizeSlug(sd.slugs?.subDept)))
    .map((sd) => Number(sd.subDepartmentId ?? 0))
    .filter((id) => id > 0);
};

const findPredecessorStageEntry = (
  stageProgress: StageProgressEntry[],
  predecessorIds: number[],
  predecessorSlugs: string[],
): StageProgressEntry | null => {
  for (const id of predecessorIds) {
    const match = findStageEntryForSubDepartment(stageProgress, id);
    if (match) return match as StageProgressEntry;
  }

  // Fallback: match by subDepartmentName keywords from slug
  const keywords = predecessorSlugs.map((slug) =>
    slug.replace(/-/g, " ").toLowerCase(),
  );
  const byName = stageProgress.find((entry) => {
    const name = String(entry.subDepartmentName ?? "")
      .trim()
      .toLowerCase();
    if (!name) return false;
    return keywords.some(
      (keyword) =>
        name.includes(keyword) ||
        keyword.split(" ").every((part) => part && name.includes(part)),
    );
  });
  return byName ?? null;
};

/**
 * Resolve which premixes/motors the current subdepartment may edit,
 * based on approvals recorded on the previous stage in `stageProgress`.
 *
 * Starters (always enable all):
 * - Premix: Raw Material Preparation
 * - Motor: Case Preparation
 */
export const resolvePreviousStageApprovedUnits = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
  currentSlug?: string | null;
  currentSubDepartmentId?: number | null;
  subDepartments?: SubDeptRef[] | null;
}): PreviousStageApprovedUnits => {
  const slug = normalizeSlug(params.currentSlug);
  const stages = mergeStageProgress(params.stageProgress, params.currentStage);

  if (PREMIX_STARTER_SLUGS.has(slug)) {
    return emptyResult("premix", true);
  }
  if (MOTOR_STARTER_SLUGS.has(slug)) {
    return emptyResult("motor", true);
  }

  const config = PREDECESSOR_BY_SLUG[slug];
  if (!config) {
    // Unknown slug — do not gate (avoid locking unrelated screens)
    return emptyResult(null, true);
  }

  if (slug === "static-test-facility") {
    const qcGate = resolveStfPreviousStageApprovedUnits(stages, emptyResult("motor", false));
    if (qcGate.previousSubDepartmentId || qcGate.previousSubDepartmentName) {
      return qcGate;
    }
  }

  const predecessorIds = resolveSubDepartmentIdsForSlugs(
    config.predecessors,
    params.subDepartments,
  );
  const predecessor = findPredecessorStageEntry(
    stages,
    predecessorIds,
    config.predecessors,
  );

  if (!predecessor) {
    // No prior stage data yet — keep units disabled until approvals exist
    return {
      ...emptyResult(config.kind, false),
    };
  }

  if (config.kind === "premix") {
    return {
      enableAll: false,
      kind: "premix",
      previousSubDepartmentId: Number(predecessor.subDepartmentId ?? 0) || null,
      previousSubDepartmentName: String(predecessor.subDepartmentName ?? "").trim() || null,
      approvedPremixNos: collectApprovedPremixNos(predecessor),
      approvedMotorIds: new Set(),
    };
  }

  return {
    enableAll: false,
    kind: "motor",
    previousSubDepartmentId: Number(predecessor.subDepartmentId ?? 0) || null,
    previousSubDepartmentName: String(predecessor.subDepartmentName ?? "").trim() || null,
    approvedPremixNos: new Set(),
    approvedMotorIds: collectApprovedMotorIds(predecessor),
  };
};

export const isPremixEnabledByPreviousStage = (
  premixNo: number | string | null | undefined,
  gate: PreviousStageApprovedUnits | null | undefined,
): boolean => {
  if (!gate || gate.enableAll) return true;
  if (gate.kind !== "premix") return true;
  const no = Number(premixNo);
  if (!Number.isFinite(no) || no <= 0) return false;
  return gate.approvedPremixNos.has(no);
};

export const isMotorEnabledByPreviousStage = (
  motorId: string | null | undefined,
  gate: PreviousStageApprovedUnits | null | undefined,
): boolean => {
  if (!gate || gate.enableAll) return true;
  if (gate.kind !== "motor") return true;
  const id = String(motorId ?? "").trim();
  if (!id) return false;
  return gate.approvedMotorIds.has(id);
};

/** First motor id allowed by the previous-stage gate (falls back to first id). */
export const pickFirstPreviousStageEnabledMotorId = (
  motorIds: Array<string | null | undefined>,
  gate: PreviousStageApprovedUnits | null | undefined,
): string => {
  const normalized = motorIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  const firstEnabled = normalized.find((id) => isMotorEnabledByPreviousStage(id, gate));
  return firstEnabled ?? normalized[0] ?? "";
};

/** Approved within the current subdepartment — required before the next unit unlocks. */
export const isSequentialUnitApproved = (status: unknown): boolean =>
  isApprovedUnitStatus(status);

export const arePriorSequentialUnitsApproved = (
  unitIndex: number,
  orderedUnitKeys: string[],
  getStatus: (unitKey: string) => string | undefined | null,
): boolean => {
  if (unitIndex <= 0) return true;

  for (let index = 0; index < unitIndex; index += 1) {
    const unitKey = String(orderedUnitKeys[index] ?? "").trim();
    if (!unitKey) return false;
    if (!isSequentialUnitApproved(getStatus(unitKey))) return false;
  }

  return true;
};

export const arePriorMotorsApprovedInSequence = (
  motorIndex: number,
  orderedMotorIds: string[],
  getStatus: (motorId: string) => string | undefined | null,
): boolean => arePriorSequentialUnitsApproved(motorIndex, orderedMotorIds, getStatus);

export const arePriorPremixesApprovedInSequence = (
  premixIndex: number,
  orderedPremixNos: Array<number | string>,
  getStatus: (premixNo: number | string) => string | undefined | null,
): boolean =>
  arePriorSequentialUnitsApproved(
    premixIndex,
    orderedPremixNos.map((premixNo) => String(premixNo)),
    (premixKey) => getStatus(premixKey),
  );

export const isMotorEnabledForWorkflow = (
  motorId: string | null | undefined,
  orderedMotorIds: string[],
  gate: PreviousStageApprovedUnits | null | undefined,
  _getStatus?: (motorId: string) => string | undefined | null,
): boolean => {
  const id = String(motorId ?? "").trim();
  if (!id) return false;
  if (!orderedMotorIds.some((entry) => String(entry ?? "").trim() === id)) return false;
  // Case Prep (starter / enableAll) opens every motor. Later subdepts only check
  // the previous subdepartment's status for this motor — not sibling-motor sequence.
  return isMotorEnabledByPreviousStage(id, gate);
};

export const getMotorNavTabDisabledReason = (
  motorId: string | undefined,
  _motorIndex: number,
  _orderedMotorIds: string[],
  gate: PreviousStageApprovedUnits | null | undefined,
  _getStatus?: (motorId: string) => string | undefined | null,
  messages: {
    previousStage?: string;
    sequential?: string;
  } = {},
): string | undefined => {
  const id = String(motorId ?? "").trim();
  if (!id) return undefined;

  if (!isMotorEnabledByPreviousStage(id, gate)) {
    return messages.previousStage;
  }

  return undefined;
};

export const isPremixEnabledForWorkflow = (
  premixNo: number | string | null | undefined,
  orderedPremixNos: Array<number | string>,
  gate: PreviousStageApprovedUnits | null | undefined,
  getStatus: (premixNo: number | string) => string | undefined | null,
): boolean => {
  const no = Number(premixNo);
  if (!Number.isFinite(no) || no <= 0) return false;
  if (!isPremixEnabledByPreviousStage(no, gate)) return false;

  const premixIndex = orderedPremixNos.findIndex((entry) => Number(entry) === no);
  if (premixIndex < 0) return false;

  return arePriorPremixesApprovedInSequence(premixIndex, orderedPremixNos, getStatus);
};

export const getPremixNavTabDisabledReason = (
  premixNo: number | string | undefined,
  premixIndex: number,
  orderedPremixNos: Array<number | string>,
  gate: PreviousStageApprovedUnits | null | undefined,
  getStatus: (premixNo: number | string) => string | undefined | null,
  messages: {
    previousStage?: string;
    sequential?: string;
  } = {},
): string | undefined => {
  const no = Number(premixNo);
  if (!Number.isFinite(no) || no <= 0) return undefined;

  if (!isPremixEnabledByPreviousStage(no, gate)) {
    return messages.previousStage;
  }

  if (!arePriorPremixesApprovedInSequence(premixIndex, orderedPremixNos, getStatus)) {
    return messages.sequential;
  }

  return undefined;
};

export const buildMotorNavGateHelpers = (
  motorCards: Array<{ motorId?: string | null }>,
  previousStageGate: PreviousStageApprovedUnits | null | undefined,
  resolveMotorStatus: (motorId: string) => string | undefined | null,
  messages: {
    previousStage?: string;
    sequential?: string;
  } = {},
) => {
  const orderedMotorIds = motorCards
    .map((motor) => String(motor.motorId ?? "").trim())
    .filter(Boolean);

  return {
    orderedMotorIds,
    isMotorTabEnabled: (index: number) =>
      isMotorEnabledForWorkflow(
        motorCards[index]?.motorId,
        orderedMotorIds,
        previousStageGate,
        resolveMotorStatus,
      ),
    getMotorTabTooltip: (index: number) =>
      getMotorNavTabDisabledReason(
        motorCards[index]?.motorId,
        index,
        orderedMotorIds,
        previousStageGate,
        resolveMotorStatus,
        messages,
      ),
    isMotorWorkflowEnabled: (motorId: string | null | undefined) =>
      isMotorEnabledForWorkflow(motorId, orderedMotorIds, previousStageGate, resolveMotorStatus),
  };
};

const asStageArraySource = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Pick stage arrays from a batch / batch-details object (nested `data.batch` included). */
export const getBatchStageProgressArrays = (
  batch: Record<string, unknown> | null | undefined,
): { stageProgress: unknown; currentStage: unknown } => {
  if (!batch) return { stageProgress: null, currentStage: null };

  const candidates: Record<string, unknown>[] = [batch];
  const data = asStageArraySource(batch.data);
  if (data) {
    candidates.push(data);
    const nestedBatch = asStageArraySource(data.batch);
    if (nestedBatch) candidates.push(nestedBatch);
  }
  const rootBatch = asStageArraySource(batch.batch);
  if (rootBatch) candidates.push(rootBatch);

  for (const source of candidates) {
    if (Array.isArray(source.stageProgress) || Array.isArray(source.currentStage)) {
      return {
        stageProgress: Array.isArray(source.stageProgress) ? source.stageProgress : null,
        currentStage: Array.isArray(source.currentStage) ? source.currentStage : null,
      };
    }
  }

  return {
    stageProgress: batch.stageProgress ?? null,
    currentStage: batch.currentStage ?? null,
  };
};
