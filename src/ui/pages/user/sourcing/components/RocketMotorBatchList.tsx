import { useMemo } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { alpha, Box, IconButton, Stack, Tooltip } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import WorkflowCreateButton from "../../../../components/common/WorkflowCreateButton";
import BatchList from "../../../../components/custom/BatchList";
import FilterFields from "../../../../components/custom/FilterFields";
import ListFilterPanel, { ListFilterToolbar } from "../../../../components/custom/ListFilterPanel";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getRocketMotorCasingPageTheme } from "@app/theme/custom_themes/user/sourcing/rocketMotorCasing_theme";
import {
  getOperationStatusConfig,
  OPERATION_STATUS,
  SOURCING_LOT_STATUS_FILTER_VALUES,
} from "../../../../../hooks/operationStatus";
import { useListFilterDraft } from "../../../../../hooks/useListFilterDraft";
import { STRINGS } from "../../../../../app/config/strings";
import {
  canDeleteRocketMotorCasing,
  ROCKET_MOTOR_CASING_SEARCH_FIELDS,
} from "../../../../../data/models/user/RocketMotorCasingProcurementModel";
import { getFromToOrderMessages } from "../../../../../data/validation/dateRangeValidation";
import { getCasingListColumns } from "./casingListColumns";
import { getCasingFilterFields, type CasingFilterDraft } from "./casingFilterFields";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  visibility: VisibilityRoundedIcon,
} = icons.user.sourcing.rocketMotorBatchList;

const BL = STRINGS.SOURCING.BATCH_LIST;
const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

export const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const STATUS_DROPDOWN_VALUES = [FILTER_ALL, ...SOURCING_LOT_STATUS_FILTER_VALUES] as const;

const FILTER_FIELD_ROW_PROPS = {
  direction: "row",
  spacing: 1.25,
  alignItems: "flex-end",
  flexWrap: { xs: "wrap", xl: "nowrap" },
  useFlexGap: true,
  sx: { width: "100%" },
} as const;

const EMPTY_DRAFT: CasingFilterDraft = {
  projectId: FILTER_ALL,
  motorStage: FILTER_ALL,
  casingType: FILTER_ALL,
  insulationType: FILTER_ALL,
  status: FILTER_ALL,
  from: "",
  to: "",
};

const singleOrAll = (values: string[]) => (values.length === 1 ? values[0]! : FILTER_ALL);
const toList = (value: string) => (value === FILTER_ALL ? [] : [value]);

const canViewCasingDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

const RocketMotorBatchList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRocketMotorCasingPageTheme(mode), [mode]);

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

  const filterPanel = useListFilterDraft<CasingFilterDraft>({
    empty: EMPTY_DRAFT,
    fromApplied: () => ({
      projectId: singleOrAll(advancedFilters.projectIds),
      motorStage: singleOrAll(advancedFilters.motorStages),
      casingType: singleOrAll(advancedFilters.casingTypes),
      insulationType: singleOrAll(advancedFilters.insulationTypes),
      status: statusFilter,
      from: advancedFilters.fromDate,
      to: advancedFilters.toDate,
    }),
    statusFilter,
    onOpen: () => {
      void ensureMotorStageOptions?.();
      void ensureProjectOptions?.();
    },
  });
  const { draft } = filterPanel;

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

  const statusTabs = useMemo(() => [FILTER_ALL, ...SOURCING_LOT_STATUS_FILTER_VALUES], []);
  const columns = useMemo(() => getCasingListColumns(theme, statusConfig), [theme, statusConfig]);
  const statusOptions = useMemo(
    () =>
      STATUS_DROPDOWN_VALUES.map((status) => ({
        value: status,
        label: status === FILTER_ALL ? FILTER_ALL : (statusConfig[status]?.label ?? status),
      })),
    [statusConfig],
  );

  const draftDateRangeErrors = getFromToOrderMessages(draft.from, draft.to, "date");
  const filterFields = getCasingFilterFields({
    filterAllLabel: FILTER_ALL,
    projectOptions,
    projectsLoading,
    motorStageOptions,
    motorStagesLoading,
    statusOptions,
    dateErrors: draftDateRangeErrors,
  });

  const handleApplyPanelFilters = () => {
    if (draftDateRangeErrors) return;
    applyAdvancedFilters({
      projectIds: toList(draft.projectId),
      motorStages: toList(draft.motorStage),
      casingTypes: toList(draft.casingType),
      insulationTypes: toList(draft.insulationType),
      fromDate: draft.from,
      toDate: draft.to,
      status: draft.status,
    });
    filterPanel.close();
  };

  const handleClearAllFilters = () => {
    clearAdvancedFilters();
    filterPanel.resetDraft();
  };

  const searchBarEnd = (
    <ListFilterToolbar
      palette={theme.palette}
      activeCount={activeFilterCount}
      isOpen={filterPanel.isOpen}
      onToggle={filterPanel.toggle}
      onRefresh={
        typeof refreshUserBatches === "function" ? () => void refreshUserBatches() : undefined
      }
      refreshDisabled={Boolean(loading || isRefreshing)}
    />
  );

  const filterExtension = filterPanel.isOpen ? (
    <ListFilterPanel
      palette={theme.palette}
      title={BL.FILTERS_TITLE_MOTOR}
      activeCount={activeFilterCount}
      onClear={handleClearAllFilters}
      onClose={filterPanel.close}
      onApply={handleApplyPanelFilters}
      fieldRowProps={FILTER_FIELD_ROW_PROPS}
      applyButtonSx={{ ...theme.batchList.action.primary, textTransform: "none" }}
    >
      <FilterFields
        fields={filterFields}
        draft={draft}
        onDraftChange={filterPanel.updateDraft}
        theme={theme}
      />
    </ListFilterPanel>
  ) : null;

  return (
    <Box>
      <BatchList
        rows={batches}
        columns={columns}
        statusField="rmStatus"
        statusConfig={statusConfig}
        statusTabs={statusTabs}
        filters={[]}
        searchFields={[...ROCKET_MOTOR_CASING_SEARCH_FIELDS]}
        highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
        highlightColor={theme.palette.danger}
        rowsPerPageOptions={rowsPerPageOptions}
        tableLabel={BL.MOTOR_TITLE}
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
        loadingMessage={isRefreshing ? BL.REFRESHING_MESSAGE : undefined}
        searchBarEnd={searchBarEnd}
        filterExtension={filterExtension}
        statusToolbarEnd={
          <WorkflowCreateButton
            label={BL.CREATE_MOTOR_CASING}
            themeTokens={theme}
            onClick={handleCreateMotorCasing}
          />
        }
        renderAction={(row: any) => (
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="nowrap">
            {canViewCasingDetails(row.rmStatus) ? (
              <Tooltip title={BL.VIEW_CASING_DETAILS_TOOLTIP} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleViewCasingDetails(row)}
                  aria-label={BL.VIEW_CASING_DETAILS}
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
                fillLabel={BL.FILL_ACTION}
                continueLabel={BL.CONTINUE_ACTION}
                editTooltip={BL.EDIT_ACTION_TOOLTIP}
              />
            )}
            {canDeleteRocketMotorCasing(row.rmStatus) && (
              <Tooltip title={BL.DELETE_CASING_TOOLTIP} arrow placement="top">
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
