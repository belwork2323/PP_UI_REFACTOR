// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import {
  Box, Typography, Stack, Avatar, Chip,
  TextField, MenuItem, Select, FormControl, InputLabel,
  InputAdornment, IconButton, Collapse, CircularProgress, Badge,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { LineChart, BarChart } from '@mui/x-charts';
import SearchIcon        from '@mui/icons-material/Search';
import ClearIcon         from '@mui/icons-material/Clear';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { icons } from '../../../../app/theme';
import { STRINGS } from '../../../../app/config/strings';
import getDashboardTheme from '../../../../app/theme/custom_themes/admin/dashboard_theme';
import { useDashboard } from '../../../../hooks/admin/dashboardHook';

import Card from '../../../components/common/Card';
import SectionHeader from '../../../components/common/SectionHeader';
import StackRow from '../../../components/common/StackRow';
import FilterSelect from '../../../components/common/FilterSelect';
import FilterToggleButton from '../../../components/custom/FilterToggleButton';
import FilterPanelHeader from '../../../components/custom/FilterPanelHeader';
import DateRangeRow from '../../../components/custom/DateRangeRow';
import DashboardChartCard from '../../../components/custom/DashboardChartCard';
import DashboardDateFilter from '../../../components/custom/DashboardDateFilter';
import InProgressBatchesTable from '../../../components/custom/InProgressBatchesTable';
import { DashKPICard, DashKPICardSkeleton } from '../../../components/custom/DashKPICard';



// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage({ mode = 'light' }) {
  const th = getDashboardTheme(mode);
  const t = STRINGS.DASHBOARD_PAGE;
  const NotificationsIcon = icons.systemManager.Notifications;
  const { filterMenuProps, filterMenuItemSx } = th;

  const dashboard = useDashboard(mode);
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
    searchQuery,
    setSearchQuery,
    filterStage,
    setFilterStage,
    filterBatchType,
    setFilterBatchType,
    filterStatus,
    setFilterStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    currentMonthOnly,
    setCurrentMonthOnly,
    filteredBatches,
    activeFilterCount,
    // Events
    eventsLoading,
    eventsFilterOpen, setEventsFilterOpen,
    eventsSearchQuery, setEventsSearchQuery,
    eventsType, setEventsType,
    eventsDepartment, setEventsDepartment,
    eventsSubDepartment, setEventsSubDepartment,
    eventsDateFrom, setEventsDateFrom,
    eventsDateTo, setEventsDateTo,
    eventsCurrentMonthOnly, setEventsCurrentMonthOnly,
    eventsActiveFilterCount,
    clearEventsFilters,

    clearBatchesFilters,
    subDepartments,
    toggleCurrentMonth,
  } = dashboard;

  const filterActive = filterOpen || activeFilterCount > 0;
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const dateFilterCount = filterType !== t.DATE_FILTER.VALUES.MONTH ? 1 : 0;

  const chartTheme = th.sharedCharts;

  // ── Chart interactive state ───────────────────────────────────────────────
  const [hoverBarIdx, setHoverBarIdx] = useState<number | null>(null);
  const [pinnedBarIdx, setPinnedBarIdx] = useState<number | null>(null);
  const [hoverLineIdx, setHoverLineIdx] = useState<number | null>(null);
  const [pinnedLineIdx, setPinnedLineIdx] = useState<number | null>(null);
  const [hoverAreaIdx, setHoverAreaIdx] = useState<number | null>(null);
  const [pinnedAreaIdx, setPinnedAreaIdx] = useState<number | null>(null);

  const activeBarIdx = pinnedBarIdx ?? hoverBarIdx;
  const activeLineIdx = pinnedLineIdx ?? hoverLineIdx;
  const activeAreaIdx = pinnedAreaIdx ?? hoverAreaIdx;
  const activeBarPoint = typeof activeBarIdx === 'number' ? weeklyActivity[activeBarIdx] : null;
  const activeLinePoint = typeof activeLineIdx === 'number' ? motorsProcessed[activeLineIdx] : null;
  const activeAreaPoint = typeof activeAreaIdx === 'number' ? qcPassRate[activeAreaIdx] : null;

  // ── Date helpers: DD-MM-YYYY ↔ YYYY-MM-DD (for MUI DatePicker) ───────────
  const toYMD = (ddmmyyyy: string) => {
    if (!ddmmyyyy || ddmmyyyy.length !== 10) return '';
    const [dd, mm, yyyy] = ddmmyyyy.split('-');
    return `${yyyy}-${mm}-${dd}`;
  };
  const toDMY = (yyyymmdd: string) => {
    if (!yyyymmdd) return '';
    const [yyyy, mm, dd] = yyyymmdd.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  const chartTimestamp = (() => {
    if (!chartUpdatedAt) return 'not yet loaded';
    const timeStr = chartUpdatedAt.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return `just updated at ${timeStr}`;
  })();

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={th.loadingPage}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={th.page}>

      {/* ══ Page Header ═══════════════════════════════════════════════════ */}
      <Stack sx={th.dashboard.pageHeader.wrapper}>
        <Box>
          <Typography sx={th.dashboard.pageHeader.eyebrow}>{t.HEADER.EYEBROW}</Typography>
          <Typography sx={th.dashboard.pageHeader.title}>{t.HEADER.TITLE}</Typography>
        </Box>
        <Badge badgeContent={recentEvents.length} color="error" max={99}>
          <Box sx={th.dashboard.pageHeader.notifBox}>
            <NotificationsIcon sx={th.dashboard.pageHeader.notifIcon} />
          </Box>
        </Badge>
      </Stack>

      {/* ══ KPI Stats Filter Controls ══════════════════════════════════════ */}
      <Box sx={{ mb: 2 }}>
        <FilterToggleButton
          label={t.DATE_FILTER.LABEL}
          count={dateFilterCount}
          isOpen={dateFilterOpen}
          onClick={() => setDateFilterOpen((v) => !v)}
          sx={th.table.filterBtn(dateFilterOpen || dateFilterCount > 0)}
          iconSx={th.table.filterBtnIcon}
          textSx={th.table.filterBtnText}
          badgeSx={th.table.filterBadgePill}
          chevronSx={th.table.filterBtnChevron}
        />

        {dateFilterOpen && (
          <DashboardDateFilter
            filterType={filterType}
            onFilterChange={setFilterType}
            customStartDate={customStartDate}
            onStartChange={setCustomStartDate}
            customEndDate={customEndDate}
            onEndChange={setCustomEndDate}
            strings={t.DATE_FILTER}
            loading={statsLoading}
            containerSx={th.dashboard.dateRangeBar}
            selectSx={{ minWidth: 150, ...th.filterInputSx }}
            menuProps={th.filterMenuProps}
            menuItemSx={th.filterMenuItemSx}
            textFieldSx={th.filterInputSx}
          />
        )}
      </Box>

      {/* ══ KPI Cards ══════════════════════════════════════════════════════ */}
      <Box sx={th.dashboard.kpiGrid}>
        {statsLoading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <DashKPICardSkeleton
                key={i}
                cardSx={th.kpi.card}
                labelProps={th.kpi.label}
                valueProps={th.kpi.value}
                skeleton={th.kpi.skeleton}
                avatarSx={th.kpi.avatarSx}
              />
            ))
          : kpis.map(({ label, value, sub, Icon, bg }) => (
              <DashKPICard
                key={label}
                label={label}
                value={value ?? '-'}
                sub={sub ?? '-'}
                Icon={Icon}
                bg={bg}
                cardSx={th.kpi.card}
                labelProps={th.kpi.label}
                valueProps={th.kpi.value}
                subRowSx={th.kpi.subRow}
                trendIconSx={th.kpi.trendIcon}
                avatarSx={th.kpi.avatarSx}
                iconSx={th.kpi.iconSx}
              />
            ))
        }
      </Box>

      {/* ══ Charts ═════════════════════════════════════════════════════════ */}
      <Box sx={th.dashboard.chartsGrid}>
        <DashboardChartCard
          cardSx={chartTheme.cardSx}
          headerBoxSx={chartTheme.headerBox(chartTheme.headers.bar)}
          contentSx={chartTheme.contentSx}
          title={t.CHARTS.BATCH_ACTIVITY.TITLE}
          subtitle={t.CHARTS.BATCH_ACTIVITY.SUBTITLE}
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
            borderRadius={6}
            grid={{ horizontal: true }}
            hideLegend
            axisHighlight={{ x: 'band' }}
            highlightedItem={
              typeof pinnedBarIdx === 'number'
                ? { seriesId: 'bar-series', dataIndex: pinnedBarIdx }
                : undefined
            }
            onHighlightChange={(item: any) => {
              if (typeof item?.dataIndex === 'number') setHoverBarIdx(item.dataIndex);
              else setHoverBarIdx(null);
            }}
            onAxisClick={(_: any, axisData: any) => {
              const idx = axisData?.dataIndex;
              if (typeof idx === 'number') setPinnedBarIdx((prev) => (prev === idx ? null : idx));
            }}
            onItemClick={(_: any, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === 'number') setPinnedBarIdx((prev) => (prev === idx ? null : idx));
            }}
            xAxis={[{
              scaleType: 'band',
              data: weeklyActivity.map((d: any) => d.day),
              categoryGapRatio: 0.45,
              barGapRatio: 0.18,
              ...chartTheme.xAxis,
            }]}
            yAxis={[{ position: 'none' }]}
            series={[{
              id: 'bar-series',
              data: weeklyActivity.map((d: any) => d.v),
              valueFormatter: (value: number | null) => `${value ?? 0}`,
              ...chartTheme.barSeries,
            }]}
            slotProps={chartTheme.tooltipSlotProps}
            sx={chartTheme.barChartSx}
          />
        </DashboardChartCard>

        <DashboardChartCard
          cardSx={chartTheme.cardSx}
          headerBoxSx={chartTheme.headerBox(chartTheme.headers.line)}
          contentSx={chartTheme.contentSx}
          title={t.CHARTS.MOTORS_PROCESSED.TITLE}
          subtitle={t.CHARTS.MOTORS_PROCESSED.SUBTITLE}
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
            axisHighlight={{ x: 'line' }}
            highlightedItem={
              typeof pinnedLineIdx === 'number'
                ? { seriesId: 'line-series', dataIndex: pinnedLineIdx }
                : undefined
            }
            onHighlightChange={(item: any) => {
              if (typeof item?.dataIndex === 'number') setHoverLineIdx(item.dataIndex);
              else setHoverLineIdx(null);
            }}
            onAxisClick={(_: any, axisData: any) => {
              const idx = axisData?.dataIndex;
              if (typeof idx === 'number') setPinnedLineIdx((prev) => (prev === idx ? null : idx));
            }}
            onLineClick={(_: any, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === 'number') setPinnedLineIdx((prev) => (prev === idx ? null : idx));
            }}
            onMarkClick={(_: any, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === 'number') setPinnedLineIdx((prev) => (prev === idx ? null : idx));
            }}
            xAxis={[{
              scaleType: 'point',
              data: motorsProcessed.map((d: any) => d.m),
              ...chartTheme.xAxis,
            }]}
            yAxis={[{ position: 'none' }]}
            series={[{
              id: 'line-series',
              data: motorsProcessed.map((d: any) => d.v),
              valueFormatter: (value: number | null) => `${value ?? 0}`,
              ...chartTheme.lineSeries,
            }]}
            slotProps={chartTheme.tooltipSlotProps}
            sx={chartTheme.lineChartSx}
          />
        </DashboardChartCard>

        <DashboardChartCard
          cardSx={chartTheme.cardSx}
          headerBoxSx={chartTheme.headerBox(chartTheme.headers.area)}
          contentSx={chartTheme.contentSx}
          title={t.CHARTS.QC_PASS_RATE.TITLE}
          subtitle={t.CHARTS.QC_PASS_RATE.SUBTITLE}
          highlight={activeAreaPoint ? `${activeAreaPoint.m}: ${activeAreaPoint.v}%` : undefined}
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
            axisHighlight={{ x: 'line' }}
            highlightedItem={
              typeof pinnedAreaIdx === 'number'
                ? { seriesId: 'area-series', dataIndex: pinnedAreaIdx }
                : undefined
            }
            onHighlightChange={(item: any) => {
              if (typeof item?.dataIndex === 'number') setHoverAreaIdx(item.dataIndex);
              else setHoverAreaIdx(null);
            }}
            onAxisClick={(_: any, axisData: any) => {
              const idx = axisData?.dataIndex;
              if (typeof idx === 'number') setPinnedAreaIdx((prev) => (prev === idx ? null : idx));
            }}
            onLineClick={(_: any, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === 'number') setPinnedAreaIdx((prev) => (prev === idx ? null : idx));
            }}
            onMarkClick={(_: any, item: any) => {
              const idx = item?.dataIndex;
              if (typeof idx === 'number') setPinnedAreaIdx((prev) => (prev === idx ? null : idx));
            }}
            xAxis={[{
              scaleType: 'point',
              data: qcPassRate.map((d: any) => d.m),
              ...chartTheme.xAxis,
            }]}
            yAxis={[{ position: 'none' }]}
            series={[{
              id: 'area-series',
              data: qcPassRate.map((d: any) => d.v),
              valueFormatter: (value: number | null) => `${value ?? 0}%`,
              ...chartTheme.areaSeries,
            }]}
            slotProps={chartTheme.tooltipSlotProps}
            sx={chartTheme.areaChartSx}
          />
        </DashboardChartCard>
      </Box>

      {/* ══ Active Batches Table ════════════════════════════════════════════ */}
      <Box sx={th.dashboard.tableSection}>
        <InProgressBatchesTable
          rows={filteredBatches}
          loading={activeBatchesLoading}
          theme={th}
          title={t.BATCH_TABLE.SECTION_TITLE}
          emptyText={t.EMPTY_STATES.NO_BATCHES}
          cardSx={th.card}
          meta={
            <FilterToggleButton
              label={t.FILTERS.BUTTON}
              count={activeFilterCount}
              isOpen={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              sx={th.table.filterBtn(filterActive)}
              iconSx={th.table.filterBtnIcon}
              textSx={th.table.filterBtnText}
              badgeSx={th.table.filterBadgePill}
              chevronSx={th.table.filterBtnChevron}
            />
          }

          filterPanel={
            <Collapse in={filterOpen} timeout={200} unmountOnExit>
              <Box sx={th.table.filterPanel}>

                {/* sub-header — counts + Clear Filters button */}
                <FilterPanelHeader
                  title={t.FILTERS.BUTTON}
                  count={activeFilterCount}
                  onClear={clearBatchesFilters}
                  clearLabel={t.FILTERS.CLEAR_ALL}
                  recordText={`— ${filteredBatches.length} / ${activeBatches.length} records shown`}
                  containerSx={{ ...th.table.filterPanelHeader, mb: 1.5 }}
                  iconSx={th.table.filterBtnIcon}
                  labelSx={th.table.filterLabel}
                  badgeSx={th.table.filterBadge}
                  metaTextSx={th.table.filterMetaText}
                  clearChipSx={th.table.clearChip}
                />

                {/* row 1 — search + dropdowns */}
                <Stack direction="row" gap={1.5} flexWrap="wrap" mb={2}>
                  <TextField
                    size="small"
                    placeholder={t.PLACEHOLDERS.BATCH_SEARCH}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={th.table.searchIcon} />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery("")} sx={th.table.clearIconBtn}>
                            <ClearIcon sx={th.table.clearIcon} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={th.table.searchInput}
                  />
                  <FilterSelect
                    label={t.FILTERS.STAGE}
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    options={['All', ...subDepartments]}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    sx={th.table.stageSelect}
                  />
                  <FilterSelect
                    label={t.FILTERS.TYPE}
                    value={filterBatchType}
                    onChange={(e) => setFilterBatchType(e.target.value)}
                    options={t.BATCH_FILTERS.TYPES}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    sx={th.table.typeSelect}
                  />
                  <FilterSelect
                    label={t.FILTERS.STATUS}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={t.BATCH_FILTERS.STATUSES}
                    menuProps={filterMenuProps}
                    itemSx={filterMenuItemSx}
                    showAllOption={false}
                    sx={th.table.statusSelect}
                  />
                </Stack>

                {/* row 2 — date pickers + This Month chip */}
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                  <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
                    <CalendarMonthIcon sx={th.table.calendarIcon} />
                    <DatePicker
                      label={t.FILTERS.FROM}
                      format="DD/MM/YYYY"
                      value={dateFrom ? dayjs(toYMD(dateFrom)) : null}
                      onChange={(val) => { setDateFrom(val ? toDMY(val.format('YYYY-MM-DD')) : ''); setCurrentMonthOnly(false); }}
                      slotProps={{ textField: { size: 'small', sx: th.table.datePicker(false) } }}
                    />
                    <Typography sx={th.table.filterDateSeparator}>{t.FILTERS.DATE_SEPARATOR}</Typography>
                    <DatePicker
                      label={t.FILTERS.TO}
                      format="DD/MM/YYYY"
                      value={dateTo ? dayjs(toYMD(dateTo)) : null}
                      onChange={(val) => { setDateTo(val ? toDMY(val.format('YYYY-MM-DD')) : ''); setCurrentMonthOnly(false); }}
                      slotProps={{ textField: { size: 'small', sx: th.table.datePicker(false) } }}
                    />
                    <Chip
                      label={t.FILTERS.THIS_MONTH_CHIP}
                      size="small"
                      clickable
                      onClick={toggleCurrentMonth}
                      sx={th.table.thisMonthChip(currentMonthOnly)}
                    />
                  </Stack>
                </LocalizationProvider>
              </Box>
            </Collapse>
          }
        />
      </Box>

      {/* ══ Blockchain Events ═══════════════════════════════════════════════ */}
      <Card sx={th.dashboard.blockchainCard}>
        <SectionHeader
          title={t.BLOCKCHAIN_EVENTS.SECTION_TITLE}
          titleSx={th.timeline.sectionTitle.sx}
          meta={
            <FilterToggleButton
              label={t.FILTERS.BUTTON}
              count={eventsActiveFilterCount}
              isOpen={eventsFilterOpen}
              onClick={() => setEventsFilterOpen((v: boolean) => !v)}
              sx={th.table.filterBtn(eventsFilterOpen || eventsActiveFilterCount > 0)}
              iconSx={th.table.filterBtnIcon}
              textSx={th.table.filterBtnText}
              badgeSx={th.table.filterBadgePill}
              chevronSx={th.table.filterBtnChevron}
            />
          }
        />

        <Collapse in={eventsFilterOpen} timeout={200} unmountOnExit>
          <Box sx={th.table.filterPanel}>
            <FilterPanelHeader
              title={t.FILTERS.TIMELINE_LABEL}
              count={eventsActiveFilterCount}
              onClear={clearEventsFilters}
              clearLabel={t.FILTERS.CLEAR_ALL}
              containerSx={th.table.filterPanelHeader}
              iconSx={th.table.filterBtnIcon}
              labelSx={th.table.filterLabel}
              badgeSx={th.table.filterBadge}
              clearChipSx={th.table.clearChip}
            />

            <Stack direction="row" gap={1.5} flexWrap="wrap" mb={2}>
              <TextField
                size="small"
                placeholder={t.PLACEHOLDERS.EVENT_SEARCH}
                value={eventsSearchQuery}
                onChange={(e) => setEventsSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SearchIcon sx={th.table.searchIcon} /></InputAdornment>),
                  endAdornment: eventsSearchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setEventsSearchQuery('')} sx={th.table.clearIconBtn}>
                        <ClearIcon sx={th.table.clearIcon} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={th.table.searchInput}
              />
              <FilterSelect
                label={t.FILTERS.TYPE}
                value={eventsType}
                onChange={(e) => setEventsType(e.target.value)}
                options={t.EVENT_FILTERS.TYPES}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.table.stageSelect}
              />
              <FilterSelect
                label={t.FILTERS.DEPARTMENT}
                value={eventsDepartment}
                onChange={(e) => setEventsDepartment(e.target.value)}
                options={t.EVENT_FILTERS.DEPARTMENTS}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.table.typeSelect}
              />
            </Stack>

            <DateRangeRow
              from={eventsDateFrom}
              to={eventsDateTo}
              onFromChange={(v) => { setEventsDateFrom(v); setEventsCurrentMonthOnly(false); }}
              onToChange={(v) => { setEventsDateTo(v); setEventsCurrentMonthOnly(false); }}
              currentMonthOnly={eventsCurrentMonthOnly}
              fromLabel={t.FILTERS.FROM}
              toLabel={t.FILTERS.TO}
              separatorLabel={t.FILTERS.DATE_SEPARATOR}
              calendarIconSx={th.table.calendarIcon}
              datePickerSx={th.table.datePicker}
              separatorSx={th.table.filterDateSeparator}
              dateInputProps={th.table.dateInputProps}
            />
          </Box>
        </Collapse>

        <Stack sx={{ ...th.timeline.container, position: 'relative', minHeight: 120 }}>
          {eventsLoading && (
            <Box sx={th.timeline.loadingOverlay}>
              <CircularProgress size={32} />
            </Box>
          )}
          {recentEvents.length === 0 && !eventsLoading ? (
             <Box sx={{ p: 4, textAlign: 'center' }}>
               <Typography color="text.secondary">{t.EMPTY_STATES.NO_EVENTS}</Typography>
             </Box>
          ) : (
            recentEvents.map((o: any, i: number) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start"
                sx={th.timeline.item(i < recentEvents.length - 1)}>
                <Avatar sx={th.timeline.avatarSx(o.color)}>{o.icon}</Avatar>
                <Box>
                  <Typography {...th.timeline.batchId}>
                    {o.batchId} 
                    {o.eventType && <Chip label={o.eventType} size="small" sx={th.timeline.eventChip} />}
                  </Typography>
                  <Typography {...th.timeline.label}>{o.eventStatusMessage}</Typography>
                  <StackRow spacing={1.5} mt={0.5}>
                    <StackRow spacing={0.3}>
                      <icons.clock sx={th.timeline.clockIcon} />
                      <Typography {...th.timeline.timestamp}>{new Date(o.timestamp).toLocaleString()}</Typography>
                    </StackRow>
                    {o.department && (
                      <Typography sx={th.timeline.deptLabel}>• {o.department}</Typography>
                    )}
                  </StackRow>
                </Box>
              </Stack>
            ))
          )}
        </Stack>
      </Card>
    </Box>
  );
}