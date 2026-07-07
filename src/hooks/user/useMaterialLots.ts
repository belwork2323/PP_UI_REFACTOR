import { useCallback, useEffect, useState } from "react";
import { operationsController } from "../../controllers/user/operationsController";
import type { MaterialLotItem } from "../../data/models/user/SubdepartmentCommonModel";

export const useMaterialLots = (batchId?: string) => {
  const [lots, setLots] = useState<MaterialLotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLots = useCallback(async () => {
    const id = batchId?.trim();
    if (!id) {
      setLots([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await operationsController.fetchMaterialLots({ batchId: id });
      if (!response?.success || !response.data) {
        setLots([]);
        setError(String(response?.message ?? "Unable to load material lots."));
        return;
      }
      setLots(response.data.materials ?? []);
    } catch {
      setLots([]);
      setError("Unable to load material lots.");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void loadLots();
  }, [loadLots]);

  return { lots, loading, error, reload: loadLots };
};
