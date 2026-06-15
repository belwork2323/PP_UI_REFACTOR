import { TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { SchemaColumn, SchemaThemeTokens } from "../../models/schema.types";
import { buildInputSx } from "../theme";
import { resolveSchemaTableCellType } from "../../utils/tableCellTypes";

dayjs.extend(customParseFormat);

type SchemaTableCellInputProps = {
  column: SchemaColumn;
  row: Record<string, unknown>;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  theme: SchemaThemeTokens;
};

const DATE_FORMAT = "DD-MM-YYYY";
const TIME_FORMAT = "HH:mm";
const DATETIME_FORMAT = "DD-MM-YYYY HH:mm";

const parseValue = (value: string, formats: string[]): Dayjs | null => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  for (const format of formats) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) return parsed;
  }
  const fallback = dayjs(trimmed);
  return fallback.isValid() ? fallback : null;
};

const SchemaTableCellInput = ({
  column,
  row,
  value,
  disabled = false,
  onChange,
  theme,
}: SchemaTableCellInputProps) => {
  const cellType = resolveSchemaTableCellType(column, row);
  const unit = String(row.unit ?? column.unit ?? "").trim();
  const inputSx = buildInputSx(theme, "100%");

  if (cellType === "textarea") {
    return (
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={2}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={inputSx}
      />
    );
  }

  if (cellType === "file") {
    return (
      <TextField
        size="small"
        fullWidth
        type="file"
        disabled={disabled}
        inputProps={{ multiple: Boolean(column.multiple) }}
        onChange={(e) => {
          const files = (e.target as HTMLInputElement).files;
          onChange(files?.length ? Array.from(files).map((f) => f.name).join(", ") : "");
        }}
        sx={inputSx}
      />
    );
  }

  if (cellType === "date") {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DatePicker
          enableAccessibleFieldDOMStructure={false}
          format={DATE_FORMAT}
          disabled={disabled}
          value={parseValue(value, [DATE_FORMAT, "YYYY-MM-DD"])}
          onChange={(picked) => onChange(picked?.format(DATE_FORMAT) || "")}
          slotProps={{
            textField: { size: "small", fullWidth: true, sx: inputSx },
          }}
        />
      </LocalizationProvider>
    );
  }

  if (cellType === "time") {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <TimePicker
          enableAccessibleFieldDOMStructure={false}
          format={TIME_FORMAT}
          disabled={disabled}
          value={parseValue(value, [TIME_FORMAT, "HH:mm:ss"])}
          onChange={(picked) => onChange(picked?.format(TIME_FORMAT) || "")}
          slotProps={{
            textField: { size: "small", fullWidth: true, sx: inputSx },
          }}
        />
      </LocalizationProvider>
    );
  }

  if (cellType === "datetime" || cellType === "datetime-local") {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DateTimePicker
          enableAccessibleFieldDOMStructure={false}
          format={DATETIME_FORMAT}
          disabled={disabled}
          value={parseValue(value, [DATETIME_FORMAT, "YYYY-MM-DDTHH:mm", "YYYY-MM-DD HH:mm"])}
          onChange={(picked) => onChange(picked?.format(DATETIME_FORMAT) || "")}
          slotProps={{
            textField: { size: "small", fullWidth: true, sx: inputSx },
          }}
        />
      </LocalizationProvider>
    );
  }

  const htmlType =
    cellType === "number" || cellType === "decimal" || cellType === "measurement" ? "number" : "text";

  return (
    <TextField
      size="small"
      fullWidth
      disabled={disabled}
      type={htmlType}
      value={value}
      placeholder={unit ? `Enter value (${unit})` : "Enter value"}
      onChange={(e) => onChange(e.target.value)}
      sx={inputSx}
    />
  );
};

export default SchemaTableCellInput;
