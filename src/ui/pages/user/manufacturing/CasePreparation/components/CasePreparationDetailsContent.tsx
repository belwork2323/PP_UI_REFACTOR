import { useEffect, useMemo, useState } from "react";
import {
  Box,
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
import { STRINGS } from "../../../../../../app/config/strings";
import { useAuthStore } from "../../../../../../app/store/authStore";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  orderCasePrepDisplayColumns,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
  type CasePrepMotorDetailView,
  type CasePreparationDetailView,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import {
  parseCasePrepFileRefs,
  type CasePrepFileRef,
} from "../../../../../../data/models/user/CasePrepMotorDataModel";
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../../components/custom/UserWorkflowStepPager";

const BL = STRINGS.SOURCING.BATCH_LIST;
const CP = STRINGS.MANUFACTURING.CASE_PREP;

export type CasePrepDetailsTheme =
  ReturnType<typeof getManufacturingTheme>["manufacturing"]["casePreparation"]["details"];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const looksLikeCasePrepFiles = (value: unknown): boolean => {
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

const CasePrepFileLinks = ({
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
                {CP.FILE_OPEN}
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};

const CasePrepCellValue = ({
  value,
  subDepartmentId,
  onOpen,
}: {
  value: unknown;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (looksLikeCasePrepFiles(value)) {
    return (
      <CasePrepFileLinks
        refs={parseCasePrepFileRefs(value)}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    );
  }
  return <>{formatCasePrepCellValue(value)}</>;
};

const CasePrepFieldsTable = ({
  fields,
  dt,
  subDepartmentId,
  onOpen,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: CasePrepDetailsTheme;
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
                <CasePrepCellValue
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

const CasePrepDataTable = ({
  table,
  dt,
  subDepartmentId,
  onOpen,
}: {
  table: CasePrepDetailTable;
  dt: CasePrepDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  const displayRows = table.rows;
  const columns = orderCasePrepDisplayColumns(Object.keys(table.columnLabels));

  if (!columns.length || !displayRows.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {table.label}
      </Typography>
      <TableContainer sx={dt.tableContainer}>
        <Table size="small">
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
            {displayRows.map((row, rowIndex) => {
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
                      <CasePrepCellValue
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

const CasePrepSectionPanel = ({
  section,
  dt,
  subDepartmentId,
  onOpen,
}: {
  section: CasePrepDetailSection;
  dt: CasePrepDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
      {section.label}
    </Typography>
    <CasePrepFieldsTable
      fields={section.fields}
      dt={dt}
      subDepartmentId={subDepartmentId}
      onOpen={onOpen}
    />
    {section.tables.map((table) => (
      <CasePrepDataTable
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
  motor: CasePrepMotorDetailView;
  dt: CasePrepDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip label={CP.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
        {motor.motorId}
      </Typography>
      {motor.prrcClearanceDate ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          PRRC: {motor.prrcClearanceDate}
        </Typography>
      ) : null}
    </Stack>

    {motor.sections.length === 0 ? (
      <Typography sx={dt.emptyText}>No form data recorded for this motor.</Typography>
    ) : (
      motor.sections.map((section) => (
        <CasePrepSectionPanel
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

export type CasePreparationDetailsContentProps = {
  detailView: CasePreparationDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getManufacturingTheme>;
  resetMotorOnFormId?: string | null;
};

const CasePreparationDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetMotorOnFormId,
}: CasePreparationDetailsContentProps) => {
  const dt = theme.manufacturing.casePreparation.details;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "case-preparation")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe = motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;

  useEffect(() => {
    setActiveMotorIndex(0);
  }, [resetMotorOnFormId]);

  const onOpenFile = (fileId: string, fileName: string) => {
    if (!subDepartmentId) return;
    void openFile(fileId, subDepartmentId, fileName);
  };

  const navPalette = {
    primary: theme.palette.primary,
    primaryLight: theme.palette.primaryLight,
    border: theme.palette.border,
    surface: theme.palette.surface,
    textSub: theme.palette.textSub,
    text: theme.palette.text,
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motors.map((motor) => ({
        id: motor.motorId,
        label: motor.motorId,
      })),
    [motors],
  );

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    {
      label: BL.COL_CREATED_BY,
      value:
        detailView?.createdBy ||
        (row?.assignedTo as { fullName?: string } | undefined)?.fullName ||
        BL.UNASSIGNED,
    },
    {
      label: BL.COL_CREATED_ON,
      value: formatDate(detailView?.createdAt ?? (row?.createdOn as string | undefined)),
    },
    { label: "Submitted By", value: detailView?.submittedBy || "—" },
    { label: "Submitted On", value: formatDate(detailView?.submittedAt) },
  ];

  if (loading) {
    return (
      <Box sx={dt.loadingBox}>
        <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
        <Typography sx={dt.emptyText}>Loading details…</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {BL.LOT_DETAILS_PROCUREMENT_SECTION}
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

      {motors.length > 0 ? (
        <Box sx={{ ...dt.section, mb: 0 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {BL.CASING_DETAILS_SECTIONS}
          </Typography>

          {motors.length > 1 ? (
            <Box sx={{ mb: 2 }}>
              <UserWorkflowNavPanel palette={navPalette}>
                <UserWorkflowTabNav
                  title={CP.MOTOR_NAV_TITLE}
                  hint={CP.MOTOR_NAV_HINT}
                  tabs={motorTabs}
                  activeIndex={activeMotorIndexSafe}
                  onActiveIndexChange={setActiveMotorIndex}
                  palette={navPalette}
                  showStepArrows
                />
              </UserWorkflowNavPanel>
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

export default CasePreparationDetailsContent;
