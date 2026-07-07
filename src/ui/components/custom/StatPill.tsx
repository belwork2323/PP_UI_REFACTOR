import React from "react";
import { Box, Typography } from "@mui/material";

const StatPill = ({ label, value, color, bg }) => {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: bg,
        border: `1px solid ${color}33`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 120,
      }}
    >
      <Typography
        sx={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          color: "text.secondary",
          mt: 0.5,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default StatPill;