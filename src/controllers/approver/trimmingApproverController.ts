import {
  changeTrimmingApproverMotorStatus,
  type TrimmingApproverMotorChangeStatusPayload,
  type TrimmingApproverMotorChangeStatusResponse,
} from "../../data/api/approver/trimmingApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitTrimmingApproverMotorStatusChange = async (
  payload: TrimmingApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeTrimmingApproverMotorStatus(payload);
    return new ApiResponseModel<TrimmingApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitTrimmingApproverFormStatusChange = async (
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
  submitMotorStatusChange: submitTrimmingApproverMotorStatusChange,
  submitFormStatusChange: submitTrimmingApproverFormStatusChange,
};
