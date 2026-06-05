// src/ui/pages/user/manufacturing/PostCure/PostCureList.tsx

import React, { useMemo } from "react";
import { Chip, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import { getOpTypeCfg, POST_CURE_OP_TYPE_OPTIONS } from "../../../../../hooks/user/manufacturing/postCureConfig";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
  handyman: HandymanRoundedIcon,
} = icons.user.manufacturing.postCure.list;

export const PC_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.MANUFACTURING;

const PostCureList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  const {
    batches,
    statusCounts,
    totalRecords,
    page,
    rowsPerPage,
    search,
    statusFilter,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    loading,
    handleFillForm,
    handleEditForm,
  } = hookState;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(PC_STATUS_CONFIG).map(([status, cfg]) => [status, { ...cfg, ...theme.batchList.statusConfig[status] }]),
      ),
    [theme],
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: "batchId",
        label: S.BATCH_LIST.COL_BATCH_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "operationType",
        label: S.POST_CURE.COL_OPERATION_TYPE,
        align: "center",
        render: (v: string) => {
          const cfg = getOpTypeCfg(v);
          return (
            <Chip
              icon={<HandymanRoundedIcon sx={{ fontSize: "12px !important", color: `${cfg.color} !important` }} />}
              label={v ?? "—"}
              size="small"
              sx={{
                height: 22, fontSize: "0.68rem",
                fontWeight: cfg.italic ? 500 : 700,
                fontStyle: cfg.italic ? "italic" : "normal",
                background: `${cfg.color}14`, color: cfg.color,
                border: `1px solid ${cfg.color}33`, maxWidth: 170,
              }}
            />
          );
        },
      },
      {
        key: "motorId",
        label: S.BATCH_LIST.COL_MOTOR_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "motorType",
        label: S.BATCH_LIST.COL_TYPE,
        align: "center",
        render: (v: string) => <Chip label={`${S.BATCH_LIST.MOTOR_TYPE_PREFIX}${v}`} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "assignedTo.fullName",
        label: S.BATCH_LIST.COL_MANAGER,
        render: (v: string) => (
          <IconText
            icon={<PersonRoundedIcon sx={theme.batchList.icon} />}
            text={v ?? S.BATCH_LIST.UNASSIGNED}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "createdOn",
        label: S.BATCH_LIST.COL_CREATED_ON,
        render: (v: string) => (
          <IconText
            icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
            text={new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "priority",
        label: S.BATCH_LIST.COL_PRIORITY,
        align: "center",
        render: (v: string) => {
          const cfg = theme.batchList.priorityConfig[v] ?? theme.batchList.priorityConfig.Medium;
          return <Chip label={v} size="small" sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }} />;
        },
      },
      {
        key: "pcStatus",
        label: S.POST_CURE.COL_PC_STATUS,
        align: "center",
        render: (v: string, row: any) => (
          <UserWorkflowStatusCell
            status={v}
            statusConfig={statusConfig}
            rejectedStatus={OPERATION_STATUS.REJECTED}
            rejectionReason={row.rejectionReason}
            theme={theme}
          />
        ),
      },
    ],
    [statusConfig, theme],
  );

  return (
    <UserBatchList
      rows={batches}
      columns={COLUMNS}
      statusField="pcStatus"
      statusConfig={statusConfig}
      filters={[
        { field: "operationType", options: POST_CURE_OP_TYPE_OPTIONS, label: S.POST_CURE.COL_OPERATION_TYPE },
        { field: "priority", options: ["Critical", "High", "Medium", "Low"] },
      ]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.pcStatus === OPERATION_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.POST_CURE.TABLE_LABEL}
      themeTokens={theme}
      totalRecords={totalRecords}
      statusCounts={statusCounts}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      isLoading={loading}
      renderAction={(row: any) => (
        <UserWorkflowStatusAction
          status={row.pcStatus}
          row={row}
          statusMap={OPERATION_STATUS}
          onFillForm={handleFillForm}
          onEditForm={handleEditForm}
          theme={theme}
          fillLabel={S.BATCH_LIST.FILL_ACTION}
          continueLabel={S.BATCH_LIST.CONTINUE_ACTION}
          editTooltip={S.BATCH_LIST.EDIT_ACTION_TOOLTIP}
        />
      )}
    />
  );
};

export default PostCureList;
