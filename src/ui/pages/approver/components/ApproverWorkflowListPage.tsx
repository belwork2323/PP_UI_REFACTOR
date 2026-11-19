import { useMemo } from "react";

import { STRINGS } from "@app/config/strings";
import { useApproverListRefreshStore } from "@app/store/approverListRefreshStore";
import { getFromToOrderMessages } from "@data/validation/dateRangeValidation";
import { useListFilterDraft } from "@hooks/useListFilterDraft";
import Card from "@ui/components/common/Card";
import DataTable from "@ui/components/common/DataTable";
import ApproverList from "@ui/components/custom/ApproverList";
import BatchTable, { type BatchTableColumn } from "@ui/components/custom/BatchTable";
import FilterFields from "@ui/components/custom/FilterFields";
import ListFilterPanel, { ListFilterToolbar } from "@ui/components/custom/ListFilterPanel";
import type {
  ApproverWorkflowFilterDraft,
  ApproverWorkflowListConfig,
} from "./approverWorkflowTypes";

type ApproverWorkflowListPageProps = {
  config: ApproverWorkflowListConfig;
  onViewDetails: (row: any) => void;
};

const ApproverWorkflowListPage = ({ config, onViewDetails }: ApproverWorkflowListPageProps) => {
  const list = config.useListState();
  const {
    statusMeta,
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    materialOptions,
    materialsLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusOptions,
    filterAllLabel,
  } = list;
  const bumpListVersion = useApproverListRefreshStore((state) => state.bumpVersion);

  const emptyDraft = useMemo<ApproverWorkflowFilterDraft>(
    () => ({
      material: filterAllLabel,
      manufacturer: "",
      status: filterAllLabel,
      from: "",
      to: "",
    }),
    [filterAllLabel],
  );

  const filterPanel = useListFilterDraft<ApproverWorkflowFilterDraft>({
    empty: emptyDraft,
    fromApplied: () => ({
      material: appliedFilters.materialCode || filterAllLabel,
      manufacturer: appliedFilters.manufacturer || "",
      status: statusFilter,
      from: appliedFilters.fromDate,
      to: appliedFilters.toDate,
    }),
    statusFilter,
  });
  const { draft } = filterPanel;

  const draftDateRangeErrors = getFromToOrderMessages(draft.from, draft.to, "date");

  const filterFields = config.getFilterFields({
    filterAllLabel,
    materialOptions,
    materialsLoading,
    statusOptions,
    dateErrors: draftDateRangeErrors,
  });

  const columns = useMemo(
    () => config.getColumns({ statusMeta, onViewDetails }),
    [config, statusMeta, onViewDetails],
  );

  const handleApplyPanelFilters = () => {
    if (draftDateRangeErrors) return;
    applyPanelFilters({
      materialCode: draft.material === filterAllLabel ? "" : draft.material,
      manufacturer: draft.manufacturer?.trim() ?? "",
      fromDate: draft.from,
      toDate: draft.to,
      status: draft.status,
    });
    filterPanel.close();
  };

  const handleClearAllFilters = () => {
    clearListFilters();
    filterPanel.resetDraft();
  };

  const searchBarEnd = (
    <ListFilterToolbar
      palette={config.filterPalette}
      activeCount={activeFilterCount}
      isOpen={filterPanel.isOpen}
      onToggle={filterPanel.toggle}
      onRefresh={bumpListVersion}
    />
  );

  const filterExtension = filterPanel.isOpen ? (
    <ListFilterPanel
      palette={config.filterPalette}
      title={config.filterTitle}
      activeCount={activeFilterCount}
      onClear={handleClearAllFilters}
      onClose={filterPanel.close}
      onApply={handleApplyPanelFilters}
      fieldRowProps={config.filterFieldRowProps}
      applyButtonSx={config.filterApplyButtonSx}
    >
      <FilterFields
        fields={filterFields}
        draft={draft}
        onDraftChange={filterPanel.updateDraft}
        theme={config.filterFieldsTheme}
      />
    </ListFilterPanel>
  ) : null;

  return (
    <ApproverList
      department={config.department}
      subDepartment={config.subDepartment}
      statusField={config.statusField}
      statusMeta={statusMeta}
      statusTabsOverride={statusTabs}
      activeStatusOverride={statusFilter}
      onActiveStatusChange={setStatusFilter}
      listFilters={listFiltersRecord}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      searchKeys={config.searchKeys}
      searchPlaceholder={config.searchPlaceholder}
    >
      {(filtered, slot) => {
        const batch = config.batchTable;
        const table = batch ? (
          <BatchTable
            rows={filtered}
            columns={columns as BatchTableColumn[]}
            startIndex={0}
            isLoading={false}
            tableLabel={batch.tableLabel ?? STRINGS.USER_BATCH_LIST.DEFAULT_LABEL}
            emptyText={batch.emptyText ?? STRINGS.APPROVER.LIST.EMPTY_TITLE}
            headerCellSx={batch.headerCellSx}
            bodyCellSx={batch.bodyCellSx}
            emptySx={batch.emptySx}
            stripedRowEven={batch.stripedRowEven}
            stripedRowOdd={batch.stripedRowOdd}
            hoverColor={batch.hoverColor}
            textSub={batch.textSub}
            highlightRow={batch.highlightRow}
            highlightColor={batch.highlightColor ?? batch.hoverColor}
            renderAction={
              config.renderAction
                ? (row) => config.renderAction!(row, onViewDetails)
                : undefined
            }
          />
        ) : (
          <DataTable
            columns={columns as any}
            rows={filtered}
            getRowKey={config.getRowKey}
            headerCellSx={config.tableSx?.headerCellSx}
            bodyCellSx={config.tableSx?.bodyCellSx}
            rowSx={config.tableSx?.rowSx}
          />
        );
        const tableWithPagination = (
          <>
            {table}
            {slot?.pagination}
          </>
        );
        const content = config.renderTableChrome ? (
          config.renderTableChrome(tableWithPagination)
        ) : (
          <Card elevation={0} disableContent>
            {tableWithPagination}
          </Card>
        );
        return content;
      }}
    </ApproverList>
  );
};

export default ApproverWorkflowListPage;
