import React, { useMemo, useState } from "react";
import { Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack as MuiStack, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";

import ProgressBar from "../common/ProgressBar";
import TableCard from "./TableCard";
import SkeletonRow from "../common/SkeletonRow";
import { useAuthStore } from "../../../app/store/authStore";

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
  emptyText: string;
  meta?: React.ReactNode;
  filterPanel?: React.ReactNode;
  cardSx?: any;
  hideManagerColumns?: boolean;
  onViewDetails?: (row: InProgressBatchRow) => void;
};

const BATCH_COLUMNS = [
  { label: "Batch ID", sortKey: "batchId" },
  { label: "Type", sortKey: "batchType" },
  { label: "Motor ID", sortKey: "motorId" },
  { label: "Motor Type", sortKey: "motorType" },
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
  meta,
  filterPanel,
  cardSx,
  hideManagerColumns = false,
  onViewDetails,
}: Props) {
  const role = useAuthStore((s) => s.user?.role ?? "");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuRow, setMenuRow] = useState<InProgressBatchRow | null>(null);
  const normalizedRole = String(role).trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  const canViewDetails = normalizedRole === "SYSTEM_MANAGER" && Boolean(onViewDetails);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: InProgressBatchRow) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };
  const handleMenuViewDetails = () => {
    if (menuRow && onViewDetails) onViewDetails(menuRow);
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
  const { typeChip, stageChip } = th;

  return (
    <TableCard
      title={title}
      titleSx={th.table.sectionTitle.sx}
      cardSx={cardSx ?? th.card}
      meta={meta}
      filterPanel={filterPanel}
    >
      <TableHead>
        <TableRow sx={th.table.headerRow}>
          {BATCH_COLUMNS.filter(({ sortKey }) => !hideManagerColumns || (sortKey !== "managerName" && sortKey !== "managerId")).map(({ label, sortKey }) => {
            const isActive = sortField === sortKey;
            const SortIcon = isActive
              ? (sortDir === "asc" ? ArrowUpwardIcon : ArrowDownwardIcon)
              : UnfoldMoreIcon;

            return (
              <TableCell key={label} sx={th.table.header} onClick={() => handleSort(sortKey)}>
                <MuiStack direction="row" alignItems="center" component="span">
                  {label}
                  <SortIcon sx={th.table.headerSortIcon(isActive)} />
                </MuiStack>
              </TableCell>
            );
          })}          {canViewDetails && (
            <TableCell sx={{ ...th.table.header, width: 48 }} />
          )}
        </TableRow>
      </TableHead>

      <TableBody>
        {loading ? (
          <>
            <SkeletonRow columns={(hideManagerColumns ? 9 : 11) + (canViewDetails ? 1 : 0)} />
            <SkeletonRow columns={(hideManagerColumns ? 9 : 11) + (canViewDetails ? 1 : 0)} />
            <SkeletonRow columns={(hideManagerColumns ? 9 : 11) + (canViewDetails ? 1 : 0)} />
          </>
        ) : sortedRows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={(hideManagerColumns ? 9 : 11) + (canViewDetails ? 1 : 0)} align="center" sx={th.table.emptyCell}>
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          sortedRows.map((p: InProgressBatchRow, i: number) => (
            <TableRow key={`${p.batchId}-${i}`} sx={th.table.tableRow(i % 2 === 1)}>
              <TableCell sx={th.table.cell}>
                <Typography
                  sx={{
                    ...th.table.textBatchId("#1565c0"),
                    ...(canViewDetails ? { cursor: "pointer", "&:hover": { textDecoration: "underline" } } : {}),
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
                  sx={th.table.chipSx(typeChip[p.batchType || ""]?.bg, typeChip[p.batchType || ""]?.color)}
                />
              </TableCell>

              <TableCell sx={th.table.cell}>
                <Typography sx={th.table.textBase}>{p.motorId || "NA"}</Typography>
              </TableCell>

              <TableCell sx={th.table.cellNarrow}>
                <Typography sx={th.table.textSmall}>{p.motorType || "NA"}</Typography>
              </TableCell>

              <TableCell sx={th.table.cellTruncated}>
                <Typography sx={th.table.textTruncated}>{p.projectName || "NA"}</Typography>
              </TableCell>

              <TableCell sx={th.table.cell}>
                {p.currentStage && p.currentStage !== "NA" ? (
                  <Chip
                    label={p.currentStage}
                    size="small"
                    sx={th.table.chipSx(stageChip[p.stageDept || ""]?.bg, stageChip[p.stageDept || ""]?.color)}
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
                <Chip label={p.status || "NA"} size="small" sx={th.table.statusChipSx(p.status)} />
              </TableCell>

              <TableCell sx={th.table.cellDate}>
                <Typography sx={th.table.textMuted}>
                  {p.createdOn
                    ? new Date(p.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "NA"}
                </Typography>
              </TableCell>

              <TableCell sx={th.table.cellProgress}>
                <ProgressBar
                  value={p.completion || 0}
                  color={p.color || "#1976d2"}
                  trackColor={th.table.progressTrack}
                  valueColor={th.table.progressValueColor}
                />
              </TableCell>

              {canViewDetails && (
                <TableCell sx={{ ...th.table.cell, width: 48, p: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, p)}
                    sx={{ color: "text.secondary" }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>

      {canViewDetails && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{ elevation: 3, sx: { minWidth: 180, borderRadius: "10px" } }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleMenuViewDetails} sx={{ gap: 1, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <VisibilityIcon fontSize="small" sx={{ color: "#1565c0" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}>
              View Batch Details
            </ListItemText>
          </MenuItem>
        </Menu>
      )}
    </TableCard>
  );
}
