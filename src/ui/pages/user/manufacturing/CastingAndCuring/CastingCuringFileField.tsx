import { useId, useMemo, useRef, type ChangeEvent } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { STRINGS } from "../../../../../app/config/strings";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import FilePreviewDialog from "../../../../components/common/FilePreviewDialog";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
import {
  useFileUploadActions,
  type FileAcceptMode,
} from "../../../../../hooks/useFileUploadActions";

const S = STRINGS.MANUFACTURING.CASTING_CURING;

type CastingCuringFileFieldProps = {
  files: FileRef[];
  onChange: (next: FileRef[]) => void;
  /** Multi = abrading attachments; single = TCE test report. */
  multiple?: boolean;
  acceptMode?: FileAcceptMode;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  emptyLabel?: string;
};

const acceptForMode = (mode: FileAcceptMode) =>
  mode === "imageVideo" ? FILE_PICKER_ACCEPT.IMAGE_VIDEO : FILE_PICKER_ACCEPT.IMAGE_VIDEO_PDF;

const statusLabel = (ref: FileRef) => {
  if (ref.status === "uploading") return S.FILE_UPLOADING;
  if (ref.status === "failed") return S.FILE_UPLOAD_FAILED;
  return null;
};

const CastingCuringFileField = ({
  files,
  onChange,
  multiple = true,
  acceptMode = "imageVideo",
  label,
  disabled = false,
  readOnly = false,
  compact = false,
  emptyLabel,
}: CastingCuringFileFieldProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const list = useMemo(() => files ?? [], [files]);

  const {
    handleFilesSelected,
    uploadSingleFile,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview,
    closeFilePreview,
    downloadFilePreview,
  } = useFileUploadActions(list, onChange, {
    acceptMode,
    subDeptSlug: "casting-and-curing",
    missingSubDeptMessage: S.SUB_DEPARTMENT_MISSING,
  });

  const locked = disabled || readOnly;
  const showEmpty = list.length === 0;

  const onPickClick = () => {
    if (locked) return;
    inputRef.current?.click();
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!multiple) {
      const file = event.currentTarget.files?.[0] ?? null;
      uploadSingleFile(file);
      event.currentTarget.value = "";
      return;
    }
    handleFilesSelected(event);
  };

  return (
    <Box sx={{ minWidth: compact ? 140 : undefined }}>
      {label ? (
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mb: 0.5 }}>{label}</Typography>
      ) : null}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={acceptForMode(acceptMode)}
        onChange={onInputChange}
        disabled={locked}
      />

      <Stack spacing={0.75}>
        {list.map((ref, index) => {
          const chip = statusLabel(ref);
          const canOpen =
            Boolean(String(ref.fileId ?? "").trim()) ||
            /^https?:\/\//i.test(String(ref.fileUrl ?? ""));
          return (
            <Box
              key={ref.localId ?? `${ref.fileName}-${index}`}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                px: 1,
                py: 0.75,
              }}
            >
              <Stack direction="row" alignItems="center" gap={0.75}>
                <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, opacity: 0.7 }} />
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
                  {ref.fileName || "file"}
                </Typography>
                {chip ? (
                  <Chip
                    size="small"
                    label={chip}
                    color={ref.status === "failed" ? "error" : "default"}
                    sx={{ height: 22, fontSize: "0.65rem" }}
                  />
                ) : null}
                {canOpen ? (
                  <Tooltip title={S.FILE_OPEN}>
                    <IconButton size="small" onClick={() => handleOpen(index)}>
                      <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {!locked && ref.status === "failed" ? (
                  <Tooltip title={S.FILE_UPLOAD_RETRY}>
                    <IconButton size="small" onClick={() => handleRetry(index)}>
                      <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {!locked ? (
                  <Tooltip title={S.FILE_REMOVE}>
                    <IconButton size="small" onClick={() => void handleRemove(index)}>
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
          );
        })}

        {showEmpty ? (
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
            {emptyLabel ??
              (multiple ? S.FILE_EMPTY_ATTACHMENTS : S.FILE_EMPTY_ATTACHMENTS)}
          </Typography>
        ) : null}

        {!locked && (multiple || showEmpty) ? (
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={onPickClick}
            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
          >
            {showEmpty ? S.FILE_ADD : S.FILE_ADD_MORE}
          </Button>
        ) : null}
      </Stack>

      <FilePreviewDialog
        preview={filePreview}
        onClose={closeFilePreview}
        onDownload={downloadFilePreview}
      />
    </Box>
  );
};

export default CastingCuringFileField;
