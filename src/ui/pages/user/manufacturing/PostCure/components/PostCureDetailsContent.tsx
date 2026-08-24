import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getPostCureTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import { useAuthStore } from "../../../../../../app/store/authStore";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import {
  parseCasePrepFileRefs,
  type CasePrepFileRef,
} from "../../../../../../data/models/user/CasePrepMotorDataModel";
import {
  orderPostCureDisplayColumns,
  type PostCureDetailView,
  type PostCureMotorDetailView,
} from "../../../../../../data/models/user/PostCureFormModel";
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import { OPERATION_STATUS_UI_TO_API } from "../../../../../../hooks/operationStatus";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";

const API_OPERATION_STATUS_LABELS = Object.fromEntries(
  Object.entries(OPERATION_STATUS_UI_TO_API).map(([label, apiValue]) => [apiValue, label]),
);

const formatStatusLabel = (status?: string | null) => {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");
  return API_OPERATION_STATUS_LABELS[normalized] ?? raw;
};

const BL = STRINGS.SOURCING.BATCH_LIST;
const PC = STRINGS.MANUFACTURING.POST_CURE;

export type PostCureDetailsTheme = ReturnType<typeof getPostCureTheme>["details"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const looksLikePostCureFiles = (value: unknown): boolean => {
  if (value == null || value === "") return false;
  if (typeof value === "string") return false;
  if (Array.isArray(value)) {
    return value.some(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        ("fileId" in entry || "fileName" in entry || "mimeType" in entry),
    );
  }
  return (
    typeof value === "object" &&
    ("fileId" in (value as object) ||
      "fileName" in (value as object) ||
      "mimeType" in (value as object))
  );
};

const PostCureFileLinks = ({
  refs,
  subDepartmentId,
  onOpen,
}: {
  refs: CasePrepFileRef[];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (!refs.length) return <>{formatCasePrepCellValue(null)}</>;
  return (
    <Stack spacing={0.5}>
      {refs.map((ref, index) => {
        const fileId = String(ref.fileId ?? "").trim();
        const name = ref.fileName || "file";
        const canOpen = Boolean(fileId && subDepartmentId);
        return (
          <Stack
            key={ref.localId ?? `${fileId || name}-${index}`}
            direction="row"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {name}
            </Typography>
            {canOpen ? (
              <Link
                component="button"
                type="button"
                onClick={() => onOpen(fileId, name)}
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                  cursor: "pointer",
                }}
              >
                {PC.FILE_OPEN}
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};

const PostCureCellValue = ({
  value,
  subDepartmentId,
  onOpen,
}: {
  value: unknown;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (looksLikePostCureFiles(value)) {
    return (
      <PostCureFileLinks
        refs={parseCasePrepFileRefs(value)}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    );
  }
  return <>{formatCasePrepCellValue(value)}</>;
};


const FieldsTable = ({
  fields,
  dt,
  subDepartmentId,
  onOpen,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: PostCureDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (!fields.length) return null;

  return (
    <TableContainer sx={{ ...dt.tableContainer, mb: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={dt.tableHeaderCell(true)}>Parameter</TableCell>
            <TableCell sx={dt.tableHeaderCell(false)}>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={`${field.key}-${index}`} sx={dt.tableRow(index)}>
              <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>{field.label}</TableCell>
              <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                <PostCureCellValue
                  value={field.value}
                  subDepartmentId={subDepartmentId}
                  onOpen={onOpen}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DataTable = ({
  table,
  dt,
  subDepartmentId,
  onOpen,
}: {
  table: CasePrepDetailTable;
  dt: PostCureDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  const columns = orderPostCureDisplayColumns(Object.keys(table.columnLabels));
  if (!columns.length || !table.rows.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {table.label || formatCasePrepSectionLabel(table.blockId)}
      </Typography>
      <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: Math.max(720, columns.length * 120) }}>
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell key={column} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {table.columnLabels[column] ?? formatCasePrepSectionLabel(column)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.map((row, rowIndex) => {
              const headerLabel = String(row._headerLabel ?? "").trim();
              if (row.type === "header" && headerLabel) {
                return (
                  <TableRow key={rowIndex} sx={{ background: "rgba(21,101,192,0.06)" }}>
                    <TableCell
                      colSpan={columns.length}
                      sx={{ ...dt.tableCell, fontWeight: 700, fontSize: "0.72rem" }}
                    >
                      {headerLabel}
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                  {columns.map((column) => (
                    <TableCell key={column} sx={dt.tableCell}>
                      <PostCureCellValue
                        value={row[column]}
                        subDepartmentId={subDepartmentId}
                        onOpen={onOpen}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const SectionPanel = ({
  section,
  dt,
  subDepartmentId,
  onOpen,
}: {
  section: CasePrepDetailSection;
  dt: PostCureDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
      {section.label}
    </Typography>
    <FieldsTable
      fields={section.fields}
      dt={dt}
      subDepartmentId={subDepartmentId}
      onOpen={onOpen}
    />
    {section.tables.map((table) => (
      <DataTable
        key={table.blockId}
        table={table}
        dt={dt}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    ))}
  </Box>
);

export const MotorDetailPanel = ({
  motor,
  dt,
  palette,
  subDepartmentId,
  onOpen,
}: {
  motor: PostCureMotorDetailView;
  dt: PostCureDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip label={PC.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
        {motor.motorId}
      </Typography>
      {motor.motorReceiptDate ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          {PC.MOTOR_RECEIPT_DATE_LABEL}: {motor.motorReceiptDate}
        </Typography>
      ) : null}
      {motor.operationLabel ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          {PC.OPERATION_LABEL}: {motor.operationLabel}
        </Typography>
      ) : null}
    </Stack>

    {motor.sections.length === 0 ? (
      <Typography sx={dt.emptyText}>{PC.DETAILS_NO_MOTOR_DATA}</Typography>
    ) : (
      motor.sections.map((section) => (
        <SectionPanel
          key={section.sectionId}
          section={section}
          dt={dt}
          subDepartmentId={subDepartmentId}
          onOpen={onOpen}
        />
      ))
    )}
  </Box>
);

export type PostCureDetailsContentProps = {
  detailView: PostCureDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getManufacturingTheme>;
  resetOnFormId?: string | null;
};

const PostCureDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetOnFormId,
}: PostCureDetailsContentProps) => {
  const dt = getPostCureTheme(theme).details;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "post-cure-operations")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();
  const onOpenFile = (fileId: string, fileName: string) => {
    if (!subDepartmentId) return;
    void openFile(fileId, subDepartmentId, fileName);
  };

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe =
    motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;

  useEffect(() => {
    setActiveMotorIndex(0);
  }, [resetOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    {
      label: "Status",
      value: formatStatusLabel(detailView?.status || String(row?.pcStatus ?? row?.status ?? "")),
    },
    { label: BL.COL_CREATED_BY, value: detailView?.createdBy || "—" },
    { label: BL.COL_CREATED_ON, value: formatDateTime(detailView?.createdAt) },
    { label: "Submitted By", value: detailView?.submittedBy || "—" },
    { label: "Submitted On", value: formatDateTime(detailView?.submittedAt) },
    { label: "Last Updated By", value: detailView?.lastUpdatedBy || "—" },
    { label: "Last Updated On", value: formatDateTime(detailView?.lastUpdatedAt) },
  ];

  if (loading) {
    return (
      <Box sx={dt.loadingBox}>
        <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
        <Typography sx={dt.emptyText}>Loading details…</Typography>
      </Box>
    );
  }

  const hasMotorData = motors.some((motor) => motor.sections.length > 0);

  return (
    <>
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {PC.DETAILS_BATCH_SECTION}
        </Typography>
        <Box sx={dt.metaGrid}>
          {metaFields.map((field) => (
            <Box key={field.label} sx={dt.metaItem}>
              <Typography sx={dt.metaLabel}>{field.label}</Typography>
              <Typography sx={dt.metaValue}>{String(field.value ?? "—")}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {hasMotorData ? (
        <Box sx={{ ...dt.section, mb: 0 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {PC.DETAILS_FORM_SECTION}
          </Typography>

          {motors.length > 1 ? (
            <Box
              sx={{
                mb: 2,
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${theme.palette.border}`,
                background: theme.palette.surface,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: theme.palette.primary,
                  mb: 0.75,
                }}
              >
                {PC.MOTOR_NAV_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 1 }}>
                {PC.DETAILS_MOTOR_NAV_HINT}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {motors.map((motor, index) => (
                  <Button
                    key={motor.motorId}
                    size="small"
                    variant={index === activeMotorIndexSafe ? "contained" : "outlined"}
                    onClick={() => setActiveMotorIndex(index)}
                    sx={{
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    {motor.motorId}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}

          {activeMotor ? (
            <MotorDetailPanel
              motor={activeMotor}
              dt={dt}
              palette={theme.palette}
              subDepartmentId={subDepartmentId}
              onOpen={onOpenFile}
            />
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}

      <FilePreviewDialog
        preview={preview}
        onClose={closePreview}
        onDownload={downloadCurrent}
      />
    </>
  );
};

export default PostCureDetailsContent;
