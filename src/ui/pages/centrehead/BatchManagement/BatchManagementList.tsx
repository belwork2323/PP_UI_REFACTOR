import React, { useMemo } from "react";
import { Box, Typography, Chip, Button, Tooltip, IconButton } from "@mui/material";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import UserActions from "@ui/components/common/UserActions";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";

import {
  stageConfig,
  batchStatusConfig,
  getSubDeptChipConfig,
  getBatchTypeChipConfig,
} from "@app/theme/roleConfig";
import {
  getBatchId,
  getBatchTypeChipLabel,
  getMotorId,
  getMotorStage,
  getStage,
  getStatus,
  getSubDept,
  getSystemManagerName,
  getSystemManagerId,
  isIdentificationSheetDraft,
  isIdentificationSheetCompleted,
  canDeleteAdminBatch,
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
  onViewDetails,
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
        id: "stage",
        label: S.TABLE_COLS[5],
        render: (batch) => {
          const stage = getStage(batch);
          const subDept = getSubDept(batch);
          const stageLabel = subDept !== "—" ? subDept : stage;
          const scStage = stageConfig[stage] ?? stageConfig[stageLabel];
          const subDeptCfg = getSubDeptChipConfig(stageLabel);
          return (
            <Chip
              icon={scStage ? <scStage.Icon /> : undefined}
              label={stageLabel}
              size="small"
              sx={tableCell.stageChip(subDeptCfg)}
            />
          );
        },
      },
      {
        id: "status",
        label: S.TABLE_COLS[6],
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
        id: "systemManager",
        label: S.TABLE_COLS[7],
        headerSx: { minWidth: 180 },
        cellSx: { minWidth: 180 },
        render: (batch) => (
          <Box sx={tableCell.batchIdBox}>
            <icons.batchMgmt.userId sx={{ ...tableCell.batchIdIcon, ...tableCell.projectIdIcon }} />
            <Box sx={tableCell.projectInfo}>
              <Typography sx={tableCell.projectName}>{getSystemManagerName(batch)}</Typography>
              <Typography sx={tableCell.projectId}>{getSystemManagerId(batch)}</Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: "actions",
        label: S.TABLE_COLS[8],
        isActions: true,
        render: (batch) => {
          const sheetDraft = isIdentificationSheetDraft(batch);
          const sheetCompleted = isIdentificationSheetCompleted(batch);
          const canDelete = canDeleteAdminBatch(batch);
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
              {/* {sheetDraft && onCompleteImplementation && (
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
              )} */}
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
              {/* {sheetCompleted && (
                <UserActions
                  onEdit={() => onEdit(batch)}
                  onDelete={() => onDelete(batch)}
                  editTooltip={TA.EDIT_BATCH}
                  deleteTooltip={TA.DELETE_BATCH}
                  showDelete={canDelete}
                />
              )}
              {sheetDraft && canDelete && (
                <Tooltip title={TA.DELETE_BATCH}>
                  <IconButton size="small" onClick={() => onDelete(batch)} color="error">
                    <icons.Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )} */}
            </Box>
          );
        },
      },
    ],
    [tableCell, onEdit, onDelete, onCompleteImplementation, onViewDetails],
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
