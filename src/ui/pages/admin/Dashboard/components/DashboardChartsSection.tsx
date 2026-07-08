import React, { useState } from "react";
import { Box } from "@mui/material";
import { LineChart, BarChart } from "@mui/x-charts";
import DashboardChartCard from "@ui/components/custom/dashboard/DashboardChartCard";

type DashboardChartsSectionProps = {
  th: any;
  t: typeof import("@app/config/strings").STRINGS.DASHBOARD_PAGE;
  weeklyActivity: any[];
  motorsProcessed: any[];
  qcPassRate: any[];
  chartUpdatedAt: Date | null;
};

export default function DashboardChartsSection({
  th,
  t,
  weeklyActivity,
  motorsProcessed,
  qcPassRate,
  chartUpdatedAt,
}: DashboardChartsSectionProps) {
  const chartTheme = th.sharedCharts;

  const [hoverBarIdx, setHoverBarIdx] = useState<number | null>(null);
  const [pinnedBarIdx, setPinnedBarIdx] = useState<number | null>(null);
  const [hoverLineIdx, setHoverLineIdx] = useState<number | null>(null);
  const [pinnedLineIdx, setPinnedLineIdx] = useState<number | null>(null);
  const [hoverAreaIdx, setHoverAreaIdx] = useState<number | null>(null);
  const [pinnedAreaIdx, setPinnedAreaIdx] = useState<number | null>(null);

  const activeBarIdx = pinnedBarIdx ?? hoverBarIdx;
  const activeLineIdx = pinnedLineIdx ?? hoverLineIdx;
  const activeAreaIdx = pinnedAreaIdx ?? hoverAreaIdx;
  const activeBarPoint = typeof activeBarIdx === "number" ? weeklyActivity[activeBarIdx] : null;
  const activeLinePoint = typeof activeLineIdx === "number" ? motorsProcessed[activeLineIdx] : null;
  const activeAreaPoint = typeof activeAreaIdx === "number" ? qcPassRate[activeAreaIdx] : null;

  const chartTimestamp = (() => {
    if (!chartUpdatedAt) return "not yet loaded";
    const timeStr = chartUpdatedAt.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `just updated at ${timeStr}`;
  })();

  return (
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
          axisHighlight={{ x: "band" }}
          highlightedItem={
            typeof pinnedBarIdx === "number"
              ? { seriesId: "bar-series", dataIndex: pinnedBarIdx }
              : undefined
          }
          onHighlightChange={(item: any) => {
            if (typeof item?.dataIndex === "number") setHoverBarIdx(item.dataIndex);
            else setHoverBarIdx(null);
          }}
          onAxisClick={(_: any, axisData: any) => {
            const idx = axisData?.dataIndex;
            if (typeof idx === "number") setPinnedBarIdx((prev) => (prev === idx ? null : idx));
          }}
          onItemClick={(_: any, item: any) => {
            const idx = item?.dataIndex;
            if (typeof idx === "number") setPinnedBarIdx((prev) => (prev === idx ? null : idx));
          }}
          xAxis={[
            {
              scaleType: "band",
              data: weeklyActivity.map((d: any) => d.day),
              categoryGapRatio: 0.45,
              barGapRatio: 0.18,
              ...chartTheme.xAxis,
            },
          ]}
          yAxis={[{ position: "none" }]}
          series={[
            {
              id: "bar-series",
              data: weeklyActivity.map((d: any) => d.v),
              valueFormatter: (value: number | null) => `${value ?? 0}`,
              ...chartTheme.barSeries,
            },
          ]}
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
          axisHighlight={{ x: "line" }}
          highlightedItem={
            typeof pinnedLineIdx === "number"
              ? { seriesId: "line-series", dataIndex: pinnedLineIdx }
              : undefined
          }
          onHighlightChange={(item: any) => {
            if (typeof item?.dataIndex === "number") setHoverLineIdx(item.dataIndex);
            else setHoverLineIdx(null);
          }}
          onAxisClick={(_: any, axisData: any) => {
            const idx = axisData?.dataIndex;
            if (typeof idx === "number") setPinnedLineIdx((prev) => (prev === idx ? null : idx));
          }}
          onLineClick={(_: any, item: any) => {
            const idx = item?.dataIndex;
            if (typeof idx === "number") setPinnedLineIdx((prev) => (prev === idx ? null : idx));
          }}
          onMarkClick={(_: any, item: any) => {
            const idx = item?.dataIndex;
            if (typeof idx === "number") setPinnedLineIdx((prev) => (prev === idx ? null : idx));
          }}
          xAxis={[
            {
              scaleType: "point",
              data: motorsProcessed.map((d: any) => d.m),
              ...chartTheme.xAxis,
            },
          ]}
          yAxis={[{ position: "none" }]}
          series={[
            {
              id: "line-series",
              data: motorsProcessed.map((d: any) => d.v),
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
          axisHighlight={{ x: "line" }}
          highlightedItem={
            typeof pinnedAreaIdx === "number"
              ? { seriesId: "area-series", dataIndex: pinnedAreaIdx }
              : undefined
          }
          onHighlightChange={(item: any) => {
            if (typeof item?.dataIndex === "number") setHoverAreaIdx(item.dataIndex);
            else setHoverAreaIdx(null);
          }}
          onAxisClick={(_: any, axisData: any) => {
            const idx = axisData?.dataIndex;
            if (typeof idx === "number") setPinnedAreaIdx((prev) => (prev === idx ? null : idx));
          }}
          onLineClick={(_: any, item: any) => {
            const idx = item?.dataIndex;
            if (typeof idx === "number") setPinnedAreaIdx((prev) => (prev === idx ? null : idx));
          }}
          onMarkClick={(_: any, item: any) => {
            const idx = item?.dataIndex;
            if (typeof idx === "number") setPinnedAreaIdx((prev) => (prev === idx ? null : idx));
          }}
          xAxis={[
            {
              scaleType: "point",
              data: qcPassRate.map((d: any) => d.m),
              ...chartTheme.xAxis,
            },
          ]}
          yAxis={[{ position: "none" }]}
          series={[
            {
              id: "area-series",
              data: qcPassRate.map((d: any) => d.v),
              valueFormatter: (value: number | null) => `${value ?? 0}%`,
              ...chartTheme.areaSeries,
            },
          ]}
          slotProps={chartTheme.tooltipSlotProps}
          sx={chartTheme.areaChartSx}
        />
      </DashboardChartCard>
    </Box>
  );
}
