import { useState, useMemo } from "react";
import { alpha, Paper } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

import { STRINGS } from "../../../app/config/strings";
import fonts from "../../../app/theme/fonts";
import { getListLayoutTheme } from "../../../app/theme/custom_themes/shared/listLayout_theme";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../app/theme/custom_themes/shared/data_table_theme";
import ListLayout from "./ListLayout";
import BatchTable from "./BatchTable";
import ListPagination from "./ListPagination";

// ─── Animation ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Helper: dot-notation field accessor ─────────────────────────────────────
// e.g. getVal(row, "assignedTo.fullName") → row.assignedTo.fullName
const getVal = (obj, key) => key.split(".").reduce((acc, k) => acc?.[k], obj);

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

  return [label, camel, pascal, snake, snake.replace(/_/g, ""), label.toLowerCase()].filter(
    Boolean,
  );
};

// ─── BatchList ────────────────────────────────────────────────────────────────
const BatchList = ({
  rows = [],
  columns = [],
  statusField = "status",
  statusConfig,
  /** Optional override for top status filter tabs (defaults to statusConfig keys). */
  statusTabs: statusTabsOverride,
  filters = [],
  searchFields,
  highlightRow,
  highlightColor,
  renderAction,
  rowsPerPageOptions = [5, 10, 25],
  emptyText = STRINGS.USER_BATCH_LIST.NO_RECORDS,
  tableLabel = STRINGS.USER_BATCH_LIST.DEFAULT_LABEL,
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
  loadingMessage,
  statusToolbarEnd,
  searchBarEnd,
  filterExtension,
}: any) => {
  const [localSearch, setLocalSearch] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState(STRINGS.USER_BATCH_LIST.FILTER_ALL);
  const [localFilterState, setLocalFilterState] = useState(() =>
    Object.fromEntries(filters.map((f: any) => [f.field, STRINGS.USER_BATCH_LIST.FILTER_ALL])),
  );
  const [localPage, setLocalPage] = useState(0);
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

  const thSx = useMemo(
    () => ({
      ...uniformTableHeaderCellSx(p.primary ?? "#1B4F72", p.primaryLight ?? "#2E86C1", {
        headerFontSize: fonts.size.xs,
        headerLetterSpacing: "0.08em",
        headerPaddingY: "11px",
        headerPaddingX: "14px",
      }),
      ...(t.tableHeaderBg ? { background: t.tableHeaderBg } : {}),
      ...(t.tableHeaderText ? { color: t.tableHeaderText } : {}),
      // Keep uniform cell borders from data_table_theme; only override when a real color is set.
      ...(t.tableHeaderBorder && t.tableHeaderBorder !== "transparent"
        ? { borderBottom: `2px solid ${t.tableHeaderBorder}` }
        : {}),
    }),
    [t, p],
  );

  const tdSx = useMemo(
    () =>
      uniformTableBodyCellSx(
        { border: p.border || "#D5D8DC", text: p.text || "#000" },
        {
          bodyFontSize: fonts.size.sm,
          bodyPaddingY: "10px",
          bodyPaddingX: "14px",
        },
      ),
    [p],
  );

  const listShellTheme = useMemo(
    () =>
      getListLayoutTheme(
        {
          primary: p.primary,
          primaryLight: p.primaryLight,
          border: p.border,
          text: p.text,
          textSub: p.textSub,
          surface: p.surface,
        },
        { filterInputBg: t.filterInputBg },
        { fadeAnimation: `${fadeUp} 0.3s ease` },
      ),
    [p, t],
  );

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
        if (
          localFilterState[field] !== STRINGS.USER_BATCH_LIST.FILTER_ALL &&
          getVal(row, field) !== localFilterState[field]
        )
          return false;
      }
      return true;
    });
  }, [
    isControlled,
    rows,
    activeSearch,
    activeStatusFilter,
    localFilterState,
    statusField,
    statusConfig,
    filters,
    searchFields,
  ]);

  const paginated = isControlled
    ? rows
    : filtered.slice(
        activePage * activeRowsPerPage,
        activePage * activeRowsPerPage + activeRowsPerPage,
      );
  const displayTotal = totalRecords ?? filtered.length;
  const statusTabs = statusTabsOverride?.length
    ? statusTabsOverride
    : statusConfig
      ? [STRINGS.USER_BATCH_LIST.FILTER_ALL, ...Object.keys(statusConfig)]
      : [];
  const statusCounts = useMemo(() => {
    if (!statusConfig) {
      return {};
    }

    const tabKeys = statusTabs.filter((tab) => tab !== STRINGS.USER_BATCH_LIST.FILTER_ALL);

    if (serverStatusCounts && typeof serverStatusCounts === "object") {
      const resolveCount = (statusLabel: string): number => {
        // Prefer already-mapped UI labels from mapSubdepartmentBatchStatusCounts.
        const direct = (serverStatusCounts as Record<string, unknown>)[statusLabel];
        if (typeof direct === "number") return direct;

        const count = toStatusKeyVariants(statusLabel).reduce<number | undefined>((found, key) => {
          if (found !== undefined) return found;
          const value = (serverStatusCounts as Record<string, unknown>)[key];
          return typeof value === "number" ? value : undefined;
        }, undefined);
        return Number(count ?? 0);
      };

      const resolvedByUiStatus = tabKeys.reduce(
        (accumulator, statusLabel) => {
          accumulator[statusLabel] = resolveCount(statusLabel);
          return accumulator;
        },
        {} as Record<string, number>,
      );

      const allDirect = (serverStatusCounts as Record<string, unknown>)[
        STRINGS.USER_BATCH_LIST.FILTER_ALL
      ];
      const allFromTabs = Object.values(resolvedByUiStatus).reduce(
        (sum: number, value: number) => sum + value,
        0,
      );

      return {
        ...resolvedByUiStatus,
        [STRINGS.USER_BATCH_LIST.FILTER_ALL]:
          typeof allDirect === "number" && allDirect > 0 ? allDirect : allFromTabs,
      };
    }

    const nextCounts = tabKeys.reduce(
      (accumulator, key) => {
        accumulator[key] = rows.filter((row: any) => getVal(row, statusField) === key).length;
        return accumulator;
      },
      {} as Record<string, number>,
    );

    nextCounts[STRINGS.USER_BATCH_LIST.FILTER_ALL] = Object.values(nextCounts).reduce(
      (sum: number, value: number) => sum + value,
      0,
    );

    return nextCounts;
  }, [rows, serverStatusCounts, statusConfig, statusField, statusTabs]);
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
    else {
      setLocalSearch(e.target.value);
      setLocalPage(0);
    }
  };
  const handleStatusToggle = (val: string) => {
    if (onStatusFilterChange) onStatusFilterChange(val);
    else {
      setLocalStatusFilter(val);
      setLocalPage(0);
    }
  };
  const handleDropdownChange = (field: string) => (e: any) => {
    setLocalFilterState((prev) => ({ ...prev, [field]: e.target.value }));
    setLocalPage(0);
  };

  return (
    <ListLayout
      activeStatus={activeStatusFilter}
      emptyIcon={LayersRoundedIcon}
      emptySubtitle={STRINGS.USER_BATCH_LIST.EMPTY_SUBTITLE}
      emptyTitle={emptyText}
      filterFields={shellFilterFields}
      filterValues={localFilterState}
      // Keep table chrome visible when empty; empty message is rendered in TableBody.
      // While first-loading with no rows, shell shows the spinner instead.
      hasItems={isLoading ? filtered.length > 0 : true}
      loading={isLoading}
      loadingMessage={loadingMessage}
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
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: p.surface,
          border: `1.5px solid ${p.border}`,
          boxShadow: `0 2px 16px ${alpha(p.primary || "#000", 0.07)}`,
        }}
      >
        <BatchTable
          rows={paginated}
          columns={columns}
          startIndex={activePage * activeRowsPerPage}
          isLoading={isLoading}
          tableLabel={tableLabel}
          emptyText={emptyText}
          headerCellSx={thSx}
          bodyCellSx={tdSx}
          emptySx={{
            wrap: listShellTheme.sections.emptyWrap,
            icon: listShellTheme.empty.icon,
            title: listShellTheme.empty.title,
            subtitle: listShellTheme.empty.subtitle,
          }}
          stripedRowEven={t.stripedRowEven}
          stripedRowOdd={t.stripedRowOdd}
          hoverColor={p.primaryLight || "#000"}
          textSub={p.textSub}
          highlightRow={highlightRow}
          highlightColor={hlColor}
          renderAction={renderAction}
        />

        <ListPagination
          count={displayTotal}
          page={activePage}
          rowsPerPage={activeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={(nextPage) => (onPageChange ? onPageChange(nextPage) : setLocalPage(nextPage))}
          onRowsPerPageChange={(newRows) => {
            if (onRowsPerPageChange) onRowsPerPageChange(newRows);
            else {
              setLocalRowsPerPage(newRows);
              setLocalPage(0);
            }
          }}
          palette={p}
        />
      </Paper>
    </ListLayout>
  );
};

export default BatchList;
