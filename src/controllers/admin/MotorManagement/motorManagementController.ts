import {
  fetchAllMotors,
  fetchMotorStats,
  fetchMotorDetails,
  discardMotor,
} from "@data/api/admin/MotorManagement/motorManagementApi";
import {
  MotorListItemModel,
  MotorStatsModel,
  MotorDetailsModel,
} from "@data/models/admin/MotorManagement/MotorManagementModel";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";

export const motorManagementController = {
  getAllMotors: async (payload: any) => {
    try {
      const resp = await fetchAllMotors(payload);
      return new ApiResponseModel(resp, (res) => {
        const rawMotors = res?.data?.motors || [];
        const pagination = res?.data?.pagination || {
          page: 1,
          pageSize: 10,
          totalRecords: 0,
          totalPages: 0,
        };
        return {
          motors: rawMotors.map((m: any) => MotorListItemModel.fromApi(m)),
          pagination: {
            page: pagination.page ?? 1,
            limit: pagination.pageSize ?? pagination.limit ?? 10,
            totalRecords: pagination.totalRecords ?? 0,
            totalPages: pagination.totalPages ?? 0,
          },
        };
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  getMotorStats: async (payload: any) => {
    try {
      const resp = await fetchMotorStats(payload);
      return new ApiResponseModel(resp, (res) => MotorStatsModel.fromApi(res?.data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  getMotorDetails: async (motorId: string) => {
    try {
      const resp = await fetchMotorDetails({ motorId });
      return new ApiResponseModel(resp, (res) => MotorDetailsModel.fromApi(res?.data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  discardMotor: async (payload: { motorId: string; reason: string }) => {
    try {
      const resp = await discardMotor(payload);
      return new ApiResponseModel(resp, (res) => res?.data ?? null);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};
