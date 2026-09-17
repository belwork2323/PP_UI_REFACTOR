import { useCallback, useEffect, useMemo, useState } from "react";
import { generalController } from "../../controllers/admin/common/generalController";
import type { SystemMasterOption } from "../../data/api/common/generalAPI";

export type BuildingDropdownOption = { value: string; label: string };

/**
 * Loads active buildings from GET /system/buildings for form dropdowns.
 * Stores option `value` as building **code** (matches prior identification-sheet BldgNo).
 */
export const useBuildingOptions = (enabled = true) => {
  const [buildingOptions, setBuildingOptions] = useState<SystemMasterOption[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  const reloadBuildings = useCallback(async () => {
    setLoadingBuildings(true);
    try {
      const response = await generalController.getBuildings();
      setBuildingOptions(
        response?.success && Array.isArray(response.data) ? response.data : [],
      );
    } catch {
      setBuildingOptions([]);
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void reloadBuildings();
  }, [enabled, reloadBuildings]);

  const dropdownOptions = useMemo<BuildingDropdownOption[]>(
    () =>
      buildingOptions
        .map((option) => ({
          value: String(option.code ?? "").trim(),
          label: String(option.name || option.code || "").trim(),
        }))
        .filter((option) => option.value),
    [buildingOptions],
  );

  return {
    buildingOptions,
    dropdownOptions,
    loadingBuildings,
    reloadBuildings,
  };
};

export default useBuildingOptions;
