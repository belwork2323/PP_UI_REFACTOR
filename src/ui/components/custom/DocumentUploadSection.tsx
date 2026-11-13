import { useId, useMemo, type ChangeEvent } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

import {
  getDocumentUploadTheme,
  type DocumentUploadPalette,
} from "@app/theme/custom_themes/shared/documentUpload_theme";
import HiddenFileInput from "@ui/components/common/HiddenFileInput";
import { mandatoryAsteriskSx } from "@ui/components/validation/ValidatedFormField";
import DocumentUploadRow from "./DocumentUploadRow";

export type DocumentUploadItem = {
  localId?: string;
  fileId?: string | null;
  fileName: string;
  fileUrl: string;
  status?: "uploading" | "uploaded" | "failed";
  uploadProgress?: number;
  file?: File | null;
  /** Free-text document type entered by the user (mandatory). */
  certificateType: string;
};

export type DocumentUploadStrings = {
  CERTIFICATES_TITLE: string;
  CERTIFICATES_SUBTITLE: string;
  CERT_FILE_NAME: string;
  CERT_TYPE: string;
  UPLOAD_CERTIFICATES: string;
  ADD_MORE_CERTIFICATES: string;
  OPEN_CERT_LINK: string;
  REMOVE_CERTIFICATE: string;
  UPLOADING: string;
  STATUS_FAILED: string;
  REUPLOAD_CERTIFICATE: string;
};

type DocumentUploadSectionProps = {
  items: DocumentUploadItem[];
  strings: DocumentUploadStrings;
  theme: {
    palette: DocumentUploadPalette;
    workflow: { formElements: { fieldLabel: object; textField: object; cellField?: object } };
  };
  onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onRetry?: (index: number) => void;
  onOpen?: (index: number) => void;
  error?: string;
  /** `data-rms-field` anchors used to scroll to validation errors. */
  fieldPath?: string;
  typeFieldPath?: (index: number) => string;
  typeError?: (index: number) => string | undefined;
};

/** Mandatory multi-file document upload with a per-file document type. */
const DocumentUploadSection = ({
  items,
  strings,
  theme,
  onFilesSelected,
  onTypeChange,
  onRemove,
  onRetry,
  onOpen,
  error,
  fieldPath,
  typeFieldPath,
  typeError,
}: DocumentUploadSectionProps) => {
  const inputId = useId();
  const { formElements } = theme.workflow;
  const styles = useMemo(
    () =>
      getDocumentUploadTheme(theme.palette, formElements.cellField ?? formElements.textField),
    [theme.palette, formElements],
  );
  const hasItems = items.length > 0;

  return (
    <Box sx={styles.root}>
      <HiddenFileInput id={inputId} onChange={onFilesSelected} />

      <Box data-rms-field={fieldPath}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={0.75}
          sx={styles.header(hasItems)}
        >
          <Box sx={styles.headerText}>
            <Typography sx={formElements.fieldLabel}>
              {strings.CERTIFICATES_TITLE}
              <Box component="span" sx={mandatoryAsteriskSx(styles.validationTheme)}>
                {" "}
                *
              </Box>
            </Typography>
            <Typography sx={styles.subtitle}>{strings.CERTIFICATES_SUBTITLE}</Typography>
            {error ? <Typography sx={styles.sectionError}>{error}</Typography> : null}
          </Box>
          {hasItems ? (
            <Button
              component="label"
              htmlFor={inputId}
              variant="outlined"
              size="small"
              startIcon={<UploadFileRoundedIcon sx={styles.uploadButtonIcon} />}
              sx={styles.uploadButton}
            >
              {strings.UPLOAD_CERTIFICATES}
            </Button>
          ) : null}
        </Stack>

        {!hasItems ? (
          <Box component="label" htmlFor={inputId} sx={styles.dropZone}>
            <UploadFileRoundedIcon sx={styles.dropZoneIcon} />
            <Typography sx={styles.dropZoneTitle}>{strings.UPLOAD_CERTIFICATES}</Typography>
            <Typography sx={styles.dropZoneSubtitle}>{strings.CERTIFICATES_SUBTITLE}</Typography>
          </Box>
        ) : (
          <Stack spacing={0.65}>
            {items.map((item, index) => (
              <DocumentUploadRow
                key={item.localId || `${item.fileName}-${index}-${item.fileId ?? ""}`}
                item={item}
                strings={strings}
                styles={styles}
                fieldLabelSx={formElements.fieldLabel}
                typeError={typeError?.(index)}
                typeFieldPath={typeFieldPath?.(index)}
                onTypeChange={(value) => onTypeChange(index, value)}
                onRemove={() => onRemove(index)}
                onRetry={onRetry ? () => onRetry(index) : undefined}
                onOpen={onOpen ? () => onOpen(index) : undefined}
              />
            ))}

            <Box component="label" htmlFor={inputId} sx={styles.addMore}>
              <UploadFileRoundedIcon sx={styles.addMoreIcon} />
              <Typography sx={styles.addMoreText}>{strings.ADD_MORE_CERTIFICATES}</Typography>
            </Box>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default DocumentUploadSection;
