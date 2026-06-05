import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";

export type RawMaterialProcurementApproverListPayload = {
  subDepartmentId: number;
  page: number;
  limit: number;
  status?: string[];
  materialCode?: string[];
  search?: string;
  fromDate?: string;
  toDate?: string;
  priority?: string[];
};

export type RawMaterialProcurementApproverChangeStatusPayload = {
  procurementId: string;
  lotId: string;
  subDepartmentId: number;
  actionType: "APPROVED" | "REJECTED";
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const fetchRawMaterialProcurementApproverListApi = (
  payload: RawMaterialProcurementApproverListPayload,
) => post(APPROVER_ENDPOINTS.RAW_MATERIAL_PROCUREMENT_LIST, payload);

export const changeRawMaterialProcurementApproverStatusApi = (
  payload: RawMaterialProcurementApproverChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.RAW_MATERIAL_PROCUREMENT_CHANGE_STATUS, payload);
