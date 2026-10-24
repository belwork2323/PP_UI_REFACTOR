import { useEffect, useMemo, useState } from "react";
import { rawMaterialProcurementController } from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  mapLotListApiRow,
  toRawMaterialLotListApiStatus,
} from "../../../data/models/user/RawMaterialProcurementModel";
import { OPERATION_STATUS } from "../../operationStatus";

/**
 * Fallback APPROVED sourcing lots by materialCode when ID-sheet lotIds are empty
 * (common on subscale QC RMP where manufacturing prep never ran).
 */
export const useQcApprovedLotOptions = (
  materialCode: string | null | undefined,
  sheetLotIds: string[],
): string[] => {
  const code = String(materialCode ?? "").trim();
  const sheetHasLots = sheetLotIds.some((id) => String(id ?? "").trim().length > 0);
  const [apiLotIds, setApiLotIds] = useState<string[]>([]);

  useEffect(() => {
    if (!code || sheetHasLots) {
      setApiLotIds([]);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const response = await rawMaterialProcurementController.fetchLotList({
          subDepartmentId: ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID,
          page: 1,
          limit: 500,
          materialCode: [code],
          status: [toRawMaterialLotListApiStatus(OPERATION_STATUS.APPROVED)],
        });
        if (!active) return;
        const data = response?.data as { lots?: unknown[] } | undefined;
        const lots = (data?.lots ?? []).map((lot, index) => mapLotListApiRow(lot, index));
        const ids = lots
          .map((lot) => String(lot.lotId ?? "").trim())
          .filter(Boolean);
        setApiLotIds(Array.from(new Set(ids)));
      } catch {
        if (active) setApiLotIds([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [code, sheetHasLots]);

  return useMemo(
    () => (sheetHasLots ? [] : apiLotIds),
    [sheetHasLots, apiLotIds],
  );
};
