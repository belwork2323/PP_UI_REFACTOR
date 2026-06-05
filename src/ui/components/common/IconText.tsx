import { Stack, Typography } from "@mui/material";
import React from "react";

type IconTextProps = {
  icon: React.ReactNode;
  text: React.ReactNode;
  iconSx?: Record<string, unknown>;
  textSx?: Record<string, unknown>;
  gap?: number;
};

const IconText = ({ icon, text, iconSx, textSx, gap = 0.6 }: IconTextProps) => (
  <Stack direction="row" alignItems="center" gap={gap}>
    <span style={{ display: "inline-flex" }}>{icon}</span>
    <Typography sx={textSx}>{text}</Typography>
  </Stack>
);

export default IconText;
