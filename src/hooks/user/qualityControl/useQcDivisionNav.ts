import { useCallback, useState } from "react";
import type { QcDivisionUiMode } from "./qcDivisionLoadPipeline";
import { getQcDivisionSetupRegistryEntry } from "./qcDivisionSetupRegistry";

export const useQcDivisionNav = () => {
  const [divisionUiMode, setDivisionUiMode] = useState<QcDivisionUiMode>("FORM");
  const [setupLoadedByKey, setSetupLoadedByKey] = useState<Record<string, boolean>>({});

  const resolveSetupKey = useCallback(
    (flowKey: string, rawMaterialType?: string | null) =>
      `${String(flowKey ?? "").trim()}:${String(rawMaterialType ?? "").trim()}`,
    [],
  );

  const isSetupLoaded = useCallback(
    (flowKey: string, rawMaterialType?: string | null) =>
      Boolean(setupLoadedByKey[resolveSetupKey(flowKey, rawMaterialType)]),
    [resolveSetupKey, setupLoadedByKey],
  );

  const markSetupLoaded = useCallback(
    (flowKey: string, rawMaterialType?: string | null) => {
      const key = resolveSetupKey(flowKey, rawMaterialType);
      setSetupLoadedByKey((prev) => ({ ...prev, [key]: true }));
      setDivisionUiMode("FORM");
    },
    [resolveSetupKey],
  );

  const resetDivisionNavState = useCallback(() => {
    setDivisionUiMode("FORM");
    setSetupLoadedByKey({});
  }, []);

  const resolveInitialUiMode = useCallback(
    (params: {
      blocked: boolean;
      flowKey: string;
      rawMaterialType?: string | null;
      hasManufacturingData: boolean;
      hasQcSavedData: boolean;
    }): QcDivisionUiMode => {
      if (params.blocked) return "BLOCKED";
      if (params.hasQcSavedData || params.hasManufacturingData) return "FORM";
      const entry = getQcDivisionSetupRegistryEntry(params.flowKey, params.rawMaterialType);
      if (entry.hasSetup && !isSetupLoaded(params.flowKey, params.rawMaterialType)) {
        return "SETUP";
      }
      return "FORM";
    },
    [isSetupLoaded],
  );

  return {
    divisionUiMode,
    setDivisionUiMode,
    isSetupLoaded,
    markSetupLoaded,
    resetDivisionNavState,
    resolveInitialUiMode,
  };
};
