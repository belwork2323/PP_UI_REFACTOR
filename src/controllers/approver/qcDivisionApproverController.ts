import {
  changeQcDivisionApproverDivisionStatus,
  changeQcDivisionApproverMotorStatus,
  changeQcDivisionApproverPremixStatus,
  type QcDivisionApproverDivisionChangeStatusPayload,
  type QcDivisionApproverMotorChangeStatusPayload,
  type QcDivisionApproverPremixChangeStatusPayload,
  type QcDivisionApproverUnitChangeStatusResponse,
} from "../../data/api/approver/qcDivisionApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitQcDivisionApproverMotorStatusChange = async (
  payload: QcDivisionApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeQcDivisionApproverMotorStatus(payload);
    return new ApiResponseModel<QcDivisionApproverUnitChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitQcDivisionApproverPremixStatusChange = async (
  payload: QcDivisionApproverPremixChangeStatusPayload,
) => {
  try {
    const response = await changeQcDivisionApproverPremixStatus(payload);
    return new ApiResponseModel<QcDivisionApproverUnitChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitQcDivisionApproverDivisionStatusChange = async (
  payload: QcDivisionApproverDivisionChangeStatusPayload,
) => {
  try {
    const response = await changeQcDivisionApproverDivisionStatus(payload);
    return new ApiResponseModel<QcDivisionApproverUnitChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitQcDivisionApproverFormStatusChange = async (
  payload: ApproverChangeStatusPayload,
) => {
  try {
    const response = await changeApproverFormStatus(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export default {
  submitMotorStatusChange: submitQcDivisionApproverMotorStatusChange,
  submitPremixStatusChange: submitQcDivisionApproverPremixStatusChange,
  submitDivisionStatusChange: submitQcDivisionApproverDivisionStatusChange,
  submitFormStatusChange: submitQcDivisionApproverFormStatusChange,
};
