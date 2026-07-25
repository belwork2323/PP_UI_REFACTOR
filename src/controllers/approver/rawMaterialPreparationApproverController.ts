import {
  changeRmpApproverPremixStatus,
  type RmpApproverPremixChangeStatusPayload,
  type RmpApproverPremixChangeStatusResponse,
} from "../../data/api/approver/rawMaterialPreparationApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitRmpApproverPremixStatusChange = async (
  payload: RmpApproverPremixChangeStatusPayload,
) => {
  try {
    const response = await changeRmpApproverPremixStatus(payload);
    return new ApiResponseModel<RmpApproverPremixChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitRmpApproverFormStatusChange = async (payload: ApproverChangeStatusPayload) => {
  try {
    const response = await changeApproverFormStatus(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export default {
  submitPremixStatusChange: submitRmpApproverPremixStatusChange,
  submitFormStatusChange: submitRmpApproverFormStatusChange,
};
