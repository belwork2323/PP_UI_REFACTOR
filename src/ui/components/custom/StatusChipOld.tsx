import React from "react";
import { Chip } from "@mui/material";
import colors from "../../../app/theme/colors";

const StatusChipOld = ({ status }) => {
  const label = status?.toUpperCase() || "UNKNOWN";

  const getStatusColor = () => {
    switch (label) {
      case "APPROVED":
        return colors.success.main;
      case "PENDING":
        return colors.warning.main;
      case "REJECTED":
        return colors.error.main;
      default:
        return colors.grey[700];
    }
  };

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: getStatusColor(),
        color: "#fff",
        fontWeight: "bold",
      }}
    />
  );
};

export default StatusChipOld;
