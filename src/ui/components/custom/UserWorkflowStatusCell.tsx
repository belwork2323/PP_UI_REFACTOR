import { Chip, Tooltip, Typography } from "@mui/material";

type StatusConfig = {
  Icon: any;
  label: string;
  color: string;
  bg: string;
  border: string;
};

type UserWorkflowStatusCellProps = {
  status: string;
  statusConfig: Record<string, StatusConfig>;
  rejectedStatus: string;
  rejectionReason?: string | null;
  theme: any;
};

const UserWorkflowStatusCell = ({
  status,
  statusConfig,
  rejectedStatus,
  rejectionReason,
  theme,
}: UserWorkflowStatusCellProps) => {
  const cfg = statusConfig[status] ?? statusConfig[Object.keys(statusConfig)[0]];
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
      {status === rejectedStatus && rejectionReason && (
        <Tooltip title={`Reason: ${rejectionReason}`} arrow placement="top">
          <Typography sx={theme.batchList.chips.reasonText}>View reason</Typography>
        </Tooltip>
      )}
    </>
  );
};

export default UserWorkflowStatusCell;
