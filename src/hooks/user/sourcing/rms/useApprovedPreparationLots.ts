import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@app/store/authStore";
import { rawMaterialSourcingController } from "@controllers/user/sourcing/rms/rawMaterialSourcingController";
import {
  buildPreparationLotDropdownOptions,
  getPreparationSourceLotsForMaterial,
  groupPreparationSourceLotsByMaterialCode,
  mapLotListApiRow,
  PREPARATION_SOURCE_MATERIAL,
  toRawMaterialLotListApiStatus,
  type ApprovedPreparationLotLookups,
  type RawMaterialLotListRow,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { OPERATION_STATUS } from "@hooks/operationStatus";

export function useApprovedPreparationLots(enabled = true): ApprovedPreparationLotLookups {
  const subDepartmentId = useAuthStore(
    (state) =>
      state.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")
        ?.subDepartmentId,
  );
  const [lotsByMaterialCode, setLotsByMaterialCode] = useState<
    Record<string, RawMaterialLotListRow[]>
  >({});
  const [loadingLots, setLoadingLots] = useState(false);

  useEffect(() => {
    if (!enabled || !subDepartmentId) {
      setLotsByMaterialCode({});
      setLoadingLots(false);
      return;
    }

    let active = true;
    setLoadingLots(true);

    void (async () => {
      try {
        const response = await rawMaterialSourcingController.fetchLotList({
          subDepartmentId,
          page: 1,
          limit: 500,
          status: [toRawMaterialLotListApiStatus(OPERATION_STATUS.APPROVED)],
        });

        if (!active) return;

        if (response?.success && response.data) {
          const data = response.data as { lots?: unknown[] };
          const lots = (data.lots ?? []).map((lot, index) => mapLotListApiRow(lot, index));
          setLotsByMaterialCode(groupPreparationSourceLotsByMaterialCode(lots));
        } else {
          setLotsByMaterialCode({});
        }
      } catch {
        if (active) {
          setLotsByMaterialCode({});
        }
      } finally {
        if (active) {
          setLoadingLots(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [enabled, subDepartmentId]);

  const getHtpbLotOptions = useCallback(
    (currentValue?: string) =>
      buildPreparationLotDropdownOptions(
        getPreparationSourceLotsForMaterial(lotsByMaterialCode, PREPARATION_SOURCE_MATERIAL.HTPB),
        currentValue,
      ),
    [lotsByMaterialCode],
  );

  const getTmpLotOptions = useCallback(
    (currentValue?: string) =>
      buildPreparationLotDropdownOptions(
        getPreparationSourceLotsForMaterial(lotsByMaterialCode, PREPARATION_SOURCE_MATERIAL.TMP),
        currentValue,
      ),
    [lotsByMaterialCode],
  );

  const getNbdLotOptions = useCallback(
    (currentValue?: string) =>
      buildPreparationLotDropdownOptions(
        getPreparationSourceLotsForMaterial(lotsByMaterialCode, PREPARATION_SOURCE_MATERIAL.NBD),
        currentValue,
      ),
    [lotsByMaterialCode],
  );

  return {
    loadingLots,
    getHtpbLotOptions,
    getTmpLotOptions,
    getNbdLotOptions,
  };
}
