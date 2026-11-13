import { useMemo } from "react";
import { Box } from "@mui/material";
import { icons } from "@app/theme/icons";
import WorkflowCreateButton from "@ui/components/common/WorkflowCreateButton";
import BatchList from "@ui/components/custom/BatchList";
import ListFilterPanel, { ListFilterToolbar } from "@ui/components/custom/ListFilterPanel";
import { useThemeStore } from "@app/store/themeStore";
import { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import {
  getOperationStatusConfig,
  OPERATION_STATUS,
  SOURCING_LOT_STATUS_FILTER_VALUES,
} from "@hooks/operationStatus";
import { useListFilterDraft } from "@hooks/useListFilterDraft";
import { RAW_MATERIAL_LOT_SEARCH_FIELDS } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { STRINGS } from "@app/config/strings";
import type { RawMaterialSourcingMainState } from "@hooks/user/sourcing/rms/useRawMaterialSourcingMain";
import { getFromToOrderMessages } from "@data/validation/dateRangeValidation";
import FilterFields from "@ui/components/custom/FilterFields";
import { getLotFilterFields, type LotFilterDraft } from "./components/lotFilterFields";
import RawMaterialLotRowActions from "./components/RawMaterialLotRowActions";
import { getRawMaterialLotListColumns } from "./components/rawMaterialLotListColumns";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

const BL = STRINGS.SOURCING.BATCH_LIST;
const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
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
  flexWrap: { xs: "wrap", lg: "nowrap" },
  useFlexGap: true,
  sx: { width: "100%" },
} as const;

type RawMaterialSourcingListPageProps = {
  hookState: RawMaterialSourcingMainState;
  rowsPerPageOptions?: number[];
};

const RawMaterialSourcingListPage = ({
  hookState,
  rowsPerPageOptions,
}: RawMaterialSourcingListPageProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialSourcingPageTheme(mode), [mode]);

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

  const filterPanel = useListFilterDraft<LotFilterDraft>({
    empty: { material: FILTER_ALL, manufacturer: "", status: FILTER_ALL, from: "", to: "" },
    fromApplied: () => ({
      material:
        advancedFilters.materialCodes.length === 1 ? advancedFilters.materialCodes[0]! : FILTER_ALL,
      manufacturer: advancedFilters.manufacturer,
      status: statusFilter,
      from: advancedFilters.fromDate,
      to: advancedFilters.toDate,
    }),
    statusFilter,
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
  const columns = useMemo(
    () => getRawMaterialLotListColumns(theme, statusConfig),
    [theme, statusConfig],
  );
  const statusOptions = useMemo(
    () =>
      STATUS_DROPDOWN_VALUES.map((status) => ({
        value: status,
        label: status === FILTER_ALL ? FILTER_ALL : (statusConfig[status]?.label ?? status),
      })),
    [statusConfig],
  );

  const draftDateRangeErrors = getFromToOrderMessages(draft.from, draft.to, "date");
  const filterFields = getLotFilterFields({
    filterAllLabel: FILTER_ALL,
    materialOptions,
    materialsLoading,
    statusOptions,
    dateErrors: draftDateRangeErrors,
  });

  const handleApplyPanelFilters = () => {
    if (draftDateRangeErrors) return;
    applyAdvancedFilters({
      materialCodes: draft.material === FILTER_ALL ? [] : [draft.material],
      manufacturer: draft.manufacturer,
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
      title={BL.FILTERS_TITLE}
      activeCount={activeFilterCount}
      onClear={handleClearAllFilters}
      onClose={filterPanel.close}
      onApply={handleApplyPanelFilters}
      fieldRowProps={FILTER_FIELD_ROW_PROPS}
      applyButtonSx={theme.sourcing.rawMaterial.lotList.applyButton}
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
        searchFields={[...RAW_MATERIAL_LOT_SEARCH_FIELDS]}
        highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
        highlightColor={theme.palette.danger}
        rowsPerPageOptions={rowsPerPageOptions}
        tableLabel={BL.RM_TITLE}
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
          <WorkflowCreateButton label={BL.CREATE_LOT} themeTokens={theme} onClick={handleCreateLot} />
        }
        renderAction={(row: any) => (
          <RawMaterialLotRowActions
            row={row}
            theme={theme}
            onFillForm={handleFillForm}
            onEditLot={handleEditLot}
            onDeleteLot={handleDeleteLotFromList}
            onViewDetails={handleViewLotDetails}
          />
        )}
      />
    </Box>
  );
};

export default RawMaterialSourcingListPage;
