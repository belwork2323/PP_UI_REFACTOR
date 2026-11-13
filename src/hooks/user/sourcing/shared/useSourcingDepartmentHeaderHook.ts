import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@app/store/authStore";
import { useUserBatchRefreshStore } from "@app/store/userBatchRefreshStore";
import {
  UserSubDepartmentDashboardStatsModel,
  type DepartmentHeaderStatItem,
} from "@data/models/user/UserSubDepartmentDashboardStatsModel";
import { RawMaterialSourcingStatsModel } from "@data/models/user/sourcing/rms/RawMaterialSourcingStatsModel";
import { RocketMotorCasingStatsModel } from "@data/models/user/RocketMotorCasingStatsModel";

type SubDepartmentHeaderStats = {
  empty: () => DepartmentHeaderStatItem[];
  fetch: (subDepartmentId: number) => Promise<DepartmentHeaderStatItem[]>;
};

/** Controllers are imported lazily so each subdepartment only loads its own API layer. */
const SUB_DEPARTMENT_HEADER_STATS: Record<string, SubDepartmentHeaderStats> = {
  "raw-material": {
    empty: () => RawMaterialSourcingStatsModel.toStatItems(RawMaterialSourcingStatsModel.empty()),
    fetch: async (subDepartmentId) => {
      const { rawMaterialSourcingController } = await import(
        "@controllers/user/sourcing/rms/rawMaterialSourcingController"
      );
      const response = await rawMaterialSourcingController.fetchStats(subDepartmentId);
      return RawMaterialSourcingStatsModel.toStatItems(
        response?.data ?? RawMaterialSourcingStatsModel.empty(),
      );
    },
  },
  "rocket-motor": {
    empty: () => RocketMotorCasingStatsModel.toStatItems(RocketMotorCasingStatsModel.empty()),
    fetch: async (subDepartmentId) => {
      const { rocketMotorCasingController } = await import(
        "@controllers/user/sourcing/rocketMotorCasingController"
      );
      const response = await rocketMotorCasingController.fetchStats(subDepartmentId);
      return RocketMotorCasingStatsModel.toStatItems(
        response?.data ?? RocketMotorCasingStatsModel.empty(),
      );
    },
  },
};

export const useSourcingDepartmentHeaderHook = (subDeptSlug: string) => {
  const user = useAuthStore((state) => state.user);
  const refreshVersion = useUserBatchRefreshStore((state) => state.version);
  const subDepartmentId = user?.allSubDepartments.find(
    (sd) => sd.slugs?.subDept === subDeptSlug
  )?.subDepartmentId;
  const headerStats = SUB_DEPARTMENT_HEADER_STATS[subDeptSlug];
  const [loaded, setLoaded] = useState<{ slug: string; items: DepartmentHeaderStatItem[] } | null>(
    null,
  );

  const userName = user?.username || String(user?.userId || "User");
  const userRole = user?.role ? user.role.replace(/_/g, " ") : "User";

  useEffect(() => {
    if (!headerStats) return;
    let cancelled = false;

    const loadStats = async () => {
      const items = subDepartmentId ? await headerStats.fetch(subDepartmentId) : headerStats.empty();
      if (!cancelled) setLoaded({ slug: subDeptSlug, items });
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [headerStats, subDeptSlug, subDepartmentId, refreshVersion]);

  const statItems: DepartmentHeaderStatItem[] | undefined = useMemo(() => {
    if (!headerStats) return undefined;
    return loaded?.slug === subDeptSlug ? loaded.items : headerStats.empty();
  }, [headerStats, loaded, subDeptSlug]);

  const stats = UserSubDepartmentDashboardStatsModel.empty();

  return {
    userName,
    userRole,
    stats,
    statItems,
  };
};

export default useSourcingDepartmentHeaderHook;
