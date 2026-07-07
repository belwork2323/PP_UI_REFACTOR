// src/ui/components/custom/UserBatchList.jsx
//
// ─── Generic reusable table list ─────────────────────────────────────────────
//
// Props
// ─────
//   rows                {object[]}     Data rows. Each row must have a unique `id`.
//
//   columns             {ColumnDef[]}  Column definitions:
//     {
//       key      : string                     – field name (dot-notation supported: "a.b.c")
//       label    : string                     – header text
//       align?   : "left"|"center"|"right"    – default "left"
//       width?   : number | string            – CSS width
//       render?  : (value, row) => ReactNode  – custom cell renderer
//     }
//
//   statusField?        string         Field that carries the status value.
//                                      Default: "status"
//
//   statusConfig?       {[statusValue]: StatusCfg}
//     StatusCfg = { color, bg, border, Icon, label }
//     Renders a clickable status-filter strip above the table.
//     Also adds a status dropdown beside the search bar.
//
//   filters?            {FilterDef[]}  Extra dropdown filters:
//     {
//       field     : string
//       label?    : string
//       options   : string[]   – selectable values (excl. "All")
//       minWidth? : number     – dropdown width in px
//     }
//
//   searchFields?       string[]       Fields to search. Omit to search all fields.
//
//   highlightRow?       (row) => boolean   Adds a left-border accent when true.
//   highlightColor?     string             Border colour. Default: primary blue.
//
//   renderAction?       (row) => ReactNode  Renders the Action column cell.
//                                           Column is hidden when not provided.
//
//   rowsPerPageOptions? number[]       Default [5, 10, 25]
//   emptyText?          string         Message when no rows match filters.
//   tableLabel?         string         Accessible aria-label for the <table>.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from "react";
import {
  Box, Typography, alpha,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import LayersRoundedIcon            from "@mui/icons-material/LayersRounded";

import { STRINGS } from "../../../app/config/strings";
import fonts from "../../../app/theme/fonts";
import BatchListShell from "./BatchListShell";

// ─── Animation ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Helper: dot-notation field accessor ─────────────────────────────────────
// e.g. getVal(row, "assignedTo.fullName") → row.assignedTo.fullName
const getVal = (obj, key) =>
  key.split(".").reduce((acc, k) => acc?.[k], obj);

const getFilterLabel = (field: string, label?: string) => {
  if (label) {
    return label;
  }

  const lastSegment = field.split(".").pop() ?? field;

  return lastSegment
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const toStatusKeyVariants = (label: string) => {
  const compact = label.replace(/\s+/g, "");
  const pascal = compact.replace(/[^a-zA-Z0-9]/g, "");
  const camel = pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : "";
  const snake = label
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

  return [
    label,
    camel,
    pascal,
    snake,
    snake.replace(/_/g, ""),
    label.toLowerCase(),
  ].filter(Boolean);
};

// ─── UserBatchList ────────────────────────────────────────────────────────────
const UserBatchList = ({
  rows               = [],
  columns            = [],
  statusField        = "status",
  statusConfig,
  filters            = [],
  searchFields,
  highlightRow,
  highlightColor,
  renderAction,
  rowsPerPageOptions = [5, 10, 25],
  emptyText          = STRINGS.USER_BATCH_LIST.NO_RECORDS,
  tableLabel         = STRINGS.USER_BATCH_LIST.DEFAULT_LABEL,
  themeTokens,
  
  // Controlled Server-Side properties (Bypasses internal filter/pagination when present)
  totalRecords,
  page,
  rowsPerPage,
  search,
  statusFilter,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onStatusFilterChange,
  statusCounts: serverStatusCounts,
  isLoading = false,
  statusToolbarEnd,
  searchBarEnd,
  filterExtension,
}: any) => {
  const [localSearch,       setLocalSearch]       = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState(STRINGS.USER_BATCH_LIST.FILTER_ALL);
  const [localFilterState,  setLocalFilterState]  = useState(
    () => Object.fromEntries(filters.map((f: any) => [f.field, STRINGS.USER_BATCH_LIST.FILTER_ALL])),
  );
  const [localPage,        setLocalPage]        = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPageOptions[0]);

  const activeSearch = search ?? localSearch;
  const activeStatusFilter = statusFilter ?? localStatusFilter;
  const activePage = page ?? localPage;
  const activeRowsPerPage = rowsPerPage ?? localRowsPerPage;

  const isControlled = page !== undefined; // Fallback detector. When true, skip internal filtering

  // Retrieve explicit values decoupled from global hook inference
  const t = themeTokens?.batchList || {};
  const p = themeTokens?.palette || {};

  const hlColor = highlightColor || p.primary;

  const thSx = useMemo(() => ({
    background: t.tableHeaderBg || p.primary,
    color: t.tableHeaderText || "#fff",
    fontWeight: fonts.weight.bold,
    fontSize: fonts.size.xs,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "11px 14px",
    whiteSpace: "nowrap",
    borderBottom: `2px solid ${t.tableHeaderBorder || "transparent"}`,
  }), [t, p]);

  const tdSx = useMemo(() => ({
    padding: "10px 14px",
    fontSize: fonts.size.sm,
    borderBottom: `1px solid ${alpha(p.border || "#000", 0.6)}`,
    color: p.text || "#000",
    verticalAlign: "middle",
  }), [p]);

  const listShellTheme = useMemo(() => ({
    sections: {
      root: { animation: `${fadeUp} 0.3s ease` },
      statusStack: {
        direction: "row" as const,
        gap: 1.5,
        flexWrap: "wrap" as const,
        mb: 2,
        p: { xs: 0.5, md: 1 },
      },
      filterContainer: {
        mb: 2,
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        background: t.filterInputBg || "#ffffff",
        border: `1px solid ${p.border}`,
        boxShadow: `0 1px 6px ${alpha(p.primary || "#000", 0.05)}`,
      },
      filterStack: {
        direction: { xs: "column", sm: "row" } as const,
        gap: 1.5,
        alignItems: { sm: "center" } as const,
        flexWrap: "wrap" as const,
      },
      resultsWrap: {
        ml: "auto",
        display: "flex",
        alignItems: "center",
        gap: 0.75,
      },
      loadingWrap: {
        display: "flex",
        justifyContent: "center",
        py: 4,
      },
      listWrap: {},
      emptyWrap: {
        textAlign: "center",
        py: 8,
        borderRadius: 3,
        border: `1.5px dashed ${alpha(p.primaryLight || "#000", 0.3)}`,
        background: alpha(p.surface || "#fff", 0.5),
      },
    },
    statusTab: {
      button: (isActive: boolean, meta?: { color?: string }) => ({
        borderRadius: 2,
        fontSize: "0.72rem",
        fontWeight: 700,
        px: 2,
        py: "7px",
        textTransform: "none",
        whiteSpace: "nowrap",
        ...(isActive
          ? {
              background: meta?.color ?? p.primary,
              border: "none",
              boxShadow: `0 2px 8px ${alpha(meta?.color ?? p.primary ?? "#000", 0.3)}`,
              color: "#ffffff",
            }
          : {
              borderColor: meta?.color ? alpha(meta.color, 0.35) : p.border,
              color: meta?.color ?? p.textSub,
              "&:hover": {
                background: meta?.color ? alpha(meta.color, 0.06) : alpha(p.primary || "#000", 0.05),
                borderColor: meta?.color ?? p.primary,
              },
            }),
      }),
      countChip: (isActive: boolean, meta?: { color?: string }) => ({
        height: 17,
        minWidth: 22,
        fontSize: "0.6rem",
        fontWeight: 800,
        background: isActive ? alpha("#ffffff", 0.25) : alpha(meta?.color ?? p.primary ?? "#000", 0.1),
        color: isActive ? "#ffffff" : meta?.color ?? p.primary,
        border: "none",
      }),
    },
    inputs: {
      search: {
        flex: 1,
        minWidth: 260,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          background: t.filterInputBg || "#fff",
          color: p.text,
          fontSize: fonts.size.sm,
          boxShadow: `0 1px 6px ${alpha(p.primary || "#000", 0.05)}`,
          "& .MuiOutlinedInput-input": {
            padding: "10px 14px",
          },
          "& fieldset": { borderColor: p.border },
          "&:hover fieldset": { borderColor: p.primaryLight },
          "&.Mui-focused fieldset": { borderColor: p.primaryLight },
        },
        "& .MuiInputBase-input": {
          color: p.text,
        },
      },
      filter: {
        minWidth: 150,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          background: t.filterInputBg || "#fff",
          color: p.text,
          fontSize: fonts.size.sm,
          "& fieldset": { borderColor: p.border },
          "&:hover fieldset": { borderColor: p.primaryLight },
          "&.Mui-focused fieldset": { borderColor: p.primaryLight },
        },
        "& .MuiInputLabel-root": {
          fontSize: "0.8rem",
          color: p.textSub,
        },
        "& .MuiSelect-icon": {
          color: p.textSub,
        },
      },
      startIcon: {
        search: { fontSize: 17, color: p.textSub },
        filter: { fontSize: 15, color: p.textSub },
      },
      menuItem: {
        fontSize: fonts.size.sm,
        color: p.text,
      },
    },
    results: {
      icon: { fontSize: 14, color: alpha(p.primary || "#000", 0.55) },
      text: {
        fontSize: fonts.size.xs,
        color: p.textSub,
        fontWeight: fonts.weight.semibold,
      },
    },
    loading: {
      spinner: { color: p.primary },
    },
    empty: {
      icon: { fontSize: 40, color: alpha(p.primaryLight || "#000", 0.25), mb: 1.5 },
      title: { fontWeight: fonts.weight.bold, color: p.textSub },
      subtitle: { fontSize: fonts.size.sm, color: alpha(p.textSub || "#000", 0.7), mt: 0.5 },
    },
  }), [p, t]);


  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (isControlled) return rows; // Data is already prepared logically by parent
    
    const q = activeSearch.trim().toLowerCase();
    return rows.filter((row: any) => {
      if (q) {
        const targets = searchFields
          ? searchFields.map((f: any) => String(getVal(row, f) ?? "").toLowerCase())
          : Object.values(row).map((v) => String(v ?? "").toLowerCase());
        if (!targets.some((t) => t.includes(q))) return false;
      }
      if (statusConfig && activeStatusFilter !== STRINGS.USER_BATCH_LIST.FILTER_ALL) {
        if (getVal(row, statusField) !== activeStatusFilter) return false;
      }
      for (const { field } of filters) {
        if (localFilterState[field] !== STRINGS.USER_BATCH_LIST.FILTER_ALL && getVal(row, field) !== localFilterState[field])
          return false;
      }
      return true;
    });
  }, [isControlled, rows, activeSearch, activeStatusFilter, localFilterState, statusField, statusConfig, filters, searchFields]);

  const paginated = isControlled ? rows : filtered.slice(activePage * activeRowsPerPage, activePage * activeRowsPerPage + activeRowsPerPage);
  const displayTotal = totalRecords ?? filtered.length;
  const statusTabs = statusConfig ? [STRINGS.USER_BATCH_LIST.FILTER_ALL, ...Object.keys(statusConfig)] : [];
  const statusCounts = useMemo(() => {
    if (!statusConfig) {
      return {};
    }

    if (serverStatusCounts && typeof serverStatusCounts === "object") {
      const resolvedByUiStatus = Object.keys(statusConfig).reduce((accumulator, statusLabel) => {
        const count = toStatusKeyVariants(statusLabel).reduce<number | undefined>((found, key) => {
          if (found !== undefined) {
            return found;
          }

          const value = (serverStatusCounts as Record<string, unknown>)[key];
          if (typeof value === "number") {
            return value;
          }

          return undefined;
        }, undefined);

        accumulator[statusLabel] = Number(count ?? 0);
        return accumulator;
      }, {} as Record<string, number>);

      return {
        ...resolvedByUiStatus,
        [STRINGS.USER_BATCH_LIST.FILTER_ALL]:
          Number(
            (serverStatusCounts as Record<string, unknown>)[STRINGS.USER_BATCH_LIST.FILTER_ALL] ??
              Object.values(resolvedByUiStatus).reduce((sum, value) => sum + value, 0) ??
              totalRecords,
          ),
      };
    }

    const nextCounts = Object.keys(statusConfig).reduce((accumulator, key) => {
      accumulator[key] = rows.filter((row: any) => getVal(row, statusField) === key).length;
      return accumulator;
    }, {} as Record<string, number>);

    nextCounts[STRINGS.USER_BATCH_LIST.FILTER_ALL] = rows.length;

    return nextCounts;
  }, [rows, serverStatusCounts, statusConfig, statusField, totalRecords]);
  const statusMeta = useMemo(() => {
    if (!statusConfig) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(statusConfig).map(([status, config]: [string, any]) => [
        status,
        {
          color: config.color,
          label: config.label ?? status,
        },
      ]),
    );
  }, [statusConfig]);
  const shellFilterFields = filters.map((filter: any) => ({
    field: filter.field,
    label: getFilterLabel(filter.field, filter.label),
    minWidth: filter.minWidth,
    options: [STRINGS.USER_BATCH_LIST.FILTER_ALL, ...filter.options],
  }));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = (e: any) => { 
    if (onSearchChange) onSearchChange(e.target.value);
    else { setLocalSearch(e.target.value); setLocalPage(0); }
  };
  const handleStatusToggle = (val: string) => { 
    if (onStatusFilterChange) onStatusFilterChange(val);
    else { setLocalStatusFilter(val); setLocalPage(0); }
  };
  const handleDropdownChange = (field: string) => (e: any) => {
    setLocalFilterState((prev) => ({ ...prev, [field]: e.target.value }));
    setLocalPage(0);
  };

  const showActionCol = Boolean(renderAction);

  return (
    <BatchListShell
      activeStatus={activeStatusFilter}
      emptyIcon={LayersRoundedIcon}
      emptySubtitle={STRINGS.USER_BATCH_LIST.EMPTY_SUBTITLE}
      emptyTitle={emptyText}
      filterFields={shellFilterFields}
      filterValues={localFilterState}
      hasItems={filtered.length > 0}
      loading={isLoading}
      onFilterChange={(field, value) => {
        handleDropdownChange(field)({ target: { value } });
      }}
      onSearchChange={(value) => handleSearch({ target: { value } })}
      onStatusChange={statusConfig ? handleStatusToggle : undefined}
      resultIcon={LayersRoundedIcon}
      resultText={`${STRINGS.USER_BATCH_LIST.SHOWING} ${Math.min(activeRowsPerPage, Math.max(0, displayTotal - activePage * activeRowsPerPage))} ${STRINGS.USER_BATCH_LIST.OF} ${displayTotal} ${STRINGS.USER_BATCH_LIST.RECORDS}${activeStatusFilter !== STRINGS.USER_BATCH_LIST.FILTER_ALL ? ` · ${statusConfig?.[activeStatusFilter]?.label ?? activeStatusFilter}` : ""}`}
      searchPlaceholder={STRINGS.USER_BATCH_LIST.SEARCH_PLACEHOLDER}
      searchValue={activeSearch}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      statusCounts={statusCounts}
      statusMeta={statusMeta}
      statusTabs={statusTabs}
      statusToolbarEnd={statusToolbarEnd}
      theme={listShellTheme}
    >
      <Paper elevation={0} sx={{
          borderRadius: 3, overflow: "hidden", background: p.surface,
          border: `1.5px solid ${p.border}`,
          boxShadow: `0 2px 16px ${alpha(p.primary || "#000", 0.07)}`,
        }}>
          <TableContainer>
            <Table aria-label={tableLabel}>

              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...thSx, width: 40, textAlign: "center" }}>{STRINGS.USER_BATCH_LIST.COL_HASH}</TableCell>
                  {columns.map((col: any) => (
                    <TableCell key={col.key} sx={{ ...thSx, textAlign: col.align ?? "left", width: col.width }}>
                      {col.label}
                    </TableCell>
                  ))}
                  {showActionCol && <TableCell sx={{ ...thSx, textAlign: "center" }}>{STRINGS.USER_BATCH_LIST.COL_ACTION}</TableCell>}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginated.map((row: any, idx: number) => {
                  const isHighlighted = highlightRow?.(row) ?? false;
                  const globalIdx     = activePage * activeRowsPerPage + idx + 1;

                  return (
                    <TableRow
                      key={row.id ?? idx}
                      sx={{
                        background: isHighlighted
                          ? alpha(hlColor, 0.02)
                          : idx % 2 === 0 ? t.stripedRowEven : t.stripedRowOdd,
                        borderLeft: isHighlighted
                          ? `3px solid ${hlColor}`
                          : "3px solid transparent",
                        "&:hover": { background: alpha(p.primaryLight || "#000", 0.04) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${fadeUp} 0.25s ease both`,
                        animationDelay: `${idx * 0.03}s`,
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Row number */}
                      <TableCell sx={{ ...tdSx, textAlign: "center" }}>
                        <Typography sx={{ fontSize: fonts.size.xs, fontWeight: fonts.weight.bold, color: p.textSub }}>
                          {globalIdx}
                        </Typography>
                      </TableCell>

                      {/* Data cells */}
                      {columns.map((col) => {
                        const rawValue = getVal(row, col.key);
                        return (
                          <TableCell key={col.key} sx={{ ...tdSx, textAlign: col.align ?? "left" }}>
                            {col.render
                              ? col.render(rawValue, row)
                              : (
                                <Typography sx={{ fontSize: fonts.size.sm }}>
                                  {rawValue ?? "—"}
                                </Typography>
                              )}
                          </TableCell>
                        );
                      })}

                      {/* Action cell */}
                      {showActionCol && (
                        <TableCell sx={{ ...tdSx, textAlign: "center" }}>
                          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                            {renderAction(row)}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{
            borderTop: `1px solid ${alpha(p.border || "#000", 0.6)}`,
            background: alpha(p.surface || "#fff", 0.4),
          }}>
            <TablePagination
              component="div"
              count={displayTotal}
              page={activePage}
              onPageChange={(_, p) => onPageChange ? onPageChange(p) : setLocalPage(p)}
              rowsPerPage={activeRowsPerPage}
              onRowsPerPageChange={(e) => { 
                const newRows = parseInt(e.target.value, 10);
                if (onRowsPerPageChange) onRowsPerPageChange(newRows);
                else { setLocalRowsPerPage(newRows); setLocalPage(0); }
              }}
              rowsPerPageOptions={rowsPerPageOptions}
              sx={{
                color: p.text,
                "& .MuiTablePagination-toolbar": { fontSize: fonts.size.xs },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: fonts.size.xs, color: p.textSub,
                },
                "& .MuiTablePagination-select": { fontSize: fonts.size.xs },
                "& .MuiTablePagination-selectIcon": { color: p.textSub },
              }}
            />
          </Box>
        </Paper>
    </BatchListShell>
  );
};

export default UserBatchList;