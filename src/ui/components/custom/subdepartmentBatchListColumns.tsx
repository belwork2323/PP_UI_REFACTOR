import type { ElementType } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { STRINGS } from "../../../app/config/strings";
import { icons } from "../../../app/theme/icons";
import { motorStageLabel } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { formatSubdepartmentBatchTypeLabel } from "../../../data/models/user/SubdepartmentBatchModel";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import IconText from "../common/IconText";
import UserWorkflowStatusCell from "./UserWorkflowStatusCell";

export type SubdepartmentBatchListColumnLabels = {
  batchId?: string;
  project?: string;
  batchType?: string;
  motorId?: string;
  stage?: string;
  manager?: string;
  createdOn?: string;
  operationStatus?: string;
  unassigned?: string;
};

export type BuildSubdepartmentBatchListColumnsArgs = {
  theme: any;
  statusConfig: Record<string, any>;
  statusField: string;
  statusLabel: string;
  PersonIcon: ElementType;
  CalendarIcon: ElementType;
  labels?: SubdepartmentBatchListColumnLabels;
  rejectedStatus?: string;
};

const defaultLabels = (): SubdepartmentBatchListColumnLabels => {
  const batch = STRINGS.MANUFACTURING.BATCH_LIST;
  return {
    batchId: batch.COL_BATCH_ID,
    project: batch.COL_PROJECT,
    batchType: batch.COL_BATCH_TYPE,
    motorId: batch.COL_MOTOR_ID,
    stage: batch.COL_STAGE,
    manager: batch.COL_MANAGER,
    createdOn: batch.COL_CREATED_ON,
    unassigned: batch.UNASSIGNED,
  };
};

export const qualityControlBatchListLabels = (): SubdepartmentBatchListColumnLabels => {
  const batch = STRINGS.QUALITY_CONTROL.BATCH_LIST;
  return {
    batchId: batch.COL_BATCH_ID,
    project: batch.COL_PROJECT,
    batchType: batch.COL_BATCH_TYPE,
    motorId: batch.COL_MOTOR_ID,
    stage: batch.COL_STAGE,
    manager: batch.COL_MANAGER,
    createdOn: batch.COL_CREATED_ON,
    unassigned: batch.UNASSIGNED,
  };
};

export const dispatchBatchListLabels = (): SubdepartmentBatchListColumnLabels => {
  const batch = STRINGS.DISPATCH.BATCH_LIST;
  return {
    batchId: batch.COL_BATCH_ID,
    project: batch.COL_PROJECT,
    batchType: batch.COL_BATCH_TYPE,
    motorId: batch.COL_MOTOR_ID,
    stage: batch.COL_STAGE,
    manager: batch.COL_MANAGER,
    createdOn: batch.COL_CREATED_ON,
    unassigned: batch.UNASSIGNED,
  };
};

export const buildSubdepartmentBatchListColumns = ({
  theme,
  statusConfig,
  statusField,
  statusLabel,
  PersonIcon,
  CalendarIcon,
  labels = {},
  rejectedStatus = OPERATION_STATUS.REJECTED,
}: BuildSubdepartmentBatchListColumnsArgs) => {
  const L = { ...defaultLabels(), ...labels, operationStatus: labels.operationStatus ?? statusLabel };

  const formatDate = (v: string) =>
    new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return [
    {
      key: "batchId",
      label: L.batchId,
      render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
    },
    {
      key: "projectId",
      label: L.project,
      render: (_v: string, row: { projectName?: string; projectId?: string }) => {
        const projectName = String(row?.projectName ?? "").trim();
        const projectId = String(row?.projectId ?? "").trim();
        if (!projectName && !projectId) {
          return <Typography sx={theme.batchList.normalText}>—</Typography>;
        }
        return (
          <Box sx={theme.batchList.projectCell}>
            <icons.batchMgmt.projectId sx={theme.batchList.projectIcon} />
            <Box sx={theme.batchList.projectInfo}>
              <Typography sx={theme.batchList.projectName}>{projectName || "—"}</Typography>
              <Typography sx={theme.batchList.projectId}>{projectId || "—"}</Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      key: "batchType",
      label: L.batchType,
      align: "center" as const,
      render: (v: string) => (
        <Chip label={formatSubdepartmentBatchTypeLabel(v)} size="small" sx={theme.batchList.batchTypeChip} />
      ),
    },
    {
      key: "motorId",
      label: L.motorId,
      render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
    },
    {
      key: "motorStage",
      label: L.stage,
      align: "center" as const,
      render: (v: string | number, row: { motorStage?: string | number }) => (
        <Chip
          label={motorStageLabel(row.motorStage ?? v)}
          size="small"
          sx={theme.batchList.batchTypeChip}
        />
      ),
    },
    {
      key: "systemManager.fullName",
      label: L.manager,
      render: (v: string, row: { assignedTo?: { fullName?: string } }) => (
        <IconText
          icon={<PersonIcon sx={theme.batchList.icon} />}
          text={v ?? row.assignedTo?.fullName ?? L.unassigned}
          textSx={theme.batchList.subtleText}
        />
      ),
    },
    {
      key: "createdOn",
      label: L.createdOn,
      render: (v: string) => (
        <IconText
          icon={<CalendarIcon sx={theme.batchList.icon} />}
          text={formatDate(v)}
          textSx={theme.batchList.subtleText}
        />
      ),
    },
    {
      key: statusField,
      label: L.operationStatus,
      align: "center" as const,
      render: (v: string, row: { rejectionReason?: string | null }) => (
        <UserWorkflowStatusCell
          status={v}
          statusConfig={statusConfig}
          rejectedStatus={rejectedStatus}
          rejectionReason={row.rejectionReason}
          theme={theme}
        />
      ),
    },
  ];
};
