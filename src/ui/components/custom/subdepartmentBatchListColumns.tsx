import type { ElementType } from "react";
import { Chip, Typography } from "@mui/material";
import { STRINGS } from "../../../app/config/strings";
import { motorStageLabel } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { formatSubdepartmentBatchTypeLabel } from "../../../data/models/user/SubdepartmentBatchModel";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import IconText from "../common/IconText";
import UserWorkflowStatusCell from "./UserWorkflowStatusCell";

export type SubdepartmentBatchListColumnLabels = {
  batchId?: string;
  batchType?: string;
  motorId?: string;
  stage?: string;
  manager?: string;
  createdOn?: string;
  priority?: string;
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
    batchType: batch.COL_BATCH_TYPE,
    motorId: batch.COL_MOTOR_ID,
    stage: batch.COL_STAGE,
    manager: batch.COL_MANAGER,
    createdOn: batch.COL_CREATED_ON,
    priority: batch.COL_PRIORITY,
    unassigned: batch.UNASSIGNED,
  };
};

export const qualityControlBatchListLabels = (): SubdepartmentBatchListColumnLabels => {
  const batch = STRINGS.QUALITY_CONTROL.BATCH_LIST;
  return {
    batchId: batch.COL_BATCH_ID,
    batchType: batch.COL_BATCH_TYPE,
    motorId: batch.COL_MOTOR_ID,
    stage: batch.COL_STAGE,
    manager: batch.COL_MANAGER,
    createdOn: batch.COL_CREATED_ON,
    priority: batch.COL_PRIORITY,
    unassigned: batch.UNASSIGNED,
  };
};

export const dispatchBatchListLabels = (): SubdepartmentBatchListColumnLabels => {
  const batch = STRINGS.DISPATCH.BATCH_LIST;
  return {
    batchId: batch.COL_BATCH_ID,
    batchType: batch.COL_BATCH_TYPE,
    motorId: batch.COL_MOTOR_ID,
    stage: batch.COL_STAGE,
    manager: batch.COL_MANAGER,
    createdOn: batch.COL_CREATED_ON,
    priority: batch.COL_PRIORITY,
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

  const renderPriority = (v: string) => {
    const cfg = theme.batchList.priorityConfig[v] ?? theme.batchList.priorityConfig.Medium;
    return (
      <Chip
        label={v}
        size="small"
        sx={{
          height: 22,
          fontSize: "0.68rem",
          fontWeight: 700,
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}
      />
    );
  };

  const formatDate = (v: string) =>
    new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return [
    {
      key: "batchId",
      label: L.batchId,
      render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
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
      key: "priority",
      label: L.priority,
      align: "center" as const,
      render: renderPriority,
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
