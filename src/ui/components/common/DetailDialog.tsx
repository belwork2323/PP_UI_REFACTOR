import type { ReactNode } from "react";
import { Box, Dialog, DialogContent, type DialogProps, type SxProps, type Theme } from "@mui/material";

type DetailDialogProps = {
  open: boolean;
  onClose: () => void;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  paperSx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
};

/** Full-width dialog shell: fixed header, scrollable content, optional fixed footer. */
const DetailDialog = ({
  open,
  onClose,
  header,
  footer,
  children,
  maxWidth = "lg",
  paperSx,
  headerSx,
  contentSx,
  footerSx,
}: DetailDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth PaperProps={{ sx: paperSx }}>
    <Box sx={headerSx}>{header}</Box>
    <DialogContent sx={contentSx}>{children}</DialogContent>
    {footer ? <Box sx={footerSx}>{footer}</Box> : null}
  </Dialog>
);

export default DetailDialog;
