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
import { FieldLabelWithAsterisk } from "../common/FieldLabelWithAsterisk";
import { useEffect, useState } from "react";

export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 500;

// Alphanumeric + spaces + @$%^&*()-+[]/\"':,.<>
export const REASON_PATTERN = /^[A-Za-z0-9\s@$%^&*()=\-\+\[\]\/\\"'.,:<>]+$/;

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
  subdepartment: number;
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
  subdepartment,
}: ApproverActionDialogProps) => {
  const isReject = actionType === "REJECTED";

  const [errorMsg, setErrorMsg] = useState("");
  const [showBlockchainWarning, setShowBlockchainWarning] = useState(false);

  const validateReason = (val: string, isRequired: boolean = true) => {
    const trimmed = val.trim();

    if (isRequired && !trimmed) {
      return "This field is required";
    }
    if (trimmed && trimmed.length < REASON_MIN_LENGTH) {
      return `Must be at least ${REASON_MIN_LENGTH} characters long`;
    }
    if (trimmed && trimmed.length > REASON_MAX_LENGTH) {
      return `Cannot exceed ${REASON_MAX_LENGTH} characters`;
    }
    if (trimmed && !REASON_PATTERN.test(trimmed)) {
      return "Contains invalid characters. Allowed: A-Z a-z 0-9 Space @ $ % ^ & * ( ) - + [ ] / \\ \" ' . , : < >";
    }
    return "";
  };

  const validationError = validateReason(value);
  const isInvalid = Boolean(validationError);

  const handleInitialClick = () => {
    const error = validateReason(value);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setErrorMsg("");

    // If it's an approval action, show the immutable blockchain confirmation dialog first
    if (!isReject) {
      setShowBlockchainWarning(true);
    } else {
      // Rejections proceed directly without blockchain warning
      onConfirm();
    }
  };

  // Reset nested confirmation when parent closes the flow (success / cancel).
  useEffect(() => {
    if (!open) {
      setShowBlockchainWarning(false);
      setErrorMsg("");
    }
  }, [open]);

  const handleBlockchainConfirm = () => {
    onConfirm();
  };

  const handleCloseDialog = () => {
    if (submitting) return;
    setShowBlockchainWarning(false);
    onCancel();
  };

  return (
    <>
      {/* Main Action Dialog (Approve / Reject Input) */}
      <Dialog
        open={open && !showBlockchainWarning && !submitting}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isReject ? STRINGS.APPROVER.ACTION.REJECT_TITLE : STRINGS.APPROVER.ACTION.APPROVE_TITLE}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mb: 2 }}>
            {isReject
              ? STRINGS.APPROVER.ACTION.REJECT_MESSAGE
              : STRINGS.APPROVER.ACTION.APPROVE_MESSAGE}
          </Typography>
          {batchId ? (
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                }}
              >
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
              <FieldLabelWithAsterisk
                label={
                  isReject
                    ? STRINGS.APPROVER.ACTION.REJECTION_REASON_LABEL
                    : STRINGS.APPROVER.ACTION.REMARKS_LABEL
                }
                required
              />
            }
            placeholder={
              isReject
                ? STRINGS.APPROVER.ACTION.REJECTION_REASON_PLACEHOLDER
                : STRINGS.APPROVER.ACTION.REMARKS_PLACEHOLDER
            }
            value={value}
            onChange={(event) => {
              const newValue = event.target.value;
              onValueChange(newValue);
              const err = validateReason(newValue);
              setErrorMsg(err);
            }}
            error={Boolean(helperText) || Boolean(errorMsg)}
            helperText={helperText || errorMsg}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setErrorMsg("");
              onCancel();
            }}
            disabled={submitting}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            {STRINGS.APPROVER.ACTION.CANCEL_LABEL}
          </Button>
          <Button
            onClick={handleInitialClick}
            disabled={confirmDisabled || submitting || isInvalid}
            variant="contained"
            color={isReject ? "error" : "primary"}
            sx={{ textTransform: "none" }}
          >
            {isReject
              ? STRINGS.APPROVER.ACTION.REJECT_LABEL
              : STRINGS.APPROVER.ACTION.APPROVE_LABEL}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Secondary Blockchain Immutability Confirmation Dialog */}
      <Dialog
        open={showBlockchainWarning && !submitting}
        onClose={() => setShowBlockchainWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Secure Confirmation</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "1rem", color: "text.secondary", mb: 2 }}>
            {subdepartment === 1 || subdepartment === 2
              ? "Once submitted, it cannot be undone or modified. Do you still want to proceed?"
              : "This approval will be permanently recorded and locked on the immutable blockchain network. Once submitted, it cannot be undone or modified. Do you still want to proceed?"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowBlockchainWarning(false)}
            disabled={submitting}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBlockchainConfirm}
            disabled={submitting}
            variant="contained"
            color="primary"
            sx={{ textTransform: "none" }}
          >
            {submitting ? "Submitting..." : "Yes, Proceed & Approve"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApproverActionDialog;
