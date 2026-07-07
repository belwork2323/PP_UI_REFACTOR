import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import { useAlertStore } from "../../app/store/alertStore";
import { ApproverSubDepartmentDashboardStatsModel } from "../../data/models/approver/ApproverSubDepartmentDashboardStatsModel";
import {
  changeApproverFormStatus,
  fetchApproverFormPdf,
  fetchApproverSubDepartmentBatchList,
  fetchApproverSubDepartmentDashboardStats,
  type ApproverBatchListPayload,
  type ApproverChangeStatusPayload,
  type ApproverFormPdfPayload,
} from "../../data/api/approver/approverApi";

export const getApproverSubDepartmentDashboardStats = async (subDepartmentId: number) => {
  const showAlert = useAlertStore.getState().showAlert;

  try {
    const response = await fetchApproverSubDepartmentDashboardStats({ subDepartmentId });

    if (response?.success && response?.data) {
      return {
        success: true,
        stats: ApproverSubDepartmentDashboardStatsModel.fromApi(response.data),
        message: response.message,
      };
    }

    showAlert(response?.message || "Failed to fetch approver dashboard stats", "error", { autoCloseMs: 2500 });
    return {
      success: false,
      stats: ApproverSubDepartmentDashboardStatsModel.empty(),
      message: response?.message || "Failed to fetch approver dashboard stats",
    };
  } catch (error: any) {
    showAlert(error?.message || "Failed to fetch approver dashboard stats", "error", { autoCloseMs: 2500 });
    return {
      success: false,
      stats: ApproverSubDepartmentDashboardStatsModel.empty(),
      message: error?.message || "Failed to fetch approver dashboard stats",
    };
  }
};

export const getApproverSubDepartmentBatchList = async (payload: ApproverBatchListPayload) => {
  try {
    const response = await fetchApproverSubDepartmentBatchList(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const submitApproverFormStatusChange = async (payload: ApproverChangeStatusPayload) => {
  try {
    const response = await changeApproverFormStatus(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export const getApproverFormPdf = async (payload: ApproverFormPdfPayload) => {
  try {
    const response = await fetchApproverFormPdf(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};