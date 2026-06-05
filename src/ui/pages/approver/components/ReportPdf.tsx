import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { STRINGS } from "../../../../app/config/strings";
import type { ApproverDepartmentKey } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import useApproverFormPdf from "../../../../hooks/approver/useApproverFormPdf";

const {
  pdf: PictureAsPdfRoundedIcon,
  download: DownloadRoundedIcon,
  close: CloseRoundedIcon,
} = icons.approver.shared.reportPdf;

type ReportDialogProps = {
  open: boolean;
  onClose: () => void;
  formId?: string | null;
  department: ApproverDepartmentKey;
  subDepartment: string;
  dialogTitle?: string;
  themeColor?: string;
  themeColorLight?: string;
};

export const ReportPreviewDialog = ({
  open,
  onClose,
  formId,
  department,
  subDepartment,
  dialogTitle = STRINGS.APPROVER.PDF.TITLE,
  themeColor = "#1B4F72",
  themeColorLight = "#2E86C1",
}: ReportDialogProps) => {
  const { downloadPdf, downloading, loading, pdfData, pdfUrl } = useApproverFormPdf({
    department,
    formId,
    open,
    subDepartment,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: "94vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${themeColor}, ${themeColorLight})`,
          color: "#fff",
          py: 1.5,
          px: 3,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <PictureAsPdfRoundedIcon />
          <Typography fontWeight={800} fontSize="0.95rem" letterSpacing="0.02em">
            {dialogTitle}
          </Typography>
          {pdfData?.pageCount ? (
            <Chip
              label={`${pdfData.pageCount} page${pdfData.pageCount === 1 ? "" : "s"}`}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                fontWeight: 700,
                background: alpha("#fff", 0.15),
                color: alpha("#fff", 0.85),
                border: `1px solid ${alpha("#fff", 0.25)}`,
              }}
            />
          ) : null}
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            startIcon={
              downloading ? <CircularProgress size={13} sx={{ color: alpha("#fff", 0.7) }} /> : <DownloadRoundedIcon />
            }
            disabled={downloading || loading || !formId}
            onClick={downloadPdf}
            sx={{
              background: alpha("#fff", 0.18),
              color: "#fff",
              border: `1px solid ${alpha("#fff", 0.35)}`,
              borderRadius: 2,
              fontSize: "0.72rem",
              fontWeight: 700,
              px: 2,
              textTransform: "none",
              backdropFilter: "blur(8px)",
              "&:hover": { background: alpha("#fff", 0.28) },
              "&:disabled": { background: alpha("#fff", 0.08), color: alpha("#fff", 0.4) },
            }}
          >
            {downloading ? STRINGS.APPROVER.PDF.DOWNLOAD_LOADING : STRINGS.APPROVER.PDF.DOWNLOAD_LABEL}
          </Button>

          <IconButton onClick={onClose} size="small" sx={{ color: alpha("#fff", 0.8) }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          overflow: "hidden",
          background: "#525659",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <Stack flex={1} alignItems="center" justifyContent="center" spacing={2} sx={{ color: "#fff" }}>
            <CircularProgress sx={{ color: "#fff" }} />
            <Typography>{STRINGS.APPROVER.PDF.INLINE_LOADING}</Typography>
          </Stack>
        ) : pdfUrl ? (
          <iframe title={dialogTitle} src={pdfUrl} style={{ border: "none", width: "100%", height: "100%", flex: 1 }} />
        ) : (
          <Stack flex={1} alignItems="center" justifyContent="center" spacing={1.5} sx={{ color: "#fff", px: 4, textAlign: "center" }}>
            <PictureAsPdfRoundedIcon sx={{ fontSize: 38, opacity: 0.65 }} />
            <Typography fontWeight={700}>{STRINGS.APPROVER.PDF.EMPTY_TITLE}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {STRINGS.APPROVER.PDF.EMPTY_SUBTITLE}
            </Typography>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewDialog;
