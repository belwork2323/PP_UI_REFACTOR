import { useMemo } from "react";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import MediaUpload from "../../../../../components/common/MediaUpload";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import type { UploadedFileRef } from "../../../../../../data/models/user/RocketMotorCasingFormModel";
import { FILE_PICKER_ACCEPT } from "../../../../../../utils/FileUtils";
import { useCasingFileActions } from "../../../../../../hooks/user/sourcing/useCasingFileActions";
import { STRINGS } from "../../../../../../app/config/strings";

const S = STRINGS.SOURCING.CASING_CREATE;

type CasingInsulationReportUploadProps = {
  existing: UploadedFileRef | null;
  onChange: (next: UploadedFileRef | null) => void;
  label?: string;
  description?: string;
};

const CasingInsulationReportUpload = ({
  existing,
  onChange,
  label = S.REPORT_UPLOAD,
  description = "PDF or image",
}: CasingInsulationReportUploadProps) => {
  const files = useMemo(() => (existing ? [existing] : []), [existing]);
  const {
    uploadSingleFile,
    handleRemove,
    handleOpen,
    filePreview,
    closeFilePreview,
    downloadFilePreview,
  } = useCasingFileActions(files, (next) => onChange(next[0] ?? null));

  const isUploading = existing?.status === "uploading";
  const isFailed = existing?.status === "failed";

  return (
    <Box>
      <MediaUpload
        value={null}
        onChange={(file) => uploadSingleFile(file)}
        existingFile={
          existing && existing.status !== "uploading" && existing.status !== "failed"
            ? {
                fileName: existing.fileName,
                fileUrl: existing.fileUrl,
                mimeType: existing.mimeType,
              }
            : null
        }
        onClearExisting={() => void handleRemove(0)}
        label={label}
        description={description}
        accept={FILE_PICKER_ACCEPT.IMAGE_PDF}
        uploadedFileLabel={S.UPLOADED_FILE_LABEL}
        changeFileLabel={S.CHANGE_FILE}
        removeFileLabel={S.REMOVE_FILE}
        openFileLabel={S.OPEN_FILE}
        pendingUploadHint={S.PENDING_UPLOAD_HINT}
      />
      {existing && String(existing.fileId ?? "").trim() && existing.status === "uploaded" ? (
        <Button
          size="small"
          onClick={() => handleOpen(0)}
          sx={{ mt: 0.75, textTransform: "none", fontWeight: 700 }}
        >
          {S.OPEN_FILE}
        </Button>
      ) : null}
      {isUploading ? (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.5 }}>
            {S.UPLOAD_REPORT_UPLOADING}
          </Typography>
          <LinearProgress
            variant={
              typeof existing?.uploadProgress === "number" ? "determinate" : "indeterminate"
            }
            value={existing?.uploadProgress ?? 0}
            sx={{ height: 4, borderRadius: 1 }}
          />
        </Box>
      ) : null}
      {isFailed ? (
        <Typography sx={{ mt: 0.75, fontSize: "0.72rem", fontWeight: 600, color: "error.main" }}>
          {S.UPLOAD_REPORT_FAILED}
        </Typography>
      ) : null}
      <FilePreviewDialog
        preview={filePreview}
        onClose={closeFilePreview}
        onDownload={downloadFilePreview}
      />
    </Box>
  );
};

export default CasingInsulationReportUpload;
