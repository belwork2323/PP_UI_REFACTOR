import { useEffect, useMemo, type ReactNode } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  IconButton,
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
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import NdtFileField from "../NDT/NdtFileField";
import {
  QC_PROPELLANT_AVG_COLUMN,
  QC_PROPELLANT_ROW_UPLOAD_FIELD,
  QC_PROPELLANT_SECTION_IDS,
  QC_PROPELLANT_SECTION_TITLES,
  QC_PROPELLANT_STD_COLUMN,
  getQcPropellantBemSubLabel,
  getQcPropellantFmColumnLabel,
  getQcPropellantMotorLabel,
  groupQcPropellantBemColumns,
  resolveQcPropellantPremixCount,
  type QcPropellantBallisticRow,
  type QcPropellantPropertyRow,
} from "../../../../../hooks/user/qualityControl/qcPropellantConfig";
import {
  addPropellantBemColumn,
  applyPropellantRowStats,
  getPropellantBallisticColumns,
  getPropellantBallisticRows,
  getPropellantFmColumns,
  getPropellantMechanicalGraph,
  getPropellantPropertyRows,
  removePropellantBemColumn,
  setPropellantBallisticRows,
  setPropellantMechanicalGraph,
  setPropellantPropertyRows,
  syncPropellantFmColumns,
} from "../../../../../hooks/user/qualityControl/qcPropellantTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";

const BRAND = QC_DIVISION_BRAND;
const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

const TH = {
  ...uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
    headerFontSize: "0.68rem",
    headerLetterSpacing: "0.06em",
    headerPaddingY: "10px",
    headerPaddingX: "12px",
  }),
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
  actions = null,
}: {
  title: string;
  children: ReactNode;
  readOnly?: boolean;
  actions?: ReactNode;
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>
          {title}
        </Typography>
        {actions}
      </Box>
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Box>
  );

const CellInput = ({
  value,
  onChange,
  disabled,
  readOnly,
  multiline = false,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  type?: "text" | "number";
}) => {
  if (readOnly) {
    return <QCDivisionReadOnlyValue value={value} muted={!String(value).trim()} />;
  }
  return (
    <TextField
      size="small"
      fullWidth
      type={type === "number" ? "number" : "text"}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      sx={tableFieldSx}
    />
  );
};

type PropertyTableProps = {
  sectionId: string;
  rows: QcPropellantPropertyRow[];
  columns: string[];
  onRowsChange: (rows: QcPropellantPropertyRow[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
  includeSampleNo?: boolean;
  includeRemarks?: boolean;
  includeRowStats?: boolean;
  includeRowUpload?: boolean;
};

const PropertyTable = ({
  sectionId,
  rows,
  columns,
  onRowsChange,
  readOnly = false,
  disabled = false,
  includeSampleNo = false,
  includeRemarks = false,
  includeRowStats = false,
  includeRowUpload = false,
}: PropertyTableProps) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;
  const displayRows = includeRowStats
    ? rows.filter((row) => row.kind !== "mean" && row.kind !== "std")
    : rows;

  const updateCell = (index: number, field: string, value: string | FileRef[]) => {
    onRowsChange(
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, [field]: value };
        if (includeRowStats && typeof value === "string" && columns.includes(field)) {
          return applyPropellantRowStats(next, columns);
        }
        return next;
      }),
    );
  };

  const displayValue = (row: QcPropellantPropertyRow, columnId: string) => String(row[columnId] ?? "");

  return (
    <Box>
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : {
                overflow: "hidden",
                overflowX: "auto",
                border: `1px solid ${TABLE_BORDER}`,
                borderRadius: 2,
                background: "#fff",
              }
        }
      >
        <Table size="small" sx={{ minWidth: 720, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              {includeSampleNo ? <TableCell sx={headerSx}>Sample No</TableCell> : null}
              <TableCell sx={headerSx}>Property</TableCell>
              <TableCell sx={headerSx}>
                {sectionId === QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES ? "Spec." : "Specification"}
              </TableCell>
              {columns.map((columnId) => (
                <TableCell key={columnId} sx={headerSx}>
                  {getQcPropellantFmColumnLabel(columnId)}
                </TableCell>
              ))}
              {includeRowStats ? (
                <>
                  <TableCell sx={headerSx}>Avg</TableCell>
                  <TableCell sx={headerSx}>Std Dev</TableCell>
                </>
              ) : null}
              {includeRemarks ? <TableCell sx={headerSx}>Remarks</TableCell> : null}
              {includeRowUpload ? <TableCell sx={headerSx}>Upload</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.map((row) => {
              const index = rows.indexOf(row);
              const uploadFiles = Array.isArray(row[QC_PROPELLANT_ROW_UPLOAD_FIELD])
                ? (row[QC_PROPELLANT_ROW_UPLOAD_FIELD] as FileRef[])
                : [];
              return (
                <TableRow
                  key={`${sectionId}-${index}-${row.PROPERTY}`}
                  sx={{
                    background: readOnly
                      ? index % 2 === 1
                        ? alpha(BRAND.primary, 0.03)
                        : "#fff"
                      : index % 2 === 0
                        ? "#fff"
                        : alpha(BRAND.surface, 0.55),
                  }}
                >
                  {includeSampleNo ? (
                    <TableCell sx={bodyCellSx}>
                      {readOnly ? (
                        <QCDivisionReadOnlyValue value={row.SAMPLE_NO ?? ""} muted={row.SAMPLE_NO === ""} />
                      ) : (
                        row.SAMPLE_NO ?? ""
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell sx={bodyCellSx}>
                    {readOnly ? (
                      <QCDivisionReadOnlyValue value={row.PROPERTY} />
                    ) : (
                      row.PROPERTY
                    )}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <CellInput
                      value={String(row.SPECIFICATION ?? "")}
                      onChange={(value) => updateCell(index, "SPECIFICATION", value)}
                      disabled={inputsDisabled}
                      readOnly={readOnly}
                    />
                  </TableCell>
                  {columns.map((columnId) => (
                    <TableCell key={columnId} sx={bodyCellSx}>
                      <CellInput
                        value={displayValue(row, columnId)}
                        onChange={(value) => updateCell(index, columnId, value)}
                        disabled={inputsDisabled}
                        readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                  ))}
                  {includeRowStats ? (
                    <>
                      <TableCell sx={bodyCellSx}>
                        <CellInput
                          value={String(row[QC_PROPELLANT_AVG_COLUMN] ?? "")}
                          onChange={(value) => updateCell(index, QC_PROPELLANT_AVG_COLUMN, value)}
                          disabled={inputsDisabled}
                          readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={bodyCellSx}>
                        <CellInput
                          value={String(row[QC_PROPELLANT_STD_COLUMN] ?? "")}
                          onChange={(value) => updateCell(index, QC_PROPELLANT_STD_COLUMN, value)}
                          disabled={inputsDisabled}
                          readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                    </>
                  ) : null}
                  {includeRemarks ? (
                    <TableCell sx={bodyCellSx}>
                      <CellInput
                        value={String(row.REMARKS ?? "")}
                        onChange={(value) => updateCell(index, "REMARKS", value)}
                        disabled={inputsDisabled}
                        readOnly={readOnly}
                        multiline
                      />
                    </TableCell>
                  ) : null}
                  {includeRowUpload ? (
                    <TableCell sx={bodyCellSx}>
                      <NdtFileField
                        files={uploadFiles}
                        onChange={(next) =>
                          updateCell(index, QC_PROPELLANT_ROW_UPLOAD_FIELD, next)
                        }
                        disabled={inputsDisabled}
                        readOnly={readOnly}
                        multiple={false}
                        acceptMode="image"
                        subDeptSlug="qc-division"
                        compact
                        emptyLabel="Upload"
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const BallisticTable = ({
  rows,
  columns,
  onRowsChange,
  onAddBem,
  onRemoveBem,
  readOnly = false,
  disabled = false,
}: {
  rows: QcPropellantBallisticRow[];
  columns: string[];
  onRowsChange: (rows: QcPropellantBallisticRow[]) => void;
  onAddBem: (fmIndex: number) => void;
  onRemoveBem: (columnId: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;
  const groups = groupQcPropellantBemColumns(columns);

  const updateCell = (index: number, field: string, value: string) => {
    onRowsChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  return (
    <Box>
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : {
                overflow: "hidden",
                overflowX: "auto",
                border: `1px solid ${TABLE_BORDER}`,
                borderRadius: 2,
                background: "#fff",
              }
        }
      >
        <Table size="small" sx={{ minWidth: 640, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerSx, verticalAlign: "middle" }} rowSpan={2}>
                Details / Mix
              </TableCell>
              <TableCell sx={{ ...headerSx, verticalAlign: "middle" }} rowSpan={2}>
                Spec.
              </TableCell>
              {groups.map((group) => (
                <TableCell
                  key={`fm-group-${group.fmIndex}`}
                  sx={{ ...headerSx, textAlign: "left", minWidth: 168 }}
                  colSpan={group.columnIds.length}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1.5}
                    sx={{ width: "100%" }}
                  >
                    <Box component="span">FM-{group.fmIndex}</Box>
                    {readOnly ? null : (
                      <Button
                        size="small"
                        startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
                        onClick={() => onAddBem(group.fmIndex)}
                        disabled={inputsDisabled}
                        sx={{
                          color: "#fff",
                          textTransform: "none",
                          minWidth: 0,
                          ml: "auto",
                          px: 0.75,
                          py: 0,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          borderColor: alpha("#fff", 0.45),
                          flexShrink: 0,
                        }}
                        variant="outlined"
                      >
                        Add BEM
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {groups.flatMap((group) =>
                group.columnIds.map((columnId) => (
                  <TableCell key={columnId} sx={headerSx}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
                      <Box component="span">{getQcPropellantBemSubLabel(columnId)}</Box>
                      {!readOnly && group.columnIds.length > 1 ? (
                        <IconButton
                          size="small"
                          onClick={() => onRemoveBem(columnId)}
                          disabled={inputsDisabled}
                          sx={{ color: "#fff", p: 0.25 }}
                          aria-label={`Remove ${getQcPropellantFmColumnLabel(columnId)}`}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      ) : null}
                    </Stack>
                  </TableCell>
                )),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`ballistic-${index}-${row.DETAILS}`}
                sx={{
                  background: readOnly
                    ? index % 2 === 1
                      ? alpha(BRAND.primary, 0.03)
                      : "#fff"
                    : index % 2 === 0
                      ? "#fff"
                      : alpha(BRAND.surface, 0.55),
                }}
              >
                <TableCell sx={bodyCellSx}>
                  {readOnly ? <QCDivisionReadOnlyValue value={row.DETAILS} /> : row.DETAILS}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  <CellInput
                    value={String(row.SPECIFICATION ?? "")}
                    onChange={(value) => updateCell(index, "SPECIFICATION", value)}
                    disabled={inputsDisabled}
                    readOnly={readOnly}
                  />
                </TableCell>
                {columns.map((columnId) => (
                  <TableCell key={columnId} sx={bodyCellSx}>
                    <CellInput
                      value={String(row[columnId] ?? "")}
                      onChange={(value) => updateCell(index, columnId, value)}
                      disabled={inputsDisabled}
                      readOnly={readOnly}
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

type QCPropellantMotorPanelProps = {
  motorId?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
  batchPayload?: unknown;
};

const QCPropellantMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
  batchPayload = null,
}: QCPropellantMotorPanelProps) => {
  const inputsDisabled = disabled || readOnly;
  const premixFmCount = resolveQcPropellantPremixCount(batchPayload);
  const savedFmCount = Math.max(
    getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES).length,
    getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES).length,
    getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE).length,
    getPropellantBallisticColumns(values).reduce((max, columnId) => {
      const match = String(columnId).match(/^FM_(\d+)/i);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0),
  );
  const fmCount = Math.max(premixFmCount, savedFmCount, 1);

  useEffect(() => {
    if (readOnly) return;
    const current = getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES).length;
    if (current >= fmCount) return;
    onChange(syncPropellantFmColumns(values, fmCount));
  }, [fmCount, onChange, readOnly, values]);

  const mechanicalRows = useMemo(
    () => getPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES, fmCount),
    [fmCount, values],
  );
  const interfaceRows = useMemo(
    () => getPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES, fmCount),
    [fmCount, values],
  );
  const ssbrRows = useMemo(
    () => getPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE, fmCount),
    [fmCount, values],
  );
  const ballisticRows = useMemo(() => getPropellantBallisticRows(values, fmCount), [fmCount, values]);
  const mechanicalColumns = getPropellantFmColumns(
    values,
    QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES,
    false,
    fmCount,
  );
  const interfaceColumns = getPropellantFmColumns(
    values,
    QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES,
    false,
    fmCount,
  );
  const ssbrColumns = getPropellantFmColumns(
    values,
    QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE,
    false,
    fmCount,
  );
  const ballisticColumns = getPropellantBallisticColumns(values, fmCount);
  const mechanicalGraph = getPropellantMechanicalGraph(values);

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
          {getQcPropellantMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>
      <Stack spacing={1.5}>
        <SectionCard title={QC_PROPELLANT_SECTION_TITLES.MECHANICAL_PROPERTIES} readOnly={readOnly}>
          <Stack spacing={1.5}>
            <PropertyTable
              sectionId={QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES}
              rows={mechanicalRows}
              columns={mechanicalColumns}
              onRowsChange={(rows) =>
                onChange(setPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES, rows))
              }
              readOnly={readOnly}
              disabled={inputsDisabled}
              includeSampleNo
              includeRemarks
              includeRowStats
            />
            <Box>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.primary, mb: 0.75 }}>
                Upload Graph
              </Typography>
              <NdtFileField
                files={mechanicalGraph}
                onChange={(next) => onChange(setPropellantMechanicalGraph(values, next))}
                disabled={inputsDisabled}
                readOnly={readOnly}
                multiple={false}
                acceptMode="image"
                subDeptSlug="qc-division"
                emptyLabel="Upload Graph"
              />
            </Box>
          </Stack>
        </SectionCard>
        <SectionCard title={QC_PROPELLANT_SECTION_TITLES.INTERFACE_PROPERTIES} readOnly={readOnly}>
          <PropertyTable
            sectionId={QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES}
            rows={interfaceRows}
            columns={interfaceColumns}
            onRowsChange={(rows) =>
              onChange(setPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES, rows))
            }
            readOnly={readOnly}
            disabled={inputsDisabled}
            includeSampleNo
            includeRemarks
            includeRowStats
            includeRowUpload
          />
        </SectionCard>
        <SectionCard title={QC_PROPELLANT_SECTION_TITLES.SSBR_UBR_BURN_RATE} readOnly={readOnly}>
          <PropertyTable
            sectionId={QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE}
            rows={ssbrRows}
            columns={ssbrColumns}
            onRowsChange={(rows) =>
              onChange(setPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE, rows))
            }
            readOnly={readOnly}
            disabled={inputsDisabled}
            includeRowStats
            includeRowUpload
          />
        </SectionCard>
        <SectionCard title={QC_PROPELLANT_SECTION_TITLES.BALLISTIC_EVALUATION} readOnly={readOnly}>
          <BallisticTable
            rows={ballisticRows}
            columns={ballisticColumns}
            onRowsChange={(rows) => onChange(setPropellantBallisticRows(values, rows))}
            onAddBem={(fmIndex) => onChange(addPropellantBemColumn(values, fmIndex, fmCount))}
            onRemoveBem={(columnId) => onChange(removePropellantBemColumn(values, columnId, fmCount))}
            readOnly={readOnly}
            disabled={inputsDisabled}
          />
        </SectionCard>
      </Stack>
    </Box>
  );
};

export default QCPropellantMotorPanel;
