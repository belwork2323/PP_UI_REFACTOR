import { useState, useCallback } from "react";
import { projectManagementController } from "../../../controllers/admin/project_management/projectManagementController";

const getErrorMessage = (error: any): string => {
  // Show API error message if available
  if (error?.error?.details) return error.error.details;
  if (error?.message) return error.message;
  // Fallback to generic error
  return "An error occurred on server";
};

export const useProjectDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [paginationData, setPaginationData] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  });

  const fetchProjectDetails = useCallback(
    async (projectId: string, page: number = 1, limit: number = 10) => {
      if (!projectId) {
        setError("Project ID is required");
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const resp = await projectManagementController.getProjectDetails({
          projectId,
          page,
          limit,
        });

        if (resp?.success) {
          setProjectData(resp.data?.project || null);
          setBatches(resp.data?.batches || []);
          setPaginationData(
            resp.data?.pagination || {
              page: 1,
              limit: 10,
              totalRecords: 0,
              totalPages: 0,
            }
          );
          setError(null);
        } else {
          const errorMsg = getErrorMessage(resp);
          setError(errorMsg);
          setProjectData(null);
          setBatches([]);
          setPaginationData({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
        }
      } catch (err: any) {
        const errorMsg = getErrorMessage(err?.response?.data);
        setError(errorMsg);
        setProjectData(null);
        setBatches([]);
        setPaginationData({ page: 1, limit: 10, totalRecords: 0, totalPages: 0 });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    projectData,
    batches,
    paginationData,
    fetchProjectDetails,
    setError,
  };
};
