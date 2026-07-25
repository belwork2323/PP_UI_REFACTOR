import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverFormActionType } from "./approverApi";

export type RmpApproverPremixChangeStatusPayload = {
  formId: string;
  premixNo: number;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type RmpApproverPremixChangeStatusResponse = {
  formId: string;
  batchId: string;
  premixNo: number;
  actionType: string;
  status: string;
  premixSubmissionStatus: string;
  batchStatus: string;
  allPremixesApproved: boolean;
  pendingPremixCount: number;
  approvedPremixCount: number;
  rejectedPremixCount: number;
  totalPremixCount: number;
  actionBy: string;
  actionAt: string;
  remarks: string | null;
  rejectionReason: string | null;
};

export const changeRmpApproverPremixStatus = async (
  payload: RmpApproverPremixChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.PREMIX_CHANGE_STATUS, payload);
