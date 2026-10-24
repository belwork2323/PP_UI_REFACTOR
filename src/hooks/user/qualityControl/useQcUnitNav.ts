import { useCallback } from "react";
import {
  canShowQcDivisionUi,
  getQcDivisionBlockedReason,
  type QcBatchContext,
} from "./qcBatchContext";

export const useQcUnitNav = () => {
  const canShowDivision = useCallback(
    (flowKey: string, batchContext: QcBatchContext | null, rawMaterialType?: string | null) => {
      if (!batchContext) return false;
      return canShowQcDivisionUi(flowKey, batchContext.units, rawMaterialType, {
        batchType: batchContext.batchType,
        subBatchType: batchContext.subBatchType,
      });
    },
    [],
  );

  const getBlockedReason = useCallback(
    (flowKey: string, batchContext: QcBatchContext | null, rawMaterialType?: string | null) => {
      if (!batchContext) {
        return "Cannot show QC UI — batch details are not loaded.";
      }
      return getQcDivisionBlockedReason(flowKey, batchContext.units, rawMaterialType, {
        batchType: batchContext.batchType,
        subBatchType: batchContext.subBatchType,
      });
    },
    [],
  );

  return { canShowDivision, getBlockedReason };
};
