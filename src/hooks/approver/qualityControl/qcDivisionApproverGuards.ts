import { OPERATION_STATUS } from "../../operationStatus";
import {
  applyStatusMapsToPartialNav,
  buildDivisionApprovalRows,
  buildFinalApprovalRows,
  hasPartialChildNav,
  mapDivisionDetailsToPartialNav,
  type QcApprovalTableRow,
  type QcPartialItemStatus,
  type QcPartialNavItem,
} from "../../user/qualityControl/qcDivisionApprovalUnits";

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
  const divisionDetails = Array.isArray(root.divisionDetails) ? root.divisionDetails : [];
  const motorStatuses = root.motorStatuses;
  const premixStatuses = root.premixStatuses;
  const divisionStatuses = Array.isArray(root.divisionStatuses) ? root.divisionStatuses : [];

  const divisionStatusByFlowKey: Record<string, QcPartialItemStatus> = {};
  divisionStatuses.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const rec = entry as Record<string, unknown>;
    const key = String(rec.division ?? "").trim();
    if (!key) return;
    divisionStatusByFlowKey[key] = toPartialStatus(rec.status);
  });

  const partialNavByDivision: Record<string, QcPartialNavItem[]> = {};

  divisionDetails.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const rec = entry as Record<string, unknown>;
    const division = String(rec.division ?? "").trim();
    if (!division) return;

    const flowKey = division;
    const rawMaterialType =
      division === "RAW_MATERIAL_PROCESSING" || division === "RAW_MATERIAL"
        ? "RAW_MATERIAL_PROCESSING"
        : undefined;

    let items = mapDivisionDetailsToPartialNav(
      {
        data: rec.data ?? {},
        motors: motorStatuses,
        premixes: premixStatuses,
      },
      {
        flowKey,
        rawMaterialType,
      },
    );

    items = applyStatusMapsToPartialNav(items, {
      motorStatuses,
      premixStatuses,
      division,
    });

    if (!hasPartialChildNav(items)) {
      items = [
        {
          id: `division:${division}`,
          kind: "DIVISION",
          label: String(rec.subType ?? division),
          status: divisionStatusByFlowKey[division] ?? toPartialStatus(rec.status),
        },
      ];
    }

    partialNavByDivision[division] = items;
  });

  Object.keys(divisionStatusByFlowKey).forEach((division) => {
    if (partialNavByDivision[division]?.length) return;
    partialNavByDivision[division] = [
      {
        id: `division:${division}`,
        kind: "DIVISION",
        label: division,
        status: divisionStatusByFlowKey[division],
      },
    ];
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

export const buildQcApproverFinalRows = (
  partialNavByDivision: Record<string, QcPartialNavItem[]>,
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>,
): QcApprovalTableRow[] => {
  const divisions = Object.keys({
    ...divisionStatusByFlowKey,
    ...partialNavByDivision,
  }).map((divisionLabel) => ({
    divisionLabel,
    divisionStatus: divisionStatusByFlowKey[divisionLabel],
    units: partialNavByDivision[divisionLabel] ?? [],
  }));
  return buildFinalApprovalRows(divisions);
};
