import React from "react";
import {
  Dialog, DialogContent, DialogActions,
  Box, Typography, Button, Zoom, CircularProgress,
} from "@mui/material";
import { icons } from "../../../../../../app/theme";
import { getDisplayName, getUsername } from "./UserConfigs";

const DeleteUserDialog = ({ open, onClose, onConfirm, deleteTarget, deleting, t }) => {
  const { deleteDialog: d } = t;

  return (
    <Dialog
      open={open}
      onClose={() => !deleting && onClose()}
      TransitionComponent={Zoom}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: d.paper }}
    >
      <DialogContent sx={d.content}>
        <Box sx={d.iconBadge}>
          <icons.userMgmt.deleteWarn sx={d.warnIcon} />
        </Box>

        <Typography sx={d.title}>Delete User?</Typography>

        <Typography sx={d.body}>
          This will permanently remove{" "}
          <Box component="span" sx={d.boldName}>
            {deleteTarget && getDisplayName(deleteTarget)}
          </Box>{" "}
          ({deleteTarget && getUsername(deleteTarget)}) and all associated data.
          This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions sx={d.actions}>
        <Button
          variant="outlined"
          onClick={() => !deleting && onClose()}
          sx={d.cancelButton}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={deleting}
          sx={d.deleteButton}
        >
          {deleting ? (
            <>
              <CircularProgress size={14} sx={d.deletingSpinner} />
              Deleting…
            </>
          ) : "Delete User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;