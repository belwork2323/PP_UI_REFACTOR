import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  getPremixStatusLabel,
  type PremixSubmissionStatus,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";

export type PremixStatusThemeConfig = Record<
  string,
  { color: string; bg: string; border: string }
>;

const STATUS_ICONS: Record<string, typeof HourglassEmptyRoundedIcon> = {
  "To Be Initiated": HourglassEmptyRoundedIcon,
  "In Progress": PlayCircleOutlineRoundedIcon,
  "Waiting for Approval": PendingActionsRoundedIcon,
  Approved: CheckCircleOutlineRoundedIcon,
  Rejected: CancelOutlinedIcon,
  "Final Approval Completed": CheckCircleOutlineRoundedIcon,
};

type PremixStatusChipProps = {
  status?: PremixSubmissionStatus;
  statusConfig: PremixStatusThemeConfig;
  size?: "small" | "medium";
  showIcon?: boolean;
  /**
   * `default` — surface chip (details / summaries).
   * `embedded` — glass badge like AppHeader Role (for use inside nav buttons).
   */
  variant?: "default" | "embedded";
  /** When embedded inside a primary/contained button, use light-on-accent glass. */
  onAccent?: boolean;
};

export const PremixStatusChip = ({
  status,
  statusConfig,
  size = "small",
  showIcon = true,
  variant = "default",
  onAccent = false,
}: PremixStatusChipProps) => {
  const label = getPremixStatusLabel(status);
  const chipStyle = statusConfig[label] ?? statusConfig["To Be Initiated"];
  const Icon = STATUS_ICONS[label] ?? HourglassEmptyRoundedIcon;
  const iconSize = size === "small" ? 13 : 15;
  const fontSize = size === "small" ? "0.65rem" : "0.72rem";
  const padY = size === "small" ? "3px" : "4px";
  const padX = size === "small" ? "8px" : "10px";

  if (variant === "embedded") {
    const accent = chipStyle?.color ?? "#334155";
    const glass = onAccent
      ? {
          color: "#fff",
          bgcolor: "rgba(255,255,255,0.22)",
          border: "1px solid rgba(255,255,255,0.38)",
          iconColor: "rgba(255,255,255,0.92)",
        }
      : {
          color: accent,
          bgcolor: alpha(accent, 0.12),
          border: `1px solid ${alpha(accent, 0.28)}`,
          iconColor: accent,
        };

    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          width: "fit-content",
          maxWidth: "100%",
          px: padX,
          py: padY,
          borderRadius: "999px",
          bgcolor: glass.bgcolor,
          border: glass.border,
          boxShadow: onAccent ? "inset 0 1px 0 rgba(255,255,255,0.12)" : "none",
          lineHeight: 1,
        }}
      >
        {showIcon ? (
          <Icon sx={{ fontSize: `${iconSize}px !important`, color: glass.iconColor, opacity: 0.9 }} />
        ) : null}
        <Typography
          component="span"
          sx={{
            fontSize,
            fontWeight: 700,
            color: glass.color,
            lineHeight: 1,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        width: "fit-content",
        maxWidth: "100%",
        px: padX,
        py: padY,
        borderRadius: "999px",
        color: chipStyle.color,
        bgcolor: chipStyle.bg,
        border: `1px solid ${chipStyle.border}`,
        lineHeight: 1,
      }}
    >
      {showIcon ? (
        <Icon sx={{ fontSize: `${iconSize}px !important`, color: chipStyle.color }} />
      ) : null}
      <Typography
        component="span"
        sx={{
          fontSize,
          fontWeight: 700,
          color: chipStyle.color,
          lineHeight: 1,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

type PremixCountsSummaryProps = {
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
  total: number;
  toBeInitiated?: number;
  statusConfig: PremixStatusThemeConfig;
};

export const PremixCountsSummary = ({
  pending,
  approved,
  rejected,
  inProgress,
  total,
  toBeInitiated,
  statusConfig,
}: PremixCountsSummaryProps) => {
  const initiatedCount =
    typeof toBeInitiated === "number"
      ? Math.max(0, toBeInitiated)
      : Math.max(0, total - pending - approved - rejected - inProgress);

  const items = [
    {
      key: "waiting",
      count: pending,
      status: "WAITING_FOR_APPROVAL" as PremixSubmissionStatus,
    },
    {
      key: "approved",
      count: approved,
      status: "APPROVED" as PremixSubmissionStatus,
    },
    {
      key: "rejected",
      count: rejected,
      status: "REJECTED" as PremixSubmissionStatus,
    },
    {
      key: "inProgress",
      count: inProgress,
      status: "IN_PROGRESS" as PremixSubmissionStatus,
    },
    {
      key: "toBeInitiated",
      count: initiatedCount,
      status: "TO_BE_INITIATED" as PremixSubmissionStatus,
    },
  ].filter((item) => item.count > 0);

  return (
    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
      {items.map((item) => {
        const label = getPremixStatusLabel(item.status);
        const chipStyle = statusConfig[label] ?? statusConfig["To Be Initiated"];

        return (
          <Box
            key={item.key}
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              px: "10px",
              py: "4px",
              borderRadius: "999px",
              color: chipStyle.color,
              bgcolor: chipStyle.bg,
              border: `1px solid ${chipStyle.border}`,
              lineHeight: 1,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: chipStyle.color,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 18,
                height: 18,
                px: "5px",
                borderRadius: "999px",
                bgcolor: chipStyle.color,
                color: "#fff",
                fontSize: "0.62rem",
                fontWeight: 800,
                lineHeight: 1,
              }}
              title={`${item.count} ${label}`}
            >
              {item.count}
            </Box>
          </Box>
        );
      })}
      <Typography
        sx={{
          fontSize: "0.72rem",
          color: "text.secondary",
          fontWeight: 700,
          lineHeight: 1,
          borderLeft: items.length ? "1px solid" : "none",
          borderColor: "divider",
          ml: items.length ? 0.25 : 0,
          pl: items.length ? 1 : 0,
        }}
      >
        {total} total
      </Typography>
    </Stack>
  );
};

export default PremixStatusChip;
