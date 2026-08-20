import { OPERATION_STATUS } from "../../operationStatus";
import {
  buildDivisionApprovalRows,
  buildFinalApprovalDivisionGroups,
  buildFinalApprovalRows,
  type QcApprovalTableRow,
  type QcFinalApprovalDivisionGroup,
  type QcPartialItemStatus,
  type QcPartialNavItem,
} from "../../user/qualityControl/qcDivisionApprovalUnits";
import {
  groupUnitStatusesByDivisionTabKey,
  resolveUnitStatusTabKey,
  extractWeighmentMotorNavFromFormDetails,
  mergePartialNavItems,
} from "../../user/qualityControl/qcDivisionDataSource";

const normalizeStatusKey = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const toPartialStatus = (value: unknown): QcPartialItemStatus => {
  const raw = normalizeStatusKey(value);
  if (
    raw === "IN_PROGRESS" ||
    raw === "WAITING_FOR_APPROVAL" ||
    raw === "APPROVED" ||
    raw === "REJECTED" ||
    raw === "TO_BE_INITIATED"
  ) {
    return raw;
  }
  if (raw.includes("PARTIAL") || raw === "WAITING_FOR_PARTIAL_APPROVAL") {
    return "WAITING_FOR_APPROVAL";
  }
  return "TO_BE_INITIATED";
};

export const isQcPartialItemApproverTabDisabled = (
  status?: QcPartialItemStatus | string | null,
): boolean => {
  const normalized = normalizeStatusKey(status);
  return !normalized || normalized === "TO_BE_INITIATED";
};

export const isQcPartialItemApproverActionable = (
  status?: QcPartialItemStatus | string | null,
): boolean => normalizeStatusKey(status) === "WAITING_FOR_APPROVAL";

export const canApproverActionEntireQcDivisionForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  divisionStatusByFlowKey?: Record<string, QcPartialItemStatus>;
}): boolean => {
  const formType = String(params.formSubmissionType ?? "")
    .trim()
    .toUpperCase();
  if (formType && formType !== "SUBMIT") return false;

  const status = String(params.status ?? "").trim();
  const statusUpper = normalizeStatusKey(status);

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

  const isCompleteApproval =
    statusUpper === "WAITING_FOR_COMPLETE_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL;

  if (!isCompleteApproval) return false;

  const divisionMap = params.divisionStatusByFlowKey ?? {};
  const divisionStatuses = Object.values(divisionMap);
  if (divisionStatuses.length === 0) return true;
  return divisionStatuses.every((entry) => entry === "APPROVED");
};

export const resolveInitialApproverPartialNavIndex = (
  items: QcPartialNavItem[],
): number => {
  const waitingIndex = items.findIndex((item) => isQcPartialItemApproverActionable(item.status));
  if (waitingIndex >= 0) return waitingIndex;

  const viewableIndex = items.findIndex(
    (item) => !isQcPartialItemApproverTabDisabled(item.status),
  );
  return viewableIndex >= 0 ? viewableIndex : 0;
};

const formatQcApproverDivisionLabel = (key: string): string => {
  const normalized = String(key ?? "").trim().toUpperCase();
  const labels: Record<string, string> = {
    RAW_MATERIAL_REVALIDATION: "Raw Material Revalidation",
    RAW_MATERIAL_PROCESSING: "Raw Material Processing",
    RAW_MATERIAL: "Raw Material",
    MIXING: "Mixing",
    HARDWARE: "Hardware",
    CASTING: "Casting",
    CURING: "Curing",
    DE_CORING: "De-coring",
    TRIMMING: "Trimming",
    POST_CURE: "Post Cure",
    POST_CURE_OPERATION: "Post Cure",
    NDT: "NDT",
    QC: "QC",
    PROPELLANT_PROPERTIES: "QC",
    WEIGHTMENT: "Weighment",
    WEIGHMENT: "Weighment",
    STATIC_TEST_FACILITY: "Static Test Facility",
  };
  if (labels[normalized]) return labels[normalized];
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

export type QcApproverPartialState = {
  partialNavByDivision: Record<string, QcPartialNavItem[]>;
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>;
  formSubmissionType: string;
  status: string;
};

export const buildQcApproverPartialState = (
  detailsPayload: Record<string, unknown> | null | undefined,
): QcApproverPartialState => {
  const root = detailsPayload ?? {};
  const motorStatuses = root.motorStatuses;
  const premixStatuses = root.premixStatuses;
  const divisionStatuses = Array.isArray(root.divisionStatuses) ? root.divisionStatuses : [];

  const divisionStatusByFlowKey: Record<string, QcPartialItemStatus> = {};
  divisionStatuses.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const rec = entry as Record<string, unknown>;
    const key =
      resolveUnitStatusTabKey({
        division: String(rec.division ?? ""),
        subType: String(rec.subType ?? ""),
      }) || String(rec.division ?? "").trim().toUpperCase();
    if (!key) return;
    divisionStatusByFlowKey[key] = toPartialStatus(rec.status);
  });

  // Unit chips from motorStatuses / premixStatuses; Weighment also from divisionDetails.motorWeightDetails.
  const unitsByTabKey = groupUnitStatusesByDivisionTabKey({
    premixStatuses,
    motorStatuses,
  });
  const weighmentMotors = extractWeighmentMotorNavFromFormDetails(root);
  if (weighmentMotors.length) {
    unitsByTabKey.WEIGHTMENT = mergePartialNavItems(
      unitsByTabKey.WEIGHTMENT ?? [],
      weighmentMotors,
    );
  }

  const partialNavByDivision: Record<string, QcPartialNavItem[]> = {};
  const allKeys = new Set<string>([
    ...Object.keys(divisionStatusByFlowKey),
    ...Object.keys(unitsByTabKey),
  ]);

  allKeys.forEach((key) => {
    const normalized = String(key).trim().toUpperCase();
    if (!normalized) return;
    // Skip alias / parent keys that are not primary tab keys.
    if (
      normalized === "PROPELLANT_PROPERTIES" ||
      normalized === "POST_CURE_OPERATION" ||
      normalized === "RAW_MATERIAL" ||
      normalized === "WEIGHMENT"
    ) {
      return;
    }
    const units = (unitsByTabKey[normalized] ?? []).filter(
      (item) =>
        item.kind === "PREMIX" ||
        item.kind === "FINAL_MIX" ||
        item.kind === "MOTOR" ||
        item.kind === "DIVISION",
    );
    // Revalidation with no unit chips: expose a division unit for approve/reject.
    if (!units.length && normalized === "RAW_MATERIAL_REVALIDATION") {
      const divisionStatus = divisionStatusByFlowKey[normalized];
      if (divisionStatus && divisionStatus !== "TO_BE_INITIATED") {
        units.push({
          id: `division:${normalized}`,
          kind: "DIVISION",
          label: formatQcApproverDivisionLabel(normalized),
          status: divisionStatus,
        });
      }
    }
    partialNavByDivision[normalized] = units;
    if (!(normalized in divisionStatusByFlowKey)) {
      // Infer division status from units when divisionStatuses omitted the key.
      const units = partialNavByDivision[normalized];
      if (units.some((unit) => unit.status === "REJECTED")) {
        divisionStatusByFlowKey[normalized] = "REJECTED";
      } else if (units.some((unit) => unit.status === "WAITING_FOR_APPROVAL")) {
        divisionStatusByFlowKey[normalized] = "WAITING_FOR_APPROVAL";
      } else if (units.some((unit) => unit.status === "IN_PROGRESS")) {
        divisionStatusByFlowKey[normalized] = "IN_PROGRESS";
      } else if (units.length > 0 && units.every((unit) => unit.status === "APPROVED")) {
        divisionStatusByFlowKey[normalized] = "APPROVED";
      } else {
        divisionStatusByFlowKey[normalized] = "TO_BE_INITIATED";
      }
    }
  });

  return {
    partialNavByDivision,
    divisionStatusByFlowKey,
    formSubmissionType: String(root.formSubmissionType ?? ""),
    status: String(
      (root as { batchStatus?: string }).batchStatus ??
        root.status ??
        (root as { formStatus?: string }).formStatus ??
        "",
    ),
  };
};

export const buildQcApproverDivisionRows = (
  items: QcPartialNavItem[],
  divisionLabel: string,
): QcApprovalTableRow[] => buildDivisionApprovalRows(items, divisionLabel);

const QC_APPROVER_OVERVIEW_ORDER = [
  "RAW_MATERIAL_REVALIDATION",
  "RAW_MATERIAL_PROCESSING",
  "MIXING",
  "HARDWARE",
  "CASTING",
  "CURING",
  "DE_CORING",
  "TRIMMING",
  "POST_CURE",
  "NDT",
  "QC",
  "WEIGHTMENT",
  "STATIC_TEST_FACILITY",
] as const;

const OVERVIEW_SKIP_KEYS = new Set([
  "RAW_MATERIAL",
  "PROPELLANT_PROPERTIES",
  "POST_CURE_OPERATION",
  "WEIGHMENT",
]);

const sortQcApproverOverviewKeys = (keys: string[]): string[] => {
  const orderIndex = new Map(
    QC_APPROVER_OVERVIEW_ORDER.map((key, index) => [key, index] as const),
  );
  return [...keys].sort((a, b) => {
    const aIdx = orderIndex.get(a as (typeof QC_APPROVER_OVERVIEW_ORDER)[number]);
    const bIdx = orderIndex.get(b as (typeof QC_APPROVER_OVERVIEW_ORDER)[number]);
    if (aIdx != null && bIdx != null) return aIdx - bIdx;
    if (aIdx != null) return -1;
    if (bIdx != null) return 1;
    return a.localeCompare(b);
  });
};

export const buildQcApproverFinalGroups = (
  partialNavByDivision: Record<string, QcPartialNavItem[]>,
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>,
): QcFinalApprovalDivisionGroup[] => {
  const keys = sortQcApproverOverviewKeys(
    Object.keys({
      ...divisionStatusByFlowKey,
      ...partialNavByDivision,
    }).filter((key) => {
      const normalized = String(key ?? "").trim().toUpperCase();
      return Boolean(normalized) && !OVERVIEW_SKIP_KEYS.has(normalized);
    }),
  );

  return buildFinalApprovalDivisionGroups(
    keys.map((key) => ({
      divisionKey: key,
      divisionLabel: formatQcApproverDivisionLabel(key),
      divisionStatus: divisionStatusByFlowKey[key] ?? "TO_BE_INITIATED",
      units: (partialNavByDivision[key] ?? []).filter(
        (item) =>
          item.kind === "PREMIX" || item.kind === "FINAL_MIX" || item.kind === "MOTOR",
      ),
    })),
  );
};

export const buildQcApproverFinalRows = (
  partialNavByDivision: Record<string, QcPartialNavItem[]>,
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>,
): QcApprovalTableRow[] => {
  const groups = buildQcApproverFinalGroups(partialNavByDivision, divisionStatusByFlowKey);
  return buildFinalApprovalRows(
    groups.map((group) => ({
      divisionLabel: group.divisionLabel,
      divisionStatus: group.divisionStatus,
      units: group.units.map((unit) => ({
        id: unit.id,
        kind: unit.kind,
        label: unit.label,
        status: unit.status,
      })),
    })),
  );
};
