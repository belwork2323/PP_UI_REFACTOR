import { useMemo, type ReactNode } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import type { CasePrepFileRef } from "../../../../../data/models/user/CasePrepMotorDataModel";
import { STRINGS } from "../../../../../app/config/strings";
import NdtFileField from "../NDT/NdtFileField";
import {
  QC_NDT_FIELD_LABELS,
  QC_NDT_SECTION_TITLES,
  getQcNdtMotorLabel,
  type QcNdtRadiographyDetailRow,
  type QcNdtRadiographyObservationRow,
  type QcNdtVisualInspectionRow,
} from "../../../../../hooks/user/qualityControl/qcNdtConfig";
import {
  getNdtObservationRows,
  getNdtRadiographyDetailRows,
  getNdtUploadMedia,
  getNdtVisualRows,
  setNdtObservationRows,
  setNdtRadiographyDetailRows,
  setNdtUploadMedia,
  setNdtVisualRows,
} from "../../../../../hooks/user/qualityControl/qcNdtTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";

const BRAND = QC_DIVISION_BRAND;
const NDT_S = STRINGS.QUALITY_CONTROL.NDT;
const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

const TH = {
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  padding: "10px 12px",
  whiteSpace: "nowrap" as const,
  border: `1px solid ${HEADER_CELL_BORDER}`,
};

const cellSx = {
  fontSize: "0.72rem",
  py: 0.75,
  px: 0.75,
  verticalAlign: "middle",
  border: `1px solid ${TABLE_BORDER}`,
};

const tableFieldSx = { "& .MuiOutlinedInput-root": { fontSize: "0.72rem" } };

const SectionCard = ({
  title,
  children,
  readOnly = false,
}: {
  title: string;
  children: ReactNode;
  readOnly?: boolean;
}) =>
  readOnly ? (
    <Box
      sx={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 1,
        background: "#fff",
        p: 1.5,
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: BRAND.primary, mb: 0.75 }}>
        {title}
      </Typography>
      {children}
    </Box>
  ) : (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${TABLE_BORDER}`,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.85,
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Box>
  );

const RadiographyDetailsTable = ({
  rows,
  onChange,
  readOnly = false,
  disabled = false,
}: {
  rows: QcNdtRadiographyDetailRow[];
  onChange: (rows: QcNdtRadiographyDetailRow[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;
  const columns: Array<{
    id: keyof QcNdtRadiographyDetailRow;
    label: string;
    kind: "text" | "number";
  }> = [
    { id: "MACHINE_NO", label: QC_NDT_FIELD_LABELS.MACHINE_NO, kind: "text" },
    { id: "NO_OF_SECTIONS", label: QC_NDT_FIELD_LABELS.NO_OF_SECTIONS, kind: "number" },
    { id: "NO_OF_ORIENTATIONS", label: QC_NDT_FIELD_LABELS.NO_OF_ORIENTATIONS, kind: "number" },
    { id: "NORMAL_EXPOSURES", label: QC_NDT_FIELD_LABELS.NORMAL_EXPOSURES, kind: "number" },
    { id: "TANGENTIAL_EXPOSURES", label: QC_NDT_FIELD_LABELS.TANGENTIAL_EXPOSURES, kind: "number" },
  ];

  const updateCell = (index: number, field: keyof QcNdtRadiographyDetailRow, value: string) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  return (
    <Box>
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : { border: `1px solid ${TABLE_BORDER}`, borderRadius: 1, overflowX: "auto" }
        }
      >
        <Table size="small" sx={{ minWidth: 860, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.SR_NO}</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} sx={headerSx}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`rt-${index}`}
                sx={{
                  background: readOnly
                    ? index % 2 === 0
                      ? "#fff"
                      : alpha(BRAND.primaryLight, 0.04)
                    : undefined,
                }}
              >
                <TableCell sx={bodyCellSx}>
                  {readOnly ? <QCDivisionReadOnlyValue value={index + 1} /> : index + 1}
                </TableCell>
                {columns.map((column) => {
                  const value = String(row[column.id] ?? "");
                  return (
                    <TableCell key={column.id} sx={bodyCellSx}>
                      {readOnly ? (
                        <QCDivisionReadOnlyValue value={value} muted={!value.trim()} />
                      ) : (
                        <TextField
                          size="small"
                          fullWidth
                          type={column.kind === "number" ? "number" : "text"}
                          value={value}
                          disabled={inputsDisabled}
                          onChange={(event) => updateCell(index, column.id, event.target.value)}
                          sx={tableFieldSx}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const ObservationTable = ({
  rows,
  onChange,
  readOnly = false,
  disabled = false,
}: {
  rows: QcNdtRadiographyObservationRow[];
  onChange: (rows: QcNdtRadiographyObservationRow[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;

  const updateCell = (index: number, field: "OBSERVATIONS" | "LOCATION", value: string) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  return (
    <TableContainer
      sx={
        readOnly
          ? qcReadOnlyTableContainerSx
          : { border: `1px solid ${TABLE_BORDER}`, borderRadius: 1, overflowX: "auto" }
      }
    >
      <Table size="small" sx={{ minWidth: 640, borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.SR_NO}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.TYPE_OF_DEFECT}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.OBSERVATIONS}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.LOCATION}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={`obs-${row.SR_NO}`}
              sx={{
                background: readOnly
                  ? index % 2 === 0
                    ? "#fff"
                    : alpha(BRAND.primaryLight, 0.04)
                  : undefined,
              }}
            >
              <TableCell sx={bodyCellSx}>
                {readOnly ? <QCDivisionReadOnlyValue value={row.SR_NO} /> : row.SR_NO}
              </TableCell>
              <TableCell sx={bodyCellSx}>
                <QCDivisionReadOnlyValue value={row.TYPE_OF_DEFECT} />
              </TableCell>
              <TableCell sx={bodyCellSx}>
                {readOnly ? (
                  <QCDivisionReadOnlyValue value={row.OBSERVATIONS} muted={!row.OBSERVATIONS.trim()} />
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={1}
                    value={row.OBSERVATIONS}
                    disabled={inputsDisabled}
                    onChange={(event) => updateCell(index, "OBSERVATIONS", event.target.value)}
                    sx={tableFieldSx}
                  />
                )}
              </TableCell>
              <TableCell sx={bodyCellSx}>
                {readOnly ? (
                  <QCDivisionReadOnlyValue value={row.LOCATION} muted={!row.LOCATION.trim()} />
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    value={row.LOCATION}
                    disabled={inputsDisabled}
                    onChange={(event) => updateCell(index, "LOCATION", event.target.value)}
                    sx={tableFieldSx}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const VisualInspectionTable = ({
  rows,
  onChange,
  readOnly = false,
  disabled = false,
}: {
  rows: QcNdtVisualInspectionRow[];
  onChange: (rows: QcNdtVisualInspectionRow[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;

  const updateTextCell = (index: number, field: "OBSERVATION" | "LOCATION", value: string) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const updateFiles = (index: number, next: CasePrepFileRef[]) => {
    onChange(
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, UPLOAD_IMAGE: next } : row)),
    );
  };

  return (
    <TableContainer
      sx={
        readOnly
          ? qcReadOnlyTableContainerSx
          : { border: `1px solid ${TABLE_BORDER}`, borderRadius: 1, overflowX: "auto" }
      }
    >
      <Table size="small" sx={{ minWidth: 760, borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.SR_NO}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.OBSERVATION_TYPE}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.OBSERVATION}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.LOCATION}</TableCell>
            <TableCell sx={headerSx}>{QC_NDT_FIELD_LABELS.UPLOAD_IMAGE}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={`vi-${row.SR_NO}`}
              sx={{
                background: readOnly
                  ? index % 2 === 0
                    ? "#fff"
                    : alpha(BRAND.primaryLight, 0.04)
                  : undefined,
              }}
            >
              <TableCell sx={bodyCellSx}>
                {readOnly ? <QCDivisionReadOnlyValue value={row.SR_NO} /> : row.SR_NO}
              </TableCell>
              <TableCell sx={bodyCellSx}>
                <QCDivisionReadOnlyValue value={row.OBSERVATION_TYPE} />
              </TableCell>
              <TableCell sx={bodyCellSx}>
                {readOnly ? (
                  <QCDivisionReadOnlyValue value={row.OBSERVATION} muted={!row.OBSERVATION.trim()} />
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={1}
                    value={row.OBSERVATION}
                    disabled={inputsDisabled}
                    onChange={(event) => updateTextCell(index, "OBSERVATION", event.target.value)}
                    sx={tableFieldSx}
                  />
                )}
              </TableCell>
              <TableCell sx={bodyCellSx}>
                {readOnly ? (
                  <QCDivisionReadOnlyValue value={row.LOCATION} muted={!row.LOCATION.trim()} />
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    value={row.LOCATION}
                    disabled={inputsDisabled}
                    onChange={(event) => updateTextCell(index, "LOCATION", event.target.value)}
                    sx={tableFieldSx}
                  />
                )}
              </TableCell>
              <TableCell sx={bodyCellSx}>
                <NdtFileField
                  files={row.UPLOAD_IMAGE ?? []}
                  onChange={(next) => updateFiles(index, next)}
                  multiple
                  acceptMode="image"
                  subDeptSlug="qc-division"
                  compact
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                  emptyLabel={NDT_S.FILE_EMPTY_IMAGE}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type QCNdtMotorPanelProps = {
  motorId?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
};

const QCNdtMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
}: QCNdtMotorPanelProps) => {
  const inputsDisabled = disabled || readOnly;
  const radiographyRows = useMemo(() => getNdtRadiographyDetailRows(values), [values]);
  const observationRows = useMemo(() => getNdtObservationRows(values), [values]);
  const visualRows = useMemo(() => getNdtVisualRows(values), [values]);
  const uploadMedia = getNdtUploadMedia(values);

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25} gap={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {getQcNdtMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>
      <Stack spacing={1.5}>
        <SectionCard title={QC_NDT_SECTION_TITLES.RADIOGRAPHY_DETAILS} readOnly={readOnly}>
          <RadiographyDetailsTable
            rows={radiographyRows}
            onChange={(rows) => onChange(setNdtRadiographyDetailRows(values, rows))}
            readOnly={readOnly}
            disabled={inputsDisabled}
          />
        </SectionCard>
        <SectionCard title={QC_NDT_SECTION_TITLES.RADIOGRAPHY_OBSERVATIONS} readOnly={readOnly}>
          <ObservationTable
            rows={observationRows}
            onChange={(rows) => onChange(setNdtObservationRows(values, rows))}
            readOnly={readOnly}
            disabled={inputsDisabled}
          />
        </SectionCard>
        <SectionCard title={QC_NDT_SECTION_TITLES.VISUAL_INSPECTION} readOnly={readOnly}>
          <VisualInspectionTable
            rows={visualRows}
            onChange={(rows) => onChange(setNdtVisualRows(values, rows))}
            readOnly={readOnly}
            disabled={inputsDisabled}
          />
        </SectionCard>
        <SectionCard title={QC_NDT_SECTION_TITLES.UPLOAD_MEDIA} readOnly={readOnly}>
          <NdtFileField
            files={uploadMedia}
            onChange={(next) => onChange(setNdtUploadMedia(values, next))}
            multiple
            acceptMode="imageVideo"
            subDeptSlug="qc-division"
            readOnly={readOnly}
            disabled={inputsDisabled}
            emptyLabel={QC_NDT_FIELD_LABELS.UPLOAD_VIDEO_PHOTO}
          />
        </SectionCard>
      </Stack>
    </Box>
  );
};

export default QCNdtMotorPanel;
