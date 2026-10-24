import React, { useMemo } from "react";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import StatusChip from "@ui/components/common/StatusChip";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";

const S = STRINGS.MOTOR_MANAGEMENT;

const DISPLAY_STATUSES = new Set(["IN_PROGRESS", "DISPATCHED", "DISCARDED"]);

type MotorListTableProps = {
  paginated: any[];
  loading: boolean;
  page: number;
  totalCount: number;
  rowsPerPage: number;
  t: any;
  onView: (motor: any) => void;
  /** When omitted (Centre Head / System Manager), Discard is hidden. */
  onDiscard?: (motor: any) => void;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const formatBatchCount = (count: number) =>
  `${count} batch${count === 1 ? "" : "es"}`;

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MotorManagementList = ({
  paginated,
  loading,
  page,
  totalCount,
  rowsPerPage,
  t,
  onView,
  onDiscard,
  onPageChange,
  onRowsPerPageChange,
}: MotorListTableProps) => {
  const { table, tableCell } = t;

  const columns = useMemo<AdminManagementColumn<any>[]>(
    () => [
      {
        id: "motorId",
        label: S.TABLE_COLS[0],
        render: (motor) => (
          <Typography sx={tableCell.motorIdText}>{motor.motorId || "—"}</Typography>
        ),
      },
      {
        id: "linkedBatches",
        label: S.TABLE_COLS[1],
        render: (motor) => {
          const count =
            Number(motor?.linkedBatchCount ?? motor?.linkedBatches?.length) || 0;
          return (
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.primary" }}>
              {count > 0 ? formatBatchCount(count) : S.TABLE.NO_LINKED_BATCHES}
            </Typography>
          );
        },
      },
      {
        id: "project",
        label: S.TABLE_COLS[2],
        render: (motor) => (
          <Box sx={tableCell.projectBox}>
            <Typography sx={tableCell.projectId}>{motor.projectId || "—"}</Typography>
          </Box>
        ),
      },
      {
        id: "motorStage",
        label: S.TABLE_COLS[3],
        render: (motor) => (
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
            {motor.motorStage != null ? `Stage ${motor.motorStage}` : "—"}
          </Typography>
        ),
      },
      {
        id: "status",
        label: S.TABLE_COLS[4],
        render: (motor) => {
          const status = String(motor.workflowStatus || "").toUpperCase();
          if (!DISPLAY_STATUSES.has(status)) {
            return "—";
          }
          return <StatusChip status={status} />;
        },
      },
      {
        id: "createdBy",
        label: S.TABLE_COLS[5],
        render: (motor) => (
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
            {motor.createdBy || "—"}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: S.TABLE_COLS[6],
        render: (motor) => (
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
            {formatDateTime(motor.createdAt)}
          </Typography>
        ),
      },
      {
        id: "actions",
        label: S.TABLE_COLS[7],
        isActions: true,
        render: (motor) => {
          const discarded = Boolean(motor.discarded) || motor.workflowStatus === "DISCARDED";
          return (
            <Box sx={tableCell.actionsBox}>
              <Tooltip title={S.TABLE_ACTIONS.VIEW_DETAILS_TOOLTIP}>
                <IconButton size="small" onClick={() => onView(motor)} sx={tableCell.editButton}>
                  <VisibilityRoundedIcon sx={tableCell.editIcon} />
                </IconButton>
              </Tooltip>
              {onDiscard ? (
                <Tooltip
                  title={
                    discarded
                      ? S.TABLE_ACTIONS.DISCARD_DISABLED_TOOLTIP
                      : S.TABLE_ACTIONS.DISCARD_TOOLTIP
                  }
                >
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={discarded}
                      onClick={() => onDiscard(motor)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        minWidth: 0,
                        px: 1.25,
                        py: 0.25,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {S.TABLE_ACTIONS.DISCARD}
                    </Button>
                  </span>
                </Tooltip>
              ) : null}
            </Box>
          );
        },
      },
    ],
    [tableCell, onView, onDiscard],
  );

  return (
    <AdminManagementDataTable
      columns={columns}
      rows={paginated}
      rowKey={(motor) => motor.motorId}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyState={{
        icon: <icons.motorMgmt.motorIcon sx={table.emptyIcon} />,
        message: S.TABLE.EMPTY,
      }}
      theme={t}
    />
  );
};

export default MotorManagementList;
