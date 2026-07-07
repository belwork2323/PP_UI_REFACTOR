import { useCallback, useState } from "react";
import { systemManagerController } from "../../controllers/system_manager/systemManagerController";
import { BatchStagesModel } from "../../data/models/SystemManagerModel";

export const useBatchStages = () => {
  const [batchStages, setBatchStages] = useState<BatchStagesModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchStages = useCallback(async (batchId: string) => {
    if (!batchId) {
      setBatchStages(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await systemManagerController.getBatchStages({ batchId });
      if (result.success && result.batchStages) {
        setBatchStages(result.batchStages);
      } else {
        setError("Failed to fetch batch stages");
        setBatchStages(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setBatchStages(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { batchStages, loading, error, fetchBatchStages };
};

export default useBatchStages;
