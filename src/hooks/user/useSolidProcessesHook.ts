import { useCallback, useState } from "react";
import { STRINGS } from "../../app/config/strings";
import { useAlertStore } from "../../app/store/alertStore";
import { operationsController } from "../../controllers/user/operationsController";
import { SolidProcessItemModel } from "../../data/models/user/SubdepartmentCommonModel";

type ProcessCache = Record<string, SolidProcessItemModel[]>;
type LoadingMap = Record<string, boolean>;

export const useSolidProcessesHook = () => {
  const showAlert = useAlertStore.getState().showAlert;
  const [cache, setCache] = useState<ProcessCache>({});
  const [loadingByMaterialType, setLoadingByMaterialType] = useState<LoadingMap>({});

  const isLoading = useCallback(
    (materialType: string) => Boolean(loadingByMaterialType[materialType]),
    [loadingByMaterialType]
  );

  const fetchSolidProcesses = useCallback(
    async (materialType: string): Promise<SolidProcessItemModel[]> => {
      const key = (materialType ?? "").trim().toLowerCase();
      if (!key) return [];

      if (cache[key]) return cache[key];

      setLoadingByMaterialType((prev) => ({ ...prev, [key]: true }));
      try {
        const response = await operationsController.fetchSolidProcessesList({ materialType: key });

        if (!response?.success || !response.data) {
          const msg = response?.message || STRINGS.SOURCING.COMMON_PROCESSES_FETCH_ERROR;
          showAlert(msg, "error");
          return [];
        }

        const processes = response.data.processes ?? [];
        setCache((prev) => ({ ...prev, [key]: processes }));
        return processes;
      } catch (error) {
        showAlert(STRINGS.SOURCING.COMMON_PROCESSES_FETCH_ERROR, "error");
        return [];
      } finally {
        setLoadingByMaterialType((prev) => ({ ...prev, [key]: false }));
      }
    },
    [cache, showAlert]
  );

  return {
    fetchSolidProcesses,
    isLoading,
  };
};

export default useSolidProcessesHook;
