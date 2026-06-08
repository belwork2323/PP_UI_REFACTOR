import { normalizeRocketCasingListStatus } from "../user/RocketMotorCasingProcurementModel";

export type RocketMotorCasingApproverRow = {
  procurementId: string;
  motorCasingId: string;
  motorStage: string;
  motorNo: string;
  casingType: string;
  insulationType: string;
  receivingDate: string;
  nextStep: string;
  priority: string;
  status: string;
  assignedTo: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string } | null;
  createdOn: string;
  rejectionReason: string | null;
};

export type RocketMotorCasingApproverListData = {
  statusCounts: Record<string, number>;
  casings: RocketMotorCasingApproverRow[];
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

export const mapRocketMotorCasingApproverRow = (
  casing: Record<string, unknown>,
): RocketMotorCasingApproverRow => {
  const procurementId = String(casing.procurementId ?? "").trim();
  const motorCasingId = String(casing.motorCasingId ?? "").trim();
  const motorStage = String(casing.motorStage ?? "").trim();
  const motorNo = String(casing.motorNo ?? "").trim();

  return {
    procurementId,
    motorCasingId,
    motorStage,
    motorNo,
    casingType: String(casing.casingType ?? "").trim(),
    insulationType: String(casing.insulationType ?? "").trim(),
    receivingDate: String(casing.receivingDate ?? "").trim(),
    nextStep: String(casing.nextStep ?? "").trim(),
    priority: String(casing.priority ?? "Medium").trim(),
    status: normalizeRocketCasingListStatus(String(casing.status ?? "")),
    assignedTo: mapPerson(casing.assignedTo),
    createdBy: mapPerson(casing.createdBy),
    createdOn: String(casing.createdOn ?? "").trim(),
    rejectionReason:
      casing.rejectionReason === null || casing.rejectionReason === undefined
        ? null
        : String(casing.rejectionReason),
  };
};

/** Maps API casing row to approver list table shape (legacy keys kept for shared components). */
export const mapRocketMotorCasingApproverListItem = (
  casing: RocketMotorCasingApproverRow,
  index: number,
) => ({
  id: casing.motorCasingId || casing.procurementId || index + 1,
  motorCasingId: casing.motorCasingId,
  motorStage: casing.motorStage,
  motorNo: casing.motorNo,
  casingType: casing.casingType,
  insulationType: casing.insulationType,
  receivingDate: casing.receivingDate,
  nextStep: casing.nextStep,
  priority: casing.priority,
  status: casing.status,
  rejectionReason: casing.rejectionReason,
  assignedTo: casing.assignedTo,
  createdOn: casing.createdOn,
  submittedBy: casing.createdBy?.fullName ?? casing.assignedTo?.fullName ?? "—",
  batchId: casing.motorCasingId,
  formId: casing.motorCasingId,
  batchType: casing.casingType,
  motorId: casing.motorNo || casing.motorStage,
  motorType: casing.motorStage,
});

export const RocketMotorCasingApproverListModel = {
  fromApi(apiResponse: { data?: unknown }): RocketMotorCasingApproverListData {
    const data = (apiResponse?.data ?? {}) as Record<string, unknown>;
    const casings = Array.isArray(data.casings)
      ? data.casings.map((casing) =>
          mapRocketMotorCasingApproverRow(casing as Record<string, unknown>),
        )
      : [];

    return {
      statusCounts:
        data.statusCounts && typeof data.statusCounts === "object"
          ? (data.statusCounts as Record<string, number>)
          : {},
      casings,
      pagination: {
        page: Number((data.pagination as Record<string, unknown>)?.page ?? 1),
        limit: Number((data.pagination as Record<string, unknown>)?.limit ?? 10),
        totalRecords: Number(
          (data.pagination as Record<string, unknown>)?.totalRecords ?? casings.length,
        ),
        totalPages: Number((data.pagination as Record<string, unknown>)?.totalPages ?? 1),
      },
    };
  },
};
