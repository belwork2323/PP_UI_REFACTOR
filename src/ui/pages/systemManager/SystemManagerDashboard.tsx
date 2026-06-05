// src/pages/system_manager/components/DashboardPage.jsx
//
// Zero static data — dashboard state is assembled in useSMDashboard().
// stageConfig is fetched and passed directly to BatchDetailPopup.

import React, { useMemo, useState } from "react";
import {
  Box, Typography, Stack, Avatar, Chip, Divider,
  Badge, CircularProgress, Collapse, TextField, InputAdornment, IconButton,
} from "@mui/material";
import { LineChart, BarChart } from "@mui/x-charts";
import Menu     from "@mui/material/Menu";

import getDashboardTheme from "../../../app/theme/custom_themes/admin/dashboard_theme";
import getSystemManagerTheme from "../../../app/theme/custom_themes/system_manager/sysDashboard_theme";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { Panel, PanelHeader, AlertIcon } from "./components/SystemManagerWidgets";
import { useThemeStore }     from "../../../app/store/themeStore";
import useSMDashboard from "../../../hooks/system_manager/useSMDashboardHook";
import useSMInProgressBatches from "../../../hooks/system_manager/useSMInProgressBatchesHook";
import useSMNotificationMenu from "../../../hooks/system_manager/useSMNotificationMenuHook";
import useSMBatchStatusDetails from "../../../hooks/system_manager/useSMBatchStatusDetailsHook";
import DashboardChartCard  from "../../components/custom/DashboardChartCard";
import { DashKPICard }      from "../../components/custom/DashKPICard";
import DashboardDateFilter  from "../../components/custom/DashboardDateFilter";
import InProgressBatchesTable from "../../components/custom/InProgressBatchesTable";
import FilterToggleButton from "../../components/custom/FilterToggleButton";
import FilterSelect from "../../components/common/FilterSelect";
import FilterPanelHeader from "../../components/custom/FilterPanelHeader";
import BatchDetailPopup from "./components/BatchDetails";
import BatchStatusDetailsPanel from "./components/BatchStatusDetailsPanel";
import StageStatusPanel from "./components/StageStatusPanel";

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
  Inventory2, TrendingUp, CheckCircle, Warning,
  Schedule, AssignmentTurnedIn, Block, Error: ErrorIconMUI,
};

function resolveKpiIcon(iconKey)   { return KPI_ICON_MAP[iconKey]   ?? Inventory2; }

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SystemManagerDashboard() {
  const mode = useThemeStore((s) => s.mode);
  const t    = useMemo(() => getSystemManagerTheme(mode), [mode]);
  const adminTh = useMemo(() => getDashboardTheme(mode), [mode]);
  const S    = STRINGS.SYSTEM_MANAGER_DASHBOARD;

  const {
    dashboard, alerts, alertsLoading, loading, statsLoading,
    filterType, setFilterType,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    loadAlerts,
  } = useSMDashboard(t.dashboardConfig);

  const {
    kpiData, stageMetrics, stageData,
    activeBatches, blockEvents,
    chartData, batchStatusList, stageConfig, chartUpdatedAt,
  } = dashboard;
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

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const dateFilterCount = filterType ? 1 : 0;
  const { filterMenuProps, filterMenuItemSx } = adminTh;

  const {
    batchFilterOpen,
    setBatchFilterOpen,
    batchSearch,
    setBatchSearch,
    batchStage,
    setBatchStage,
    batchType,
    setBatchType,
    batchStatus,
    setBatchStatus,
    activeBatchFilterCount,
    clearBatchFilters,
    inProgressRows,
    filteredInProgressRows,
    stageOptions,
    typeOptions,
    statusOptions,
    selectedBatch,
    handleViewDetails,
    closeBatchDetails,
  } = useSMInProgressBatches(activeBatches);

  const {
    notifAnchor,
    handleNotifOpen,
    handleNotifClose,
  } = useSMNotificationMenu(loadAlerts);

  const {
    expandedBatchId,
    toggleExpanded,
    totalPending,
  } = useSMBatchStatusDetails(batchStatusList);

  const [hoverLineIdx, setHoverLineIdx] = useState<number | null>(null);
  const [pinnedLineIdx, setPinnedLineIdx] = useState<number | null>(null);
  const [hoverBarIdx, setHoverBarIdx] = useState<number | null>(null);
  const [pinnedBarIdx, setPinnedBarIdx] = useState<number | null>(null);

  const activeLineIdx = pinnedLineIdx ?? hoverLineIdx;
  const activeBarIdx = pinnedBarIdx ?? hoverBarIdx;
  const activeLinePoint = typeof activeLineIdx === "number" ? chartData.areaData[activeLineIdx] : null;
  const activeBarPoint = typeof activeBarIdx === "number" ? chartData.barData[activeBarIdx] : null;

  if (loading) {
    return (
      <Box sx={{ ...t.page, ...t.dashboardLayout.loadingPage }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={t.page}>

      {/* ── Page Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={t.pageHeader.eyebrow}>{S.PAGE.EYEBROW}</Typography>
          <Typography sx={t.pageHeader.title}>{S.PAGE.TITLE}</Typography>
        </Box>
        <Stack direction="row" gap={1} alignItems="center">
          <Badge badgeContent={alerts.length} color="error" invisible={alerts.length === 0}>
            <Box sx={t.pageHeader.notifBox} onClick={handleNotifOpen}>
              <Notifications sx={t.pageHeader.notifIcon} />
            </Box>
          </Badge>
        </Stack>
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
        />

        {dateFilterOpen && (
          <DashboardDateFilter
            filterType={filterType}
            onFilterChange={setFilterType}
            customStartDate={customStartDate}
            onStartChange={setCustomStartDate}
            customEndDate={customEndDate}
            onEndChange={setCustomEndDate}
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
              sub={sub}
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
            meta={<Typography sx={t.dashboardLayout.stageMetaText}>{stageData.totalBatches} batches</Typography>}
            t={t}
          />
          <StageStatusPanel
            stageData={stageData}
            t={t}
            strings={S.STAGE_STATUS}
          />
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
          loading={loading}
          theme={adminTh}
          title={STRINGS.DASHBOARD_PAGE.BATCH_TABLE.SECTION_TITLE}
          emptyText={S.EMPTY_STATES.NO_BATCHES}
          cardSx={adminTh.card}
          hideManagerColumns
          onViewDetails={handleViewDetails}
          meta={
            <FilterToggleButton
              label={S.FILTERS.BUTTON}
              count={activeBatchFilterCount}
              isOpen={batchFilterOpen}
              onClick={() => setBatchFilterOpen((v) => !v)}
              sx={adminTh.table.filterBtn(batchFilterOpen || activeBatchFilterCount > 0)}
              iconSx={adminTh.table.filterBtnIcon}
              textSx={adminTh.table.filterBtnText}
              badgeSx={adminTh.table.filterBadgePill}
              chevronSx={adminTh.table.filterBtnChevron}
            />
          }
          filterPanel={
            <Collapse in={batchFilterOpen} timeout={200} unmountOnExit>
              <Box sx={adminTh.table.filterPanel}>
                <FilterPanelHeader
                  title={S.FILTERS.BUTTON}
                  count={activeBatchFilterCount}
                  onClear={clearBatchFilters}
                  clearLabel={S.FILTERS.CLEAR_ALL}
                  recordText={`- ${filteredInProgressRows.length} / ${inProgressRows.length} records shown`}
                  containerSx={{ ...adminTh.table.filterPanelHeader, mb: 1.5 }}
                  iconSx={adminTh.table.filterBtnIcon}
                  labelSx={adminTh.table.filterLabel}
                  badgeSx={adminTh.table.filterBadge}
                  metaTextSx={adminTh.table.filterMetaText}
                  clearChipSx={adminTh.table.clearChip}
                />

                <Stack direction="row" gap={1.5} flexWrap="wrap" mb={1}>
                  <TextField
                    size="small"
                    placeholder={S.FILTERS.SEARCH_BATCHES}
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={adminTh.table.searchIcon} />
                        </InputAdornment>
                      ),
                      endAdornment: batchSearch ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setBatchSearch("")} sx={adminTh.table.clearIconBtn}>
                            <Close sx={adminTh.table.clearIcon} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={adminTh.table.searchInput}
                  />

                  <FilterSelect
                    label="Stage"
                    value={batchStage}
                    onChange={(e) => setBatchStage(e.target.value)}
                    options={stageOptions}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    sx={adminTh.table.stageSelect}
                  />

                  <FilterSelect
                    label="Type"
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    options={typeOptions}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    sx={adminTh.table.typeSelect}
                  />

                  <FilterSelect
                    label={S.FILTERS.STATUS}
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value)}
                    options={statusOptions}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    sx={adminTh.table.statusSelect}
                  />
                </Stack>
              </Box>
            </Collapse>
          }
        />
      </Box>

      {/* ── Blockchain Timeline + Batch Status Details ── */}
      <Box sx={t.dashboardLayout.lowerGrid}>

        <Panel t={t}>
          <PanelHeader
            title={S.BLOCKCHAIN_EVENTS.SECTION_TITLE}
            meta={<Chip label={S.BLOCKCHAIN_EVENTS.IMMUTABLE_BADGE} size="small" sx={t.blockTimeline.immutableChip} />}
            t={t}
          />
          <Box sx={t.blockTimeline.inner}>
            {!blockEvents.length ? (
              <Typography sx={t.blockTimeline.emptyText}>{S.BLOCKCHAIN_EVENTS.EMPTY}</Typography>
            ) : (
              <Stack spacing={0}>
                {blockEvents.map((e, i) => (
                  <Stack key={i} direction="row" gap={2} alignItems="flex-start"
                    sx={{ pb: i < blockEvents.length - 1 ? 2.5 : 0, position: "relative" }}>
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

        <Panel t={t}>
          <PanelHeader
            title={S.BATCH_STATUS.DETAILS_SECTION_TITLE}
            meta={
              <Typography sx={t.approvalMatrix.pendingMeta}>
                {totalPending} pending
              </Typography>
            }
            t={t}
          />
          <Box sx={t.approvalMatrix.inner}>
            <BatchStatusDetailsPanel
              rows={batchStatusList}
              t={t}
              strings={S.BATCH_STATUS}
              expandedBatchId={expandedBatchId}
              onToggle={toggleExpanded}
            />
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
                    <Stack direction="row" gap={1.5} flexWrap="wrap" sx={t.notificationMenu.metaRow}>
                      {a.batchId ? <Typography sx={t.notificationMenu.metaText}>{S.ALERTS.BATCH_LABEL}: {a.batchId}</Typography> : null}
                      {a.stage ? <Typography sx={t.notificationMenu.metaText}>{S.ALERTS.STAGE_LABEL}: {a.stage}</Typography> : null}
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