import { get, post } from "../httpClient";
import { APPROVER_ENDPOINTS } from "../endPoints";
import type { ApproverFormActionType } from "./approverApi";

/**
 * Unified QC Division unit/division approval payload.
 * POST /api/v1/approver/form/division/change-status
 *
 * Variants:
 * - Division-level (Revalidation / Weightment): omit premixNo, motorId, stageType
 * - Premix / Final mix: pass premixNo + stageType
 * - Motor: pass motorId only
 */
export type QcDivisionApproverChangeStatusPayload = {
  formId: string;
  subDepartmentId: number;
  divisionId: number;
  division: string;
  actionType: ApproverFormActionType;
  remarks?: string | null;
  rejectionReason?: string | null;
  premixNo?: number;
  stageType?: "PREMIX" | "FINAL_MIX";
  motorId?: string;
};

/** @deprecated Prefer QcDivisionApproverChangeStatusPayload */
export type QcDivisionApproverMotorChangeStatusPayload = Omit<
  QcDivisionApproverChangeStatusPayload,
  "divisionId" | "premixNo" | "stageType"
> & {
  motorId: string;
  divisionId?: number;
};

/** @deprecated Prefer QcDivisionApproverChangeStatusPayload */
export type QcDivisionApproverPremixChangeStatusPayload = Omit<
  QcDivisionApproverChangeStatusPayload,
  "divisionId" | "motorId"
> & {
  premixNo: number;
  stageType: "PREMIX" | "FINAL_MIX";
  divisionId?: number;
};

/** @deprecated Prefer QcDivisionApproverChangeStatusPayload */
export type QcDivisionApproverDivisionChangeStatusPayload = Omit<
  QcDivisionApproverChangeStatusPayload,
  "premixNo" | "stageType" | "motorId"
> & {
  divisionId?: number;
};

export type QcDivisionApproverUnitChangeStatusResponse = {
  formId: string;
  batchId: string;
  subDepartmentId?: number;
  status: string;
  batchStatus?: string;
  divisionId?: number;
  division?: string;
  divisionSubmissionType?: string;
  divisionStatus?: string;
  unlockedDivision?: string | null;
  motorId?: string;
  premixNo?: number;
  stageType?: string;
  motorSubmissionStatus?: string;
  premixSubmissionStatus?: string;
  allMotorsApproved?: boolean;
  allPremixesApproved?: boolean;
  allDivisionsApproved?: boolean;
  pendingDivisionCount?: number;
  approvedDivisionCount?: number;
  totalDivisionCount?: number;
  pendingMotorCount?: number;
  approvedMotorCount?: number;
  rejectedMotorCount?: number;
  inProgressMotorCount?: number;
  totalMotorCount?: number;
  divisionStatuses?: unknown[];
  motorStatuses?: unknown[];
  premixStatuses?: unknown[];
  actionBy?: string;
  actionAt?: string;
  remarks?: string | null;
  rejectionReason?: string | null;
};

/** POST /approver/form/division/change-status */
export const changeQcDivisionApproverUnitStatus = async (
  payload: QcDivisionApproverChangeStatusPayload,
) => post(APPROVER_ENDPOINTS.DIVISION_CHANGE_STATUS, payload);

/** @deprecated Use changeQcDivisionApproverUnitStatus */
export const changeQcDivisionApproverMotorStatus = async (
  payload: QcDivisionApproverMotorChangeStatusPayload,
) =>
  changeQcDivisionApproverUnitStatus({
    formId: payload.formId,
    subDepartmentId: payload.subDepartmentId,
    divisionId: Number(payload.divisionId ?? 0),
    division: payload.division,
    motorId: payload.motorId,
    actionType: payload.actionType,
    remarks: payload.remarks,
    rejectionReason: payload.rejectionReason,
  });

/** @deprecated Use changeQcDivisionApproverUnitStatus */
export const changeQcDivisionApproverPremixStatus = async (
  payload: QcDivisionApproverPremixChangeStatusPayload,
) =>
  changeQcDivisionApproverUnitStatus({
    formId: payload.formId,
    subDepartmentId: payload.subDepartmentId,
    divisionId: Number(payload.divisionId ?? 0),
    division: payload.division,
    premixNo: payload.premixNo,
    stageType: payload.stageType,
    actionType: payload.actionType,
    remarks: payload.remarks,
    rejectionReason: payload.rejectionReason,
  });

/** @deprecated Use changeQcDivisionApproverUnitStatus */
export const changeQcDivisionApproverDivisionStatus = async (
  payload: QcDivisionApproverDivisionChangeStatusPayload,
) =>
  changeQcDivisionApproverUnitStatus({
    formId: payload.formId,
    subDepartmentId: payload.subDepartmentId,
    divisionId: Number(payload.divisionId ?? 0),
    division: payload.division,
    actionType: payload.actionType,
    remarks: payload.remarks,
    rejectionReason: payload.rejectionReason,
  });

/**
 * GET /user/qc-division/divisions
 * Shared catalog used by approvers to resolve numeric `divisionId` for change-status.
 */
export const fetchQcDivisionCatalogApi = async () => get(APPROVER_ENDPOINTS.QC_DIVISIONS);
