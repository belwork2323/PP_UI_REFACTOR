import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { formatApiStatusForDisplay, toApiStatusEnum } from "@hooks/operationStatus";

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

/** Resolve chip styles for either UI labels ("Rejected") or API enums ("REJECTED"). */
const resolveStatusConfig = (
  status: string | undefined,
  statusConfig: Record<string, StatusConfig>,
  theme: any,
): StatusConfig | undefined => {
  const raw = String(status ?? "").trim();
  if (!raw) return undefined;

  const display = formatApiStatusForDisplay(raw);
  const api = toApiStatusEnum(raw);
  const themeBatch = theme?.batchList?.statusConfig ?? {};

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (!key) continue;
      if (statusConfig[key] || themeBatch[key]) {
        return {
          ...(themeBatch[key] ?? {}),
          ...(statusConfig[key] ?? {}),
        } as StatusConfig;
      }
    }
    return undefined;
  };

  return pick(raw, display, api);
};

const UserWorkflowStatusCell = ({
  status,
  statusConfig,
  rejectedStatus,
  rejectionReason,
  theme,
}: UserWorkflowStatusCellProps) => {
  const cfg = resolveStatusConfig(status, statusConfig, theme);
  const Icon = cfg?.Icon ?? statusConfig[formatApiStatusForDisplay(status)]?.Icon;
  const label = cfg?.label ?? formatApiStatusForDisplay(status) ?? status;
  const color = cfg?.color ?? theme?.palette?.textSub ?? "#5D6D7E";
  const bg = cfg?.bg ?? "transparent";
  const border = cfg?.border ?? color;
  const isRejected =
    toApiStatusEnum(status) === toApiStatusEnum(rejectedStatus) ||
    formatApiStatusForDisplay(status) === rejectedStatus;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
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
      {isRejected && rejectionReason && (
        <Tooltip title={`Reason: ${rejectionReason}`} arrow placement="top">
          <Typography sx={theme.batchList.chips.reasonText}>View reason</Typography>
        </Tooltip>
      )}
    </Box>
  );
};

export default UserWorkflowStatusCell;
