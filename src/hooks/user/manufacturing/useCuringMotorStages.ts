import { useCallback, useEffect, useState } from "react";
import { operationsController } from "../../../controllers/user/operationsController";
import type { MotorStageOption } from "../../../data/models/user/curingProjectStageMatrix";

export const useCuringMotorStages = (projectId?: string) => {
  const [stages, setStages] = useState<MotorStageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = projectId?.trim() ? { projectId: projectId.trim() } : undefined;
      const response = await operationsController.fetchMotorsStageList(params);
      if (!response?.success || !response.data) {
        setStages([]);
        setError(String(response?.message ?? "Unable to load motor stages."));
        return;
      }
      setStages(
        (response.data.stages ?? []).map((item) => ({
          motorStage: item.motorStage,
          noOfmotors: item.noOfmotors,
        })),
      );
    } catch {
      setStages([]);
      setError("Unable to load motor stages.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadStages();
  }, [loadStages]);

  return { stages, loading, error, reload: loadStages };
};
