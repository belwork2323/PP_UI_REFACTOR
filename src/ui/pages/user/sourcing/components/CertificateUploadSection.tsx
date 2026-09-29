import { useId, type ChangeEvent } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  FormHelperText,
  IconButton,
  LinearProgress,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { fileUtils } from "../../../../../utils/FileUtils";
import CertificateFileInput from "./CertificateFileInput";
import type { LotCertificate } from "../../../../../data/models/user/RawMaterialProcurementModel";
import { mandatoryAsteriskSx, mandatoryFieldInputSx } from "./MandatoryFormField";

const {
  delete: DeleteOutlineRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
  insertDriveFile: InsertDriveFileOutlinedIcon,
  openInNew: OpenInNewRoundedIcon,
  refresh: RefreshRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

export type CertificateUploadStrings = {
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

type CertificateUploadSectionProps = {
  certificates: LotCertificate[];
  formStrings: CertificateUploadStrings;
  theme: {
    palette: {
      primary?: string;
      primaryLight?: string;
      text?: string;
      textSub?: string;
      border?: string;
      surface?: string;
      danger?: string;
      mode?: string;
    };
    workflow: {
      formElements: {
        fieldLabel: object;
        textField: object;
        cellField?: object;
      };
    };
  };
  onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onCertChange: (certIndex: number, field: keyof LotCertificate, value: string) => void;
  onRemove: (certIndex: number) => void;
  onRetry?: (certIndex: number) => void;
  onOpen?: (certIndex: number) => void;
  error?: string;
  certificatesFieldPath?: string;
  certificateTypeFieldPath?: (certIndex: number) => string;
  certificateTypeError?: (certIndex: number) => string | undefined;
};

function fileExtensionLabel(fileName: string) {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const parts = base.split(".");
  if (parts.length < 2) return "FILE";
  return parts.pop()!.toUpperCase().slice(0, 8);
}

const CertificateUploadSection = ({
  certificates,
  formStrings,
  theme,
  onFilesSelected,
  onCertChange,
  onRemove,
  onRetry,
  onOpen,
  error,
  certificatesFieldPath,
  certificateTypeFieldPath,
  certificateTypeError,
}: CertificateUploadSectionProps) => {
  const certFileInputId = useId();
  const primaryLight = theme.palette.primaryLight ?? "#2E86C1";
  const hasCerts = certificates.length > 0;
  const sectionErrorSx = {
    fontSize: "0.6rem",
    fontWeight: 500,
    color: theme.palette.danger,
    mt: 0.35,
    lineHeight: 1.35,
  };

  const uploadBtnSx = {
    textTransform: "none" as const,
    fontWeight: 600,
    fontSize: "0.68rem",
    flexShrink: 0,
    borderRadius: 1,
    borderColor: primaryLight,
    color: primaryLight,
    cursor: "pointer",
    py: 0.25,
    px: 1,
    minHeight: 28,
    "&:hover": { background: alpha(primaryLight, 0.06) },
  };

  const dropZoneSx = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    border: `1.5px dashed ${alpha(primaryLight, 0.35)}`,
    borderRadius: 1,
    py: 1.5,
    px: 1.5,
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.18s",
    background: "#fff",
    "&:hover": {
      borderColor: alpha(primaryLight, 0.65),
      background: alpha(primaryLight, 0.03),
    },
  };

  const addMoreSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0.5,
    px: 1,
    py: 0.65,
    borderRadius: 1,
    cursor: "pointer",
    border: `1.5px dashed ${alpha(primaryLight, 0.35)}`,
    transition: "all 0.18s",
    background: "#fff",
    "&:hover": {
      borderColor: alpha(primaryLight, 0.65),
      background: alpha(primaryLight, 0.03),
    },
  };

  const certCardSx = {
    px: 1,
    py: 0.75,
    borderRadius: 1,
    background: "#fff",
    border: `1px solid ${alpha(theme.palette.border ?? "#ccc", 0.85)}`,
  };

  const certTypeFieldSx = {
    ...(theme.workflow.formElements.cellField ?? theme.workflow.formElements.textField),
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      background: "#fff",
      minHeight: 32,
      borderRadius: 1,
      fontSize: "0.72rem",
      "&.Mui-focused": { backgroundColor: "#fff", background: "#fff" },
    },
    "& .MuiInputBase-input": {
      fontSize: "0.72rem",
      fontWeight: 500,
      padding: "4px 8px",
      backgroundColor: "#fff",
    },
  };

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderTop: `1px solid ${alpha(theme.palette.border ?? "#ccc", 0.5)}`,
      }}
    >
      <CertificateFileInput id={certFileInputId} onChange={onFilesSelected} />

      <Box data-rms-field={certificatesFieldPath}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        gap={0.75}
        sx={{ mb: hasCerts ? 0.85 : 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={theme.workflow.formElements.fieldLabel}>
            {formStrings.CERTIFICATES_TITLE}
            <Box component="span" sx={mandatoryAsteriskSx(theme)}>
              {" "}
              *
            </Box>
          </Typography>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: theme.palette.textSub,
              lineHeight: 1.4,
              maxWidth: 480,
            }}
          >
            {formStrings.CERTIFICATES_SUBTITLE}
          </Typography>
          {error ? <Typography sx={sectionErrorSx}>{error}</Typography> : null}
        </Box>
        {hasCerts ? (
          <Button
            component="label"
            htmlFor={certFileInputId}
            variant="outlined"
            size="small"
            startIcon={<UploadFileRoundedIcon sx={{ fontSize: "14px !important" }} />}
            sx={uploadBtnSx}
          >
            {formStrings.UPLOAD_CERTIFICATES}
          </Button>
        ) : null}
      </Stack>

      {!hasCerts ? (
        <Box component="label" htmlFor={certFileInputId} sx={dropZoneSx}>
          <UploadFileRoundedIcon sx={{ fontSize: 22, color: alpha(primaryLight, 0.45), mb: 0.5 }} />
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: theme.palette.textSub }}>
            {formStrings.UPLOAD_CERTIFICATES}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: alpha(theme.palette.textSub ?? "#5D6D7E", 0.85),
              mt: 0.25,
            }}
          >
            {formStrings.CERTIFICATES_SUBTITLE}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.65}>
          {certificates.map((cert, ci) => {
            const typeError = certificateTypeError?.(ci);
            return (
              <Box
                key={cert.localId || `${cert.fileName}-${ci}-${cert.fileId ?? ""}`}
                sx={certCardSx}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.85}
                  alignItems={{ sm: "center" }}
                >
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: 0.75,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: alpha(primaryLight, 0.08),
                        border: `1px solid ${alpha(primaryLight, 0.18)}`,
                      }}
                    >
                      {cert.status === "uploading" ? (
                        <UploadFileRoundedIcon sx={{ fontSize: 15, color: primaryLight }} />
                      ) : (
                        <InsertDriveFileOutlinedIcon sx={{ fontSize: 15, color: primaryLight }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 500,
                          color: theme.palette.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.3,
                        }}
                      >
                        {cert.fileName || formStrings.CERT_FILE_NAME}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.5}
                        flexWrap="wrap"
                        sx={{ mt: 0.25 }}
                      >
                        <Chip
                          label={fileExtensionLabel(cert.fileName || "file")}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            background: alpha(primaryLight, 0.1),
                            color: primaryLight,
                            border: `1px solid ${alpha(primaryLight, 0.22)}`,
                            "& .MuiChip-label": { px: 0.6 },
                          }}
                        />
                        {cert.status === "failed" ? (
                          <Chip
                            label={formStrings.STATUS_FAILED}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.55rem",
                              fontWeight: 700,
                              color: theme.palette.danger,
                              "& .MuiChip-label": { px: 0.6 },
                            }}
                          />
                        ) : null}
                        {cert.fileId && onOpen ? (
                          <Link
                            component="button"
                            type="button"
                            onClick={() => onOpen(ci)}
                            sx={{
                              fontSize: "0.62rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.2,
                              cursor: "pointer",
                              color: primaryLight,
                            }}
                          >
                            {fileUtils.getFileKind(cert.fileName) === "video"
                              ? "Download"
                              : formStrings.OPEN_CERT_LINK}
                            <OpenInNewRoundedIcon sx={{ fontSize: 11 }} />
                          </Link>
                        ) : fileUtils.isOpenableCertificateUrl(cert.fileUrl) ? (
                          <Link
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: "0.62rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.2,
                              color: primaryLight,
                            }}
                          >
                            {formStrings.OPEN_CERT_LINK}
                            <OpenInNewRoundedIcon sx={{ fontSize: 11 }} />
                          </Link>
                        ) : null}
                      </Stack>
                      {cert.status === "uploading" ? (
                        <Box sx={{ mt: 0.5 }}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <LinearProgress
                              variant="determinate"
                              value={cert.uploadProgress ?? 0}
                              sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: alpha(primaryLight, 0.12),
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 2,
                                  bgcolor: primaryLight,
                                },
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                color: primaryLight,
                                minWidth: 28,
                                textAlign: "right",
                              }}
                            >
                              {cert.uploadProgress ?? 0}%
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{ fontSize: "0.58rem", color: theme.palette.textSub, mt: 0.2 }}
                          >
                            {formStrings.UPLOADING}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>
                  </Stack>

                  <Box
                    sx={{ width: { xs: "100%", sm: 160 }, flexShrink: 0 }}
                    data-rms-field={certificateTypeFieldPath?.(ci)}
                  >
                    <Typography sx={theme.workflow.formElements.fieldLabel}>
                      {formStrings.CERT_TYPE}
                      <Box component="span" sx={mandatoryAsteriskSx(theme)}>
                        {" "}
                        *
                      </Box>
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={cert.certificateType}
                      onChange={(e) => onCertChange(ci, "certificateType", e.target.value)}
                      placeholder={formStrings.CERT_TYPE}
                      error={Boolean(typeError)}
                      sx={mandatoryFieldInputSx(certTypeFieldSx, Boolean(typeError), theme)}
                    />
                    {typeError ? (
                      <FormHelperText
                        error
                        sx={{ mx: 0, mt: 0.25, fontSize: "0.6rem", fontWeight: 500 }}
                      >
                        {typeError}
                      </FormHelperText>
                    ) : null}
                  </Box>

                  <Tooltip title={formStrings.REMOVE_CERTIFICATE}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onRemove(ci)}
                        disabled={cert.status === "uploading"}
                        sx={{
                          alignSelf: { xs: "flex-end", sm: "center" },
                          flexShrink: 0,
                          p: 0.5,
                          color: theme.palette.textSub,
                          "&:hover": {
                            color: theme.palette.danger,
                            background: alpha(theme.palette.danger ?? "#C0392B", 0.08),
                          },
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {cert.status === "failed" && cert.file && onRetry ? (
                    <Tooltip title={formStrings.REUPLOAD_CERTIFICATE}>
                      <IconButton
                        size="small"
                        onClick={() => onRetry(ci)}
                        sx={{
                          alignSelf: { xs: "flex-end", sm: "center" },
                          flexShrink: 0,
                          p: 0.5,
                          color: primaryLight,
                        }}
                      >
                        <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Stack>
              </Box>
            );
          })}

          <Box component="label" htmlFor={certFileInputId} sx={addMoreSx}>
            <UploadFileRoundedIcon sx={{ fontSize: 14, color: alpha(primaryLight, 0.75) }} />
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: primaryLight }}>
              {formStrings.ADD_MORE_CERTIFICATES}
            </Typography>
          </Box>
        </Stack>
      )}
      </Box>
    </Box>
  );
};

export default CertificateUploadSection;
