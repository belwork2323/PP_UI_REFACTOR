import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { FilePreviewState } from "../../../hooks/useFilePreview";

type FilePreviewDialogProps = {
  preview: FilePreviewState;
  onClose: () => void;
  onDownload?: () => void;
  themeColor?: string;
  themeColorLight?: string;
};

const kindIcon = (kind: FilePreviewState["kind"]) => {
  if (kind === "pdf") return <PictureAsPdfRoundedIcon />;
  if (kind === "image") return <ImageRoundedIcon />;
  return <InsertDriveFileOutlinedIcon />;
};

const FilePreviewDialog = ({
  preview,
  onClose,
  onDownload,
  themeColor = "#1B4F72",
  themeColorLight = "#2E86C1",
}: FilePreviewDialogProps) => {
  const title = preview.fileName || "File preview";

  return (
    <Dialog
      open={preview.open}
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
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
          {kindIcon(preview.kind)}
          <Typography
            fontWeight={800}
            fontSize="0.95rem"
            letterSpacing="0.02em"
            noWrap
            title={title}
          >
            {title}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center" flexShrink={0}>
          {onDownload ? (
            <Button
              size="small"
              variant="contained"
              startIcon={
                preview.downloading ? (
                  <CircularProgress size={13} sx={{ color: alpha("#fff", 0.7) }} />
                ) : (
                  <DownloadRoundedIcon />
                )
              }
              disabled={preview.downloading || preview.loading || !preview.blobUrl}
              onClick={onDownload}
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
              {preview.downloading ? "Downloading…" : "Download"}
            </Button>
          ) : null}

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
          background: preview.kind === "image" ? "#1a1a1a" : "#525659",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {preview.loading ? (
          <Stack flex={1} alignItems="center" justifyContent="center" spacing={2} sx={{ color: "#fff" }}>
            <CircularProgress sx={{ color: "#fff" }} />
            <Typography>Loading file…</Typography>
          </Stack>
        ) : preview.blobUrl && preview.kind === "image" ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto",
              p: 2,
            }}
          >
            <Box
              component="img"
              src={preview.blobUrl}
              alt={title}
              sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 1 }}
            />
          </Box>
        ) : preview.blobUrl && (preview.kind === "pdf" || preview.kind === "document") ? (
          <iframe
            title={title}
            src={preview.blobUrl}
            style={{ border: "none", width: "100%", height: "100%", flex: 1 }}
          />
        ) : preview.blobUrl ? (
          <iframe
            title={title}
            src={preview.blobUrl}
            style={{ border: "none", width: "100%", height: "100%", flex: 1 }}
          />
        ) : (
          <Stack
            flex={1}
            alignItems="center"
            justifyContent="center"
            spacing={1.5}
            sx={{ color: "#fff", px: 4, textAlign: "center" }}
          >
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 38, opacity: 0.65 }} />
            <Typography fontWeight={700}>Unable to preview this file</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Use Download to save the file to your device.
            </Typography>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
