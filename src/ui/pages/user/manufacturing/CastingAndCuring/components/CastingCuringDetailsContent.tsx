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
import { generalController } from "../../../../../../controllers/admin/common/generalController";
import {
  mapOvensToOptions,
  resolveOvenLabel,
  type OvenSelectOption,
} from "../../../../../../hooks/user/manufacturing/ovenSelectOptions";
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
import { parseFileRefs, type FileRef } from "../../../../../../data/models/common/FileUploadModel";
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import {
  type CastingCuringDetailView,
  type CastingCuringMotorDetailView,
  type CastingCuringMotorSubmissionStatus,
} from "../../../../../../data/models/user/CastingCuringFormModel";
import { formatCuringTypeLabel } from "../../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import { alpha } from "@mui/material";
import { formatDisplayDateTime } from "../../../../../../utils/dateUtils";
import DetailsFixedColumnsTable, {
  type DetailsFixedColumn,
} from "../../../../../components/manufacturing/DetailsFixedColumnsTable";
import {
  CASTING_FROM_BOWL_COLUMNS,
  FEED_PIPE_COLUMNS,
  FINAL_MIX_BOWL_COLUMNS,
  normalizeCcBlockId,
  POST_CAST_COLUMNS,
  resolveCcFieldLabel,
  resolveCcFixedColumnValue,
  SLURRY_CAST_COLUMNS,
  type CcDetailsBlockId,
} from "../../../../../../data/models/user/castingCuringDetailsLabels";

const BL = STRINGS.SOURCING.BATCH_LIST;
const CC = STRINGS.MANUFACTURING.CASTING_CURING;

const MANDREL_BODY_KEYS = [
  "srNo",
  "A_MOCK",
  "B_MOCK",
  "B_FINAL",
  "C_MOCK",
  "C_FINAL",
  "BELLOWS_THICKNESS_D",
  "E_MOCK",
  "E_FINAL",
] as const;

const CC_FIXED_TABLE_COLUMNS: Partial<Record<CcDetailsBlockId, DetailsFixedColumn[]>> = {
  FEED_PIPE_DISTANCE: FEED_PIPE_COLUMNS,
  FINAL_MIX_BOWL_DETAILS: FINAL_MIX_BOWL_COLUMNS,
  CASTING_FROM_BOWL_DETAILS: CASTING_FROM_BOWL_COLUMNS,
  SLURRY_CAST_FROM_BOWLS: SLURRY_CAST_COLUMNS,
  POST_CAST_TABLE: POST_CAST_COLUMNS,
};

const CC_FIXED_TABLE_TITLES: Partial<Record<CcDetailsBlockId, string>> = {
  FEED_PIPE_DISTANCE: "Observations / remarks between feed pipe & cone apex",
  FINAL_MIX_BOWL_DETAILS: "Final Mix Bowl Details",
  CASTING_FROM_BOWL_DETAILS: "Casting From Bowl Details",
  SLURRY_CAST_FROM_BOWLS: "Slurry Cast into motor from bowls",
  POST_CAST_TABLE: "Post Cast Operations",
  MANDREL_MEASUREMENTS: "Distance between centering top to mandrel top (mm)",
  CURING_TABLE: "Curing Cycles",
};

/** Create-form Curing Cycles columns (Start before End; Remarks last). */
const CURING_CYCLES_COLUMNS: DetailsFixedColumn[] = [
  { key: "srNo", label: "S.No" },
  { key: "TEMPERATURE", label: "Temperature (°C)" },
  { key: "TIME", label: "Time (min)" },
  { key: "START_DATE_TIME", label: "Start Date & Time" },
  { key: "END_DATE_TIME", label: "End Date & Time" },
  { key: "PROPELLANT_PRESSURE", label: "Propellant Pressure (bar)" },
  { key: "HOT_WATER_STATUS", label: "Status Of Hot Water Circulation" },
  { key: "DURATION", label: "Duration (min)" },
  { key: "REMARKS", label: "Remarks", emphasize: "remarks" },
];

const joinCuringDateTime = (date: unknown, time: unknown) => {
  const d = String(date ?? "").trim();
  const t = String(time ?? "").trim();
  return d && t ? `${d} ${t}` : d || t || "";
};

const elapsedCuringMinutes = (start: string, end: string): string => {
  const parse = (value: string) => {
    const match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const date = new Date(year, month - 1, day, hour, minute);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }
    return date.getTime();
  };
  const startMs = parse(start);
  const endMs = parse(end);
  if (startMs === null || endMs === null || endMs < startMs) return "";
  return String(Math.floor((endMs - startMs) / 60_000));
};

const resolvePropellantPressureDisplay = (row: Record<string, unknown>): string => {
  const nestedCandidate = row.PROPELLANT_PRESSURE ?? row.propellantPressure;
  const nested =
    nestedCandidate && typeof nestedCandidate === "object" && !Array.isArray(nestedCandidate)
      ? (nestedCandidate as Record<string, unknown>)
      : null;
  const reading1 = String(
    nested?.READING1 ??
      nested?.reading1 ??
      nested?.Reading1 ??
      row.PROPELLANT_PRESSURE_READING1 ??
      row.propellantPressureReading1 ??
      "",
  ).trim();
  const reading2 = String(
    nested?.READING2 ??
      nested?.reading2 ??
      nested?.Reading2 ??
      row.PROPELLANT_PRESSURE_READING2 ??
      row.propellantPressureReading2 ??
      "",
  ).trim();
  if (reading1 && reading2) return `${reading1} / ${reading2}`;
  return reading1 || reading2 || "";
};

const resolveCuringCycleCellValue = (
  row: Record<string, unknown>,
  column: DetailsFixedColumn,
  rowIndex: number,
): unknown => {
  if (column.key === "srNo") {
    const raw = row.srNo ?? row.SR_NO;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return rowIndex + 1;
  }
  if (column.key === "START_DATE_TIME") {
    return joinCuringDateTime(row.START_DATE ?? row.startDate, row.START_TIME ?? row.startTime);
  }
  if (column.key === "END_DATE_TIME") {
    return joinCuringDateTime(row.END_DATE ?? row.endDate, row.END_TIME ?? row.endTime);
  }
  if (column.key === "PROPELLANT_PRESSURE") {
    return resolvePropellantPressureDisplay(row);
  }
  if (column.key === "DURATION") {
    const start = joinCuringDateTime(row.START_DATE ?? row.startDate, row.START_TIME ?? row.startTime);
    const end = joinCuringDateTime(row.END_DATE ?? row.endDate, row.END_TIME ?? row.endTime);
    const elapsed = elapsedCuringMinutes(start, end);
    if (elapsed) return elapsed;
    const raw = String(row.DURATION ?? "").trim();
    // Prefer numeric duration; skip mapper date-range strings.
    if (raw && !raw.includes("→") && Number.isFinite(Number(raw))) return raw;
    return "";
  }
  if (column.key === "HOT_WATER_STATUS") {
    return row.HOT_WATER_STATUS ?? row.hotWaterStatus ?? "";
  }
  if (column.key === "TEMPERATURE") return row.TEMPERATURE ?? row.temperature ?? "";
  if (column.key === "TIME") return row.TIME ?? row.time ?? "";
  if (column.key === "REMARKS") return row.REMARKS ?? row.remarks ?? "";
  return row[column.key];
};

const isCuringCyclesTable = (table: CasePrepDetailTable) =>
  normalizeCcBlockId(table.blockId) === "CURING_TABLE";

const isMandrelMeasurementsTable = (table: CasePrepDetailTable) =>
  normalizeCcBlockId(table.blockId) === "MANDREL_MEASUREMENTS";

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
  refs: FileRef[];
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
        refs={parseFileRefs(value)}
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
  DISCARDED: { bg: "rgba(192,57,43,0.12)", color: "#C0392B" },
};

type MotorProcessTab = "CASTING" | "CURING";

export type CastingCuringDetailsTheme = ReturnType<
  typeof getManufacturingTheme
>["manufacturing"]["castingAndCuring"]["details"];

const formatDateTime = (value?: string | null) => {
  return formatDisplayDateTime(value, value || "—");
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
              <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>
                {resolveCcFieldLabel(field.key, field.label)}
              </TableCell>
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

const mandrelRowsHaveValues = (rows: Record<string, unknown>[]): boolean =>
  rows.some((row, rowIndex) =>
    MANDREL_BODY_KEYS.some((columnKey) => {
      if (columnKey === "srNo") return false;
      const value = resolveCcFixedColumnValue(row, columnKey, rowIndex);
      return value != null && String(value).trim() !== "";
    }),
  );

/** Create-form grouped Mandrel Measurements table; values from API rows only. */
const MandrelMeasurementsDetailsTable = ({
  table,
  dt,
  subDepartmentId,
  onOpen,
  fallbackRows = [],
}: {
  table: CasePrepDetailTable;
  dt: CastingCuringDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
  /** Normalized castingData mandrel rows (A_MOCK/…) when section table keys are sparse. */
  fallbackRows?: Record<string, unknown>[];
}) => {
  const sourceRows =
    table.rows.length && mandrelRowsHaveValues(table.rows)
      ? table.rows
      : fallbackRows.length
        ? fallbackRows
        : table.rows;

  if (!sourceRows.length) return null;

  const groupHeaderSx = {
    ...dt.tableHeaderCell(false),
    textAlign: "center" as const,
    fontWeight: 800,
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {table.label || CC_FIXED_TABLE_TITLES.MANDREL_MEASUREMENTS}
      </Typography>
      <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{ ...dt.tableHeaderCell(true), verticalAlign: "middle" }}
              >
                Sr. No.
              </TableCell>
              <TableCell colSpan={1} sx={groupHeaderSx}>
                Mandrel rest on dome of motor (A)
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Mandrel rest on bottom cup with required no of gaskets (B)
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Difference C=(A-B)
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ ...groupHeaderSx, verticalAlign: "middle" }}
              >
                Bellow thickness (D)
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Mandrel lift E=(C-D)
              </TableCell>
            </TableRow>
            <TableRow>
              {[
                "Mock assy.",
                "Mock assy.",
                "Final assy.",
                "Mock assy.",
                "Final assy.",
                "Mock assy.",
                "Final assy.",
              ].map((label, idx) => (
                <TableCell key={`mandrel-sub-${idx}`} sx={dt.tableHeaderCell(false)}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sourceRows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {MANDREL_BODY_KEYS.map((columnKey) => (
                  <TableCell key={columnKey} sx={dt.tableCell}>
                    <CastingCuringCellValue
                      value={resolveCcFixedColumnValue(row, columnKey, rowIndex)}
                      subDepartmentId={subDepartmentId}
                      onOpen={onOpen}
                    />
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

const DataTable = ({
  table,
  dt,
  subDepartmentId,
  onOpen,
  mandrelFallbackRows = [],
}: {
  table: CasePrepDetailTable;
  dt: CastingCuringDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
  mandrelFallbackRows?: Record<string, unknown>[];
}) => {
  const canonicalId = normalizeCcBlockId(table.blockId);

  // UI-owned Mandrel Measurements — grouped headers matching create form.
  if (isMandrelMeasurementsTable(table)) {
    return (
      <MandrelMeasurementsDetailsTable
        table={table}
        dt={dt}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
        fallbackRows={mandrelFallbackRows}
      />
    );
  }

  // UI-owned Curing Cycles structure matching create form; API rows only.
  if (isCuringCyclesTable(table)) {
    return (
      <DetailsFixedColumnsTable
        title={table.label || CC_FIXED_TABLE_TITLES.CURING_TABLE || "Curing Cycles"}
        rows={table.rows}
        columns={CURING_CYCLES_COLUMNS}
        theme={dt}
        getCellValue={resolveCuringCycleCellValue}
        overflowX
        minWidth={1080}
        renderCell={({ value }) => (
          <CastingCuringCellValue
            value={value}
            subDepartmentId={subDepartmentId}
            onOpen={onOpen}
          />
        )}
      />
    );
  }

  // Bowl / casting-from-bowl / slurry / post-cast — fixed create-form columns.
  if (canonicalId && CC_FIXED_TABLE_COLUMNS[canonicalId]) {
    return (
      <DetailsFixedColumnsTable
        title={table.label || CC_FIXED_TABLE_TITLES[canonicalId] || table.blockId}
        rows={table.rows}
        columns={CC_FIXED_TABLE_COLUMNS[canonicalId]!}
        theme={dt}
        getCellValue={(row, column, rowIndex) =>
          resolveCcFixedColumnValue(row, column.key, rowIndex)
        }
        overflowX
        minWidth={canonicalId === "CASTING_FROM_BOWL_DETAILS" ? 1100 : 720}
        renderCell={({ value }) => (
          <CastingCuringCellValue
            value={value}
            subDepartmentId={subDepartmentId}
            onOpen={onOpen}
          />
        )}
      />
    );
  }

  const columns = Object.keys(table.columnLabels ?? {});
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
                  {resolveCcFieldLabel(
                    column,
                    table.columnLabels[column] ?? formatCasePrepSectionLabel(column),
                  )}
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
  mandrelFallbackRows = [],
}: {
  section: CasePrepDetailSection;
  dt: CastingCuringDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
  mandrelFallbackRows?: Record<string, unknown>[];
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
        mandrelFallbackRows={mandrelFallbackRows}
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
  ovenOptions = [],
}: {
  motor: CastingCuringMotorDetailView;
  processTab: MotorProcessTab;
  dt: CastingCuringDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
  ovenOptions?: OvenSelectOption[];
}) => {
  const sections = processTab === "CASTING" ? motor.castingSections : motor.curingSections;
  const mandrelFallbackRows = (
    motor.castingData?.FINAL_ASSEMBLY_DETAILS?.motorCasing?.[0]?.MANDREL_MEASUREMENTS ?? []
  ).map((row, index) => ({
    srNo: row.srNo || index + 1,
    SR_NO: row.srNo || index + 1,
    A_MOCK: row.A_MOCK,
    aMock: row.A_MOCK,
    B_MOCK: row.B_MOCK,
    bMock: row.B_MOCK,
    B_FINAL: row.B_FINAL,
    bFinal: row.B_FINAL,
    C_MOCK: row.C_MOCK,
    cMock: row.C_MOCK,
    C_FINAL: row.C_FINAL,
    cFinal: row.C_FINAL,
    BELLOWS_THICKNESS_D: row.BELLOWS_THICKNESS_D,
    bellowsThicknessD: row.BELLOWS_THICKNESS_D,
    E_MOCK: row.E_MOCK,
    eMock: row.E_MOCK,
    E_FINAL: row.E_FINAL,
    eFinal: row.E_FINAL,
  }));

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Chip label={CC.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
          {motor.motorId}
        </Typography>
        {motor.motorSubmissionStatus
          ? (() => {
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
            })()
          : null}
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
            {
              label: CC.CURING_OVEN,
              value: resolveOvenLabel(motor.curingSetup.oven, ovenOptions),
            },
            {
              label: CC.CURING_OVEN_NO,
              value: (() => {
                const n = Number(motor.curingSetup.ovenNo);
                if (Number.isFinite(n) && n > 0) return CC.CURING_OVEN_NO_OPTION(n);
                return motor.curingSetup.ovenNo || "";
              })(),
            },
            {
              label: CC.CURING_TYPE,
              value: formatCuringTypeLabel(motor.curingSetup.curingType || ""),
            },
            {
              label: CC.CURING_CONFIGURATION,
              value: motor.curingSetup.configuration || "",
            },
            {
              label: CC.CURING_MOTORS_TO_CURE,
              value: motor.curingSetup.motorsToCureCount || "",
            },
            {
              label: CC.CURING_OVENS_UTILIZED,
              value: motor.curingSetup.ovensUtilized || "",
            },
          ]}
        />
      )}

      {sections.length === 0 ? (
        <Typography sx={dt.emptyText}>
          {processTab === "CASTING" ? CC.DETAILS_NO_CASTING : CC.DETAILS_NO_CURING}
        </Typography>
      ) : (
        sections.map((section) => (
          <SectionPanel
            key={section.sectionId}
            section={section}
            dt={dt}
            subDepartmentId={subDepartmentId}
            onOpen={onOpen}
            mandrelFallbackRows={mandrelFallbackRows}
          />
        ))
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
  const [ovenOptions, setOvenOptions] = useState<OvenSelectOption[]>([]);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "casting-and-curing")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  useEffect(() => {
    let cancelled = false;
    const loadOvens = async () => {
      try {
        const response = await generalController.getOvens();
        if (cancelled) return;
        if (!response?.success || !Array.isArray(response.data)) {
          setOvenOptions([]);
          return;
        }
        setOvenOptions(mapOvensToOptions(response.data));
      } catch {
        if (!cancelled) setOvenOptions([]);
      }
    };
    void loadOvens();
    return () => {
      cancelled = true;
    };
  }, []);

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
              <Typography
                sx={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: theme.palette.primary,
                  mb: 0.75,
                }}
              >
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
                    <Stack
                      key={motor.motorId}
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ flexShrink: 0 }}
                    >
                      <Button
                        size="small"
                        variant={index === activeMotorIndexSafe ? "contained" : "outlined"}
                        onClick={() => setActiveMotorIndex(index)}
                        sx={{ whiteSpace: "nowrap", textTransform: "none", fontWeight: 700 }}
                      >
                        {motor.motorId}
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
                              ml: 1,
                              border: "1px solid rgba(255, 255, 255, 0.38)",
                              color: index === activeMotorIndexSafe ? "#fff" : chipStyle?.color,
                              background:
                                index === activeMotorIndexSafe ? "#4594e4" : chipStyle?.bg,
                            }}
                          />
                        ) : null}
                      </Button>
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
              ovenOptions={ovenOptions}
            />
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}
      <FilePreviewDialog preview={preview} onClose={closePreview} onDownload={downloadCurrent} />
    </>
  );
};

export default CastingCuringDetailsContent;
