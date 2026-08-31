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

  const clearSetupLoaded = useCallback(
    (flowKey: string, rawMaterialType?: string | null) => {
      const key = resolveSetupKey(flowKey, rawMaterialType);
      setSetupLoadedByKey((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDivisionUiMode("SETUP");
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
      hasBatchUnitData?: boolean;
      requiresManualSetup?: boolean;
    }): QcDivisionUiMode => {
      if (params.blocked) return "BLOCKED";
      if (params.requiresManualSetup && !isSetupLoaded(params.flowKey, params.rawMaterialType)) {
        return "SETUP";
      }
      if (params.hasQcSavedData || params.hasManufacturingData || params.hasBatchUnitData) {
        return "FORM";
      }
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
    clearSetupLoaded,
    resetDivisionNavState,
    resolveInitialUiMode,
  };
};
