import { useEffect, useMemo, useState } from "react";
import { alpha } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META } from "@app/theme/approver";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "@data/models/user/MaterialsListModel";
import { RAW_MATERIAL_APPROVER_STATUS_TABS } from "@data/models/approver/sourcing/rms/RawMaterialSourcingApproverModel";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import { operationsController } from "@controllers/user/operationsController";

const FILTER_ALL = STRINGS.APPROVER.COMMON.STATUS_ALL;

export type RawMaterialApproverAppliedFilters = {
  materialCode: string;
  fromDate: string;
  toDate: string;
};

const emptyAppliedFilters: RawMaterialApproverAppliedFilters = {
  materialCode: "",
  fromDate: "",
  toDate: "",
};

type SubdeptMaterialOption = {
  materialCode: string;
  materialName: string;
};

const normalizeMaterialsList = (items: MaterialsListItem[]): SubdeptMaterialOption[] =>
  toMaterialCodeNameOptions(items);

const RAW_MATERIAL_APPROVER_STATUS_META = {
  ...APPROVER_STATUS_META,
  [OPERATION_STATUS.TO_BE_INITIATED]: {
    bg: alpha("#5D6D7E", 0.08),
    color: "#2E4053",
    border: alpha("#5D6D7E", 0.2),
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    bg: alpha("#2E86C1", 0.1),
    color: "#1A5276",
    border: alpha("#2E86C1", 0.3),
  },
};

export const useRawMaterialSourcingApproverList = () => {
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
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
    }),
    [appliedFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.materialCode) count += 1;
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

  return {
    statusMeta: RAW_MATERIAL_APPROVER_STATUS_META,
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
    filterAllLabel: FILTER_ALL,
  };
};

export type RawMaterialSourcingApproverListState = ReturnType<
  typeof useRawMaterialSourcingApproverList
>;

export default useRawMaterialSourcingApproverList;
