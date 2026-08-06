import {
  changePostCureApproverMotorStatus,
  type PostCureApproverMotorChangeStatusPayload,
  type PostCureApproverMotorChangeStatusResponse,
} from "../../data/api/approver/postCureApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitPostCureApproverMotorStatusChange = async (
  payload: PostCureApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changePostCureApproverMotorStatus(payload);
    return new ApiResponseModel<PostCureApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitPostCureApproverFormStatusChange = async (
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
  submitMotorStatusChange: submitPostCureApproverMotorStatusChange,
  submitFormStatusChange: submitPostCureApproverFormStatusChange,
};
