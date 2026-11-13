import {
  Box,
  Chip,
  FormHelperText,
  IconButton,
  LinearProgress,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

import type { DocumentUploadTheme } from "@app/theme/custom_themes/shared/documentUpload_theme";
import { fileUtils } from "@utils/FileUtils";
import AppTextField from "@ui/components/common/AppTextField";
import {
  mandatoryAsteriskSx,
  mandatoryFieldInputSx,
} from "@ui/components/validation/ValidatedFormField";
import type { DocumentUploadItem, DocumentUploadStrings } from "./DocumentUploadSection";

const fileExtensionLabel = (fileName: string) => {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const parts = base.split(".");
  if (parts.length < 2) return "FILE";
  return parts.pop()!.toUpperCase().slice(0, 8);
};

type DocumentUploadRowProps = {
  item: DocumentUploadItem;
  strings: DocumentUploadStrings;
  styles: DocumentUploadTheme;
  fieldLabelSx: object;
  typeError?: string;
  typeFieldPath?: string;
  onTypeChange: (value: string) => void;
  onRemove: () => void;
  onRetry?: () => void;
  onOpen?: () => void;
};

/** One uploaded document: file info, upload progress, document type input, remove / retry. */
const DocumentUploadRow = ({
  item,
  strings,
  styles,
  fieldLabelSx,
  typeError,
  typeFieldPath,
  onTypeChange,
  onRemove,
  onRetry,
  onOpen,
}: DocumentUploadRowProps) => {
  const { row } = styles;
  const isUploading = item.status === "uploading";
  const FileIcon = isUploading ? UploadFileRoundedIcon : InsertDriveFileOutlinedIcon;

  return (
    <Box sx={row.card}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.85} alignItems={{ sm: "center" }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={row.fileIconBox}>
            <FileIcon sx={row.fileIcon} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={row.fileName}>{item.fileName || strings.CERT_FILE_NAME}</Typography>
            <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap" sx={row.metaLine}>
              <Chip
                label={fileExtensionLabel(item.fileName || "file")}
                size="small"
                sx={row.extensionChip}
              />
              {item.status === "failed" ? (
                <Chip label={strings.STATUS_FAILED} size="small" sx={row.failedChip} />
              ) : null}
              {item.fileId && onOpen ? (
                <Link component="button" type="button" onClick={onOpen} sx={row.fileLink}>
                  {fileUtils.getFileKind(item.fileName) === "video"
                    ? "Download"
                    : strings.OPEN_CERT_LINK}
                  <OpenInNewRoundedIcon sx={row.fileLinkIcon} />
                </Link>
              ) : fileUtils.isOpenableCertificateUrl(item.fileUrl) ? (
                <Link
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={row.fileLink}
                >
                  {strings.OPEN_CERT_LINK}
                  <OpenInNewRoundedIcon sx={row.fileLinkIcon} />
                </Link>
              ) : null}
            </Stack>
            {isUploading ? (
              <Box sx={row.progressBox}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <LinearProgress
                    variant="determinate"
                    value={item.uploadProgress ?? 0}
                    sx={row.progressBar}
                  />
                  <Typography sx={row.progressValue}>{item.uploadProgress ?? 0}%</Typography>
                </Stack>
                <Typography sx={row.progressLabel}>{strings.UPLOADING}</Typography>
              </Box>
            ) : null}
          </Box>
        </Stack>

        <Box sx={row.typeFieldBox} data-rms-field={typeFieldPath}>
          <Typography sx={fieldLabelSx}>
            {strings.CERT_TYPE}
            <Box component="span" sx={mandatoryAsteriskSx(styles.validationTheme)}>
              {" "}
              *
            </Box>
          </Typography>
          <AppTextField
            compact
            value={item.certificateType}
            onChange={(event) => onTypeChange(event.target.value)}
            placeholder={strings.CERT_TYPE}
            error={Boolean(typeError)}
            sx={mandatoryFieldInputSx(row.typeField, Boolean(typeError), styles.validationTheme)}
          />
          {typeError ? (
            <FormHelperText error sx={row.typeError}>
              {typeError}
            </FormHelperText>
          ) : null}
        </Box>

        <Tooltip title={strings.REMOVE_CERTIFICATE}>
          <span>
            <IconButton size="small" onClick={onRemove} disabled={isUploading} sx={row.removeButton}>
              <DeleteOutlineRoundedIcon sx={row.actionIcon} />
            </IconButton>
          </span>
        </Tooltip>
        {item.status === "failed" && item.file && onRetry ? (
          <Tooltip title={strings.REUPLOAD_CERTIFICATE}>
            <IconButton size="small" onClick={onRetry} sx={row.retryButton}>
              <RefreshRoundedIcon sx={row.actionIcon} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
    </Box>
  );
};

export default DocumentUploadRow;
