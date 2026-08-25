import { useId, useRef } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  REPORT_UPLOADS,
  type RocketMotorCasingFormData,
  type UploadedFileRef,
} from "@/data/models/user/RocketMotorCasingFormModel";
import { STRINGS } from "@/app/config/strings";
import { useCasingFileActions } from "@/hooks/user/sourcing/useCasingFileActions";
import FilePreviewDialog from "@/ui/components/common/FilePreviewDialog";

const S = STRINGS.SOURCING.CASING_CREATE;

type ReportEntry = (typeof REPORT_UPLOADS)[number];

type CasingReportUploadProps = {
  form: RocketMotorCasingFormData;
  patch: (value: Partial<RocketMotorCasingFormData>) => void;
  theme: any;
};

type ThemeColors = {
  primary: string;
  text: string;
  textSub: string;
  danger: string;
  accent: string;
};

const statusLabel = (ref: UploadedFileRef) => {
  if (ref.status === "uploading") return S.UPLOAD_REPORT_UPLOADING;
  if (ref.status === "failed") return S.UPLOAD_REPORT_FAILED;
  return S.UPLOAD_REPORT_SAVED;
};

const statusColor = (ref: UploadedFileRef, colors: ThemeColors) => {
  if (ref.status === "uploading") return colors.primary;
  if (ref.status === "failed") return colors.danger;
  return colors.accent;
};

const ReportRowFiles = ({
  entry,
  form,
  patch,
  colors,
}: {
  entry: ReportEntry;
  form: RocketMotorCasingFormData;
  patch: (value: Partial<RocketMotorCasingFormData>) => void;
  colors: ThemeColors;
}) => {
  const files = ((form[entry.existingField] as UploadedFileRef[]) ?? []).slice();
  const {
    handleFilesSelected,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview,
    closeFilePreview,
    downloadFilePreview,
  } = useCasingFileActions(files, (next) => {
    patch({
      [entry.existingField]: next,
      [entry.filesField]: [],
    } as Partial<RocketMotorCasingFormData>);
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  return (
    <>
      <Stack spacing={0.75}>
        {files.length === 0 ? (
          <Typography sx={{ fontSize: "0.75rem", color: alpha(colors.textSub, 0.85) }}>
            {S.UPLOAD_REPORT_EMPTY}
          </Typography>
        ) : (
          files.map((ref, index) => {
            const color = statusColor(ref, colors);
            const canOpen =
              Boolean(String(ref.fileId ?? "").trim()) ||
              /^https?:\/\//i.test(String(ref.fileUrl ?? ""));
            return (
              <Stack
                key={ref.localId ?? `${entry.key}-${index}-${ref.fileName}`}
                spacing={0.5}
                sx={{
                  px: 1,
                  py: 0.65,
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(color, 0.28)}`,
                  background: alpha(color, 0.06),
                }}
              >
                <Stack direction="row" alignItems="center" gap={1}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color, flexShrink: 0 }} />
                  <Box flex={1} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: colors.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ref.fileName}
                    </Typography>
                    <Chip
                      size="small"
                      label={statusLabel(ref)}
                      sx={{
                        height: 18,
                        mt: 0.25,
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        background: alpha(color, 0.12),
                        color,
                      }}
                    />
                  </Box>
                  {ref.status === "failed" ? (
                    <Tooltip title={S.UPLOAD_REPORT_RETRY}>
                      <IconButton
                        size="small"
                        onClick={() => handleRetry(index)}
                        sx={{ color: colors.primary }}
                      >
                        <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  {canOpen && ref.status !== "uploading" ? (
                    <Link
                      component="button"
                      type="button"
                      onClick={() => handleOpen(index)}
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.25,
                        cursor: "pointer",
                        color: colors.primary,
                        flexShrink: 0,
                      }}
                    >
                      {S.OPEN_FILE}
                      <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                    </Link>
                  ) : null}
                  <Tooltip title={S.REMOVE_FILE}>
                    <IconButton
                      size="small"
                      onClick={() => void handleRemove(index)}
                      disabled={ref.status === "uploading"}
                      sx={{
                        color: colors.danger,
                        "&:hover": { background: alpha(colors.danger, 0.08) },
                      }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {ref.status === "uploading" ? (
                  <LinearProgress
                    variant={
                      typeof ref.uploadProgress === "number" ? "determinate" : "indeterminate"
                    }
                    value={ref.uploadProgress ?? 0}
                    sx={{ height: 4, borderRadius: 1 }}
                  />
                ) : null}
              </Stack>
            );
          })
        )}
      </Stack>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
      <Box sx={{ mt: 0.75, textAlign: "center" }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={
            files.length ? (
              <AddRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <CloudUploadRoundedIcon sx={{ fontSize: 16 }} />
            )
          }
          onClick={() => inputRef.current?.click()}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.72rem",
            borderRadius: 2,
            borderColor: alpha(colors.primary, 0.5),
            color: colors.primary,
            px: 1.5,
            whiteSpace: "nowrap",
            "&:hover": { background: alpha(colors.primary, 0.06) },
          }}
        >
          {files.length ? S.UPLOAD_REPORT_ADD_MORE : S.UPLOAD_REPORT_ACTION}
        </Button>
      </Box>

      <FilePreviewDialog
        preview={filePreview}
        onClose={closeFilePreview}
        onDownload={downloadFilePreview}
        themeColor={colors.primary}
        themeColorLight={colors.primary}
      />
    </>
  );
};

const CasingReportUpload = ({ form, patch, theme }: CasingReportUploadProps) => {
  const palette = theme?.palette ?? {};
  const colors: ThemeColors = {
    primary: palette.primaryLight ?? "#2E86C1",
    text: palette.text ?? "#1C2833",
    textSub: palette.textSub ?? "#5D6D7E",
    danger: palette.danger ?? "#C0392B",
    accent: palette.accent ?? "#148F77",
  };
  const border = palette.border ?? "#D5D8DC";
  const surface = palette.surface ?? "#F4F6F8";

  const headerCellSx = {
    background: `linear-gradient(135deg, ${palette.primary ?? "#1B4F72"}, ${colors.primary})`,
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.68rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    py: 1.25,
    px: 1.5,
    borderBottom: "none",
  };

  const bodyCellSx = {
    py: 1.25,
    px: 1.5,
    verticalAlign: "top" as const,
    borderBottom: `1px solid ${alpha(border, 0.55)}`,
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.72rem", color: colors.textSub, mb: 1.25, lineHeight: 1.45 }}>
        {S.UPLOAD_REPORT_HINT}
      </Typography>

      <TableContainer
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(border, 0.7)}`,
          overflow: "hidden",
          background: palette.pageBg ?? "#fff",
        }}
      >
        <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, width: "30%" }}>
                {S.UPLOAD_REPORT_COL_TYPE}
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: "70%" }}>
                {S.UPLOAD_REPORT_COL_FILES}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {REPORT_UPLOADS.map((entry, index) => (
              <TableRow
                key={entry.key}
                sx={{
                  background: index % 2 === 0 ? surface : alpha(surface, 0.45),
                  "&:last-child td": { borderBottom: "none" },
                }}
              >
                <TableCell sx={bodyCellSx}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: colors.text }}>
                    {entry.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.65rem", color: colors.textSub, mt: 0.25 }}>
                    PDF, Image or Video · ≤50MB · multiple allowed
                  </Typography>
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  <ReportRowFiles entry={entry} form={form} patch={patch} colors={colors} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CasingReportUpload;
