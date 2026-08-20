// src/pages/system_manager/components/DashboardPage.jsx
//
// Zero static data — dashboard state is assembled in useSMDashboard().
// stageConfig is fetched and passed directly to BatchDetailPopup.

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  Divider,
  Badge,
  CircularProgress,
  Collapse,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { LineChart, BarChart } from "@mui/x-charts";
import Menu from "@mui/material/Menu";

import getSystemManagerTheme from "../../../app/theme/custom_themes/system_manager/sysDashboard_theme";
import { getSharedTheme } from "../../../app/theme/custom_themes/shared/shared_theme";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { Panel, PanelHeader, AlertIcon } from "./components/SystemManagerWidgets";
import { useThemeStore } from "../../../app/store/themeStore";
import useSMDashboard from "../../../hooks/system_manager/useSMDashboardHook";
import useSMInProgressBatches from "../../../hooks/system_manager/useSMInProgressBatchesHook";
import useSMNotificationMenu from "../../../hooks/system_manager/useSMNotificationMenuHook";
import DashboardChartCard from "../../components/custom/dashboard/DashboardChartCard";
import { DashKPICard } from "../../components/custom/dashboard/DashKPICard";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "../../components/custom/dashboard/DashboardDateFilter";
import InProgressBatchesTable from "../../components/custom/dashboard/InProgressBatchesTable";
import FilterToggleButton from "../../components/common/FilterToggleButton";
import FilterSelect from "../../components/common/FilterSelect";
import BatchDetailPopup from "./components/BatchDetails";
import StageStatusPanel from "./components/StageStatusPanel";
import ToggleTabs from "@/ui/components/common/ToggleTabs";
import { BatchTab, batchTabOptions } from "@/hooks/admin/Dashboard/useDashboardHook";
import AdminListShell from "@/ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@/ui/components/custom/admin/AdminListFilterPanel";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";

const {
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  Schedule,
  Notifications,
  MoreVert,
  Inventory2,
  Science,
  Verified,
  LocalShipping,
  AssignmentTurnedIn,
  Block,
  Error: ErrorIconMUI,
  Warning,
  Search,
  Close,
} = icons.systemManager;

// ── Icon resolution maps ──────────────────────────────────────────────────────
const KPI_ICON_MAP = {
  Inventory2,
  TrendingUp,
  CheckCircle,
  Warning,
  Schedule,
  AssignmentTurnedIn,
  Block,
  Error: ErrorIconMUI,
};

function resolveKpiIcon(iconKey) {
  return KPI_ICON_MAP[iconKey] ?? Inventory2;
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SystemManagerDashboard() {
  const mode = useThemeStore((s) => s.mode);
  const t = useMemo(() => getSystemManagerTheme(mode), [mode]);
  const sharedTh = useMemo(() => getSharedTheme(mode), [mode]);
  const adminTh = useMemo(() => getDashboardTheme(mode), [mode]);
  const S = STRINGS.SYSTEM_MANAGER_DASHBOARD;
  const DP = STRINGS.DASHBOARD_PAGE;
  const shellTheme = {
    batchListShell: adminTh.batchListShell,
    filterToggle: adminTh.filterToggle,
  };
  const {
    dashboard,
    alerts,
    alertsLoading,
    loading,
    statsLoading,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    applyCustomDateFilter,
    clearDateFilter,
    dateBounds,
    loadAlerts,
  } = useSMDashboard(t.dashboardConfig);

  const { kpiData, stageMetrics, stageData, blockEvents, chartData, stageConfig, chartUpdatedAt } =
    dashboard;
  const chartTheme = t.sharedCharts;

  const chartTimestamp = (() => {
    if (!chartUpdatedAt) return "not yet loaded";
    return `updated ${chartUpdatedAt.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  })();

  const [dateFilterOpen, setDateFilterOpen] = useState(true);
  const dateFilterCount = filterType !== S.DATE_FILTER.VALUES.ONE_YEAR ? 1 : 0;
  const { filterMenuProps, filterMenuItemSx } = sharedTh;

  const {
    batchFilterOpen,
    setBatchFilterOpen,
    toggleBatchFilterOpen,

    batchSearch,
    setBatchSearch,

    batchDraftFilters,
    setBatchDraftFilter,

    activeBatchFilterCount,
    clearBatchFilters,

    filteredInProgressRows,

    stageOptions,
    typeOptions,
    statusOptions,

    selectedBatch,
    handleViewDetails,
    closeBatchDetails,

    batchesLoading,

    page,
    rowsPerPage,
    totalRecords,

    handlePageChange,
    handleRowsPerPageChange,

    activeTab,
    setActiveTab,
    applyBatchFilters,
  } = useSMInProgressBatches(t.dashboardConfig.stageColors, {
    filterType: dateBounds.apiFilter,
    startDate: dateBounds.startDate,
    endDate: dateBounds.endDate,
  });

  const { notifAnchor, handleNotifOpen, handleNotifClose } = useSMNotificationMenu(loadAlerts);

  const [hoverLineIdx, setHoverLineIdx] = useState<number | null>(null);
  const [pinnedLineIdx, setPinnedLineIdx] = useState<number | null>(null);
  const [hoverBarIdx, setHoverBarIdx] = useState<number | null>(null);
  const [pinnedBarIdx, setPinnedBarIdx] = useState<number | null>(null);

  const activeLineIdx = pinnedLineIdx ?? hoverLineIdx;
  const activeBarIdx = pinnedBarIdx ?? hoverBarIdx;
  const activeLinePoint =
    typeof activeLineIdx === "number" ? chartData.areaData[activeLineIdx] : null;
  const activeBarPoint = typeof activeBarIdx === "number" ? chartData.barData[activeBarIdx] : null;

  if (loading) {
    return (
      <Box sx={{ ...t.page, ...t.dashboardLayout.loadingPage }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const isRefreshing = statsLoading || batchesLoading;

  return (
    <Box sx={{ ...t.page, ...t.dashboardLayout.pageRelative }}>
      {isRefreshing && (
        <Box
          sx={{
            ...t.dashboardLayout.refreshOverlay,
            bgcolor: mode === "dark" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)",
          }}
        >
          <CircularProgress size={44} />
        </Box>
      )}
      {/* ── Page Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={t.pageHeader.title}>{S.PAGE.TITLE}</Typography>
        </Box>
        {/* <Stack direction="row" gap={1} alignItems="center">
          <Badge badgeContent={alerts.length} color="error" invisible={alerts.length === 0}>
            <Box sx={t.pageHeader.notifBox} onClick={handleNotifOpen}>
              <Notifications sx={t.pageHeader.notifIcon} />
            </Box>
          </Badge>
        </Stack> */}
      </Stack>

      {/* ── Date Range Selector ── */}
      <Box sx={{ mb: 2 }}>
        <FilterToggleButton
          label={S.DATE_FILTER.LABEL}
          count={dateFilterCount}
          isOpen={dateFilterOpen}
          onClick={() => setDateFilterOpen((v) => !v)}
          sx={adminTh.table.filterBtn(dateFilterOpen || dateFilterCount > 0)}
          iconSx={adminTh.table.filterBtnIcon}
          textSx={adminTh.table.filterBtnText}
          badgeSx={adminTh.table.filterBadgePill}
          chevronSx={adminTh.table.filterBtnChevron}
          selectedValue={getDateFilterDisplayLabel(filterType, S.DATE_FILTER)}
        />

        {dateFilterOpen && (
          <DashboardDateFilter
            filterType={filterType}
            onFilterChange={setFilterType}
            customStartDate={customStartDate}
            onStartChange={setCustomStartDate}
            customEndDate={customEndDate}
            onEndChange={setCustomEndDate}
            onApplyCustom={applyCustomDateFilter}
            onClearFilter={clearDateFilter}
            strings={S.DATE_FILTER}
            loading={statsLoading}
            containerSx={t.dashboardLayout.dateRangeBar}
            selectSx={{ minWidth: 160, ...t.dashboardLayout.dateSelect }}
            menuProps={t.dashboardLayout.dateMenuProps}
            menuItemSx={t.dashboardLayout.dateMenuItemSx}
            textFieldSx={t.dashboardLayout.dateSelect}
          />
        )}
      </Box>

      {/* ── KPI Row ── */}
      <Box sx={t.dashboardLayout.kpiGrid}>
        {kpiData.map(({ label, value, sub, trend, color, iconKey }) => {
          const Icon = resolveKpiIcon(iconKey);
          return (
            <DashKPICard
              key={label}
              label={label}
              value={value}
              // sub={sub}
              Icon={Icon}
              bg={color}
              cardSx={t.sharedDashboard.kpiCard.cardSx}
              labelProps={t.sharedDashboard.kpiCard.labelProps}
              valueProps={t.sharedDashboard.kpiCard.valueProps}
              subRowSx={t.sharedDashboard.kpiCard.subRowSx}
              trendIconSx={t.sharedDashboard.kpiCard.trendIconSx}
              avatarSx={t.sharedDashboard.kpiCard.avatarSx}
              iconSx={t.sharedDashboard.kpiCard.iconSx}
            />
          );
        })}
      </Box>

      {/* ── Middle Row: Stage Status + Charts ── */}
      <Box sx={t.dashboardLayout.middleGrid}>
        <Panel t={t}>
          <PanelHeader
            title={S.STAGE_STATUS.TITLE}
            meta={
              <Typography sx={t.dashboardLayout.stageMetaText}>
                {stageData.totalBatches} batches
              </Typography>
            }
            t={t}
          />
          <StageStatusPanel stageData={stageData} t={t} strings={S.STAGE_STATUS} />
        </Panel>

        <DashboardChartCard
          cardSx={chartTheme.cardSx}
          headerBoxSx={chartTheme.headerBox(chartTheme.headers.line)}
          contentSx={chartTheme.contentSx}
          title={S.CHARTS.MOTORS_PROCESSED.TITLE}
          subtitle={S.CHARTS.MOTORS_PROCESSED.SUBTITLE}
          highlight={activeLinePoint ? `${activeLinePoint.m}: ${activeLinePoint.v}` : undefined}
          timestamp={chartTimestamp}
          titleProps={chartTheme.titleProps}
          subtitleProps={chartTheme.subtitleProps}
          highlightProps={chartTheme.highlightProps}
          dividerProps={chartTheme.dividerProps}
          clockIconSx={chartTheme.clockIconSx}
          timestampProps={chartTheme.timestampProps}
        >
          <LineChart
            height={chartTheme.plotHeight}
            margin={chartTheme.margin.line}
            grid={{ horizontal: true }}
            hideLegend
            axisHighlight={{ x: "line" }}
            highlightedItem={
              typeof pinnedLineIdx === "number"
                ? { seriesId: "motors-series", dataIndex: pinnedLineIdx }
                : undefined
            }
            onHighlightChange={(item: any) => {
              if (typeof item?.dataIndex === "number") setHoverLineIdx(item.dataIndex);
              else setHoverLineIdx(null);
            }}
            onAxisClick={(_, axisData: any) => {
              const idx = axisData?.dataIndex;
              if (typeof idx === "number") {
                setPinnedLineIdx((prev) => (prev === idx ? null : idx));
              }
            }}
            onLineClick={(_, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === "number") {
                setPinnedLineIdx((prev) => (prev === idx ? null : idx));
              }
            }}
            onMarkClick={(_, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === "number") {
                setPinnedLineIdx((prev) => (prev === idx ? null : idx));
              }
            }}
            xAxis={[
              {
                scaleType: "point",
                data: chartData.areaData.map(({ m }) => m),
                ...chartTheme.xAxis,
              },
            ]}
            yAxis={[{ position: "none" }]}
            series={[
              {
                id: "motors-series",
                data: chartData.areaData.map(({ v }) => v),
                valueFormatter: (value: number | null) => `${value ?? 0}`,
                ...chartTheme.lineSeries,
              },
            ]}
            slotProps={chartTheme.tooltipSlotProps}
            sx={chartTheme.lineChartSx}
          />
        </DashboardChartCard>

        <DashboardChartCard
          cardSx={chartTheme.cardSx}
          headerBoxSx={chartTheme.headerBox(chartTheme.headers.bar)}
          contentSx={chartTheme.contentSx}
          title={S.CHARTS.WEEKLY_ACTIVITY.TITLE}
          subtitle={S.CHARTS.WEEKLY_ACTIVITY.SUBTITLE}
          highlight={activeBarPoint ? `${activeBarPoint.day}: ${activeBarPoint.v}` : undefined}
          timestamp={chartTimestamp}
          titleProps={chartTheme.titleProps}
          subtitleProps={chartTheme.subtitleProps}
          highlightProps={chartTheme.highlightProps}
          dividerProps={chartTheme.dividerProps}
          clockIconSx={chartTheme.clockIconSx}
          timestampProps={chartTheme.timestampProps}
        >
          <BarChart
            height={chartTheme.plotHeight}
            margin={chartTheme.margin.bar}
            borderRadius={8}
            grid={{ horizontal: true }}
            hideLegend
            axisHighlight={{ x: "band" }}
            highlightedItem={
              typeof pinnedBarIdx === "number"
                ? { seriesId: "weekly-series", dataIndex: pinnedBarIdx }
                : undefined
            }
            onHighlightChange={(item: any) => {
              if (typeof item?.dataIndex === "number") setHoverBarIdx(item.dataIndex);
              else setHoverBarIdx(null);
            }}
            onAxisClick={(_, axisData: any) => {
              const idx = axisData?.dataIndex;
              if (typeof idx === "number") {
                setPinnedBarIdx((prev) => (prev === idx ? null : idx));
              }
            }}
            onItemClick={(_, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === "number") {
                setPinnedBarIdx((prev) => (prev === idx ? null : idx));
              }
            }}
            xAxis={[
              {
                scaleType: "band",
                data: chartData.barData.map(({ day }) => day),
                categoryGapRatio: 0.42,
                barGapRatio: 0.15,
                ...chartTheme.xAxis,
              },
            ]}
            yAxis={[{ position: "none" }]}
            series={[
              {
                id: "weekly-series",
                data: chartData.barData.map(({ v }) => v),
                valueFormatter: (value: number | null) => `${value ?? 0}`,
                ...chartTheme.barSeries,
              },
            ]}
            slotProps={chartTheme.tooltipSlotProps}
            sx={chartTheme.barChartSx}
          />
        </DashboardChartCard>
      </Box>

      {/* ── Bottom Row: In Progress Batches ── */}
      <Box sx={t.dashboardLayout.bottomGrid}>
        <InProgressBatchesTable
          rows={filteredInProgressRows}
          loading={batchesLoading}
          theme={adminTh}
          title={
            activeTab === "COMPLETED"
              ? STRINGS.DASHBOARD_PAGE.BATCH_TABLE.SECTION_COMPLETED_BATCHES
              : STRINGS.DASHBOARD_PAGE.BATCH_TABLE.SECTION_INPOROGRESS_TITLE
          }
          emptyText={S.EMPTY_STATES.NO_BATCHES}
          cardSx={adminTh.card}
          hideManagerColumns
          onViewDetails={handleViewDetails}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalRecords}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
          headerContent={
            <ToggleTabs
              value={activeTab}
              onChange={(value) => setActiveTab(value as BatchTab)}
              options={batchTabOptions}
            />
          }
          filterPanel={
            <AdminListShell
              search={batchSearch}
              onSearchChange={setBatchSearch}
              searchPlaceholder={S.FILTERS.SEARCH_BATCHES}
              filterOpen={batchFilterOpen}
              onFilterToggle={toggleBatchFilterOpen}
              activeFilterCount={activeBatchFilterCount}
              filtersToggleLabel={S.FILTERS.BUTTON}
              resultText={`${filteredInProgressRows.length} / ${totalRecords} records shown`}
              loading={batchesLoading}
              hasItems={filteredInProgressRows.length > 0}
              emptyTitle={S.EMPTY_STATES.NO_BATCHES}
              filterExtension={
                <AdminListFilterPanel
                  title={S.COMMON.FILTERS_TITLE}
                  activeFilterCount={activeBatchFilterCount}
                  onClear={clearBatchFilters}
                  clearLabel={S.FILTERS.CLEAR_ALL}
                  onClose={() => setBatchFilterOpen(false)}
                  onApply={applyBatchFilters}
                  closeLabel={S.COMMON.FILTERS_CLOSE}
                  applyLabel={S.COMMON.FILTERS_APPLY}
                  theme={adminTh}
                >
                  <FilterSelect
                    label={DP.FILTERS.STAGE}
                    value={batchDraftFilters.stage}
                    onChange={(e) => setBatchDraftFilter("stage", e.target.value)}
                    options={stageOptions}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    filterPanel
                    sx={{ ...adminTh.filterPanel.field, ...adminTh.filterPanel.fieldItem }}
                  />

                  <FilterSelect
                    label={DP.FILTERS.TYPE}
                    value={batchDraftFilters.batchType}
                    onChange={(e) => setBatchDraftFilter("batchType", e.target.value)}
                    options={typeOptions}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    filterPanel
                    sx={{ ...adminTh.filterPanel.field, ...adminTh.filterPanel.fieldItem }}
                  />

                  <FilterSelect
                    label={DP.FILTERS.STATUS}
                    value={batchDraftFilters.status}
                    onChange={(e) => setBatchDraftFilter("status", e.target.value)}
                    options={statusOptions}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    filterPanel
                    sx={{ ...adminTh.filterPanel.field, ...adminTh.filterPanel.fieldItem }}
                  />
                </AdminListFilterPanel>
              }
              theme={shellTheme}
            />
          }
        />
      </Box>

      {/* ── Block Traceability ── */}
      <Box sx={t.dashboardLayout.lowerGrid}>
        <Panel t={t}>
          <PanelHeader
            title={S.BLOCKCHAIN_EVENTS.SECTION_TITLE}
            meta={
              <Chip
                label={S.BLOCKCHAIN_EVENTS.IMMUTABLE_BADGE}
                size="small"
                sx={t.blockTimeline.immutableChip}
              />
            }
            t={t}
          />
          <Box sx={t.blockTimeline.inner}>
            {!blockEvents.length ? (
              <Typography sx={t.blockTimeline.emptyText}>{S.BLOCKCHAIN_EVENTS.EMPTY}</Typography>
            ) : (
              <Stack spacing={0}>
                {blockEvents.map((e, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    gap={2}
                    alignItems="flex-start"
                    sx={{ pb: i < blockEvents.length - 1 ? 2.5 : 0, position: "relative" }}
                  >
                    {i < blockEvents.length - 1 && <Box sx={t.blockTimeline.connector(false)} />}
                    <Avatar sx={t.blockTimeline.avatar(e.color)}>{e.icon}</Avatar>
                    <Box>
                      <Typography sx={t.blockTimeline.motorId(e.color)}>{e.motorId}</Typography>
                      <Typography sx={t.blockTimeline.label}>{e.label}</Typography>
                      <Stack direction="row" alignItems="center" gap={0.5} mt={0.4}>
                        <Schedule sx={t.blockTimeline.timeIcon} />
                        <Typography sx={t.blockTimeline.timeText}>{e.time}</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Panel>
      </Box>

      {/* ── 3-dot Context Menu ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={handleNotifClose}
        {...t.notificationMenu.menuProps}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={t.notificationMenu.header}>
          <Typography sx={t.notificationMenu.title}>{S.ALERTS.SECTION_TITLE}</Typography>
          <Box sx={t.alerts.liveDot} />
        </Box>
        <Box sx={t.notificationMenu.body}>
          {alertsLoading ? (
            <Box sx={t.notificationMenu.loadingBox}>
              <CircularProgress size={18} />
            </Box>
          ) : alerts.length === 0 ? (
            <Typography sx={t.notificationMenu.emptyText}>{S.EMPTY_STATES.NO_ALERTS}</Typography>
          ) : (
            <Stack spacing={0}>
              {alerts.map((a, i) => (
                <Box key={`${a.batchId}-${a.time}-${i}`} sx={t.alerts.row(i === alerts.length - 1)}>
                  <AlertIcon type={a.type} t={t} />
                  <Box flex={1}>
                    <Typography sx={t.alerts.msg}>{a.msg}</Typography>
                    <Stack
                      direction="row"
                      gap={1.5}
                      flexWrap="wrap"
                      sx={t.notificationMenu.metaRow}
                    >
                      {a.batchId ? (
                        <Typography sx={t.notificationMenu.metaText}>
                          {S.ALERTS.BATCH_LABEL}: {a.batchId}
                        </Typography>
                      ) : null}
                      {a.stage ? (
                        <Typography sx={t.notificationMenu.metaText}>
                          {S.ALERTS.STAGE_LABEL}: {a.stage}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Typography sx={t.alerts.time}>{a.time}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Menu>

      {selectedBatch && (
        <BatchDetailPopup
          batch={selectedBatch}
          stageConfig={stageConfig}
          onClose={closeBatchDetails}
          t={t}
        />
      )}
    </Box>
  );
}
