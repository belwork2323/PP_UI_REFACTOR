import { Box, MenuItem, TextField, Typography } from "@mui/material";
import type { SchemaApiContext, SchemaField, SchemaThemeTokens } from "../../models/schema.types";
import { buildInputSx } from "../theme";
import SchemaApiDropdownField from "./SchemaApiDropdownField";

type FieldRendererProps = {
  field: SchemaField;
  value: unknown;
  onChange: (value: string) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

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

  const inputType =
    field.type === "number"
      ? "number"
      : field.type === "datetime"
        ? "datetime-local"
        : "text";

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
        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: "0.67rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.textSub,
            mb: 0.6,
          }}
        >
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
          {(field.options ?? []).map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    );
  }

  if (field.type === "textarea") {
    return (
      <Box sx={{ minWidth: 280, flex: "1 1 100%", maxWidth: "100%" }}>
        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: "0.67rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.textSub,
            mb: 0.6,
          }}
        >
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

  return (
    <Box
      sx={{
        minWidth: isWideLabel ? 240 : 180,
        flex: isWideLabel ? "1 1 240px" : "1 1 180px",
        maxWidth: isWideLabel ? 320 : 260,
      }}
    >
      <Typography
        component="label"
        sx={{
          display: "block",
          fontSize: "0.67rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: theme.textSub,
          mb: 0.6,
          lineHeight: 1.35,
        }}
      >
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
