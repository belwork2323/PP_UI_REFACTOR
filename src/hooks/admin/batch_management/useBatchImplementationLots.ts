import { useCallback, useEffect, useState } from "react";

import { operationsController } from "../../../controllers/user/operationsController";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import {
  mapLotListApiRow,
  toRawMaterialLotListApiStatus,
  type RawMaterialLotListRow,
} from "../../../data/models/user/RawMaterialProcurementModel";
import { OPERATION_STATUS } from "../../operationStatus";

/** Raw material procurement sub-department used for admin lot-list API calls */
export const ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID = 1;

export type BatchMaterialOption = {
  materialCode: string;
  materialName: string;
};

const normalizeMaterialsList = (items: MaterialsListItem[]): BatchMaterialOption[] =>
  toMaterialCodeNameOptions(items);

export const normalizeMaterialCodeKey = (code: string | undefined | null): string =>
  String(code ?? "").trim().toUpperCase();

const groupLotsByMaterialCode = (lots: RawMaterialLotListRow[]) => {
  const grouped: Record<string, RawMaterialLotListRow[]> = {};
  for (const lot of lots) {
    const code = normalizeMaterialCodeKey(lot.materialCode);
    if (!code) continue;
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(lot);
  }
  return grouped;
};

type UseBatchImplementationLotsArgs = {
  open: boolean;
};

export const useBatchImplementationLots = ({ open }: UseBatchImplementationLotsArgs) => {
  const [materialOptions, setMaterialOptions] = useState<BatchMaterialOption[]>([]);
  const [lotsByMaterialCode, setLotsByMaterialCode] = useState<Record<string, RawMaterialLotListRow[]>>({});
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const res = await operationsController.fetchAllMaterialsList();
      if (res?.success && res.data != null) {
        setMaterialOptions(normalizeMaterialsList(res.data));
      } else {
        setMaterialOptions([]);
      }
    } catch {
      setMaterialOptions([]);
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  const loadApprovedLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const res = await rawMaterialProcurementController.fetchLotList({
        subDepartmentId: ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID,
        page: 1,
        limit: 500,
        status: [toRawMaterialLotListApiStatus(OPERATION_STATUS.APPROVED)],
      });

      if (res?.success && res.data) {
        const data = res.data as { lots?: unknown[] };
        const lots = (data.lots ?? []).map((lot, idx) => mapLotListApiRow(lot, idx));
        setLotsByMaterialCode(groupLotsByMaterialCode(lots));
      } else {
        setLotsByMaterialCode({});
      }
    } catch {
      setLotsByMaterialCode({});
    } finally {
      setLoadingLots(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadMaterials();
    void loadApprovedLots();
  }, [open, loadMaterials, loadApprovedLots]);

  const getLotsForMaterial = useCallback(
    (materialCode: string): RawMaterialLotListRow[] => {
      const key = normalizeMaterialCodeKey(materialCode);
      return key ? (lotsByMaterialCode[key] ?? []) : [];
    },
    [lotsByMaterialCode]
  );

  const getLotByMaterialAndId = useCallback(
    (materialCode: string, lotId: string): RawMaterialLotListRow | undefined => {
      const trimmed = String(lotId ?? "").trim();
      if (!trimmed) return undefined;
      return getLotsForMaterial(materialCode).find((lot) => lot.lotId === trimmed);
    },
    [getLotsForMaterial]
  );

  const getLotOptionsForRow = (
    materialCode: string,
    currentLotId: string,
    selectedElsewhere: Set<string>
  ): RawMaterialLotListRow[] => {
    const base = getLotsForMaterial(materialCode);
    const filtered = base.filter((lot) => {
      if (lot.lotId === currentLotId) return true;
      return !selectedElsewhere.has(lot.lotId);
    });

    const trimmed = String(currentLotId ?? "").trim();
    if (trimmed && !filtered.some((lot) => lot.lotId === trimmed)) {
      return [
        {
          id: trimmed,
          lotId: trimmed,
          procurementId: "",
          materialCode,
          materialName: "",
          supplyOrderNo: "",
          receiptDate: "",
          manufacturerName: "",
          status: OPERATION_STATUS.APPROVED,
          rmStatus: OPERATION_STATUS.APPROVED,
          createdOn: "",
        },
        ...filtered,
      ];
    }

    return filtered;
  };

  return {
    materialOptions,
    lotsByMaterialCode,
    loadingMaterials,
    loadingLots,
    getLotsForMaterial,
    getLotByMaterialAndId,
    getLotOptionsForRow,
  };
};

export default useBatchImplementationLots;
