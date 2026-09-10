import {
  SUB_DEPT,
  type BatchView,
  type MotorUnit,
  type PremixUnit,
  type StageProgress,
  type SubDeptId,
} from "../data/models/user/BatchStageTypes";

export {
  SUB_DEPT,
  type BatchView,
  type MotorUnit,
  type PremixUnit,
  type StageProgress,
  type SubDeptId,
};

const EDITABLE_STATUSES = new Set(["TO_BE_INITIATED", "IN_PROGRESS", "DRAFT", "REJECTED"]);
const SUBMITTABLE_STATUSES = new Set(["IN_PROGRESS", "DRAFT"]);

export function usesParallelUnitLocks(batch: Pick<BatchView, "parallelFlowEnabled">): boolean {
  return batch.parallelFlowEnabled === true;
}

/** Active subdept screens — currentStage only (see parallel batch spec). */
export function getActiveStage(batch: BatchView, subDeptId: number): StageProgress | undefined {
  return batch.currentStage?.find((s) => s.subDepartmentId === subDeptId);
}

/** Timeline / admin views — currentStage first, then stageProgress. */
export function getStage(batch: BatchView, subDeptId: number): StageProgress | undefined {
  return (
    getActiveStage(batch, subDeptId) ??
    batch.stageProgress?.find((s) => s.subDepartmentId === subDeptId)
  );
}

const coalesceStageProgressArrays = (
  primary: StageProgress[] | null | undefined,
  fallback: StageProgress[] | null | undefined,
): StageProgress[] | undefined => {
  if (primary && primary.length > 0) return primary;
  if (fallback && fallback.length > 0) return fallback;
  return primary ?? fallback ?? undefined;
};

export function isPremixDisabled(unit: PremixUnit | null | undefined): boolean {
  return unit?.locked === true;
}

export function isMotorDisabled(unit: MotorUnit | null | undefined): boolean {
  return unit?.locked === true;
}

/** Editability after lock check — still use existing status rules. */
export function canEditUnit(
  unit: PremixUnit | MotorUnit | null | undefined,
  submissionStatus?: string,
): boolean {
  if (unit?.locked === true) return false;
  return EDITABLE_STATUSES.has(String(submissionStatus ?? "").trim().toUpperCase());
}

export function canSubmitUnit(
  unit: PremixUnit | MotorUnit | null | undefined,
  submissionStatus?: string,
): boolean {
  if (unit?.locked === true) return false;
  return SUBMITTABLE_STATUSES.has(String(submissionStatus ?? "").trim().toUpperCase());
}

const normalizePremixNo = (value: number | string | null | undefined): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function findPremixUnit(
  stage: StageProgress | null | undefined,
  premixNo: number | string,
  stageType: "PREMIX" | "FINAL_MIX" = "PREMIX",
): PremixUnit | undefined {
  if (!stage) return undefined;
  const targetNo = normalizePremixNo(premixNo);
  if (targetNo == null) return undefined;

  const list =
    stageType === "FINAL_MIX" ? stage.finalMixStatuses ?? [] : stage.premixStatuses ?? [];

  return list.find((item) => {
    const itemNo = normalizePremixNo(item.premixNo);
    if (itemNo !== targetNo) return false;
    if (!item.stageType) return true;
    return String(item.stageType).trim().toUpperCase() === stageType;
  });
}

export function findMotorUnit(
  stage: StageProgress | null | undefined,
  motorId: string,
): MotorUnit | undefined {
  if (!stage) return undefined;
  const targetId = String(motorId ?? "").trim();
  if (!targetId) return undefined;
  return (stage.motorStatuses ?? []).find(
    (item) => String(item.motorId ?? "").trim() === targetId,
  );
}

/** Infer parallel flow when API omits parallelFlowEnabled (e.g. SM dashboard). */
export function inferParallelFlowEnabled(batch: {
  batchType?: string | null;
  parallelFlowEnabled?: boolean | null;
  currentStage?: StageProgress[] | null;
  stageProgress?: StageProgress[] | null;
}): boolean {
  if (batch.parallelFlowEnabled === true) return true;
  if (batch.parallelFlowEnabled === false) return false;
  if (String(batch.batchType ?? "").trim().toUpperCase() !== "MAIN") return false;

  const stages = [...(batch.currentStage ?? []), ...(batch.stageProgress ?? [])];
  return stages.some((stage) =>
    [...(stage.premixStatuses ?? []), ...(stage.finalMixStatuses ?? []), ...(stage.motorStatuses ?? [])].some(
      (unit) => unit.locked === true,
    ),
  );
}

/** Normalize raw API stage arrays into typed StageProgress[]. */
export function normalizeStageProgressArray(raw: unknown): StageProgress[] | null {
  if (!Array.isArray(raw)) return null;

  return raw
    .map((entry): StageProgress | null => {
      if (!entry || typeof entry !== "object") return null;
      const source = entry as Record<string, unknown>;
      const subDepartmentId = Number(source.subDepartmentId);
      if (!Number.isFinite(subDepartmentId)) return null;

      const normalizePremix = (items: unknown): PremixUnit[] | undefined => {
        if (!Array.isArray(items)) return undefined;
        return items
          .map((item): PremixUnit | null => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const premixNo = normalizePremixNo(row.premixNo);
            if (premixNo == null) return null;
            return {
              premixNo,
              division: row.division != null ? String(row.division) : undefined,
              subType: row.subType != null ? String(row.subType) : undefined,
              stageType:
                row.stageType === "PREMIX" || row.stageType === "FINAL_MIX"
                  ? row.stageType
                  : undefined,
              premixSubmissionType:
                row.premixSubmissionType != null ? String(row.premixSubmissionType) : undefined,
              premixSubmissionStatus:
                row.premixSubmissionStatus != null
                  ? String(row.premixSubmissionStatus)
                  : undefined,
              locked: row.locked === true ? true : row.locked === false ? false : null,
            };
          })
          .filter((item): item is PremixUnit => item != null);
      };

      const normalizeMotor = (items: unknown): MotorUnit[] | undefined => {
        if (!Array.isArray(items)) return undefined;
        return items
          .map((item): MotorUnit | null => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const motorId = String(row.motorId ?? "").trim();
            if (!motorId) return null;
            return {
              motorId,
              division: row.division != null ? String(row.division) : undefined,
              subType: row.subType != null ? String(row.subType) : undefined,
              motorSubmissionType:
                row.motorSubmissionType != null ? String(row.motorSubmissionType) : undefined,
              motorSubmissionStatus:
                row.motorSubmissionStatus != null ? String(row.motorSubmissionStatus) : undefined,
              locked: row.locked === true ? true : row.locked === false ? false : null,
            };
          })
          .filter((item): item is MotorUnit => item != null);
      };

      return {
        departmentId:
          source.departmentId != null ? Number(source.departmentId) : undefined,
        departmentName:
          source.departmentName != null ? String(source.departmentName) : undefined,
        subDepartmentId,
        subDepartmentName:
          source.subDepartmentName != null ? String(source.subDepartmentName) : undefined,
        status: source.status != null ? String(source.status) : undefined,
        premixStatuses: normalizePremix(source.premixStatuses),
        finalMixStatuses: normalizePremix(source.finalMixStatuses),
        motorStatuses: normalizeMotor(source.motorStatuses),
        divisionStatuses: Array.isArray(source.divisionStatuses)
          ? source.divisionStatuses
          : undefined,
      };
    })
    .filter((entry): entry is StageProgress => entry != null);
}

export function parseParallelFlowEnabled(raw: unknown): boolean | null {
  if (raw === true) return true;
  if (raw === false) return false;
  return null;
}

export function mergeBatchStageFields<T extends Record<string, unknown>>(
  existing: T,
  details: Record<string, unknown> | null | undefined,
): T {
  if (!details) return existing;
  return {
    ...existing,
    parallelFlowEnabled: parseParallelFlowEnabled(
      details.parallelFlowEnabled ?? existing.parallelFlowEnabled,
    ),
    currentStage: coalesceStageProgressArrays(
      normalizeStageProgressArray(details.currentStage),
      normalizeStageProgressArray(existing.currentStage),
    ),
    stageProgress: coalesceStageProgressArrays(
      normalizeStageProgressArray(details.stageProgress),
      normalizeStageProgressArray(existing.stageProgress),
    ),
  };
}

export function formatCurrentStageLabels(
  currentStage: StageProgress[] | null | undefined,
  fallback?: string,
): string {
  if (!Array.isArray(currentStage) || currentStage.length === 0) {
    return String(fallback ?? "").trim() || "—";
  }
  const names = currentStage
    .map((stage) => String(stage.subDepartmentName ?? "").trim())
    .filter(Boolean);
  if (names.length === 0) {
    return String(fallback ?? "").trim() || "—";
  }
  return names.join(", ");
}

const APPROVED_UNIT_STATUSES = new Set(["APPROVED", "COMPLETELY_APPROVED"]);

const isApprovedUnitSubmissionStatus = (status: unknown): boolean => {
  const upper = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return APPROVED_UNIT_STATUSES.has(upper);
};

/** Merge stageProgress with currentStage overlays (same shape as previousStageApproval). */
export function mergeBatchStagesForLookup(
  batch: Pick<BatchView, "currentStage" | "stageProgress">,
): StageProgress[] {
  const progress = batch.stageProgress ?? [];
  const current = batch.currentStage ?? [];
  if (!progress.length) return current;
  if (!current.length) return progress;

  const currentById = new Map<number, StageProgress>();
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

export type CastingUpstreamMixingGate = {
  /** False when RMP premixes or Mixing premix/final mix are not all approved. */
  submitEnabled: boolean;
  disabledReason?: string;
};

/**
 * Casting motor submit requires every RMP premix and every Mixing premix + final mix
 * to be approved in batch stage data (stageProgress + currentStage overlay).
 */
export function getCastingUpstreamMixingGate(
  batch: Pick<BatchView, "currentStage" | "stageProgress"> | null | undefined,
): CastingUpstreamMixingGate {
  if (!batch) return { submitEnabled: true };

  const stages = mergeBatchStagesForLookup(batch);
  const rmpStage = stages.find((stage) => stage.subDepartmentId === SUB_DEPT.RMP);
  const mixingStage = stages.find((stage) => stage.subDepartmentId === SUB_DEPT.MIXING);

  if (!rmpStage && !mixingStage) {
    return { submitEnabled: true };
  }

  const pending: string[] = [];

  (rmpStage?.premixStatuses ?? []).forEach((unit) => {
    const premixNo = Number(unit.premixNo);
    if (!Number.isFinite(premixNo) || premixNo <= 0) return;
    if (!isApprovedUnitSubmissionStatus(unit.premixSubmissionStatus)) {
      pending.push(`RMP Premix ${premixNo}`);
    }
  });

  (mixingStage?.premixStatuses ?? []).forEach((unit) => {
    const premixNo = Number(unit.premixNo);
    if (!Number.isFinite(premixNo) || premixNo <= 0) return;
    if (!isApprovedUnitSubmissionStatus(unit.premixSubmissionStatus)) {
      pending.push(`Mixing Premix ${premixNo}`);
    }
  });

  (mixingStage?.finalMixStatuses ?? []).forEach((unit) => {
    const premixNo = Number(unit.premixNo);
    if (!Number.isFinite(premixNo) || premixNo <= 0) return;
    if (!isApprovedUnitSubmissionStatus(unit.premixSubmissionStatus)) {
      pending.push(`Mixing Final Mix ${premixNo}`);
    }
  });

  if (pending.length === 0) {
    return { submitEnabled: true };
  }

  return {
    submitEnabled: false,
    disabledReason: `Submit is disabled until all Raw Material Preparation premixes and Mixing premix/final mix units are approved. Pending: ${pending.join(", ")}.`,
  };
}

export async function fetchEnrichedBatchStageFields(batchId: string) {
  const { batchManagementController } = await import(
    "../controllers/admin/BatchManagement/batchManagementController"
  );
  const details = (await batchManagementController.getBatchById(batchId)) as
    | Record<string, unknown>
    | null
    | undefined;
  if (!details) return null;
  return {
    parallelFlowEnabled: parseParallelFlowEnabled(details.parallelFlowEnabled),
    currentStage: normalizeStageProgressArray(details.currentStage),
    stageProgress: normalizeStageProgressArray(details.stageProgress),
  };
}
