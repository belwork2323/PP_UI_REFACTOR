import { useCallback, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { rawMaterialProcurementController } from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import {
  mapLotListApiRow,
  toRawMaterialLotListApiStatus,
  type RawMaterialLotListRow,
} from "../../../data/models/user/RawMaterialProcurementModel";
import { OPERATION_STATUS } from "../../operationStatus";

const normalizeLotId = (lot: RawMaterialLotListRow): string => {
  const raw = lot.lotId as string | string[] | null | undefined;
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return String(raw ?? "").trim();
};

/**
 * Fetches approved lots by material code for Case Prep liner MFG Lot dropdowns.
 * materialId/code come from the liner-ingredients API (not materials-list enrichment).
 */
export function useCasePrepLinerMaterials() {
  const user = useAuthStore((s) => s.user);
  const subDepartmentId = useMemo(() => {
    const subs = user?.allSubDepartments ?? [];
    return (
      subs.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId ??
      subs.find((sd) => sd.slugs?.subDept === "case-preparation")?.subDepartmentId ??
      null
    );
  }, [user]);

  const lotsCacheRef = useRef<Record<string, RawMaterialLotListRow[]>>({});
  const [lotsVersion, setLotsVersion] = useState(0);
  const [loadingLotsByCode, setLoadingLotsByCode] = useState<Record<string, boolean>>({});

  const fetchLotsForMaterialCode = useCallback(
    async (materialCode: string): Promise<RawMaterialLotListRow[]> => {
      const code = String(materialCode ?? "").trim();
      if (!code) return [];
      const cacheKey = code.toUpperCase();
      if (Object.prototype.hasOwnProperty.call(lotsCacheRef.current, cacheKey)) {
        return lotsCacheRef.current[cacheKey] ?? [];
      }
      if (!subDepartmentId) {
        lotsCacheRef.current[cacheKey] = [];
        setLotsVersion((v) => v + 1);
        return [];
      }

      setLoadingLotsByCode((prev) => ({ ...prev, [cacheKey]: true }));
      try {
        const response = await rawMaterialProcurementController.fetchLotList({
          subDepartmentId,
          page: 1,
          limit: 500,
          materialCode: [code],
          status: [toRawMaterialLotListApiStatus(OPERATION_STATUS.APPROVED)],
        });
        const data = response?.data as { lots?: unknown[] } | undefined;
        const lots = (data?.lots ?? []).map((lot, index) => mapLotListApiRow(lot, index));
        lotsCacheRef.current[cacheKey] = lots;
        setLotsVersion((v) => v + 1);
        return lots;
      } catch {
        lotsCacheRef.current[cacheKey] = [];
        setLotsVersion((v) => v + 1);
        return [];
      } finally {
        setLoadingLotsByCode((prev) => ({ ...prev, [cacheKey]: false }));
      }
    },
    [subDepartmentId],
  );

  const hasFetchedLots = useCallback(
    (materialCode: string) => {
      const key = String(materialCode ?? "").trim().toUpperCase();
      return Boolean(key && Object.prototype.hasOwnProperty.call(lotsCacheRef.current, key));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lotsVersion],
  );

  const getApiLotCount = useCallback(
    (materialCode: string) => {
      const key = String(materialCode ?? "").trim().toUpperCase();
      if (!key || !Object.prototype.hasOwnProperty.call(lotsCacheRef.current, key)) return 0;
      return (lotsCacheRef.current[key] ?? []).filter((lot) => Boolean(normalizeLotId(lot))).length;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lotsVersion],
  );

  const getCachedLotOptions = useCallback(
    (materialCode: string, currentLot?: string): Array<{ value: string; label: string }> => {
      const code = String(materialCode ?? "").trim().toUpperCase();
      const lots = code ? (lotsCacheRef.current[code] ?? []) : [];
      const options = lots
        .map((lot) => {
          const lotId = normalizeLotId(lot);
          return lotId ? { value: lotId, label: lotId } : null;
        })
        .filter((opt): opt is { value: string; label: string } => Boolean(opt));

      const current = String(currentLot ?? "").trim();
      if (current && !options.some((opt) => opt.value === current)) {
        options.unshift({ value: current, label: current });
      }
      return options;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lotsVersion],
  );

  const isLoadingLots = useCallback(
    (materialCode: string) => {
      const key = String(materialCode ?? "").trim().toUpperCase();
      return Boolean(key && loadingLotsByCode[key]);
    },
    [loadingLotsByCode],
  );

  return {
    fetchLotsForMaterialCode,
    getCachedLotOptions,
    getApiLotCount,
    hasFetchedLots,
    isLoadingLots,
  };
}
