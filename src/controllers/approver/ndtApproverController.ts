import {
  changeNDTApproverMotorStatus,
  type NDTApproverMotorChangeStatusPayload,
  type NDTApproverMotorChangeStatusResponse,
} from "../../data/api/approver/ndtApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitNDTApproverMotorStatusChange = async (
  payload: NDTApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeNDTApproverMotorStatus(payload);
    return new ApiResponseModel<NDTApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitNDTApproverFormStatusChange = async (payload: ApproverChangeStatusPayload) => {
  try {
    const response = await changeApproverFormStatus(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export default {
  submitMotorStatusChange: submitNDTApproverMotorStatusChange,
  submitFormStatusChange: submitNDTApproverFormStatusChange,
};
