import { useCallback, useState } from "react";
import { STRINGS } from "../../app/config/strings";
import { operationsController } from "../../controllers/user/operationsController";
import { DimensionalParameterModel } from "../../data/models/user/SubdepartmentCommonModel";

type LoadingMap = Record<string, boolean>;
type FetchDimensionalParamsResult = {
  parameters: DimensionalParameterModel[];
  errorMessage: string | null;
};

export const useDimensionalParametersHook = () => {
  const [loadingByMotorType, setLoadingByMotorType] = useState<LoadingMap>({});

  const isLoading = useCallback(
    (motorType: string) => Boolean(loadingByMotorType[motorType]),
    [loadingByMotorType],
  );

  const fetchDimensionalParameters = useCallback(
    async (motorType: string): Promise<FetchDimensionalParamsResult> => {
      const mt = (motorType ?? "").trim();
      if (!mt) {
        return { parameters: [], errorMessage: null };
      }

      setLoadingByMotorType((prev) => ({ ...prev, [mt]: true }));
      try {
        // Always fetch fresh — admin master-data changes must appear without a full page reload.
        const response = await operationsController.fetchDimensionalParametersList({
          motorType: mt,
        });

        if (!response?.success || !response.data) {
          const msg = response?.message || STRINGS.SOURCING.CASING_FORM.DIMENSIONAL_PARAMS_FETCH_ERROR;
          return { parameters: [], errorMessage: msg };
        }

        return { parameters: response.data.parameters ?? [], errorMessage: null };
      } catch {
        return {
          parameters: [],
          errorMessage: STRINGS.SOURCING.CASING_FORM.DIMENSIONAL_PARAMS_FETCH_ERROR,
        };
      } finally {
        setLoadingByMotorType((prev) => ({ ...prev, [mt]: false }));
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
