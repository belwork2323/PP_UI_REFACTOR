import React from "react";
import { Chip } from "@mui/material";
import { roleConfig } from "../../../app/theme/custom_themes/admin/userManagement_theme";

const RoleChip = ({ role, size = "small", sx = {} }: { role: string; size?: "small" | "medium"; sx?: any }) => {
  const config = roleConfig[role] || roleConfig["User"];
  return (
    <Chip
      icon={<config.Icon sx={{ fontSize: size === "small" ? 14 : 16 }} />}
      label={role}
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

export default RoleChip;