import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Card from "@ui/components/common/Card";
import SectionHeader from "@ui/components/common/SectionHeader";
import FilterSelect from "@ui/components/common/FilterSelect";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import JsonTreeViewer from "@ui/components/common/JsonTreeViewer";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@ui/components/custom/admin/AdminListFilterPanel";
import { STRINGS } from "@app/config/strings";
import { fetchBlockchainBatchById } from "@/data/api/admin/blockchainEvent/bacthApi";
import getBatchManagementTheme from "@/app/theme/custom_themes/admin/BatchManagement/batchManagement_theme";

const AC = STRINGS.ADMIN_COMMON;

type BlockchainEventRow = {
  key: string;
  batchId: string;
  subDeptName: string;
  assetId: string;
  createdOn: string;
  statusLabel: string;
  raw: any;
};

type BatchEventGroup = {
  batchId: string;
  primary: BlockchainEventRow;
  children: BlockchainEventRow[];
  eventCount: number;
};

const extractAssetIdFromMessage = (value: string) => {
  if (!value) return "—";
  const match = value.match(/asset(?:\s+uid|\s+id|\s+name)?[:\s]+([^\s]+)/i);
  if (match?.[1]) return match[1];
  const cleaned = value.replace(/.*?asset/i, "asset");
  return cleaned.length > 0 ? cleaned : "—";
};

const getEventCreatedOn = (event: any) =>
  String(event?.timestamp || event?.createdAt || event?.createdOn || "").trim();

const getEventSortTime = (event: any) => {
  const parsed = Date.parse(getEventCreatedOn(event));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeEventRow = (event: any, index: number): BlockchainEventRow => {
  const batchId = String(event?.batchId ?? "").trim() || "—";
  const subDeptName =
    String(event?.subDepartment || event?.department || event?.subdepartment || "").trim() || "—";
  const assetId =
    String(
      event?.assetId ||
        event?.assetUid ||
        event?.asset_id ||
        extractAssetIdFromMessage(event?.eventStatusMessage || ""),
    ).trim() || "—";
  const createdOn = getEventCreatedOn(event);
  const statusLabel = String(event?.eventType || event?.eventStatusMessage || "Status").trim();
  const key =
    String(event?.transactionId || event?.id || "").trim() || `${batchId}-${assetId}-${index}`;

  return { key, batchId, subDeptName, assetId, createdOn, statusLabel, raw: event };
};

const groupEventsByBatchId = (events: any[]): BatchEventGroup[] => {
  const groups = new Map<string, BlockchainEventRow[]>();

  events.forEach((event, index) => {
    const row = normalizeEventRow(event, index);
    const existing = groups.get(row.batchId);
    if (existing) existing.push(row);
    else groups.set(row.batchId, [row]);
  });

  return Array.from(groups.entries()).map(([batchId, rows]) => {
    const sorted = [...rows].sort(
      (a, b) => getEventSortTime(b.raw) - getEventSortTime(a.raw),
    );
    const [primary, ...children] = sorted;
    return {
      batchId,
      primary,
      children,
      eventCount: sorted.length,
    };
  });
};

const statusChipSx = (statusLabel: string) => {
  const lower = statusLabel.toLowerCase();
  const isCreated = lower.includes("created");
  const isApproved = lower.includes("approved");
  const isError = lower.includes("error") || lower.includes("failed");

  return {
    backgroundColor: isCreated
      ? "#E8F5E9"
      : isApproved
        ? "#E3F2FD"
        : isError
          ? "#FDECEA"
          : "#F1F5F9",
    color: isCreated ? "#1B5E20" : isApproved ? "#0D47A1" : isError ? "#B71C1C" : "#334155",
    fontWeight: 600,
    borderRadius: 1,
  };
};

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
  const { tableCell } = getBatchManagementTheme();
  const [dialogBatchId, setDialogBatchId] = useState<string | null>(null);
  const [dialogBatchData, setDialogBatchData] = useState<any>(null);
  const [dialogBatchMeta, setDialogBatchMeta] = useState({ department: "", createdAt: "" });
  const [dialogBatchLoading, setDialogBatchLoading] = useState(false);
  const [dialogBatchError, setDialogBatchError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});

  const batchGroups = useMemo(() => groupEventsByBatchId(recentEvents), [recentEvents]);

  useEffect(() => {
    setExpandedBatchIds({});
  }, [recentEvents]);

  const resultSummary =
    batchGroups.length === 0
      ? "0 events"
      : `${batchGroups.length} batch${batchGroups.length === 1 ? "" : "es"} · ${recentEvents.length} event${recentEvents.length === 1 ? "" : "s"}`;

  const getBatchFieldValue = (obj: any, keys: string[]) => {
    if (!obj || typeof obj !== "object") {
      return "";
    }

    for (const key of keys) {
      const value = obj[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return "";
  };

  const getBatchMeta = (data: any, fallback = { department: "", createdAt: "" }) => {
    const department =
      getBatchFieldValue(data, [
        "departmentName",
        "department",
        "deptName",
        "departmentLabel",
        "departmentTitle",
      ]) ||
      getBatchFieldValue(data?.department, ["name", "label", "title"]) ||
      getBatchFieldValue(data?.metadata, ["departmentName", "department", "deptName"]) ||
      fallback.department;

    const createdAt =
      getBatchFieldValue(data, ["createdOn", "createdAt", "created", "createdDate", "timestamp"]) ||
      getBatchFieldValue(data?.metadata, ["createdOn", "createdAt", "created", "timestamp"]) ||
      fallback.createdAt;

    return {
      department: typeof department === "string" ? department : JSON.stringify(department),
      createdAt: typeof createdAt === "string" ? createdAt : JSON.stringify(createdAt),
    };
  };

  const formatDialogDate = (value: string) => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  };

  const handleFetchBatchDetails = async (
    batchId: string,
    eventMeta?: { department?: string; createdAt?: string },
  ) => {
    const trimmedBatchId = batchId?.trim();

    if (!trimmedBatchId) {
      return;
    }

    setDialogOpen(true);
    setDialogBatchId(trimmedBatchId);
    setDialogBatchData(null);
    setDialogBatchMeta({
      department: eventMeta?.department || "",
      createdAt: eventMeta?.createdAt || "",
    });
    setDialogBatchError("");
    setDialogBatchLoading(true);

    try {
      const response = await fetchBlockchainBatchById(trimmedBatchId);

      if (response?.success === false) {
        throw response;
      }

      const payload = response?.data ?? response?.batch ?? response;
      setDialogBatchData(payload);
    } catch (error: any) {
      setDialogBatchData(null);
      setDialogBatchError(error?.message || "Failed to fetch batch details from blockchain.");
    } finally {
      setDialogBatchLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogBatchId(null);
    setDialogBatchData(null);
    setDialogBatchError("");
    setDialogBatchMeta({ department: "", createdAt: "" });
    setDialogBatchLoading(false);
  };

  const dialogMeta = getBatchMeta(dialogBatchData, dialogBatchMeta);

  const openEventDetails = (row: BlockchainEventRow) => {
    void handleFetchBatchDetails(row.assetId, {
      department: row.subDeptName,
      createdAt: row.createdOn,
    });
  };

  const eventTableHeader = (
    <TableHead>
      <TableRow sx={{ backgroundColor: "#f8fafc" }}>
        <TableCell sx={{ ...th.table.header, fontWeight: 700 }}>Batch ID</TableCell>
        <TableCell sx={{ ...th.table.header, fontWeight: 700 }}>Subdept Name</TableCell>
        <TableCell sx={{ ...th.table.header, fontWeight: 700 }}>Asset ID</TableCell>
        <TableCell sx={{ ...th.table.header, fontWeight: 700 }}>Created On</TableCell>
        <TableCell sx={{ ...th.table.header, fontWeight: 700 }}>Status</TableCell>
        <TableCell align="right" sx={{ ...th.table.header, fontWeight: 700, width: 80 }}>
          Actions
        </TableCell>
      </TableRow>
    </TableHead>
  );

  const renderEventCells = (row: BlockchainEventRow, emphasizeBatchId = false) => (
    <>
      <TableCell sx={th.table.cell}>
        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault();
            openEventDetails(row);
          }}
          underline="hover"
          sx={{
            color: "primary.main",
            fontWeight: emphasizeBatchId ? 700 : 600,
            cursor: "pointer",
          }}
        >
          {row.batchId}
        </Link>
      </TableCell>
      <TableCell sx={th.table.cell}>{row.subDeptName}</TableCell>
      <TableCell
        sx={{
          ...th.table.cell,
          maxWidth: 260,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={row.assetId}
      >
        {row.assetId}
      </TableCell>
      <TableCell sx={th.table.cellDate}>
        {row.createdOn ? new Date(row.createdOn).toLocaleString() : "—"}
      </TableCell>
      <TableCell sx={th.table.cell}>
        <Chip label={row.statusLabel} size="small" sx={statusChipSx(row.statusLabel)} />
      </TableCell>
      <TableCell align="right" sx={{ ...th.table.cell, width: 80, p: 1 }}>
        <Tooltip title="View Details" arrow placement="top">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              openEventDetails(row);
            }}
            sx={tableCell.editButton}
          >
            <VisibilityOutlinedIcon sx={tableCell.editIcon} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </>
  );

  return (
    <Card sx={th.dashboard.blockchainCard}>
      <SectionHeader
        title={t.BLOCKCHAIN_EVENTS.SECTION_TITLE}
        titleSx={th.timeline.sectionTitle.sx}
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.2)",
            bgcolor: "#ffffff",
            color: "#0f172a",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
            py: 2,
            borderBottom: "1px solid rgba(148,163,184,0.18)",
            background: "#ffffff",
            color: "#0f172a",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
              Batch details — {dialogBatchId || "Unknown"}
            </Typography>
            {(dialogMeta.department || dialogMeta.createdAt) && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                {dialogMeta.department && (
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    SubDepartment : {dialogMeta.department}
                  </Typography>
                )}
                {dialogMeta.createdAt && (
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Created: {formatDialogDate(dialogMeta.createdAt)}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>

          <IconButton
            aria-label="close batch details"
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: "#334155",
              border: "1px solid rgba(148,163,184,0.28)",
              backgroundColor: "rgba(248,250,252,0.9)",
              "&:hover": { backgroundColor: "rgba(226,232,240,0.8)", color: "#0f172a" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ bgcolor: "#ffffff", color: "#0f172a", minHeight: 220, p: 2.5 }}
        >
          {dialogBatchLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" sx={{ color: "#475569" }}>
                Fetching batch details…
              </Typography>
            </Stack>
          ) : dialogBatchError ? (
            <Typography variant="body2" color="error">
              {dialogBatchError}
            </Typography>
          ) : dialogBatchData ? (
            <JsonTreeViewer data={dialogBatchData} rootLabel="JSON Data" />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No batch data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#ffffff", borderTop: "1px solid rgba(148,163,184,0.18)" }}>
          <Button onClick={handleCloseDialog} variant="contained" sx={{ minWidth: 120 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AdminListShell
        search={eventsSearchQuery}
        onSearchChange={setEventsSearchQuery}
        searchPlaceholder={t.PLACEHOLDERS.EVENT_SEARCH}
        filterOpen={eventsFilterOpen}
        onFilterToggle={toggleEventsFilterOpen}
        activeFilterCount={eventsActiveFilterCount}
        filtersToggleLabel={t.FILTERS.BUTTON}
        resultText={resultSummary}
        loading={eventsLoading}
        hasItems={batchGroups.length > 0}
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
        <Box sx={{ position: "relative", minHeight: 120 }}>
          {eventsLoading && (
            <Box sx={th.timeline.loadingOverlay}>
              <CircularProgress size={32} />
            </Box>
          )}

          {batchGroups.length === 0 && !eventsLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">{t.EMPTY_STATES.NO_EVENTS}</Typography>
            </Box>
          ) : (
            <Stack spacing={1.25} sx={{ minWidth: 760 }}>
              {batchGroups.map((group) => {
                const canExpand = group.children.length > 0;
                const expanded = Boolean(expandedBatchIds[group.batchId]);
                const extraCount = group.children.length;
                const primary = group.primary;

                return (
                  <Accordion
                    key={group.batchId}
                    disableGutters
                    elevation={0}
                    expanded={canExpand ? expanded : false}
                    onChange={(_event, isExpanded) => {
                      if (!canExpand) return;
                      setExpandedBatchIds((prev) => ({
                        ...prev,
                        [group.batchId]: isExpanded,
                      }));
                    }}
                    sx={{
                      border: "1px solid rgba(148,163,184,0.22)",
                      borderRadius: "10px !important",
                      overflow: "hidden",
                      bgcolor: "#ffffff",
                      "&::before": { display: "none" },
                      "&.Mui-expanded": {
                        borderColor: "rgba(59,130,246,0.35)",
                        boxShadow: "0 0 0 1px rgba(59,130,246,0.08)",
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        canExpand ? (
                          <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                        ) : (
                          <Box sx={{ width: 24 }} />
                        )
                      }
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        minHeight: 56,
                        bgcolor: expanded ? "rgba(241,245,249,0.9)" : "#f8fafc",
                        "& .MuiAccordionSummary-content": {
                          my: 1,
                          mr: 1,
                          overflow: "hidden",
                        },
                        cursor: canExpand ? "pointer" : "default",
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "minmax(160px, 1.1fr) minmax(110px, 0.9fr) minmax(180px, 1.4fr) minmax(140px, 1fr) minmax(150px, 1fr) 56px",
                          gap: 1.5,
                          alignItems: "center",
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                          <Link
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openEventDetails(primary);
                            }}
                            underline="hover"
                            sx={{
                              color: "primary.main",
                              fontWeight: 700,
                              cursor: "pointer",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {group.batchId}
                          </Link>
                          {canExpand ? (
                            <Chip
                              size="small"
                              label={`+${extraCount}`}
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                bgcolor: expanded ? "#DBEAFE" : "#E2E8F0",
                                color: expanded ? "#1D4ED8" : "#475569",
                                borderRadius: 1,
                              }}
                            />
                          ) : null}
                        </Stack>

                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            color: "text.primary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={primary.subDeptName}
                        >
                          {primary.subDeptName}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: "text.secondary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={primary.assetId}
                        >
                          {primary.assetId}
                        </Typography>

                        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                          {primary.createdOn ? new Date(primary.createdOn).toLocaleString() : "—"}
                        </Typography>

                        <Box>
                          <Chip
                            label={primary.statusLabel}
                            size="small"
                            sx={statusChipSx(primary.statusLabel)}
                          />
                        </Box>

                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip title="View Details" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => openEventDetails(primary)}
                              sx={tableCell.editButton}
                            >
                              <VisibilityOutlinedIcon sx={tableCell.editIcon} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </AccordionSummary>

                    {canExpand ? (
                      <AccordionDetails
                        sx={{
                          px: 1.5,
                          pt: 0,
                          pb: 1.5,
                          bgcolor: "#ffffff",
                          borderTop: "1px solid rgba(148,163,184,0.18)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "text.secondary",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            mb: 1,
                            mt: 1.25,
                          }}
                        >
                          Other transactions · {group.batchId}
                        </Typography>

                        <TableContainer
                          sx={{
                            borderRadius: 1.5,
                            border: "1px solid rgba(148,163,184,0.2)",
                            overflow: "hidden",
                          }}
                        >
                          <Table size="small">
                            {eventTableHeader}
                            <TableBody>
                              {group.children.map((child, childIndex) => (
                                <TableRow
                                  key={child.key}
                                  hover
                                  sx={{
                                    bgcolor:
                                      childIndex % 2 === 1
                                        ? "rgba(248,250,252,0.9)"
                                        : "transparent",
                                  }}
                                >
                                  {renderEventCells(child)}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    ) : null}
                  </Accordion>
                );
              })}
            </Stack>
          )}
        </Box>
      </AdminListShell>
    </Card>
  );
}
