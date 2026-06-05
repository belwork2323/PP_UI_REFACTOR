import { useState, useCallback, useEffect } from "react";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";
import { STRINGS } from "../../../app/config/strings";

export const useUserStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingResetRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await userManagementController.getUserStats();
      if (resp?.success && resp.data) {
        setStats({
          totalUsers: resp.data.totalUsers || 0,
          activeUsers: resp.data.activeUsers || 0,
          inactiveUsers: resp.data.inactiveUsers || 0,
          pendingResetRequests: resp.data.pendingResetRequests || 0,
        });
      }
    } catch (err) {
      console.error(STRINGS.USER_MANAGEMENT.ERRORS.LOAD_STATS_FAILED, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, loadStats };
};
