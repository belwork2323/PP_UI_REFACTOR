import { useCallback, useEffect, useRef, useState } from "react";
import { mixingController } from "../../../controllers/user/manufacturing/mixingController";
import {
  mapBackendQualityChecksToRows,
  type QualityCheckRow,
} from "../../../data/models/user/MixingFormModel";

export type MixingQualityCheckMixType = "PREMIX" | "FINAL_MIX";

/** Parse qualityChecks from API response (supports nested data shapes). */
export const extractQualityChecksFromResponse = (response: unknown): QualityCheckRow[] => {
  const root =
    response && typeof response === "object" ? (response as Record<string, unknown>) : null;
  const data =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const nested =
    data?.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : null;

  const checks =
    (Array.isArray(nested?.qualityChecks) ? nested.qualityChecks : null) ??
    (Array.isArray(data?.qualityChecks) ? data.qualityChecks : null) ??
    (Array.isArray(root?.qualityChecks) ? root.qualityChecks : null) ??
    [];

  return mapBackendQualityChecksToRows(checks);
};

export const useMixingQualityChecks = (motorStage?: number) => {
  const [loadingMixType, setLoadingMixType] = useState<MixingQualityCheckMixType | null>(null);
  const [errorByMixType, setErrorByMixType] = useState<
    Partial<Record<MixingQualityCheckMixType, string>>
  >({});
  const cacheRef = useRef<Partial<Record<MixingQualityCheckMixType, QualityCheckRow[]>>>({});
  const motorStageRef = useRef(motorStage);

  useEffect(() => {
    if (motorStageRef.current === motorStage) return;
    motorStageRef.current = motorStage;
    cacheRef.current = {};
    setErrorByMixType({});
  }, [motorStage]);

  const isLoaded = useCallback(
    (mixType: MixingQualityCheckMixType) => Boolean(cacheRef.current[mixType]?.length),
    [],
  );

  const ensureQualityChecks = useCallback(
    async (mixType: MixingQualityCheckMixType): Promise<QualityCheckRow[]> => {
      const cached = cacheRef.current[mixType];
      if (cached?.length) return cached;

      setLoadingMixType(mixType);
      setErrorByMixType((prev) => {
        const next = { ...prev };
        delete next[mixType];
        return next;
      });

      try {
        const response = await mixingController.fetchQualityChecks(
          mixType,
          Number(motorStage) || 0,
        );
        const rows = extractQualityChecksFromResponse(response);
        if (rows.length) {
          cacheRef.current[mixType] = rows;
        }
        return rows;
      } catch (error) {
        console.warn("Failed to fetch mixing quality checks:", error);
        const message =
          error instanceof Error ? error.message : "Failed to load quality checks";
        setErrorByMixType((prev) => ({ ...prev, [mixType]: message }));
        return [];
      } finally {
        setLoadingMixType((current) => (current === mixType ? null : current));
      }
    },
    [motorStage],
  );

  return {
    loadingMixType,
    errorByMixType,
    ensureQualityChecks,
    isLoaded,
  };
};
