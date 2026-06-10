import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverBatchListRequest } from "../../models/approver/ApproverBatchListModel";

export const fetchApproverSubDepartmentDashboardStats = async (payload: { subDepartmentId: number }) =>
  post(APPROVER_ENDPOINTS.SUBDEPT_DASHBOARD_STATS, payload);

export type ApproverBatchListPayload = ApproverBatchListRequest;

export const fetchApproverSubDepartmentBatchList = async (payload: ApproverBatchListPayload) =>
  post(APPROVER_ENDPOINTS.BATCH_LIST, payload);

export type ApproverFormActionType = "APPROVED" | "REJECTED";

export type ApproverChangeStatusPayload = {
  formId: string;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const changeApproverFormStatus = async (payload: ApproverChangeStatusPayload) =>
  post(APPROVER_ENDPOINTS.CHANGE_STATUS, payload);

export type ApproverFormPdfPayload = {
  formId: string;
  subDepartmentId: number;
  download: boolean;
};

export const fetchApproverFormPdf = async (payload: ApproverFormPdfPayload) =>
  post(APPROVER_ENDPOINTS.FORM_PDF, payload);