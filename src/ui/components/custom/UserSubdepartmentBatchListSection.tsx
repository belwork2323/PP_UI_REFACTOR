import type { ElementType } from "react";
import { useMemo } from "react";
import { alpha, IconButton, Stack, Tooltip } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { STRINGS } from "../../../app/config/strings";
import type { getOperationsTheme } from "../../../app/theme/custom_themes/shared/operations_theme";
import { useUserSubdepartmentBatchListFilterBar } from "./UserSubdepartmentBatchListFilterBar";
import type { SubdepartmentBatchListAdvancedFilters } from "../../../hooks/user/useSubdepartmentBatches";
import {
  OPERATION_STATUS,
  MANUFACTURING_STATUS_FILTER_VALUES,
  getOperationStatusFilterLabel,
  isManufacturingViewOnlyStatus,
  type OperationStatusMap,
} from "../../../hooks/operationStatus";
import { SUBDEPARTMENT_BATCH_SEARCH_FIELDS } from "../../../data/models/user/SubdepartmentBatchModel";
import RefreshIconButton from "../common/RefreshIconButton";
import UserBatchList from "./UserBatchList";
import UserWorkflowStatusAction from "./UserWorkflowStatusAction";
import {
  buildSubdepartmentBatchListColumns,
  type SubdepartmentBatchListColumnLabels,
} from "./subdepartmentBatchListColumns";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

type OperationsTheme = ReturnType<typeof getOperationsTheme>;

export type UserSubdepartmentBatchListActionStrings = {
  FILL_ACTION: string;
  CONTINUE_ACTION: string;
  EDIT_ACTION_TOOLTIP: string;
  VIEW_DETAILS_TOOLTIP?: string;
};

export type UserSubdepartmentBatchListHookState = {
  batches: unknown[];
  statusCounts: Record<string, number>;
  totalRecords: number;
  page: number;
  rowsPerPage: number;
  search: string;
  statusFilter: string;
  setPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  loading: boolean;
  isRefreshing?: boolean;
  refreshUserBatches?: () => void | Promise<void>;
  handleFillForm: (row: Record<string, unknown>) => void;
  handleEditForm: (row: Record<string, unknown>) => void;
  advancedFilters: SubdepartmentBatchListAdvancedFilters;
  applyAdvancedFilters: (
    filters: SubdepartmentBatchListAdvancedFilters & {
      status: string;
    },
  ) => void;
  clearAdvancedFilters: () => void;
  activeFilterCount: number;
  motorStageOptions: Array<{ motorStage: string }>;
  motorStagesLoading: boolean;
  projectOptions: Array<{ projectId: string; projectName: string }>;
  projectsLoading: boolean;
  ensureProjectOptions: () => void;
};

export type UserSubdepartmentBatchListSectionProps = {
  hookState: UserSubdepartmentBatchListHookState;
  rowsPerPageOptions?: number[];
  theme: OperationsTheme;
  statusField: string;
  statusLabel: string;
  rawStatusConfig: Record<string, { Icon?: ElementType; label?: string }>;
  statusMap: OperationStatusMap;
  tableLabel: string;
  onViewDetails: (row: Record<string, unknown>) => void;
  PersonIcon: ElementType;
  CalendarIcon: ElementType;
  canViewDetails?: (status: string) => boolean;
  viewDetailsTooltip?: string;
  actionStrings?: UserSubdepartmentBatchListActionStrings;
  columnLabels?: SubdepartmentBatchListColumnLabels;
  statusDropdownValues?: readonly string[];
  extraSearchFields?: string[];
  rejectedStatus?: string;
  emptyText?: string;
  hideAdvancedFilter?: boolean;
  headerActions?: React.ReactNode;
  showBemMotorIds?: boolean;
  /** Inline overlay message while refreshing with existing rows. */
  refreshingMessage?: string;
  /** Hide the built-in list refresh control. */
  hideRefresh?: boolean;
};

const defaultCanViewDetails = (status: string) => isManufacturingViewOnlyStatus(status);

const UserSubdepartmentBatchListSection = ({
  hookState,
  rowsPerPageOptions,
  theme,
  statusField,
  statusLabel,
  rawStatusConfig,
  statusMap,
  tableLabel,
  onViewDetails,
  PersonIcon,
  CalendarIcon,
  canViewDetails = defaultCanViewDetails,
  viewDetailsTooltip = STRINGS.MANUFACTURING.BATCH_LIST.VIEW_DETAILS_TOOLTIP,
  actionStrings = STRINGS.MANUFACTURING.BATCH_LIST,
  columnLabels,
  statusDropdownValues = [FILTER_ALL, ...MANUFACTURING_STATUS_FILTER_VALUES],
  extraSearchFields = [],
  rejectedStatus = OPERATION_STATUS.REJECTED,
  emptyText,
  hideAdvancedFilter = false,
  headerActions = null,
  showBemMotorIds = false,
  refreshingMessage = STRINGS.USER_BATCH_LIST.REFRESHING_MESSAGE,
  hideRefresh = false,
}: UserSubdepartmentBatchListSectionProps) => {
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
    refreshUserBatches,
    handleFillForm,
    handleEditForm,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
    motorStageOptions,
    motorStagesLoading,
    projectOptions,
    projectsLoading,
    ensureProjectOptions,
  } = hookState;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(rawStatusConfig).map(([status, cfg]) => [
          status,
          {
            ...cfg,
            ...(theme.batchList.statusConfig[status] ?? {}),
            label: getOperationStatusFilterLabel(status, { isSourcingLotSubdepartment: false }),
          },
        ]),
      ),
    [rawStatusConfig, theme],
  );

  /** Tabs follow manufacturing statusCounts keys (incl. Waiting for Approval). */
  const statusTabs = useMemo(
    () => statusDropdownValues.filter((status) => status in statusConfig || status === FILTER_ALL),
    [statusConfig, statusDropdownValues],
  );

  const columns = useMemo(
    () =>
      buildSubdepartmentBatchListColumns({
        theme,
        statusConfig,
        statusField,
        statusLabel,
        PersonIcon,
        CalendarIcon,
        labels: columnLabels,
        rejectedStatus,
        showBemMotorIds,
      }),
    [
      CalendarIcon,
      PersonIcon,
      columnLabels,
      rejectedStatus,
      showBemMotorIds,
      statusConfig,
      statusField,
      statusLabel,
      theme,
    ],
  );

  const { searchBarEnd, filterExtension } = useUserSubdepartmentBatchListFilterBar({
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
    projectOptions,
    projectsLoading,
    ensureProjectOptions,
  });

  const displayRows = Array.isArray(batches) ? batches : [];
  const isListBusy = Boolean(loading || isRefreshing);
  const showRefresh = !hideRefresh && typeof refreshUserBatches === "function";

  return (
    <UserBatchList
      rows={displayRows}
      columns={columns}
      statusField={statusField}
      statusConfig={statusConfig}
      statusTabs={statusTabs}
      filters={[]}
      searchFields={[...SUBDEPARTMENT_BATCH_SEARCH_FIELDS, ...extraSearchFields]}
      highlightRow={(row: Record<string, unknown>) => row[statusField] === rejectedStatus}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={tableLabel}
      themeTokens={theme}
      totalRecords={totalRecords ?? 0}
      statusCounts={statusCounts ?? {}}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      isLoading={loading || isRefreshing}
      loadingMessage={isRefreshing ? refreshingMessage : undefined}
      emptyText={emptyText}
      searchBarEnd={
        <Stack direction="row" spacing={1} alignItems="center">
          {!hideAdvancedFilter && searchBarEnd}
          {headerActions}
          {showRefresh ? (
            <RefreshIconButton
              onClick={() => {
                void refreshUserBatches();
              }}
              disabled={isListBusy}
              tooltip={STRINGS.USER_BATCH_LIST.REFRESH_TOOLTIP}
              icon={<RefreshRoundedIcon fontSize="small" />}
            />
          ) : null}
        </Stack>
      }
      filterExtension={hideAdvancedFilter ? null : filterExtension}
      renderAction={(row: Record<string, unknown>) => {
        const status = String(row[statusField] ?? "");
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
            {canViewDetails(status) ? (
              <Tooltip title={viewDetailsTooltip} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => onViewDetails(row)}
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
                status={status}
                row={row}
                statusMap={statusMap}
                onFillForm={handleFillForm}
                onEditForm={handleEditForm}
                theme={theme}
                fillLabel={actionStrings.FILL_ACTION}
                continueLabel={actionStrings.CONTINUE_ACTION}
                editTooltip={actionStrings.EDIT_ACTION_TOOLTIP}
              />
            )}
          </Stack>
        );
      }}
    />
  );
};

export default UserSubdepartmentBatchListSection;
