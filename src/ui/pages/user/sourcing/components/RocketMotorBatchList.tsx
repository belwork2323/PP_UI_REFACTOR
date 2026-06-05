import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { alpha, Box, Button, Chip, CircularProgress, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import FilterPanelHeader from "../../../../components/custom/FilterPanelHeader";
import FilterToggleButton from "../../../../components/custom/FilterToggleButton";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getSourcingTheme from "../../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import {
  canDeleteRocketMotorCasing,
  ROCKET_MOTOR_CASING_SEARCH_FIELDS,
} from "../../../../../data/models/user/RocketMotorCasingProcurementModel";
import type { RocketMotorCasingListAdvancedFilters } from "../../../../../hooks/user/sourcing/useRocketMotorCasingList";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.sourcing.rocketMotorBatchList;

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
const CASING_TYPES = ["COMPOSITE", "METALLIC"] as const;
const INSULATION_TYPES = ["ROCASIN", "EPDM"] as const;

export const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const STATUS_DROPDOWN_VALUES = [
  FILTER_ALL,
  ...Object.values(OPERATION_STATUS).filter((status) => status !== OPERATION_STATUS.INITIATED),
] as const;

const canViewCasingDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

const { visibility: VisibilityRoundedIcon } = icons.user.sourcing.rocketMotorBatchList;

const RocketMotorBatchList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);

  const {
    batches,
    statusCounts,
    totalRecords,
    page,
    rowsPerPage,
    search,
    statusFilter,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    loading,
    handleFillForm,
    handleEditForm,
    handleDeleteCasingFromList,
    handleViewCasingDetails,
    handleCreateMotorCasing,
    motorStageOptions,
    motorStagesLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  } = hookState;

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMotorStage, setDraftMotorStage] = useState(FILTER_ALL);
  const [draftCasingType, setDraftCasingType] = useState(FILTER_ALL);
  const [draftInsulationType, setDraftInsulationType] = useState(FILTER_ALL);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(FILTER_ALL);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftMotorStage(advancedFilters.motorStages.length === 1 ? advancedFilters.motorStages[0]! : FILTER_ALL);
    setDraftCasingType(advancedFilters.casingTypes.length === 1 ? advancedFilters.casingTypes[0]! : FILTER_ALL);
    setDraftInsulationType(
      advancedFilters.insulationTypes.length === 1 ? advancedFilters.insulationTypes[0]! : FILTER_ALL
    );
    setDraftFrom(advancedFilters.fromDate);
    setDraftTo(advancedFilters.toDate);
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

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(OPERATION_STATUS_CONFIG)
          .filter(([status]) => status !== OPERATION_STATUS.INITIATED)
          .map(([status, cfg]) => [status, { ...cfg, ...theme.batchList.statusConfig[status] }])
      ),
    [theme]
  );

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
    [theme.palette]
  );

  const formatListDate = (v: string) => {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const COLUMNS = useMemo(
    () => [
      {
        key: "motorCasingId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MOTOR_CASING_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v || "—"}</Typography>,
      },
      {
        key: "projectId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_PROJECT_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v || "—"}</Typography>,
      },
      {
        key: "motorId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MOTOR_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v || "—"}</Typography>,
      },
      {
        key: "motorStage",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MOTOR_STAGE,
        align: "center",
        render: (v: string) => (
          <Chip label={v || "—"} size="small" sx={theme.batchList.batchTypeChip} />
        ),
      },
      {
        key: "casingType",
        label: STRINGS.SOURCING.BATCH_LIST.COL_CASING_TYPE,
        align: "center",
        render: (v: string) => <Chip label={v || "—"} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "insulationType",
        label: STRINGS.SOURCING.BATCH_LIST.COL_INSULATION_TYPE,
        align: "center",
        render: (v: string) => <Chip label={v || "—"} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "createdBy.fullName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_CREATED_BY,
        render: (v: string) => (
          <IconText
            icon={<PersonRoundedIcon sx={theme.batchList.icon} />}
            text={v ?? STRINGS.SOURCING.BATCH_LIST.UNASSIGNED}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "createdOn",
        label: STRINGS.SOURCING.BATCH_LIST.COL_CREATED_ON,
        render: (v: string) => (
          <IconText
            icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
            text={formatListDate(v)}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "rmStatus",
        label: STRINGS.SOURCING.BATCH_LIST.COL_STAGE_STATUS,
        align: "center",
        render: (v: string, row: any) => (
          <UserWorkflowStatusCell
            status={v}
            statusConfig={statusConfig}
            rejectedStatus={OPERATION_STATUS.REJECTED}
            rejectionReason={row.rejectionReason}
            theme={theme}
          />
        ),
      },
    ],
    [statusConfig, theme]
  );

  const createMotorCasingSx = useMemo(() => {
    const primary = theme.palette.primary;
    const shadowAlpha = mode === "dark" ? 0.35 : 0.25;
    const hoverShadowAlpha = mode === "dark" ? 0.45 : 0.32;
    return {
      ...theme.batchList.action.primary,
      textTransform: "none" as const,
      fontWeight: 800,
      fontSize: "0.8rem",
      px: 2,
      py: 0.75,
      minHeight: 34,
      borderRadius: 2,
      gap: 0.75,
      "& .MuiButton-startIcon": { ml: -0.25, mr: 0.25 },
      "& .MuiSvgIcon-root": { fontSize: 18 },
      boxShadow: `0 2px 10px ${alpha(primary, shadowAlpha)}`,
      "&:hover": {
        ...((theme.batchList.action.primary as Record<string, unknown>)["&:hover"] as object),
        boxShadow: `0 4px 16px ${alpha(primary, hoverShadowAlpha)}`,
      },
    };
  }, [theme, mode]);

  const handleApplyPanelFilters = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    const next: RocketMotorCasingListAdvancedFilters & { status: string } = {
      motorStages: draftMotorStage === FILTER_ALL ? [] : [draftMotorStage],
      casingTypes: draftCasingType === FILTER_ALL ? [] : [draftCasingType],
      insulationTypes: draftInsulationType === FILTER_ALL ? [] : [draftInsulationType],
      fromDate: from,
      toDate: to,
      status: draftStatus,
    };
    applyAdvancedFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearAdvancedFilters();
    setDraftMotorStage(FILTER_ALL);
    setDraftCasingType(FILTER_ALL);
    setDraftInsulationType(FILTER_ALL);
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus(FILTER_ALL);
  };

  const searchBarEnd = (
    <FilterToggleButton
      label={STRINGS.SOURCING.BATCH_LIST.FILTERS_TOGGLE}
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
    <Stack
      spacing={1.5}
      sx={{
        mt: 1.5,
        pt: 2,
        borderTop: `1px solid ${alpha(theme.palette.border, 0.55)}`,
      }}
    >
      <FilterPanelHeader
        title={STRINGS.SOURCING.BATCH_LIST.FILTERS_TITLE_MOTOR}
        count={activeFilterCount}
        onClear={handleClearAllFilters}
        clearLabel={STRINGS.SOURCING.BATCH_LIST.FILTERS_CLEAR}
        containerSx={filterPanelHeaderSx.containerSx}
        iconSx={filterPanelHeaderSx.iconSx}
        labelSx={filterPanelHeaderSx.labelSx}
        badgeSx={filterPanelHeaderSx.badgeSx}
        clearChipSx={filterPanelHeaderSx.clearChipSx}
      />

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: { xs: "100%", sm: 200 }, flex: { lg: "0 0 auto" } }}>
          <TextField
            select
            size="small"
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_MOTOR_STAGE}
            value={draftMotorStage}
            onChange={(e) => setDraftMotorStage(e.target.value)}
            disabled={motorStagesLoading}
            fullWidth
          >
            <MenuItem value={FILTER_ALL}>{STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_STAGES}</MenuItem>
            {!motorStagesLoading &&
              motorStageOptions.map((s: { motorStage: string }) => (
                <MenuItem key={s.motorStage} value={s.motorStage}>
                  Stage {s.motorStage}
                </MenuItem>
              ))}
          </TextField>
          {motorStagesLoading ? <CircularProgress size={22} sx={{ mt: 1.25, color: theme.palette.primaryLight }} /> : null}
        </Stack>

        <TextField
          select
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_CASING_TYPE}
          value={draftCasingType}
          onChange={(e) => setDraftCasingType(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 180 } }}
        >
          <MenuItem value={FILTER_ALL}>{STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_CASING_TYPES}</MenuItem>
          {CASING_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_INSULATION_TYPE}
          value={draftInsulationType}
          onChange={(e) => setDraftInsulationType(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 180 } }}
        >
          <MenuItem value={FILTER_ALL}>{STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_INSULATION}</MenuItem>
          {INSULATION_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_STATUS}
          value={draftStatus}
          onChange={(e) => setDraftStatus(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 200 } }}
        >
          {STATUS_DROPDOWN_VALUES.map((s) => (
            <MenuItem key={s} value={s}>
              {s === FILTER_ALL ? FILTER_ALL : statusConfig[s]?.label ?? s}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_FROM_DATE}
            format="YYYY-MM-DD"
            value={draftFrom ? dayjs(draftFrom) : null}
            onChange={(v) => setDraftFrom(v && v.isValid() ? v.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: { xs: "100%", sm: 160 } },
              },
            }}
          />
          <DatePicker
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_TO_DATE}
            format="YYYY-MM-DD"
            value={draftTo ? dayjs(draftTo) : null}
            onChange={(v) => setDraftTo(v && v.isValid() ? v.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: { xs: "100%", sm: 160 } },
              },
            }}
          />
        </LocalizationProvider>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="outlined" size="small" onClick={() => setFilterOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
          {STRINGS.SOURCING.BATCH_LIST.FILTERS_CLOSE_PANEL}
        </Button>
        <Button variant="contained" size="small" onClick={handleApplyPanelFilters} sx={{ ...theme.batchList.action.primary, textTransform: "none" }}>
          {STRINGS.SOURCING.BATCH_LIST.FILTERS_APPLY}
        </Button>
      </Stack>
    </Stack>
  ) : null;

  return (
    <Box>
      <UserBatchList
        rows={batches}
        columns={COLUMNS}
        statusField="rmStatus"
        statusConfig={statusConfig}
        filters={[]}
        searchFields={[...ROCKET_MOTOR_CASING_SEARCH_FIELDS]}
        highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
        highlightColor={theme.palette.danger}
        rowsPerPageOptions={rowsPerPageOptions}
        tableLabel={STRINGS.SOURCING.BATCH_LIST.MOTOR_TITLE}
        themeTokens={theme}
        totalRecords={totalRecords}
        statusCounts={statusCounts}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        statusFilter={statusFilter}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        isLoading={loading}
        searchBarEnd={searchBarEnd}
        filterExtension={filterExtension}
        statusToolbarEnd={
          <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={handleCreateMotorCasing} sx={createMotorCasingSx}>
            {STRINGS.SOURCING.BATCH_LIST.CREATE_MOTOR_CASING}
          </Button>
        }
        renderAction={(row: any) => (
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="nowrap">
            {canViewCasingDetails(row.rmStatus) ? (
              <Tooltip title={STRINGS.SOURCING.BATCH_LIST.VIEW_CASING_DETAILS_TOOLTIP} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleViewCasingDetails(row)}
                  aria-label={STRINGS.SOURCING.BATCH_LIST.VIEW_CASING_DETAILS}
                  sx={{
                    color: theme.palette.primaryLight,
                    border: `1px solid ${alpha(theme.palette.primaryLight, 0.35)}`,
                    borderRadius: 1.5,
                    "&:hover": { background: alpha(theme.palette.primaryLight, 0.08) },
                  }}
                >
                  <VisibilityRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <UserWorkflowStatusAction
                status={row.rmStatus}
                row={row}
                statusMap={OPERATION_STATUS}
                onFillForm={handleFillForm}
                onEditForm={handleEditForm}
                theme={theme}
                fillLabel={STRINGS.SOURCING.BATCH_LIST.FILL_ACTION}
                continueLabel={STRINGS.SOURCING.BATCH_LIST.CONTINUE_ACTION}
                editTooltip={STRINGS.SOURCING.BATCH_LIST.EDIT_ACTION_TOOLTIP}
              />
            )}
            {canDeleteRocketMotorCasing(row.rmStatus) && (
              <Tooltip title={STRINGS.SOURCING.BATCH_LIST.DELETE_CASING_TOOLTIP} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteCasingFromList(row)}
                  sx={{
                    color: theme.palette.danger,
                    border: `1px solid ${alpha(theme.palette.danger, 0.35)}`,
                    borderRadius: 1.5,
                    "&:hover": { background: alpha(theme.palette.danger, 0.08) },
                  }}
                  aria-label={STRINGS.SOURCING.CASING_FORM.DELETE_CASING}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      />
    </Box>
  );
};

export default RocketMotorBatchList;
