import React from "react";
import { Chip } from "@mui/material";
import { statusConfig } from "../../../app/theme/custom_themes/admin/userManagement_theme";

const StatusChip = ({ status, size = "small", sx = {} }: { status: string; size?: "small" | "medium"; sx?: any }) => {
  const config = statusConfig[status] || statusConfig["Active"];
  return (
    <Chip
      icon={<config.Icon sx={{ fontSize: size === "small" ? 13 : 16 }} />}
      label={status}
      size={size}
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        border: `1px solid ${config.color}40`,
        ...sx,
      }}
    />
  );
};

export default StatusChip;