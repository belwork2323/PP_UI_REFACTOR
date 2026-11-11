import { Box, Stack, Typography } from "@mui/material";
import useDashboardHook from "@/hooks/admin/Dashboard/useDashboardHook";
import { useThemeStore } from "@/app/store/themeStore";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";
import { STRINGS } from "@/app/config/strings";
import DashboardBlockchainSection from "./DashboardBlockchainSection";
import DashboardKpiSection from "../Dashboard/components/DashboardKpiSection";
import { useBlockchainEventsHook } from "@/hooks/admin/BlockchainEvents/useBlockchainEventsHook";
import AdminManagementPageHeader from "@/ui/components/custom/admin/AdminManagementPageHeader";
import getExploreBlockchainTheme from "@/app/theme/custom_themes/admin/ExploreBlockchain/exploreBlockchain_theme";
import AdminManagementFormHeader from "@/ui/components/custom/admin/AdminManagementFormHeader";

const BlockchainEvents = () => {
  const mode = useThemeStore((s) => s.mode);
  const th = getDashboardTheme(mode);
  const theme = getExploreBlockchainTheme(mode);
  const t = STRINGS.DASHBOARD_PAGE;
  const { filterMenuProps, filterMenuItemSx } = th;

  const {
    statsLoading,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    applyCustomDateFilter,
    clearDateFilter,
    globalDateBounds,
  } = useDashboardHook(mode);

  const {
    batchesList,
    batchesLoading,
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
    blockchainActiveTab,
    setBlockchainActiveTab,
    blockchainPage,
    blockchainRowsPerPage,
    onBlockchainPageChange,
    onBlockchainRowsPerPageChange,
    blockchainTabOptions,
    batchEventsCache,
    fetchEventsForBatch,
  } = useBlockchainEventsHook(globalDateBounds);

  return (
    <Box sx={th.dashboard.adminWrapper}>
      <Box sx={th.page}>
        <AdminManagementPageHeader
          title={t.BLOCKCHAIN_HEADER.TITLE}
          subtitle={t.BLOCKCHAIN_HEADER.SUB_TITLE}
          theme={theme}
        />

        <DashboardKpiSection
          th={th}
          statsLoading={statsLoading}
          filterType={filterType}
          setFilterType={setFilterType}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          applyCustomDateFilter={applyCustomDateFilter}
          clearDateFilter={clearDateFilter}
        />

        <DashboardBlockchainSection
          th={th}
          t={t}
          batchEventsCache={batchEventsCache}
          fetchEventsForBatch={fetchEventsForBatch}
          filterMenuProps={filterMenuProps}
          filterMenuItemSx={filterMenuItemSx}
          batchesList={batchesList}
          batchesLoading={batchesLoading}
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
          activeTab={blockchainActiveTab}
          setActiveTab={setBlockchainActiveTab}
          page={blockchainPage}
          rowsPerPage={blockchainRowsPerPage}
          totalCount={batchesList.length}
          onPageChange={onBlockchainPageChange}
          onRowsPerPageChange={onBlockchainRowsPerPageChange}
          blockchainTabOptions={blockchainTabOptions}
        />
      </Box>
    </Box>
  );
};
export default BlockchainEvents;
