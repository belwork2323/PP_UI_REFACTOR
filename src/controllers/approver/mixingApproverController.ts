import {
  changeMixingApproverMixCardStatus,
  type MixingApproverMixCardChangeStatusPayload,
  type MixingApproverMixCardChangeStatusResponse,
} from "../../data/api/approver/mixingApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitMixingApproverMixCardStatusChange = async (
  payload: MixingApproverMixCardChangeStatusPayload,
) => {
  try {
    const response = await changeMixingApproverMixCardStatus(payload);
    return new ApiResponseModel<MixingApproverMixCardChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitMixingApproverFormStatusChange = async (
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
  submitMixCardStatusChange: submitMixingApproverMixCardStatusChange,
  submitFormStatusChange: submitMixingApproverFormStatusChange,
};
