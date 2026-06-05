import { useId, type ChangeEvent } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { fileUtils } from "../../../../../utils/FileUtils";
import CertificateFileInput from "./CertificateFileInput";
import type { LotCertificate } from "../../../../../data/models/user/RawMaterialProcurementModel";

const {
  delete: DeleteOutlineRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
  insertDriveFile: InsertDriveFileOutlinedIcon,
  openInNew: OpenInNewRoundedIcon,
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
      };
    };
  };
  onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onCertChange: (certIndex: number, field: keyof LotCertificate, value: string) => void;
  onRemove: (certIndex: number) => void;
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
}: CertificateUploadSectionProps) => {
  const certFileInputId = useId();
  const primaryLight = theme.palette.primaryLight ?? "#2E86C1";
  const hasCerts = certificates.length > 0;

  const uploadBtnSx = {
    textTransform: "none" as const,
    fontWeight: 700,
    flexShrink: 0,
    borderRadius: 2,
    borderColor: primaryLight,
    color: primaryLight,
    cursor: "pointer",
    "&:hover": { background: alpha(primaryLight, 0.06) },
  };

  const dropZoneSx = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    border: `2px dashed ${alpha(primaryLight, 0.35)}`,
    borderRadius: 2,
    py: 3,
    px: 2,
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.18s",
    "&:hover": {
      borderColor: alpha(primaryLight, 0.65),
      background: alpha(primaryLight, 0.04),
    },
  };

  const addMoreSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    px: 1.5,
    py: 1.1,
    borderRadius: 2,
    cursor: "pointer",
    border: `1.5px dashed ${alpha(primaryLight, 0.35)}`,
    transition: "all 0.18s",
    "&:hover": {
      borderColor: alpha(primaryLight, 0.65),
      background: alpha(primaryLight, 0.04),
    },
  };

  const certCardSx = {
    px: 1.5,
    py: 1.25,
    borderRadius: 2,
    background: alpha(theme.palette.surface ?? "#fff", theme.palette.mode === "dark" ? 0.35 : 1),
    border: `1px solid ${alpha(theme.palette.border ?? "#ccc", 0.55)}`,
    transition: "border-color 0.15s",
    "&:hover": { borderColor: alpha(primaryLight, 0.45) },
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderTop: `1px solid ${alpha(theme.palette.border ?? "#ccc", 0.5)}`,
        background: alpha(theme.palette.primary ?? "#1B4F72", 0.02),
      }}
    >
      <CertificateFileInput id={certFileInputId} onChange={onFilesSelected} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        gap={1}
        sx={{ mb: hasCerts ? 1.25 : 1.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: 0.5 }}>
            {formStrings.CERTIFICATES_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, lineHeight: 1.45, maxWidth: 520 }}>
            {formStrings.CERTIFICATES_SUBTITLE}
          </Typography>
        </Box>
        {hasCerts ? (
          <Button
            component="label"
            htmlFor={certFileInputId}
            variant="outlined"
            size="small"
            startIcon={<UploadFileRoundedIcon sx={{ fontSize: "17px !important" }} />}
            sx={uploadBtnSx}
          >
            {formStrings.UPLOAD_CERTIFICATES}
          </Button>
        ) : null}
      </Stack>

      {!hasCerts ? (
        <Box component="label" htmlFor={certFileInputId} sx={dropZoneSx}>
          <UploadFileRoundedIcon sx={{ fontSize: 32, color: alpha(primaryLight, 0.45), mb: 1 }} />
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.textSub }}>
            {formStrings.UPLOAD_CERTIFICATES}
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: alpha(theme.palette.textSub ?? "#5D6D7E", 0.85), mt: 0.5 }}>
            {formStrings.CERTIFICATES_SUBTITLE}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {certificates.map((cert, ci) => (
            <Box
              key={`${cert.fileName}-${ci}-${cert.fileUrl?.slice(0, 24) ?? ""}`}
              sx={certCardSx}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                alignItems={{ sm: "flex-start" }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: alpha(primaryLight, 0.1),
                      border: `1px solid ${alpha(primaryLight, 0.2)}`,
                    }}
                  >
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: primaryLight }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: theme.palette.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cert.fileName || formStrings.CERT_FILE_NAME}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
                      <Chip
                        label={fileExtensionLabel(cert.fileName || "file")}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          background: alpha(primaryLight, 0.1),
                          color: primaryLight,
                          border: `1px solid ${alpha(primaryLight, 0.22)}`,
                        }}
                      />
                      {fileUtils.isOpenableCertificateUrl(cert.fileUrl) ? (
                        <Tooltip title={formStrings.OPEN_CERT_LINK}>
                          <IconButton
                            size="small"
                            component="a"
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: primaryLight, p: 0.25 }}
                          >
                            <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </Box>
                </Stack>

                <Box sx={{ width: { xs: "100%", sm: 200 }, flexShrink: 0 }}>
                  <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: "4px" }}>
                    {formStrings.CERT_TYPE}
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={cert.certificateType}
                    onChange={(e) => onCertChange(ci, "certificateType", e.target.value)}
                    placeholder={formStrings.CERT_TYPE}
                    sx={theme.workflow.formElements.textField}
                  />
                </Box>

                <Tooltip title={formStrings.REMOVE_CERTIFICATE}>
                  <IconButton
                    size="small"
                    onClick={() => onRemove(ci)}
                    sx={{
                      alignSelf: { xs: "flex-end", sm: "center" },
                      flexShrink: 0,
                      color: theme.palette.textSub,
                      "&:hover": {
                        color: theme.palette.danger,
                        background: alpha(theme.palette.danger ?? "#C0392B", 0.08),
                      },
                    }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}

          <Box component="label" htmlFor={certFileInputId} sx={addMoreSx}>
            <UploadFileRoundedIcon sx={{ fontSize: 17, color: alpha(primaryLight, 0.75) }} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: primaryLight }}>
              {formStrings.ADD_MORE_CERTIFICATES}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default CertificateUploadSection;
