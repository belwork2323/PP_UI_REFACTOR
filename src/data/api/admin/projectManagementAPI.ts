import { get, post, del } from "../httpClient";
import { ADMIN_ENDPOINTS } from "../endPoints";

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
 * Fetch single project by ID with batch details and pagination
 * @param payload - { projectId, page, limit }
 */
export const fetchProjectDetails = (payload: any) =>
  post(ADMIN_ENDPOINTS.PROJECT.DETAILS, payload);

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

