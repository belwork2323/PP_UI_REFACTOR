import { useCallback, useState } from "react";
import { systemManagerController } from "../../controllers/system_manager/systemManagerController";
import { BatchSubDeptStagesModel } from "../../data/models/SystemManagerModel";

export const useBatchSubDeptStages = () => {
  const [subDeptStages, setSubDeptStages] = useState<BatchSubDeptStagesModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubDeptStages = useCallback(async (batchId: string, departmentId: number) => {
    if (!batchId || !departmentId) {
      setSubDeptStages(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await systemManagerController.getBatchSubDeptStages({
        batchId,
        departmentId,
      });
      if (result.success && result.subDeptStages) {
        setSubDeptStages(result.subDeptStages);
      } else {
        setError(result.message || "Failed to fetch sub-department stages");
        setSubDeptStages(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubDeptStages(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubDeptStages(null);
    setError(null);
    setLoading(false);
  }, []);

  return { subDeptStages, loading, error, fetchSubDeptStages, reset };
};

export default useBatchSubDeptStages;
