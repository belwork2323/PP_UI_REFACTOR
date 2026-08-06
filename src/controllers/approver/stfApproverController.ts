import {
  changeSTFApproverMotorStatus,
  type STFApproverMotorChangeStatusPayload,
  type STFApproverMotorChangeStatusResponse,
} from "../../data/api/approver/stfApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitSTFApproverMotorStatusChange = async (
  payload: STFApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeSTFApproverMotorStatus(payload);
    return new ApiResponseModel<STFApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitSTFApproverFormStatusChange = async (payload: ApproverChangeStatusPayload) => {
  try {
    const response = await changeApproverFormStatus(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export default {
  submitMotorStatusChange: submitSTFApproverMotorStatusChange,
  submitFormStatusChange: submitSTFApproverFormStatusChange,
};
