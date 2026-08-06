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
import getTrimmingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import { mapCastingCuringPersonLabel } from "../../../../../../data/models/user/CastingCuringFormModel";
import {
  orderTrimmingDisplayColumns,
  type TrimmingDetailView,
  type TrimmingMotorDetailView,
} from "../../../../../../data/models/user/TrimmingFormModel";
import { OPERATION_STATUS_UI_TO_API } from "../../../../../../hooks/operationStatus";

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
const TR = STRINGS.MANUFACTURING.TRIMMING;

export type TrimmingDetailsTheme = ReturnType<typeof getTrimmingTheme>["details"];

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

const FieldsTable = ({
  fields,
  dt,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: TrimmingDetailsTheme;
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

const DataTable = ({
  table,
  dt,
}: {
  table: CasePrepDetailTable;
  dt: TrimmingDetailsTheme;
}) => {
  const preferredOrder = Object.keys(table.columnLabels);
  const rowKeys = Array.from(
    table.rows.reduce((keys, row) => {
      Object.keys(row ?? {}).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );
  const columns = orderTrimmingDisplayColumns(
    preferredOrder.length ? preferredOrder : rowKeys,
    preferredOrder,
  );
  if (!columns.length || !table.rows.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      {table.label ? (
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
          {table.label}
        </Typography>
      ) : null}
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

const SectionPanel = ({
  section,
  dt,
}: {
  section: CasePrepDetailSection;
  dt: TrimmingDetailsTheme;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
      {section.label}
    </Typography>
    <FieldsTable fields={section.fields} dt={dt} />
    {section.tables.map((table) => (
      <DataTable key={table.blockId} table={table} dt={dt} />
    ))}
  </Box>
);

export const MotorDetailPanel = ({
  motor,
  dt,
  palette,
}: {
  motor: TrimmingMotorDetailView;
  dt: TrimmingDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip label={TR.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
        {motor.motorId}
      </Typography>
      {motor.motorStageLabel ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          {TR.MOTOR_STAGE_LABEL}: {motor.motorStageLabel}
        </Typography>
      ) : null}
      {motor.motorReceivedAt ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          {TR.MOTOR_RECEIVED_AT_LABEL}: {motor.motorReceivedAt}
        </Typography>
      ) : null}
    </Stack>

    {motor.sections.length === 0 ? (
      <Typography sx={dt.emptyText}>{TR.DETAILS_NO_MOTOR_DATA}</Typography>
    ) : (
      motor.sections.map((section) => <SectionPanel key={section.sectionId} section={section} dt={dt} />)
    )}
  </Box>
);

export type TrimmingDetailsContentProps = {
  detailView: TrimmingDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getManufacturingTheme>;
  resetOnFormId?: string | null;
};

const TrimmingDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetOnFormId,
}: TrimmingDetailsContentProps) => {
  const dt = getTrimmingTheme(theme).details;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe = motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
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
      value: formatStatusLabel(detailView?.status || String(row?.trStatus ?? row?.status ?? "")),
    },
    {
      label: BL.COL_CREATED_BY,
      value: detailView?.createdBy || mapCastingCuringPersonLabel(row?.createdBy) || "—",
    },
    {
      label: BL.COL_CREATED_ON,
      value: formatDateTime(detailView?.createdAt ?? (row?.createdAt as string | undefined)),
    },
    {
      label: "Submitted By",
      value: detailView?.submittedBy || mapCastingCuringPersonLabel(row?.submittedBy) || "—",
    },
    {
      label: "Submitted On",
      value: formatDateTime(detailView?.submittedAt ?? (row?.submittedAt as string | undefined)),
    },
    {
      label: "Last Updated By",
      value:
        detailView?.lastUpdatedBy ||
        mapCastingCuringPersonLabel(row?.lastUpdatedBy ?? row?.updatedBy) ||
        "—",
    },
    {
      label: "Last Updated On",
      value: formatDateTime(
        detailView?.lastUpdatedAt ??
          (row?.lastUpdatedAt as string | undefined) ??
          (row?.updatedAt as string | undefined),
      ),
    },
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
          {TR.DETAILS_BATCH_SECTION}
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
            {TR.DETAILS_FORM_SECTION}
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
                {TR.MOTOR_NAV_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 1 }}>
                {TR.DETAILS_MOTOR_NAV_HINT}
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
        <Typography sx={dt.emptyText}>{TR.DETAILS_NO_FORM_DATA}</Typography>
      )}
    </>
  );
};

export default TrimmingDetailsContent;
