import { useCallback, useMemo, type ReactNode } from "react";
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import DateField, { DateTimeField, TimeField } from "../../../../components/common/DateField";
import {
  QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID,
  QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID,
  getHardwareAbradingRows,
  getHardwareDispatchValues,
  getHardwareLinearCoatingRows,
  getHardwarePreheatingRows,
  getQcHardwareProcessLabel,
  isQcHardwareProcessSubType,
  setHardwareAbradingRows,
  setHardwareDispatchValues,
  setHardwareLinearCoatingRows,
  setHardwarePreheatingRows,
  type QcHardwareCutRow,
  type QcHardwareLinearCoatingRow,
  type QcHardwarePreheatingRow,
} from "../../../../../hooks/user/qualityControl/qcHardwareTables";

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

const tableDateTimeFieldSx = {
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

const DISPATCH_NUMBER_FIELDS = [
  { key: "HE_PUNCTURES", label: "No of punctures in Loose Flap at HE" },
  { key: "NE_PUNCTURES", label: "No of punctures in Loose Flap at NE" },
] as const;

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
  fieldType?: "text" | "number" | "date" | "time" | "textarea";
};

type EditableTableProps<T extends Record<string, unknown>> = {
  title: string;
  columns: ColumnDef<T>[];
  rows: T[];
  onChange: (rows: T[]) => void;
  createEmptyRow: (srNo: number) => T;
  readOnly?: boolean;
};

const displayValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

const HardwareEditableTable = <T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  onChange,
  createEmptyRow,
  readOnly = false,
}: EditableTableProps<T>) => {
  const updateRow = (index: number, field: keyof T & string, value: string) => {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? ({ ...row, [field]: value, SR_NO: rowIndex + 1 } as T)
          : ({ ...row, SR_NO: rowIndex + 1 } as T),
      ),
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
        .map((row, rowIndex) => ({ ...row, SR_NO: rowIndex + 1 }) as T),
    );
  };

  const renderInput = (row: T, index: number, column: ColumnDef<T>): ReactNode => {
    const value = String(row[column.id] ?? "");
    if (readOnly) {
      return displayValue(column.fieldType === "time" ? normalizeTimeValue(value) : value);
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

    return (
      <TextField
        size="small"
        fullWidth
        multiline={column.fieldType === "textarea"}
        minRows={column.fieldType === "textarea" ? 1 : undefined}
        type={column.fieldType === "number" ? "number" : "text"}
        value={value}
        onChange={(event) => updateRow(index, column.id, event.target.value)}
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
        sx={{
          overflow: "hidden",
          overflowX: "auto",
          border: `1px solid ${TABLE_BORDER}`,
          borderRadius: 2,
          background: "#fff",
        }}
      >
        <Table size="small" sx={{ minWidth: 560, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={TH}>S. No</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} sx={TH}>
                  {column.label}
                </TableCell>
              ))}
              {!readOnly ? <TableCell sx={TH} align="center" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`${title}-${index}`}
                sx={{ background: index % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55) }}
              >
                <TableCell sx={cellSx}>{index + 1}</TableCell>
                {columns.map((column) => (
                  <TableCell key={column.id} sx={cellSx}>
                    {renderInput(row, index, column)}
                  </TableCell>
                ))}
                {!readOnly ? (
                  <TableCell sx={cellSx} align="center">
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
      {!readOnly ? (
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

type QCHardwareProcessPanelProps = {
  subType: string;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  headerActions?: ReactNode;
};

const ABRADING_COLUMNS: ColumnDef<QcHardwareCutRow>[] = [
  { id: "DATE", label: "Date", fieldType: "date" },
  { id: "START_TIME", label: "Start Time", fieldType: "time" },
  { id: "END_TIME", label: "End Time", fieldType: "time" },
  { id: "DUST_QTY", label: "Qty of Dust (gms)", fieldType: "number" },
  { id: "OBSERVATIONS", label: "Observations", fieldType: "textarea" },
];

const PREHEATING_COLUMNS: ColumnDef<QcHardwarePreheatingRow>[] = [
  { id: "DATE", label: "Date", fieldType: "date" },
  { id: "START_TIME", label: "Start Time", fieldType: "time" },
  { id: "END_TIME", label: "End Time", fieldType: "time" },
  { id: "OVEN_NUMBER", label: "Oven Number", fieldType: "text" },
  { id: "BUILDING_NO", label: "Building No", fieldType: "text" },
  { id: "TEMPERATURE", label: "Temperature (°C)", fieldType: "number" },
  { id: "VACUUM_LEVEL", label: "Vacuum Level (Torr)", fieldType: "number" },
  { id: "OBSERVATIONS", label: "Observations", fieldType: "textarea" },
];

const LINEAR_COATING_COLUMNS: ColumnDef<QcHardwareLinearCoatingRow>[] = [
  { id: "DATE", label: "Date", fieldType: "date" },
  { id: "START_TIME", label: "Start Time", fieldType: "time" },
  { id: "END_TIME", label: "End Time", fieldType: "time" },
  { id: "LINER_QTY", label: "Quantity of liner used (g)", fieldType: "number" },
  { id: "INSULATION_TEMP", label: "Insulation Temp", fieldType: "number" },
  { id: "RH", label: "RH", fieldType: "number" },
  { id: "OBSERVATIONS", label: "Observations", fieldType: "textarea" },
];

const QCHardwareProcessPanel = ({
  subType,
  values,
  onChange,
  readOnly = false,
  headerActions,
}: QCHardwareProcessPanelProps) => {
  const processLabel = getQcHardwareProcessLabel(subType);
  const firstCutRows = useMemo(
    () => getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID),
    [values],
  );
  const secondCutRows = useMemo(
    () => getHardwareAbradingRows(values, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID),
    [values],
  );
  const preheatingRows = useMemo(() => getHardwarePreheatingRows(values), [values]);
  const linearCoatingRows = useMemo(() => getHardwareLinearCoatingRows(values), [values]);
  const dispatchValues = useMemo(() => getHardwareDispatchValues(values), [values]);

  const setFirstCut = useCallback(
    (rows: QcHardwareCutRow[]) => {
      onChange(setHardwareAbradingRows(values, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID, rows));
    },
    [onChange, values],
  );
  const setSecondCut = useCallback(
    (rows: QcHardwareCutRow[]) => {
      onChange(setHardwareAbradingRows(values, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID, rows));
    },
    [onChange, values],
  );
  const setPreheating = useCallback(
    (rows: QcHardwarePreheatingRow[]) => {
      onChange(setHardwarePreheatingRows(values, rows));
    },
    [onChange, values],
  );
  const setLinearCoating = useCallback(
    (rows: QcHardwareLinearCoatingRow[]) => {
      onChange(setHardwareLinearCoatingRows(values, rows));
    },
    [onChange, values],
  );

  if (!isQcHardwareProcessSubType(subType)) return null;

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
        mb: 1.75,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25} gap={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {processLabel}
        </Typography>
        {headerActions}
      </Stack>

      {subType === "ABRADING" ? (
        <Stack spacing={2.5}>
          <HardwareEditableTable
            title="First Cut"
            columns={ABRADING_COLUMNS}
            rows={firstCutRows}
            onChange={setFirstCut}
            createEmptyRow={(srNo) => ({
              SR_NO: srNo,
              DATE: "",
              START_TIME: "",
              END_TIME: "",
              DUST_QTY: "",
              OBSERVATIONS: "",
            })}
            readOnly={readOnly}
          />
          <HardwareEditableTable
            title="Second Cut"
            columns={ABRADING_COLUMNS}
            rows={secondCutRows}
            onChange={setSecondCut}
            createEmptyRow={(srNo) => ({
              SR_NO: srNo,
              DATE: "",
              START_TIME: "",
              END_TIME: "",
              DUST_QTY: "",
              OBSERVATIONS: "",
            })}
            readOnly={readOnly}
          />
        </Stack>
      ) : null}

      {subType === "PREHEATING" ? (
        <HardwareEditableTable
          title="Preheating Details"
          columns={PREHEATING_COLUMNS}
          rows={preheatingRows}
          onChange={setPreheating}
          createEmptyRow={(srNo) => ({
            SR_NO: srNo,
            DATE: "",
            START_TIME: "",
            END_TIME: "",
            OVEN_NUMBER: "",
            BUILDING_NO: "",
            TEMPERATURE: "",
            VACUUM_LEVEL: "",
            OBSERVATIONS: "",
          })}
          readOnly={readOnly}
        />
      ) : null}

      {subType === "LINEAR_COATING" ? (
        <HardwareEditableTable
          title="Liner Coating Details"
          columns={LINEAR_COATING_COLUMNS}
          rows={linearCoatingRows}
          onChange={setLinearCoating}
          createEmptyRow={(srNo) => ({
            SR_NO: srNo,
            DATE: "",
            START_TIME: "",
            END_TIME: "",
            LINER_QTY: "",
            INSULATION_TEMP: "",
            RH: "",
            OBSERVATIONS: "",
          })}
          readOnly={readOnly}
        />
      ) : null}

      {subType === "DISPATCH" ? (
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
            sx={{
              border: `1px solid ${TABLE_BORDER}`,
              borderRadius: 2,
              background: "#fff",
              p: 1.5,
            }}
          >
            {DISPATCH_NUMBER_FIELDS.map((field) => (
              <Box key={field.key} sx={{ flex: "1 1 220px", minWidth: 200 }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub, mb: 0.5 }}>
                  {field.label}
                </Typography>
                {readOnly ? (
                  <Typography sx={{ fontSize: "0.78rem", color: BRAND.text }}>
                    {displayValue(dispatchValues[field.key])}
                  </Typography>
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={dispatchValues[field.key] ?? ""}
                    onChange={(event) =>
                      onChange(
                        setHardwareDispatchValues(values, {
                          ...dispatchValues,
                          [field.key]: event.target.value,
                        }),
                      )
                    }
                    sx={tableFieldSx}
                  />
                )}
              </Box>
            ))}
            <Box sx={{ flex: "1 1 280px", minWidth: 240 }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub, mb: 0.5 }}>
                Date and Time of dispatch of motor to casting division
              </Typography>
              {readOnly ? (
                <Typography sx={{ fontSize: "0.78rem", color: BRAND.text }}>
                  {displayValue(dispatchValues.DISPATCH_DATE_TIME)}
                </Typography>
              ) : (
                <DateTimeField
                  compact
                  value={dispatchValues.DISPATCH_DATE_TIME ?? ""}
                  onChange={(next) =>
                    onChange(
                      setHardwareDispatchValues(values, {
                        ...dispatchValues,
                        DISPATCH_DATE_TIME: next,
                      }),
                    )
                  }
                  placeholder="DD-MM-YYYY HH:mm"
                  inputSx={tableDateTimeFieldSx}
                />
              )}
            </Box>
          </Stack>
          <Box
            sx={{
              border: `1px solid ${TABLE_BORDER}`,
              borderRadius: 2,
              background: "#fff",
              p: 1.5,
            }}
          >
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub, mb: 0.5 }}>
              Observations
            </Typography>
            {readOnly ? (
              <Typography sx={{ fontSize: "0.78rem", color: BRAND.text, whiteSpace: "pre-wrap" }}>
                {displayValue(dispatchValues.OBSERVATIONS)}
              </Typography>
            ) : (
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={dispatchValues.OBSERVATIONS ?? ""}
                onChange={(event) =>
                  onChange(
                    setHardwareDispatchValues(values, {
                      ...dispatchValues,
                      OBSERVATIONS: event.target.value,
                    }),
                  )
                }
                sx={tableFieldSx}
              />
            )}
          </Box>
        </Stack>
      ) : null}
    </Box>
  );
};

export default QCHardwareProcessPanel;
