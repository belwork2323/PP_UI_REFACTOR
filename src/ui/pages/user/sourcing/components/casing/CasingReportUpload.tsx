import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
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
import {
  REPORT_UPLOADS,
  type RocketMotorCasingFormData,
  type UploadedFileRef,
} from "@/data/models/user/RocketMotorCasingFormModel";
import { STRINGS } from "@/app/config/strings";

const S = STRINGS.SOURCING.CASING_CREATE;

const ACCEPT = "application/pdf,.pdf,image/*,video/*";
const MAX_SIZE_MB = 50;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

type ReportEntry = (typeof REPORT_UPLOADS)[number];
type FilesField = ReportEntry["filesField"];
type ExistingField = ReportEntry["existingField"];

type FileListItem = {
  id: string;
  name: string;
  sizeLabel?: string;
  url?: string;
  kind: "pending" | "existing";
  index: number;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdf = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);

const validateFile = (file: File): string | null => {
  if (file.size / (1024 * 1024) > MAX_SIZE_MB) {
    return `File exceeds ${MAX_SIZE_MB}MB limit`;
  }
  const ok =
    ALLOWED_IMAGE.includes(file.type) || ALLOWED_VIDEO.includes(file.type) || isPdf(file);
  if (!ok) return "Invalid format. Use PDF, JPG, PNG, WEBP, MP4, or WEBM.";
  return null;
};

const isWebUrl = (url?: string) => /^https?:\/\//i.test(String(url ?? "").trim());

const fileKey = (file: File) => `${file.name}::${file.size}::${file.lastModified}`;

function collectFiles(entry: ReportEntry, form: RocketMotorCasingFormData): FileListItem[] {
  const pending = (form[entry.filesField] as File[]) ?? [];
  const existing = (form[entry.existingField] as UploadedFileRef[]) ?? [];
  const items: FileListItem[] = [];

  existing.forEach((ref, index) => {
    if (!ref?.fileName) return;
    items.push({
      id: `existing-${entry.key}-${index}-${ref.fileUrl}`,
      name: ref.fileName,
      url: ref.fileUrl,
      kind: "existing",
      index,
    });
  });

  pending.forEach((file, index) => {
    items.push({
      id: `pending-${entry.key}-${index}-${fileKey(file)}`,
      name: file.name,
      sizeLabel: formatSize(file.size),
      kind: "pending",
      index,
    });
  });

  return items;
}

type CasingReportUploadProps = {
  form: RocketMotorCasingFormData;
  patch: (value: Partial<RocketMotorCasingFormData>) => void;
  theme: any;
};

const CasingReportUpload = ({ form, patch, theme }: CasingReportUploadProps) => {
  const palette = theme?.palette ?? {};
  const primary = palette.primaryLight ?? "#2E86C1";
  const text = palette.text ?? "#1C2833";
  const textSub = palette.textSub ?? "#5D6D7E";
  const border = palette.border ?? "#D5D8DC";
  const danger = palette.danger ?? "#C0392B";
  const accent = palette.accent ?? "#148F77";
  const surface = palette.surface ?? "#F4F6F8";

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const baseId = useId();

  const appendFiles = (filesField: FilesField, incoming: File[]) => {
    const current = ((form[filesField] as File[]) ?? []).slice();
    const seen = new Set(current.map(fileKey));
    for (const file of incoming) {
      const key = fileKey(file);
      if (seen.has(key)) continue;
      seen.add(key);
      current.push(file);
    }
    patch({ [filesField]: current } as Partial<RocketMotorCasingFormData>);
  };

  const removeItem = (entry: ReportEntry, item: FileListItem) => {
    if (item.kind === "pending") {
      const current = ((form[entry.filesField] as File[]) ?? []).slice();
      current.splice(item.index, 1);
      patch({ [entry.filesField]: current } as Partial<RocketMotorCasingFormData>);
      return;
    }
    const current = ((form[entry.existingField] as UploadedFileRef[]) ?? []).slice();
    current.splice(item.index, 1);
    patch({ [entry.existingField]: current } as Partial<RocketMotorCasingFormData>);
  };

  const handlePick = (entry: ReportEntry, event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;

    const invalid = picked.map(validateFile).find(Boolean) ?? null;
    if (invalid) {
      setRowErrors((prev) => ({ ...prev, [entry.key]: invalid }));
      return;
    }

    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[entry.key];
      return next;
    });
    appendFiles(entry.filesField, picked);
  };

  const headerCellSx = {
    ...theme.workflow?.formElements?.tableHeader,
    background: `linear-gradient(135deg, ${palette.primary ?? "#1B4F72"}, ${primary})`,
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
    ...theme.workflow?.formElements?.tableCell,
    py: 1.25,
    px: 1.5,
    verticalAlign: "middle" as const,
    borderBottom: `1px solid ${alpha(border, 0.55)}`,
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.72rem", color: textSub, mb: 1.25, lineHeight: 1.45 }}>
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
              <TableCell sx={{ ...headerCellSx, width: "48%" }}>
                {S.UPLOAD_REPORT_COL_FILES}
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: "22%", textAlign: "center" }}>
                {S.UPLOAD_REPORT_COL_ACTION}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {REPORT_UPLOADS.map((entry, index) => {
              const files = collectFiles(entry, form);
              const error = rowErrors[entry.key];
              const inputId = `${baseId}-${entry.key}`;
              const hasFiles = files.length > 0;

              return (
                <TableRow
                  key={entry.key}
                  sx={{
                    background: index % 2 === 0 ? surface : alpha(surface, 0.45),
                    "&:last-child td": { borderBottom: "none" },
                  }}
                >
                  <TableCell sx={bodyCellSx}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: text }}>
                      {entry.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: textSub, mt: 0.25 }}>
                      PDF, Image or Video · ≤{MAX_SIZE_MB}MB · multiple allowed
                    </Typography>
                  </TableCell>

                  <TableCell sx={bodyCellSx}>
                    {files.length === 0 ? (
                      <Typography sx={{ fontSize: "0.75rem", color: alpha(textSub, 0.85) }}>
                        {S.UPLOAD_REPORT_EMPTY}
                      </Typography>
                    ) : (
                      <Stack spacing={0.75}>
                        {files.map((item) => (
                          <Stack
                            key={item.id}
                            direction="row"
                            alignItems="center"
                            gap={1}
                            sx={{
                              px: 1,
                              py: 0.65,
                              borderRadius: 1.5,
                              border: `1px solid ${alpha(
                                item.kind === "pending" ? primary : accent,
                                0.28,
                              )}`,
                              background: alpha(
                                item.kind === "pending" ? primary : accent,
                                0.06,
                              ),
                            }}
                          >
                            <InsertDriveFileOutlinedIcon
                              sx={{
                                fontSize: 18,
                                color: item.kind === "pending" ? primary : accent,
                                flexShrink: 0,
                              }}
                            />
                            <Box flex={1} minWidth={0}>
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: text,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.name}
                              </Typography>
                              <Stack direction="row" alignItems="center" gap={0.75} mt={0.15}>
                                <Chip
                                  size="small"
                                  label={
                                    item.kind === "pending"
                                      ? S.UPLOAD_REPORT_PENDING
                                      : S.UPLOAD_REPORT_SAVED
                                  }
                                  sx={{
                                    height: 18,
                                    fontSize: "0.58rem",
                                    fontWeight: 700,
                                    background: alpha(
                                      item.kind === "pending" ? primary : accent,
                                      0.12,
                                    ),
                                    color: item.kind === "pending" ? primary : accent,
                                  }}
                                />
                                {item.sizeLabel ? (
                                  <Typography sx={{ fontSize: "0.62rem", color: textSub }}>
                                    {item.sizeLabel}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </Box>
                            {item.url && isWebUrl(item.url) ? (
                              <Tooltip title={S.OPEN_FILE}>
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: primary }}
                                >
                                  <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            <Tooltip title={S.REMOVE_FILE}>
                              <IconButton
                                size="small"
                                onClick={() => removeItem(entry, item)}
                                sx={{
                                  color: danger,
                                  "&:hover": { background: alpha(danger, 0.08) },
                                }}
                              >
                                <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                    {error ? (
                      <Typography
                        sx={{ fontSize: "0.68rem", color: danger, fontWeight: 600, mt: 0.75 }}
                      >
                        {error}
                      </Typography>
                    ) : null}
                  </TableCell>

                  <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
                    <input
                      id={inputId}
                      ref={(el) => {
                        inputRefs.current[entry.key] = el;
                      }}
                      type="file"
                      accept={ACCEPT}
                      multiple
                      hidden
                      onChange={(e) => handlePick(entry, e)}
                    />
                    <Stack alignItems="center" spacing={0.75}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={
                          hasFiles ? (
                            <AddRoundedIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <CloudUploadRoundedIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        onClick={() => inputRefs.current[entry.key]?.click()}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: 2,
                          borderColor: alpha(primary, 0.5),
                          color: primary,
                          px: 1.5,
                          whiteSpace: "nowrap",
                          "&:hover": { background: alpha(primary, 0.06) },
                        }}
                      >
                        {hasFiles ? S.UPLOAD_REPORT_ADD_MORE : S.UPLOAD_REPORT_ACTION}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CasingReportUpload;
