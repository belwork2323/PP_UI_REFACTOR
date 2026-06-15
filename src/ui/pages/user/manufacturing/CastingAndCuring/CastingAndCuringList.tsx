// src/ui/pages/user/manufacturing/CastingAndCuring/CastingAndCuringList.tsx

import React, { useMemo } from "react";
import { Chip, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { MANUFACTURING_STATUS } from "../../../../../hooks/user/manufacturing/manufacturingWorkflowData";
import { STRINGS } from "../../../../../app/config/strings";
import { getStageCfg } from "../../../../../hooks/user/manufacturing/castingAndCuringConfig";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
  thermostat: ThermostatRoundedIcon,
} = icons.user.manufacturing.castingAndCuring.list;

export const CC_STATUS = MANUFACTURING_STATUS;

export const CC_STATUS_CONFIG = {
  [CC_STATUS.INITIATED]:            { Icon: HourglassEmptyRoundedIcon,    label: "Initiated" },
  [CC_STATUS.IN_PROGRESS]:          { Icon: PlayCircleOutlineRoundedIcon, label: "In Progress" },
  [CC_STATUS.WAITING_FOR_APPROVAL]: { Icon: PendingActionsRoundedIcon,    label: "Waiting for Approval" },
  [CC_STATUS.APPROVED]:             { Icon: CheckCircleRoundedIcon,       label: "Approved" },
  [CC_STATUS.REJECTED]:             { Icon: CancelRoundedIcon,            label: "Rejected" },
};

const S = STRINGS.MANUFACTURING;

/** Dev-only rows prepended to the batch list for local UI testing. */
const USE_MOCK_CC_BATCH = import.meta.env.DEV;

const MOCK_CC_BATCHES = [
  {
    id: "mock-cc-initiated",
    batchId: "CC-MOCK-001",
    stage: "Casting",
    motorId: "MTR-A-001, MTR-A-002",
    motorIds: ["MTR-A-001", "MTR-A-002"],
    motorType: "A",
    motorStage: 1,
    projectName: "Project Alpha (Mock)",
    assignedTo: { fullName: "Mock Operator" },
    createdOn: "2026-06-01T09:00:00Z",
    priority: "High",
    ccStatus: CC_STATUS.INITIATED,
    formId: null,
  },
  {
    id: "mock-cc-in-progress",
    batchId: "CC-MOCK-002",
    stage: "Casting & Curing",
    motorId: "MTR-B-101, MTR-B-102",
    motorIds: ["MTR-B-101", "MTR-B-102"],
    motorType: "B",
    motorStage: 1,
    projectName: "Project Beta (Mock)",
    assignedTo: { fullName: "Mock Operator" },
    createdOn: "2026-06-03T11:30:00Z",
    priority: "Medium",
    ccStatus: CC_STATUS.IN_PROGRESS,
    formId: "mock-cc-form-002",
  },
  {
    id: "mock-cc-rejected",
    batchId: "CC-MOCK-003",
    stage: "Curing",
    motorId: "MTR-C-201",
    motorIds: ["MTR-C-201"],
    motorType: "C",
    motorStage: 1,
    projectName: "Project Gamma (Mock)",
    assignedTo: { fullName: "Mock Operator" },
    createdOn: "2026-05-28T14:15:00Z",
    priority: "Critical",
    ccStatus: CC_STATUS.REJECTED,
    formId: "mock-cc-form-003",
    rejectionReason: "Curing cycle temperature readings incomplete.",
  },
] as const;

const CastingCuringList = ({ hookState, rowsPerPageOptions }: any) => {
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

  const displayRows = useMemo(
    () => (USE_MOCK_CC_BATCH ? [...MOCK_CC_BATCHES, ...batches] : batches),
    [batches],
  );

  const displayTotalRecords = USE_MOCK_CC_BATCH ? totalRecords + MOCK_CC_BATCHES.length : totalRecords;

  const displayStatusCounts = useMemo(() => {
    if (!USE_MOCK_CC_BATCH) return statusCounts;
    const next = { ...statusCounts };
    MOCK_CC_BATCHES.forEach((row) => {
      const status = row.ccStatus;
      next[status] = (next[status] ?? 0) + 1;
      next[STRINGS.USER_BATCH_LIST.FILTER_ALL] =
        (next[STRINGS.USER_BATCH_LIST.FILTER_ALL] ?? displayTotalRecords);
    });
    return next;
  }, [statusCounts, displayTotalRecords]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(CC_STATUS_CONFIG).map(([status, cfg]) => [status, { ...cfg, ...theme.batchList.statusConfig[status] }]),
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
        key: "stage",
        label: S.CASTING_CURING.COL_STAGE,
        align: "center",
        render: (v: string) => {
          const cfg = getStageCfg(v);
          return (
            <Chip
              icon={<ThermostatRoundedIcon sx={{ fontSize: "12px !important", color: `${cfg.color} !important` }} />}
              label={cfg.label}
              size="small"
              sx={{
                height: 22, fontSize: "0.68rem",
                fontWeight: cfg.italic ? 500 : 700,
                fontStyle: cfg.italic ? "italic" : "normal",
                background: `${cfg.color}14`, color: cfg.color,
                border: `1px solid ${cfg.color}33`, maxWidth: 160,
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
        key: "ccStatus",
        label: S.CASTING_CURING.COL_CC_STATUS,
        align: "center",
        render: (v: string, row: any) => (
          <UserWorkflowStatusCell
            status={v}
            statusConfig={statusConfig}
            rejectedStatus={CC_STATUS.REJECTED}
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
      rows={displayRows}
      columns={COLUMNS}
      statusField="ccStatus"
      statusConfig={statusConfig}
      filters={[
        { field: "stage", options: ["Casting", "Curing", "Casting & Curing", "Not Selected Yet"], label: S.CASTING_CURING.COL_STAGE },
        { field: "priority", options: ["Critical", "High", "Medium", "Low"] },
      ]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.ccStatus === CC_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={S.CASTING_CURING.TABLE_LABEL}
      themeTokens={theme}
      totalRecords={displayTotalRecords}
      statusCounts={displayStatusCounts}
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
          status={row.ccStatus}
          row={row}
          statusMap={CC_STATUS}
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

export default CastingCuringList;
