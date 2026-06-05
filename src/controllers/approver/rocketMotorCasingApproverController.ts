import {
  changeRocketMotorCasingApproverStatusApi,
  fetchRocketMotorCasingApproverListApi,
  type RocketMotorCasingApproverChangeStatusPayload,
  type RocketMotorCasingApproverListPayload,
} from "../../data/api/approver/rocketMotorCasingApproverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import { RocketMotorCasingApproverListModel } from "../../data/models/approver/RocketMotorCasingApproverModel";

const rocketMotorCasingApproverController = {
  fetchCasingList: async (payload: RocketMotorCasingApproverListPayload) => {
    try {
      const response = await fetchRocketMotorCasingApproverListApi(payload);
      return new ApiResponseModel(response, (res) =>
        RocketMotorCasingApproverListModel.fromApi(res),
      );
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },

  changeStatus: async (payload: RocketMotorCasingApproverChangeStatusPayload) => {
    try {
      const response = await changeRocketMotorCasingApproverStatusApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },
};

export default rocketMotorCasingApproverController;
