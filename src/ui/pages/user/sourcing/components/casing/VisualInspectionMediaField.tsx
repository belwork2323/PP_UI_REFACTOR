import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import { icons } from "../../../../../../app/theme/icons";
import { STRINGS } from "../../../../../../app/config/strings";
import type { UploadedFileRef } from "../../../../../../data/models/user/RocketMotorCasingFormModel";
import MediaUpload from "../../../../../components/common/MediaUpload";

const S = STRINGS.SOURCING.CASING_CREATE;

const {
  insertDriveFile: InsertDriveFileOutlinedIcon,
  openInNew: OpenInNewRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

const isWebUrl = (url: string) => /^https?:\/\//i.test(String(url ?? "").trim());

const isImageMimeOrName = (mimeType?: string, fileName?: string) => {
  if (String(mimeType ?? "").startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(String(fileName ?? ""));
};

const isVideoMimeOrName = (mimeType?: string, fileName?: string) => {
  if (String(mimeType ?? "").startsWith("video/")) return true;
  return /\.(mp4|webm|mov)$/i.test(String(fileName ?? ""));
};

type VisualInspectionMediaFieldProps = {
  mediaFile: File | null;
  mediaExisting?: UploadedFileRef | null;
  onMediaFileChange: (file: File | null) => void;
  onClearExisting: () => void;
  theme: any;
  listSx?: object;
};

const VisualInspectionMediaField = ({
  mediaFile,
  mediaExisting,
  onMediaFileChange,
  onClearExisting,
  theme,
  listSx,
}: VisualInspectionMediaFieldProps) => {
  const [showUploader, setShowUploader] = useState(false);
  const palette = theme.palette ?? {};

  const hasNew = Boolean(mediaFile);
  const hasSaved = Boolean(mediaExisting?.fileUrl);
  const hasAny = hasNew || hasSaved;

  useEffect(() => {
    if (!hasAny) setShowUploader(false);
  }, [hasAny]);

  const displayName = hasNew ? mediaFile!.name : mediaExisting?.fileName ?? "";
  const displayMime = hasNew ? mediaFile!.type : mediaExisting?.mimeType;
  const displayUrl = hasNew ? "" : mediaExisting?.fileUrl ?? "";
  const isImage = isImageMimeOrName(displayMime, displayName);
  const isVideo = isVideoMimeOrName(displayMime, displayName);
  const canOpen = isWebUrl(displayUrl);
  const typeLabel = isImage ? "Image" : isVideo ? "Video" : "File";
  const TypeIcon = isImage ? ImageRoundedIcon : isVideo ? VideocamRoundedIcon : InsertDriveFileOutlinedIcon;

  const handleRemove = () => {
    onMediaFileChange(null);
    onClearExisting();
    setShowUploader(false);
  };

  const handleFilePicked = (file: File | null) => {
    onMediaFileChange(file);
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
          value={mediaFile}
          onChange={handleFilePicked}
          label={S.COL_MEDIA}
          description={S.ADD_MEDIA}
          accept="image/*,video/*"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1.25, ...listSx }}>
      <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: 0.75 }}>{S.COL_MEDIA}</Typography>
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
                overflow: "hidden",
              }}
            >
              {canOpen && isImage ? (
                <img
                  src={displayUrl}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <TypeIcon sx={{ fontSize: 20, color: palette.primaryLight }} />
              )}
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
                  label={hasNew ? `${typeLabel} · new` : typeLabel}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    background: alpha(palette.primaryLight ?? "#2E86C1", 0.1),
                    color: palette.primaryLight,
                  }}
                />
                {canOpen ? (
                  <Tooltip title={S.OPEN_FILE}>
                    <IconButton
                      size="small"
                      component="a"
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: palette.primaryLight, p: 0.25 }}
                    >
                      <OpenInNewRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Box>
            <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
              <Button
                size="small"
                variant="outlined"
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
                  onClick={handleRemove}
                  sx={{
                    color: palette.textSub,
                    "&:hover": { color: palette.danger, background: alpha(palette.danger ?? "#c0392b", 0.08) },
                  }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </ListItem>
      </List>
    </Box>
  );
};

export default VisualInspectionMediaField;
