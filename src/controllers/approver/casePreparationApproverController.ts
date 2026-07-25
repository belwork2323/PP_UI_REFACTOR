import {
  changeCasePrepApproverMotorStatus,
  type CasePrepApproverMotorChangeStatusPayload,
  type CasePrepApproverMotorChangeStatusResponse,
} from "../../data/api/approver/casePreparationApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

export const submitCasePrepApproverMotorStatusChange = async (
  payload: CasePrepApproverMotorChangeStatusPayload,
) => {
  try {
    const response = await changeCasePrepApproverMotorStatus(payload);
    return new ApiResponseModel<CasePrepApproverMotorChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitCasePrepApproverFormStatusChange = async (
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
  submitMotorStatusChange: submitCasePrepApproverMotorStatusChange,
  submitFormStatusChange: submitCasePrepApproverFormStatusChange,
};
