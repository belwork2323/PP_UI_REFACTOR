import {
  formatMotorStageLabel,
  normalizeRocketCasingListStatus,
} from "../user/RocketMotorCasingProcurementModel";
import { SOURCING_LOT_STATUS_FILTER_VALUES } from "../../../hooks/operationStatus";

/** Match the user-side Rocket Motor Casing list; omit workflow states that aren't useful filters here. */
export const ROCKET_MOTOR_CASING_APPROVER_STATUS_TABS = SOURCING_LOT_STATUS_FILTER_VALUES;

export { formatMotorStageLabel };

export type RocketMotorCasingApproverRow = {
  projectId: string;
  projectName: string;
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

const readProjectId = (casing: Record<string, unknown>) => {
  const nested =
    casing.project && typeof casing.project === "object"
      ? (casing.project as { projectId?: string | null })
      : null;
  return String(
    nested?.projectId ?? casing.projectId ?? casing.projectID ?? casing.project_id ?? "",
  ).trim();
};

const readProjectName = (casing: Record<string, unknown>) => {
  const nested =
    casing.project && typeof casing.project === "object"
      ? (casing.project as { projectName?: string | null })
      : null;
  return String(nested?.projectName ?? casing.projectName ?? "").trim();
};

const mapPerson = (value: unknown) => {
  if (typeof value === "string") {
    const fullName = value.trim();
    return fullName ? { id: "", fullName } : null;
  }
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
  const motorCasingId = String(casing.motorCasingId ?? casing.casingId ?? casing.formId ?? "").trim();
  const motorStage =
    (casing.motorStage ?? casing.motorStageName ?? casing.motorType) != null &&
    String(casing.motorStage ?? casing.motorStageName ?? casing.motorType).trim() !== ""
      ? String(casing.motorStage ?? casing.motorStageName ?? casing.motorType).trim()
      : "";
  const motorId = String(casing.motorId ?? casing.motorNo ?? casing.motorNumber ?? "").trim();
  const creator = casing.createdBy ?? casing.formSubmittedBy ?? casing.submittedBy;
  const assignedTo = casing.assignedTo;
  const status = casing.status ?? casing.stageStatus ?? casing.workflowStatus;

  return {
    projectId: readProjectId(casing),
    projectName: readProjectName(casing),
    motorCasingId,
    motorStage,
    motorId,
    casingType: String(casing.casingType ?? casing.casingTypeName ?? "").trim(),
    insulationType: String(casing.insulationType ?? casing.insulationTypeName ?? "").trim(),
    receivingDate: String(casing.receivingDate ?? casing.receivedDate ?? casing.receivedOn ?? "").trim(),
    nextStep: String(casing.nextStep ?? "").trim(),
    priority: String(casing.priority ?? "Medium").trim(),
    status: normalizeRocketCasingListStatus(String(status ?? "")),
    assignedTo: mapPerson(assignedTo),
    createdBy: mapPerson(creator),
    createdOn: String(casing.createdOn ?? casing.createdAt ?? casing.createdDate ?? "").trim(),
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
  projectName: casing.projectName,
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
