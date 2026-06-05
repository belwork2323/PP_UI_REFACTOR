import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import type { ApproverFormActionType } from "../../../data/api/approver/approverApi";
import { STRINGS } from "../../../app/config/strings";

type ApproverActionDialogProps = {
  actionType: ApproverFormActionType | null;
  batchId?: string | null;
  /** Label shown above the identifier (defaults to Batch ID). */
  idLabel?: string;
  confirmDisabled?: boolean;
  helperText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onValueChange: (value: string) => void;
  open: boolean;
  submitting?: boolean;
  value: string;
};

const ApproverActionDialog = ({
  actionType,
  batchId,
  idLabel = STRINGS.APPROVER.ACTION.BATCH_ID_LABEL,
  confirmDisabled = false,
  helperText,
  onCancel,
  onConfirm,
  onValueChange,
  open,
  submitting = false,
  value,
}: ApproverActionDialogProps) => {
  const isReject = actionType === "REJECTED";

  return (
    <Dialog open={open} onClose={submitting ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{isReject ? STRINGS.APPROVER.ACTION.REJECT_TITLE : STRINGS.APPROVER.ACTION.APPROVE_TITLE}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mb: 2 }}>
          {isReject ? STRINGS.APPROVER.ACTION.REJECT_MESSAGE : STRINGS.APPROVER.ACTION.APPROVE_MESSAGE}
        </Typography>
        {batchId ? (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
              {idLabel}
            </Typography>
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }}>{batchId}</Typography>
          </Box>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          label={
            isReject ? STRINGS.APPROVER.ACTION.REJECTION_REASON_LABEL : STRINGS.APPROVER.ACTION.REMARKS_LABEL
          }
          placeholder={
            isReject
              ? STRINGS.APPROVER.ACTION.REJECTION_REASON_PLACEHOLDER
              : STRINGS.APPROVER.ACTION.REMARKS_PLACEHOLDER
          }
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          required={isReject}
          error={Boolean(helperText)}
          helperText={helperText}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} disabled={submitting} variant="outlined" sx={{ textTransform: "none" }}>
          {STRINGS.APPROVER.ACTION.CANCEL_LABEL}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={confirmDisabled || submitting}
          variant="contained"
          color={isReject ? "error" : "primary"}
          sx={{ textTransform: "none" }}
        >
          {isReject ? STRINGS.APPROVER.ACTION.REJECT_LABEL : STRINGS.APPROVER.ACTION.APPROVE_LABEL}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproverActionDialog;