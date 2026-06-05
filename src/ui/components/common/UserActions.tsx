import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { icons } from "../../../app/theme";
const UserActions = ({ onEdit, onDelete, sx = {} }) => {
  return (
    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", ...sx }}>
      <Tooltip title="Edit user">
        <IconButton size="small" onClick={onEdit} color="primary">
          <icons.Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete user">
        <IconButton size="small" onClick={onDelete} color="error">
          <icons.Delete fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default UserActions;