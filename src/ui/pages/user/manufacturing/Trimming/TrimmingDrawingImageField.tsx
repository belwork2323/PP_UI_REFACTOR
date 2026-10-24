import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RotateLeftRoundedIcon from "@mui/icons-material/RotateLeftRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";
import CropRoundedIcon from "@mui/icons-material/CropRounded";
import { STRINGS } from "../../../../../app/config/strings";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
import { getCroppedImageFile } from "../../../../../utils/cropImage";
import { useFileUploadActions } from "../../../../../hooks/useFileUploadActions";
import { useFileService } from "../../../../../hooks/useFileService";
import { fileController } from "../../../../../controllers/common/fileController";
import { useAlertStore } from "../../../../../app/store/alertStore";

const S = STRINGS.MANUFACTURING.TRIMMING;

type TrimmingDrawingImageFieldProps = {
  files: FileRef[];
  onChange: (next: FileRef[]) => void;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  emptyLabel?: string;
  subDeptSlug?: string;
};

const statusLabel = (ref: FileRef) => {
  if (ref.status === "uploading") return S.FILE_UPLOADING;
  if (ref.status === "failed") return S.FILE_UPLOAD_FAILED;
  return null;
};

const TrimmingDrawingImageField = ({
  files,
  onChange,
  label,
  disabled = false,
  readOnly = false,
  emptyLabel,
  subDeptSlug = "trimming",
}: TrimmingDrawingImageFieldProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const list = useMemo(() => files ?? [], [files]);
  const ref = list[0] ?? null;
  const showAlert = useAlertStore((s) => s.showAlert);

  const {
    uploadSingleFile,
    handleRetry,
    handleRemove,
    subDepartmentId,
  } = useFileUploadActions(list, onChange, {
    acceptMode: "image",
    subDeptSlug,
    missingSubDeptMessage: S.SUB_DEPARTMENT_MISSING,
  });
  const { removeStoredFile } = useFileService();

  const locked = disabled || readOnly;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [applying, setApplying] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const setObjectUrl = useCallback(
    (url: string | null) => {
      revokeObjectUrl();
      objectUrlRef.current = url;
      setImageSrc(url);
    },
    [revokeObjectUrl],
  );

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  // Resolve a preview URL from local File or downloaded server file (inline, not popup).
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!ref) {
        setObjectUrl(null);
        setImageLoading(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
        return;
      }

      if (ref.file instanceof File) {
        const url = URL.createObjectURL(ref.file);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setObjectUrl(url);
        setImageLoading(false);
        return;
      }

      const fileId = String(ref.fileId ?? "").trim();
      if (fileId && subDepartmentId) {
        setImageLoading(true);
        try {
          const { blob } = await fileController.downloadFile(fileId, subDepartmentId);
          if (cancelled) return;
          const typed =
            blob.type && blob.type !== "application/octet-stream"
              ? blob
              : new Blob([blob], { type: ref.mimeType || "image/jpeg" });
          setObjectUrl(URL.createObjectURL(typed));
        } catch {
          if (!cancelled) {
            setObjectUrl(null);
            showAlert("Failed to load drawing preview.", "error");
          }
        } finally {
          if (!cancelled) setImageLoading(false);
        }
        return;
      }

      const url = String(ref.fileUrl ?? "").trim();
      if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) {
        setImageSrc(url);
        setImageLoading(false);
        return;
      }

      setObjectUrl(null);
      setImageLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    ref?.localId,
    ref?.fileId,
    ref?.file,
    ref?.fileUrl,
    ref?.mimeType,
    subDepartmentId,
    setObjectUrl,
    showAlert,
  ]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onMediaLoaded = useCallback((mediaSize: { naturalWidth: number; naturalHeight: number }) => {
    if (mediaSize.naturalWidth > 0 && mediaSize.naturalHeight > 0) {
      setAspect(mediaSize.naturalWidth / mediaSize.naturalHeight);
    }
  }, []);

  const onPickClick = () => {
    if (locked) return;
    inputRef.current?.click();
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    uploadSingleFile(file);
    event.currentTarget.value = "";
  };

  const rotateBy = (delta: number) => {
    if (locked || applying) return;
    setRotation((prev) => {
      const next = prev + delta;
      // Keep rotation in a sensible range for the cropper.
      if (next >= 360) return next - 360;
      if (next <= -360) return next + 360;
      return next;
    });
  };

  const handleApplyCrop = async () => {
    if (locked || applying || !imageSrc || !croppedAreaPixels || !ref) return;
    setApplying(true);
    try {
      const mime = String(ref.mimeType || ref.file?.type || "image/jpeg");
      const previousFileId = String(ref.fileId ?? "").trim();
      const previousWasTemp = ref.isTemp !== false;
      const cropped = await getCroppedImageFile(
        imageSrc,
        croppedAreaPixels,
        ref.fileName || "drawing.jpg",
        rotation,
        mime,
      );
      // Replace list with cropped file, then clean up the previous temp upload.
      uploadSingleFile(cropped);
      if (previousFileId && previousWasTemp && subDepartmentId) {
        void removeStoredFile(previousFileId, subDepartmentId, true);
      }
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    } catch {
      showAlert("Failed to apply crop.", "error");
    } finally {
      setApplying(false);
    }
  };

  const chip = ref ? statusLabel(ref) : null;
  const showEmpty = !ref;
  const canEdit = Boolean(imageSrc) && !locked && !imageLoading && ref?.status !== "uploading";

  return (
    <Box>
      {label ? (
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mb: 0.5 }}>{label}</Typography>
      ) : null}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        hidden
        accept={FILE_PICKER_ACCEPT.IMAGE}
        onChange={onInputChange}
        disabled={locked}
      />

      <Stack spacing={1}>
        {ref ? (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              px: 1,
              py: 0.75,
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={ref.fileName}
              >
                {ref.fileName || "drawing"}
              </Typography>
              {chip ? (
                <Chip
                  size="small"
                  label={chip}
                  color={ref.status === "failed" ? "error" : "default"}
                  sx={{ height: 22, fontSize: "0.65rem" }}
                />
              ) : null}
              {!locked && ref.status === "failed" ? (
                <Tooltip title={S.FILE_UPLOAD_RETRY}>
                  <IconButton size="small" onClick={() => handleRetry(0)}>
                    <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
              {!locked ? (
                <Tooltip title={S.FILE_REMOVE}>
                  <IconButton size="small" onClick={() => void handleRemove(0)}>
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
            {ref.status === "uploading" ? (
              <LinearProgress
                variant={
                  typeof ref.uploadProgress === "number" ? "determinate" : "indeterminate"
                }
                value={ref.uploadProgress ?? 0}
                sx={{ mt: 0.75, height: 3, borderRadius: 1 }}
              />
            ) : null}
          </Box>
        ) : null}

        {imageLoading ? (
          <LinearProgress sx={{ height: 3, borderRadius: 1 }} />
        ) : null}

        {imageSrc ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: readOnly ? 420 : 480,
              borderRadius: 1.5,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.900",
            }}
          >
            {readOnly || locked ? (
              <Box
                component="img"
                src={imageSrc}
                alt={ref?.fileName || "Drawing"}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                objectFit="contain"
                showGrid
              />
            )}
          </Box>
        ) : null}

        {canEdit ? (
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, minWidth: 40 }}>
                {S.DRAWING_ZOOM_LABEL}
              </Typography>
              <Slider
                size="small"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(_, value) => setZoom(Number(value))}
                aria-label={S.DRAWING_ZOOM_LABEL}
                sx={{ flex: 1 }}
              />
              <Tooltip title={S.DRAWING_ROTATE_LEFT}>
                <IconButton size="small" onClick={() => rotateBy(-90)} disabled={applying}>
                  <RotateLeftRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={S.DRAWING_ROTATE_RIGHT}>
                <IconButton size="small" onClick={() => rotateBy(90)} disabled={applying}>
                  <RotateRightRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CropRoundedIcon />}
              onClick={() => void handleApplyCrop()}
              disabled={applying || !croppedAreaPixels}
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
            >
              {applying ? S.DRAWING_APPLYING_CROP : S.DRAWING_APPLY_CROP}
            </Button>
          </Stack>
        ) : null}

        {showEmpty ? (
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            {emptyLabel ?? S.FILE_EMPTY_DRAWING}
          </Typography>
        ) : null}

        {!locked && showEmpty ? (
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={onPickClick}
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
          >
            {S.FILE_ADD}
          </Button>
        ) : null}

        {!locked && !showEmpty ? (
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={onPickClick}
            disabled={applying || ref?.status === "uploading"}
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
          >
            {S.DRAWING_REPLACE}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
};

export default TrimmingDrawingImageField;
