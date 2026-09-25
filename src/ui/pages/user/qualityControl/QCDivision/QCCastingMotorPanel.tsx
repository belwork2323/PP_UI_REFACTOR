import { useCallback, useMemo, type ReactNode } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import DateField, { TimeField } from "../../../../components/common/DateField";
import {
  QC_CASTING_SECTION_IDS,
  QC_CASTING_SECTION_TITLES,
  QC_CASTING_YES_NO_OPTIONS,
  getQcCastingMotorLabel,
} from "../../../../../hooks/user/qualityControl/qcCastingConfig";
import { getQcCastingTypeLabel } from "../../../../../hooks/user/qualityControl/qcCastingDivisionDetails";
import {
  applyWeightmentFieldChange,
  getCastingAssemblyDate,
  getCastingMandrelRows,
  getCastingPostCastField,
  getCastingPressurePlateRows,
  getCastingPropellantField,
  getCastingTableRows,
  getCastingType,
  getCastingWeightmentRows,
  setCastingAssemblyDate,
  setCastingMandrelRows,
  setCastingPostCastField,
  setCastingPressurePlateRows,
  setCastingPropellantField,
  setCastingTableRows,
  setCastingWeightmentRows,
  type QcCastingMandrelRow,
  type QcCastingPressurePlateRow,
  type QcCastingTableRow,
  type QcCastingWeightmentRow,
} from "../../../../../hooks/user/qualityControl/qcCastingTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import FieldErrorText from "@/ui/components/validation/FieldErrorText";
import { fieldError } from "@/data/validation/adapters/qcCasting.validation";

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

const tableDateFieldSx = {
  mb: 0,
  "& .MuiOutlinedInput-root": {
    fontSize: "0.72rem",
    minHeight: "32px",
    height: "32px",
  },
  "& .MuiOutlinedInput-input": {
    py: "4px",
    fontSize: "0.72rem",
  },
};

const tableTimeFieldSx = {
  mb: 0,
  "& .MuiOutlinedInput-root": {
    fontSize: "0.72rem",
    minHeight: "32px",
    height: "32px",
  },
  "& .MuiOutlinedInput-input": {
    py: "4px",
    fontSize: "0.72rem",
  },
};

const normalizeTimeValue = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

type ColumnDef<T> = {
  id: keyof T & string;
  label: string;
  fieldType?: "text" | "number" | "date" | "time" | "textarea" | "select" | "computed";
  options?: readonly { value: string; label: string }[];
  required?: boolean;
};

type EditableTableProps<T extends Record<string, unknown>> = {
  title: string;
  columns: ColumnDef<T>[];
  rows: T[];
  onChange: (rows: T[]) => void;
  createEmptyRow: (srNo: number) => T;
  readOnly?: boolean;
  allowAdd?: boolean;
  allowDelete?: boolean;
  validationErrors?: Record<string, string> | null;
  errorPrefix?: string;
};

const CastingEditableTable = <T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  onChange,
  createEmptyRow,
  readOnly = false,
  allowAdd = false,
  allowDelete = false,
  validationErrors = null,
  errorPrefix = "",
}: EditableTableProps<T>) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;

  const updateRow = (index: number, field: keyof T & string, value: string) => {
    onChange(
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return { ...row, SR_NO: rowIndex + 1 } as unknown as T;
        }
        if (field === "LOAD_CELL_INITIAL" || field === "LOAD_CELL_FINAL" || field === "TOTAL_WEIGHT") {
          const updated = applyWeightmentFieldChange(
            row as unknown as QcCastingWeightmentRow,
            field as keyof QcCastingWeightmentRow,
            value,
          );
          return { ...updated, SR_NO: rowIndex + 1 } as unknown as T;
        }
        return { ...row, [field]: value, SR_NO: rowIndex + 1 } as unknown as T;
      }),
    );
  };

  const addRow = () => {
    onChange([...rows, createEmptyRow(rows.length + 1)]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange(
      rows
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, SR_NO: rowIndex + 1 }) as unknown as T),
    );
  };

  const renderInput = (row: T, index: number, column: ColumnDef<T>): ReactNode => {
    const value = String(row[column.id] ?? "");
    if (readOnly) {
      const display =
        column.fieldType === "time"
          ? normalizeTimeValue(value)
          : column.fieldType === "select"
            ? column.options?.find((option) => option.value === value)?.label ?? value
            : value;
      return (
        <QCDivisionReadOnlyValue value={display} muted={!String(display ?? "").trim()} />
      );
    }

    if (column.fieldType === "date") {
      return (
        <DateField
          compact
          value={value}
          onChange={(next) => updateRow(index, column.id, next)}
          placeholder="DD-MM-YYYY"
          inputSx={tableDateFieldSx}
        />
      );
    }

    if (column.fieldType === "time") {
      return (
        <TimeField
          compact
          value={normalizeTimeValue(value)}
          onChange={(next) => updateRow(index, column.id, next)}
          placeholder="HH:mm"
          inputSx={tableTimeFieldSx}
        />
      );
    }

    if (column.fieldType === "select" && column.options) {
      return (
        <TextField
          select
          size="small"
          fullWidth
          value={value}
          onChange={(event) => updateRow(index, column.id, event.target.value)}
          sx={tableFieldSx}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="">
            <em>Select</em>
          </MenuItem>
          {column.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        size="small"
        fullWidth
        multiline={column.fieldType === "textarea"}
        minRows={column.fieldType === "textarea" ? 1 : undefined}
        type="text"
        value={value}
        onChange={(event) => updateRow(index, column.id, event.target.value)}
        inputProps={
          column.fieldType === "number" ? { inputMode: "decimal" as const } : undefined
        }
        sx={tableFieldSx}
      />
    );
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: BRAND.primary, mb: 0.75 }}>
        {title}
      </Typography>
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
        <Table size="small" sx={{ minWidth: 560, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>S. No</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} sx={headerSx}>
                  {column.required ? (
                    <FieldLabelWithAsterisk
                      label={column.label}
                      required
                      sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }}
                    />
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {!readOnly && allowDelete ? <TableCell sx={headerSx} align="center" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`${title}-${index}`}
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
                  {readOnly ? <QCDivisionReadOnlyValue value={index + 1} /> : index + 1}
                </TableCell>
                {columns.map((column) => {
                  const path = errorPrefix
                    ? `${errorPrefix}.${index}.${column.id}`
                    : `${index}.${column.id}`;
                  const message = fieldError(validationErrors ?? undefined, path);
                  return (
                    <TableCell key={column.id} sx={bodyCellSx}>
                      {renderInput(row, index, column)}
                      {!readOnly ? <FieldErrorText message={message} /> : null}
                    </TableCell>
                  );
                })}
                {!readOnly && allowDelete ? (
                  <TableCell sx={bodyCellSx} align="center">
                    <IconButton
                      size="small"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(index)}
                      sx={{ color: BRAND.danger }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!readOnly && allowAdd ? (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={addRow}
            sx={{ textTransform: "none" }}
          >
            Add Row
          </Button>
        </Box>
      ) : null}
    </Box>
  );
};

type FieldRowProps = {
  label: string;
  children: ReactNode;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
};

const FieldRow = ({ label, children, readOnly = false, required = false, error }: FieldRowProps) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
    <Typography
      component="div"
      sx={{
        fontSize: readOnly ? "0.65rem" : "0.72rem",
        fontWeight: readOnly ? 800 : 700,
        letterSpacing: readOnly ? "0.02em" : undefined,
        textTransform: readOnly ? "uppercase" : undefined,
        color: readOnly ? BRAND.primary : BRAND.textSub,
        minWidth: { sm: 200 },
      }}
    >
      {required ? (
        <FieldLabelWithAsterisk
          label={label}
          required
          sx={{ fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }}
        />
      ) : (
        label
      )}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {children}
      {!readOnly ? <FieldErrorText message={error} /> : null}
    </Box>
  </Stack>
);

const renderSelectField = (
  value: string,
  options: readonly { value: string; label: string }[],
  onChange: (value: string) => void,
  readOnly: boolean,
  placeholder = "Select",
  error = false,
) => {
  if (readOnly) {
    const label = options.find((option) => option.value === value)?.label ?? value;
    return <QCDivisionReadOnlyValue value={label} muted={!String(label ?? "").trim()} />;
  }
  return (
    <TextField
      select
      size="small"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      sx={tableFieldSx}
      SelectProps={{ displayEmpty: true }}
    >
      <MenuItem value="">
        <em>{placeholder}</em>
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

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

const MANDREL_COLUMNS: ColumnDef<QcCastingMandrelRow>[] = [
  {
    id: "READING_WITHOUT_CUP",
    label: "Reading without cup (Mandrel resting on motor dome) mm",
    fieldType: "number",
    required: true,
  },
  {
    id: "READING_WITH_BOTTOM_CUP",
    label: "Reading with bottom cup & gasket after tightening bottom cup mm",
    fieldType: "number",
    required: true,
  },
];

const CASTING_TABLE_COLUMNS: ColumnDef<QcCastingTableRow>[] = [
  {
    id: "FINAL_MIX_BOWL_NO",
    label: "Final Mix Bowl No",
    fieldType: "text",
    required: true,
  },
  { id: "PROPELLANT_QTY", label: "Qty of Propellant (Kg)", fieldType: "number", required: true },
  {
    id: "INITIAL_UNLOADING_VISCOSITY",
    label: "Initial unloading viscosity P@°C",
    fieldType: "number",
    required: true,
  },
  { id: "CASTING_START_TIME", label: "Time of start of casting", fieldType: "time", required: true },
  {
    id: "CASTING_COMPLETION_TIME",
    label: "Time of completion of casting",
    fieldType: "time",
    required: true,
  },
  {
    id: "SLURRY_CAST_FROM_EACH_BOWL",
    label: "Slurry cast from Bowl (kg)",
    fieldType: "number",
    required: true,
  },
  { id: "REMARKS", label: "Remarks", fieldType: "textarea" },
];

const WEIGHTMENT_COLUMNS: ColumnDef<QcCastingWeightmentRow>[] = [
  { id: "LOAD_CELL_INITIAL", label: "Load Cell Reading Initial", fieldType: "number", required: true },
  { id: "LOAD_CELL_FINAL", label: "Load Cell Reading Final", fieldType: "number", required: true },
  { id: "TOTAL_WEIGHT", label: "Total Weight (Kg)", fieldType: "number", required: true },
];

const PRESSURE_PLATE_COLUMNS: ColumnDef<QcCastingPressurePlateRow>[] = [
  { id: "START_TIME", label: "Start Time", fieldType: "time" },
  { id: "END_TIME", label: "End Time", fieldType: "time" },
  { id: "PRESSURE_SENSOR_USED", label: "Pressure Sensor Id", fieldType: "text" },
  { id: "INITIAL_PRESSURE_READING", label: "Initial Pressure Reading", fieldType: "number" },
  { id: "OBSERVATIONS", label: "Observations", fieldType: "textarea" },
];

type QCCastingMotorPanelProps = {
  motorId?: string | null;
  values: SchemaFormValues;
  onChange: (
    values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues),
  ) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
  validationErrors?: Record<string, string> | null;
};

const QCCastingMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  headerActions,
  validationErrors = null,
}: QCCastingMotorPanelProps) => {
  const err = (path: string) => fieldError(validationErrors ?? undefined, path);
  const castingType = useMemo(() => getCastingType(values), [values]);
  const assemblyDate = useMemo(() => getCastingAssemblyDate(values), [values]);
  const mandrelRows = useMemo(() => getCastingMandrelRows(values), [values]);
  const dateOfCasting = useMemo(
    () => getCastingPropellantField(values, "DATE_OF_CASTING"),
    [values],
  );
  const rhPercent = useMemo(() => getCastingPropellantField(values, "RH_PERCENT"), [values]);
  const vacuumMaintained = useMemo(
    () => getCastingPropellantField(values, "VACUUM_MAINTAINED"),
    [values],
  );
  const castingRows = useMemo(() => getCastingTableRows(values), [values]);
  const weightmentRows = useMemo(() => getCastingWeightmentRows(values), [values]);
  const soakingDuration = useMemo(
    () => getCastingPostCastField(values, "SOAKING_DURATION"),
    [values],
  );
  const pressureRequired = useMemo(
    () => getCastingPostCastField(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED"),
    [values],
  );
  const pressurePlateRows = useMemo(() => getCastingPressurePlateRows(values), [values]);

  const setMandrelRows = useCallback(
    (rows: QcCastingMandrelRow[]) => onChange(setCastingMandrelRows(values, rows)),
    [onChange, values],
  );
  const setCastingRows = useCallback(
    (rows: QcCastingTableRow[]) => onChange(setCastingTableRows(values, rows)),
    [onChange, values],
  );
  const setWeightmentRows = useCallback(
    (rows: QcCastingWeightmentRow[]) => onChange(setCastingWeightmentRows(values, rows)),
    [onChange, values],
  );
  const setPressureRows = useCallback(
    (rows: QcCastingPressurePlateRow[]) => onChange(setCastingPressurePlateRows(values, rows)),
    [onChange, values],
  );

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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
        <Box>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {getQcCastingMotorLabel(motorId)}
          </Typography>
          <Stack direction="row" alignItems="baseline" gap={0.75} mt={0.35} flexWrap="wrap">
            <Typography
              sx={{
                fontSize: readOnly ? "0.65rem" : "0.72rem",
                fontWeight: readOnly ? 800 : 700,
                letterSpacing: readOnly ? "0.02em" : undefined,
                textTransform: readOnly ? "uppercase" : undefined,
                color: readOnly ? BRAND.primary : BRAND.textSub,
              }}
            >
              Type of Casting:
            </Typography>
            {readOnly ? (
              <QCDivisionReadOnlyValue
                value={getQcCastingTypeLabel(castingType)}
                muted={!String(castingType ?? "").trim()}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: String(castingType ?? "").trim() ? 700 : 500,
                  color: String(castingType ?? "").trim() ? BRAND.text : BRAND.textSub,
                }}
              >
                {getQcCastingTypeLabel(castingType)}
              </Typography>
            )}
          </Stack>
        </Box>
        {headerActions}
      </Stack>

      <Stack spacing={2.5}>
        <SectionCard
          title={QC_CASTING_SECTION_TITLES[QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="Date" readOnly={readOnly} required error={err("ASSEMBLY_DATE")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={assemblyDate} muted={!assemblyDate.trim()} />
              ) : (
                <DateField
                  compact
                  value={assemblyDate}
                  onChange={(next) => onChange(setCastingAssemblyDate(values, next))}
                  placeholder="DD-MM-YYYY"
                  inputSx={tableDateFieldSx}
                  error={Boolean(err("ASSEMBLY_DATE"))}
                />
              )}
            </FieldRow>
            <CastingEditableTable
              title="Mandrel Assembly"
              columns={MANDREL_COLUMNS}
              rows={mandrelRows}
              onChange={setMandrelRows}
              createEmptyRow={(srNo) => ({
                SR_NO: srNo,
                READING_WITHOUT_CUP: "",
                READING_WITH_BOTTOM_CUP: "",
              })}
              readOnly={readOnly}
              validationErrors={validationErrors}
              errorPrefix="MANDREL_ASSEMBLY"
            />
          </Stack>
        </SectionCard>

        <SectionCard
          title={QC_CASTING_SECTION_TITLES[QC_CASTING_SECTION_IDS.PROPELLANT_CASTING]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="Date of Casting" readOnly={readOnly} required error={err("DATE_OF_CASTING")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={dateOfCasting} muted={!dateOfCasting.trim()} />
              ) : (
                <DateField
                  compact
                  value={dateOfCasting}
                  onChange={(next) =>
                    onChange(setCastingPropellantField(values, "DATE_OF_CASTING", next))
                  }
                  placeholder="DD-MM-YYYY"
                  inputSx={tableDateFieldSx}
                  error={Boolean(err("DATE_OF_CASTING"))}
                />
              )}
            </FieldRow>
            <FieldRow label="RH %" readOnly={readOnly} required error={err("RH_PERCENT")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={rhPercent} muted={!rhPercent.trim()} />
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  value={rhPercent}
                  onChange={(event) =>
                    onChange(setCastingPropellantField(values, "RH_PERCENT", event.target.value))
                  }
                  sx={tableFieldSx}
                  error={Boolean(err("RH_PERCENT"))}
                />
              )}
            </FieldRow>
            <FieldRow label="Vacuum Maintained" readOnly={readOnly} required error={err("VACUUM_MAINTAINED")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={vacuumMaintained} muted={!vacuumMaintained.trim()} />
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  value={vacuumMaintained}
                  onChange={(event) =>
                    onChange(
                      setCastingPropellantField(values, "VACUUM_MAINTAINED", event.target.value),
                    )
                  }
                  sx={tableFieldSx}
                  error={Boolean(err("VACUUM_MAINTAINED"))}
                />
              )}
            </FieldRow>
            <CastingEditableTable
              title="Casting Details"
              columns={CASTING_TABLE_COLUMNS}
              rows={castingRows}
              onChange={setCastingRows}
              createEmptyRow={(srNo) => ({
                SR_NO: srNo,
                FINAL_MIX_BOWL_NO: "",
                PROPELLANT_QTY: "",
                INITIAL_UNLOADING_VISCOSITY: "",
                CASTING_START_TIME: "",
                CASTING_COMPLETION_TIME: "",
                SLURRY_CAST_FROM_EACH_BOWL: "",
                REMARKS: "",
              })}
              readOnly={readOnly}
              validationErrors={validationErrors}
              errorPrefix="CASTING_TABLE"
            />
          </Stack>
        </SectionCard>

        <SectionCard
          title={QC_CASTING_SECTION_TITLES[QC_CASTING_SECTION_IDS.WEIGHTMENT]}
          readOnly={readOnly}
        >
          <CastingEditableTable
            title="Weighment Details"
            columns={WEIGHTMENT_COLUMNS}
            rows={weightmentRows}
            onChange={setWeightmentRows}
            createEmptyRow={(srNo) =>
              ({
                SR_NO: srNo,
                LOAD_CELL_INITIAL: "",
                LOAD_CELL_FINAL: "",
                TOTAL_WEIGHT: "",
              }) as QcCastingWeightmentRow
            }
            readOnly={readOnly}
            validationErrors={validationErrors}
            errorPrefix="WEIGHTMENT_DETAILS"
          />
        </SectionCard>

        <SectionCard
          title={QC_CASTING_SECTION_TITLES[QC_CASTING_SECTION_IDS.POST_CAST]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="Soaking Duration" readOnly={readOnly} required error={err("SOAKING_DURATION")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={soakingDuration} muted={!soakingDuration.trim()} />
              ) : (
                <TimeField
                  compact
                  value={soakingDuration}
                  onChange={(next) =>
                    onChange(setCastingPostCastField(values, "SOAKING_DURATION", next))
                  }
                  placeholder="HH:mm"
                  inputSx={tableTimeFieldSx}
                  error={Boolean(err("SOAKING_DURATION"))}
                />
              )}
            </FieldRow>
            <FieldRow label="Pressure Plate Assembly Applicable" readOnly={readOnly} required error={err("PRESSURE_PLATE_ASSEMBLY_REQUIRED")}>
              {renderSelectField(
                pressureRequired,
                QC_CASTING_YES_NO_OPTIONS,
                (next) =>
                  onChange(setCastingPostCastField(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED", next)),
                readOnly,
                "Select",
                Boolean(err("PRESSURE_PLATE_ASSEMBLY_REQUIRED")),
              )}
            </FieldRow>
            {pressureRequired === "YES" ? (
              <CastingEditableTable
                title="Pressure Plate Assembly Details"
                columns={PRESSURE_PLATE_COLUMNS}
                rows={pressurePlateRows}
                onChange={setPressureRows}
                createEmptyRow={(srNo) => ({
                  SR_NO: srNo,
                  START_TIME: "",
                  END_TIME: "",
                  PRESSURE_SENSOR_USED: "",
                  INITIAL_PRESSURE_READING: "",
                  OBSERVATIONS: "",
                })}
                readOnly={readOnly}
                validationErrors={validationErrors}
                errorPrefix="PRESSURE_PLATE_DETAILS"
              />
            ) : null}
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  );
};

export default QCCastingMotorPanel;
