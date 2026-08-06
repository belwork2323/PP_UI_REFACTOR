import {
  findStageEntryForSubDepartment,
  normalizeSubdepartmentBatchStatus,
} from "../../data/models/user/SubdepartmentBatchModel";
import { OPERATION_STATUS } from "../operationStatus";

export type PartialFlowUnitKind = "premix" | "motor";

export type StageProgressUnitStatus = {
  premixNo?: number | string | null;
  motorId?: string | null;
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
    predecessors: ["ndt", "trimming", "post-cure-operations", "casting-and-curing"],
  },
  dispatch: {
    kind: "motor",
    predecessors: ["static-test-facility", "ndt", "trimming", "post-cure-operations"],
  },
};

const APPROVED_UNIT_STATUSES = new Set([
  "APPROVED",
  "FINAL_APPROVAL_COMPLETED",
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
    normalized === OPERATION_STATUS.FINAL_APPROVAL_COMPLETED
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
  const stageProgress = asStageEntries(params.stageProgress);
  // Prefer stageProgress; fall back to currentStage only when progress is empty
  const stages =
    stageProgress.length > 0 ? stageProgress : asStageEntries(params.currentStage);

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

/** Pick stage arrays from a batch / batch-details object. */
export const getBatchStageProgressArrays = (
  batch: Record<string, unknown> | null | undefined,
): { stageProgress: unknown; currentStage: unknown } => ({
  stageProgress: batch?.stageProgress,
  currentStage: batch?.currentStage,
});
