import { Typography } from "@mui/material";
import { CASTING_CURING_BRAND } from "../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";

const BRAND = CASTING_CURING_BRAND;

export const formatWorkflowReadOnlyValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

type WorkflowReadOnlyTextProps = {
  value: unknown;
  muted?: boolean;
  sx?: Record<string, unknown>;
};

/** Plain read-only text for workflow tables and fields (approver / details views). */
export const WorkflowReadOnlyText = ({ value, muted = false, sx }: WorkflowReadOnlyTextProps) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: muted ? 500 : 600,
      color: muted ? BRAND.textSub : BRAND.text,
      lineHeight: 1.35,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      py: 0.25,
      ...sx,
    }}
  >
    {formatWorkflowReadOnlyValue(value)}
  </Typography>
);
