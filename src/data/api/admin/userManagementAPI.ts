import { get, post, put, del } from "../httpClient";
import { USER_MANAGEMENT } from "../endPoints";

/* ─────────────────────────────────────────
   API FUNCTIONS
───────────────────────────────────────── */

/**
 * Fetch all users via filtering payload.
 * POST: /admin/user/list
 */
export const fetchAllUsers = async (payload) => {
  return post(USER_MANAGEMENT.GET_ALL_USERS, payload);
};

/**
 * Fetch User statistics.
 * GET: /admin/user/stats
 */
export const fetchUserStats = async () => {
  return get(USER_MANAGEMENT.GET_STATS);
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
 * Reset a user's password.
 * (Keeping existing mock routing format for now)
 */
export const resetUserPassword = async (id) => {
  return post(USER_MANAGEMENT.RESET_PASSWORD(id), {});
};