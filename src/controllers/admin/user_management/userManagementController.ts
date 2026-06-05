import {
  fetchAllUsers,
  fetchUserStats,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../../../data/api/admin/userManagementAPI";
import {
  UserListItemModel,
  CreateUserPayload,
} from "../../../data/models/admin/UserManagementModel";
import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";

export const userManagementController = {
  /* ─────────────────────────────
     Fetch user list
  ───────────────────────────── */
  getAllUsers: async (payload: any) => {
    try {
      const resp = await fetchAllUsers(payload);
      return new ApiResponseModel(resp, (res) => {
        const rawUsers = res?.data?.users || [];
        const pagination = res?.data?.pagination || { page: 1, pageSize: 10, totalRecords: 0, totalPages: 0 };
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
  getUserStats: async () => {
    try {
      const resp = await fetchUserStats();
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
     Reset user password
  ───────────────────────────── */
  resetPassword: async (id: string) => {
    try {
      const response = await resetUserPassword(id);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};