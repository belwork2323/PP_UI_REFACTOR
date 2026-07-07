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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import {
  orderCastingCuringDisplayColumns,
  type CastingCuringDetailView,
  type CastingCuringMotorDetailView,
} from "../../../../../../data/models/user/CastingCuringFormModel";

const BL = STRINGS.SOURCING.BATCH_LIST;
const CC = STRINGS.MANUFACTURING.CASTING_CURING;

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
}: {
  fields: CasePrepDetailSection["fields"];
  dt: CastingCuringDetailsTheme;
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
  dt: CastingCuringDetailsTheme;
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
  dt: CastingCuringDetailsTheme;
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

const MotorDetailPanel = ({
  motor,
  processTab,
  dt,
  palette,
}: {
  motor: CastingCuringMotorDetailView;
  processTab: MotorProcessTab;
  dt: CastingCuringDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
}) => {
  const sections = processTab === "CASTING" ? motor.castingSections : motor.curingSections;

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Chip label={CC.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
          {motor.motorId}
        </Typography>
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
            { label: CC.FLOW_INITIAL_VACUUM, value: motor.setup.initialVacuum },
            { label: CC.FLOW_CASTING_VACUUM_PRESSURE, value: motor.setup.castingVacuumPressure },
            { label: CC.FLOW_SOAKING_VACUUM_PRESSURE, value: motor.setup.soakingVacuumPressure },
            { label: CC.FLOW_FINAL_MIX_COUNT, value: motor.setup.finalMixCount },
          ]}
        />
      ) : (
        <SetupGrid
          title={CC.DETAILS_CURING_SETUP}
          dt={dt}
          fields={[
            { label: CC.CURING_SELECT_OVEN, value: motor.curingSetup.oven },
            { label: CC.CURING_TYPE, value: motor.curingSetup.curingType },
            { label: CC.CURING_CONFIGURATION, value: motor.curingSetup.configuration },
            { label: CC.CURING_MOTORS_TO_CURE, value: motor.curingSetup.motorsToCureCount },
            { label: CC.CURING_OVENS_UTILIZED, value: motor.curingSetup.ovensUtilized },
          ]}
        />
      )}

      {sections.length === 0 ? (
        <Typography sx={dt.emptyText}>
          {processTab === "CASTING" ? CC.DETAILS_NO_CASTING : CC.DETAILS_NO_CURING}
        </Typography>
      ) : (
        sections.map((section) => <SectionPanel key={section.sectionId} section={section} dt={dt} />)
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
    { label: "Submission Type", value: detailView?.formSubmissionType || "—" },
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
            />
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}
    </>
  );
};

export default CastingCuringDetailsContent;
