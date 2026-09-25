import { useCallback, useEffect, useRef, useState } from "react";
import { mixingController } from "../../../controllers/user/manufacturing/mixingController";
import {
  mapBackendQualityChecksToRows,
  resolveMixingCycleQualityChecks,
  type QualityCheckRow,
} from "../../../data/models/user/MixingFormModel";

export type MixingQualityCheckMixType = "PREMIX" | "FINAL_MIX";

/** Parse qualityChecks from legacy /mixing/quality-checks API response. */
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

export const useMixingQualityChecks = (motorStage?: number, mixingCycleCode?: string) => {
  const [loadingMixType, setLoadingMixType] = useState<MixingQualityCheckMixType | null>(null);
  const [errorByMixType, setErrorByMixType] = useState<
    Partial<Record<MixingQualityCheckMixType, string>>
  >({});
  const cacheRef = useRef<Partial<Record<MixingQualityCheckMixType, QualityCheckRow[]>>>({});
  const motorStageRef = useRef(motorStage);
  const cycleCodeRef = useRef(mixingCycleCode);

  useEffect(() => {
    if (motorStageRef.current === motorStage && cycleCodeRef.current === mixingCycleCode) return;
    motorStageRef.current = motorStage;
    cycleCodeRef.current = mixingCycleCode;
    cacheRef.current = {};
    setErrorByMixType({});
  }, [motorStage, mixingCycleCode]);

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
        let rows: QualityCheckRow[] = [];
        const code = String(mixingCycleCode ?? "").trim();
        if (code) {
          const response = await mixingController.fetchMixingCycleDetails(code);
          const payload =
            response && typeof response === "object"
              ? ((response as { data?: Record<string, unknown> }).data ??
                (response as Record<string, unknown>))
              : null;
          const resolved = resolveMixingCycleQualityChecks(
            payload as Record<string, unknown> | null,
          );
          rows = mapBackendQualityChecksToRows(
            mixType === "FINAL_MIX"
              ? resolved.finalMixQualityChecks
              : resolved.premixQualityChecks,
          );
        }
        if (!rows.length) {
          const response = await mixingController.fetchQualityChecks(
            mixType,
            Number(motorStage) || 0,
          );
          rows = extractQualityChecksFromResponse(response);
        }
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
    [motorStage, mixingCycleCode],
  );

  return {
    loadingMixType,
    errorByMixType,
    ensureQualityChecks,
    isLoaded,
  };
};
