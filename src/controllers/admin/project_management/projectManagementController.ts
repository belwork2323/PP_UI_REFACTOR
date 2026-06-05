import {
  fetchAllProjects,
  fetchProjectStats,
  fetchProjectDetails,
  createProject,
  updateProject,
  deleteProject,
} from "../../../data/api/admin/projectManagementAPI";
import {
  ProjectListItemModel,
  ProjectStatsModel,
  CreateProjectPayload,
} from "../../../data/models/admin/ProjectManagementModel";
import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";

export const projectManagementController = {
  /* ─────────────────────────────
     Fetch project list
  ───────────────────────────── */
  getAllProjects: async (payload: any) => {
    try {
      const resp = await fetchAllProjects(payload);
      return new ApiResponseModel(resp, (res) => {
        const rawProjects = res?.data?.projects || [];
        const pagination = res?.data?.pagination || { page: 1, limit: 10, totalRecords: 0, totalPages: 0 };
        return {
          projects: rawProjects.map((p: any) => ProjectListItemModel.fromApi(p)),
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
  getProjectStats: async () => {
    try {
      const resp = await fetchProjectStats();
      return new ApiResponseModel(resp, (res) => ProjectStatsModel.fromApi(res?.data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Fetch project details with batches
  ───────────────────────────── */
  getProjectDetails: async (payload: any) => {
    try {
      const resp = await fetchProjectDetails(payload);
      return new ApiResponseModel(resp, (res) => {
        return {
          project: res?.data?.project || {},
          batches: res?.data?.batches || [],
          pagination: res?.data?.pagination || { page: 1, limit: 10, totalRecords: 0, totalPages: 0 },
        };
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Create project
  ───────────────────────────── */
  createProject: async (form: CreateProjectPayload) => {
    try {
      const finalPayload = {
        projectName: form.projectName,
        projectDescription: form.projectDescription,
      };
      const response = await createProject(finalPayload);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Update project
  ───────────────────────────── */
  updateProject: async (form: any) => {
    try {
      const response = await updateProject(form);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Delete project
  ───────────────────────────── */
  deleteProject: async (projectId: string) => {
    try {
      const response = await deleteProject(projectId);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};
