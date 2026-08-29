import React, { useMemo, useState } from "react";
import { Box, Typography, Chip, Button, Tooltip, IconButton } from "@mui/material";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";

import { getBatchTypeChipConfig } from "@app/theme/roleConfig";
import {
  getBatchId,
  getBatchTypeChipLabel,
  getMotorId,
  getMotorStage,
  getSystemManagerName,
  getSystemManagerId,
  isIdentificationSheetDraft,
  isIdentificationSheetCompleted,
  canDeleteAdminBatch,
  canEditAdminBatch,
  getProjectId,
} from "@utils/batchManagementUtils";
import BatchTrackingPopover from "./BatchTrackingPopover";

const S = STRINGS.BATCH_MANAGEMENT;
const TA = S.TABLE_ACTIONS;

type BatchListTableProps = {
  paginated: any[];
  loading: boolean;
  page: number;
  totalCount: number;
  rowsPerPage: number;
  t: any;
  onEdit: (batch: any) => void;
  onDelete: (batch: any) => void;
  onCompleteImplementation?: (batch: any) => void;
  onViewStatus?: (batch: any) => void;
  onViewDetails?: (batch: any) => void;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const BatchListTable = ({
  paginated,
  loading,
  page,
  totalCount,
  rowsPerPage,
  t,
  onEdit,
  onDelete,
  onCompleteImplementation,
  onViewStatus,
  onViewDetails,
  onPageChange,
  onRowsPerPageChange,
}: BatchListTableProps) => {
  const { table, tableCell } = t;
  const [trackingTarget, setTrackingTarget] = useState<{
    anchor: HTMLElement;
    batchId: string;
  } | null>(null);

  const columns = useMemo<AdminManagementColumn<any>[]>(
    () => [
      {
        id: "batchId",
        label: S.TABLE_COLS[0],
        render: (batch) => (
          <Box sx={tableCell.batchIdBox}>
            <icons.batchMgmt.batchId sx={tableCell.batchIdIcon} />
            <Typography sx={tableCell.batchIdText}>{getBatchId(batch)}</Typography>
          </Box>
        ),
      },
      {
        id: "batchType",
        label: S.TABLE_COLS[1],
        render: (batch) => {
          const typeLabel = getBatchTypeChipLabel(batch);
          const typeCfg = getBatchTypeChipConfig(batch);
          return (
            <Chip
              icon={typeCfg?.Icon ? <typeCfg.Icon /> : undefined}
              label={typeLabel}
              size="small"
              sx={tableCell.stageChip(typeCfg)}
            />
          );
        },
      },
      {
        id: "project",
        label: S.TABLE_COLS[2],
        render: (batch) => (
          <Box sx={tableCell.batchIdBox}>
            <icons.batchMgmt.projectId
              sx={{ ...tableCell.batchIdIcon, ...tableCell.projectIdIcon }}
            />
            <Box sx={tableCell.projectInfo}>
              <Typography sx={tableCell.projectName}>{batch?.projectName}</Typography>
              <Typography sx={tableCell.projectId}>{getProjectId(batch)}</Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: "motorStage",
        label: S.TABLE_COLS[3],
        render: (batch) => (
          <Box sx={tableCell.motorIdBox}>
            <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
            <Typography sx={tableCell.motorIdText}>{getMotorStage(batch)}</Typography>
          </Box>
        ),
      },
      {
        id: "motorId",
        label: S.TABLE_COLS[4],
        headerSx: { minWidth: 220 },
        cellSx: { minWidth: 220 },
        render: (batch) => (
          <Box sx={tableCell.motorIdBox}>
            <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
            <Typography sx={tableCell.motorIdCellText}>{getMotorId(batch)}</Typography>
          </Box>
        ),
      },

      {
        id: "status",
        label: S.TABLE_COLS[5],
        render: (batch) => {
          const batchId = getBatchId(batch);
          return (
            <Tooltip title={TA.TRACK_BATCH_TOOLTIP} arrow placement="top">
              <IconButton
                size="small"
                onClick={(event) => setTrackingTarget({ anchor: event.currentTarget, batchId })}
                sx={tableCell.editButton}
                aria-label={TA.TRACK_BATCH}
              >
                <TrackChangesRoundedIcon sx={tableCell.editIcon} />
              </IconButton>
            </Tooltip>
          );
        },
      },
      {
        id: "systemManager",
        label: S.TABLE_COLS[6],
        headerSx: { minWidth: 180 },
        cellSx: { minWidth: 180 },
        render: (batch) => (
          <Box sx={tableCell.batchIdBox}>
            <icons.batchMgmt.userId
              sx={{ ...tableCell.batchIdIcon, ...tableCell.projectIdIcon }}
            />
            <Box sx={tableCell.projectInfo}>
              <Typography sx={tableCell.projectName}>{getSystemManagerName(batch)}</Typography>
              <Typography sx={tableCell.projectId}>{getSystemManagerId(batch)}</Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: "actions",
        label: S.TABLE_COLS[7],
        isActions: true,
        render: (batch) => {
          const sheetDraft = isIdentificationSheetDraft(batch);
          const sheetCompleted = isIdentificationSheetCompleted(batch);
          const canDelete = canDeleteAdminBatch(batch);
          return (
            <Box sx={tableCell.actionsBox}>
              {onViewStatus && (
                <Tooltip title={TA.VIEW_STATUS_TOOLTIP} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={() => onViewStatus(batch)}
                    sx={tableCell.editButton}
                  >
                    <VisibilityRoundedIcon sx={tableCell.editIcon} />
                  </IconButton>
                </Tooltip>
              )}
              {sheetDraft && onCompleteImplementation && (
                <Tooltip title={TA.COMPLETE_IMPLEMENTATION_TOOLTIP}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => onCompleteImplementation(batch)}
                    sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                  >
                    {TA.COMPLETE_IMPLEMENTATION}
                  </Button>
                </Tooltip>
              )}
              {sheetCompleted && onViewDetails && (
                <Tooltip title={TA.VIEW_DETAILS_TOOLTIP}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onViewDetails(batch)}
                    sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                  >
                    {TA.VIEW_DETAILS}
                  </Button>
                </Tooltip>
              )}
              {canEditAdminBatch(batch) && (
                <Tooltip title={TA.EDIT_BATCH}>
                  <IconButton size="small" onClick={() => onEdit(batch)} sx={tableCell.editButton}>
                    <icons.Edit sx={tableCell.editIcon} />
                  </IconButton>
                </Tooltip>
              )}
              {sheetCompleted && canDelete && (
                <Tooltip title={TA.DELETE_BATCH}>
                  <IconButton size="small" onClick={() => onDelete(batch)} sx={tableCell.deleteButton}>
                    <icons.Delete sx={tableCell.deleteIcon} />
                  </IconButton>
                </Tooltip>
              )}
              {sheetDraft && canDelete && (
                <Tooltip title={TA.DELETE_BATCH}>
                  <IconButton size="small" onClick={() => onDelete(batch)} sx={tableCell.deleteButton}>
                    <icons.Delete sx={tableCell.deleteIcon} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ],
    [tableCell, onEdit, onDelete, onCompleteImplementation, onViewStatus, onViewDetails],
  );

  return (
    <>
      <AdminManagementDataTable
        columns={columns}
        rows={paginated}
        rowKey={(batch) => batch.id || batch.batchId}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        emptyState={{
          icon: <icons.batchMgmt.emptyBatch sx={table.emptyIcon} />,
          message: S.TABLE.EMPTY,
        }}
        theme={t}
      />

      <BatchTrackingPopover
        open={Boolean(trackingTarget)}
        anchorEl={trackingTarget?.anchor ?? null}
        batchId={trackingTarget?.batchId ?? ""}
        onClose={() => setTrackingTarget(null)}
      />
    </>
  );
};

export default BatchListTable;
