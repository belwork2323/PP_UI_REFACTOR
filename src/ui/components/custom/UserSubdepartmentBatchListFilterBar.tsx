import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { alpha } from "@mui/material";

import { STRINGS } from "../../../app/config/strings";
import type { getOperationsTheme } from "../../../app/theme/custom_themes/shared/operations_theme";
import type { SubdepartmentBatchListAdvancedFilters } from "../../../hooks/user/useSubdepartmentBatches";
import ManufacturingBatchListFilterPanel from "../../pages/user/manufacturing/components/ManufacturingBatchListFilterPanel";
import FilterToggleButton from "../common/FilterToggleButton";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

type OperationsTheme = ReturnType<typeof getOperationsTheme>;

export type UserSubdepartmentBatchListFilterBarResult = {
  searchBarEnd: ReactNode;
  filterExtension: ReactNode;
};

export type UserSubdepartmentBatchListFilterBarArgs = {
  theme: OperationsTheme;
  statusConfig: Record<string, { label?: string }>;
  statusDropdownValues: readonly string[];
  advancedFilters: SubdepartmentBatchListAdvancedFilters;
  applyAdvancedFilters: (filters: SubdepartmentBatchListAdvancedFilters & { status: string }) => void;
  clearAdvancedFilters: () => void;
  activeFilterCount: number;
  statusFilter: string;
  motorStageOptions: Array<{ motorStage: string }>;
  motorStagesLoading: boolean;
};

export const useUserSubdepartmentBatchListFilterBar = ({
  theme,
  statusConfig,
  statusDropdownValues,
  advancedFilters,
  applyAdvancedFilters,
  clearAdvancedFilters,
  activeFilterCount,
  statusFilter,
  motorStageOptions,
  motorStagesLoading,
}: UserSubdepartmentBatchListFilterBarArgs): UserSubdepartmentBatchListFilterBarResult => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftBatchId, setDraftBatchId] = useState("");
  const [draftBatchType, setDraftBatchType] = useState(FILTER_ALL);
  const [draftMotorStage, setDraftMotorStage] = useState(FILTER_ALL);
  const [draftMotorId, setDraftMotorId] = useState("");
  const [draftPriority, setDraftPriority] = useState(FILTER_ALL);
  const [draftStatus, setDraftStatus] = useState(FILTER_ALL);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftBatchId(advancedFilters.batchId);
    setDraftBatchType(advancedFilters.batchTypes.length === 1 ? advancedFilters.batchTypes[0]! : FILTER_ALL);
    setDraftMotorStage(advancedFilters.motorStages.length === 1 ? advancedFilters.motorStages[0]! : FILTER_ALL);
    setDraftMotorId(advancedFilters.motorIds[0] ?? "");
    setDraftPriority(advancedFilters.priorities.length === 1 ? advancedFilters.priorities[0]! : FILTER_ALL);
    setDraftStatus(statusFilter);
  }, [advancedFilters, statusFilter]);

  const filterWasOpen = useRef(false);
  useEffect(() => {
    if (filterOpen && !filterWasOpen.current) {
      syncDraftsFromApplied();
    }
    filterWasOpen.current = filterOpen;
  }, [filterOpen, syncDraftsFromApplied]);

  useEffect(() => {
    if (!filterOpen) return;
    setDraftStatus(statusFilter);
  }, [statusFilter, filterOpen]);

  const filterToggleSx = useMemo(() => {
    const pl = theme.palette.primaryLight;
    const sub = theme.palette.textSub;
    return {
      filterBtn: (active: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        cursor: "pointer",
        flexShrink: 0,
        px: 1.2,
        py: 0.55,
        borderRadius: 2,
        border: `1px solid ${active ? pl : alpha(pl, 0.35)}`,
        bgcolor: active ? alpha(pl, 0.1) : "transparent",
        color: active ? pl : sub,
        transition: "all 0.15s",
        userSelect: "none",
        "&:hover": {
          bgcolor: alpha(pl, 0.08),
          borderColor: pl,
          color: pl,
        },
      }),
      filterBtnText: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
      filterBtnIcon: { fontSize: 14 },
      filterBtnChevron: { fontSize: 14, ml: 0.2 },
      filterBadgePill: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(pl, 0.2),
        color: pl,
        borderRadius: "50%",
        width: 16,
        height: 16,
        fontSize: "0.58rem",
        fontWeight: 800,
      },
    };
  }, [theme.palette.primaryLight, theme.palette.textSub]);

  const filterPanelHeaderSx = useMemo(
    () => ({
      containerSx: { alignItems: "center", pb: 0.5 },
      iconSx: { fontSize: 18, color: theme.palette.primaryLight },
      labelSx: { fontSize: "0.82rem", fontWeight: 700, color: theme.palette.text },
      badgeSx: {
        minWidth: 20,
        height: 20,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.65rem",
        fontWeight: 800,
        bgcolor: alpha(theme.palette.primaryLight, 0.15),
        color: theme.palette.primaryLight,
      },
      clearChipSx: {
        fontWeight: 700,
        fontSize: "0.75rem",
        height: "28px",
        px: 0.5,
        borderColor: alpha(theme.palette.danger, 0.35),
        color: theme.palette.danger,
        "& .MuiChip-label": { px: 1.5 },
      },
    }),
    [theme.palette],
  );

  const handleApplyPanelFilters = () => {
    const motorId = draftMotorId.trim();
    const next: SubdepartmentBatchListAdvancedFilters & { status: string } = {
      batchId: draftBatchId.trim(),
      batchTypes: draftBatchType === FILTER_ALL ? [] : [draftBatchType],
      motorStages: draftMotorStage === FILTER_ALL ? [] : [draftMotorStage],
      motorIds: motorId ? [motorId] : [],
      priorities: draftPriority === FILTER_ALL ? [] : [draftPriority],
      status: draftStatus,
    };
    applyAdvancedFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearAdvancedFilters();
    setDraftBatchId("");
    setDraftBatchType(FILTER_ALL);
    setDraftMotorStage(FILTER_ALL);
    setDraftMotorId("");
    setDraftPriority(FILTER_ALL);
    setDraftStatus(FILTER_ALL);
  };

  const searchBarEnd = (
    <FilterToggleButton
      label={STRINGS.MANUFACTURING.BATCH_LIST.FILTERS_TOGGLE}
      count={activeFilterCount}
      isOpen={filterOpen}
      onClick={() => setFilterOpen((v) => !v)}
      sx={filterToggleSx.filterBtn(filterOpen || activeFilterCount > 0)}
      iconSx={filterToggleSx.filterBtnIcon}
      textSx={filterToggleSx.filterBtnText}
      badgeSx={filterToggleSx.filterBadgePill}
      chevronSx={filterToggleSx.filterBtnChevron}
    />
  );

  const filterExtension = filterOpen ? (
    <ManufacturingBatchListFilterPanel
      theme={theme}
      activeFilterCount={activeFilterCount}
      draftBatchId={draftBatchId}
      draftBatchType={draftBatchType}
      draftMotorStage={draftMotorStage}
      draftMotorId={draftMotorId}
      draftPriority={draftPriority}
      draftStatus={draftStatus}
      statusDropdownValues={statusDropdownValues}
      statusConfig={statusConfig}
      motorStageOptions={motorStageOptions}
      motorStagesLoading={motorStagesLoading}
      filterPanelHeaderSx={filterPanelHeaderSx}
      onDraftBatchIdChange={setDraftBatchId}
      onDraftBatchTypeChange={setDraftBatchType}
      onDraftMotorStageChange={setDraftMotorStage}
      onDraftMotorIdChange={setDraftMotorId}
      onDraftPriorityChange={setDraftPriority}
      onDraftStatusChange={setDraftStatus}
      onApply={handleApplyPanelFilters}
      onClear={handleClearAllFilters}
      onClose={() => setFilterOpen(false)}
    />
  ) : null;

  return { searchBarEnd, filterExtension };
};

export default useUserSubdepartmentBatchListFilterBar;
