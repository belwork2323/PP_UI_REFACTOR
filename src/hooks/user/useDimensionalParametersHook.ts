import { useCallback, useState } from "react";
import { STRINGS } from "../../app/config/strings";
import { operationsController } from "../../controllers/user/operationsController";
import { DimensionalParameterModel } from "../../data/models/user/SubdepartmentCommonModel";

type ParameterCache = Record<string, DimensionalParameterModel[]>;
type LoadingMap = Record<string, boolean>;
type FetchDimensionalParamsResult = {
  parameters: DimensionalParameterModel[];
  errorMessage: string | null;
};

export const useDimensionalParametersHook = () => {
  const [cache, setCache] = useState<ParameterCache>({});
  const [loadingByMotorType, setLoadingByMotorType] = useState<LoadingMap>({});

  const isLoading = useCallback(
    (motorType: string) => Boolean(loadingByMotorType[motorType]),
    [loadingByMotorType]
  );

  const fetchDimensionalParameters = useCallback(
    async (motorType: string): Promise<FetchDimensionalParamsResult> => {
      const mt = (motorType ?? "").trim().toUpperCase();
      if (!mt) {
        return { parameters: [], errorMessage: null };
      }

      if (cache[mt]) {
        return { parameters: cache[mt], errorMessage: null };
      }

      setLoadingByMotorType((prev) => ({ ...prev, [mt]: true }));
      try {
        const response = await operationsController.fetchDimensionalParametersList({ motorType: mt });

        if (!response?.success || !response.data) {
          const msg = response?.message || STRINGS.SOURCING.CASING_FORM.DIMENSIONAL_PARAMS_FETCH_ERROR;
          return { parameters: [], errorMessage: msg };
        }

        const params = response.data.parameters ?? [];
        setCache((prev) => ({ ...prev, [mt]: params }));
        return { parameters: params, errorMessage: null };
      } catch (error) {
        return {
          parameters: [],
          errorMessage: STRINGS.SOURCING.CASING_FORM.DIMENSIONAL_PARAMS_FETCH_ERROR,
        };
      } finally {
        setLoadingByMotorType((prev) => ({ ...prev, [mt]: false }));
      }
    },
    [cache]
  );

  return {
    fetchDimensionalParameters,
    isLoading,
  };
};

export default useDimensionalParametersHook;
