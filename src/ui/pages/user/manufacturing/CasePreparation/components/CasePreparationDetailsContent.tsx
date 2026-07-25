import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  orderCasePrepDisplayColumns,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
  type CasePrepMotorDetailView,
  type CasePreparationDetailView,
} from "../../../../../../data/models/user/CasePreparationFormModel";

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

const CasePrepFieldsTable = ({
  fields,
  dt,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: CasePrepDetailsTheme;
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
                {formatCasePrepCellValue(field.value)}
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
}: {
  table: CasePrepDetailTable;
  dt: CasePrepDetailsTheme;
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
                      {formatCasePrepCellValue(row[column])}
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
}: {
  section: CasePrepDetailSection;
  dt: CasePrepDetailsTheme;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
      {section.label}
    </Typography>
    <CasePrepFieldsTable fields={section.fields} dt={dt} />
    {section.tables.map((table) => (
      <CasePrepDataTable key={table.blockId} table={table} dt={dt} />
    ))}
  </Box>
);

export const MotorDetailPanel = ({
  motor,
  dt,
  palette,
}: {
  motor: CasePrepMotorDetailView;
  dt: CasePrepDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
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
        <CasePrepSectionPanel key={section.sectionId} section={section} dt={dt} />
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

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe = motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;

  useEffect(() => {
    setActiveMotorIndex(0);
  }, [resetMotorOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    {
      label: BL.COL_CREATED_BY,
      value: detailView?.createdBy || (row?.assignedTo as { fullName?: string } | undefined)?.fullName || BL.UNASSIGNED,
    },
    { label: BL.COL_CREATED_ON, value: formatDate(detailView?.createdAt ?? (row?.createdOn as string | undefined)) },
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
                {CP.MOTOR_NAV_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 1 }}>
                {CP.MOTOR_NAV_HINT}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {motors.map((motor, index) => (
                  <Button
                    key={motor.motorId}
                    size="small"
                    variant={index === activeMotorIndexSafe ? "contained" : "outlined"}
                    onClick={() => setActiveMotorIndex(index)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none", fontWeight: 700 }}
                  >
                    {motor.motorId}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}

          {activeMotor ? (
            <MotorDetailPanel motor={activeMotor} dt={dt} palette={theme.palette} />
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}
    </>
  );
};

export default CasePreparationDetailsContent;
