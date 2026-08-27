import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { alpha, Box, Button, Chip, CircularProgress, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";
import FilterToggleButton from "../../../../components/common/FilterToggleButton";
import RefreshIconButton from "../../../../components/common/RefreshIconButton";
import WorkflowCreateButton from "../../../../components/common/WorkflowCreateButton";
import DateField from "../../../../components/common/DateField";
import { formatToIsoDateInput, formatToUiDate } from "../../../../../utils/dateUtils";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getSourcingTheme from "../../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { getOperationStatusConfig, OPERATION_STATUS, SOURCING_LOT_STATUS_FILTER_VALUES } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import {
  canDeleteRocketMotorCasing,
  ROCKET_MOTOR_CASING_SEARCH_FIELDS,
} from "../../../../../data/models/user/RocketMotorCasingProcurementModel";
import { formatMotorStageLabel } from "../../../../../data/models/approver/RocketMotorCasingApproverModel";
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

const STATUS_DROPDOWN_VALUES = [FILTER_ALL, ...SOURCING_LOT_STATUS_FILTER_VALUES] as const;

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
    isRefreshing = false,
    handleFillForm,
    handleEditForm,
    handleDeleteCasingFromList,
    handleViewCasingDetails,
    handleCreateMotorCasing,
    motorStageOptions,
    motorStagesLoading,
    ensureMotorStageOptions,
    projectOptions = [],
    projectsLoading = false,
    ensureProjectOptions,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
    refreshUserBatches,
  } = hookState;

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftProjectId, setDraftProjectId] = useState(FILTER_ALL);
  const [draftMotorStage, setDraftMotorStage] = useState(FILTER_ALL);
  const [draftCasingType, setDraftCasingType] = useState(FILTER_ALL);
  const [draftInsulationType, setDraftInsulationType] = useState(FILTER_ALL);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(FILTER_ALL);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftProjectId(advancedFilters.projectIds.length === 1 ? advancedFilters.projectIds[0]! : FILTER_ALL);
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
      void ensureMotorStageOptions?.();
      void ensureProjectOptions?.();
    }
    filterWasOpen.current = filterOpen;
  }, [filterOpen, syncDraftsFromApplied, ensureMotorStageOptions, ensureProjectOptions]);

  useEffect(() => {
    if (!filterOpen) return;
    setDraftStatus(statusFilter);
  }, [statusFilter, filterOpen]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(OPERATION_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ]),
      ),
    [theme],
  );

  const statusTabs = useMemo(
    () => [FILTER_ALL, ...SOURCING_LOT_STATUS_FILTER_VALUES],
    [],
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
        label: STRINGS.SOURCING.BATCH_LIST.COL_PROJECT,
        render: (_v: string, row: any) => {
          const projectName = String(row?.projectName ?? "").trim();
          const projectId = String(row?.projectId ?? "").trim();
          if (!projectName && !projectId) {
            return <Typography sx={theme.batchList.normalText}>—</Typography>;
          }
          return (
            <Box sx={theme.batchList.projectCell}>
              <icons.batchMgmt.projectId sx={theme.batchList.projectIcon} />
              <Box sx={theme.batchList.projectInfo}>
                <Typography sx={theme.batchList.projectName}>
                  {projectName || "—"}
                </Typography>
                <Typography sx={theme.batchList.projectId}>{projectId || "—"}</Typography>
              </Box>
            </Box>
          );
        },
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
          <Chip label={formatMotorStageLabel(v)} size="small" sx={theme.batchList.batchTypeChip} />
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

  const handleApplyPanelFilters = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    const next: RocketMotorCasingListAdvancedFilters & { status: string } = {
      projectIds: draftProjectId === FILTER_ALL ? [] : [draftProjectId],
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
    setDraftProjectId(FILTER_ALL);
    setDraftMotorStage(FILTER_ALL);
    setDraftCasingType(FILTER_ALL);
    setDraftInsulationType(FILTER_ALL);
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus(FILTER_ALL);
  };

  const searchBarEnd = (
    <Stack direction="row" spacing={1} alignItems="center">
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
      {typeof refreshUserBatches === "function" ? (
        <RefreshIconButton
          onClick={() => {
            void refreshUserBatches();
          }}
          disabled={Boolean(loading || isRefreshing)}
          tooltip={STRINGS.SOURCING.BATCH_LIST.REFRESH_TOOLTIP}
          icon={<RefreshRoundedIcon fontSize="small" />}
        />
      ) : null}
    </Stack>
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

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="flex-end"
        flexWrap={{ xs: "wrap", xl: "nowrap" }}
        useFlexGap
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: "1 1 160px", minWidth: { xs: "100%", sm: 160 }, position: "relative" }}>
          <TextField
            select
            size="small"
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_PROJECT}
            value={draftProjectId}
            onChange={(e) => setDraftProjectId(e.target.value)}
            disabled={projectsLoading}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={theme.batchList.filterPanelField}
            SelectProps={{
              displayEmpty: true,
              MenuProps: {
                PaperProps: {
                  sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
                },
              },
            }}
          >
            <MenuItem value={FILTER_ALL}>{STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_PROJECTS}</MenuItem>
            {!projectsLoading &&
              projectOptions.map((p: { projectId: string; projectName: string }) => (
                <MenuItem key={p.projectId} value={p.projectId}>
                  {p.projectName} ({p.projectId})
                </MenuItem>
              ))}
          </TextField>
          {projectsLoading ? (
            <CircularProgress
              size={16}
              sx={{
                position: "absolute",
                right: 28,
                bottom: 8,
                color: theme.palette.primaryLight,
              }}
            />
          ) : null}
        </Box>

        <Box sx={{ flex: "1 1 140px", minWidth: { xs: "100%", sm: 140 }, position: "relative" }}>
          <TextField
            select
            size="small"
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_MOTOR_STAGE}
            value={draftMotorStage}
            onChange={(e) => setDraftMotorStage(e.target.value)}
            disabled={motorStagesLoading}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={theme.batchList.filterPanelField}
            SelectProps={{
              displayEmpty: true,
              MenuProps: {
                PaperProps: {
                  sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
                },
              },
            }}
          >
            <MenuItem value={FILTER_ALL}>{STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_STAGES}</MenuItem>
            {!motorStagesLoading &&
              motorStageOptions.map((s: { motorStage: string }) => (
                <MenuItem key={s.motorStage} value={s.motorStage}>
                  Stage {s.motorStage}
                </MenuItem>
              ))}
          </TextField>
          {motorStagesLoading ? (
            <CircularProgress
              size={16}
              sx={{
                position: "absolute",
                right: 28,
                bottom: 8,
                color: theme.palette.primaryLight,
              }}
            />
          ) : null}
        </Box>

        <TextField
          select
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_CASING_TYPE}
          value={draftCasingType}
          onChange={(e) => setDraftCasingType(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            ...theme.batchList.filterPanelField,
            flex: "1 1 140px",
            minWidth: { xs: "100%", sm: 140 },
          }}
          SelectProps={{
            displayEmpty: true,
            MenuProps: {
              PaperProps: {
                sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
              },
            },
          }}
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
          InputLabelProps={{ shrink: true }}
          sx={{
            ...theme.batchList.filterPanelField,
            flex: "1 1 140px",
            minWidth: { xs: "100%", sm: 140 },
          }}
          SelectProps={{
            displayEmpty: true,
            MenuProps: {
              PaperProps: {
                sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
              },
            },
          }}
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
          InputLabelProps={{ shrink: true }}
          sx={{
            ...theme.batchList.filterPanelField,
            flex: "1 1 130px",
            minWidth: { xs: "100%", sm: 130 },
          }}
          SelectProps={{
            displayEmpty: true,
            MenuProps: {
              PaperProps: {
                sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
              },
            },
          }}
        >
          {STATUS_DROPDOWN_VALUES.map((s) => (
            <MenuItem key={s} value={s}>
              {s === FILTER_ALL ? FILTER_ALL : statusConfig[s]?.label ?? s}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ flex: "1 1 130px", minWidth: { xs: "100%", sm: 130 } }}>
          <DateField
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_FROM_DATE}
            value={formatToUiDate(draftFrom)}
            onChange={(v) => setDraftFrom(formatToIsoDateInput(v))}
            compact
            sx={{ ...theme.batchList.filterPanelField, mb: 0, width: "100%" }}
          />
        </Box>
        <Box sx={{ flex: "1 1 130px", minWidth: { xs: "100%", sm: 130 } }}>
          <DateField
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_TO_DATE}
            value={formatToUiDate(draftTo)}
            onChange={(v) => setDraftTo(formatToIsoDateInput(v))}
            compact
            sx={{ ...theme.batchList.filterPanelField, mb: 0, width: "100%" }}
          />
        </Box>
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
        statusTabs={statusTabs}
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
        isLoading={loading || isRefreshing}
        loadingMessage={
          isRefreshing ? STRINGS.SOURCING.BATCH_LIST.REFRESHING_MESSAGE : undefined
        }
        searchBarEnd={searchBarEnd}
        filterExtension={filterExtension}
        statusToolbarEnd={
          <WorkflowCreateButton
            label={STRINGS.SOURCING.BATCH_LIST.CREATE_MOTOR_CASING}
            themeTokens={theme}
            onClick={handleCreateMotorCasing}
          />
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
