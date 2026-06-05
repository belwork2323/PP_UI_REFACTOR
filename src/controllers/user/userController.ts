import * as userApi from "../../data/api/users/userApi";
import { useAlertStore } from "../../app/store/alertStore";
import { UserSubDepartmentDashboardStatsModel } from "../../data/models/user/UserSubDepartmentDashboardStatsModel";

export const getUsers = async () => {
  const showAlert = useAlertStore.getState().showAlert;
  try {
    return await userApi.fetchUsers();
  } catch (err) {
    showAlert("Failed to fetch users", "error");
    return [];
  }
};

export const createUser = async (userData, onSuccess) => {
  const showAlert = useAlertStore.getState().showAlert;
  try {
    const user = await userApi.createUser(userData);
    showAlert(`User ${user.username} created successfully`, "success");
    onSuccess?.(user);
  } catch (err) {
    showAlert(err.response?.data || "Failed to create user", "error");
  }
};

export const getUserSubDepartmentDashboardStats = async (subDepartmentId: number) => {
  const showAlert = useAlertStore.getState().showAlert;

  try {
    const response = await userApi.fetchUserSubDepartmentDashboardStats({ subDepartmentId });

    if (response?.success && response?.data) {
      return {
        success: true,
        stats: UserSubDepartmentDashboardStatsModel.fromApi(response.data),
        message: response.message,
      };
    }

    showAlert(response?.message || "Failed to fetch dashboard stats", "error", { autoCloseMs: 2500 });
    return {
      success: false,
      stats: UserSubDepartmentDashboardStatsModel.empty(),
      message: response?.message || "Failed to fetch dashboard stats",
    };
  } catch (error: any) {
    showAlert(error?.message || "Failed to fetch dashboard stats", "error", { autoCloseMs: 2500 });
    return {
      success: false,
      stats: UserSubDepartmentDashboardStatsModel.empty(),
      message: error?.message || "Failed to fetch dashboard stats",
    };
  }
};
