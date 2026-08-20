import React, { useState } from "react";
import { Box } from "@mui/material";
import FilterToggleButton from "@ui/components/common/FilterToggleButton";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "@ui/components/custom/dashboard/DashboardDateFilter";
import { DashKPICard, DashKPICardSkeleton } from "@ui/components/custom/dashboard/DashKPICard";
import { STRINGS } from "@app/config/strings";

type DashboardKpiSectionProps = {
  th: any;
  statsLoading: boolean;
  kpis: any[];
  filterType: string;
  setFilterType: (val: string) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  applyCustomDateFilter: () => void;
  clearDateFilter: () => void;
};

const t = STRINGS.DASHBOARD_PAGE;

export default function DashboardKpiSection({
  th,
  statsLoading,
  kpis,
  filterType,
  setFilterType,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  applyCustomDateFilter,
  clearDateFilter,
}: DashboardKpiSectionProps) {
  const [dateFilterOpen, setDateFilterOpen] = useState(true);
  const dateFilterCount = filterType !== t.DATE_FILTER.VALUES.ONE_YEAR ? 1 : 0;

  return (
    <>
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
          selectedValue={getDateFilterDisplayLabel(filterType, t.DATE_FILTER)}
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
          : kpis.map(({ label, value, Icon, bg }) => (
              <DashKPICard
                key={label}
                label={label}
                value={value ?? "-"}
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
            ))}
      </Box>
    </>
  );
}
