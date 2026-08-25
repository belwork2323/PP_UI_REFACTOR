import React, { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Link,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { icons } from "../../../../../../app/theme/icons";
import { STRINGS } from "../../../../../../app/config/strings";
import type { UploadedFileRef } from "../../../../../../data/models/user/RocketMotorCasingFormModel";
import MediaUpload from "../../../../../components/common/MediaUpload";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import { FILE_PICKER_ACCEPT } from "../../../../../../utils/FileUtils";
import { useCasingFileActions } from "../../../../../../hooks/user/sourcing/useCasingFileActions";

const S = STRINGS.SOURCING.CASING_CREATE;

const {
  insertDriveFile: InsertDriveFileOutlinedIcon,
  openInNew: OpenInNewRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

const isImageMimeOrName = (mimeType?: string, fileName?: string) => {
  if (String(mimeType ?? "").startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(String(fileName ?? ""));
};

const isVideoMimeOrName = (mimeType?: string, fileName?: string) => {
  if (String(mimeType ?? "").startsWith("video/")) return true;
  return /\.(mp4|webm|mov)$/i.test(String(fileName ?? ""));
};

type VisualInspectionMediaFieldProps = {
  mediaExisting?: UploadedFileRef | null;
  onMediaExistingChange: (next: UploadedFileRef | null) => void;
  theme: any;
  listSx?: object;
};

const VisualInspectionMediaField = ({
  mediaExisting = null,
  onMediaExistingChange,
  theme,
  listSx,
}: VisualInspectionMediaFieldProps) => {
  const [showUploader, setShowUploader] = useState(false);
  const palette = theme.palette ?? {};
  const files = useMemo(() => (mediaExisting ? [mediaExisting] : []), [mediaExisting]);

  const {
    uploadSingleFile,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview,
    closeFilePreview,
    downloadFilePreview,
  } = useCasingFileActions(files, (next) => onMediaExistingChange(next[0] ?? null));

  const isUploading = mediaExisting?.status === "uploading";
  const isFailed = mediaExisting?.status === "failed";
  const hasAny = Boolean(mediaExisting?.fileName);

  useEffect(() => {
    if (!hasAny) setShowUploader(false);
  }, [hasAny]);

  const displayName = mediaExisting?.fileName ?? "";
  const displayMime = mediaExisting?.mimeType;
  const isImage = isImageMimeOrName(displayMime, displayName);
  const isVideo = isVideoMimeOrName(displayMime, displayName);
  const canOpen =
    Boolean(String(mediaExisting?.fileId ?? "").trim()) ||
    /^https?:\/\//i.test(String(mediaExisting?.fileUrl ?? ""));
  const typeLabel = isImage ? "Image" : isVideo ? "Video" : "File";
  const TypeIcon = isImage
    ? ImageRoundedIcon
    : isVideo
      ? VideocamRoundedIcon
      : InsertDriveFileOutlinedIcon;
  const statusChipLabel = isUploading
    ? S.UPLOAD_REPORT_UPLOADING
    : isFailed
      ? S.UPLOAD_REPORT_FAILED
      : typeLabel;
  const statusColor = isFailed ? palette.danger ?? "#c0392b" : palette.primaryLight ?? "#2E86C1";

  const handleRemoveAll = () => {
    void handleRemove(0);
    setShowUploader(false);
  };

  const handleFilePicked = (file: File | null) => {
    uploadSingleFile(file);
    if (file) setShowUploader(false);
  };

  if (showUploader || !hasAny) {
    return (
      <Box sx={{ mt: 1, ...listSx }}>
        {hasAny ? (
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 0.75 }}>
            <Button
              size="small"
              onClick={() => setShowUploader(false)}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.72rem" }}
            >
              {S.CANCEL_REPLACE}
            </Button>
          </Stack>
        ) : null}
        <MediaUpload
          variant="compact"
          hideLabel
          value={null}
          onChange={handleFilePicked}
          label={S.COL_MEDIA}
          description={S.ADD_MEDIA}
          accept={FILE_PICKER_ACCEPT.IMAGE_VIDEO}
        />
        <FilePreviewDialog
          preview={filePreview}
          onClose={closeFilePreview}
          onDownload={downloadFilePreview}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.25, ...listSx }}>
      <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: 0.75 }}>
        {S.COL_MEDIA}
      </Typography>
      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <ListItem
          disableGutters
          sx={{
            display: "block",
            px: 1.25,
            py: 1,
            borderRadius: 2,
            background: alpha(palette.surface ?? "#fff", palette.mode === "dark" ? 0.35 : 1),
            border: `1px solid ${alpha(palette.border ?? "#ccc", 0.55)}`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: alpha(palette.primaryLight ?? "#2E86C1", 0.1),
                border: `1px solid ${alpha(palette.primaryLight ?? "#2E86C1", 0.2)}`,
              }}
            >
              <TypeIcon sx={{ fontSize: 20, color: palette.primaryLight }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </Typography>
              <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.35 }}>
                <Chip
                  label={statusChipLabel}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    background: alpha(statusColor, 0.1),
                    color: statusColor,
                  }}
                />
                {canOpen && !isUploading ? (
                  <Link
                    component="button"
                    type="button"
                    onClick={() => handleOpen(0)}
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.25,
                      cursor: "pointer",
                      color: palette.primaryLight,
                    }}
                  >
                    {S.OPEN_FILE}
                    <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                  </Link>
                ) : null}
                {isFailed ? (
                  <Tooltip title={S.UPLOAD_REPORT_RETRY}>
                    <IconButton
                      size="small"
                      onClick={() => handleRetry(0)}
                      sx={{ color: palette.primaryLight, p: 0.25 }}
                    >
                      <RefreshRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
              {isUploading ? (
                <LinearProgress
                  variant={
                    typeof mediaExisting?.uploadProgress === "number"
                      ? "determinate"
                      : "indeterminate"
                  }
                  value={mediaExisting?.uploadProgress ?? 0}
                  sx={{ mt: 0.75, height: 4, borderRadius: 1 }}
                />
              ) : null}
            </Box>
            <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
              <Button
                size="small"
                variant="outlined"
                disabled={isUploading}
                onClick={() => setShowUploader(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  borderRadius: 1.5,
                  minWidth: 0,
                  px: 1.25,
                  borderColor: alpha(palette.primaryLight ?? "#2E86C1", 0.45),
                  color: palette.primaryLight,
                }}
              >
                {S.CHANGE_FILE}
              </Button>
              <Tooltip title={S.REMOVE_FILE}>
                <IconButton
                  size="small"
                  onClick={handleRemoveAll}
                  disabled={isUploading}
                  sx={{
                    color: palette.textSub,
                    "&:hover": {
                      color: palette.danger,
                      background: alpha(palette.danger ?? "#c0392b", 0.08),
                    },
                  }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </ListItem>
      </List>
      <FilePreviewDialog
        preview={filePreview}
        onClose={closeFilePreview}
        onDownload={downloadFilePreview}
      />
    </Box>
  );
};

export default VisualInspectionMediaField;
