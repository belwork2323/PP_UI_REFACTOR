import { normalizeRocketCasingListStatus } from "../user/RocketMotorCasingProcurementModel";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";

export const ROCKET_MOTOR_CASING_APPROVER_STATUS_TABS = Object.values(OPERATION_STATUS);

export const formatMotorStageLabel = (motorStage: string | number | null | undefined): string => {
  if (motorStage === null || motorStage === undefined || motorStage === "") return "—";
  const raw = String(motorStage).trim();
  if (!raw) return "—";
  if (/^stage\s/i.test(raw)) return raw;
  return `Stage ${raw}`;
};

export type RocketMotorCasingApproverRow = {
  projectId: string;
  motorCasingId: string;
  motorStage: string;
  motorId: string;
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

export type RocketMotorCasingApproverListItem = ReturnType<typeof mapRocketMotorCasingApproverListItem>;

export type RocketMotorCasingApproverListData = {
  statusCounts: Record<string, number>;
  casings: RocketMotorCasingApproverListItem[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
};

const resolveListPayload = (apiResponse: Record<string, unknown> | null | undefined) => {
  if (!apiResponse) return {};

  if (Array.isArray(apiResponse.casings)) {
    return apiResponse;
  }

  const nested = apiResponse.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }

  return apiResponse;
};

const readProjectId = (casing: Record<string, unknown>) =>
  String(casing.projectId ?? casing.projectID ?? casing.project_id ?? "").trim();

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
  const motorCasingId = String(casing.motorCasingId ?? "").trim();
  const motorStage =
    casing.motorStage != null && String(casing.motorStage).trim() !== ""
      ? String(casing.motorStage).trim()
      : "";
  const motorId = String(casing.motorId ?? casing.motorNo ?? "").trim();

  return {
    projectId: readProjectId(casing),
    motorCasingId,
    motorStage,
    motorId,
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

/** Maps API casing row to approver list table shape. */
export const mapRocketMotorCasingApproverListItem = (
  casing: RocketMotorCasingApproverRow,
  index: number,
) => ({
  id: casing.motorCasingId || index + 1,
  projectId: casing.projectId,
  motorCasingId: casing.motorCasingId,
  motorStage: casing.motorStage,
  motorStageLabel: formatMotorStageLabel(casing.motorStage),
  motorId: casing.motorId,
  motorNo: casing.motorId,
  casingType: casing.casingType,
  insulationType: casing.insulationType,
  receivingDate: casing.receivingDate,
  nextStep: casing.nextStep,
  priority: casing.priority,
  status: casing.status,
  rejectionReason: casing.rejectionReason,
  assignedTo: casing.assignedTo,
  createdBy: casing.createdBy,
  createdOn: casing.createdOn,
  submittedBy: casing.createdBy?.fullName ?? casing.assignedTo?.fullName ?? "—",
  batchId: casing.motorCasingId,
  formId: casing.motorCasingId,
  batchType: casing.casingType,
  motorType: casing.motorStage,
});

export const RocketMotorCasingApproverListModel = {
  fromApi(apiResponse: Record<string, unknown>): RocketMotorCasingApproverListData {
    const data = resolveListPayload(apiResponse);
    const pagination = (data.pagination ?? {}) as Record<string, unknown>;
    const rawCasings = Array.isArray(data.casings) ? data.casings : [];

    const casings = rawCasings.map((casing, index) =>
      mapRocketMotorCasingApproverListItem(
        mapRocketMotorCasingApproverRow(casing as Record<string, unknown>),
        index,
      ),
    );

    return {
      statusCounts:
        data.statusCounts && typeof data.statusCounts === "object"
          ? (data.statusCounts as Record<string, number>)
          : {},
      casings,
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? pagination.pageSize ?? 10),
        totalRecords: Number(pagination.totalRecords ?? casings.length),
        totalPages: Number(pagination.totalPages ?? 1),
      },
    };
  },
};
