import { get, post, put, del } from "@data/api/httpClient";
import { USER_MANAGEMENT } from "@data/api/endPoints";

/* ─────────────────────────────────────────
   API FUNCTIONS
───────────────────────────────────────── */

/**
 * Fetch all users via filtering payload.
 * POST: /admin/user/list
 * payload: { search, role, department, subDepartmentId, status, filterType, startDate, endDate, page, pageSize }
 */
export const fetchAllUsers = async (payload: {
  search?: string;
  role?: string;
  department?: string;
  subDepartmentId?: number | null;
  status?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}) => {
  return post(USER_MANAGEMENT.GET_ALL_USERS, payload);
};

/**
 * Fetch User statistics.
 * GET: /admin/user/stats
 */
export const fetchUserStats = async (payload) => {
  return post(USER_MANAGEMENT.GET_STATS, payload);
};

/**
 * Fetch a single user by UUID.
 * POST: /admin/user/details
 */
export const fetchUserById = async (uuid) => {
  return post(USER_MANAGEMENT.GET_USER_BY_ID, { user_uuid: uuid });
};

/**
 * Create a new user.
 * POST: /admin/user/create
 */
export const createUser = async (payload) => {
  return post(USER_MANAGEMENT.CREATE_USER, payload);
};

/**
 * Update an existing user.
 * PUT: /admin/user/update
 */
export const updateUser = async (payload) => {
  return put(USER_MANAGEMENT.UPDATE_USER, payload);
};

/**
 * Delete a user by UUID.
 * DELETE: /admin/user
 */
export const deleteUser = async (uuid) => {
  return del(USER_MANAGEMENT.DELETE_USER, { data: { user_uuid: uuid } });
};

/**
 * Activate an inactive user by UUID.
 * POST: /admin/user/activate
 */
export const activateUser = async (uuid) => {
  return post(USER_MANAGEMENT.ACTIVATE_USER, { user_uuid: uuid });
};

/**
 * List password reset requests.
 * POST: /admin/reset-password/list
 */
export const fetchPasswordResetRequests = async (payload: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) => {
  return post(USER_MANAGEMENT.PASSWORD_RESET_LIST, {
    search: payload.search ?? "",
    status: payload.status ?? "ALL",
    startDate: payload.startDate ?? "",
    endDate: payload.endDate ?? "",
    page: payload.page ?? 1,
    pageSize: payload.pageSize ?? 10,
  });
};

/**
 * Approve or reject a password reset request.
 * POST: /admin/reset-password/changeStatus
 */
export const changePasswordResetStatus = async (payload: {
  requestId: string;
  action: "APPROVE" | "REJECT";
  remarks?: string;
}) => {
  return post(USER_MANAGEMENT.PASSWORD_RESET_CHANGE_STATUS, payload);
};
