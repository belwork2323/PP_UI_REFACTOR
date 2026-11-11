import React, { useState } from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import getDashboardTheme from "@app/theme/custom_themes/admin/Dashboard/dashboard_theme";
import useDashboardHook from "@hooks/admin/Dashboard/useDashboardHook";
import { useThemeStore } from "@app/store/themeStore";
import DashboardKpiSection from "./components/DashboardKpiSection";
import DashboardChartsSection from "./components/DashboardChartsSection";
import DashboardBlockchainSection from "../BlockchainEvents/DashboardBlockchainSection";
import DashboardActiveBatchesSection from "./components/DashboardActiveBatchesSection";

/** Admin dashboard: hide Weekly Batch Activity, Motors Processed, QC Pass Rate charts (keep markup). */
const SHOW_ADMIN_DASHBOARD_CHARTS = false;

export default function DashboardPage() {
  const mode = useThemeStore((s) => s.mode);
  const th = getDashboardTheme(mode);
  const t = STRINGS.DASHBOARD_PAGE;
  const { filterMenuProps, filterMenuItemSx } = th;

  const {
    loading,
    statsLoading,
    activeBatchesLoading,
    kpis,
    weeklyActivity,
    motorsProcessed,
    qcPassRate,
    chartUpdatedAt,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    applyCustomDateFilter,
    clearDateFilter,
    filterOpen,
    setFilterOpen,
    toggleFilterOpen,
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
    batchStatusTab,
    setBatchStatusTab,
    batchTabOptions,
  } = useDashboardHook(mode);

  // 🟢 Local state for Active Batches Section Pagination
  const [batchPage, setBatchPage] = useState(0);
  const [batchRowsPerPage, setBatchRowsPerPage] = useState(10);

  // Pagination handlers for Active Batches Section
  const handleBatchPageChange = (_event: unknown, newPage: number) => {
    setBatchPage(newPage);
  };
  const handleBatchRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBatchRowsPerPage(parseInt(event.target.value, 10));
    setBatchPage(0);
  };

  // Sliced data for Active Batches pagination
  const paginatedBatches = filteredBatches.slice(
    batchPage * batchRowsPerPage,
    batchPage * batchRowsPerPage + batchRowsPerPage,
  );

  if (loading) {
    return (
      <Box sx={th.dashboard.adminWrapper}>
        <Box sx={th.loadingPage}>
          <CircularProgress size={36} />
        </Box>
      </Box>
    );
  }

  const isRefreshing = statsLoading;

  return (
    <Box sx={th.dashboard.adminWrapper}>
      <Box sx={th.page}>
        {isRefreshing && (
          <Box sx={th.refreshOverlay}>
            <CircularProgress size={44} />
          </Box>
        )}
        <Stack sx={th.dashboard.pageHeader.wrapper}>
          <Box>
            <Typography sx={th.dashboard.pageHeader.title}>{t.HEADER.TITLE}</Typography>
          </Box>
        </Stack>

        <DashboardKpiSection
          th={th}
          statsLoading={statsLoading}
          kpis={kpis}
          filterType={filterType}
          setFilterType={setFilterType}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          applyCustomDateFilter={applyCustomDateFilter}
          clearDateFilter={clearDateFilter}
        />

        {SHOW_ADMIN_DASHBOARD_CHARTS ? (
          <DashboardChartsSection
            th={th}
            t={t}
            weeklyActivity={weeklyActivity}
            motorsProcessed={motorsProcessed}
            qcPassRate={qcPassRate}
            chartUpdatedAt={chartUpdatedAt}
          />
        ) : null}

        <DashboardActiveBatchesSection
          th={th}
          t={t}
          filterMenuProps={filterMenuProps}
          filterMenuItemSx={filterMenuItemSx}
          activeBatchesLoading={activeBatchesLoading}
          activeBatches={paginatedBatches}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          toggleFilterOpen={toggleFilterOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          batchDraftFilters={batchDraftFilters}
          setBatchDraftFilter={setBatchDraftFilter}
          applyBatchFilters={applyBatchFilters}
          filteredBatches={paginatedBatches}
          activeFilterCount={activeFilterCount}
          clearBatchesFilters={clearBatchesFilters}
          subDepartments={subDepartments}
          toggleCurrentMonth={toggleCurrentMonth}
          batchStatusTab={batchStatusTab}
          setBatchStatusTab={setBatchStatusTab}
          batchTabOptions={batchTabOptions}
          page={batchPage}
          rowsPerPage={batchRowsPerPage}
          totalCount={filteredBatches.length}
          onPageChange={handleBatchPageChange}
          onRowsPerPageChange={handleBatchRowsPerPageChange}
        />
      </Box>
    </Box>
  );
}
