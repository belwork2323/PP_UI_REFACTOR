import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { useThemeStore } from "../../../../../app/store/themeStore";
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import DateField, { DateTimeField, TimeField } from "../../../../components/common/DateField";
import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import CasePrepTextField from "../../manufacturing/CasePreparation/CasePrepTextField";
import { generalController } from "../../../../../controllers/admin/common/generalController";
import { buildCuringOvenNoOptions } from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import {
  mapOvensToOptions,
  resolveOvenLabel,
  type OvenSelectOption,
} from "../../../../../hooks/user/manufacturing/ovenSelectOptions";
import {
  QC_CURING_HOT_WATER_STATUS_OPTIONS,
  QC_CURING_SECTION_IDS,
  QC_CURING_SECTION_TITLES,
  QC_CURING_SUBSCALE_TEMPERATURE_PLACEHOLDER,
  formatQcCuringMotorStageLabel,
  getQcCuringMotorLabel,
  getQcCuringTypeLabel,
  normalizeQcCuringSubscaleParameter,
  resolveCuringCycleColumnIds,
  type QcCuringCycleColumnId,
} from "../../../../../hooks/user/qualityControl/qcCuringConfig";
import { formatToUiDate } from "../../../../../utils/dateUtils";
import { isStartAfterEnd } from "../../../../../data/validation/dateRangeValidation";
import {
  getCuringCycleRows,
  getCuringPostField,
  getCuringSectionQaRemarks,
  getCuringSetupField,
  getCuringSubscaleField,
  getCuringSubscaleParameterRows,
  getCuringTypeFromValues,
  setCuringCycleRows,
  setCuringPostField,
  setCuringSectionQaRemarks,
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
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import FieldErrorText from "@/ui/components/validation/FieldErrorText";
import { fieldError } from "@/data/validation/adapters/qcCuring.validation";

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

const normalizeDateTimeClock = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}${match[3] ? `:${match[3]}` : ""}` : trimmed;
};

type ColumnDef<T> = {
  id: keyof T & string;
  label: string;
  fieldType?: "text" | "number" | "date" | "time" | "dateTime" | "textarea" | "select";
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
  readOnlyColumn?: boolean;
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
  showSerialNumber?: boolean;
  validationErrors?: Record<string, string> | null;
  errorPrefix?: string;
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
  validationErrors = null,
  errorPrefix = "",
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
        const patch: Record<string, unknown> = {};
        if ((field === "START_DATE" || field === "END_DATE") && value.includes(" ")) {
          const [date = "", time = ""] = value.split(" ");
          patch[field] = date;
          patch[field === "START_DATE" ? "START_TIME" : "END_TIME"] = time;
        } else patch[field] = value;
        const nextRow = showSerialNumber
          ? ({ ...row, ...patch, SR_NO: rowIndex + 1 } as T)
          : ({ ...row, ...patch } as T);
        const nextRecord = nextRow as Record<string, unknown>;
        if (
          ["START_DATE", "START_TIME", "END_DATE", "END_TIME"].includes(field)
        ) {
          const startDate = formatToUiDate(String(nextRecord.START_DATE ?? ""));
          const endDate = formatToUiDate(String(nextRecord.END_DATE ?? ""));
          const startDateTime = startDate
            ? `${startDate} ${normalizeTimeValue(nextRecord.START_TIME) || "00:00"}`
            : "";
          const endDateTime = endDate
            ? `${endDate} ${normalizeTimeValue(nextRecord.END_TIME) || "00:00"}`
            : "";

          if (isStartAfterEnd(startDateTime, endDateTime)) {
            if (startDate && startDate === endDate) {
              nextRecord.END_TIME = "";
            } else {
              nextRecord.END_DATE = "";
              nextRecord.END_TIME = "";
            }
          }
        }
        return nextRow;
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

  const renderInput = (
    row: T,
    index: number,
    column: ColumnDef<T>,
    fieldPath: string,
    hasError: boolean,
  ): ReactNode => {
    const rawValue = String(row[column.id] ?? "");
    const value =
      column.id === "PARAMETER" ? normalizeQcCuringSubscaleParameter(rawValue) : rawValue;
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
      const startDate = formatToUiDate(String(row.START_DATE ?? ""));
      const startDateTimeSelected =
        Boolean(startDate) && Boolean(normalizeTimeValue(row.START_TIME));
      return (
        <Box data-qc-field={fieldPath}>
          <DateField
            compact
            value={value}
            minDate={column.id === "END_DATE" ? startDate : undefined}
            blockedByDateTimeDependency={column.id === "END_DATE" && !startDateTimeSelected}
            onChange={(next) => updateRow(index, column.id, next)}
            placeholder="DD-MM-YYYY"
            inputSx={tableDateFieldSx}
            error={hasError}
          />
        </Box>
      );
    }

    if (column.fieldType === "dateTime") {
      const isEnd = column.id === "END_DATE";
      const date = formatToUiDate(String(row[column.id] ?? ""));
      const time = normalizeDateTimeClock(row[isEnd ? "END_TIME" as keyof T & string : "START_TIME" as keyof T & string]);
      const startValue = `${formatToUiDate(String(row.START_DATE ?? ""))} ${normalizeDateTimeClock(row.START_TIME)}`.trim();
      return <Box data-qc-field={fieldPath}><DateTimeField compact value={date ? `${date} ${time || "00:00"}` : ""} minDate={isEnd ? startValue : undefined} requiresMinDateTime={isEnd} onChange={(next) => updateRow(index, column.id, next)} placeholder="DD-MM-YYYY HH:mm:ss" inputSx={tableDateFieldSx} error={hasError} /></Box>;
    }

    if (column.fieldType === "time") {
      const startDate = formatToUiDate(String(row.START_DATE ?? ""));
      const endDate = formatToUiDate(String(row.END_DATE ?? ""));
      const startDateTimeSelected =
        Boolean(startDate) && Boolean(normalizeTimeValue(row.START_TIME));
      return (
        <Box data-qc-field={fieldPath}>
          <TimeField
            compact
            value={normalizeTimeValue(value)}
            blockedByDateTimeDependency={column.id === "END_TIME" && !startDateTimeSelected}
            minTime={
              column.id === "END_TIME" && startDate && startDate === endDate
                ? normalizeTimeValue(row.START_TIME)
                : undefined
            }
            onChange={(next) => updateRow(index, column.id, next)}
            placeholder="HH:mm"
            inputSx={tableTimeFieldSx}
            error={hasError}
          />
        </Box>
      );
    }

    if (column.fieldType === "select" && column.options) {
      return (
        <Box data-qc-field={fieldPath}>
          <TextField
            select
            size="small"
            fullWidth
            value={value}
            onChange={(event) => updateRow(index, column.id, event.target.value)}
            sx={tableFieldSx}
            error={hasError}
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
        </Box>
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
        error={hasError}
        inputProps={{
          "data-qc-field": fieldPath,
          ...(column.fieldType === "number" ? { inputMode: "decimal" as const } : {}),
        }}
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
                {showSerialNumber ? (
                  <TableCell sx={bodyCellSx}>
                    {readOnly ? <QCDivisionReadOnlyValue value={index + 1} /> : index + 1}
                  </TableCell>
                ) : null}
                {columns.map((column) => {
                  const path = errorPrefix
                    ? `${errorPrefix}.${index}.${column.id}`
                    : `${index}.${column.id}`;
                  const message = fieldError(validationErrors ?? undefined, path);
                  return (
                    <TableCell key={column.id} sx={bodyCellSx}>
                      {renderInput(row, index, column, path, Boolean(message))}
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

const SetupFieldCell = ({
  label,
  children,
  readOnly = false,
  required = false,
  error,
  minWidth,
}: {
  label: string;
  children: ReactNode;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  minWidth?: number | string;
}) => (
  <Box
    sx={{
      flex: 1,
      minWidth: minWidth ?? 0,
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
    }}
  >
    {required && !readOnly ? (
      <FieldLabelWithAsterisk
        label={label}
        required
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: BRAND.textSub,
          mb: 0,
          lineHeight: 1.25,
          minHeight: "2.5em",
          display: "flex",
          alignItems: "flex-end",
        }}
      />
    ) : (
      <Typography
        sx={{
          fontSize: readOnly ? "0.65rem" : "0.72rem",
          fontWeight: readOnly ? 800 : 700,
          letterSpacing: readOnly ? "0.02em" : undefined,
          textTransform: readOnly ? "uppercase" : undefined,
          color: readOnly ? BRAND.primary : BRAND.textSub,
          mb: 0,
          lineHeight: 1.25,
          minHeight: "2.5em",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {label}
      </Typography>
    )}
    <Box sx={{ width: "100%", minWidth: 0 }}>{children}</Box>
    {!readOnly && error ? <FieldErrorText message={error} /> : null}
  </Box>
);

const renderTextField = (
  value: string,
  onChange: (value: string) => void,
  readOnly: boolean,
  options?: { multiline?: boolean; number?: boolean; error?: boolean; fieldPath?: string },
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
      error={Boolean(options?.error)}
      inputProps={options?.fieldPath ? { "data-qc-field": options.fieldPath } : undefined}
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
  TEMPERATURE: { id: "TEMPERATURE", label: "Temp (°C)", fieldType: "text", required: true },
  DURATION: { id: "DURATION", label: "Duration (Min.)", fieldType: "number", required: true },
  START_DATE: { id: "START_DATE", label: "Start Date & Time", fieldType: "dateTime", required: true },
  START_TIME: { id: "START_TIME", label: "Start Date & Time", fieldType: "dateTime", required: true },
  END_DATE: { id: "END_DATE", label: "End Date & Time", fieldType: "dateTime", required: true },
  END_TIME: { id: "END_TIME", label: "End Date & Time", fieldType: "dateTime", required: true },
  ACTUAL_DURATION: {
    id: "ACTUAL_DURATION",
    label: "Actual Duration (Min.)",
    fieldType: "number",
    required: true,
  },
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
  QA_REMARKS: { id: "QA_REMARKS", label: "QA Remarks", fieldType: "textarea" },
};

const buildCycleColumns = (subType: string | null | undefined) =>
  resolveCuringCycleColumnIds(subType)
    .filter((id) => id !== "START_TIME" && id !== "END_TIME")
    .map((id) => CYCLE_COLUMN_DEFS[id]);

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
  QA_REMARKS: "",
});

const SUBSCALE_PARAMETER_COLUMNS: ColumnDef<QcCuringSubscaleParameterRow>[] = [
  { id: "ARTICLE_TYPE", label: "Article Type", fieldType: "text", readOnlyColumn: true },
  { id: "PARAMETER", label: "Parameter", fieldType: "text", required: true },
  { id: "BEM_NO", label: "BEM No.", fieldType: "text", required: true },
  { id: "WHEEL_PEEL_NO", label: "Wheel Peel No.", fieldType: "number", required: true },
  { id: "CARTON_NO", label: "Carton No.", fieldType: "number", required: true },
  { id: "CONTROL_GRAIN_NO", label: "Control Grain No.", fieldType: "number", required: true },
  { id: "QA_REMARKS", label: "QA Remarks", fieldType: "textarea" },
];

type QCCuringMotorPanelProps = {
  motorId?: string | null;
  curingSubType?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  headerActions?: ReactNode;
  validationErrors?: Record<string, string> | null;
};

const QCCuringMotorPanel = ({
  motorId,
  curingSubType,
  values,
  onChange,
  readOnly = false,
  headerActions,
  validationErrors = null,
}: QCCuringMotorPanelProps) => {
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const err = (path: string) => fieldError(validationErrors ?? undefined, path);
  const [ovenOptions, setOvenOptions] = useState<OvenSelectOption[]>([]);
  const curingType = useMemo(
    () => getCuringTypeFromValues(values, curingSubType),
    [curingSubType, values],
  );
  const cycleColumns = useMemo(() => buildCycleColumns(curingType), [curingType]);
  const motorStage = useMemo(() => getCuringSetupField(values, "MOTOR_STAGE"), [values]);
  const oven = useMemo(() => getCuringSetupField(values, "OVEN"), [values]);
  const ovenLabel = useMemo(() => resolveOvenLabel(oven, ovenOptions), [oven, ovenOptions]);
  const ovenNumber = useMemo(() => getCuringSetupField(values, "OVEN_NUMBER"), [values]);
  const selectedOven = useMemo(
    () => ovenOptions.find((option) => option.value === oven) ?? null,
    [oven, ovenOptions],
  );
  const ovenNoOptions = useMemo(
    () => buildCuringOvenNoOptions(selectedOven?.noOfOvenAvailable),
    [selectedOven?.noOfOvenAvailable],
  );
  const motorPositioningDateTime = useMemo(
    () => getCuringSetupField(values, "MOTOR_POSITIONING_DATE_TIME"),
    [values],
  );
  const curingTypeLabel = useMemo(() => getQcCuringTypeLabel(curingType), [curingType]);

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
  const setupQaRemarks = useMemo(
    () => getCuringSectionQaRemarks(values, QC_CURING_SECTION_IDS.MOTOR_SETUP),
    [values],
  );

  const cycleRows = useMemo(() => getCuringCycleRows(values), [values]);

  const visualObservations = useMemo(
    () => getCuringPostField(values, "VISUAL_OBSERVATIONS"),
    [values],
  );
  const postQaRemarks = useMemo(
    () => getCuringSectionQaRemarks(values, QC_CURING_SECTION_IDS.POST_CURING),
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
  const updateSubscaleCombinedDateTime = (start: boolean, value: string) => {
    const [date = "", time = ""] = value.split(" ");
    const dateField = start ? "CURING_START_DATE" : "CURING_COMPLETE_DATE";
    const timeField = start ? "CYCLE_START_TIME" : "CYCLE_END_TIME";
    let next = setCuringSubscaleField(values, dateField, date);
    next = setCuringSubscaleField(next, timeField, time);
    const startValue = start ? value : `${formatToUiDate(curingStartDate)} ${normalizeTimeValue(cycleStartTime)}`;
    const endValue = start ? `${formatToUiDate(curingCompleteDate)} ${normalizeTimeValue(cycleEndTime)}` : value;
    if (isStartAfterEnd(startValue, endValue)) {
      next = setCuringSubscaleField(next, "CURING_COMPLETE_DATE", "");
      next = setCuringSubscaleField(next, "CYCLE_END_TIME", "");
    }
    onChange(next);
  };
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
  const subscaleQaRemarks = useMemo(
    () => getCuringSectionQaRemarks(values, QC_CURING_SECTION_IDS.SUBSCALE),
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
            alignItems={{ lg: "flex-end" }}
            flexWrap="wrap"
            useFlexGap
          >
            <SetupFieldCell label="Motor Stage" readOnly>
              <QCDivisionReadOnlyValue value={motorStage} muted={!motorStage.trim()} />
            </SetupFieldCell>
            <SetupFieldCell label="Type of Curing" readOnly>
              <QCDivisionReadOnlyValue value={curingTypeLabel} muted={!curingTypeLabel.trim()} />
            </SetupFieldCell>
            <SetupFieldCell
              label="Oven"
              readOnly={readOnly}
              required={!readOnly}
              minWidth={160}
            >
              {readOnly ? (
                <QCDivisionReadOnlyValue value={ovenLabel} muted={!ovenLabel.trim()} />
              ) : (
                <Box data-qc-field="OVEN">
                  <CasePrepSelect
                    label="Oven"
                    hideLabel
                    value={oven}
                    placeholder="Select oven"
                    options={ovenOptions}
                    width="100%"
                    theme={manufacturingTheme}
                    required
                    onChange={(next) => {
                      let updated = setCuringSetupField(values, "OVEN", next);
                      updated = setCuringSetupField(updated, "OVEN_NUMBER", "");
                      onChange(updated);
                    }}
                  />
                </Box>
              )}
            </SetupFieldCell>
            <SetupFieldCell
              label="Oven Number"
              readOnly={readOnly}
              required={!readOnly}
              error={err("OVEN_NUMBER")}
              minWidth={160}
            >
              {readOnly ? (
                <QCDivisionReadOnlyValue value={ovenNumber} muted={!ovenNumber.trim()} />
              ) : (
                <Box data-qc-field="OVEN_NUMBER">
                  <CasePrepSelect
                    label="Oven Number"
                    hideLabel
                    value={ovenNumber}
                    placeholder={oven ? "Select oven number" : "Select oven first"}
                    options={ovenNoOptions}
                    width="100%"
                    theme={manufacturingTheme}
                    required
                    disabled={!oven}
                    error={Boolean(err("OVEN_NUMBER"))}
                    onChange={(next) =>
                      onChange(setCuringSetupField(values, "OVEN_NUMBER", next))
                    }
                  />
                </Box>
              )}
            </SetupFieldCell>
            <SetupFieldCell
              label="Date & Time of positioning of rocket motor in Oven"
              readOnly={readOnly}
              required
              error={err("MOTOR_POSITIONING_DATE_TIME")}
              minWidth={220}
            >
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={motorPositioningDateTime}
                  muted={!motorPositioningDateTime.trim()}
                />
              ) : (
                <Box data-qc-field="MOTOR_POSITIONING_DATE_TIME">
                  <DateTimeField
                    compact
                    value={motorPositioningDateTime}
                    onChange={(next) =>
                      onChange(setCuringSetupField(values, "MOTOR_POSITIONING_DATE_TIME", next))
                    }
                    inputSx={setupDateTimeFieldSx}
                    error={Boolean(err("MOTOR_POSITIONING_DATE_TIME"))}
                  />
                </Box>
              )}
            </SetupFieldCell>
          </Stack>
          <Box sx={{ mt: 1.5 }} data-qc-field="CURING_MOTOR_SETUP.qaRemarks">
            <CasePrepTextField
              label="QA Remarks"
              value={setupQaRemarks}
              readOnly={readOnly}
              width="100%"
              theme={manufacturingTheme}
              onChange={(next) =>
                onChange(
                  setCuringSectionQaRemarks(values, QC_CURING_SECTION_IDS.MOTOR_SETUP, next),
                )
              }
            />
          </Box>
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
            validationErrors={validationErrors}
            errorPrefix="CURING_CYCLE_DETAILS"
          />
        </SectionCard>

        <SectionCard
          title={QC_CURING_SECTION_TITLES[QC_CURING_SECTION_IDS.POST_CURING]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="Visual Observations of cured motor" readOnly={readOnly} required error={err("VISUAL_OBSERVATIONS")}>
              {renderTextField(
                visualObservations,
                (next) => onChange(setCuringPostField(values, "VISUAL_OBSERVATIONS", next)),
                readOnly,
                {
                  multiline: true,
                  error: Boolean(err("VISUAL_OBSERVATIONS")),
                  fieldPath: "VISUAL_OBSERVATIONS",
                },
              )}
            </FieldRow>
            <FieldRow label="Date & Time Of Removal Of Pressure Plate" readOnly={readOnly}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={pressurePlateRemovalDateTime}
                  muted={!pressurePlateRemovalDateTime.trim()}
                />
              ) : (
                <Box data-qc-field="PRESSURE_PLATE_REMOVAL_DATE_TIME">
                  <DateTimeField
                    compact
                    value={pressurePlateRemovalDateTime}
                    onChange={(next) =>
                      onChange(
                        setCuringPostField(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME", next),
                      )
                    }
                    placeholder="DD-MM-YYYY HH:mm:ss"
                    inputSx={setupDateTimeFieldSx}
                    error={Boolean(err("PRESSURE_PLATE_REMOVAL_DATE_TIME"))}
                  />
                </Box>
              )}
            </FieldRow>
            <FieldRow label="Shore A Hardness" readOnly={readOnly} required error={err("SHORE_A_HARDNESS")}>
              {renderTextField(
                shoreAHardness,
                (next) => onChange(setCuringPostField(values, "SHORE_A_HARDNESS", next)),
                readOnly,
                {
                  number: true,
                  error: Boolean(err("SHORE_A_HARDNESS")),
                  fieldPath: "SHORE_A_HARDNESS",
                },
              )}
            </FieldRow>
            <FieldRow
              label="Date & Time Of Dispatch Of Motor For De-coring"
              readOnly={readOnly}
              required
              error={err("DISPATCH_DATE_TIME")}
            >
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={dispatchDateTime}
                  muted={!dispatchDateTime.trim()}
                />
              ) : (
                <Box data-qc-field="DISPATCH_DATE_TIME">
                  <DateTimeField
                    compact
                    value={dispatchDateTime}
                    onChange={(next) =>
                      onChange(setCuringPostField(values, "DISPATCH_DATE_TIME", next))
                    }
                    placeholder="DD-MM-YYYY HH:mm:ss"
                    inputSx={setupDateTimeFieldSx}
                    error={Boolean(err("DISPATCH_DATE_TIME"))}
                  />
                </Box>
              )}
            </FieldRow>
            <Box data-qc-field="POST_CURING_DETAILS.qaRemarks">
              <CasePrepTextField
                label="QA Remarks"
                value={postQaRemarks}
                readOnly={readOnly}
                width="100%"
                theme={manufacturingTheme}
                onChange={(next) =>
                  onChange(
                    setCuringSectionQaRemarks(values, QC_CURING_SECTION_IDS.POST_CURING, next),
                  )
                }
              />
            </Box>
          </Stack>
        </SectionCard>

        <SectionCard
          title={QC_CURING_SECTION_TITLES[QC_CURING_SECTION_IDS.SUBSCALE]}
          readOnly={readOnly}
        >
          <Stack spacing={1.5}>
            <FieldRow label="Oven Number" readOnly>
              <QCDivisionReadOnlyValue value={numberOfOvens} muted={!numberOfOvens.trim()} />
            </FieldRow>
            <CuringEditableTable
              title="Curing Parameters"
              columns={SUBSCALE_PARAMETER_COLUMNS}
              rows={subscaleParameterRows}
              onChange={setSubscaleParameterRowsHandler}
              createEmptyRow={(srNo) => ({
                SR_NO: srNo,
                ARTICLE_TYPE: "",
                PARAMETER: "",
                BEM_NO: "",
                WHEEL_PEEL_NO: "",
                CARTON_NO: "",
                CONTROL_GRAIN_NO: "",
                QA_REMARKS: "",
              })}
              readOnly={readOnly}
              showSerialNumber={false}
              allowAdd={false}
              allowDelete={false}
              validationErrors={validationErrors}
              errorPrefix="CURING_PARAMETER_TABLE"
            />
    <FieldRow label="Curing Start Date & Time" readOnly={readOnly} required error={err("CURING_START_DATE")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={curingStartDate ? `${formatToUiDate(curingStartDate)} ${normalizeDateTimeClock(cycleStartTime)}` : ""}
                  muted={!curingStartDate.trim() && !cycleStartTime.trim()}
                />
              ) : (
                <Box data-qc-field="CURING_START_DATE">
                  <DateTimeField compact value={curingStartDate ? `${formatToUiDate(curingStartDate)} ${normalizeDateTimeClock(cycleStartTime) || "00:00:00"}` : ""} onChange={(next) => updateSubscaleCombinedDateTime(true, next)} placeholder="DD-MM-YYYY HH:mm:ss" inputSx={tableDateFieldSx} error={Boolean(err("CURING_START_DATE") || err("CYCLE_START_TIME"))} />
                </Box>
              )}
            </FieldRow>
            <FieldRow label="Curing Complete Date & Time" readOnly={readOnly} required error={err("CURING_COMPLETE_DATE")}>
              {readOnly ? (
                <QCDivisionReadOnlyValue
                  value={curingCompleteDate ? `${formatToUiDate(curingCompleteDate)} ${normalizeDateTimeClock(cycleEndTime)}` : ""}
                  muted={!curingCompleteDate.trim() && !cycleEndTime.trim()}
                />
              ) : (
                <Box data-qc-field="CURING_COMPLETE_DATE">
                  <DateTimeField compact value={curingCompleteDate ? `${formatToUiDate(curingCompleteDate)} ${normalizeDateTimeClock(cycleEndTime) || "00:00:00"}` : ""} minDate={`${formatToUiDate(curingStartDate)} ${normalizeDateTimeClock(cycleStartTime)}`} requiresMinDateTime onChange={(next) => updateSubscaleCombinedDateTime(false, next)} placeholder="DD-MM-YYYY HH:mm:ss" inputSx={tableDateFieldSx} error={Boolean(err("CURING_COMPLETE_DATE") || err("CYCLE_END_TIME"))} />
                </Box>
              )}
            </FieldRow>
            <FieldRow label="All BEM Average Shore A Hardness" readOnly={readOnly} required error={err("BEM_AVERAGE_SHORE_A_HARDNESS")}>
              {renderTextField(
                bemAverageShoreAHardness,
                (next) =>
                  onChange(setCuringSubscaleField(values, "BEM_AVERAGE_SHORE_A_HARDNESS", next)),
                readOnly,
                {
                  number: true,
                  error: Boolean(err("BEM_AVERAGE_SHORE_A_HARDNESS")),
                  fieldPath: "BEM_AVERAGE_SHORE_A_HARDNESS",
                },
              )}
            </FieldRow>
            <FieldRow label="All Carton Average Shore A Hardness" readOnly={readOnly} required error={err("CARTON_AVERAGE_SHORE_A_HARDNESS")}>
              {renderTextField(
                cartonAverageShoreAHardness,
                (next) =>
                  onChange(
                    setCuringSubscaleField(values, "CARTON_AVERAGE_SHORE_A_HARDNESS", next),
                  ),
                readOnly,
                {
                  number: true,
                  error: Boolean(err("CARTON_AVERAGE_SHORE_A_HARDNESS")),
                  fieldPath: "CARTON_AVERAGE_SHORE_A_HARDNESS",
                },
              )}
            </FieldRow>
            <FieldRow label="Visual Observations (if any)" readOnly={readOnly} required error={err("SUBSCALE_VISUAL_OBSERVATIONS")}>
              {renderTextField(
                subscaleVisualObservations,
                (next) =>
                  onChange(setCuringSubscaleField(values, "SUBSCALE_VISUAL_OBSERVATIONS", next)),
                readOnly,
                {
                  multiline: true,
                  error: Boolean(err("SUBSCALE_VISUAL_OBSERVATIONS")),
                  fieldPath: "SUBSCALE_VISUAL_OBSERVATIONS",
                },
              )}
            </FieldRow>
            <Box data-qc-field="SUBSCALE_ARTICLES_CURING.qaRemarks">
              <CasePrepTextField
                label="QA Remarks"
                value={subscaleQaRemarks}
                readOnly={readOnly}
                width="100%"
                theme={manufacturingTheme}
                onChange={(next) =>
                  onChange(setCuringSectionQaRemarks(values, QC_CURING_SECTION_IDS.SUBSCALE, next))
                }
              />
            </Box>
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  );
};

export default QCCuringMotorPanel;
