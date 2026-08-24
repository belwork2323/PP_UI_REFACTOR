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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
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
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import {
  orderCastingCuringDisplayColumns,
  type CastingCuringDetailView,
  type CastingCuringMotorDetailView,
  type CastingCuringMotorSubmissionStatus,
} from "../../../../../../data/models/user/CastingCuringFormModel";
import { alpha } from "@mui/material";

const BL = STRINGS.SOURCING.BATCH_LIST;
const CC = STRINGS.MANUFACTURING.CASTING_CURING;

const looksLikeCastingCuringFiles = (value: unknown): boolean => {
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

const CastingCuringFileLinks = ({
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
                {CC.FILE_OPEN}
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};

const CastingCuringCellValue = ({
  value,
  subDepartmentId,
  onOpen,
}: {
  value: unknown;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (looksLikeCastingCuringFiles(value)) {
    return (
      <CastingCuringFileLinks
        refs={parseCasePrepFileRefs(value)}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    );
  }
  return <>{formatCasePrepCellValue(value)}</>;
};


const MOTOR_STATUS_CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  TO_BE_INITIATED: { bg: "rgba(120,120,120,0.1)", color: "#757575" },
  IN_PROGRESS: { bg: "rgba(25,118,210,0.1)", color: "#1565C0" },
  WAITING_FOR_APPROVAL: { bg: "rgba(212,172,13,0.1)", color: "#7D6608" },
  APPROVED: { bg: "rgba(20,143,119,0.1)", color: "#0E6655" },
  REJECTED: { bg: "rgba(192,57,43,0.1)", color: "#922B21" },
};

type MotorProcessTab = "CASTING" | "CURING";

export type CastingCuringDetailsTheme =
  ReturnType<typeof getManufacturingTheme>["manufacturing"]["castingAndCuring"]["details"];

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

const displayValue = (value?: string | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed || "—";
};

const DetailField = ({
  label,
  value,
  dt,
}: {
  label: string;
  value: string;
  dt: CastingCuringDetailsTheme;
}) => (
  <Box sx={dt.metaItem}>
    <Typography sx={dt.metaLabel}>{label}</Typography>
    <Typography sx={dt.metaValue}>{displayValue(value)}</Typography>
  </Box>
);

const FieldsTable = ({
  fields,
  dt,
  subDepartmentId,
  onOpen,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: CastingCuringDetailsTheme;
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
                <CastingCuringCellValue
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
  dt: CastingCuringDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  const columns = orderCastingCuringDisplayColumns(Object.keys(table.columnLabels));
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
                    <TableCell colSpan={columns.length} sx={{ ...dt.tableCell, fontWeight: 700, fontSize: "0.72rem" }}>
                      {headerLabel}
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                  {columns.map((column) => (
                    <TableCell key={column} sx={dt.tableCell}>
                      <CastingCuringCellValue
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
  dt: CastingCuringDetailsTheme;
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

const SetupGrid = ({
  title,
  fields,
  dt,
}: {
  title: string;
  fields: Array<{ label: string; value: string }>;
  dt: CastingCuringDetailsTheme;
}) => {
  const visibleFields = fields.filter((field) => String(field.value ?? "").trim());
  if (!visibleFields.length) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "text.secondary", mb: 1 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {visibleFields.map((field) => (
          <DetailField key={field.label} label={field.label} value={field.value} dt={dt} />
        ))}
      </Box>
    </Box>
  );
};

export const MotorDetailPanel = ({
  motor,
  processTab,
  dt,
  palette,
  subDepartmentId,
  onOpen,
}: {
  motor: CastingCuringMotorDetailView;
  processTab: MotorProcessTab;
  dt: CastingCuringDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  const sections = processTab === "CASTING" ? motor.castingSections : motor.curingSections;

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Chip label={CC.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
          {motor.motorId}
        </Typography>
        {motor.motorSubmissionStatus ? (() => {
          const chipStyle = MOTOR_STATUS_CHIP_COLORS[motor.motorSubmissionStatus];
          return (
            <Chip
              label={motor.motorSubmissionStatus.replace(/_/g, " ")}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.62rem",
                height: 22,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                background: chipStyle?.bg,
                color: chipStyle?.color,
              }}
            />
          );
        })() : null}
        {motor.motorReceivedAt ? (
          <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
            {CC.FLOW_MOTOR_RECEIVED_AT}: {motor.motorReceivedAt}
          </Typography>
        ) : null}
      </Stack>

      {processTab === "CASTING" ? (
        <SetupGrid
          title={CC.DETAILS_CASTING_SETUP}
          dt={dt}
          fields={[
            { label: CC.FLOW_CASTING_TYPE, value: motor.setup.castingType },
            { label: CC.FLOW_CASTING_STATION, value: motor.setup.castingStation },
          ]}
        />
      ) : (
        <SetupGrid
          title={CC.DETAILS_CURING_SETUP}
          dt={dt}
          fields={[
            { label: CC.CURING_SELECT_OVEN, value: motor.curingSetup.oven },
            {
              label: CC.CURING_SELECT_OVEN_NO,
              value: (() => {
                const n = Number(motor.curingSetup.ovenNo);
                if (Number.isFinite(n) && n > 0) return CC.CURING_OVEN_NO_OPTION(n);
                return motor.curingSetup.ovenNo || "";
              })(),
            },
          ]}
        />
      )}

      {sections.length === 0 ? (
        <Typography sx={dt.emptyText}>
          {processTab === "CASTING" ? CC.DETAILS_NO_CASTING : CC.DETAILS_NO_CURING}
        </Typography>
      ) : (
        sections.map((section) => <SectionPanel
          key={section.sectionId}
          section={section}
          dt={dt}
          subDepartmentId={subDepartmentId}
          onOpen={onOpen}
        />)
      )}
    </Box>
  );
};

export type CastingCuringDetailsContentProps = {
  detailView: CastingCuringDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getManufacturingTheme>;
  resetOnFormId?: string | null;
};

const CastingCuringDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetOnFormId,
}: CastingCuringDetailsContentProps) => {
  const dt = theme.manufacturing.castingAndCuring.details;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("CASTING");
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "casting-and-curing")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();
  const onOpenFile = (fileId: string, fileName: string) => {
    if (!subDepartmentId) return;
    void openFile(fileId, subDepartmentId, fileName);
  };

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe = motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;

  useEffect(() => {
    setActiveMotorIndex(0);
    setActiveProcessTab("CASTING");
  }, [resetOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    { label: "Status", value: detailView?.status || row?.ccStatus || row?.status || "—" },
    { label: "Project ID", value: detailView?.projectId || "—" },
    { label: "Project Name", value: detailView?.projectName || "—" },
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

  const hasMotorData = motors.some(
    (motor) => motor.castingSections.length > 0 || motor.curingSections.length > 0,
  );

  return (
    <>
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {CC.DETAILS_BATCH_SECTION}
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
            {CC.DETAILS_FORM_SECTION}
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
              <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: theme.palette.primary, mb: 0.75 }}>
                {CC.MOTOR_NAV_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 1 }}>
                {CC.DETAILS_MOTOR_NAV_HINT}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {motors.map((motor, index) => {
                  const statusKey = motor.motorSubmissionStatus;
                  const chipStyle = statusKey ? MOTOR_STATUS_CHIP_COLORS[statusKey] : undefined;
                  return (
                    <Stack key={motor.motorId} direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant={index === activeMotorIndexSafe ? "contained" : "outlined"}
                        onClick={() => setActiveMotorIndex(index)}
                        sx={{ whiteSpace: "nowrap", textTransform: "none", fontWeight: 700 }}
                      >
                        {motor.motorId}
                      </Button>
                      {statusKey ? (
                        <Chip
                          label={statusKey.replace(/_/g, " ")}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.58rem",
                            height: 20,
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                            background: chipStyle?.bg,
                            color: chipStyle?.color,
                          }}
                        />
                      ) : null}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ) : null}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={activeProcessTab}
            onChange={(_, value: MotorProcessTab | null) => value && setActiveProcessTab(value)}
            sx={dt.processToggle}
          >
            <ToggleButton value="CASTING">{CC.SECTION_TAB_CASTING}</ToggleButton>
            <ToggleButton value="CURING">{CC.SECTION_TAB_CURING}</ToggleButton>
          </ToggleButtonGroup>

          {activeMotor ? (
            <MotorDetailPanel
              motor={activeMotor}
              processTab={activeProcessTab}
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

export default CastingCuringDetailsContent;
