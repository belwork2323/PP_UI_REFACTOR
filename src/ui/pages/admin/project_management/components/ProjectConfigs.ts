/**
 * Utility functions to extract data from project model
 * Provides a single source of truth for field access
 */

export const getProjectName = (p: any) => p?.projectName || "--";
export const getProjectId = (p: any) => p?.projectId || "--";
export const getProjectDescription = (p: any) => p?.projectDescription || "--";
export const getProjectDate = (p: any) => p?.projectDate || "--";
export const getCreatedOn = (p: any) => p?.createdOn || "--";

/**
 * Date formatter for display
 */
export const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Date and time formatter for display
 */
export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
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
