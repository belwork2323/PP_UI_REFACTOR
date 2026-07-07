export const getProjectName = (p: any) => p?.projectName || "--";
export const getProjectId = (p: any) => p?.projectId || "--";
export const getProjectDescription = (p: any) => p?.projectDescription || "--";
export const getProjectDate = (p: any) => p?.projectDate || "--";
export const getCreatedOn = (p: any) => p?.createdOn || "--";

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};
