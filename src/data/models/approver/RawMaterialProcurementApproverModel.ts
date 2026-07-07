import { OPERATION_STATUS, toOperationStatusApiValue } from "../../../hooks/operationStatus";
import { normalizeRawMaterialStatus } from "../user/RawMaterialProcurementModel";

/** Status tabs for approver raw material lot list (matches API status labels). */
export const RAW_MATERIAL_APPROVER_STATUS_TABS = Object.values(OPERATION_STATUS);

/** Map UI status tab label to API request value (e.g. Approved → APPROVED). */
export function toRawMaterialApproverListApiStatus(status: string, allLabel: string): string | null {
  return toOperationStatusApiValue(status, allLabel);
}

export function mapRawMaterialApproverStatusCountsForUi(
  server: Record<string, number> | undefined,
  allLabel: string,
  totalRecords: number,
): Record<string, number> {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = server?.[key];
      if (typeof value === "number") return value;
    }
    return 0;
  };

  const byLabel: Record<string, number> = {
    [OPERATION_STATUS.INITIATED]: pick("initiated", "Initiated", "INITIATED"),
    [OPERATION_STATUS.IN_PROGRESS]: pick("inProgress", "In Progress", "IN_PROGRESS"),
    [OPERATION_STATUS.WAITING_FOR_APPROVAL]: pick(
      "waitingForApproval",
      "waitingforApproval",
      "Waiting for Approval",
      "WAITING_FOR_APPROVAL",
    ),
    [OPERATION_STATUS.APPROVED]: pick("approved", "Approved", "APPROVED"),
    [OPERATION_STATUS.REJECTED]: pick("rejected", "Rejected", "REJECTED"),
  };

  const sum = Object.values(byLabel).reduce((total, count) => total + count, 0);

  return {
    ...byLabel,
    [allLabel]: sum > 0 ? sum : totalRecords,
  };
}

export type RawMaterialProcurementApproverLotRow = {
  lotId: string;
  procurementId: string;
  materialCode: string;
  materialName: string;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  priority: string;
  status: string;
  assignedTo: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string } | null;
  createdOn: string;
  rejectionReason: string | null;
};

export type RawMaterialProcurementApproverListData = {
  statusCounts: Record<string, number>;
  lots: RawMaterialProcurementApproverLotRow[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
};

const mapPerson = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const person = value as Record<string, unknown>;
  const id = String(person.id ?? "").trim();
  const fullName = String(person.fullName ?? person.name ?? "").trim();
  if (!id && !fullName) return null;
  return { id, fullName: fullName || id };
};

export const mapRawMaterialProcurementApproverLotRow = (
  lot: Record<string, unknown>,
): RawMaterialProcurementApproverLotRow => {
  const lotId = String(lot.lotId ?? "").trim();
  const procurementId = String(lot.procurementId ?? "").trim();
  const materialCode = String(lot.materialCode ?? "").trim();
  const materialName = String(lot.materialName ?? materialCode).trim();

  return {
    lotId,
    procurementId,
    materialCode,
    materialName,
    supplyOrderNo: String(lot.supplyOrderNo ?? "").trim(),
    receiptDate: String(lot.receiptDate ?? "").trim(),
    manufacturerName: String(lot.manufacturerName ?? "").trim(),
    priority: String(lot.priority ?? "Medium").trim(),
    status: normalizeRawMaterialStatus(String(lot.status ?? "").trim()),
    assignedTo: mapPerson(lot.assignedTo),
    createdBy: mapPerson(lot.createdBy),
    createdOn: String(lot.createdOn ?? "").trim(),
    rejectionReason:
      lot.rejectionReason === null || lot.rejectionReason === undefined
        ? null
        : String(lot.rejectionReason),
  };
};

/** Maps API lot row to approver list table shape (legacy keys kept for shared components). */
export const mapRawMaterialProcurementApproverListItem = (
  lot: RawMaterialProcurementApproverLotRow,
  index: number,
) => ({
  id: lot.lotId || index + 1,
  lotId: lot.lotId,
  procurementId: lot.procurementId,
  batchId: lot.lotId,
  formId: lot.lotId,
  materialCode: lot.materialCode,
  materialName: lot.materialName,
  supplyOrderNo: lot.supplyOrderNo,
  receiptDate: lot.receiptDate,
  manufacturerName: lot.manufacturerName,
  priority: lot.priority,
  status: lot.status,
  rejectionReason: lot.rejectionReason,
  assignedTo: lot.assignedTo,
  createdOn: lot.createdOn,
  submittedBy: lot.createdBy?.fullName ?? lot.assignedTo?.fullName ?? "—",
  batchType: lot.materialCode,
  motorId: lot.lotId,
  motorType: lot.materialCode,
});

export const RawMaterialProcurementApproverListModel = {
  fromApi(apiResponse: { data?: unknown }): RawMaterialProcurementApproverListData {
    const data = (apiResponse?.data ?? {}) as Record<string, unknown>;
    const lots = Array.isArray(data.lots)
      ? data.lots.map((lot) =>
          mapRawMaterialProcurementApproverLotRow(lot as Record<string, unknown>),
        )
      : [];

    return {
      statusCounts:
        data.statusCounts && typeof data.statusCounts === "object"
          ? (data.statusCounts as Record<string, number>)
          : {},
      lots,
      pagination: {
        page: Number((data.pagination as Record<string, unknown>)?.page ?? 1),
        limit: Number((data.pagination as Record<string, unknown>)?.limit ?? 10),
        totalRecords: Number((data.pagination as Record<string, unknown>)?.totalRecords ?? lots.length),
        totalPages: Number((data.pagination as Record<string, unknown>)?.totalPages ?? 1),
      },
    };
  },
};
