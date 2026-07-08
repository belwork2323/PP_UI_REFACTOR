import { get, post, del } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

/**
 * Fetch all projects with pagination and filters
 * @param payload - { page, limit, search?, fromDate?, toDate?, sortBy?, sortOrder? }
 */
export const fetchAllProjects = (payload: any) =>
  post(ADMIN_ENDPOINTS.PROJECT.LIST, payload);

/**
 * Fetch project statistics
 */
export const fetchProjectStats = () =>
  get(ADMIN_ENDPOINTS.PROJECT.STATS);

/**
 * Create new project
 */
export const createProject = (payload: any) =>
  post(ADMIN_ENDPOINTS.PROJECT.CREATE, payload);

/**
 * Update project
 * @param payload - { projectId, projectName?, projectDescription? }
 */
export const updateProject = (payload: any) =>
  post(ADMIN_ENDPOINTS.PROJECT.UPDATE, payload);

/**
 * Delete project
 */
export const deleteProject = (projectId: string) =>
  del(ADMIN_ENDPOINTS.PROJECT.DELETE, {
    data: { projectId },
  });

