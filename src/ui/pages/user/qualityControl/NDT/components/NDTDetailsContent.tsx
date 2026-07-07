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
import getQualityControlTheme from "../../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getNdtTheme } from "../../../../../../app/theme/custom_themes/user/qualityControl/ndt_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import { formatCasePrepCellValue } from "../../../../../../data/models/user/CasePreparationFormModel";
import type { NDTDetailView, NDTMotorDetailView } from "../../../../../../data/models/user/NDTFormModel";
import { NDT_FLOW_LABELS } from "../../../../../../hooks/user/qualityControl/ndtFlowConfig";
import { NDT_ORIENTATION_OPTIONS } from "../../../../../../hooks/user/qualityControl/ndtApiMappings";
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
const NDT = STRINGS.QUALITY_CONTROL.NDT;
const L = NDT_FLOW_LABELS;

export type NDTDetailsTheme = ReturnType<typeof getNdtTheme>["details"];

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

const formatOrientationLabel = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "—";
  return NDT_ORIENTATION_OPTIONS.find((option) => option.value === trimmed)?.label ?? trimmed;
};

const formatFileRef = (file: unknown) => {
  if (!file) return "—";
  if (typeof file === "string") return file;
  if (typeof file === "object" && file !== null && "name" in file) {
    return String((file as { name?: string }).name ?? "—");
  }
  return "—";
};

const formatFileList = (files?: unknown[]) => {
  if (!files?.length) return "—";
  return files.map(formatFileRef).join(", ");
};

const FieldsTable = ({
  fields,
  dt,
}: {
  fields: { key: string; label: string; value: unknown }[];
  dt: NDTDetailsTheme;
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

const SimpleDataTable = ({
  title,
  columns,
  rows,
  dt,
}: {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  dt: NDTDetailsTheme;
}) => {
  const visibleRows = rows.filter((row) =>
    columns.some((column) => {
      const value = row[column.key];
      if (Array.isArray(value)) return value.length > 0;
      return String(value ?? "").trim().length > 0;
    }),
  );

  if (!visibleRows.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {title}
      </Typography>
      <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: Math.max(480, columns.length * 120) }}>
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell key={column.key} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={dt.tableCell}>
                    {formatCasePrepCellValue(row[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const MotorDetailPanel = ({
  motor,
  dt,
  palette,
}: {
  motor: NDTMotorDetailView;
  dt: NDTDetailsTheme;
  palette: ReturnType<typeof getQualityControlTheme>["palette"];
}) => {
  const setupFields = [
    { key: "equipment", label: L.equipment, value: motor.equipment },
    { key: "beamEnergies", label: L.beamEnergies, value: motor.beamEnergiesLabel },
    { key: "radiographyPlan", label: L.radiographyPlan, value: motor.radiographyPlanLabel },
  ];

  const planRows = (motor.radiographyPlanRows ?? []).map((row) => ({
    srNo: row.srNo,
    sections: row.sections,
    orientations: row.orientations,
    sfd: row.sfd,
    normalExposures: row.normalExposures,
    tangentialExposures: row.tangentialExposures,
    detectorType: row.detectorType,
  }));

  const exposureRows = (motor.additionalExposureRows ?? []).map((row) => ({
    sectionNumber: row.sectionNumber,
    orientation: formatOrientationLabel(row.orientation),
    exposureCount: row.exposureCount,
  }));

  const observationRows = (motor.radiographyObservationRows ?? []).map((row) => ({
    section: row.section,
    orientation: formatOrientationLabel(row.orientation),
    observations: row.observations,
    files: formatFileList(row.files),
  }));

  const visualRows = (motor.visualInspectionRows ?? [])
    .filter(
      (row) =>
        String(row.section ?? "").trim() ||
        String(row.orientation ?? "").trim() ||
        String(row.observationNotes ?? "").trim() ||
        (!row.isPreset && String(row.observation ?? "").trim()) ||
        (row.files?.length ?? 0) > 0,
    )
    .map((row) => ({
      observation: row.isPreset
        ? row.observationNotes
          ? `${row.observation}: ${row.observationNotes}`
          : row.observation
        : row.observation,
      section: row.section,
      orientation: formatOrientationLabel(row.orientation),
      files: formatFileList(row.files),
    }));

  const hasMotorData =
    setupFields.some((field) => String(field.value ?? "").trim()) ||
    planRows.length > 0 ||
    exposureRows.some((row) => Object.values(row).some((value) => String(value ?? "").trim())) ||
    observationRows.some((row) => Object.values(row).some((value) => String(value ?? "").trim() && value !== "—")) ||
    visualRows.length > 0 ||
    (motor.visualInspectionMedia?.length ?? 0) > 0 ||
    Boolean(motor.signedReport) ||
    String(motor.additionalRemarks ?? "").trim();

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Chip label={NDT.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
          {motor.motorId}
        </Typography>
        {motor.equipment ? (
          <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
            {L.equipment}: {motor.equipment}
          </Typography>
        ) : null}
        {motor.radiographyPlanLabel ? (
          <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
            {L.radiographyPlan}: {motor.radiographyPlanLabel}
          </Typography>
        ) : null}
      </Stack>

      {!hasMotorData ? (
        <Typography sx={dt.emptyText}>{NDT.DETAILS_NO_MOTOR_DATA}</Typography>
      ) : (
        <>
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
              Radiography setup
            </Typography>
            <FieldsTable fields={setupFields} dt={dt} />
            <SimpleDataTable
              title="Radiography plan details"
              dt={dt}
              columns={[
                { key: "srNo", label: "Sr." },
                { key: "sections", label: "Sections" },
                { key: "orientations", label: "Orientations" },
                { key: "sfd", label: "SFD" },
                { key: "normalExposures", label: "Normal" },
                { key: "tangentialExposures", label: "Tangential" },
                { key: "detectorType", label: "Detector" },
              ]}
              rows={planRows}
            />
          </Box>

          <SimpleDataTable
            title="Additional exposure details"
            dt={dt}
            columns={[
              { key: "sectionNumber", label: "Section" },
              { key: "orientation", label: "Orientation" },
              { key: "exposureCount", label: "Exposures" },
            ]}
            rows={exposureRows}
          />

          <SimpleDataTable
            title="Observation in radiography"
            dt={dt}
            columns={[
              { key: "section", label: "Section" },
              { key: "orientation", label: "Orientation" },
              { key: "observations", label: "Observations" },
              { key: "files", label: "Images" },
            ]}
            rows={observationRows}
          />

          <SimpleDataTable
            title="Visual inspection"
            dt={dt}
            columns={[
              { key: "observation", label: "Observation" },
              { key: "section", label: "Section" },
              { key: "orientation", label: "Orientation" },
              { key: "files", label: "Images" },
            ]}
            rows={visualRows}
          />

          {(motor.visualInspectionMedia?.length ?? 0) > 0 ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
                Visual inspection media
              </Typography>
              <Typography sx={dt.remarksText}>{formatFileList(motor.visualInspectionMedia)}</Typography>
            </Box>
          ) : null}

          {motor.signedReport ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
                Signed NDT report
              </Typography>
              <Typography sx={dt.remarksText}>{formatFileRef(motor.signedReport)}</Typography>
            </Box>
          ) : null}

          {String(motor.additionalRemarks ?? "").trim() ? (
            <Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
                Additional remarks
              </Typography>
              <Typography sx={dt.remarksText}>{motor.additionalRemarks}</Typography>
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
};

export type NDTDetailsContentProps = {
  detailView: NDTDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getQualityControlTheme>;
  resetOnFormId?: string | null;
};

const NDTDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetOnFormId,
}: NDTDetailsContentProps) => {
  const dt = getNdtTheme(theme).details;
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
    { label: "Submission Type", value: detailView?.formSubmissionType || "—" },
    {
      label: "Status",
      value: formatStatusLabel(detailView?.status || String(row?.ndtStatus ?? row?.status ?? "")),
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

  const hasMotorData = motors.length > 0;

  return (
    <>
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {NDT.DETAILS_BATCH_SECTION}
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
            {NDT.DETAILS_FORM_SECTION}
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
                {L.motorNavTitle}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 1 }}>
                {NDT.DETAILS_MOTOR_NAV_HINT}
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

export default NDTDetailsContent;
