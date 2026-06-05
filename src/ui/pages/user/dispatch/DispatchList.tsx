import React from "react";
import { alpha, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import { OPERATION_STATUS } from "../../../../hooks/operationStatus";
import UserBatchList from "../../../components/custom/UserBatchList";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  arrowForward: ArrowForwardRoundedIcon,
  edit: EditRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.dispatch.list;

export const DISPATCH_STATUS_CONFIG = {
  [OPERATION_STATUS.INITIATED]: {
    color: "#475569",
    bg: alpha("#475569", 0.08),
    border: alpha("#475569", 0.2),
    Icon: HourglassEmptyRoundedIcon,
    label: OPERATION_STATUS.INITIATED,
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    color: "#2E86C1",
    bg: alpha("#2E86C1", 0.1),
    border: alpha("#2E86C1", 0.25),
    Icon: PlayCircleOutlineRoundedIcon,
    label: OPERATION_STATUS.IN_PROGRESS,
  },
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: {
    color: "#D4AC0D",
    bg: alpha("#D4AC0D", 0.1),
    border: alpha("#D4AC0D", 0.3),
    Icon: PendingActionsRoundedIcon,
    label: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  },
  [OPERATION_STATUS.APPROVED]: {
    color: "#148F77",
    bg: alpha("#148F77", 0.1),
    border: alpha("#148F77", 0.25),
    Icon: CheckCircleRoundedIcon,
    label: OPERATION_STATUS.APPROVED,
  },
  [OPERATION_STATUS.REJECTED]: {
    color: "#C0392B",
    bg: alpha("#C0392B", 0.1),
    border: alpha("#C0392B", 0.25),
    Icon: CancelRoundedIcon,
    label: OPERATION_STATUS.REJECTED,
  },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: "#922B21", bg: alpha("#C0392B", 0.08), border: alpha("#C0392B", 0.22) },
  High: { color: "#7D6608", bg: alpha("#D4AC0D", 0.1), border: alpha("#D4AC0D", 0.28) },
  Medium: { color: "#1A5276", bg: alpha("#2E86C1", 0.1), border: alpha("#2E86C1", 0.28) },
  Low: { color: "#2E4053", bg: alpha("#5D6D7E", 0.08), border: alpha("#5D6D7E", 0.2) },
};

const BRAND_PRIMARY = "#1B4F72";
const BRAND_PRIMARY_LIGHT = "#2E86C1";
const BRAND_DANGER = "#C0392B";

const COLUMNS = [
  {
    key: "batchId",
    label: STRINGS.MANUFACTURING.BATCH_LIST.COL_BATCH_ID,
    render: (v: string) => (
      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND_PRIMARY }}>{v}</Typography>
    ),
  },
  {
    key: "motorId",
    label: STRINGS.MANUFACTURING.BATCH_LIST.COL_MOTOR_ID,
    render: (v: string) => <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: "#5D6D7E" }}>{v}</Typography>,
  },
  {
    key: "motorType",
    label: STRINGS.MANUFACTURING.BATCH_LIST.COL_TYPE,
    align: "center",
    render: (v: string) => (
      <Chip
        label={`${STRINGS.MANUFACTURING.BATCH_LIST.MOTOR_TYPE_PREFIX}${v}`}
        size="small"
        sx={{
          height: 20,
          fontSize: "0.62rem",
          fontWeight: 700,
          background: alpha(BRAND_PRIMARY, 0.08),
          color: BRAND_PRIMARY,
          border: `1px solid ${alpha(BRAND_PRIMARY, 0.18)}`,
        }}
      />
    ),
  },
  {
    key: "assignedTo.fullName",
    label: STRINGS.MANUFACTURING.BATCH_LIST.COL_MANAGER,
    render: (v: string) => (
      <Stack direction="row" alignItems="center" gap={0.6}>
        <PersonRoundedIcon sx={{ fontSize: 13, color: "#5D6D7E" }} />
        <Typography sx={{ fontSize: "0.78rem", color: "#1C2833" }}>
          {v ?? STRINGS.MANUFACTURING.BATCH_LIST.UNASSIGNED}
        </Typography>
      </Stack>
    ),
  },
  {
    key: "createdOn",
    label: STRINGS.MANUFACTURING.BATCH_LIST.COL_CREATED_ON,
    render: (v: string) => (
      <Stack direction="row" alignItems="center" gap={0.6}>
        <CalendarMonthRoundedIcon sx={{ fontSize: 13, color: "#5D6D7E" }} />
        <Typography sx={{ fontSize: "0.78rem", color: "#1C2833" }}>
          {new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Typography>
      </Stack>
    ),
  },
  {
    key: "priority",
    label: STRINGS.MANUFACTURING.BATCH_LIST.COL_PRIORITY,
    align: "center",
    render: (v: string) => {
      const cfg = PRIORITY_CONFIG[v] ?? PRIORITY_CONFIG.Medium;
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
    },
  },
  {
    key: "dispatchStatus",
    label: STRINGS.DISPATCH.COL_STATUS,
    align: "center",
    render: (v: string, row: any) => {
      const cfg = DISPATCH_STATUS_CONFIG[v] ?? DISPATCH_STATUS_CONFIG[OPERATION_STATUS.INITIATED];
      const Icon = cfg.Icon;
      return (
        <>
          <Chip
            icon={<Icon sx={{ fontSize: "13px !important", color: `${cfg.color} !important` }} />}
            label={cfg.label}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.68rem",
              fontWeight: 700,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              maxWidth: 175,
            }}
          />
          {v === OPERATION_STATUS.REJECTED && row.rejectionReason && (
            <Tooltip title={`Reason: ${row.rejectionReason}`} arrow placement="top">
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: BRAND_DANGER,
                  mt: 0.4,
                  cursor: "help",
                  textDecoration: "underline dotted",
                  fontWeight: 600,
                }}
              >
                View reason
              </Typography>
            </Tooltip>
          )}
        </>
      );
    },
  },
];

const DispatchList = ({ hookState, rowsPerPageOptions }: any) => {
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

  return (
    <UserBatchList
      rows={batches}
      columns={COLUMNS}
      statusField="dispatchStatus"
      statusConfig={DISPATCH_STATUS_CONFIG}
      filters={[{ field: "priority", options: ["Critical", "High", "Medium", "Low"] }]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.dispatchStatus === OPERATION_STATUS.REJECTED}
      highlightColor={BRAND_DANGER}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={STRINGS.DISPATCH.TABLE_LABEL}
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
      renderAction={(row: any) => {
        switch (row.dispatchStatus) {
          case OPERATION_STATUS.INITIATED:
            return (
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "14px !important" }} />}
                onClick={() => handleFillForm(row)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  textTransform: "none",
                  px: 1.8,
                  py: "5px",
                  whiteSpace: "nowrap",
                  background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_PRIMARY_LIGHT})`,
                  boxShadow: `0 2px 8px ${alpha(BRAND_PRIMARY, 0.28)}`,
                  "&:hover": {
                    boxShadow: `0 4px 12px ${alpha(BRAND_PRIMARY, 0.38)}`,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.18s",
                }}
              >
                {STRINGS.MANUFACTURING.BATCH_LIST.FILL_ACTION}
              </Button>
            );
          case OPERATION_STATUS.IN_PROGRESS:
            return (
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "14px !important" }} />}
                onClick={() => handleFillForm(row)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  textTransform: "none",
                  px: 1.8,
                  py: "5px",
                  whiteSpace: "nowrap",
                  borderColor: BRAND_PRIMARY_LIGHT,
                  color: BRAND_PRIMARY_LIGHT,
                  "&:hover": { background: alpha(BRAND_PRIMARY_LIGHT, 0.06) },
                }}
              >
                {STRINGS.MANUFACTURING.BATCH_LIST.CONTINUE_ACTION}
              </Button>
            );
          case OPERATION_STATUS.REJECTED:
            return (
              <Tooltip title={STRINGS.MANUFACTURING.BATCH_LIST.EDIT_ACTION_TOOLTIP} arrow placement="top">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditRoundedIcon sx={{ fontSize: "14px !important" }} />}
                  onClick={() => handleEditForm(row)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    textTransform: "none",
                    px: 1.8,
                    py: "5px",
                    whiteSpace: "nowrap",
                    borderColor: BRAND_DANGER,
                    color: BRAND_DANGER,
                    "&:hover": { background: alpha(BRAND_DANGER, 0.06) },
                  }}
                >
                  {STRINGS.DISPATCH.EDIT_ACTION}
                </Button>
              </Tooltip>
            );
          case OPERATION_STATUS.WAITING_FOR_APPROVAL:
            return (
              <Chip
                label={STRINGS.DISPATCH.WAITING_LABEL}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  height: 24,
                  background: alpha("#D4AC0D", 0.1),
                  color: "#7D6608",
                  border: `1px solid ${alpha("#D4AC0D", 0.3)}`,
                }}
              />
            );
          case OPERATION_STATUS.APPROVED:
            return (
              <Chip
                icon={
                  <CheckCircleRoundedIcon
                    sx={{ fontSize: "13px !important", color: "#0E6655 !important" }}
                  />
                }
                label={STRINGS.DISPATCH.APPROVED_LABEL}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  height: 24,
                  background: alpha("#148F77", 0.1),
                  color: "#0E6655",
                  border: `1px solid ${alpha("#148F77", 0.3)}`,
                }}
              />
            );
          default:
            return null;
        }
      }}
    />
  );
};

export default DispatchList;
