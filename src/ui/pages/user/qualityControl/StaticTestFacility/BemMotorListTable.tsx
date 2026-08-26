import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Stack,
  CircularProgress,
  alpha,
} from "@mui/material";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

import fonts from "@/app/theme/fonts";
import { STRINGS } from "@/app/config/strings";
import { useThemeStore } from "@/app/store/themeStore";
import getQualityControlTheme from "@/app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getBatchListShellTheme } from "@/app/theme/custom_themes/shared/batchListShell_theme";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "@/app/theme/custom_themes/shared/data_table_theme";
import {
  getOperationStatusConfig,
  getOperationStatusFilterLabel,
  OPERATION_STATUS,
} from "@/hooks/operationStatus";
import BatchListShell, {
  BatchListShellFilterField,
  BatchListShellStatusMeta,
} from "@/ui/components/custom/BatchListShell";
import UserWorkflowStatusCell from "@/ui/components/custom/UserWorkflowStatusCell";
import { icons } from "@/app/theme/icons";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.qualityControl.staticTestFacility.list;

const BEM_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

export type ColumnConfig<T = any> = {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: number | string;
  cellSx?: object;
  render?: (row: T, index: number) => React.ReactNode;
};

export type BemMotorListTableProps = {
  rows?: any[];
  totalRecords?: number;
  page?: number;
  rowsPerPage?: number;
  search?: string;
  activeStatus?: string;
  statusTabs?: string[];
  statusMeta?: BatchListShellStatusMeta;
  statusConfig?: Record<string, any>;
  statusCounts?: Record<string, number>;
  filterFields?: BatchListShellFilterField[];
  filterValues?: Record<string, string>;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onSearchChange?: (search: string) => void;
  onStatusChange?: (status: string) => void;
  onFilterChange?: (field: string, value: string) => void;
  renderAction?: (row: any) => React.ReactNode;
  /** Rendered on the right of the status filter tab row (same as Rocket Motor create). */
  statusToolbarEnd?: React.ReactNode;
  customColumns?: ColumnConfig[];
};

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

const BemMotorListTable: React.FC<BemMotorListTableProps> = ({
  rows = [],
  totalRecords = 0,
  page = 0,
  rowsPerPage = 10,
  search = "",
  activeStatus: externalActiveStatus,
  statusTabs: statusTabsOverride,
  statusMeta: statusMetaOverride,
  statusConfig: statusConfigOverride,
  statusCounts = {},
  filterFields = [],
  filterValues = {},
  loading = false,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onStatusChange,
  onFilterChange,
  renderAction,
  statusToolbarEnd,
  customColumns,
}) => {
  const mode = useThemeStore((state) => state.mode) ?? "light";
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const t = theme.batchList;
  const p = theme.palette;

  const [internalActiveStatus, setInternalActiveStatus] = useState<string>(FILTER_ALL);
  const currentStatus = externalActiveStatus ?? internalActiveStatus;

  const statusConfig = useMemo(() => {
    if (statusConfigOverride) return statusConfigOverride;
    return Object.fromEntries(
      Object.entries(BEM_STATUS_CONFIG).map(([status, config]) => [
        status,
        {
          ...config,
          ...(t.statusConfig?.[status] ?? {}),
          label: getOperationStatusFilterLabel(status, { isSourcingLotSubdepartment: false }),
        },
      ]),
    );
  }, [statusConfigOverride, t.statusConfig]);

  const statusTabs = useMemo(
    () => (statusTabsOverride?.length ? statusTabsOverride : [FILTER_ALL]),
    [statusTabsOverride],
  );

  const resolvedStatusMeta = useMemo(() => {
    if (statusMetaOverride) return statusMetaOverride;
    return Object.fromEntries(
      Object.entries(statusConfig).map(([status, config]: [string, any]) => [
        status,
        {
          color: config.color,
          label: config.label ?? status,
        },
      ]),
    );
  }, [statusConfig, statusMetaOverride]);

  const listShellTheme = useMemo(
    () =>
      getBatchListShellTheme(
        {
          primary: p.primary,
          primaryLight: p.primaryLight,
          border: p.border,
          text: p.text,
          textSub: p.textSub,
          surface: p.surface,
        },
        { filterInputBg: t.filterInputBg },
      ),
    [p, t],
  );

  const handleStatusTabClick = (newStatus: string) => {
    setInternalActiveStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const thSx = useMemo(
    () => ({
      ...uniformTableHeaderCellSx(p?.primary ?? "#1B4F72", p?.primaryLight ?? p?.primary ?? "#2E86C1", {
        headerFontSize: fonts.size.xs,
        headerLetterSpacing: "0.08em",
        headerPaddingY: "11px",
        headerPaddingX: "14px",
      }),
      ...(t?.tableHeaderBg ? { background: t.tableHeaderBg } : {}),
      ...(t?.tableHeaderText ? { color: t.tableHeaderText } : {}),
      ...(t?.tableHeaderBorder
        ? { borderBottom: `2px solid ${t.tableHeaderBorder}` }
        : { borderBottom: "none" }),
    }),
    [t, p],
  );

  const tdSx = useMemo(
    () =>
      uniformTableBodyCellSx(
        { border: p?.border || "#D5D8DC", text: p?.text || "#000" },
        {
          bodyFontSize: fonts.size.sm,
          bodyPaddingY: "10px",
          bodyPaddingX: "14px",
        },
      ),
    [p],
  );

  const resultText = `${STRINGS.USER_BATCH_LIST.SHOWING} ${Math.min(
    rowsPerPage,
    Math.max(0, totalRecords - page * rowsPerPage),
  )} ${STRINGS.USER_BATCH_LIST.OF} ${totalRecords} ${STRINGS.USER_BATCH_LIST.RECORDS}${
    currentStatus !== FILTER_ALL
      ? ` · ${resolvedStatusMeta[currentStatus]?.label ?? currentStatus}`
      : ""
  }`;

  const columns: ColumnConfig[] = useMemo(
    () =>
      customColumns ?? [
        {
          id: "motorId",
          label: "Other BEM Motor ID",
          cellSx: {
            fontWeight: fonts.weight.bold,
            fontSize: t?.batchIdText?.fontSize ?? "0.84rem",
          },
          render: (row) => row.motorId ?? "—",
        },
        {
          id: "subType",
          label: "Sub Type",
          render: (row) => row.subType ?? "—",
        },
        {
          id: "stfTestNo",
          label: "STF Test No.",
          render: (row) => row.stfTestNo ?? "—",
        },
        {
          id: "createdBy",
          label: "Created By",
          render: (row) => row.createdBy ?? "—",
        },
        {
          id: "status",
          label: STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY.COL_STATUS,
          render: (row) => (
            <UserWorkflowStatusCell
              status={String(row?.status ?? "")}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={row?.rejectionReason}
              theme={theme}
            />
          ),
        },
        {
          id: "actions",
          label: STRINGS.USER_BATCH_LIST.COL_ACTION,
          align: "center",
          render: (row) => (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
              {renderAction?.(row)}
            </Stack>
          ),
        },
      ],
    [customColumns, renderAction, statusConfig, t, theme],
  );

  return (
    <BatchListShell
      activeStatus={currentStatus}
      statusTabs={statusTabs}
      statusMeta={resolvedStatusMeta}
      statusCounts={statusCounts}
      onStatusChange={handleStatusTabClick}
      searchValue={search}
      onSearchChange={(val) => onSearchChange?.(val)}
      searchPlaceholder={STRINGS.USER_BATCH_LIST.SEARCH_PLACEHOLDER}
      filterFields={filterFields}
      filterValues={filterValues}
      onFilterChange={onFilterChange}
      resultIcon={LayersRoundedIcon}
      resultText={resultText}
      emptyIcon={InboxRoundedIcon}
      emptyTitle="No BEM motors found"
      emptySubtitle={STRINGS.USER_BATCH_LIST.EMPTY_SUBTITLE}
      hasItems={rows.length > 0}
      loading={loading}
      statusToolbarEnd={statusToolbarEnd}
      theme={listShellTheme}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: p?.surface || "#fff",
          border: `1.5px solid ${p?.border || "#E0E0E0"}`,
          boxShadow: `0 2px 16px ${alpha(p?.primary || "#000", 0.07)}`,
        }}
      >
        <TableContainer sx={{ minHeight: 300, position: "relative" }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: alpha(p?.surface || "#FFF", 0.7),
                zIndex: 2,
              }}
            >
              <CircularProgress size={36} />
            </Box>
          )}

          <Table stickyHeader aria-label="BEM Motor List Table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...thSx, width: 40, textAlign: "center" }}>
                  {STRINGS.USER_BATCH_LIST.COL_HASH}
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align ?? "left"}
                    sx={{ ...thSx, width: col.width }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.id || row.motorId || idx}
                  sx={{
                    background:
                      idx % 2 === 0
                        ? t?.stripedRowEven || "inherit"
                        : t?.stripedRowOdd || alpha(p?.primary || "#000", 0.015),
                    "&:hover": {
                      background: alpha(p?.primaryLight || p?.primary || "#000", 0.04),
                    },
                    "&:last-child td": { borderBottom: "none" },
                    transition: "background 0.15s",
                  }}
                >
                  <TableCell sx={{ ...tdSx, textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: fonts?.size?.xs,
                        fontWeight: fonts?.weight?.bold,
                        color: p?.textSub,
                      }}
                    >
                      {page * rowsPerPage + idx + 1}
                    </Typography>
                  </TableCell>

                  {columns.map((col) => {
                    const rawValue = row[col.id];

                    return (
                      <TableCell
                        key={col.id}
                        align={col.align ?? "left"}
                        sx={{ ...tdSx, ...(col.cellSx ?? {}) }}
                      >
                        {col.render ? col.render(row, idx) : (rawValue ?? "—")}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            borderTop: `1px solid ${alpha(p?.border || "#000", 0.6)}`,
            background: alpha(p?.surface || "#fff", 0.4),
          }}
        >
          <TablePagination
            component="div"
            count={totalRecords}
            page={page}
            onPageChange={(_, newPage) => onPageChange?.(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              color: p?.text,
              "& .MuiTablePagination-toolbar": { fontSize: fonts?.size?.xs },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: fonts?.size?.xs,
                color: p?.textSub,
              },
              "& .MuiTablePagination-select": { fontSize: fonts?.size?.xs },
              "& .MuiTablePagination-selectIcon": { color: p?.textSub },
            }}
          />
        </Box>
      </Paper>
    </BatchListShell>
  );
};

export default BemMotorListTable;
