import {
  changeDispatchApproverMotorStatus,
  type DispatchApproverMotorChangeStatusPayload,
  type DispatchApproverMotorChangeStatusResponse,
} from "../../data/api/approver/dispatch/dispatchApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitDispatchApproverMotorStatusChange = async (
  payload: DispatchApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeDispatchApproverMotorStatus(payload);
    return new ApiResponseModel<DispatchApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitDispatchApproverFormStatusChange = async (
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
  submitMotorStatusChange: submitDispatchApproverMotorStatusChange,
  submitFormStatusChange: submitDispatchApproverFormStatusChange,
};
