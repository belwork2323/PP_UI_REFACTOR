import { useState, useCallback, useEffect } from "react";
import { projectManagementController } from "../../../controllers/admin/project_management/projectManagementController";

const getErrorMessage = (error: any): string => {
  // Show API error message if available
  if (error?.error?.details) return error.error.details;
  if (error?.message) return error.message;
  // Fallback to generic error
  return "An error occurred on server";
};

export const useProjectStats = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    projectsCreatedToday: 0,
    projectsCreatedThisMonth: 0,
    activeProjects: 0,
    idleProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await projectManagementController.getProjectStats();
      
      if (resp?.success && resp.data) {
        setStats({
          totalProjects: resp.data.totalProjects || 0,
          projectsCreatedToday: resp.data.projectsCreatedToday || 0,
          projectsCreatedThisMonth: resp.data.projectsCreatedThisMonth || 0,
          activeProjects: resp.data.activeProjects || 0,
          idleProjects: resp.data.idleProjects || 0,
        });
        setError(null);
      } else {
        const errorMsg = getErrorMessage(resp);
        setError(errorMsg);
        setStats({
          totalProjects: 0,
          projectsCreatedToday: 0,
          projectsCreatedThisMonth: 0,
          activeProjects: 0,
          idleProjects: 0,
        });
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err?.response?.data);
      setError(errorMsg);
      setStats({
        totalProjects: 0,
        projectsCreatedToday: 0,
        projectsCreatedThisMonth: 0,
        activeProjects: 0,
        idleProjects: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, loadStats, setError };
};
