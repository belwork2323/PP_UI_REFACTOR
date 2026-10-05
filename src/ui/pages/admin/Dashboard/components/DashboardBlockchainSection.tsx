import React from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import Card from "@ui/components/common/Card";
import SectionHeader from "@ui/components/common/SectionHeader";
import StackRow from "@ui/components/common/StackRow";
import FilterSelect from "@ui/components/common/FilterSelect";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@ui/components/custom/admin/AdminListFilterPanel";
import { STRINGS } from "@app/config/strings";
import { fetchBatchById } from "@data/api/admin/BatchManagement/batchManagementApi";
import { fetchBlockchainBatchById } from "@/data/api/admin/blockchainEvent/bacthApi";

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
    value: DashboardBlockchainSectionProps["eventsDraftFilters"][K],
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

  const [batchId, setBatchId] = React.useState("");
  const [batchData, setBatchData] = React.useState<any>(null);
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [batchError, setBatchError] = React.useState("");

  const handleFetchBatchDetails = async () => {
    const trimmedBatchId = batchId.trim();

    if (!trimmedBatchId) {
      setBatchError("Please enter a batch ID.");
      setBatchData(null);
      return;
    }

    setBatchLoading(true);
    setBatchError("");

    try {
      const response = await fetchBlockchainBatchById(trimmedBatchId);

      if (response?.success === false) {
        throw response;
      }

      const payload = response?.data ?? response?.batch ?? response;
      setBatchData(payload);
    } catch (error: any) {
      setBatchData(null);
      setBatchError(error?.message || "Failed to fetch batch details from blockchain.");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <Card sx={th.dashboard.blockchainCard}>
      <SectionHeader
        title={t.BLOCKCHAIN_EVENTS.SECTION_TITLE}
        titleSx={th.timeline.sectionTitle.sx}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ p: 2, alignItems: "stretch" }}
      >
        <Stack sx={{ width: { xs: "100%", md: 360 }, minWidth: 0 }} spacing={1.5}>
          <TextField
            label="Batch ID"
            placeholder="Enter batch ID"
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleFetchBatchDetails();
              }
            }}
            size="small"
            fullWidth
            sx={{ minWidth: 220 }}
          />

          <Button
            variant="contained"
            onClick={() => void handleFetchBatchDetails()}
            disabled={batchLoading || !batchId.trim()}
            sx={{ alignSelf: "flex-start" }}
          >
            {batchLoading ? "Loading..." : "Fetch details"}
          </Button>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minWidth: 420,
            minHeight: 260,
            maxHeight: 460,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#0f172a",
            color: "#e2e8f0",
            p: 2,
            overflowY: "auto",
            overflowX: "auto",
            scrollbarWidth: "thin",
          }}
        >
          {batchLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} color="inherit" />
              <Typography variant="body2">Fetching batch details…</Typography>
            </Stack>
          ) : batchError ? (
            <Typography variant="body2" color="error.light">
              {batchError}
            </Typography>
          ) : batchData ? (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              {JSON.stringify(batchData, null, 2)}
            </pre>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Enter a batch ID to view the blockchain response JSON.
            </Typography>
          )}
        </Box>
      </Stack>

      {/* <AdminListShell
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
          <AdminListFilterPanel
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
            <FilterSelect
              label={t.FILTERS.TYPE}
              value={eventsDraftFilters.type}
              onChange={(e) => setEventsDraftFilter("type", e.target.value)}
              options={t.EVENT_FILTERS.TYPES}
              menuProps={filterMenuProps}
              itemSx={filterMenuItemSx}
              showAllOption={false}
              filterPanel
              sx={{ ...th.filterPanel.field, ...th.filterPanel.fieldItem }}
            />
            <FilterSelect
              label={t.FILTERS.DEPARTMENT}
              value={eventsDraftFilters.department}
              onChange={(e) => setEventsDraftFilter("department", e.target.value)}
              options={t.EVENT_FILTERS.DEPARTMENTS}
              menuProps={filterMenuProps}
              itemSx={filterMenuItemSx}
              showAllOption={false}
              filterPanel
              sx={{ ...th.filterPanel.field, ...th.filterPanel.fieldItem }}
            />

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
              showLeadingIcon={false}
              nowrap
              alignInputs="filter"
              controlHeight={32}
              calendarIconSx={th.table.calendarIcon}
              datePickerSx={th.filterPanel.field}
              containerSx={{ ...th.filterPanel.fieldItem, flex: "2 1 320px" }}
              separatorSx={th.table.filterDateSeparator}
              textFieldProps={th.table.dateInputProps}
            />
          </AdminListFilterPanel>
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
      </AdminListShell> */}
    </Card>
  );
}
