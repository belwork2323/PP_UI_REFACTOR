import React from "react";
import { Box, Stack } from "@mui/material";
import FilterSelect from "@ui/components/common/FilterSelect";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminFilterPanel from "@ui/components/custom/admin/AdminFilterPanel";
import InProgressBatchesTable from "@ui/components/custom/dashboard/InProgressBatchesTable";
import { APPROVER_BATCH_STATUS } from "@data/models/approver/ApproverBatchListModel";
import { STRINGS } from "@app/config/strings";

const AC = STRINGS.ADMIN_COMMON;

type DashboardActiveBatchesSectionProps = {
  th: any;
  t: typeof import("@app/config/strings").STRINGS.DASHBOARD_PAGE;
  filterMenuProps: any;
  filterMenuItemSx: any;
  activeBatchesLoading: boolean;
  activeBatches: any[];
  filterOpen: boolean;
  toggleFilterOpen: () => void;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  batchDraftFilters: {
    stage: string;
    batchType: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    currentMonthOnly: boolean;
  };
  setBatchDraftFilter: <K extends keyof DashboardActiveBatchesSectionProps["batchDraftFilters"]>(
    field: K,
    value: DashboardActiveBatchesSectionProps["batchDraftFilters"][K]
  ) => void;
  applyBatchFilters: () => void;
  filteredBatches: any[];
  activeFilterCount: number;
  clearBatchesFilters: () => void;
  subDepartments: string[];
  toggleCurrentMonth: () => void;
};

export default function DashboardActiveBatchesSection({
  th,
  t,
  filterMenuProps,
  filterMenuItemSx,
  activeBatchesLoading,
  activeBatches,
  filterOpen,
  toggleFilterOpen,
  setFilterOpen,
  searchQuery,
  setSearchQuery,
  batchDraftFilters,
  setBatchDraftFilter,
  applyBatchFilters,
  filteredBatches,
  activeFilterCount,
  clearBatchesFilters,
  subDepartments,
  toggleCurrentMonth,
}: DashboardActiveBatchesSectionProps) {
  const shellTheme = {
    batchListShell: th.batchListShell,
    filterToggle: th.filterToggle,
  };

  return (
    <Box sx={th.dashboard.tableSection}>
      <AdminListShell
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t.PLACEHOLDERS.BATCH_SEARCH}
        filterOpen={filterOpen}
        onFilterToggle={toggleFilterOpen}
        activeFilterCount={activeFilterCount}
        filtersToggleLabel={t.FILTERS.BUTTON}
        resultText={`${filteredBatches.length} / ${activeBatches.length} records`}
        loading={activeBatchesLoading}
        hasItems={filteredBatches.length > 0}
        emptyTitle={t.EMPTY_STATES.NO_BATCHES}
        filterExtension={
          <AdminFilterPanel
            title={t.FILTERS.BUTTON}
            activeFilterCount={activeFilterCount}
            onClear={clearBatchesFilters}
            clearLabel={t.FILTERS.CLEAR_ALL}
            onClose={() => setFilterOpen(false)}
            onApply={applyBatchFilters}
            closeLabel={AC.FILTERS_CLOSE}
            applyLabel={AC.FILTERS_APPLY}
            theme={th}
          >
            <Stack direction="row" gap={1.5} flexWrap="wrap" mb={2}>
              <FilterSelect
                label={t.FILTERS.STAGE}
                value={batchDraftFilters.stage}
                onChange={(e) => setBatchDraftFilter("stage", e.target.value)}
                options={["All", ...subDepartments]}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.filterPanel.field}
              />
              <FilterSelect
                label={t.FILTERS.TYPE}
                value={batchDraftFilters.batchType}
                onChange={(e) => setBatchDraftFilter("batchType", e.target.value)}
                options={t.BATCH_FILTERS.TYPES}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.filterPanel.field}
              />
              <FilterSelect
                label={t.FILTERS.STATUS}
                value={batchDraftFilters.status}
                onChange={(e) => setBatchDraftFilter("status", e.target.value)}
                options={["All", ...Object.values(APPROVER_BATCH_STATUS)]}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.filterPanel.field}
              />
            </Stack>

            <DateRangeRow
              from={batchDraftFilters.dateFrom}
              to={batchDraftFilters.dateTo}
              onFromChange={(v) => {
                setBatchDraftFilter("dateFrom", v);
                setBatchDraftFilter("currentMonthOnly", false);
              }}
              onToChange={(v) => {
                setBatchDraftFilter("dateTo", v);
                setBatchDraftFilter("currentMonthOnly", false);
              }}
              currentMonthOnly={batchDraftFilters.currentMonthOnly}
              onToggleMonth={toggleCurrentMonth}
              fromLabel={t.FILTERS.FROM}
              toLabel={t.FILTERS.TO}
              separatorLabel={t.FILTERS.DATE_SEPARATOR}
              thisMonthLabel={t.FILTERS.THIS_MONTH_CHIP}
              calendarIconSx={th.table.calendarIcon}
              datePickerSx={th.table.datePicker(false)}
              separatorSx={th.table.filterDateSeparator}
              thisMonthChipSx={th.table.thisMonthChip}
            />
          </AdminFilterPanel>
        }
        theme={shellTheme}
      >
        <InProgressBatchesTable
          rows={filteredBatches}
          loading={activeBatchesLoading}
          theme={th}
          title={t.BATCH_TABLE.SECTION_TITLE}
          emptyText={t.EMPTY_STATES.NO_BATCHES}
          cardSx={th.card}
        />
      </AdminListShell>
    </Box>
  );
}
