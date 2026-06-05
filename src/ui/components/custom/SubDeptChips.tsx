// src/components/custom/SubDeptChips.jsx
import React from "react";
import { Box, Chip } from "@mui/material";

const SubDeptChips = ({
  subDepts = [],
  maxVisible = 2,
  chipSx = {},
  containerSx = {},
}) => {
  const visible = subDepts.slice(0, maxVisible);
  const extra = subDepts.length - maxVisible;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        ...containerSx,
      }}
    >
      {visible.map((dept, idx) => {
        const label = typeof dept === "string" ? dept : dept.subDepartmentName || dept.name || "Unknown";
        const key = typeof dept === "string" ? dept : dept.subDepartmentId || dept.id || idx;
        return (
          <Chip
            key={key}
            label={label}
            size="small"
          sx={{
            height: 20,
            fontSize: "0.68rem",
            fontWeight: 600,
            ...chipSx,
          }}
        />
      );
    })}

      {extra > 0 && (
        <Chip
          label={`+${extra}`}
          size="small"
          sx={{
            height: 20,
            fontSize: "0.68rem",
            fontWeight: 600,
            ...chipSx,
          }}
        />
      )}
    </Box>
  );
};

export default SubDeptChips;