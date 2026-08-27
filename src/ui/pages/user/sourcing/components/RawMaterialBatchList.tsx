import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
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
import {
  getOperationStatusConfig,
  OPERATION_STATUS,
  SOURCING_LOT_STATUS_FILTER_VALUES,
} from "../../../../../hooks/operationStatus";
import {
  canDeleteRawMaterialLot,
  RAW_MATERIAL_LOT_SEARCH_FIELDS,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import { STRINGS } from "../../../../../app/config/strings";
import type { RawMaterialLotListAdvancedFilters } from "../../../../../hooks/user/sourcing/useRawMaterialLotList";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

export const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const STATUS_DROPDOWN_VALUES = [FILTER_ALL, ...SOURCING_LOT_STATUS_FILTER_VALUES] as const;

/** Lot metadata edit — only for drafts not yet in workflow filling */
const canShowEditLotButton = (status: string) => status === OPERATION_STATUS.TO_BE_INITIATED;

const canViewLotDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

const { visibility: VisibilityRoundedIcon } = icons.user.sourcing.rawMaterialBatchList;

const RawMaterialBatchList = ({ hookState, rowsPerPageOptions }: any) => {
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
    handleEditLot,
    handleDeleteLotFromList,
    handleViewLotDetails,
    handleCreateLot,
    materialOptions,
    materialsLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
    refreshUserBatches,
  } = hookState;

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMaterial, setDraftMaterial] = useState(FILTER_ALL);
  const [draftManufacturer, setDraftManufacturer] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(FILTER_ALL);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftMaterial(
      advancedFilters.materialCodes.length === 1 ? advancedFilters.materialCodes[0]! : FILTER_ALL,
    );
    setDraftManufacturer(advancedFilters.manufacturer);
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
        fontSize: "0.75rem", // Increased from 0.62rem
        height: "28px", // Standard "small" is 24px, "medium" is 32px. 28px is a nice middle ground.
        px: 0.5, // Adds a bit of horizontal padding
        borderColor: alpha(theme.palette.danger, 0.35),
        color: theme.palette.danger,
        "& .MuiChip-label": {
          px: 1.5, // Specifically increases padding around the text label
        },
      },
    }),
    [theme.palette],
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: "lotId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_LOT_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "sourcingId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_SOURCING_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v || "—"}</Typography>,
      },
      {
        key: "materialCode",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MATERIAL_CODE,
        align: "center",
        render: (v: string) => <Chip label={v} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "grade.gradeName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_GRADE,
        render: (_v: string, row: { grade?: { gradeName?: string; gradeCode?: string } | null }) => (
          <Typography sx={theme.batchList.subtleText}>
            {row.grade?.gradeName || row.grade?.gradeCode || "—"}
          </Typography>
        ),
      },
      {
        key: "materialName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MATERIAL_NAME,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "supplyOrderNo",
        label: STRINGS.SOURCING.BATCH_LIST.COL_SUPPLY_ORDER,
        render: (v: string) => <Typography sx={theme.batchList.subtleText}>{v}</Typography>,
      },
      {
        key: "receiptDate",
        label: STRINGS.SOURCING.BATCH_LIST.COL_RECEIPT_DATE,
        render: (v: string) => (
          <IconText
            icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
            text={v || "—"}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "manufacturerName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MANUFACTURER,
        render: (v: string) => <Typography sx={theme.batchList.subtleText}>{v}</Typography>,
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
            text={
              v
                ? new Date(v).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "rmStatus",
        label: STRINGS.SOURCING.BATCH_LIST.COL_RM_STATUS,
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
    [statusConfig, theme],
  );

  const handleApplyPanelFilters = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    const next: RawMaterialLotListAdvancedFilters & { status: string } = {
      materialCodes: draftMaterial === FILTER_ALL ? [] : [draftMaterial],
      manufacturer: draftManufacturer,
      fromDate: from,
      toDate: to,
      status: draftStatus,
    };
    applyAdvancedFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearAdvancedFilters();
    setDraftMaterial(FILTER_ALL);
    setDraftManufacturer("");
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
        title={STRINGS.SOURCING.BATCH_LIST.FILTERS_TITLE}
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
        flexWrap={{ xs: "wrap", lg: "nowrap" }}
        useFlexGap
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: "1 1 160px", minWidth: { xs: "100%", sm: 160 }, position: "relative" }}>
          <TextField
            select
            size="small"
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_MATERIAL}
            value={draftMaterial}
            onChange={(e) => setDraftMaterial(e.target.value)}
            disabled={materialsLoading}
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
            <MenuItem value={FILTER_ALL}>
              {STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_MATERIALS}
            </MenuItem>
            {!materialsLoading &&
              materialOptions.map((m: { materialCode: string; materialName: string }) => (
                <MenuItem key={m.materialCode} value={m.materialCode}>
                  {m.materialCode} — {m.materialName}
                </MenuItem>
              ))}
          </TextField>
          {materialsLoading ? (
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
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_MANUFACTURER}
          value={draftManufacturer}
          onChange={(e) => setDraftManufacturer(e.target.value)}
          placeholder="e.g. Prefiled"
          InputLabelProps={{ shrink: true }}
          sx={{
            ...theme.batchList.filterPanelField,
            flex: "1 1 160px",
            minWidth: { xs: "100%", sm: 160 },
          }}
        />

        <TextField
          select
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_STATUS}
          value={draftStatus}
          onChange={(e) => setDraftStatus(e.target.value)}
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
          {STATUS_DROPDOWN_VALUES.map((s) => (
            <MenuItem key={s} value={s}>
              {s === FILTER_ALL ? FILTER_ALL : (statusConfig[s]?.label ?? s)}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ flex: "1 1 140px", minWidth: { xs: "100%", sm: 140 } }}>
          <DateField
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_FROM_DATE}
            value={formatToUiDate(draftFrom)}
            onChange={(v) => setDraftFrom(formatToIsoDateInput(v))}
            compact
            sx={{ ...theme.batchList.filterPanelField, mb: 0, width: "100%" }}
          />
        </Box>
        <Box sx={{ flex: "1 1 140px", minWidth: { xs: "100%", sm: 140 } }}>
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
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilterOpen(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {STRINGS.SOURCING.BATCH_LIST.FILTERS_CLOSE_PANEL}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleApplyPanelFilters}
          sx={{ ...theme.batchList.action.primary, textTransform: "none" }}
        >
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
        searchFields={[...RAW_MATERIAL_LOT_SEARCH_FIELDS]}
        highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
        highlightColor={theme.palette.danger}
        rowsPerPageOptions={rowsPerPageOptions}
        tableLabel={STRINGS.SOURCING.BATCH_LIST.RM_TITLE}
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
            label={STRINGS.SOURCING.BATCH_LIST.CREATE_LOT}
            themeTokens={theme}
            onClick={handleCreateLot}
          />
        }
        renderAction={(row: any) => (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            flexWrap="wrap"
          >
            {canViewLotDetails(row.rmStatus) ? (
              <Tooltip
                title={STRINGS.SOURCING.BATCH_LIST.VIEW_LOT_DETAILS_TOOLTIP}
                arrow
                placement="top"
              >
                <IconButton
                  size="small"
                  onClick={() => handleViewLotDetails(row)}
                  aria-label={STRINGS.SOURCING.BATCH_LIST.VIEW_LOT_DETAILS}
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
                onEditForm={handleEditLot}
                theme={theme}
                fillLabel={STRINGS.SOURCING.BATCH_LIST.FILL_ACTION}
                continueLabel={STRINGS.SOURCING.BATCH_LIST.CONTINUE_ACTION}
                continueUsesPrimaryStyle
                editLabel={STRINGS.SOURCING.BATCH_LIST.EDIT_LOT}
                editTooltip={STRINGS.SOURCING.BATCH_LIST.EDIT_ACTION_TOOLTIP}
              />
            )}
            {canShowEditLotButton(row.rmStatus) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleEditLot(row)}
                sx={theme.batchList.action.secondary}
              >
                {STRINGS.SOURCING.BATCH_LIST.EDIT_LOT}
              </Button>
            )}
            {canDeleteRawMaterialLot(row.rmStatus) && (
              <Tooltip title={STRINGS.SOURCING.BATCH_LIST.DELETE_LOT_TOOLTIP} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteLotFromList(row)}
                  sx={{
                    color: theme.palette.danger,
                    border: `1px solid ${alpha(theme.palette.danger, 0.35)}`,
                    borderRadius: 1.5,
                    "&:hover": { background: alpha(theme.palette.danger, 0.08) },
                  }}
                  aria-label={STRINGS.SOURCING.BATCH_LIST.DELETE_LOT}
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

export default RawMaterialBatchList;
