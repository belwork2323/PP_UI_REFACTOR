import {
  type PartialFlowUnitKind,
  type PreviousStageApprovedUnits,
  type StageProgressEntry,
  isMotorEnabledByPreviousStage,
  isPremixEnabledByPreviousStage,
} from "../previousStageApproval";
import {
  normalizePartialItemStatus,
  type QcPartialNavItem,
} from "./qcDivisionApprovalUnits";
import {
  shouldSkipQcManufacturingUnitPrerequisiteGate,
} from "./qcBatchType";

/** QC divisions that gate motor units on the previous motor subdepartment (typically NDT). */
const MOTOR_QC_DIVISIONS = new Set([
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

const APPROVED_STATUSES = new Set(["APPROVED", "COMPLETELY_APPROVED"]);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s) return s;
  }
  return "";
};

const isYetToStartStatus = (status: unknown): boolean => {
  const upper = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return !upper || upper === "YET_TO_START";
};

/** Manufacturing unit must be APPROVED before QC can fill that unit. */
const isApprovedStatus = (status: unknown): boolean => {
  const normalized = normalizePartialItemStatus(status);
  if (normalized === "APPROVED") return true;
  const upper = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return APPROVED_STATUSES.has(upper);
};

/**
 * QC divisionStatuses unit lock: backend unlockPremixUnit promotes YET_TO_START → TO_BE_INITIATED
 * when manufacturing Mixing Final Mix / Premix is approved. Treat any non-YET_TO_START as unlocked.
 */
const isUnitUnlockedStatus = (status: unknown): boolean => !isYetToStartStatus(status);

const normalizeNameKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

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
  const currentById = new Map<number, StageProgressEntry>();
  current.forEach((stage) => {
    const id = Number(stage.subDepartmentId);
    if (Number.isFinite(id) && id > 0) currentById.set(id, stage);
  });
  return progress.map((stage) => {
    const id = Number(stage.subDepartmentId);
    return (Number.isFinite(id) && id > 0 && currentById.get(id)) || stage;
  });
};

/** QC Quality Control catalog (id 11) — not QC NDT. Those rows are current QC work. */
const isQcQualityControlStage = (stage: StageProgressEntry): boolean => {
  const sub = normalizeNameKey(stage.subDepartmentName);
  if (!sub || sub === "ndt") return false;
  return sub === "qualitycontrol" || sub === "qcdivision" || sub === "qc";
};

const isQcDivisionTaggedRow = (row: Record<string, unknown>): boolean =>
  Boolean(pickString(row.division));

const emptyGate = (
  kind: PartialFlowUnitKind | null,
  enableAll: boolean,
  previousName: string | null = null,
): PreviousStageApprovedUnits => ({
  enableAll,
  kind,
  previousSubDepartmentId: null,
  previousSubDepartmentName: previousName,
  approvedPremixNos: new Set(),
  approvedMotorIds: new Set(),
});

export const normalizeQcDivisionKey = (value: unknown): string => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!raw) return "";

  if (
    raw === "RAW_MATERIAL_PROCESSING" ||
    raw === "RAWMATERIALPROCESSING" ||
    (raw.includes("RAW_MATERIAL") && raw.includes("PROCESSING"))
  ) {
    return "RAW_MATERIAL_PROCESSING";
  }
  if (
    raw === "RAW_MATERIAL_REVALIDATION" ||
    raw === "RAWMATERIALREVALIDATION" ||
    (raw.includes("RAW_MATERIAL") && raw.includes("REVALIDATION"))
  ) {
    return "RAW_MATERIAL_REVALIDATION";
  }
  if (raw === "RAW_MATERIAL" || raw === "RAWMATERIAL") {
    return "RAW_MATERIAL";
  }
  if (raw === "DECORING" || raw === "DE_CORING" || raw === "DE-CORING") {
    return "DE_CORING";
  }
  if (raw === "POSTCURE" || raw === "POST_CURE" || raw === "POST-CURE") {
    return "POST_CURE";
  }
  if (raw === "PROPELLANT_PROPERTIES" || raw === "PROPELLANT") {
    return "QC";
  }
  if (raw === "WEIGHMENT" || raw === "WEIGHTMENT") {
    return "WEIGHTMENT";
  }
  return raw;
};

export const resolveQcGateDivisionKey = (params: {
  flowKey?: string | null;
  tabKey?: string | null;
  rawMaterialType?: string | null;
  apiDivision?: string | null;
}): string => {
  const fromApi = normalizeQcDivisionKey(params.apiDivision);
  if (fromApi === "RAW_MATERIAL_PROCESSING" || fromApi === "RAW_MATERIAL_REVALIDATION") {
    return fromApi;
  }
  if (fromApi && fromApi !== "RAW_MATERIAL") return fromApi;

  const rawType = normalizeQcDivisionKey(params.rawMaterialType || params.tabKey);
  if (rawType === "RAW_MATERIAL_PROCESSING" || rawType === "RAW_MATERIAL_REVALIDATION") {
    return rawType;
  }

  const flow = normalizeQcDivisionKey(params.flowKey);
  if (flow === "RAW_MATERIAL") {
    return rawType === "RAW_MATERIAL_REVALIDATION"
      ? "RAW_MATERIAL_REVALIDATION"
      : "RAW_MATERIAL_PROCESSING";
  }
  return flow || fromApi;
};

export const formatQcDivisionGateLabel = (divisionKey: string | null | undefined): string => {
  const key = String(divisionKey ?? "").trim();
  const labels: Record<string, string> = {
    MFG_RAW_MATERIAL_PREP: "Raw Material Preparation",
    MFG_MIXING: "Mixing",
    MFG_CASE_PREPARATION: "Case Preparation",
    MFG_CASTING_AND_CURING: "Casting and Curing",
    MFG_POST_CURE: "Post Cure Operations",
    MFG_TRIMMING: "Trimming",
    MFG_OR_QC_NDT: "NDT",
    RAW_MATERIAL_PROCESSING: "Raw Material Processing",
    RAW_MATERIAL_REVALIDATION: "Raw Material Revalidation",
    MIXING: "Mixing",
    HARDWARE: "Hardware",
    CASTING: "Casting",
    CURING: "Curing",
    DE_CORING: "De-coring",
    TRIMMING: "Trimming",
    POST_CURE: "Post Cure",
    NDT: "NDT",
    QC: "QC",
    WEIGHTMENT: "Weighment",
  };
  const normalized = normalizeQcDivisionKey(key);
  return (
    labels[key] ||
    labels[normalized] ||
    key.replace(/^MFG_/, "").replace(/_/g, " ") ||
    "previous division"
  );
};

const isMixingStage = (stage: StageProgressEntry): boolean =>
  normalizeNameKey(stage.subDepartmentName) === "mixing";

const isRawMaterialPrepStage = (stage: StageProgressEntry): boolean => {
  const sub = normalizeNameKey(stage.subDepartmentName);
  return (
    sub === "rawmaterialpreparation" ||
    sub === "rawmaterialprep" ||
    sub.includes("rawmaterialprep")
  );
};

const isNdtStage = (stage: StageProgressEntry): boolean => {
  const id = Number(stage.subDepartmentId ?? (stage as { sub_department_id?: unknown }).sub_department_id);
  // SUB_DEPT.NDT = 10 (QC NDT user subdepartment, not manufacturing).
  if (Number.isFinite(id) && id === 10) return true;
  return normalizeNameKey(stage.subDepartmentName) === "ndt";
};

const isCasePrepStage = (stage: StageProgressEntry): boolean => {
  const sub = normalizeNameKey(stage.subDepartmentName);
  return sub === "casepreparation" || sub.includes("caseprep");
};

const isCastingCuringStage = (stage: StageProgressEntry): boolean => {
  const sub = normalizeNameKey(stage.subDepartmentName);
  return sub === "castingandcuring" || (sub.includes("casting") && sub.includes("curing"));
};

const isPostCureStage = (stage: StageProgressEntry): boolean => {
  const sub = normalizeNameKey(stage.subDepartmentName);
  return sub === "postcureoperations" || sub === "postcure" || sub.includes("postcure");
};

const isTrimmingStage = (stage: StageProgressEntry): boolean =>
  normalizeNameKey(stage.subDepartmentName) === "trimming";

const isStageCompletelyApproved = (stage: StageProgressEntry | null): boolean => {
  if (!stage) return false;
  const upper = String(stage.status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return upper === "COMPLETELY_APPROVED" || upper === "APPROVED";
};

/** Manufacturing predecessor stage matcher + label for a QC division key. */
const manufacturingPredecessorForQcDivision = (
  currentKey: string,
): {
  match: (stage: StageProgressEntry) => boolean;
  label: string;
  kind: PartialFlowUnitKind;
} | null => {
  if (currentKey === "RAW_MATERIAL_PROCESSING") {
    return { match: isRawMaterialPrepStage, label: "Raw Material Preparation", kind: "premix" };
  }
  if (currentKey === "MIXING") {
    return { match: isMixingStage, label: "Mixing", kind: "premix" };
  }
  if (currentKey === "HARDWARE") {
    return { match: isCasePrepStage, label: "Case Preparation", kind: "motor" };
  }
  if (
    currentKey === "CASTING" ||
    currentKey === "CURING" ||
    currentKey === "DE_CORING"
  ) {
    return { match: isCastingCuringStage, label: "Casting and Curing", kind: "motor" };
  }
  if (currentKey === "POST_CURE") {
    return { match: isPostCureStage, label: "Post Cure Operations", kind: "motor" };
  }
  if (currentKey === "TRIMMING") {
    return { match: isTrimmingStage, label: "Trimming", kind: "motor" };
  }
  // NDT, QC, WEIGHTMENT — unlock only after the NDT subdepartment (id 10) is approved.
  if (currentKey === "NDT" || currentKey === "QC" || currentKey === "WEIGHTMENT") {
    return { match: isNdtStage, label: "NDT", kind: "motor" };
  }
  return null;
};

const untaggedPremixRows = (
  stage: StageProgressEntry,
  options: { finalMix?: boolean } = {},
): Record<string, unknown>[] => {
  const source = options.finalMix
    ? [
        ...asArray(stage.finalMixStatuses),
        ...asArray(stage.premixStatuses).filter((entry) => {
          const rec = asRecord(entry);
          return (
            String(rec?.stageType ?? rec?.stage_type ?? "")
              .trim()
              .toUpperCase() === "FINAL_MIX"
          );
        }),
      ]
    : asArray(stage.premixStatuses).filter((entry) => {
        const rec = asRecord(entry);
        const stageType = String(rec?.stageType ?? rec?.stage_type ?? "")
          .trim()
          .toUpperCase();
        return !stageType || stageType === "PREMIX";
      });

  return source
    .map((entry) => asRecord(entry))
    .filter((rec): rec is Record<string, unknown> => Boolean(rec && !isQcDivisionTaggedRow(rec)));
};

const untaggedMotorRows = (stage: StageProgressEntry): Record<string, unknown>[] =>
  asArray(stage.motorStatuses)
    .map((entry) => asRecord(entry))
    .filter((rec): rec is Record<string, unknown> => Boolean(rec && !isQcDivisionTaggedRow(rec)));

const premixNoFromRow = (rec: Record<string, unknown>): number | null =>
  pickNumber(rec.premixNo, rec.premix_no, rec.finalMixNo, rec.final_mix_no);

const premixStatusFromRow = (rec: Record<string, unknown>): unknown =>
  rec.premixSubmissionStatus ??
  rec.premix_submission_status ??
  rec.mixSubmissionStatus ??
  rec.status;

const motorIdFromRow = (rec: Record<string, unknown>): string =>
  pickString(rec.motorId, rec.motor_id, rec.motorIdNo);

const motorStatusFromRow = (rec: Record<string, unknown>): unknown =>
  rec.motorSubmissionStatus ?? rec.motor_submission_status ?? rec.status;

const collectApprovedPremixNos = (
  stage: StageProgressEntry | null,
  finalMix: boolean,
): Set<number> => {
  const ids = new Set<number>();
  if (!stage) return ids;
  untaggedPremixRows(stage, { finalMix }).forEach((rec) => {
    const premixNo = premixNoFromRow(rec);
    if (premixNo == null) return;
    if (isApprovedStatus(premixStatusFromRow(rec))) ids.add(premixNo);
  });
  return ids;
};

const collectApprovedMotorIds = (stage: StageProgressEntry | null): Set<string> => {
  const ids = new Set<string>();
  if (!stage) return ids;
  untaggedMotorRows(stage).forEach((rec) => {
    const motorId = motorIdFromRow(rec);
    if (!motorId) return;
    if (isApprovedStatus(motorStatusFromRow(rec))) ids.add(motorId);
  });
  return ids;
};

const collectAllPremixNos = (
  stage: StageProgressEntry | null,
  finalMix: boolean,
): Set<number> => {
  const ids = new Set<number>();
  if (!stage) return ids;
  untaggedPremixRows(stage, { finalMix }).forEach((rec) => {
    const premixNo = premixNoFromRow(rec);
    if (premixNo != null) ids.add(premixNo);
  });
  return ids;
};

const collectAllMotorIds = (stage: StageProgressEntry | null): Set<string> => {
  const ids = new Set<string>();
  if (!stage) return ids;
  untaggedMotorRows(stage).forEach((rec) => {
    const motorId = motorIdFromRow(rec);
    if (motorId) ids.add(motorId);
  });
  return ids;
};

const priorStages = (stages: StageProgressEntry[]): StageProgressEntry[] =>
  stages.filter((stage) => !isQcQualityControlStage(stage));

const findRequiredStage = (
  stages: StageProgressEntry[],
  match: (stage: StageProgressEntry) => boolean,
): StageProgressEntry | null => priorStages(stages).find(match) ?? null;

const gateFromPredecessor = (
  kind: PartialFlowUnitKind,
  stage: StageProgressEntry | null,
  extras: Pick<
    PreviousStageApprovedUnits,
    "approvedPremixNos" | "approvedMotorIds" | "approvedFinalMixNos"
  >,
  fallbackName: string,
): PreviousStageApprovedUnits => ({
  enableAll: false,
  kind,
  previousSubDepartmentId: Number(stage?.subDepartmentId ?? 0) || null,
  previousSubDepartmentName: String(stage?.subDepartmentName ?? "").trim() || fallbackName,
  approvedPremixNos: extras.approvedPremixNos ?? new Set(),
  approvedMotorIds: extras.approvedMotorIds ?? new Set(),
  approvedFinalMixNos: extras.approvedFinalMixNos,
});

/**
 * Build manufacturing unlock gate for a QC division from stageProgress.
 * COMPLETELY_APPROVED / stage APPROVED unlocks all units present on that stage
 * (plus any candidate ids passed in).
 */
export const resolveManufacturingGateForQcDivision = (params: {
  currentDivisionKey: string;
  stageProgress?: unknown;
  currentStage?: unknown;
  candidatePremixNos?: Array<number | string>;
  candidateMotorIds?: string[];
}): PreviousStageApprovedUnits | null => {
  const currentKey = normalizeQcDivisionKey(params.currentDivisionKey);
  if (!currentKey || currentKey === "RAW_MATERIAL_REVALIDATION") {
    return emptyGate(null, true);
  }

  const predecessor = manufacturingPredecessorForQcDivision(currentKey);
  if (!predecessor) return null;

  const stages = mergeStageProgress(params.stageProgress, params.currentStage);
  const stage = findRequiredStage(stages, predecessor.match);
  if (!stage) return null;

  const stageDone = isStageCompletelyApproved(stage);
  const candidatePremixNos = new Set<number>();
  (params.candidatePremixNos ?? []).forEach((value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) candidatePremixNos.add(n);
  });
  const candidateMotorIds = new Set(
    (params.candidateMotorIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean),
  );

  if (predecessor.kind === "premix") {
    const approvedPremixNos = collectApprovedPremixNos(stage, false);
    const approvedFinalMixNos =
      currentKey === "MIXING" ? collectApprovedPremixNos(stage, true) : undefined;
    if (stageDone) {
      collectAllPremixNos(stage, false).forEach((n) => approvedPremixNos.add(n));
      candidatePremixNos.forEach((n) => approvedPremixNos.add(n));
      if (approvedFinalMixNos) {
        collectAllPremixNos(stage, true).forEach((n) => approvedFinalMixNos.add(n));
        candidatePremixNos.forEach((n) => approvedFinalMixNos.add(n));
      }
    }
    return gateFromPredecessor(
      "premix",
      stage,
      {
        approvedPremixNos,
        approvedMotorIds: new Set(),
        approvedFinalMixNos,
      },
      predecessor.label,
    );
  }

  const approvedMotorIds = collectApprovedMotorIds(stage);
  if (stageDone) {
    collectAllMotorIds(stage).forEach((id) => approvedMotorIds.add(id));
    candidateMotorIds.forEach((id) => approvedMotorIds.add(id));
  }
  return gateFromPredecessor(
    "motor",
    stage,
    {
      approvedPremixNos: new Set(),
      approvedMotorIds,
    },
    predecessor.label,
  );
};

/**
 * QC unit tabs: prefer manufacturing stageProgress APPROVED / COMPLETELY_APPROVED.
 * Fall back to QC divisionStatuses only when the manufacturing stage row is missing.
 */
export const resolveQcPreviousDivisionApprovedUnits = (params: {
  currentDivisionKey: string;
  stageProgress?: unknown;
  currentStage?: unknown;
  premixStatuses?: unknown;
  finalMixStatuses?: unknown;
  motorStatuses?: unknown;
  candidatePremixNos?: Array<number | string>;
  candidateMotorIds?: string[];
  batchType?: string | null;
  subBatchType?: string | null;
}): PreviousStageApprovedUnits => {
  if (
    shouldSkipQcManufacturingUnitPrerequisiteGate(params.batchType, params.subBatchType)
  ) {
    return emptyGate(null, true);
  }

  const currentKey = normalizeQcDivisionKey(params.currentDivisionKey);
  if (!currentKey || currentKey === "RAW_MATERIAL_REVALIDATION") {
    return emptyGate(null, true);
  }

  const fromManufacturing = resolveManufacturingGateForQcDivision({
    currentDivisionKey: currentKey,
    stageProgress: params.stageProgress,
    currentStage: params.currentStage,
    candidatePremixNos: params.candidatePremixNos,
    candidateMotorIds: params.candidateMotorIds,
  });

  // QC divisionStatuses: manufacturing Mixing Final Mix / Premix approval unlocks QC units
  // to TO_BE_INITIATED via unlockQcMixingFromManufacturing. Merge so Final Mix unlocks even
  // when stageProgress finalMixStatuses are sparse.
  const fromDivisionStatuses = resolveGateFromQcDivisionStatuses(params, currentKey);

  if (fromManufacturing) {
    if (fromDivisionStatuses && !fromDivisionStatuses.enableAll) {
      fromDivisionStatuses.approvedPremixNos.forEach((n) =>
        fromManufacturing.approvedPremixNos.add(n),
      );
      fromDivisionStatuses.approvedMotorIds.forEach((id) =>
        fromManufacturing.approvedMotorIds.add(id),
      );
      if (currentKey === "MIXING") {
        const finalNos =
          fromManufacturing.approvedFinalMixNos ??
          (fromManufacturing.approvedFinalMixNos = new Set<number>());
        fromDivisionStatuses.approvedFinalMixNos?.forEach((n) => finalNos.add(n));
      }
    }
    return fromManufacturing;
  }

  // NDT / QC / Weighment must wait for the NDT subdepartment stage.
  // Never fall back to QC divisionStatuses — seeded TO_BE_INITIATED motor rows
  // would incorrectly unlock these tabs as soon as any QC division starts.
  if (currentKey === "NDT" || currentKey === "QC" || currentKey === "WEIGHTMENT") {
    return emptyGate("motor", false, "NDT");
  }

  if (fromDivisionStatuses) {
    return fromDivisionStatuses;
  }

  // Manufacturing stage missing and no QC divisionStatuses — keep locked (not enableAll).
  const predecessor = manufacturingPredecessorForQcDivision(currentKey);
  if (predecessor) {
    return emptyGate(predecessor.kind, false, predecessor.label);
  }

  return emptyGate(null, false);
};

/** Division tab: enabled when manufacturing gate has any approved unit or enableAll. */
export const isQcDivisionEnabledByManufacturing = (params: {
  divisionKey: string;
  stageProgress?: unknown;
  currentStage?: unknown;
  batchType?: string | null;
  subBatchType?: string | null;
}): { enabled: boolean; reason?: string } => {
  const key = normalizeQcDivisionKey(params.divisionKey);
  if (!key || key === "RAW_MATERIAL_REVALIDATION" || key === "RAW_MATERIAL") {
    return { enabled: true };
  }

  if (
    shouldSkipQcManufacturingUnitPrerequisiteGate(params.batchType, params.subBatchType)
  ) {
    return { enabled: true };
  }

  const gate = resolveQcPreviousDivisionApprovedUnits({
    currentDivisionKey: key,
    stageProgress: params.stageProgress,
    currentStage: params.currentStage,
    batchType: params.batchType,
    subBatchType: params.subBatchType,
  });

  if (gate.enableAll) return { enabled: true };

  const hasApproved =
    gate.approvedPremixNos.size > 0 ||
    (gate.approvedFinalMixNos?.size ?? 0) > 0 ||
    gate.approvedMotorIds.size > 0;

  if (hasApproved) return { enabled: true };

  const previousLabel = formatQcDivisionGateLabel(
    gate.previousSubDepartmentName ?? manufacturingPredecessorForQcDivision(key)?.label,
  );
  const currentLabel = formatQcDivisionGateLabel(key);
  return {
    enabled: false,
    reason: `Approve at least one unit in ${previousLabel} to enable ${currentLabel}.`,
  };
};

const findQcStageEntry = (
  stageProgress?: unknown,
  currentStage?: unknown,
): StageProgressEntry | null => {
  const stages = mergeStageProgress(stageProgress, currentStage);
  return (
    stages.find((stage) => {
      const id = Number(stage.subDepartmentId ?? stage.sub_department_id);
      if (id === 11) return true;
      return isQcDivisionStageName(String(stage.subDepartmentName ?? ""));
    }) ?? null
  );
};

const isQcDivisionStageName = (subDepartmentName: string) => {
  const name = normalizeNameKey(subDepartmentName);
  return name === "qualitycontrol" || name === "qcdivision" || name === "qc";
};

const matchDivisionRow = (
  row: Record<string, unknown>,
  currentKey: string,
): boolean => {
  const name = normalizeQcDivisionKey(
    pickString(row.divisionName, row.division, row.name),
  );
  const id = pickNumber(row.divisionId, row.division_id);
  if (name === currentKey || (name === "PROPELLANT_PROPERTIES" && currentKey === "QC")) {
    return true;
  }
  if (currentKey === "QC" && (id === 10 || name === "PROPELLANT_PROPERTIES")) return true;
  if (currentKey === "RAW_MATERIAL_REVALIDATION" && id === 101) return true;
  if (currentKey === "RAW_MATERIAL_PROCESSING" && id === 102) return true;
  return false;
};

const resolveGateFromQcDivisionStatuses = (
  params: {
    stageProgress?: unknown;
    currentStage?: unknown;
    premixStatuses?: unknown;
    finalMixStatuses?: unknown;
    motorStatuses?: unknown;
    candidatePremixNos?: Array<number | string>;
    candidateMotorIds?: string[];
  },
  currentKey: string,
): PreviousStageApprovedUnits | null => {
  const qcStage = findQcStageEntry(params.stageProgress, params.currentStage);
  if (!qcStage) return null;
  const rows = asArray(qcStage.divisionStatuses)
    .map((entry) => asRecord(entry))
    .filter((rec): rec is Record<string, unknown> => Boolean(rec));
  const divisionRow = rows.find((row) => matchDivisionRow(row, currentKey));
  if (!divisionRow) return null;

  const divisionStatus = String(divisionRow.status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  // Division still locked at catalog level — no units available yet.
  // TO_BE_INITIATED means manufacturing already unlocked the division (Premix and/or Final Mix).
  if (divisionStatus === "YET_TO_START" || !divisionStatus) {
    return emptyGate(null, false, "QC division statuses");
  }

  if (currentKey === "RAW_MATERIAL_PROCESSING" || currentKey === "MIXING") {
    const approvedPremixNos = new Set<number>();
    const approvedFinalMixNos = new Set<number>();
    asArray(divisionRow.premixStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const premixNo = premixNoFromRow(rec);
      if (premixNo == null) return;
      if (isUnitUnlockedStatus(premixStatusFromRow(rec))) approvedPremixNos.add(premixNo);
    });
    asArray(divisionRow.finalMixStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const premixNo = premixNoFromRow(rec);
      if (premixNo == null) return;
      if (isUnitUnlockedStatus(premixStatusFromRow(rec))) approvedFinalMixNos.add(premixNo);
    });
    // Also treat PREMIX rows tagged FINAL_MIX in premixStatuses.
    asArray(divisionRow.premixStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const stageType = String(rec.stageType ?? "")
        .trim()
        .toUpperCase();
      if (stageType !== "FINAL_MIX") return;
      const premixNo = premixNoFromRow(rec);
      if (premixNo == null) return;
      if (isUnitUnlockedStatus(premixStatusFromRow(rec))) approvedFinalMixNos.add(premixNo);
    });

    // Form-details unit maps (Mix Navigation) — unlock after manufacturing Mixing approval.
    asArray(params.premixStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const stageType = String(rec.stageType ?? rec.stage_type ?? "")
        .trim()
        .toUpperCase();
      if (stageType === "FINAL_MIX") {
        const premixNo = premixNoFromRow(rec);
        if (premixNo != null && isUnitUnlockedStatus(premixStatusFromRow(rec))) {
          approvedFinalMixNos.add(premixNo);
        }
        return;
      }
      const premixNo = premixNoFromRow(rec);
      if (premixNo != null && isUnitUnlockedStatus(premixStatusFromRow(rec))) {
        approvedPremixNos.add(premixNo);
      }
    });
    asArray(params.finalMixStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const premixNo = premixNoFromRow(rec);
      if (premixNo != null && isUnitUnlockedStatus(premixStatusFromRow(rec))) {
        approvedFinalMixNos.add(premixNo);
      }
    });

    const hasUnitRows =
      asArray(divisionRow.premixStatuses).length > 0 ||
      asArray(divisionRow.finalMixStatuses).length > 0 ||
      asArray(params.premixStatuses).length > 0 ||
      asArray(params.finalMixStatuses).length > 0;
    if (!hasUnitRows) {
      return emptyGate("premix", false, "QC division statuses");
    }

    return {
      enableAll: false,
      kind: "premix",
      previousSubDepartmentId: 11,
      previousSubDepartmentName: "QC divisionStatuses",
      approvedPremixNos,
      approvedFinalMixNos: currentKey === "MIXING" ? approvedFinalMixNos : undefined,
      approvedMotorIds: new Set<string>(),
    };
  }

  if (MOTOR_QC_DIVISIONS.has(currentKey)) {
    const approvedMotorIds = new Set<string>();
    asArray(divisionRow.motorStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const motorId = motorIdFromRow(rec);
      if (!motorId) return;
      if (isUnitUnlockedStatus(motorStatusFromRow(rec))) approvedMotorIds.add(motorId);
    });
    if (asArray(divisionRow.motorStatuses).length === 0) {
      return emptyGate("motor", false, "QC divisionStatuses");
    }
    return {
      enableAll: false,
      kind: "motor",
      previousSubDepartmentId: 11,
      previousSubDepartmentName: "QC divisionStatuses",
      approvedPremixNos: new Set<number>(),
      approvedMotorIds,
    };
  }

  return emptyGate(null, false, "QC divisionStatuses");
};

export const isQcPartialItemEnabledByPreviousDivision = (
  item: QcPartialNavItem | null | undefined,
  gate: PreviousStageApprovedUnits | null | undefined,
): boolean => {
  if (!item) return true;
  if (item.kind === "FINAL_MIX") {
    if (!gate || gate.enableAll) return true;
    if (gate.kind !== "premix") return true;
    const mixNo = Number(item.finalMixNo ?? item.premixNo);
    if (!Number.isFinite(mixNo) || mixNo <= 0) return false;
    // Prefer Final Mix gate from manufacturing Mixing / QC divisionStatuses.
    if (gate.approvedFinalMixNos && gate.approvedFinalMixNos.size > 0) {
      return gate.approvedFinalMixNos.has(mixNo);
    }
    // Empty Final Mix set with an explicit Set means still locked (do not fall back to Premix).
    if (gate.approvedFinalMixNos) return false;
    return gate.approvedPremixNos.has(mixNo);
  }
  if (item.kind === "PREMIX") {
    return isPremixEnabledByPreviousStage(item.premixNo ?? item.finalMixNo, gate);
  }
  if (item.kind === "MOTOR") {
    return isMotorEnabledByPreviousStage(item.motorId, gate);
  }
  return true;
};

export const isQcPartialItemEnabledForWorkflow = (
  item: QcPartialNavItem | null | undefined,
  _items: QcPartialNavItem[],
  gate: PreviousStageApprovedUnits | null | undefined,
): boolean => isQcPartialItemEnabledByPreviousDivision(item, gate);

export const getQcPartialNavTabDisabledReason = (
  item: QcPartialNavItem | undefined,
  _index: number,
  _items: QcPartialNavItem[],
  gate: PreviousStageApprovedUnits | null | undefined,
  messages: {
    previousStage?: string;
    sequential?: string;
  } = {},
): string | undefined => {
  if (!item) return undefined;
  if (isQcPartialItemEnabledByPreviousDivision(item, gate)) return undefined;

  const previousLabel = formatQcDivisionGateLabel(gate?.previousSubDepartmentName);
  const fallback =
    item.kind === "MOTOR"
      ? `This motor was not approved in ${previousLabel} and cannot be filled in QC yet.`
      : item.kind === "FINAL_MIX"
        ? `This final mix was not approved in ${previousLabel} and cannot be filled in QC yet.`
        : `This premix was not approved in ${previousLabel} and cannot be filled in QC yet.`;

  if (messages.previousStage?.includes("{division}")) {
    return messages.previousStage.replace("{division}", previousLabel);
  }

  return messages.previousStage ?? fallback;
};
