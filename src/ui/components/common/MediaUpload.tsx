import React, { useState, useRef } from "react";
import {
  Box, Stack, Typography, Chip, alpha, IconButton, LinearProgress, Tooltip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Button } from "@mui/material";

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  accentLight: "#1ABC9C",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

// ─── Media Utils (inline) ─────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const PDF_MIME = "application/pdf";
const MAX_SIZE_MB = 50;

const DEFAULT_ACCEPT_MODES = { allowImage: true, allowVideo: true, allowPdf: false };

/** Derive allowed types from the `accept` attribute string. */
const parseAcceptModes = (accept) => {
  if (!accept) return DEFAULT_ACCEPT_MODES;
  const a = String(accept).toLowerCase();
  return {
    allowImage: a.includes("image/") || ALLOWED_IMAGE_TYPES.some((t) => a.includes(t)),
    allowVideo: a.includes("video/") || ALLOWED_VIDEO_TYPES.some((t) => a.includes(t)),
    allowPdf: a.includes("pdf"),
  };
};

const isPdfFile = (file) =>
  file?.type === PDF_MIME || /\.pdf$/i.test(String(file?.name ?? ""));

const validateFile = (file, modes = DEFAULT_ACCEPT_MODES) => {
  if (!file) return { valid: false, error: "No file selected" };
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > MAX_SIZE_MB) return { valid: false, error: `File exceeds ${MAX_SIZE_MB}MB limit` };

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isPdf = isPdfFile(file);

  const allowed =
    (modes.allowImage && isImage) ||
    (modes.allowVideo && isVideo) ||
    (modes.allowPdf && isPdf);

  if (!allowed) {
    const parts = [];
    if (modes.allowPdf) parts.push("PDF");
    if (modes.allowImage) parts.push("JPG", "PNG", "WEBP");
    if (modes.allowVideo) parts.push("MP4", "WEBM");
    return { valid: false, error: `Invalid format. Use ${parts.join(", ")}.` };
  }

  return { valid: true, isImage, isVideo, isPdf };
};

const formatChipsFromModes = (modes) => {
  const chips = [];
  if (modes.allowPdf) chips.push("PDF");
  if (modes.allowImage) chips.push("JPG", "PNG", "WEBP");
  if (modes.allowVideo) chips.push("MP4", "WEBM");
  return chips.length ? chips : ["JPG", "PNG", "WEBP", "MP4", "WEBM"];
};

const formatHintFromModes = (modes) => formatChipsFromModes(modes).join(", ");

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isWebUrl = (url) => /^https?:\/\//i.test(String(url ?? "").trim());

const isImageMimeOrName = (mimeType, fileName) => {
  if (String(mimeType ?? "").startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(String(fileName ?? ""));
};

const isVideoMimeOrName = (mimeType, fileName) => {
  if (String(mimeType ?? "").startsWith("video/")) return true;
  return /\.(mp4|webm|mov)$/i.test(String(fileName ?? ""));
};

const isPdfMimeOrName = (mimeType, fileName) =>
  String(mimeType ?? "").toLowerCase() === PDF_MIME || /\.pdf$/i.test(String(fileName ?? ""));

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeIn  = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const pulse   = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.06)}`;

// ─── Styled ───────────────────────────────────────────────────────────────────
interface DropZoneStyleProps {
  isDragging?: boolean;
  hasError?: boolean;
  hasFile?: boolean;
}

const DropZone = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isDragging" && prop !== "hasError" && prop !== "hasFile",
})<DropZoneStyleProps>(({ isDragging, hasError, hasFile }) => ({
  position: "relative",
  borderRadius: 12,
  border: `2px dashed ${
    hasError ? BRAND.danger
    : hasFile ? BRAND.accent
    : isDragging ? BRAND.primaryLight
    : BRAND.border
  }`,
  background: isDragging
    ? alpha(BRAND.primaryLight, 0.05)
    : hasFile
    ? alpha(BRAND.accent, 0.03)
    : "#fff",
  transition: "all 0.25s ease",
  cursor: "pointer",
  overflow: "hidden",
  "&:hover": {
    borderColor: hasFile ? BRAND.accent : BRAND.primaryLight,
    background: hasFile ? alpha(BRAND.accent, 0.04) : alpha(BRAND.primaryLight, 0.04),
  },
}));

const HiddenInput = styled("input")({ display: "none" });

// ─── Preview Thumbnail ────────────────────────────────────────────────────────
const PreviewThumb = ({ file, previewUrl, onRemove, compact = false }) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isPdf = isPdfFile(file);
  const typeLabel = isImage ? "Image" : isVideo ? "Video" : isPdf ? "PDF" : "File";
  const thumbSize = compact ? 36 : 44;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 1 : 1.5,
        p: compact ? "6px 10px" : "10px 14px",
        background: alpha(BRAND.accent, 0.05),
        borderRadius: compact ? 2 : "0 0 10px 10px",
        borderTop: compact ? "none" : `1px solid ${alpha(BRAND.accent, 0.15)}`,
        animation: `${fadeIn} 0.25s ease`,
      }}
    >
      {/* Thumbnail / icon */}
      <Box sx={{
        width: thumbSize, height: thumbSize, borderRadius: 2, overflow: "hidden", flexShrink: 0,
        border: `1px solid ${alpha(BRAND.accent, 0.2)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: alpha(BRAND.accent, 0.08),
      }}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : isVideo ? (
          <VideocamRoundedIcon sx={{ fontSize: 22, color: BRAND.accent }} />
        ) : (
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: BRAND.accent }} />
        )}
      </Box>

      {/* File info */}
      <Box flex={1} minWidth={0}>
        <Typography sx={{ fontSize: compact ? "0.72rem" : "0.8rem", fontWeight: 700, color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.75} mt={0.2}>
          {!compact && (
            <Chip
              label={typeLabel}
              size="small"
              icon={isImage
                ? <ImageRoundedIcon sx={{ fontSize: "11px !important", color: `${BRAND.accent} !important` }} />
                : isVideo
                  ? <VideocamRoundedIcon sx={{ fontSize: "11px !important", color: `${BRAND.accent} !important` }} />
                  : undefined}
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: alpha(BRAND.accent, 0.1), color: BRAND.accent, border: `1px solid ${alpha(BRAND.accent, 0.2)}` }}
            />
          )}
          <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub }}>
            {compact ? `${typeLabel} · ${formatSize(file.size)}` : formatSize(file.size)}
          </Typography>
        </Stack>
      </Box>

      {/* Status + Remove */}
      <Stack direction="row" alignItems="center" gap={0.5}>
        <CheckCircleRoundedIcon sx={{ fontSize: 16, color: BRAND.accent }} />
        <Tooltip title="Remove file">
          <IconButton size="small" onClick={onRemove} sx={{ color: BRAND.danger, "&:hover": { background: alpha(BRAND.danger, 0.08) } }}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

// ─── Existing file from API ───────────────────────────────────────────────────
const ExistingFilePreview = ({
  existingFile,
  compact,
  onChangeClick,
  onClearExisting,
  uploadedFileLabel,
  changeFileLabel,
  removeFileLabel,
  openFileLabel,
  pendingUploadHint,
}) => {
  const canOpen = isWebUrl(existingFile.fileUrl);
  const isImage = isImageMimeOrName(existingFile.mimeType, existingFile.fileName);
  const isVideo = isVideoMimeOrName(existingFile.mimeType, existingFile.fileName);
  const isPdf = isPdfMimeOrName(existingFile.mimeType, existingFile.fileName);
  const typeLabel = isImage ? "Image" : isVideo ? "Video" : isPdf ? "PDF" : "Document";
  const thumbSize = compact ? 36 : 44;

  return (
    <Box
      sx={{
        p: compact ? "8px 10px" : "10px 14px",
        background: alpha(BRAND.accent, 0.06),
        borderRadius: compact ? 2 : "10px 10px 0 0",
        borderBottom: compact ? `1px solid ${alpha(BRAND.accent, 0.12)}` : "none",
        animation: `${fadeIn} 0.25s ease`,
      }}
    >
      <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: BRAND.accent, mb: 0.75 }}>
        {uploadedFileLabel}
      </Typography>
      <Stack direction="row" alignItems="center" gap={compact ? 1 : 1.5}>
        <Box
          sx={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            border: `1px solid ${alpha(BRAND.accent, 0.2)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: alpha(BRAND.accent, 0.08),
          }}
        >
          {canOpen && isImage ? (
            <img
              src={existingFile.fileUrl}
              alt={existingFile.fileName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : isVideo ? (
            <VideocamRoundedIcon sx={{ fontSize: 22, color: BRAND.accent }} />
          ) : (
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: BRAND.accent }} />
          )}
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography
            sx={{
              fontSize: compact ? "0.72rem" : "0.8rem",
              fontWeight: 700,
              color: BRAND.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {existingFile.fileName}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ mt: 0.2 }}>
            <Chip
              label={typeLabel}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.6rem",
                fontWeight: 700,
                background: alpha(BRAND.accent, 0.1),
                color: BRAND.accent,
              }}
            />
            {canOpen && (
              <Tooltip title={openFileLabel}>
                <IconButton
                  size="small"
                  component="a"
                  href={existingFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: BRAND.primaryLight, p: 0.25 }}
                >
                  <OpenInNewRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          {!canOpen && pendingUploadHint ? (
            <Typography sx={{ fontSize: "0.65rem", color: BRAND.textSub, mt: 0.35, lineHeight: 1.3 }}>
              {pendingUploadHint}
            </Typography>
          ) : null}
        </Box>
        <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onChangeClick();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.72rem",
              borderRadius: 1.5,
              minWidth: 0,
              px: 1.25,
              borderColor: alpha(BRAND.primaryLight, 0.45),
              color: BRAND.primaryLight,
            }}
          >
            {changeFileLabel}
          </Button>
          {onClearExisting ? (
            <Tooltip title={removeFileLabel}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearExisting();
                }}
                sx={{ color: BRAND.danger, "&:hover": { background: alpha(BRAND.danger, 0.08) } }}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
};

// ─── MediaUpload Component ────────────────────────────────────────────────────
/**
 * MediaUpload
 *
 * Props:
 *   value       — current File | null
 *   onChange    — (file: File | null) => void
 *   existingFile — file already saved on server (from details API)
 *   onClearExisting — clear existing file ref when user removes it
 *   label       — string, shown above dropzone
 *   description — optional helper text
 *   accept      — optional mime string (defaults to images + videos)
 */
const MediaUpload = ({
  value,
  onChange,
  existingFile = null,
  onClearExisting,
  label = "Visual Record",
  description = "Upload images or video of the visual observation",
  accept,
  variant = "default",
  hideLabel = false,
  uploadedFileLabel = "Uploaded file",
  changeFileLabel = "Change file",
  removeFileLabel = "Remove",
  openFileLabel = "Open file",
  pendingUploadHint = "Saved with this form. Use Change file to upload a replacement.",
}) => {
  const isCompact = variant === "compact";
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const acceptModes = parseAcceptModes(accept);
  const acceptStr = accept || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",");
  const formatChips = formatChipsFromModes(acceptModes);
  const formatHint = formatHintFromModes(acceptModes);
  const showExisting = Boolean(existingFile?.fileUrl) && !value;

  const processFile = (file) => {
    const result = validateFile(file, acceptModes);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setError("");
    if (result.isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    onChange(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = null; // reset so same file can be re-selected
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError("");
    onChange(null);
  };

  return (
    <Box>
      {!hideLabel && label ? (
        <Typography sx={{ fontSize: isCompact ? "0.7rem" : "0.78rem", fontWeight: 700, color: BRAND.textSub, mb: 0.5 }}>
          {label}
        </Typography>
      ) : null}

      <DropZone
        isDragging={isDragging}
        hasError={!!error}
        hasFile={!!value || showExisting}
        onClick={() => !value && !showExisting && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        sx={isCompact ? { borderRadius: 2, minHeight: value || showExisting ? "auto" : 52 } : undefined}
      >
        <HiddenInput ref={inputRef} type="file" accept={acceptStr} onChange={handleInputChange} />

        {showExisting && (
          <ExistingFilePreview
            existingFile={existingFile}
            compact={isCompact}
            onChangeClick={() => inputRef.current?.click()}
            onClearExisting={onClearExisting}
            uploadedFileLabel={uploadedFileLabel}
            changeFileLabel={changeFileLabel}
            removeFileLabel={removeFileLabel}
            openFileLabel={openFileLabel}
            pendingUploadHint={!isWebUrl(existingFile.fileUrl) ? pendingUploadHint : ""}
          />
        )}

        {/* Drop zone body — empty state or replace prompt when existing file shown */}
        {!value && !showExisting && (
          isCompact ? (
            <Stack direction="row" alignItems="center" gap={1.25} sx={{ py: 1, px: 1.25 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
                background: isDragging
                  ? `linear-gradient(135deg, ${BRAND.primaryLight}, ${BRAND.accentLight})`
                  : alpha(BRAND.primaryLight, 0.1),
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.25s ease",
              }}>
                <CloudUploadRoundedIcon sx={{ fontSize: 18, color: isDragging ? "#fff" : BRAND.primaryLight }} />
              </Box>
              <Box minWidth={0} flex={1}>
                <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: BRAND.text, lineHeight: 1.25 }}>
                  {isDragging ? "Drop file here" : "Click or drag & drop"}
                </Typography>
                <Typography sx={{ fontSize: "0.65rem", color: BRAND.textSub, mt: 0.15, lineHeight: 1.3 }}>
                  {description} · {formatHint} · ≤{MAX_SIZE_MB}MB
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack alignItems="center" gap={1} sx={{ py: 3.5, px: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: "14px",
                background: isDragging
                  ? `linear-gradient(135deg, ${BRAND.primaryLight}, ${BRAND.accentLight})`
                  : alpha(BRAND.primaryLight, 0.1),
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.25s ease",
                animation: isDragging ? `${pulse} 0.8s ease infinite` : "none",
              }}>
                <CloudUploadRoundedIcon sx={{
                  fontSize: 24,
                  color: isDragging ? "#fff" : BRAND.primaryLight,
                  transition: "color 0.2s",
                }} />
              </Box>

              <Box textAlign="center">
                <Typography sx={{ fontSize: "0.83rem", fontWeight: 700, color: BRAND.text }}>
                  {isDragging ? "Drop to upload" : "Click or drag & drop"}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.3 }}>
                  {description}
                </Typography>
              </Box>

              <Stack direction="row" gap={0.8} mt={0.5} flexWrap="wrap" justifyContent="center">
                {formatChips.map((fmt) => (
                  <Chip key={fmt} label={fmt} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: alpha(BRAND.border, 0.6), color: BRAND.textSub }} />
                ))}
                <Chip label={`≤ ${MAX_SIZE_MB}MB`} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: alpha(BRAND.warn, 0.1), color: "#7D6608" }} />
              </Stack>
            </Stack>
          )
        )}

        {/* File selected — show preview strip */}
        {value && (
          <PreviewThumb file={value} previewUrl={previewUrl} onRemove={handleRemove} compact={isCompact} />
        )}
      </DropZone>

      {/* Error */}
      {error && (
        <Stack direction="row" alignItems="center" gap={0.8} mt={0.5}>
          <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: BRAND.danger }} />
          <Typography sx={{ fontSize: "0.68rem", color: BRAND.danger, fontWeight: 600 }}>{error}</Typography>
        </Stack>
      )}
    </Box>
  );
};

export default MediaUpload;