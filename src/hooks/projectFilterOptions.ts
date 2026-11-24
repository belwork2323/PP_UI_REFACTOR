import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";

export type ProjectFilterOption = {
  projectId: string;
  projectName: string;
};

const PAGE_SIZE = 1000;

/** Load every project page for subdepartment filter dropdowns. */
export const fetchProjectFilterOptions = async (): Promise<ProjectFilterOption[]> => {
  const requestPage = (page: number) =>
    projectManagementController.getAllProjects({
      page,
      limit: PAGE_SIZE,
      sortBy: "createdOn",
      sortOrder: "desc",
    });

  const firstResponse = await requestPage(1);
  if (!firstResponse?.success || !firstResponse.data) return [];

  const firstData = firstResponse.data as {
    projects?: Array<Record<string, unknown>>;
    pagination?: Record<string, unknown>;
  };
  const pagination = firstData.pagination ?? {};
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const pageLimit = Number(pagination.limit ?? PAGE_SIZE) || PAGE_SIZE;
  const totalPages = Math.max(
    1,
    Number(pagination.totalPages ?? Math.ceil(totalRecords / pageLimit)),
  );

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => requestPage(index + 2)),
  );
  const projectRows = [
    ...(firstData.projects ?? []),
    ...remainingPages.flatMap((response) => {
      if (!response?.success || !response.data) return [];
      const data = response.data as { projects?: Array<Record<string, unknown>> };
      return data.projects ?? [];
    }),
  ];

  const uniqueProjects = new Map<string, ProjectFilterOption>();
  projectRows.forEach((project) => {
    const projectId = String(project.projectId ?? "").trim();
    if (!projectId || uniqueProjects.has(projectId)) return;
    uniqueProjects.set(projectId, {
      projectId,
      projectName: String(project.projectName ?? projectId).trim() || projectId,
    });
  });

  return [...uniqueProjects.values()];
};
