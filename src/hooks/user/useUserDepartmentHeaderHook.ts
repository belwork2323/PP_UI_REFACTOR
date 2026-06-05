import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../app/store/authStore";
import { getUserSubDepartmentDashboardStats } from "../../controllers/user/userController";
import { UserSubDepartmentDashboardStatsModel, UserSubDepartmentDashboardStats } from "../../data/models/user/UserSubDepartmentDashboardStatsModel";

type UseUserDepartmentHeaderHookArgs = {
  deptSlug: string;
  subDeptSlug?: string;
};

export const useUserDepartmentHeaderHook = ({ deptSlug, subDeptSlug }: UseUserDepartmentHeaderHookArgs) => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<UserSubDepartmentDashboardStats>(UserSubDepartmentDashboardStatsModel.empty());

  const userName = user?.username || String(user?.userId || "User");
  const userRole = user?.role ? user.role.replace(/_/g, " ") : "User";

  const selectedSubDepartment = useMemo(
    () =>
      user?.allSubDepartments.find(
        (subDept) => subDept.slugs?.dept === deptSlug && subDept.slugs?.subDept === subDeptSlug,
      ) ?? null,
    [deptSlug, subDeptSlug, user],
  );

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (!selectedSubDepartment?.subDepartmentId) {
        if (!cancelled) setStats(UserSubDepartmentDashboardStatsModel.empty());
        return;
      }

      const response = await getUserSubDepartmentDashboardStats(selectedSubDepartment.subDepartmentId);
      if (!cancelled) {
        setStats(response.stats ?? UserSubDepartmentDashboardStatsModel.empty());
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [selectedSubDepartment?.subDepartmentId]);

  return {
    userName,
    userRole,
    stats,
  };
};

export default useUserDepartmentHeaderHook;
