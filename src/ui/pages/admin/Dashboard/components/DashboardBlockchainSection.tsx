import React from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import Card from "@ui/components/common/Card";
import SectionHeader from "@ui/components/common/SectionHeader";
import StackRow from "@ui/components/common/StackRow";
import FilterSelect from "@ui/components/common/FilterSelect";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminFilterPanel from "@ui/components/custom/admin/AdminFilterPanel";
import { STRINGS } from "@app/config/strings";

const AC = STRINGS.ADMIN_COMMON;

type DashboardBlockchainSectionProps = {
  th: any;
  t: typeof import("@app/config/strings").STRINGS.DASHBOARD_PAGE;
  filterMenuProps: any;
  filterMenuItemSx: any;
  recentEvents: any[];
  eventsLoading: boolean;
  eventsFilterOpen: boolean;
  toggleEventsFilterOpen: () => void;
  setEventsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  eventsSearchQuery: string;
  setEventsSearchQuery: (val: string) => void;
  eventsDraftFilters: {
    type: string;
    department: string;
    subDepartment: string;
    dateFrom: string;
    dateTo: string;
    currentMonthOnly: boolean;
  };
  setEventsDraftFilter: <K extends keyof DashboardBlockchainSectionProps["eventsDraftFilters"]>(
    field: K,
    value: DashboardBlockchainSectionProps["eventsDraftFilters"][K]
  ) => void;
  applyEventsFilters: () => void;
  eventsActiveFilterCount: number;
  clearEventsFilters: () => void;
};

export default function DashboardBlockchainSection({
  th,
  t,
  filterMenuProps,
  filterMenuItemSx,
  recentEvents,
  eventsLoading,
  eventsFilterOpen,
  toggleEventsFilterOpen,
  setEventsFilterOpen,
  eventsSearchQuery,
  setEventsSearchQuery,
  eventsDraftFilters,
  setEventsDraftFilter,
  applyEventsFilters,
  eventsActiveFilterCount,
  clearEventsFilters,
}: DashboardBlockchainSectionProps) {
  const shellTheme = {
    batchListShell: th.batchListShell,
    filterToggle: th.filterToggle,
  };

  return (
    <Card sx={th.dashboard.blockchainCard}>
      <SectionHeader
        title={t.BLOCKCHAIN_EVENTS.SECTION_TITLE}
        titleSx={th.timeline.sectionTitle.sx}
      />

      <AdminListShell
        search={eventsSearchQuery}
        onSearchChange={setEventsSearchQuery}
        searchPlaceholder={t.PLACEHOLDERS.EVENT_SEARCH}
        filterOpen={eventsFilterOpen}
        onFilterToggle={toggleEventsFilterOpen}
        activeFilterCount={eventsActiveFilterCount}
        filtersToggleLabel={t.FILTERS.BUTTON}
        resultText={`${recentEvents.length} events`}
        loading={eventsLoading}
        hasItems={recentEvents.length > 0}
        emptyTitle={t.EMPTY_STATES.NO_EVENTS}
        filterExtension={
          <AdminFilterPanel
            title={t.FILTERS.TIMELINE_LABEL}
            activeFilterCount={eventsActiveFilterCount}
            onClear={clearEventsFilters}
            clearLabel={t.FILTERS.CLEAR_ALL}
            onClose={() => setEventsFilterOpen(false)}
            onApply={applyEventsFilters}
            closeLabel={AC.FILTERS_CLOSE}
            applyLabel={AC.FILTERS_APPLY}
            theme={th}
          >
            <Stack direction="row" gap={1.5} flexWrap="wrap" mb={2}>
              <FilterSelect
                label={t.FILTERS.TYPE}
                value={eventsDraftFilters.type}
                onChange={(e) => setEventsDraftFilter("type", e.target.value)}
                options={t.EVENT_FILTERS.TYPES}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.filterPanel.field}
              />
              <FilterSelect
                label={t.FILTERS.DEPARTMENT}
                value={eventsDraftFilters.department}
                onChange={(e) => setEventsDraftFilter("department", e.target.value)}
                options={t.EVENT_FILTERS.DEPARTMENTS}
                menuProps={filterMenuProps}
                itemSx={filterMenuItemSx}
                showAllOption={false}
                sx={th.filterPanel.field}
              />
            </Stack>

            <DateRangeRow
              from={eventsDraftFilters.dateFrom}
              to={eventsDraftFilters.dateTo}
              onFromChange={(v) => {
                setEventsDraftFilter("dateFrom", v);
                setEventsDraftFilter("currentMonthOnly", false);
              }}
              onToChange={(v) => {
                setEventsDraftFilter("dateTo", v);
                setEventsDraftFilter("currentMonthOnly", false);
              }}
              currentMonthOnly={eventsDraftFilters.currentMonthOnly}
              fromLabel={t.FILTERS.FROM}
              toLabel={t.FILTERS.TO}
              separatorLabel={t.FILTERS.DATE_SEPARATOR}
              calendarIconSx={th.table.calendarIcon}
              datePickerSx={th.table.datePicker}
              separatorSx={th.table.filterDateSeparator}
              textFieldProps={th.table.dateInputProps}
            />
          </AdminFilterPanel>
        }
        theme={shellTheme}
      >
        <Stack
          sx={{
            ...th.timeline.container,
            position: "relative",
            minHeight: 120,
          }}
        >
          {eventsLoading && (
            <Box sx={th.timeline.loadingOverlay}>
              <CircularProgress size={32} />
            </Box>
          )}
          {recentEvents.length === 0 && !eventsLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">{t.EMPTY_STATES.NO_EVENTS}</Typography>
            </Box>
          ) : (
            recentEvents.map((o: any, i: number) => (
              <Stack
                key={i}
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={th.timeline.item(i < recentEvents.length - 1)}
              >
                <Avatar sx={th.timeline.avatarSx(o.color)}>{o.icon}</Avatar>
                <Box>
                  <Typography {...th.timeline.batchId}>
                    {o.batchId}
                    {o.eventType && (
                      <Chip label={o.eventType} size="small" sx={th.timeline.eventChip} />
                    )}
                  </Typography>
                  <Typography {...th.timeline.label}>{o.eventStatusMessage}</Typography>
                  <StackRow spacing={1.5} mt={0.5}>
                    <StackRow spacing={0.3}>
                      <icons.clock sx={th.timeline.clockIcon} />
                      <Typography {...th.timeline.timestamp}>
                        {new Date(o.timestamp).toLocaleString()}
                      </Typography>
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
      </AdminListShell>
    </Card>
  );
}
