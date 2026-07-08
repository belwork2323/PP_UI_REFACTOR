import React from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import getDashboardTheme from "@app/theme/custom_themes/admin/Dashboard/dashboard_theme";
import useDashboardHook from "@hooks/admin/Dashboard/useDashboardHook";
import { useThemeStore } from "@app/store/themeStore";
import DashboardKpiSection from "./components/DashboardKpiSection";
import DashboardChartsSection from "./components/DashboardChartsSection";
import DashboardActiveBatchesSection from "./components/DashboardActiveBatchesSection";
import DashboardBlockchainSection from "./components/DashboardBlockchainSection";

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
    recentEvents,
    activeBatches,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
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
    eventsLoading,
    eventsFilterOpen,
    setEventsFilterOpen,
    toggleEventsFilterOpen,
    eventsSearchQuery,
    setEventsSearchQuery,
    eventsDraftFilters,
    setEventsDraftFilter,
    applyEventsFilters,
    eventsActiveFilterCount,
    clearEventsFilters,
    clearBatchesFilters,
    subDepartments,
    toggleCurrentMonth,
  } = useDashboardHook(mode);

  if (loading) {
    return (
      <Box sx={th.dashboard.adminWrapper}>
        <Box sx={th.loadingPage}>
          <CircularProgress size={36} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={th.dashboard.adminWrapper}>
      <Box sx={th.page}>
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
        />

        <DashboardChartsSection
          th={th}
          t={t}
          weeklyActivity={weeklyActivity}
          motorsProcessed={motorsProcessed}
          qcPassRate={qcPassRate}
          chartUpdatedAt={chartUpdatedAt}
        />

        <DashboardActiveBatchesSection
          th={th}
          t={t}
          filterMenuProps={filterMenuProps}
          filterMenuItemSx={filterMenuItemSx}
          activeBatchesLoading={activeBatchesLoading}
          activeBatches={activeBatches}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          toggleFilterOpen={toggleFilterOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          batchDraftFilters={batchDraftFilters}
          setBatchDraftFilter={setBatchDraftFilter}
          applyBatchFilters={applyBatchFilters}
          filteredBatches={filteredBatches}
          activeFilterCount={activeFilterCount}
          clearBatchesFilters={clearBatchesFilters}
          subDepartments={subDepartments}
          toggleCurrentMonth={toggleCurrentMonth}
        />

        <DashboardBlockchainSection
          th={th}
          t={t}
          filterMenuProps={filterMenuProps}
          filterMenuItemSx={filterMenuItemSx}
          recentEvents={recentEvents}
          eventsLoading={eventsLoading}
          eventsFilterOpen={eventsFilterOpen}
          setEventsFilterOpen={setEventsFilterOpen}
          toggleEventsFilterOpen={toggleEventsFilterOpen}
          eventsSearchQuery={eventsSearchQuery}
          setEventsSearchQuery={setEventsSearchQuery}
          eventsDraftFilters={eventsDraftFilters}
          setEventsDraftFilter={setEventsDraftFilter}
          applyEventsFilters={applyEventsFilters}
          eventsActiveFilterCount={eventsActiveFilterCount}
          clearEventsFilters={clearEventsFilters}
        />
      </Box>
    </Box>
  );
}
