import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from "@mui/material";

const DeleteProjectDialog = ({
  open = false,
  onClose = () => {},
  onConfirm = () => {},
  deleteTarget = null,
  deleting = false,
  t,
}: any) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={t?.modalTitle}>Delete Project?</DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone.
        </Alert>
        <Typography>
          Are you sure you want to delete the project{" "}
          <strong>{deleteTarget?.projectName}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteProjectDialog;
