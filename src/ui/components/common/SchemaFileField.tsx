import { memo, useId, useRef, type ChangeEvent } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import {
  FILE_PICKER_ACCEPT,
  fileNameMatchesAccept,
} from "../../../utils/FileUtils";
import { schemaFieldLabelProps } from "./fieldStyles";

const BRAND = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  accent: "#148F77",
  danger: "#C0392B",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

export const parseSchemaFileList = (value: string): string[] =>
  String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export const joinSchemaFileList = (files: string[]): string => files.join(", ");

const isImageName = (name: string) => /\.(png|jpe?g|webp|gif|bmp)$/i.test(name);
const isVideoName = (name: string) => /\.(mp4|webm|mov|avi)$/i.test(name);
const isPdfName = (name: string) => /\.pdf$/i.test(name);

const resolveFileType = (name: string) => {
  if (isImageName(name)) return { label: "Image", Icon: ImageRoundedIcon };
  if (isVideoName(name)) return { label: "Video", Icon: VideocamRoundedIcon };
  if (isPdfName(name)) return { label: "PDF", Icon: InsertDriveFileOutlinedIcon };
  return { label: "File", Icon: InsertDriveFileOutlinedIcon };
};

type SchemaFileFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** Used for post-pick filtering only — not set on the native input (keeps picker fast). */
  accept?: string;
  helperText?: string;
  compact?: boolean;
  multiple?: boolean;
  addLabel?: string;
  emptyLabel?: string;
};

const FileListItem = ({
  name,
  compact,
  onRemove,
}: {
  name: string;
  compact?: boolean;
  onRemove?: () => void;
}) => {
  const { label, Icon } = resolveFileType(name);

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={compact ? 0.75 : 1}
      sx={{
        px: compact ? 0.85 : 1.1,
        py: compact ? 0.55 : 0.75,
        borderRadius: compact ? 1.5 : 2,
        background: alpha(BRAND.primaryLight, 0.06),
        border: `1px solid ${alpha(BRAND.primaryLight, 0.18)}`,
      }}
    >
      <Box
        sx={{
          width: compact ? 30 : 36,
          height: compact ? 30 : 36,
          borderRadius: 1.25,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: alpha(BRAND.accent, 0.1),
          border: `1px solid ${alpha(BRAND.accent, 0.18)}`,
        }}
      >
        <Icon sx={{ fontSize: compact ? 16 : 18, color: BRAND.accent }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
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
          {name}
        </Typography>
        <Chip
          label={label}
          size="small"
          sx={{
            mt: 0.25,
            height: 18,
            fontSize: "0.58rem",
            fontWeight: 700,
            background: alpha(BRAND.accent, 0.1),
            color: BRAND.accent,
          }}
        />
      </Box>
      {onRemove ? (
        <Tooltip title="Remove file">
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{ color: BRAND.danger, p: 0.35, flexShrink: 0 }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: compact ? 15 : 17 }} />
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
};

const SchemaFileField = ({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  accept = FILE_PICKER_ACCEPT.IMAGE_VIDEO,
  helperText,
  compact = false,
  multiple = true,
  addLabel,
  emptyLabel,
}: SchemaFileFieldProps) => {
  const isLocked = disabled || readOnly;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const files = parseSchemaFileList(value);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
      .map((file) => file.name)
      .filter((name) => fileNameMatchesAccept(name, accept));
    event.target.value = "";
    if (!picked.length) return;
    const next = multiple ? [...files, ...picked] : picked.slice(0, 1);
    onChange(joinSchemaFileList(next));
  };

  const handleRemove = (index: number) => {
    onChange(joinSchemaFileList(files.filter((_, idx) => idx !== index)));
  };

  const openPicker = () => {
    const input = inputRef.current;
    if (!input || disabled) return;
    // Reset before open so re-selecting the same file still fires change.
    input.value = "";
    input.click();
  };

  const uploadLabel =
    addLabel ?? (files.length ? "Add another file" : emptyLabel ?? label ?? "Choose file");

  return (
    <Box sx={{ width: "100%" }}>
      {label && !compact ? (
        <Typography
          component="label"
          htmlFor={inputId}
          sx={{
            ...schemaFieldLabelProps.sx,
            display: "block",
            color: BRAND.textSub,
          }}
        >
          {label}
        </Typography>
      ) : null}

      {files.length > 0 ? (
        <Stack spacing={compact ? 0.5 : 0.75} sx={{ mb: compact ? 0.75 : 1 }}>
          {files.map((name, index) => (
            <FileListItem
              key={`${name}-${index}`}
              name={name}
              compact={compact}
              onRemove={isLocked ? undefined : () => handleRemove(index)}
            />
          ))}
        </Stack>
      ) : isLocked ? (
        <Typography sx={{ fontSize: compact ? "0.72rem" : "0.78rem", color: BRAND.textSub, fontStyle: "italic" }}>
          {readOnly ? "—" : "No files uploaded"}
        </Typography>
      ) : null}

      {/*
        Keep the native input outside MUI Button and omit `accept`.
        Accept filtering on Linux portal dialogs is a major open-latency source.
      */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple={multiple}
        disabled={isLocked}
        onChange={handleInputChange}
        style={{ display: "none" }}
        tabIndex={-1}
      />

      {!isLocked ? (
        <Button
          type="button"
          variant="outlined"
          fullWidth={!compact}
          size={compact ? "small" : "medium"}
          disableRipple
          disableTouchRipple
          onClick={openPicker}
          startIcon={<CloudUploadRoundedIcon sx={{ fontSize: compact ? 16 : 18 }} />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: compact ? "0.72rem" : "0.78rem",
            borderRadius: 2,
            borderStyle: "dashed",
            borderColor: alpha(BRAND.primaryLight, 0.45),
            color: BRAND.primary,
            py: compact ? 0.65 : 1.1,
            px: compact ? 1 : 1.5,
            backgroundColor: alpha(BRAND.primaryLight, 0.03),
            "&:hover": {
              borderStyle: "solid",
              backgroundColor: alpha(BRAND.primaryLight, 0.06),
            },
          }}
        >
          {uploadLabel}
        </Button>
      ) : null}

      {helperText ? (
        <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub, mt: 0.6, lineHeight: 1.35 }}>
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
};

export default memo(SchemaFileField);
