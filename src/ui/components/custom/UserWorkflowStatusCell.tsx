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
  const themeStatus = theme?.batchList?.statusConfig?.[status];
  const cfg = statusConfig[status]
    ? { ...themeStatus, ...statusConfig[status] }
    : themeStatus;
  const Icon = cfg?.Icon ?? statusConfig[status]?.Icon;
  const label = cfg?.label ?? status;
  const color = cfg?.color ?? theme?.palette?.textSub ?? "#5D6D7E";
  const bg = cfg?.bg ?? "transparent";
  const border = cfg?.border ?? color;

  return (
    <>
      <Chip
        {...(Icon
          ? { icon: <Icon sx={{ fontSize: "13px !important", color: `${color} !important` }} /> }
          : {})}
        label={label}
        size="small"
        sx={{
          height: 24,
          fontSize: "0.68rem",
          fontWeight: 700,
          background: bg,
          color,
          border: `1px solid ${border}`,
          maxWidth: 220,
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
