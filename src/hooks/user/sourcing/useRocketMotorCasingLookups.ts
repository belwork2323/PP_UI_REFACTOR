import { useCallback, useEffect, useMemo, useState } from "react";
import { projectManagementController } from "../../../controllers/admin/project_management/projectManagementController";
import { operationsController } from "../../../controllers/user/operationsController";

export type ProjectOption = { projectId: string; projectName: string };
export type MotorStageOption = { motorStage: string; noOfmotors: number };

export const useRocketMotorCasingLookups = () => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [motorStages, setMotorStages] = useState<MotorStageOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResp, motorStageResp] = await Promise.all([
        projectManagementController.getAllProjects({
          page: 1,
          limit: 1000,
          sortBy: "createdOn",
          sortOrder: "desc",
        }),
        operationsController.fetchMotorsStageList(),
      ]);

      if (projectResp?.success && projectResp.data) {
        const raw = (projectResp.data as { projects?: unknown[] }).projects ?? [];
        setProjects(
          raw.map((p: any) => ({
            projectId: String(p.projectId ?? ""),
            projectName: String(p.projectName ?? p.projectId ?? ""),
          }))
        );
      } else {
        setProjects([]);
      }

      if (motorStageResp?.success && motorStageResp.data) {
        setMotorStages(
          (motorStageResp.data.stages ?? []).map((s: any) => ({
            motorStage: String(s.motorStage ?? ""),
            noOfmotors: Number(s.noOfmotors ?? 0),
          }))
        );
      } else {
        setMotorStages([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const motorNoOptions = useCallback(
    (motorStage: string) => {
      const stage = motorStages.find((s) => s.motorStage === motorStage);
      const count = stage?.noOfmotors ?? 0;
      return Array.from({ length: count }, (_, i) => String(i + 1));
    },
    [motorStages]
  );

  return useMemo(
    () => ({
      projects,
      motorStages,
      loading,
      motorNoOptions,
      reload: loadLookups,
    }),
    [projects, motorStages, loading, motorNoOptions, loadLookups]
  );
};

export default useRocketMotorCasingLookups;
