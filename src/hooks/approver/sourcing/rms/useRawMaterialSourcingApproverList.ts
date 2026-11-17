import { useEffect, useMemo, useState } from "react";

import { STRINGS } from "@app/config/strings";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META } from "@app/theme/approver";
import { useThemeStore } from "@app/store/themeStore";
import getSourcingTheme from "@app/theme/custom_themes/user/sourcing/sourcing_theme";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "@data/models/user/MaterialsListModel";
import { RAW_MATERIAL_APPROVER_STATUS_TABS } from "@data/models/approver/sourcing/rms/RawMaterialSourcingApproverModel";
import { operationsController } from "@controllers/user/operationsController";
import type { FilterFieldOption } from "@ui/components/custom/FilterFields";

const FILTER_ALL = STRINGS.APPROVER.COMMON.STATUS_ALL;

export type RawMaterialApproverAppliedFilters = {
  materialCode: string;
  manufacturer: string;
  fromDate: string;
  toDate: string;
};

const emptyAppliedFilters: RawMaterialApproverAppliedFilters = {
  materialCode: "",
  manufacturer: "",
  fromDate: "",
  toDate: "",
};

type SubdeptMaterialOption = {
  materialCode: string;
  materialName: string;
};

const normalizeMaterialsList = (items: MaterialsListItem[]): SubdeptMaterialOption[] =>
  toMaterialCodeNameOptions(items);

export const useRawMaterialSourcingApproverList = () => {
  const mode = useThemeStore((state) => state.mode);
  const sourcingTheme = useMemo(() => getSourcingTheme(mode), [mode]);

  /** Tab colors from shared operations statusConfig (same as user RMS lot list chips). */
  const statusMeta = useMemo(() => {
    const fromOps = Object.fromEntries(
      Object.entries(sourcingTheme.batchList.statusConfig ?? {}).map(([status, cfg]) => [
        status,
        {
          bg: cfg.bg,
          color: cfg.color,
          border: cfg.border,
          label: cfg.label,
        },
      ]),
    );
    return { ...APPROVER_STATUS_META, ...fromOps };
  }, [sourcingTheme]);

  const [appliedFilters, setAppliedFilters] =
    useState<RawMaterialApproverAppliedFilters>(emptyAppliedFilters);
  const [materialOptions, setMaterialOptions] = useState<SubdeptMaterialOption[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);

  useEffect(() => {
    let active = true;

    const loadMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const response = await operationsController.fetchAllMaterialsList();
        if (!active) return;
        if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
          setMaterialOptions(normalizeMaterialsList(response.data));
          return;
        }
        setMaterialOptions([]);
      } catch {
        if (active) setMaterialOptions([]);
      } finally {
        if (active) setMaterialsLoading(false);
      }
    };

    void loadMaterials();

    return () => {
      active = false;
    };
  }, []);

  const listFiltersRecord = useMemo(
    () => ({
      materialCode: appliedFilters.materialCode || FILTER_ALL,
      manufacturer: appliedFilters.manufacturer,
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
    }),
    [appliedFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.materialCode) count += 1;
    if (appliedFilters.manufacturer) count += 1;
    if (appliedFilters.fromDate) count += 1;
    if (appliedFilters.toDate) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [appliedFilters, statusFilter]);

  const applyListFilters = (next: RawMaterialApproverAppliedFilters) => {
    setAppliedFilters(next);
  };

  const applyPanelFilters = (next: RawMaterialApproverAppliedFilters & { status: string }) => {
    setAppliedFilters({
      materialCode: next.materialCode,
      manufacturer: next.manufacturer,
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilter(next.status || FILTER_ALL);
  };

  const clearListFilters = () => {
    setAppliedFilters(emptyAppliedFilters);
    setStatusFilter(FILTER_ALL);
  };

  const statusTabs = useMemo(() => [FILTER_ALL, ...RAW_MATERIAL_APPROVER_STATUS_TABS], []);

  const statusDropdownValues = useMemo(
    () => [FILTER_ALL, ...RAW_MATERIAL_APPROVER_STATUS_TABS],
    [],
  );

  const statusOptions = useMemo<FilterFieldOption[]>(
    () =>
      statusDropdownValues.map((status) => ({
        value: status,
        label: status === FILTER_ALL ? FILTER_ALL : (statusMeta[status]?.label ?? status),
      })),
    [statusDropdownValues, statusMeta],
  );

  return {
    statusMeta,
    priorityMeta: APPROVER_PRIORITY_META,
    appliedFilters,
    applyListFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    materialOptions,
    materialsLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    statusOptions,
    filterAllLabel: FILTER_ALL,
  };
};

export type RawMaterialSourcingApproverListState = ReturnType<
  typeof useRawMaterialSourcingApproverList
>;

export default useRawMaterialSourcingApproverList;
