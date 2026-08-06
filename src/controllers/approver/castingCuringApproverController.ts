import {
  changeCastingCuringApproverMotorStatus,
  type CastingCuringApproverMotorChangeStatusPayload,
  type CastingCuringApproverMotorChangeStatusResponse,
} from "../../data/api/approver/castingCuringApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitCastingCuringApproverMotorStatusChange = async (
  payload: CastingCuringApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeCastingCuringApproverMotorStatus(payload);
    return new ApiResponseModel<CastingCuringApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitCastingCuringApproverFormStatusChange = async (
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
  submitMotorStatusChange: submitCastingCuringApproverMotorStatusChange,
  submitFormStatusChange: submitCastingCuringApproverFormStatusChange,
};
