import { useCallback, useState } from "react";
import { bootstrapQcBatchContext, type QcBatchBootstrapResult } from "./qcBatchBootstrap";
import type { QcBatchContext } from "./qcBatchContext";
import type { QcDivisionCatalogItem } from "./qcFlowConfig";
import { getBatchStageProgressArrays } from "../previousStageApproval";
import type { QcPartialItemStatus } from "./qcDivisionApprovalUnits";

export type UseQcBatchBootstrapParams = {
  subDepartmentId?: number | null;
  divisionCatalog: QcDivisionCatalogItem[];
  setDivisionStatusByFlowKey: React.Dispatch<
    React.SetStateAction<Record<string, QcPartialItemStatus>>
  >;
  setBatchStageArrays: React.Dispatch<
    React.SetStateAction<{ stageProgress: unknown; currentStage: unknown }>
  >;
};

export const useQcBatchBootstrap = (params: UseQcBatchBootstrapParams) => {
  const [batchContext, setBatchContext] = useState<QcBatchContext | null>(null);
  const [batchBootstrapLoading, setBatchBootstrapLoading] = useState(false);
  const [lastBootstrap, setLastBootstrap] = useState<QcBatchBootstrapResult | null>(null);

  const runBatchBootstrap = useCallback(
    async (options: {
      batchId: string;
      listRow?: Record<string, unknown> | null;
      formId?: string | null;
    }): Promise<QcBatchBootstrapResult | null> => {
      const batchId = String(options.batchId ?? "").trim();
      if (!batchId) {
        setBatchContext(null);
        setLastBootstrap(null);
        return null;
      }

      setBatchBootstrapLoading(true);
      try {
        const result = await bootstrapQcBatchContext({
          batchId,
          listRow: options.listRow,
          catalog: params.divisionCatalog,
          formId: options.formId,
          subDepartmentId: params.subDepartmentId,
        });
        if (!result) {
          setBatchContext(null);
          setLastBootstrap(null);
          return null;
        }

        setBatchContext(result.context);
        setLastBootstrap(result);
        params.setDivisionStatusByFlowKey(result.context.divisionStatuses);

        const stageArrays = getBatchStageProgressArrays(
          result.batchDetails as Record<string, unknown>,
        );
        params.setBatchStageArrays({
          stageProgress: stageArrays.stageProgress ?? null,
          currentStage: stageArrays.currentStage ?? null,
        });

        return result;
      } finally {
        setBatchBootstrapLoading(false);
      }
    },
    [params.divisionCatalog, params.setBatchStageArrays, params.setDivisionStatusByFlowKey, params.subDepartmentId],
  );

  return {
    batchContext,
    batchBootstrapLoading,
    lastBootstrap,
    runBatchBootstrap,
    setBatchContext,
  };
};
