import React from "react";
import { TableRow, TableCell, Box } from "@mui/material";

const SkeletonRow = ({ columns = 9, sx = {} }) => {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i} sx={sx}>
          <Box
            sx={{
              height: 14,
              width: i === columns - 1 ? 60 : "80%",
              borderRadius: 1,
              bgcolor: "action.hover",
              animation: "pulse 1.4s infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
};

export default SkeletonRow;