import {
  normalizePartialItemStatus,
  type QcPartialItemStatus,
} from "./qcDivisionApprovalUnits";
import {
  formatQcDivisionGateLabel,
  normalizeQcDivisionKey,
} from "./qcPreviousDivisionApproval";
import type { QcDivisionCatalogNavTab } from "./qcFlowConfig";

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

const isQcDivisionStageName = (subDepartmentName: string) => {
  const name = normalizeNameKey(subDepartmentName);
  return name === "qualitycontrol" || name === "qcdivision" || name === "qc";
};

type StageProgressEntry = {
  subDepartmentName?: string | null;
  premixStatuses?: unknown;
  finalMixStatuses?: unknown;
  motorStatuses?: unknown;
};

const asStageEntries = (stages: unknown): StageProgressEntry[] => {
  if (!Array.isArray(stages)) return [];
  return stages.filter((entry) => entry && typeof entry === "object") as StageProgressEntry[];
};

/** Canonical gate key for a catalog nav tab. */
export const resolveNavTabGateKey = (tab: QcDivisionCatalogNavTab): string => {
  const rawType = normalizeQcDivisionKey(tab.rawMaterialType);
  if (rawType === "RAW_MATERIAL_REVALIDATION" || rawType === "RAW_MATERIAL_PROCESSING") {
    return rawType;
  }
  const flow = normalizeQcDivisionKey(tab.flowKey);
  if (flow === "RAW_MATERIAL") {
    return rawType === "RAW_MATERIAL_REVALIDATION"
      ? "RAW_MATERIAL_REVALIDATION"
      : "RAW_MATERIAL_PROCESSING";
  }
  return flow || normalizeQcDivisionKey(tab.tabKey);
};

const resolveStatusForGateKey = (
  gateKey: string,
  statusByTabKey: Record<string, QcPartialItemStatus | string>,
  tabs: QcDivisionCatalogNavTab[],
): QcPartialItemStatus => {
  const direct = statusByTabKey[gateKey];
  if (direct) return normalizePartialItemStatus(direct);

  const tab = tabs.find((entry) => resolveNavTabGateKey(entry) === gateKey);
  if (tab) {
    const byTab =
      statusByTabKey[tab.tabKey] ??
      statusByTabKey[tab.rawMaterialType] ??
      statusByTabKey[tab.flowKey];
    if (byTab) return normalizePartialItemStatus(byTab);
  }

  return "TO_BE_INITIATED";
};

type QcUnitStatusMaps = {
  premixByDivision: Map<string, Map<number, string>>;
  finalMixByDivision: Map<string, Map<number, string>>;
  motorByDivision: Map<string, Map<string, string>>;
};

const ensureNestedMap = <K, V>(root: Map<string, Map<K, V>>, division: string): Map<K, V> => {
  const existing = root.get(division);
  if (existing) return existing;
  const created = new Map<K, V>();
  root.set(division, created);
  return created;
};

const ingestPremixRows = (
  source: unknown,
  maps: QcUnitStatusMaps,
  options?: { forceDivision?: string; asFinalMix?: boolean },
) => {
  asArray(source).forEach((entry) => {
    const rec = asRecord(entry);
    if (!rec) return;
    const premixNo = pickNumber(rec.premixNo, rec.premix_no);
    if (premixNo == null) return;
    const stageType = String(rec.stageType ?? rec.stage_type ?? "")
      .trim()
      .toUpperCase();
    const division =
      normalizeQcDivisionKey(options?.forceDivision) ||
      normalizeQcDivisionKey(rec.division ?? rec.divisionName ?? rec.division_name);
    if (!division) return;
    const status = String(
      rec.premixSubmissionStatus ?? rec.premix_submission_status ?? rec.status ?? "",
    );
    const isFinal = Boolean(options?.asFinalMix) || stageType === "FINAL_MIX";
    if (isFinal) {
      ensureNestedMap(maps.finalMixByDivision, division).set(premixNo, status);
    } else {
      ensureNestedMap(maps.premixByDivision, division).set(premixNo, status);
    }
  });
};

const ingestMotorRows = (
  source: unknown,
  maps: QcUnitStatusMaps,
  options?: { forceDivision?: string },
) => {
  asArray(source).forEach((entry) => {
    const rec = asRecord(entry);
    if (!rec) return;
    const motorId = pickString(rec.motorId, rec.motor_id, rec.motorIdNo);
    if (!motorId) return;
    const division =
      normalizeQcDivisionKey(options?.forceDivision) ||
      normalizeQcDivisionKey(rec.division ?? rec.divisionName ?? rec.division_name);
    if (!division) return;
    const status = String(
      rec.motorSubmissionStatus ?? rec.motor_submission_status ?? rec.status ?? "",
    );
    ensureNestedMap(maps.motorByDivision, division).set(motorId, status);
  });
};

/**
 * Build QC unit status maps from stageProgress QC stage + live form unit statuses.
 */
export const buildQcUnitStatusMaps = (params: {
  stageProgress?: unknown;
  currentStage?: unknown;
  premixStatuses?: unknown;
  motorStatuses?: unknown;
}): QcUnitStatusMaps => {
  const maps: QcUnitStatusMaps = {
    premixByDivision: new Map(),
    finalMixByDivision: new Map(),
    motorByDivision: new Map(),
  };

  const stages = [
    ...asStageEntries(params.stageProgress),
    ...asStageEntries(params.currentStage),
  ];

  stages.forEach((stage) => {
    if (!isQcDivisionStageName(String(stage.subDepartmentName ?? ""))) return;
    ingestPremixRows(stage.premixStatuses, maps);
    ingestPremixRows(stage.finalMixStatuses, maps, { asFinalMix: true });
    ingestMotorRows(stage.motorStatuses, maps);
  });

  ingestPremixRows(params.premixStatuses, maps);
  ingestMotorRows(params.motorStatuses, maps);

  return maps;
};

const hasAnyApprovedPremix = (maps: QcUnitStatusMaps, divisionKey: string): boolean => {
  const rows = maps.premixByDivision.get(normalizeQcDivisionKey(divisionKey));
  if (!rows) return false;
  for (const status of rows.values()) {
    if (isApprovedStatus(status)) return true;
  }
  return false;
};

const hasAnyApprovedMotor = (maps: QcUnitStatusMaps, divisionKey: string): boolean => {
  const rows = maps.motorByDivision.get(normalizeQcDivisionKey(divisionKey));
  if (!rows) return false;
  for (const status of rows.values()) {
    if (isApprovedStatus(status)) return true;
  }
  return false;
};

/**
 * Mixing unlocks the next division only when at least one premixNo has
 * both Premix and matching Final Mix Approved.
 */
const hasApprovedMixingPremixFinalPair = (maps: QcUnitStatusMaps): boolean => {
  const premixes = maps.premixByDivision.get("MIXING");
  const finalMixes = maps.finalMixByDivision.get("MIXING");
  if (!premixes?.size || !finalMixes?.size) return false;

  for (const [premixNo, premixStatus] of premixes.entries()) {
    if (!isApprovedStatus(premixStatus)) continue;
    const finalStatus = finalMixes.get(premixNo);
    if (isApprovedStatus(finalStatus)) return true;
  }
  return false;
};

const listApprovedMixingPairs = (maps: QcUnitStatusMaps): number[] => {
  const premixes = maps.premixByDivision.get("MIXING");
  const finalMixes = maps.finalMixByDivision.get("MIXING");
  if (!premixes?.size || !finalMixes?.size) return [];
  const pairs: number[] = [];
  for (const [premixNo, premixStatus] of premixes.entries()) {
    if (!isApprovedStatus(premixStatus)) continue;
    if (isApprovedStatus(finalMixes.get(premixNo))) pairs.push(premixNo);
  }
  return pairs.sort((a, b) => a - b);
};

export type QcDivisionNavGateMessages = {
  /** Approve {previous} to enable {current}. */
  approveDivision?: string;
  /** Approve at least one premix in {previous} to enable {current}. */
  approveAnyPremix?: string;
  /** Approve at least one motor in {previous} to enable {current}. */
  approveAnyMotor?: string;
  /** Approve a premix and its matching final mix in Mixing to enable {current}. */
  approveMixingPair?: string;
};

const fillTemplate = (
  template: string | undefined,
  vars: Record<string, string>,
  fallback: string,
): string => {
  if (!template) return fallback;
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    template,
  );
};

/**
 * Whether a QC division tab may be opened, and why not if disabled.
 *
 * Rules:
 * 1. First catalog tab (usually Raw Material Revalidation) — always enabled.
 * 2. Raw Material Processing — prior Revalidation division must be Approved.
 * 3. Later divisions — prior division unlocks via unit-level partial approval:
 *    - After Processing: any approved premix unlocks Mixing
 *    - After Mixing: need Premix N + Final Mix N both Approved to unlock Hardware
 *    - After Hardware+: any approved motor unlocks the next motor division
 */
export const resolveQcDivisionNavTabGate = (params: {
  tab: QcDivisionCatalogNavTab;
  tabIndex: number;
  tabs: QcDivisionCatalogNavTab[];
  statusByTabKey: Record<string, QcPartialItemStatus | string>;
  unitMaps: QcUnitStatusMaps;
  messages?: QcDivisionNavGateMessages;
}): { enabled: boolean; reason?: string } => {
  const { tab, tabIndex, tabs, statusByTabKey, unitMaps, messages = {} } = params;
  if (tabIndex <= 0) return { enabled: true };

  const currentKey = resolveNavTabGateKey(tab);
  const previousTab = tabs[tabIndex - 1];
  if (!previousTab) return { enabled: true };

  const previousKey = resolveNavTabGateKey(previousTab);
  const previousLabel = previousTab.label || formatQcDivisionGateLabel(previousKey);
  const currentLabel = tab.label || formatQcDivisionGateLabel(currentKey);

  // Processing unlocks only when Revalidation (full division) is Approved.
  if (currentKey === "RAW_MATERIAL_PROCESSING") {
    const previousStatus = resolveStatusForGateKey(previousKey, statusByTabKey, tabs);
    if (previousStatus === "APPROVED") return { enabled: true };
    return {
      enabled: false,
      reason: fillTemplate(
        messages.approveDivision,
        { previous: previousLabel, current: currentLabel },
        `Approve ${previousLabel} to enable ${currentLabel}.`,
      ),
    };
  }

  // Hardware unlocks only when Mixing has at least one Premix N + Final Mix N pair Approved.
  if (previousKey === "MIXING") {
    if (hasApprovedMixingPremixFinalPair(unitMaps)) return { enabled: true };
    const pairs = listApprovedMixingPairs(unitMaps);
    return {
      enabled: false,
      reason: fillTemplate(
        messages.approveMixingPair,
        {
          previous: previousLabel,
          current: currentLabel,
          pairs: pairs.length ? pairs.map((n) => String(n)).join(", ") : "",
        },
        `Approve a premix and its matching final mix in ${previousLabel} to enable ${currentLabel}.`,
      ),
    };
  }

  // Premix-based prior division (Processing → Mixing): any approved premix unlocks.
  if (previousKey === "RAW_MATERIAL_PROCESSING") {
    if (hasAnyApprovedPremix(unitMaps, previousKey)) return { enabled: true };
    return {
      enabled: false,
      reason: fillTemplate(
        messages.approveAnyPremix,
        { previous: previousLabel, current: currentLabel },
        `Approve at least one premix in ${previousLabel} to enable ${currentLabel}.`,
      ),
    };
  }

  // Motor-based prior division: any approved motor unlocks next.
  if (hasAnyApprovedMotor(unitMaps, previousKey)) return { enabled: true };

  // Fallback: if prior division itself is fully Approved (no unit rows yet), allow.
  const previousStatus = resolveStatusForGateKey(previousKey, statusByTabKey, tabs);
  if (previousStatus === "APPROVED") return { enabled: true };

  return {
    enabled: false,
    reason: fillTemplate(
      messages.approveAnyMotor,
      { previous: previousLabel, current: currentLabel },
      `Approve at least one motor in ${previousLabel} to enable ${currentLabel}.`,
    ),
  };
};

export const buildQcDivisionNavGateHelpers = (params: {
  tabs: QcDivisionCatalogNavTab[];
  statusByTabKey: Record<string, QcPartialItemStatus | string>;
  stageProgress?: unknown;
  currentStage?: unknown;
  premixStatuses?: unknown;
  motorStatuses?: unknown;
  messages?: QcDivisionNavGateMessages;
}) => {
  const unitMaps = buildQcUnitStatusMaps({
    stageProgress: params.stageProgress,
    currentStage: params.currentStage,
    premixStatuses: params.premixStatuses,
    motorStatuses: params.motorStatuses,
  });

  const gateByTabKey = new Map<string, { enabled: boolean; reason?: string }>();
  params.tabs.forEach((tab, index) => {
    gateByTabKey.set(
      tab.tabKey,
      resolveQcDivisionNavTabGate({
        tab,
        tabIndex: index,
        tabs: params.tabs,
        statusByTabKey: params.statusByTabKey,
        unitMaps,
        messages: params.messages,
      }),
    );
  });

  return {
    isDivisionTabEnabled: (tabKey: string) =>
      gateByTabKey.get(tabKey)?.enabled ?? true,
    getDivisionTabDisabledReason: (tabKey: string) =>
      gateByTabKey.get(tabKey)?.reason,
  };
};
