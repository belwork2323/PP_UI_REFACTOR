import React from "react";
import {
  Dialog, DialogContent, DialogActions,
  Box, Typography, Button, Zoom, CircularProgress,
} from "@mui/material";

import { icons }   from "../../../../../../app/theme";
import { STRINGS } from "../../../../../../app/config/strings";
import Input       from "../../../../../components/common/Input";
import { getBatchId, getMotorId } from "./BatchConfigs";

const S = STRINGS.BATCH_MANAGEMENT.DELETE_DIALOG;

const DeleteBatchDialog = ({
  open,
  onClose,
  onConfirm,
  deleteTarget,
  deleteReason,
  onReasonChange,
  deleting,
  t,
}: any) => {
  const { deleteDialog: d } = t;
  const batchId = deleteTarget ? getBatchId(deleteTarget) : "";
  const motorId = deleteTarget ? getMotorId(deleteTarget) : "";

  /* Delete is only enabled when a non-empty reason has been entered */
  const canDelete = !!deleteReason?.trim();

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

        {/* Warning icon */}
        <Box sx={d.iconBadge}>
          <icons.batchMgmt.deleteWarn sx={d.warnIcon} />
        </Box>

        <Typography sx={d.title}>{S.TITLE}</Typography>

        <Typography sx={d.body}>
          {S.BODY(batchId, motorId)}
        </Typography>

        {/* ── Reason input — required before delete is allowed ──────── */}
        <Input
          fullWidth
          multiline
          minRows={2}
          label={S.REASON_LABEL}
          placeholder={S.REASON_PLACEHOLDER}
          value={deleteReason}
          onChange={onReasonChange}
          sx={d.deleteReasonInput}
          helperText={!canDelete ? S.REASON_HELPER : undefined}
          error={deleteReason !== undefined && deleteReason !== "" ? false : undefined}
        />

      </DialogContent>

      <DialogActions sx={d.actions}>
        <Button
          variant="outlined"
          onClick={() => !deleting && onClose()}
          sx={d.cancelButton}
        >
          {S.CANCEL}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={deleting || !canDelete}
          sx={d.deleteButton}
        >
          {deleting ? (
            <><CircularProgress size={14} sx={d.deletingSpinner} />{S.DELETING}</>
          ) : S.CONFIRM}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteBatchDialog;