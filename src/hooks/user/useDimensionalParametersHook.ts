import { useCallback, useState } from "react";
import { STRINGS } from "../../app/config/strings";
import { operationsController } from "../../controllers/user/operationsController";
import { DimensionalParameterModel } from "../../data/models/user/SubdepartmentCommonModel";

type LoadingMap = Record<string, boolean>;
type FetchDimensionalParamsResult = {
  parameters: DimensionalParameterModel[];
  errorMessage: string | null;
};

const cacheKey = (projectId: string, motorType: string) => `${projectId}::${motorType}`;

export const useDimensionalParametersHook = () => {
  const [loadingByKey, setLoadingByKey] = useState<LoadingMap>({});

  const isLoading = useCallback(
    (projectId: string, motorType: string) =>
      Boolean(loadingByKey[cacheKey(projectId, motorType)]),
    [loadingByKey],
  );

  const fetchDimensionalParameters = useCallback(
    async (
      projectId: string,
      motorType: string,
    ): Promise<FetchDimensionalParamsResult> => {
      const pid = (projectId ?? "").trim();
      const mt = (motorType ?? "").trim();
      if (!pid || !mt) {
        return { parameters: [], errorMessage: null };
      }

      const key = cacheKey(pid, mt);
      setLoadingByKey((prev) => ({ ...prev, [key]: true }));
      try {
        const response = await operationsController.fetchDimensionalParametersList({
          projectId: pid,
          motorType: mt,
        });

        if (!response?.success || !response.data) {
          const msg =
            response?.message || STRINGS.SOURCING.CASING_FORM.DIMENSIONAL_PARAMS_FETCH_ERROR;
          return { parameters: [], errorMessage: msg };
        }

        return { parameters: response.data.parameters ?? [], errorMessage: null };
      } catch {
        return {
          parameters: [],
          errorMessage: STRINGS.SOURCING.CASING_FORM.DIMENSIONAL_PARAMS_FETCH_ERROR,
        };
      } finally {
        setLoadingByKey((prev) => ({ ...prev, [key]: false }));
      }
    },
    [],
  );

  return {
    fetchDimensionalParameters,
    isLoading,
  };
};

export default useDimensionalParametersHook;
