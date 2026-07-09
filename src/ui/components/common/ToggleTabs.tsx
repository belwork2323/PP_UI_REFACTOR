import React from "react";
import { ToggleButton, ToggleButtonGroup, SxProps, Theme, alpha } from "@mui/material";

export interface ToggleTabOption {
  label: string;
  value: string;
  count?: number;
}

const defaultSx: SxProps<Theme> = {
  width: "100%",
  mb: 2,
  "& .MuiToggleButtonGroup-grouped": {
    flex: 1,
    textTransform: "none",
    fontWeight: 700,
    fontSize: "0.78rem",
    borderColor: alpha("#D5D8DC", 0.85),
    "&.Mui-selected": {
      color: "#fff",
      background: "linear-gradient(135deg,#1565C0,#1976D2)",
    },
  },
};

type Props = {
  value: string;
  options: ToggleTabOption[];
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
};

export default function ToggleTabs({ value, options, onChange, sx }: Props) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      value={value}
      size="small"
      onChange={(_, value) => {
        if (value) onChange(value);
      }}
      sx={{ ...defaultSx, ...(sx as object) }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
          {option.count ? ` (${option.count})` : ""}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
