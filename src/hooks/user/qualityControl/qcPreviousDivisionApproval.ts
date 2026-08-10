import {
  type PartialFlowUnitKind,
  type PreviousStageApprovedUnits,
  isMotorEnabledByPreviousStage,
  isPremixEnabledByPreviousStage,
} from "../previousStageApproval";
import {
  normalizePartialItemStatus,
  type QcPartialNavItem,
} from "./qcDivisionApprovalUnits";

/** QC premix starter — gates on manufacturing stageProgress. */
const QC_PREMIX_STARTER = "RAW_MATERIAL_PROCESSING";

/** QC motor starter — gates on manufacturing stageProgress. */
const QC_MOTOR_STARTER = "HARDWARE";

/** Premix flow inside QC after the starter. */
const QC_PREMIX_FLOW = ["RAW_MATERIAL_PROCESSING", "MIXING"] as const;

/** Motor flow inside QC after the starter. */
const QC_MOTOR_FLOW = [
  "HARDWARE",
  "CASTING",
  "CURING",
  "DE_CORING",
  "TRIMMING",
  "POST_CURE",
  "NDT",
  "QC",
  "WEIGHTMENT",
] as const;

/** Manufacturing locations that can unlock QC Raw Material Processing premixes. */
const MFG_PREMIX_LOCATION_ORDER = ["MFG_RAW_MATERIAL_PREP", "MFG_MIXING"] as const;

/** Manufacturing / prior locations that can unlock QC Hardware motors. */
const MFG_MOTOR_LOCATION_ORDER = [
  "MFG_CASE_PREPARATION",
  "MFG_CASTING_AND_CURING",
  "MFG_POST_CURE",
  "MFG_TRIMMING",
  "MFG_OR_QC_NDT",
] as const;

const APPROVED_STATUSES = new Set(["APPROVED", "FINAL_APPROVAL_COMPLETED"]);

type StageProgressEntry = {
  subDepartmentId?: number | null;
  subDepartmentName?: string | null;
  status?: string | null;
  premixStatuses?: unknown;
  finalMixStatuses?: unknown;
  motorStatuses?: unknown;
};

type UnitStatusRow = {
  locationKey: string;
  locationLabel: string;
  premixNo?: number;
  motorId?: string;
  status: string;
};

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

const flowIndex = (order: readonly string[], key: string): number =>
  order.findIndex((entry) => entry === key);

const asStageEntries = (stages: unknown): StageProgressEntry[] => {
  if (!Array.isArray(stages)) return [];
  return stages.filter((entry) => entry && typeof entry === "object") as StageProgressEntry[];
};

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

const mapSubDeptToMfgPremixLocation = (
  subDepartmentName: string,
): { key: string; label: string } | null => {
  const name = normalizeNameKey(subDepartmentName);
  if (!name) return null;
  if (name.includes("rawmaterialprep") || name.includes("rawmaterialpreparation")) {
    return { key: "MFG_RAW_MATERIAL_PREP", label: "Raw Material Preparation" };
  }
  if (name === "mixing") {
    return { key: "MFG_MIXING", label: "Mixing" };
  }
  return null;
};

const mapSubDeptToMfgMotorLocation = (
  subDepartmentName: string,
): { key: string; label: string } | null => {
  const name = normalizeNameKey(subDepartmentName);
  if (!name) return null;
  if (name.includes("casepreparation")) {
    return { key: "MFG_CASE_PREPARATION", label: "Case Preparation" };
  }
  if (name.includes("castingandcuring") || name.includes("castingcuring")) {
    return { key: "MFG_CASTING_AND_CURING", label: "Casting and Curing" };
  }
  if (name.includes("postcure")) {
    return { key: "MFG_POST_CURE", label: "Post Cure Operations" };
  }
  if (name === "trimming" || name.includes("trimming")) {
    return { key: "MFG_TRIMMING", label: "Trimming" };
  }
  if (name === "ndt") {
    return { key: "MFG_OR_QC_NDT", label: "NDT" };
  }
  return null;
};

const isQcDivisionStageName = (subDepartmentName: string) => {
  const name = normalizeNameKey(subDepartmentName);
  return name === "qualitycontrol" || name === "qcdivision" || name === "qc";
};

/** Manufacturing premix rows from stageProgress (for QC Processing starter). */
const collectManufacturingPremixRows = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
}): UnitStatusRow[] => {
  const rows: UnitStatusRow[] = [];
  const stages = [
    ...asStageEntries(params.stageProgress),
    ...asStageEntries(params.currentStage),
  ];

  stages.forEach((stage) => {
    const mapped = mapSubDeptToMfgPremixLocation(String(stage.subDepartmentName ?? ""));
    if (!mapped) return;
    asArray(stage.premixStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const premixNo = pickNumber(rec.premixNo, rec.premix_no);
      if (premixNo == null) return;
      const stageType = String(rec.stageType ?? rec.stage_type ?? "")
        .trim()
        .toUpperCase();
      if (stageType === "FINAL_MIX") return;
      rows.push({
        locationKey: mapped.key,
        locationLabel: mapped.label,
        premixNo,
        status: String(
          rec.premixSubmissionStatus ?? rec.premix_submission_status ?? rec.status ?? "",
        ),
      });
    });
  });

  return rows;
};

/** Manufacturing motor rows from stageProgress (for QC Hardware starter). */
const collectManufacturingMotorRows = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
}): UnitStatusRow[] => {
  const rows: UnitStatusRow[] = [];
  const stages = [
    ...asStageEntries(params.stageProgress),
    ...asStageEntries(params.currentStage),
  ];

  stages.forEach((stage) => {
    const mapped = mapSubDeptToMfgMotorLocation(String(stage.subDepartmentName ?? ""));
    if (!mapped) return;
    asArray(stage.motorStatuses).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const motorId = pickString(rec.motorId, rec.motor_id, rec.motorIdNo);
      if (!motorId) return;
      rows.push({
        locationKey: mapped.key,
        locationLabel: mapped.label,
        motorId,
        status: String(
          rec.motorSubmissionStatus ?? rec.motor_submission_status ?? rec.status ?? "",
        ),
      });
    });
  });

  return rows;
};

/**
 * QC-only premix rows (division-scoped). Used after Processing starter.
 * Sources: QC stage in stageProgress + live form premixStatuses.
 */
const collectQcPremixRows = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
  premixStatuses?: unknown;
}): UnitStatusRow[] => {
  const rows: UnitStatusRow[] = [];

  const pushRows = (source: unknown) => {
    asArray(source).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const premixNo = pickNumber(rec.premixNo, rec.premix_no);
      if (premixNo == null) return;
      const stageType = String(rec.stageType ?? rec.stage_type ?? "")
        .trim()
        .toUpperCase();
      if (stageType === "FINAL_MIX") return;
      const divisionKey = normalizeQcDivisionKey(
        rec.division ?? rec.divisionName ?? rec.division_name,
      );
      if (!divisionKey || flowIndex(QC_PREMIX_FLOW, divisionKey) < 0) return;
      rows.push({
        locationKey: divisionKey,
        locationLabel: formatQcDivisionGateLabel(divisionKey),
        premixNo,
        status: String(
          rec.premixSubmissionStatus ?? rec.premix_submission_status ?? rec.status ?? "",
        ),
      });
    });
  };

  const stages = [
    ...asStageEntries(params.stageProgress),
    ...asStageEntries(params.currentStage),
  ];
  stages.forEach((stage) => {
    if (!isQcDivisionStageName(String(stage.subDepartmentName ?? ""))) return;
    pushRows(stage.premixStatuses);
  });
  pushRows(params.premixStatuses);

  return rows;
};

/** QC-only motor rows (division-scoped). Used after Hardware starter. */
const collectQcMotorRows = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
  motorStatuses?: unknown;
}): UnitStatusRow[] => {
  const rows: UnitStatusRow[] = [];

  const pushRows = (source: unknown) => {
    asArray(source).forEach((entry) => {
      const rec = asRecord(entry);
      if (!rec) return;
      const motorId = pickString(rec.motorId, rec.motor_id, rec.motorIdNo);
      if (!motorId) return;
      const divisionKey = normalizeQcDivisionKey(
        rec.division ?? rec.divisionName ?? rec.division_name,
      );
      if (!divisionKey || flowIndex(QC_MOTOR_FLOW, divisionKey) < 0) return;
      rows.push({
        locationKey: divisionKey,
        locationLabel: formatQcDivisionGateLabel(divisionKey),
        motorId,
        status: String(
          rec.motorSubmissionStatus ?? rec.motor_submission_status ?? rec.status ?? "",
        ),
      });
    });
  };

  const stages = [
    ...asStageEntries(params.stageProgress),
    ...asStageEntries(params.currentStage),
  ];
  stages.forEach((stage) => {
    if (!isQcDivisionStageName(String(stage.subDepartmentName ?? ""))) return;
    pushRows(stage.motorStatuses);
  });
  pushRows(params.motorStatuses);

  return rows;
};

const findLastUsedPrior = (
  rows: UnitStatusRow[],
  flowOrder: readonly string[],
  currentKey: string,
  matchRow: (row: UnitStatusRow) => boolean,
): { approved: boolean; lastLocationKey: string | null } => {
  const currentIdx = flowIndex(flowOrder, currentKey);
  if (currentIdx < 0) {
    return { approved: true, lastLocationKey: null };
  }

  let bestIdx = -1;
  let bestRow: UnitStatusRow | null = null;

  rows.forEach((row) => {
    if (!matchRow(row)) return;
    const idx = flowIndex(flowOrder, row.locationKey);
    if (idx < 0 || idx >= currentIdx) return;
    if (idx >= bestIdx) {
      bestIdx = idx;
      bestRow = row;
    }
  });

  if (!bestRow || bestIdx < 0) {
    return { approved: false, lastLocationKey: null };
  }

  return {
    approved: isApprovedStatus(bestRow.status),
    lastLocationKey: bestRow.locationKey,
  };
};

/** Collect units approved in an exact prior QC division (not manufacturing). */
const collectApprovedFromExactDivision = (
  rows: UnitStatusRow[],
  priorDivisionKey: string,
  kind: "premix" | "motor",
): { approvedPremixNos: Set<number>; approvedMotorIds: Set<string> } => {
  const approvedPremixNos = new Set<number>();
  const approvedMotorIds = new Set<string>();
  rows.forEach((row) => {
    if (row.locationKey !== priorDivisionKey) return;
    if (!isApprovedStatus(row.status)) return;
    if (kind === "premix" && row.premixNo != null) approvedPremixNos.add(row.premixNo);
    if (kind === "motor" && row.motorId) approvedMotorIds.add(row.motorId);
  });
  return { approvedPremixNos, approvedMotorIds };
};

/**
 * Resolve which premixes/motors the current QC division may edit.
 *
 * Starters (check manufacturing stageProgress):
 * - Premix: Raw Material Processing ← last manufacturing premix use (e.g. Mixing)
 * - Motor: Hardware ← last manufacturing motor use (e.g. NDT / Trimming)
 *
 * Later QC divisions (compare within QC only):
 * - Mixing ← only premixes Approved in QC Raw Material Processing
 * - Casting ← only motors Approved in QC Hardware
 * - …and so on along the QC division chain
 */
export const resolveQcPreviousDivisionApprovedUnits = (params: {
  currentDivisionKey: string;
  stageProgress?: unknown;
  currentStage?: unknown;
  premixStatuses?: unknown;
  motorStatuses?: unknown;
  candidatePremixNos?: Array<number | string>;
  candidateMotorIds?: string[];
}): PreviousStageApprovedUnits => {
  const currentKey = normalizeQcDivisionKey(params.currentDivisionKey);
  if (!currentKey || currentKey === "RAW_MATERIAL_REVALIDATION") {
    return emptyGate(null, true);
  }

  // ── Premix starter: QC Raw Material Processing ← manufacturing stageProgress ──
  if (currentKey === QC_PREMIX_STARTER) {
    const mfgRows = collectManufacturingPremixRows({
      stageProgress: params.stageProgress,
      currentStage: params.currentStage,
    });

    const candidates = new Set<number>();
    (params.candidatePremixNos ?? []).forEach((no) => {
      const n = Number(no);
      if (Number.isFinite(n) && n > 0) candidates.add(n);
    });
    mfgRows.forEach((row) => {
      if (row.premixNo != null) candidates.add(row.premixNo);
    });

    if (!candidates.size && !mfgRows.length) {
      // No manufacturing premix history yet — keep Processing unlocked.
      return emptyGate("premix", true, "MFG_MIXING");
    }

    // Virtual current key after manufacturing locations so last-used is within MFG only.
    const mfgCurrentKey = "__QC_PREMIX_STARTER__";
    const mfgOrder = [...MFG_PREMIX_LOCATION_ORDER, mfgCurrentKey] as const;
    const approvedPremixNos = new Set<number>();
    let lastDivisionName: string | null = "MFG_MIXING";

    candidates.forEach((premixNo) => {
      const result = findLastUsedPrior(
        mfgRows,
        mfgOrder,
        mfgCurrentKey,
        (row) => row.premixNo === premixNo,
      );
      if (result.approved) approvedPremixNos.add(premixNo);
      if (result.lastLocationKey) lastDivisionName = result.lastLocationKey;
    });

    return {
      enableAll: false,
      kind: "premix",
      previousSubDepartmentId: null,
      previousSubDepartmentName: lastDivisionName,
      approvedPremixNos,
      approvedMotorIds: new Set(),
    };
  }

  // ── Motor starter: QC Hardware ← manufacturing stageProgress ──
  if (currentKey === QC_MOTOR_STARTER) {
    const mfgRows = collectManufacturingMotorRows({
      stageProgress: params.stageProgress,
      currentStage: params.currentStage,
    });

    const candidates = new Set<string>();
    (params.candidateMotorIds ?? []).forEach((id) => {
      const motorId = String(id ?? "").trim();
      if (motorId) candidates.add(motorId);
    });
    mfgRows.forEach((row) => {
      if (row.motorId) candidates.add(row.motorId);
    });

    if (!candidates.size && !mfgRows.length) {
      return emptyGate("motor", true, "MFG_OR_QC_NDT");
    }

    const mfgCurrentKey = "__QC_MOTOR_STARTER__";
    const mfgOrder = [...MFG_MOTOR_LOCATION_ORDER, mfgCurrentKey] as const;
    const approvedMotorIds = new Set<string>();
    let lastDivisionName: string | null = "MFG_OR_QC_NDT";

    candidates.forEach((motorId) => {
      const result = findLastUsedPrior(
        mfgRows,
        mfgOrder,
        mfgCurrentKey,
        (row) => row.motorId === motorId,
      );
      if (result.approved) approvedMotorIds.add(motorId);
      if (result.lastLocationKey) lastDivisionName = result.lastLocationKey;
    });

    return {
      enableAll: false,
      kind: "motor",
      previousSubDepartmentId: null,
      previousSubDepartmentName: lastDivisionName,
      approvedPremixNos: new Set(),
      approvedMotorIds,
    };
  }

  // ── Later QC premix (e.g. Mixing): only prior QC division approvals ──
  const qcPremixIdx = flowIndex(QC_PREMIX_FLOW, currentKey);
  if (qcPremixIdx > 0) {
    const priorKey = QC_PREMIX_FLOW[qcPremixIdx - 1];
    const qcRows = collectQcPremixRows({
      stageProgress: params.stageProgress,
      currentStage: params.currentStage,
      premixStatuses: params.premixStatuses,
    });
    const { approvedPremixNos } = collectApprovedFromExactDivision(
      qcRows,
      priorKey,
      "premix",
    );

    return {
      enableAll: false,
      kind: "premix",
      previousSubDepartmentId: null,
      previousSubDepartmentName: priorKey,
      approvedPremixNos,
      approvedMotorIds: new Set(),
    };
  }

  // ── Later QC motor (Casting+): only prior QC division approvals ──
  const qcMotorIdx = flowIndex(QC_MOTOR_FLOW, currentKey);
  if (qcMotorIdx > 0) {
    const priorKey = QC_MOTOR_FLOW[qcMotorIdx - 1];
    const qcRows = collectQcMotorRows({
      stageProgress: params.stageProgress,
      currentStage: params.currentStage,
      motorStatuses: params.motorStatuses,
    });
    const { approvedMotorIds } = collectApprovedFromExactDivision(
      qcRows,
      priorKey,
      "motor",
    );

    return {
      enableAll: false,
      kind: "motor",
      previousSubDepartmentId: null,
      previousSubDepartmentName: priorKey,
      approvedPremixNos: new Set(),
      approvedMotorIds,
    };
  }

  return emptyGate(null, true);
};

export const isQcPartialItemEnabledByPreviousDivision = (
  item: QcPartialNavItem | null | undefined,
  gate: PreviousStageApprovedUnits | null | undefined,
): boolean => {
  if (!item) return true;
  if (item.kind === "PREMIX" || item.kind === "FINAL_MIX") {
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
  return messages.previousStage;
};
