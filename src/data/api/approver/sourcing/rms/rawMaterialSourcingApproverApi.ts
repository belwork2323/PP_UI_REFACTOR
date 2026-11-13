import { post } from "@data/api/httpClient";
import { APPROVER_ENDPOINTS } from "@data/api/endPoints";

export type RawMaterialSourcingApproverListPayload = {
  subDepartmentId: number;
  page: number;
  limit: number;
  status?: string[];
  materialCode?: string[];
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export type RawMaterialSourcingApproverChangeStatusPayload = {
  sourcingId: string;
  lotId: string;
  subDepartmentId: number;
  actionType: "APPROVED" | "REJECTED";
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const fetchRawMaterialSourcingApproverListApi = (
  payload: RawMaterialSourcingApproverListPayload,
) => post(APPROVER_ENDPOINTS.RAW_MATERIAL_SOURCING_LIST, payload);

export const changeRawMaterialSourcingApproverStatusApi = (
  payload: RawMaterialSourcingApproverChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.RAW_MATERIAL_SOURCING_CHANGE_STATUS, payload);
