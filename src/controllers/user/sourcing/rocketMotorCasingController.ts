import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RocketMotorCasingDetailsModel,
  RocketMotorCasingSubmitResponseModel,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import type { RocketMotorCasingDeletePayload } from "../../../data/models/user/RocketMotorCasingProcurementModel";
import type { RocketMotorCasingFormPayload } from "../../../data/models/user/RocketMotorCasingFormModel";
import {
  createRocketMotorCasingFormApi,
  deleteRocketMotorCasingFormApi,
  fetchRocketMotorCasingFormDetailsApi,
  fetchRocketMotorCasingListApi,
  fetchRocketMotorCasingStatsApi,
  type RocketMotorCasingListRequest,
  updateRocketMotorCasingFormApi,
} from "../../../data/api/users/sourcing/rocketMotorCasingProcurementApi";
import { RocketMotorCasingStatsModel } from "../../../data/models/user/RocketMotorCasingStatsModel";

export type RocketMotorCasingCreatePayload = RocketMotorCasingFormPayload;
export type RocketMotorCasingUpdatePayload = RocketMotorCasingFormPayload & {
  motorCasingId: string;
};

export type RocketMotorCasingDetailsPayload = {
  motorCasingId: string;
};

export const rocketMotorCasingController = {
  fetchCasingList: async (payload: RocketMotorCasingListRequest) => {
    try {
      const response = await fetchRocketMotorCasingListApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to fetch rocket motor casing list:", error);
      return new ApiResponseModel(error);
    }
  },

  createForm: async (payload: RocketMotorCasingCreatePayload) => {
    try {
      const response = await createRocketMotorCasingFormApi(payload as unknown as Record<string, unknown>);
      return new ApiResponseModel<RocketMotorCasingSubmitResponseModel>(response, (res) =>
        RocketMotorCasingSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create rocket motor casing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: RocketMotorCasingDetailsPayload) => {
    try {
      const response = await fetchRocketMotorCasingFormDetailsApi(payload);
      return new ApiResponseModel<RocketMotorCasingDetailsModel>(response, (res) =>
        RocketMotorCasingDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch rocket motor casing form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RocketMotorCasingUpdatePayload) => {
    try {
      const response = await updateRocketMotorCasingFormApi(payload);
      return new ApiResponseModel<RocketMotorCasingSubmitResponseModel>(response, (res) =>
        RocketMotorCasingSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update rocket motor casing form:", error);
      return new ApiResponseModel(error);
    }
  },

  deleteForm: async (payload: RocketMotorCasingDeletePayload) => {
    try {
      const response = await deleteRocketMotorCasingFormApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to delete rocket motor casing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchStats: async (subDepartmentId: number) => {
    try {
      const response = await fetchRocketMotorCasingStatsApi({ subDepartmentId });
      return new ApiResponseModel(response, (res) =>
        RocketMotorCasingStatsModel.fromApi(res?.data)
      );
    } catch (error) {
      console.error("Failed to fetch rocket motor casing stats:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rocketMotorCasingController;
