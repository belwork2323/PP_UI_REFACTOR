// src/ui/components/common/ConfirmDialog.jsx
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Box, Typography,
} from "@mui/material";
import { icons } from "../../../app/theme";
/**
 * Reusable confirmation dialog.
 *
 * Props:
 *  open         — boolean
 *  title        — string
 *  message      — string
 *  confirmLabel — string  (default "Confirm")
 *  cancelLabel  — string  (default "Cancel")
 *  severity     — "warning" | "error" | "info"  (default "warning")
 *  onConfirm    — () => void
 *  onCancel     — () => void
 */

const SEVERITY_CONFIG = {
  warning: {
    color:     "#f59e0b",
    bg:        "#fffbeb",
    darkBg:    "#2d2408",
    Icon:      null, // set below
  },
  error: {
    color:     "#ef4444",
    bg:        "#fef2f2",
    darkBg:    "#2d0808",
    Icon:      null,
  },
  info: {
    color:     "#3b82f6",
    bg:        "#eff6ff",
    darkBg:    "#08142d",
    Icon:      null,
  },
};

const ConfirmAlertDialog = ({
  open,
  title        = "Are you sure?",
  message      = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  severity     = "warning",
  onConfirm,
  onCancel,
}) => {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.warning;

  const SeverityIcon =
    severity === "error"   ? icons.error   :
    severity === "info"    ? icons.info     :
    icons.warning;  // default warning

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          overflow: "hidden",
        },
      }}
    >
      {/* ── Colored top bar ── */}
      <Box sx={{ height: 4, bgcolor: config.color }} />

      <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           36,
              height:          36,
              borderRadius:    "50%",
              bgcolor:         config.color + "22",  // 13% opacity
              flexShrink:      0,
            }}
          >
            <SeverityIcon sx={{ color: config.color, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: "1rem", lineHeight: 1.3 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5, pb: 1 }}>
        <DialogContentText sx={{ fontSize: "0.875rem", color: "text.secondary", pl: "52px" }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          size="small"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            minWidth: 80,
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          size="small"
          sx={{
            borderRadius:    "8px",
            textTransform:   "none",
            fontWeight:      600,
            minWidth:        80,
            bgcolor:         config.color,
            "&:hover":       { bgcolor: config.color, filter: "brightness(0.9)" },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmAlertDialog;