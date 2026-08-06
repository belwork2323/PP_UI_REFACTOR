import { post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverFormActionType } from "./approverApi";

export type MixingApproverMixCardChangeStatusPayload = {
  formId: string;
  stageType: "PREMIX" | "FINAL_MIX";
  premixNo: number;
  subDepartmentId: number;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export type MixingApproverMixCardChangeStatusResponse = {
  formId: string;
  batchId: string;
  stageType: string;
  premixNo: number;
  actionType: string;
  status: string;
  mixCardSubmissionStatus: string;
  batchStatus: string;
  allMixCardsApproved: boolean;
  pendingMixCardCount: number;
  approvedMixCardCount: number;
  rejectedMixCardCount: number;
  totalMixCardCount: number;
  actionBy: string;
  actionAt: string;
  remarks: string | null;
  rejectionReason: string | null;
};

export const changeMixingApproverMixCardStatus = async (
  payload: MixingApproverMixCardChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.PREMIX_CHANGE_STATUS, payload);
