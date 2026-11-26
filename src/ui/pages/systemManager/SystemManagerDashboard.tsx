// src/pages/system_manager/components/DashboardPage.jsx
//
// Zero static data — dashboard state is assembled in useSMDashboard().
// stageConfig is fetched and passed directly to BatchDetailPopup.

import React, { useMemo, useState } from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { LineChart, BarChart } from "@mui/x-charts";
import Menu from "@mui/material/Menu";

import getSystemManagerTheme from "../../../app/theme/custom_themes/system_manager/sysDashboard_theme";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { Panel, PanelHeader, AlertIcon } from "./components/SystemManagerWidgets";
import { useThemeStore } from "../../../app/store/themeStore";
import useSMDashboard from "../../../hooks/system_manager/useSMDashboardHook";
import useSMNotificationMenu from "../../../hooks/system_manager/useSMNotificationMenuHook";
import DashboardChartCard from "../../components/custom/dashboard/DashboardChartCard";
import { DashKPICard } from "../../components/custom/dashboard/DashKPICard";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "../../components/custom/dashboard/DashboardDateFilter";
import FilterToggleButton from "../../components/common/FilterToggleButton";
import BatchDetailPopup from "./components/BatchDetails";
import StageStatusPanel from "./components/StageStatusPanel";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";
import useDashboardHook from "@/hooks/admin/Dashboard/useDashboardHook";
import DashboardActiveBatchesSection from "../admin/Dashboard/components/DashboardActiveBatchesSection";
import { InProgressBatchRow } from "@/ui/components/custom/dashboard/InProgressBatchesTable";

const {
  CheckCircle,
  TrendingUp,
  Schedule,
  Inventory2,
  AssignmentTurnedIn,
  Block,
  Error: ErrorIconMUI,
  Warning,
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
  const adminTh = useMemo(() => getDashboardTheme(mode), [mode]);
  const S = STRINGS.SYSTEM_MANAGER_DASHBOARD;
  const strings = STRINGS.DASHBOARD_PAGE;
  const { filterMenuProps, filterMenuItemSx } = adminTh;

  // System Manager hook: Date Filter, KPIs, Stage Status, Charts
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
    loadAlerts,
  } = useSMDashboard(t.dashboardConfig);

  // Admin hook: Batch Table state & APIs only
  const {
    activeBatchesLoading,
    filterOpen,
    setFilterOpen,
    toggleFilterOpen,
    searchQuery,
    setSearchQuery: updateSearchQuery,
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
  } = useDashboardHook(mode, true);

  // Local pagination state for Admin Active Batches Section
  const [batchPage, setBatchPage] = useState(0);
  const [batchRowsPerPage, setBatchRowsPerPage] = useState(10);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const handleBatchPageChange = (_event: unknown, newPage: number) => {
    setBatchPage(newPage);
  };

  const setSearchQuery = (value: string) => {
    updateSearchQuery(value);
    setBatchPage(0);
  };

  const handleBatchRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBatchRowsPerPage(parseInt(event.target.value, 10));
    setBatchPage(0);
  };

  const paginatedBatches = filteredBatches.slice(
    batchPage * batchRowsPerPage,
    batchPage * batchRowsPerPage + batchRowsPerPage,
  );

  const { kpiData, stageData, chartData, stageConfig, chartUpdatedAt } = dashboard;
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

  const { notifAnchor, handleNotifClose } = useSMNotificationMenu(loadAlerts);

  const [hoverLineIdx, setHoverLineIdx] = useState<number | null>(null);
  const [pinnedLineIdx, setPinnedLineIdx] = useState<number | null>(null);
  const [hoverBarIdx, setHoverBarIdx] = useState<number | null>(null);
  const [pinnedBarIdx, setPinnedBarIdx] = useState<number | null>(null);

  const activeLineIdx = pinnedLineIdx ?? hoverLineIdx;
  const activeBarIdx = pinnedBarIdx ?? hoverBarIdx;
  const activeLinePoint =
    typeof activeLineIdx === "number" ? chartData.areaData[activeLineIdx] : null;
  const activeBarPoint = typeof activeBarIdx === "number" ? chartData.barData[activeBarIdx] : null;

  const [hoverQcIdx, setHoverQcIdx] = useState<number | null>(null);
  const [pinnedQcIdx, setPinnedQcIdx] = useState<number | null>(null);

  const qcPassRateData = chartData.qcPassRateData ?? [];
  const activeQcIdx = pinnedQcIdx ?? hoverQcIdx;
  const activeQcPoint =
    typeof activeQcIdx === "number" ? (qcPassRateData[activeQcIdx] ?? null) : null;
  if (loading) {
    return (
      <Box sx={{ ...t.page, ...t.dashboardLayout.loadingPage }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const isRefreshing = statsLoading || activeBatchesLoading;
  const handleViewBatchDetails = (row: InProgressBatchRow) => {
    setSelectedBatch(row);
  };
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
      </Stack>

      {/* ── System Manager Date Range Selector ── */}
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

      {/* ── System Manager KPI Row ── */}
      <Box sx={t.dashboardLayout.kpiGrid}>
        {kpiData.map(({ label, value, color, iconKey }) => {
          const Icon = resolveKpiIcon(iconKey);
          return (
            <DashKPICard
              key={label}
              label={label}
              value={value}
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

      {/* ── System Manager Middle Row: Stage Status + Charts ── */}
      <Box sx={t.dashboardLayout.middleGrid}>
        <Panel t={t}>
          <PanelHeader
            title={S.STAGE_STATUS.TITLE}
            // meta={
            //   <Typography sx={t.dashboardLayout.stageMetaText}>
            //     {stageData.totalBatches} batches
            //   </Typography>
            // }
            t={t}
          />
          <StageStatusPanel stageData={stageData} t={t} strings={S.STAGE_STATUS} />
        </Panel>

        {/* ── Motors Processed (LineChart <- chartData.areaData) ── */}
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

        {/* ── Activity / Throughput (BarChart <- chartData.barData) ── */}
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

        {/* ── QC Pass Rate (BarChart <- chartData.qcPassRateData) ── */}
        {qcPassRateData.length > 0 && (
          <DashboardChartCard
            cardSx={chartTheme.cardSx}
            headerBoxSx={chartTheme.headerBox(chartTheme.headers.bar)}
            contentSx={chartTheme.contentSx}
            title={S.CHARTS.QC_PASS_RATE?.TITLE ?? "QC Pass Rate"}
            subtitle={S.CHARTS.QC_PASS_RATE?.SUBTITLE ?? "Percentage of batches passing QC"}
            highlight={activeQcPoint ? `${activeQcPoint.label}: ${activeQcPoint.v}%` : undefined}
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
                typeof pinnedQcIdx === "number"
                  ? { seriesId: "qc-series", dataIndex: pinnedQcIdx }
                  : undefined
              }
              onHighlightChange={(item: any) => {
                if (typeof item?.dataIndex === "number") setHoverQcIdx(item.dataIndex);
                else setHoverQcIdx(null);
              }}
              onAxisClick={(_, axisData: any) => {
                const idx = axisData?.dataIndex;
                if (typeof idx === "number") {
                  setPinnedQcIdx((prev) => (prev === idx ? null : idx));
                }
              }}
              onItemClick={(_, item: any) => {
                const idx = item?.dataIndex;
                if (typeof idx === "number") {
                  setPinnedQcIdx((prev) => (prev === idx ? null : idx));
                }
              }}
              xAxis={[
                {
                  scaleType: "band",
                  data: qcPassRateData.map(({ label }) => label),
                  categoryGapRatio: 0.42,
                  barGapRatio: 0.15,
                  ...chartTheme.xAxis,
                },
              ]}
              yAxis={[{ position: "none" }]}
              series={[
                {
                  id: "qc-series",
                  data: qcPassRateData.map(({ v }) => v),
                  valueFormatter: (value: number | null) => `${value ?? 0}%`,
                  ...chartTheme.barSeries,
                },
              ]}
              slotProps={chartTheme.tooltipSlotProps}
              sx={chartTheme.barChartSx}
            />
          </DashboardChartCard>
        )}
      </Box>

      {/* ── Admin Batch Table & Hook ── */}
      <DashboardActiveBatchesSection
        th={adminTh}
        t={strings}
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
        onViewDetails={handleViewBatchDetails}
      />

      {/* ── Notification Menu ── */}
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
          onClose={() => setSelectedBatch(null)}
          t={t}
        />
      )}
    </Box>
  );
}
