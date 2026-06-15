import { Box, FormControlLabel, MenuItem, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { SchemaApiContext, SchemaField, SchemaThemeTokens } from "../../models/schema.types";
import { resolveFieldOptions } from "../../utils/fieldOptions";
import { buildInputSx } from "../theme";
import SchemaApiDropdownField from "./SchemaApiDropdownField";

dayjs.extend(customParseFormat);

type FieldRendererProps = {
  field: SchemaField;
  value: unknown;
  onChange: (value: string) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const labelSx = (theme: SchemaThemeTokens) => ({
  display: "block",
  fontSize: "0.67rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: theme.textSub,
  mb: 0.6,
});

const FieldRenderer = ({
  field,
  value,
  onChange,
  readOnly = false,
  theme,
  apiContext,
}: FieldRendererProps) => {
  const fieldLabel = field.unit ? `${field.label} (${field.unit})` : field.label;
  const isWideLabel = fieldLabel.length > 22;
  const disabled = readOnly || field.readonly;
  const stringValue = String(value ?? "");
  const selectOptions = resolveFieldOptions(field.options);

  if (field.type === "radio") {
    const radioOptions =
      selectOptions.length > 0
        ? selectOptions
        : [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ];

    return (
      <Box sx={{ minWidth: 220, flex: "1 1 220px", maxWidth: 360 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <RadioGroup row value={stringValue} onChange={(e) => onChange(e.target.value)}>
          {radioOptions.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio size="small" disabled={disabled} />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </Box>
    );
  }

  if (field.type === "file") {
    return (
      <Box sx={{ minWidth: 220, flex: "1 1 220px", maxWidth: 360 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <TextField
          size="small"
          fullWidth
          type="file"
          disabled={disabled}
          inputProps={{ multiple: field.multiple }}
          onChange={(e) => {
            const files = (e.target as HTMLInputElement).files;
            onChange(files?.length ? Array.from(files).map((f) => f.name).join(", ") : "");
          }}
          sx={buildInputSx(theme, "100%")}
        />
      </Box>
    );
  }

  if (field.type === "dropdown" && field.dataSource?.type === "api") {
    return (
      <SchemaApiDropdownField
        field={field}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        theme={theme}
        apiContext={apiContext}
      />
    );
  }

  if (field.type === "dropdown") {
    return (
      <Box sx={{ minWidth: isWideLabel ? 240 : 180, flex: "1 1 180px", maxWidth: 320 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <TextField
          select
          size="small"
          fullWidth
          disabled={disabled}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          sx={buildInputSx(theme, "100%")}
        >
          <MenuItem value="">Select</MenuItem>
          {selectOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    );
  }

  if (field.type === "textarea") {
    return (
      <Box sx={{ minWidth: 280, flex: "1 1 100%", maxWidth: "100%" }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          disabled={disabled}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          sx={buildInputSx(theme, "100%")}
        />
      </Box>
    );
  }

  if (field.type === "date") {
    return (
      <Box sx={{ minWidth: isWideLabel ? 240 : 200, flex: "1 1 200px", maxWidth: 280 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DatePicker
            enableAccessibleFieldDOMStructure={false}
            format="DD-MM-YYYY"
            disabled={disabled}
            value={stringValue ? dayjs(stringValue, "DD-MM-YYYY") : null}
            onChange={(picked) => onChange(picked?.format("DD-MM-YYYY") || "")}
            slotProps={{
              textField: { size: "small", fullWidth: true, sx: buildInputSx(theme, "100%") },
            }}
          />
        </LocalizationProvider>
      </Box>
    );
  }

  if (field.type === "time") {
    return (
      <Box sx={{ minWidth: isWideLabel ? 200 : 180, flex: "1 1 180px", maxWidth: 240 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <TimePicker
            enableAccessibleFieldDOMStructure={false}
            format="HH:mm"
            disabled={disabled}
            value={stringValue ? dayjs(stringValue, "HH:mm") : null}
            onChange={(picked) => onChange(picked?.format("HH:mm") || "")}
            slotProps={{
              textField: { size: "small", fullWidth: true, sx: buildInputSx(theme, "100%") },
            }}
          />
        </LocalizationProvider>
      </Box>
    );
  }

  if (field.type === "datetime") {
    return (
      <Box sx={{ minWidth: isWideLabel ? 260 : 220, flex: "1 1 220px", maxWidth: 320 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DateTimePicker
            enableAccessibleFieldDOMStructure={false}
            format="DD-MM-YYYY HH:mm"
            disabled={disabled}
            value={stringValue ? dayjs(stringValue, "DD-MM-YYYY HH:mm") : null}
            onChange={(picked) => onChange(picked?.format("DD-MM-YYYY HH:mm") || "")}
            slotProps={{
              textField: { size: "small", fullWidth: true, sx: buildInputSx(theme, "100%") },
            }}
          />
        </LocalizationProvider>
      </Box>
    );
  }

  if (field.type === "static") {
    return (
      <Box sx={{ minWidth: isWideLabel ? 240 : 180, flex: "1 1 180px", maxWidth: 320 }}>
        <Typography component="label" sx={labelSx(theme)}>
          {fieldLabel}
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: theme.text, fontWeight: 600 }}>
          {stringValue}
        </Typography>
      </Box>
    );
  }

  const inputType =
    field.type === "number" || field.type === "decimal" ? "number" : "text";

  return (
    <Box
      sx={{
        minWidth: isWideLabel ? 240 : 180,
        flex: isWideLabel ? "1 1 240px" : "1 1 180px",
        maxWidth: isWideLabel ? 320 : 260,
      }}
    >
      <Typography component="label" sx={{ ...labelSx(theme), lineHeight: 1.35 }}>
        {fieldLabel}
      </Typography>
      <TextField
        size="small"
        fullWidth
        disabled={disabled}
        type={inputType}
        placeholder="Enter value"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        sx={buildInputSx(theme, "100%")}
      />
    </Box>
  );
};

export default FieldRenderer;
