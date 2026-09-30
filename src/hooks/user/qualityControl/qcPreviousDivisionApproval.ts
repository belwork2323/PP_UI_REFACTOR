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

const isApprovedStatus = (status: unknown): boolean => {
  const normalized = normalizePartialItemStatus(status);
  if (normalized === "APPROVED") return true;
  const upper = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return APPROVED_STATUSES.has(upper);
};

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
  return sub === "rawmaterialpreparation" || sub === "rawmaterialprep" || sub.includes("rawmaterialprep");
};

const isNdtStage = (stage: StageProgressEntry): boolean =>
  normalizeNameKey(stage.subDepartmentName) === "ndt";

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

/** Premix QC for Mixing: previous subdepartment is Mixing manufacturing. */
const resolvePreviousSubDepartmentPremixGate = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
}): PreviousStageApprovedUnits => {
  const stages = mergeStageProgress(params.stageProgress, params.currentStage);
  const mixing = findRequiredStage(stages, isMixingStage);
  return gateFromPredecessor(
    "premix",
    mixing,
    {
      approvedPremixNos: collectApprovedPremixNos(mixing, false),
      approvedMotorIds: new Set(),
      approvedFinalMixNos: collectApprovedPremixNos(mixing, true),
    },
    "Mixing",
  );
};

/** Raw Material Processing QC: previous subdepartment is Raw Material Preparation. */
const resolvePreviousSubDepartmentRmpProcessingGate = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
}): PreviousStageApprovedUnits => {
  const stages = mergeStageProgress(params.stageProgress, params.currentStage);
  const rmp = findRequiredStage(stages, isRawMaterialPrepStage);
  return gateFromPredecessor(
    "premix",
    rmp,
    {
      approvedPremixNos: collectApprovedPremixNos(rmp, false),
      approvedMotorIds: new Set(),
    },
    "Raw Material Preparation",
  );
};

/** Motors: previous subdepartment is NDT only (Case Preparation is the starter). */
const resolvePreviousSubDepartmentMotorGate = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
}): PreviousStageApprovedUnits => {
  const stages = mergeStageProgress(params.stageProgress, params.currentStage);
  const ndt = findRequiredStage(stages, isNdtStage);
  return gateFromPredecessor(
    "motor",
    ndt,
    {
      approvedPremixNos: new Set(),
      approvedMotorIds: collectApprovedMotorIds(ndt),
    },
    "NDT",
  );
};

/**
 * QC unit tabs: prefer locks from QC stageProgress.divisionStatuses unit lists.
 * Fallback: legacy manufacturing previous-stage gate for older batches without unit rows.
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

  const fromDivisionStatuses = resolveGateFromQcDivisionStatuses(params, currentKey);
  if (fromDivisionStatuses) {
    return fromDivisionStatuses;
  }

  if (currentKey === "RAW_MATERIAL_PROCESSING") {
    return resolvePreviousSubDepartmentRmpProcessingGate(params);
  }

  if (currentKey === "MIXING") {
    return resolvePreviousSubDepartmentPremixGate(params);
  }

  if (MOTOR_QC_DIVISIONS.has(currentKey)) {
    return resolvePreviousSubDepartmentMotorGate(params);
  }

  return emptyGate(null, true);
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

const isUnitUnlockedStatus = (status: unknown): boolean => {
  const upper = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return upper !== "" && upper !== "YET_TO_START";
};

const resolveGateFromQcDivisionStatuses = (
  params: {
    stageProgress?: unknown;
    currentStage?: unknown;
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
  if (divisionStatus === "YET_TO_START") {
    return emptyGate("QC divisionStatuses", false);
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

    const hasUnitRows =
      asArray(divisionRow.premixStatuses).length > 0 ||
      asArray(divisionRow.finalMixStatuses).length > 0;
    if (!hasUnitRows) {
      return emptyGate("QC divisionStatuses", true);
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
      return emptyGate("QC divisionStatuses", true);
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

  return emptyGate("QC divisionStatuses", true);
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
    if (gate.approvedFinalMixNos) return gate.approvedFinalMixNos.has(mixNo);
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
      : `This premix was not approved in ${previousLabel} and cannot be filled in QC yet.`;

  if (messages.previousStage?.includes("{division}")) {
    return messages.previousStage.replace("{division}", previousLabel);
  }

  return messages.previousStage ?? fallback;
};
