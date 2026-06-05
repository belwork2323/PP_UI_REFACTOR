import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { rawMaterialProcurementController } from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { rocketMotorCasingController } from "../../../controllers/user/sourcing/rocketMotorCasingController";
import { UserSubDepartmentDashboardStatsModel } from "../../../data/models/user/UserSubDepartmentDashboardStatsModel";
import {
  RawMaterialProcurementStatsModel,
  type DepartmentHeaderStatItem,
} from "../../../data/models/user/RawMaterialProcurementStatsModel";
import { RocketMotorCasingStatsModel } from "../../../data/models/user/RocketMotorCasingStatsModel";

export const useSourcingDepartmentHeaderHook = (subDeptSlug: string) => {
  const user = useAuthStore((state) => state.user);
  const subDepartmentId = user?.allSubDepartments.find(
    (sd) => sd.slugs?.subDept === subDeptSlug
  )?.subDepartmentId;
  const [rawMaterialStats, setRawMaterialStats] = useState(
    RawMaterialProcurementStatsModel.empty()
  );
  const [rocketMotorStats, setRocketMotorStats] = useState(
    RocketMotorCasingStatsModel.empty()
  );

  const userName = user?.username || String(user?.userId || "User");
  const userRole = user?.role ? user.role.replace(/_/g, " ") : "User";

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (subDeptSlug === "raw-material") {
        if (!subDepartmentId) {
          if (!cancelled) setRawMaterialStats(RawMaterialProcurementStatsModel.empty());
          return;
        }
        const response = await rawMaterialProcurementController.fetchStats(subDepartmentId);
        if (!cancelled) {
          setRawMaterialStats(response?.data ?? RawMaterialProcurementStatsModel.empty());
        }
        return;
      }

      if (subDeptSlug === "rocket-motor") {
        if (!subDepartmentId) {
          if (!cancelled) setRocketMotorStats(RocketMotorCasingStatsModel.empty());
          return;
        }
        const response = await rocketMotorCasingController.fetchStats(subDepartmentId);
        if (!cancelled) {
          setRocketMotorStats(response?.data ?? RocketMotorCasingStatsModel.empty());
        }
        return;
      }

      if (!cancelled) {
        setRawMaterialStats(RawMaterialProcurementStatsModel.empty());
        setRocketMotorStats(RocketMotorCasingStatsModel.empty());
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [subDeptSlug, subDepartmentId]);

  const statItems: DepartmentHeaderStatItem[] | undefined = useMemo(() => {
    if (subDeptSlug === "raw-material") {
      return RawMaterialProcurementStatsModel.toStatItems(rawMaterialStats);
    }
    if (subDeptSlug === "rocket-motor") {
      return RocketMotorCasingStatsModel.toStatItems(rocketMotorStats);
    }
    return undefined;
  }, [subDeptSlug, rawMaterialStats, rocketMotorStats]);

  const stats = UserSubDepartmentDashboardStatsModel.empty();

  return {
    userName,
    userRole,
    stats,
    statItems,
  };
};

export default useSourcingDepartmentHeaderHook;
