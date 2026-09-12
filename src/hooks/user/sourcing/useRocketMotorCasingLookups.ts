import { useCallback, useMemo, useState } from "react";
import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";
import { fetchUnitList } from "@data/api/common/generalAPI";
import {
  operationsController,
  type InsulationTypeOption,
} from "../../../controllers/user/operationsController";

export type ProjectOption = { projectId: string; projectName: string };
export type MotorStageOption = { motorStage: string; noOfmotors: number };
export type UnitOption = { value: string; label: string };
export type { InsulationTypeOption };

export const useRocketMotorCasingLookups = () => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [motorStages, setMotorStages] = useState<MotorStageOption[]>([]);
  const [insulationTypes, setInsulationTypes] = useState<InsulationTypeOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResp, motorStageResp, insulationTypeResp, units] = await Promise.all([
        projectManagementController.getAllProjects({
          page: 1,
          limit: 1000,
          sortBy: "createdOn",
          sortOrder: "desc",
        }),
        operationsController.fetchMotorsStageList(),
        operationsController.fetchInsulationTypeList(),
        fetchUnitList(),
      ]);

      if (projectResp?.success && projectResp.data) {
        const raw = (projectResp.data as { projects?: unknown[] }).projects ?? [];
        setProjects(
          raw.map((p: any) => ({
            projectId: String(p.projectId ?? ""),
            projectName: String(p.projectName ?? p.projectId ?? ""),
          })),
        );
      } else {
        setProjects([]);
      }

      if (motorStageResp?.success && motorStageResp.data) {
        setMotorStages(
          (motorStageResp.data.stages ?? []).map((s: any) => ({
            motorStage: String(s.motorStage ?? ""),
            noOfmotors: Number(s.noOfmotors ?? 0),
          })),
        );
      } else {
        setMotorStages([]);
      }

      if (insulationTypeResp?.success && insulationTypeResp.data) {
        setInsulationTypes(insulationTypeResp.data);
      } else {
        setInsulationTypes([]);
      }

      setUnitOptions(
        units.map((item) => {
          const symbol = String(item.symbol || item.unitCode || "").trim();
          const name = String(item.name || "").trim();
          const value = symbol || name || String(item.unitCode || "").trim();
          const label =
            symbol && name ? `${symbol} — ${name}` : name || symbol || String(item.unitCode || "").trim();
          return { value, label };
        }).filter((item) => Boolean(item.value)),
      );
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Load once when opening Create Motor (or refresh if already loaded). */
  const ensureLoaded = useCallback(async () => {
    if (hasLoaded || loading) return;
    await loadLookups();
  }, [hasLoaded, loading, loadLookups]);

  const motorNoOptions = useCallback(
    (motorStage: string) => {
      const stage = motorStages.find((s) => s.motorStage === motorStage);
      const count = stage?.noOfmotors ?? 0;
      return Array.from({ length: count }, (_, i) => String(i + 1));
    },
    [motorStages],
  );

  return useMemo(
    () => ({
      projects,
      motorStages,
      insulationTypes,
      unitOptions,
      loading,
      hasLoaded,
      motorNoOptions,
      reload: loadLookups,
      ensureLoaded,
    }),
    [projects, motorStages, insulationTypes, unitOptions, loading, hasLoaded, motorNoOptions, loadLookups, ensureLoaded],
  );
};

export default useRocketMotorCasingLookups;
