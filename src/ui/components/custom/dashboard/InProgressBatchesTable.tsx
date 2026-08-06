import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack as MuiStack,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";

import ProgressBar from "../../common/ProgressBar";
import TableCard from "../TableCard";
import SkeletonRow from "../../common/SkeletonRow";
import { useAuthStore } from "@app/store/authStore";
import ToggleTabs from "../../common/ToggleTabs";
import { batchStatusConfig, stageConfig, getSubDeptChipConfig } from "@/app/theme/roleConfig";
import { getStatus } from "@/utils/batchManagementUtils";
import { normalizeSubdepartmentBatchStatus } from "@/data/models/user/SubdepartmentBatchModel";
import AppButton from "../../common/Button";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

const BATCH_ID_COLOR = "#1565c0";

export type InProgressBatchRow = {
  id?: string;
  batchId: string;
  batchType?: string;
  motorId?: string;
  motorType?: string;
  projectName?: string;
  currentStage?: string;
  stageDept?: string;
  managerName?: string;
  managerId?: string;
  status?: string;
  createdOn?: string;
  completion?: number;
  color?: string;
};

type Props = {
  rows: InProgressBatchRow[];
  loading: boolean;
  theme: any;
  title: string;
  emptyText?: string;
  emptySubtitle?: string;
  meta?: React.ReactNode;
  filterPanel?: React.ReactNode;
  cardSx?: any;
  hideManagerColumns?: boolean;
  onViewDetails?: (row: InProgressBatchRow) => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  headerContent?: React.ReactNode;
};

const BATCH_COLUMNS = [
  { label: "Batch ID", sortKey: "batchId" },
  { label: "Type", sortKey: "batchType" },
  { label: "Motor ID", sortKey: "motorId" },
  { label: "Project Name", sortKey: "projectName" },
  { label: "Current Stage", sortKey: "currentStage" },
  { label: "Manager Name", sortKey: "managerName" },
  { label: "Manager ID", sortKey: "managerId" },
  { label: "Status", sortKey: "status" },
  { label: "Created Date", sortKey: "createdOn" },
  { label: "Progress", sortKey: "completion" },
];

export default function InProgressBatchesTable({
  rows,
  loading,
  theme,
  title,
  emptyText,
  emptySubtitle,
  meta,
  filterPanel,
  cardSx,
  hideManagerColumns = false,
  onViewDetails,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25],
  headerContent,
}: Props) {
  const role = useAuthStore((s) => s.user?.role ?? "");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [menuRow, setMenuRow] = useState<InProgressBatchRow | null>(null);

  const normalizedRole = String(role)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  const canViewDetails =
    (normalizedRole === "SYSTEM_MANAGER" || normalizedRole === "CENTRE_HEAD") &&
    Boolean(onViewDetails);

  // Compute active columns count dynamically for skeleton and empty state colSpan
  const activeColumns = BATCH_COLUMNS.filter(
    ({ sortKey }) => !hideManagerColumns || (sortKey !== "managerName" && sortKey !== "managerId"),
  );
  const totalColumnCount = activeColumns.length + (canViewDetails ? 1 : 0);

  const handleMenuClose = () => {
    setMenuRow(null);
  };

  const handleMenuViewDetails = (row: InProgressBatchRow) => {
    if (onViewDetails) {
      setMenuRow(row);
      onViewDetails(row);
    }
    handleMenuClose();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;

    return [...rows].sort((a: any, b: any) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === "createdOn") {
        const aT = aVal ? new Date(aVal).getTime() : 0;
        const bT = bVal ? new Date(bVal).getTime() : 0;
        return sortDir === "asc" ? aT - bT : bT - aT;
      }

      if (sortField === "completion") {
        const aN = typeof aVal === "number" ? aVal : Number(aVal) || 0;
        const bN = typeof bVal === "number" ? bVal : Number(bVal) || 0;
        return sortDir === "asc" ? aN - bN : bN - aN;
      }

      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [rows, sortField, sortDir]);

  const th = theme;
  const { typeChip } = th;
  const showPagination =
    typeof page === "number" &&
    typeof rowsPerPage === "number" &&
    typeof totalCount === "number" &&
    Boolean(onPageChange) &&
    Boolean(onRowsPerPageChange);

  return (
    <TableCard
      title={title}
      titleSx={th.table.sectionTitle.sx}
      cardSx={cardSx ?? th.card}
      meta={meta}
      filterPanel={filterPanel}
      tabs={headerContent}
      footer={
        showPagination ? (
          <>
            <Divider sx={th.table.divider ?? { borderColor: "divider" }} />
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={onPageChange}
              onRowsPerPageChange={onRowsPerPageChange}
              rowsPerPageOptions={rowsPerPageOptions}
              sx={th.table.pagination}
            />
          </>
        ) : null
      }
    >
      {/* 1. Header always renders regardless of data presence */}
      <TableHead>
        <TableRow sx={th.table.headerRow}>
          {activeColumns.map(({ label, sortKey }) => {
            const isActive = sortField === sortKey;
            const SortIcon = isActive
              ? sortDir === "asc"
                ? ArrowUpwardIcon
                : ArrowDownwardIcon
              : UnfoldMoreIcon;

            return (
              <TableCell key={label} sx={th.table.header} onClick={() => handleSort(sortKey)}>
                <MuiStack direction="row" alignItems="center" component="span">
                  {label}
                  <SortIcon sx={th.table.headerSortIcon(isActive)} />
                </MuiStack>
              </TableCell>
            );
          })}
          {canViewDetails && <TableCell sx={{ ...th.table.header, width: 48 }} />}
        </TableRow>
      </TableHead>

      {/* 2. Body handles Loading, Empty List, and Data Rows */}
      <TableBody>
        {loading ? (
          <>
            <SkeletonRow columns={totalColumnCount} />
            <SkeletonRow columns={totalColumnCount} />
            <SkeletonRow columns={totalColumnCount} />
          </>
        ) : sortedRows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={totalColumnCount} sx={{ p: 0, borderBottom: "none" }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  ...theme.batchListShell.sections.listWrap,
                }}
              >
                <Box sx={theme.batchListShell.sections.emptyWrap}>
                  <LayersRoundedIcon sx={theme.batchListShell.empty.icon} />
                  <Typography sx={theme.batchListShell.empty.title}>{emptyText}</Typography>
                  <Typography sx={theme.batchListShell.empty.subtitle}>{emptySubtitle}</Typography>
                </Box>
              </Box>
            </TableCell>
          </TableRow>
        ) : (
          sortedRows.map((p: InProgressBatchRow, i: number) => {
            const statusLabel = normalizeSubdepartmentBatchStatus(p.status);
            const statusCfg =
              batchStatusConfig[statusLabel] ?? batchStatusConfig[getStatus({ status: p.status })];
            const stageLabel = String(p.stageDept || p.currentStage || "").trim();
            const deptKey = String(p.currentStage || "").trim();
            const stageCfg = stageConfig[deptKey];
            const subDeptCfg = getSubDeptChipConfig(stageLabel);
            const typeBg = typeChip?.[p.batchType || ""]?.bg;
            const typeColor = typeChip?.[p.batchType || ""]?.color;

            return (
              <TableRow key={`${p.batchId}-${i}`} sx={th.table.tableRow(i % 2 === 1)}>
                <TableCell sx={th.table.cell}>
                  <Typography
                    sx={{
                      ...th.table.textBatchId(BATCH_ID_COLOR),
                      ...(canViewDetails
                        ? { cursor: "pointer", "&:hover": { textDecoration: "underline" } }
                        : {}),
                    }}
                    onClick={canViewDetails ? () => onViewDetails?.(p) : undefined}
                  >
                    {p.batchId}
                  </Typography>
                  <Typography sx={th.table.subTextMuted}>{p.id || ""}</Typography>
                </TableCell>
                <TableCell sx={th.table.cell}>
                  <Chip
                    label={p.batchType || "NA"}
                    size="small"
                    sx={th.table.chipSx(typeBg, typeColor)}
                  />
                </TableCell>
                <TableCell sx={th.table.cell}>
                  <Typography sx={th.table.textBase}>{p.motorId || "NA"}</Typography>
                </TableCell>
                <TableCell sx={th.table.cellTruncated}>
                  <Typography sx={th.table.textTruncated}>{p.projectName || "NA"}</Typography>
                </TableCell>
                <TableCell sx={th.table.cell}>
                  {stageLabel && stageLabel !== "NA" ? (
                    <Chip
                      icon={stageCfg?.Icon ? <stageCfg.Icon /> : undefined}
                      label={stageLabel}
                      size="small"
                      sx={
                        th.table.stageChip
                          ? th.table.stageChip(subDeptCfg)
                          : th.table.chipSx(subDeptCfg.bg, subDeptCfg.color)
                      }
                    />
                  ) : (
                    <Typography sx={th.table.textSmall}>NA</Typography>
                  )}
                </TableCell>
                {!hideManagerColumns && (
                  <TableCell sx={th.table.cell}>
                    <Typography sx={th.table.textPrimaryStrong}>{p.managerName || "NA"}</Typography>
                  </TableCell>
                )}
                {!hideManagerColumns && (
                  <TableCell sx={th.table.cellNarrow}>
                    <Typography sx={th.table.textSmall}>{p.managerId || "NA"}</Typography>
                  </TableCell>
                )}
                <TableCell sx={th.table.cell}>
                  <Chip
                    icon={statusCfg?.Icon ? <statusCfg.Icon /> : undefined}
                    label={String(p.status || statusLabel)
                      .replace(/_/g, " ")
                      .toUpperCase()}
                    size="small"
                    sx={th.table.statusChip(statusCfg)}
                  />
                </TableCell>
                <TableCell sx={th.table.cellDate}>
                  <Typography sx={th.table.textMuted}>
                    {p.createdOn
                      ? new Date(p.createdOn).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "NA"}
                  </Typography>
                </TableCell>
                <TableCell sx={th.table.cellProgress}>
                  <ProgressBar
                    value={p.completion || 0}
                    color={p.color || subDeptCfg.color || "#1976d2"}
                    trackColor={th.table.progressTrack}
                    valueColor={th.table.progressValueColor}
                  />
                </TableCell>
                {canViewDetails && (
                  <TableCell sx={{ ...th.table.cell, width: 48, p: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleMenuViewDetails(p)}
                      sx={{ color: "text.primary" }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </TableCard>
  );
}
