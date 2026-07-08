import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alpha, Button, CircularProgress, MenuItem, Stack, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

import { STRINGS } from "../../../../app/config/strings";
import {
  type ApproverSubdepartmentBatchListAppliedFilters,
  useApproverSubdepartmentBatchListFilters,
} from "../../../../hooks/approver/useApproverSubdepartmentBatchListFilters";
import { MANUFACTURING_BATCH_TYPE_OPTIONS } from "../../../../data/models/user/SubdepartmentBatchModel";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";
import FilterToggleButton from "../../../components/common/FilterToggleButton";
import getApproverManufacturingFilterStyles from "../manufacturing/approverManufacturingFilterStyles";

const BL = STRINGS.MANUFACTURING.BATCH_LIST;

export type ApproverSubdepartmentBatchListFilterBar = ReturnType<
  typeof useApproverSubdepartmentBatchListFilterBar
>;

type FilterBarTheme = {
  palette: {
    primary: string;
    primaryLight: string;
    border: string;
    text: string;
    danger: string;
    textSub: string;
  };
};

type UseApproverSubdepartmentBatchListFilterBarArgs = {
  mode?: string;
  theme: FilterBarTheme;
};

export const useApproverSubdepartmentBatchListFilterBar = ({
  mode = "light",
  theme,
}: UseApproverSubdepartmentBatchListFilterBarArgs) => {
  const filterStyles = useMemo(() => getApproverManufacturingFilterStyles(mode), [mode]);
  const {
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel,
    motorStageOptions,
    motorStagesLoading,
    applyClientFilters,
  } = useApproverSubdepartmentBatchListFilters();

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftBatchId, setDraftBatchId] = useState("");
  const [draftBatchType, setDraftBatchType] = useState(filterAllLabel);
  const [draftMotorId, setDraftMotorId] = useState("");
  const [draftMotorStage, setDraftMotorStage] = useState(filterAllLabel);
  const [draftSubmittedBy, setDraftSubmittedBy] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(filterAllLabel);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftBatchId(appliedFilters.batchId);
    setDraftBatchType(appliedFilters.batchType || filterAllLabel);
    setDraftMotorId(appliedFilters.motorId);
    setDraftMotorStage(appliedFilters.motorStage || filterAllLabel);
    setDraftSubmittedBy(appliedFilters.submittedBy);
    setDraftFrom(appliedFilters.fromDate);
    setDraftTo(appliedFilters.toDate);
    setDraftStatus(statusFilter);
  }, [appliedFilters, filterAllLabel, statusFilter]);

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

  const filterToggleSx = useMemo(
    () => ({
      filterBtn: (active: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        cursor: "pointer",
        flexShrink: 0,
        px: 1.2,
        py: 0.55,
        borderRadius: 2,
        border: `1px solid ${active ? theme.palette.primaryLight : alpha(theme.palette.primaryLight, 0.35)}`,
        bgcolor: active ? alpha(theme.palette.primaryLight, 0.1) : "transparent",
        color: active ? theme.palette.primaryLight : theme.palette.textSub,
        transition: "all 0.15s",
        userSelect: "none",
        "&:hover": {
          bgcolor: alpha(theme.palette.primaryLight, 0.08),
          borderColor: theme.palette.primaryLight,
          color: theme.palette.primaryLight,
        },
      }),
      filterBtnText: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
      filterBtnIcon: { fontSize: 14 },
      filterBtnChevron: { fontSize: 14, ml: 0.2 },
      filterBadgePill: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(theme.palette.primaryLight, 0.2),
        color: theme.palette.primaryLight,
        borderRadius: "50%",
        width: 16,
        height: 16,
        fontSize: "0.58rem",
        fontWeight: 800,
      },
    }),
    [theme.palette],
  );

  const handleApplyPanelFilters = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }

    const next: ApproverSubdepartmentBatchListAppliedFilters & { status: string } = {
      batchId: draftBatchId.trim(),
      batchType: draftBatchType === filterAllLabel ? "" : draftBatchType,
      motorId: draftMotorId.trim(),
      motorStage: draftMotorStage === filterAllLabel ? "" : draftMotorStage,
      submittedBy: draftSubmittedBy.trim(),
      fromDate: from,
      toDate: to,
      status: draftStatus,
    };
    applyPanelFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearListFilters();
    setDraftBatchId("");
    setDraftBatchType(filterAllLabel);
    setDraftMotorId("");
    setDraftMotorStage(filterAllLabel);
    setDraftSubmittedBy("");
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus(filterAllLabel);
  };

  const searchBarEnd = (
    <FilterToggleButton
      label={BL.FILTERS_TOGGLE}
      count={activeFilterCount}
      isOpen={filterOpen}
      onClick={() => setFilterOpen((open) => !open)}
      sx={filterToggleSx.filterBtn(filterOpen || activeFilterCount > 0)}
      iconSx={filterToggleSx.filterBtnIcon}
      textSx={filterToggleSx.filterBtnText}
      badgeSx={filterToggleSx.filterBadgePill}
      chevronSx={filterToggleSx.filterBtnChevron}
    />
  );

  const filterExtension = filterOpen ? (
    <Stack
      spacing={1.5}
      sx={{
        mt: 1.5,
        pt: 2,
        borderTop: `1px solid ${alpha(theme.palette.border, 0.55)}`,
      }}
    >
      <FilterPanelHeader
        title={BL.FILTERS_TITLE}
        count={activeFilterCount}
        onClear={handleClearAllFilters}
        clearLabel={BL.FILTERS_CLEAR}
        containerSx={{ alignItems: "center", pb: 0.5 }}
        iconSx={{ fontSize: 18, color: theme.palette.primaryLight }}
        labelSx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.text }}
        badgeSx={{
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
        }}
        clearChipSx={{
          fontWeight: 700,
          fontSize: "0.75rem",
          height: "28px",
          px: 0.5,
          borderColor: alpha(theme.palette.danger, 0.35),
          color: theme.palette.danger,
          "& .MuiChip-label": { px: 1.5 },
        }}
      />

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label={BL.COL_BATCH_ID}
          value={draftBatchId}
          onChange={(event) => setDraftBatchId(event.target.value)}
          placeholder="e.g. BATCH-2026-001"
          sx={{ ...filterStyles.field, minWidth: { xs: "100%", sm: 160 }, flex: { lg: 1 } }}
        />

        <TextField
          select
          size="small"
          label={BL.COL_BATCH_TYPE}
          value={draftBatchType}
          onChange={(event) => setDraftBatchType(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_BATCH_TYPES}</MenuItem>
          {MANUFACTURING_BATCH_TYPE_OPTIONS.map((type) => (
            <MenuItem key={type} value={type}>
              {type === "MAIN" ? "Main scale" : "Sub scale"}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label={BL.COL_MOTOR_ID}
          value={draftMotorId}
          onChange={(event) => setDraftMotorId(event.target.value)}
          placeholder="e.g. MTR-445"
          sx={{ ...filterStyles.field, minWidth: { xs: "100%", sm: 160 } }}
        />

        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{ minWidth: { xs: "100%", sm: 160 }, flex: { lg: "0 0 auto" } }}
        >
          <TextField
            select
            size="small"
            label={BL.COL_MOTOR_STAGE}
            value={draftMotorStage}
            onChange={(event) => setDraftMotorStage(event.target.value)}
            disabled={motorStagesLoading}
            fullWidth
            sx={filterStyles.field}
            SelectProps={filterStyles.selectProps}
          >
            <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_STAGES}</MenuItem>
            {!motorStagesLoading &&
              motorStageOptions.map((stage) => (
                <MenuItem key={stage.motorStage} value={stage.motorStage}>
                  Stage {stage.motorStage}
                </MenuItem>
              ))}
          </TextField>
          {motorStagesLoading ? (
            <CircularProgress size={18} sx={{ mt: 0.75, color: theme.palette.primaryLight }} />
          ) : null}
        </Stack>

        <TextField
          size="small"
          label={BL.COL_SUBMITTED_BY}
          value={draftSubmittedBy}
          onChange={(event) => setDraftSubmittedBy(event.target.value)}
          placeholder={BL.FILTERS_SUBMITTED_BY_PLACEHOLDER}
          sx={{ ...filterStyles.field, minWidth: { xs: "100%", sm: 180 } }}
        />

        <TextField
          select
          size="small"
          label={BL.FILTERS_STATUS}
          value={draftStatus}
          onChange={(event) => setDraftStatus(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          {statusDropdownValues.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={BL.FILTERS_FROM_DATE}
            format="YYYY-MM-DD"
            value={draftFrom ? dayjs(draftFrom) : null}
            onChange={(value) => setDraftFrom(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: filterStyles.fieldDate,
              },
            }}
          />
          <DatePicker
            label={BL.FILTERS_TO_DATE}
            format="YYYY-MM-DD"
            value={draftTo ? dayjs(draftTo) : null}
            onChange={(value) => setDraftTo(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: filterStyles.fieldDate,
              },
            }}
          />
        </LocalizationProvider>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilterOpen(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {BL.FILTERS_CLOSE_PANEL}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleApplyPanelFilters}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            bgcolor: theme.palette.primary,
            "&:hover": { bgcolor: theme.palette.primaryLight },
          }}
        >
          {BL.FILTERS_APPLY}
        </Button>
      </Stack>
    </Stack>
  ) : null;

  return {
    appliedFilters,
    applyClientFilters,
    activeFilterCount,
    listFiltersRecord,
    statusFilter,
    setStatusFilter,
    statusTabs,
    filterAllLabel,
    searchBarEnd,
    filterExtension,
  };
};

export default useApproverSubdepartmentBatchListFilterBar;
