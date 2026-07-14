import React, { useMemo } from "react";
import { Box, Typography, Chip, Button, Tooltip, IconButton, colors } from "@mui/material";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import UserActions from "@ui/components/common/UserActions";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";

import { stageConfig, batchStatusConfig, priorityConfig, getSubDeptChipConfig } from "@app/theme/roleConfig";
import {
  getBatchId,
  getMotorId,
  getMotorStage,
  getStage,
  getStatus,
  getPriority,
  getSubDept,
  getSystemManagerLabel,
  isIdentificationSheetDraft,
  isIdentificationSheetCompleted,
  getProjectId,
} from "@utils/batchManagementUtils";

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
  onViewImplementation?: (batch: any) => void;
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
  onViewImplementation,
  onPageChange,
  onRowsPerPageChange,
}: BatchListTableProps) => {
  const { table, tableCell } = t;

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
        id: "project",
        label: S.TABLE_COLS[1],
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
        label: S.TABLE_COLS[2],
        render: (batch) => (
          <Box sx={tableCell.motorIdBox}>
            <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
            <Typography sx={tableCell.motorIdText}>{getMotorStage(batch)}</Typography>
          </Box>
        ),
      },
      {
        id: "motorId",
        label: S.TABLE_COLS[3],
        render: (batch) => (
          <Box sx={tableCell.motorIdBox}>
            <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
            <Typography sx={tableCell.motorIdText}>{getMotorId(batch)}</Typography>
          </Box>
        ),
      },

      {
        id: "stage",
        label: S.TABLE_COLS[4],
        render: (batch) => {
          const stage = getStage(batch);
          const subDept = getSubDept(batch);
          const scStage = stageConfig[stage];
          const subDeptCfg = getSubDeptChipConfig(subDept);
          return (
            <Chip
              icon={scStage ? <scStage.Icon /> : undefined}
              label={subDept}
              size="small"
              sx={tableCell.stageChip(subDeptCfg)}
            />
          );
        },
      },
      {
        id: "status",
        label: S.TABLE_COLS[5],
        render: (batch) => {
          const status = getStatus(batch);
          const scStatus = batchStatusConfig[status];
          return (
            <Chip
              icon={scStatus?.Icon ? <scStatus.Icon /> : undefined}
              label={status.replace(/_/g, " ").toUpperCase()}
              size="small"
              sx={tableCell.statusChip(scStatus)}
            />
          );
        },
      },
      {
        id: "priority",
        label: S.TABLE_COLS[6],
        render: (batch) => {
          const priority = getPriority(batch);
          const pc = priorityConfig[priority];
          return <Chip label={priority} size="small" sx={tableCell.priorityChip(pc)} />;
        },
      },
      {
        id: "systemManager",
        label: S.TABLE_COLS[7],
        render: (batch) => (
          <Typography sx={tableCell.motorIdText}>{getSystemManagerLabel(batch)}</Typography>
        ),
      },
      {
        id: "actions",
        label: S.TABLE_COLS[8],
        isActions: true,
        render: (batch) => {
          const sheetDraft = isIdentificationSheetDraft(batch);
          const sheetCompleted = isIdentificationSheetCompleted(batch);
          return (
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
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
              {sheetCompleted && onViewImplementation && (
                <Tooltip title={TA.VIEW_DETAILS_TOOLTIP}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onViewImplementation(batch)}
                    sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                  >
                    {TA.VIEW_DETAILS}
                  </Button>
                </Tooltip>
              )}
              {sheetCompleted && (
                <UserActions onEdit={() => onEdit(batch)} onDelete={() => onDelete(batch)} />
              )}
              {sheetDraft && (
                <Tooltip title={TA.DELETE_BATCH}>
                  <IconButton size="small" onClick={() => onDelete(batch)} color="error">
                    <icons.Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ],
    [tableCell, onEdit, onDelete, onCompleteImplementation, onViewImplementation],
  );

  return (
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
  );
};

export default BatchListTable;
