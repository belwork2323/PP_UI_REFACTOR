import { get, post } from "../httpClient";
import { USER_ENDPOINTS } from "../endPoints";

export const fetchUsers = async () => get("/api/users");

export const createUser = async (userData: unknown) => post("/api/users", userData);

export const fetchUserSubDepartmentDashboardStats = async (payload: { subDepartmentId: number }) =>
	post(USER_ENDPOINTS.SUBDEPT_DASHBOARD_STATS, payload);
