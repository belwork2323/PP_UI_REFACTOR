import {
  fetchAllUsers,
  fetchUserStats,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  fetchPasswordResetRequests,
  changePasswordResetStatus,
} from "@data/api/admin/UserManagement/userManagementApi";
import {
  UserListItemModel,
  CreateUserPayload,
} from "@data/models/admin/UserManagement/UserManagementModel";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";

export const userManagementController = {
  /* ─────────────────────────────
     Fetch user list
  ───────────────────────────── */
  getAllUsers: async (payload: any) => {
    try {
      const resp = await fetchAllUsers(payload);
      return new ApiResponseModel(resp, (res) => {
        const rawUsers = res?.data?.users || [];
        const pagination = res?.data?.pagination || {
          page: 1,
          pageSize: 10,
          totalRecords: 0,
          totalPages: 0,
        };
        return {
          users: rawUsers.map((u: any) => UserListItemModel.fromApi(u)),
          pagination,
        };
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Fetch stats
  ───────────────────────────── */
  getUserStats: async (payload) => {
    try {
      const resp = await fetchUserStats(payload);
      return new ApiResponseModel(resp); // default handles res.data
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Fetch single user
  ───────────────────────────── */
  getUserById: async (uuid: string) => {
    try {
      const resp = await fetchUserById(uuid);
      return new ApiResponseModel(resp, (res) => UserListItemModel.fromApi(res?.data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Create user
  ───────────────────────────── */
  createUser: async (form: any) => {
    try {
      const finalPayload = {
        userId: form.userId,
        username: form.username,
        roleId: form.roleId,
        subDepartmentIds: form.subDepartmentIds,
      };
      const response = await createUser(finalPayload);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Update user
  ───────────────────────────── */
  updateUser: async (form: any) => {
    try {
      const response = await updateUser(form);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Delete user
  ───────────────────────────── */
  deleteUser: async (uuid: string) => {
    try {
      const response = await deleteUser(uuid);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Activate inactive user
  ───────────────────────────── */
  activateUser: async (uuid: string) => {
    try {
      const response = await activateUser(uuid);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Password reset requests
  ───────────────────────────── */
  getPasswordResetRequests: async (payload: any) => {
    try {
      const response = await fetchPasswordResetRequests(payload);
      return new ApiResponseModel(response, (res) => res?.data ?? null);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  changePasswordResetStatus: async (payload: {
    requestId: string;
    action: "APPROVE" | "REJECT";
    remarks?: string;
  }) => {
    try {
      const response = await changePasswordResetStatus(payload);
      return new ApiResponseModel(response, (res) => res?.data ?? null);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};
