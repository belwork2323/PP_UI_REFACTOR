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
import DateField, { DateTimeField, TimeField } from "../../../../components/common/DateField";
import {
  QC_CURING_HOT_WATER_STATUS_OPTIONS,
  QC_CURING_SECTION_IDS,
  QC_CURING_SECTION_TITLES,
  QC_CURING_SUBSCALE_TEMPERATURE_PLACEHOLDER,
  formatQcCuringMotorStageLabel,
  getQcCuringMotorLabel,
  getQcCuringTypeLabel,
  resolveCuringCycleColumnIds,
  type QcCuringCycleColumnId,
} from "../../../../../hooks/user/qualityControl/qcCuringConfig";
import {
  getCuringCycleRows,
  getCuringPostField,
  getCuringSetupField,
  getCuringSubscaleField,
  getCuringSubscaleParameterRows,
  getCuringTypeFromValues,
  setCuringCycleRows,
  setCuringPostField,
  setCuringSetupField,
  setCuringSubscaleField,
  setCuringSubscaleParameterRows,
  type QcCuringCycleRow,
  type QcCuringSubscaleParameterRow,
} from "../../../../../hooks/user/qualityControl/qcCuringTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";

const BRAND = QC_DIVISION_BRAND;
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
  fieldType?: "text" | "number" | "date" | "time" | "textarea" | "select";
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
  readOnlyColumn?: boolean;
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
  showSerialNumber?: boolean;
};

const CuringEditableTable = <T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  onChange,
  createEmptyRow,
  readOnly = false,
  allowAdd = false,
  allowDelete = false,
  showSerialNumber = true,
}: EditableTableProps<T>) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;

  const updateRow = (index: number, field: keyof T & string, value: string) => {
    onChange(
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return showSerialNumber
            ? ({ ...row, SR_NO: rowIndex + 1 } as T)
            : ({ ...row } as T);
        }
        return showSerialNumber
          ? ({ ...row, [field]: value, SR_NO: rowIndex + 1 } as T)
          : ({ ...row, [field]: value } as T);
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
        .map((row, rowIndex) =>
          showSerialNumber ? ({ ...row, SR_NO: rowIndex + 1 } as T) : ({ ...row } as T),
        ),
    );
  };

  const renderInput = (row: T, index: number, column: ColumnDef<T>): ReactNode => {
    const rawValue = String(row[column.id] ?? "");
    const value =
      column.id === "PARAMETER" && rawValue === QC_CURING_SUBSCALE_TEMPERATURE_PLACEHOLDER
        ? ""
        : rawValue;
    const placeholder =
      column.id === "PARAMETER" && !value.trim()
        ? QC_CURING_SUBSCALE_TEMPERATURE_PLACEHOLDER
        : column.placeholder;
    if (readOnly || column.readOnlyColumn) {
      const display =
        column.fieldType === "time"
          ? normalizeTimeValue(value)
          : column.fieldType === "select"
            ? column.options?.find((option) => option.value === value)?.label ?? value
            : value;
      const showPlaceholder = column.id === "PARAMETER" && !String(display ?? "").trim();
      return (
        <QCDivisionReadOnlyValue
          value={showPlaceholder ? placeholder ?? "" : display}
          muted={showPlaceholder || !String(display ?? "").trim()}
        />
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
        placeholder={placeholder}
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
              {showSerialNumber ? <TableCell sx={headerSx}>S. No</TableCell> : null}
              {columns.map((column) => (
                <TableCell key={column.id} sx={headerSx}>
                  {column.label}
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
                {showSerialNumber ? (
                  <TableCell sx={bodyCellSx}>
                    {readOnly ? <QCDivisionReadOnlyValue value={index + 1} /> : index + 1}
                  </TableCell>
                ) : null}
                {columns.map((column) => (
                  <TableCell key={column.id} sx={bodyCellSx}>
                    {renderInput(row, index, column)}
                  </TableCell>
                ))}
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

const setupDateTimeFieldSx = {
  mb: 0,
  "& .MuiOutlinedInput-root": {
    fontSize: "0.72rem",
    minHeight: "36px",
  },
  "& .MuiOutlinedInput-input": {
    py: "6px",
    fontSize: "0.72rem",
  },
};

type FieldRowProps = {
  label: string;
  children: ReactNode;
  readOnly?: boolean;
};

const FieldRow = ({ label, children, readOnly = false }: FieldRowProps) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
    <Typography
      sx={{
        fontSize: readOnly ? "0.65rem" : "0.72rem",
        fontWeight: readOnly ? 800 : 700,
        letterSpacing: readOnly ? "0.02em" : undefined,
        textTransform: readOnly ? "uppercase" : undefined,
        color: readOnly ? BRAND.primary : BRAND.textSub,
        minWidth: { sm: 200 },
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
  </Stack>
);

const SetupFieldCell = ({
  label,
  children,
  readOnly = false,
}: {
  label: string;
  children: ReactNode;
  readOnly?: boolean;
}) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography
      sx={{
        fontSize: readOnly ? "0.65rem" : "0.72rem",
        fontWeight: readOnly ? 800 : 700,
        letterSpacing: readOnly ? "0.02em" : undefined,
        textTransform: readOnly ? "uppercase" : undefined,
        color: readOnly ? BRAND.primary : BRAND.textSub,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

const renderTextField = (
  value: string,
  onChange: (value: string) => void,
  readOnly: boolean,
  options?: { multiline?: boolean; number?: boolean },
) => {
  if (readOnly) {
    return <QCDivisionReadOnlyValue value={value} muted={!value.trim()} />;
  }
  return (
    <TextField
      size="small"
      fullWidth
      multiline={options?.multiline}
      minRows={options?.multiline ? 2 : undefined}
      type={options?.number ? "number" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={tableFieldSx}
    />
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

const CYCLE_COLUMN_DEFS: Record<
  QcCuringCycleColumnId,
  ColumnDef<QcCuringCycleRow>
> = {
  TEMPERATURE: { id: "TEMPERATURE", label: "Temp (°C)", fieldType: "text" },
  DURATION: { id: "DURATION", label: "Duration (Min.)", fieldType: "number" },
  START_DATE: { id: "START_DATE", label: "Start Date", fieldType: "date" },
  START_TIME: { id: "START_TIME", label: "Start Time", fieldType: "time" },
  END_DATE: { id: "END_DATE", label: "End Date", fieldType: "date" },
  END_TIME: { id: "END_TIME", label: "End Time", fieldType: "time" },
  ACTUAL_DURATION: { id: "ACTUAL_DURATION", label: "Actual Duration (Min.)", fieldType: "number" },
  PROPELLANT_PRESSURE: {
    id: "PROPELLANT_PRESSURE",
    label: "Propellant Pressure",
    fieldType: "number",
  },
  PEAK_PRESSURE_ACHIEVED: {
    id: "PEAK_PRESSURE_ACHIEVED",
    label: "Peak Pressure Achieved",
    fieldType: "number",
  },
  HOT_WATER_STATUS: {
    id: "HOT_WATER_STATUS",
    label: "Hot Water Status",
    fieldType: "select",
    options: QC_CURING_HOT_WATER_STATUS_OPTIONS,
  },
  REMARKS: { id: "REMARKS", label: "Remarks", fieldType: "textarea" },
};

const buildCycleColumns = (subType: string | null | undefined) =>
  resolveCuringCycleColumnIds(subType).map((id) => CYCLE_COLUMN_DEFS[id]);

const createEmptyCycleRow = (srNo: number): QcCuringCycleRow => ({
  SR_NO: srNo,
  TEMPERATURE: "",
  DURATION: "",
  START_DATE: "",
  START_TIME: "",
  END_DATE: "",
  END_TIME: "",
  ACTUAL_DURATION: "",
  PROPELLANT_PRESSURE: "",
  PEAK_PRESSURE_ACHIEVED: "",
  HOT_WATER_STATUS: "",
  REMARKS: "",
});

const SUBSCALE_PARAMETER_COLUMNS: ColumnDef<QcCuringSubscaleParameterRow>[] = [
  { id: "OVEN_NO", label: "Oven No.", fieldType: "text", readOnlyColumn: true },
  { id: "ARTICLE_TYPE", label: "Article Type", fieldType: "text", readOnlyColumn: true },
  { id: "PARAMETER", label: "Parameter", fieldType: "text" },
  { id: "BEM_NO", label: "BEM No.", fieldType: "text" },
  { id: "WHEEL_PEEL_NO", label: "Wheel Peel No.", fieldType: "number" },
  { id: "CARTON_NO", label: "Carton No.", fieldType: "number" },
  { id: "CONTROL_GRAIN_NO", label: "Control Grain No.", fieldType: "number" },
];

type QCCuringMotorPanelProps = {
  motorId?: string | null;
  curingSubType?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  headerActions?: ReactNode;
};

const QCCuringMotorPanel = ({
  motorId,
  curingSubType,
  values,
  onChange,
  readOnly = false,
  headerActions,
}: QCCuringMotorPanelProps) => {
  const curingType = useMemo(
    () => getCuringTypeFromValues(values, curingSubType),
    [curingSubType, values],
  );
  const cycleColumns = useMemo(() => buildCycleColumns(curingType), [curingType]);
  const motorStage = useMemo(() => getCuringSetupField(values, "MOTOR_STAGE"), [values]);
  const oven = useMemo(() => getCuringSetupField(values, "OVEN"), [values]);
  const ovenNumber = useMemo(() => getCuringSetupField(values, "OVEN_NUMBER"), [values]);
  const motorPositioningDateTime = useMemo(
    () => getCuringSetupField(values, "MOTOR_POSITIONING_DATE_TIME"),
    [values],
  );
  const curingTypeLabel = useMemo(() => getQcCuringTypeLabel(curingType), [curingType]);

  const cycleRows = useMemo(() => getCuringCycleRows(values), [values]);

  const visualObservations = useMemo(
    () => getCuringPostField(values, "VISUAL_OBSERVATIONS"),
    [values],
  );
  const pressurePlateRemovalDateTime = useMemo(
    () => getCuringPostField(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME"),
    [values],
  );
  const shoreAHardness = useMemo(
    () => getCuringPostField(values, "SHORE_A_HARDNESS"),
    [values],
  );
  const dispatchDateTime = useMemo(
    () => getCuringPostField(values, "DISPATCH_DATE_TIME"),
    [values],
  );

  const numberOfOvens = useMemo(
    () => getCuringSubscaleField(values, "NUMBER_OF_OVENS"),
    [values],
  );
  const subscaleParameterRows = useMemo(() => getCuringSubscaleParameterRows(values), [values]);
  const curingStartDate = useMemo(
    () => getCuringSubscaleField(values, "CURING_START_DATE"),
    [values],
  );
  const cycleStartTime = useMemo(
    () => getCuringSubscaleField(values, "CYCLE_START_TIME"),
    [values],
  );
  const curingCompleteDate = useMemo(
    () => getCuringSubscaleField(values, "CURING_COMPLETE_DATE"),
    [values],
  );
  const cycleEndTime = useMemo(
    () => getCuringSubscaleField(values, "CYCLE_END_TIME"),
    [values],
  );
  const bemAverageShoreAHardness = useMemo(
    () => getCuringSubscaleField(values, "BEM_AVERAGE_SHORE_A_HARDNESS"),
    [values],
  );
  const cartonAverageShoreAHardness = useMemo(
    () => getCuringSubscaleField(values, "CARTON_AVERAGE_SHORE_A_HARDNESS"),
    [values],
  );
  const subscaleVisualObservations = useMemo(
    () => getCuringSubscaleField(values, "SUBSCALE_VISUAL_OBSERVATIONS"),
    [values],
  );

  const setCycleRows = useCallback(
    (rows: QcCuringCycleRow[]) => onChange(setCuringCycleRows(values, rows)),
    [onChange, values],
  );
  const setSubscaleParameterRowsHandler = useCallback(
    (rows: QcCuringSubscaleParameterRow[]) =>
      onChange(setCuringSubscaleParameterRows(values, rows)),
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
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {getQcCuringMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>

      <Stack spacing={2.5}>
        <SectionCard
          title={QC_CURING_SECTION_TITLES[QC_CURING_SECTION_IDS.MOTOR_SETUP]}
          readOnly={readOnly}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 1.5, lg: 2 }}
            alignItems={{ lg: "flex-start" }}
            flexWrap="wrap"
            useFlexGap
          >
            <SetupFieldCell label="Motor Stage" readOnly>
              <QCDivisionReadOnlyValue value={motorStage} muted={!motorStage.trim()} />
            </SetupFieldCell>
            <SetupFieldCell label="Type of Curing" readOnly>
              <QCDivisionReadOnlyValue value={curingTypeLabel} muted={!curingTypeLabel.trim()} />
            </SetupFieldCell>
            <SetupFieldCell label="Oven" readOnly>
              <QCDivisionReadOnlyValue value={oven} muted={!oven.trim()} />
            </SetupFieldCell>
            <SetupFieldCell label="Oven Number" readOnly>
              <QCDivisionReadOnlyValue value={ovenNumber} muted={!ovenNumber.trim()} />
            </SetupFieldCell>
            <SetupFieldCell
              label="Date & Time of positioning of rocket motor in Oven"
              readOnly={readOnly}
            >
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={motorPositioningDateTime}
                  muted={!motorPositioningDateTime.trim()}
                />
              ) : (
                <DateTimeField
                  compact
                  value={motorPositioningDateTime}
                  onChange={(next) =>
                    onChange(setCuringSetupField(values, "MOTOR_POSITIONING_DATE_TIME", next))
                  }
                  inputSx={setupDateTimeFieldSx}
                />
              )}
            </SetupFieldCell>
          </Stack>
        </SectionCard>

        <SectionCard
          title={QC_CURING_SECTION_TITLES[QC_CURING_SECTION_IDS.CYCLE_DETAILS]}
          readOnly={readOnly}
        >
          <CuringEditableTable
            title="Curing Cycle Details"
            columns={cycleColumns}
            rows={cycleRows}
            onChange={setCycleRows}
            createEmptyRow={createEmptyCycleRow}
            readOnly={readOnly}
            allowAdd={!readOnly}
            allowDelete={!readOnly}
          />
        </SectionCard>

        <SectionCard
          title={QC_CURING_SECTION_TITLES[QC_CURING_SECTION_IDS.POST_CURING]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="Visual Observations of cured motor" readOnly={readOnly}>
              {renderTextField(
                visualObservations,
                (next) => onChange(setCuringPostField(values, "VISUAL_OBSERVATIONS", next)),
                readOnly,
                { multiline: true },
              )}
            </FieldRow>
            <FieldRow label="Date/Time for removal of pressure plate" readOnly={readOnly}>
              {renderTextField(
                pressurePlateRemovalDateTime,
                (next) =>
                  onChange(setCuringPostField(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME", next)),
                readOnly,
              )}
            </FieldRow>
            <FieldRow label="Shore A Hardness" readOnly={readOnly}>
              {renderTextField(
                shoreAHardness,
                (next) => onChange(setCuringPostField(values, "SHORE_A_HARDNESS", next)),
                readOnly,
                { number: true },
              )}
            </FieldRow>
            <FieldRow label="Date/Time of Dispatch of motor for De-coring" readOnly={readOnly}>
              {renderTextField(
                dispatchDateTime,
                (next) => onChange(setCuringPostField(values, "DISPATCH_DATE_TIME", next)),
                readOnly,
              )}
            </FieldRow>
          </Stack>
        </SectionCard>

        <SectionCard
          title={QC_CURING_SECTION_TITLES[QC_CURING_SECTION_IDS.SUBSCALE]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="No. of Ovens" readOnly>
              <QCDivisionReadOnlyValue value={numberOfOvens} muted={!numberOfOvens.trim()} />
            </FieldRow>
            <CuringEditableTable
              title="Curing Parameters"
              columns={SUBSCALE_PARAMETER_COLUMNS}
              rows={subscaleParameterRows}
              onChange={setSubscaleParameterRowsHandler}
              createEmptyRow={(srNo) => ({
                SR_NO: srNo,
                OVEN_NO: "",
                ARTICLE_TYPE: "",
                PARAMETER: "",
                BEM_NO: "",
                WHEEL_PEEL_NO: "",
                CARTON_NO: "",
                CONTROL_GRAIN_NO: "",
              })}
              readOnly={readOnly}
              showSerialNumber={false}
              allowAdd={false}
              allowDelete={false}
            />
            <FieldRow label="Curing Start Date" readOnly={readOnly}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={curingStartDate}
                  muted={!curingStartDate.trim()}
                />
              ) : (
                <DateField
                  compact
                  value={curingStartDate}
                  onChange={(next) =>
                    onChange(setCuringSubscaleField(values, "CURING_START_DATE", next))
                  }
                  placeholder="DD-MM-YYYY"
                  inputSx={tableDateFieldSx}
                />
              )}
            </FieldRow>
            <FieldRow label="Cycle Start Time" readOnly={readOnly}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={normalizeTimeValue(cycleStartTime)}
                  muted={!cycleStartTime.trim()}
                />
              ) : (
                <TimeField
                  compact
                  value={normalizeTimeValue(cycleStartTime)}
                  onChange={(next) =>
                    onChange(setCuringSubscaleField(values, "CYCLE_START_TIME", next))
                  }
                  placeholder="HH:mm"
                  inputSx={tableTimeFieldSx}
                />
              )}
            </FieldRow>
            <FieldRow label="Curing Complete Date" readOnly={readOnly}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={curingCompleteDate}
                  muted={!curingCompleteDate.trim()}
                />
              ) : (
                <DateField
                  compact
                  value={curingCompleteDate}
                  onChange={(next) =>
                    onChange(setCuringSubscaleField(values, "CURING_COMPLETE_DATE", next))
                  }
                  placeholder="DD-MM-YYYY"
                  inputSx={tableDateFieldSx}
                />
              )}
            </FieldRow>
            <FieldRow label="Cycle End Time" readOnly={readOnly}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={normalizeTimeValue(cycleEndTime)}
                  muted={!cycleEndTime.trim()}
                />
              ) : (
                <TimeField
                  compact
                  value={normalizeTimeValue(cycleEndTime)}
                  onChange={(next) =>
                    onChange(setCuringSubscaleField(values, "CYCLE_END_TIME", next))
                  }
                  placeholder="HH:mm"
                  inputSx={tableTimeFieldSx}
                />
              )}
            </FieldRow>
            <FieldRow label="All BEM Average Shore A Hardness" readOnly={readOnly}>
              {renderTextField(
                bemAverageShoreAHardness,
                (next) =>
                  onChange(setCuringSubscaleField(values, "BEM_AVERAGE_SHORE_A_HARDNESS", next)),
                readOnly,
                { number: true },
              )}
            </FieldRow>
            <FieldRow label="All Carton Average Shore A Hardness" readOnly={readOnly}>
              {renderTextField(
                cartonAverageShoreAHardness,
                (next) =>
                  onChange(
                    setCuringSubscaleField(values, "CARTON_AVERAGE_SHORE_A_HARDNESS", next),
                  ),
                readOnly,
                { number: true },
              )}
            </FieldRow>
            <FieldRow label="Visual Observations (if any)" readOnly={readOnly}>
              {renderTextField(
                subscaleVisualObservations,
                (next) =>
                  onChange(setCuringSubscaleField(values, "SUBSCALE_VISUAL_OBSERVATIONS", next)),
                readOnly,
                { multiline: true },
              )}
            </FieldRow>
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  );
};

export default QCCuringMotorPanel;
