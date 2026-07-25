import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { icons } from "../../../app/theme";
const UserActions = ({
  onEdit,
  onDelete,
  editTooltip = "Edit user",
  deleteTooltip = "Delete user",
  showDelete = true,
  sx = {},
}: {
  onEdit: () => void;
  onDelete: () => void;
  editTooltip?: string;
  deleteTooltip?: string;
  showDelete?: boolean;
  sx?: object;
}) => {
  return (
    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", ...sx }}>
      <Tooltip title={editTooltip}>
        <IconButton size="small" onClick={onEdit} color="primary">
          <icons.Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      {showDelete ? (
        <Tooltip title={deleteTooltip}>
          <IconButton size="small" onClick={onDelete} color="error">
            <icons.Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
};

export default UserActions;