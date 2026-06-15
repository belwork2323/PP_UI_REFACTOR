import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import type { SchemaApiContext, SchemaField, SchemaThemeTokens } from "../../models/schema.types";
import {
  fetchSchemaApiOptions,
  resolveSchemaOptionKeys,
} from "../../utils/schemaApiDataSource";
import { buildInputSx } from "../theme";

type SchemaApiDropdownFieldProps = {
  field: SchemaField;
  value: unknown;
  onChange: (value: string) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const SchemaApiDropdownField = ({
  field,
  value,
  onChange,
  readOnly = false,
  theme,
  apiContext,
}: SchemaApiDropdownFieldProps) => {
  const [options, setOptions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldLabel = field.unit ? `${field.label} (${field.unit})` : field.label;
  const stringValue = String(value ?? "");

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        dataSource: field.dataSource,
        subDepartmentId: apiContext?.subDepartmentId ?? null,
        batchId: apiContext?.batchId ?? null,
      }),
    [field.dataSource, apiContext?.subDepartmentId, apiContext?.batchId]
  );

  const { displayKey, valueKey } = useMemo(
    () => resolveSchemaOptionKeys(field.displayKey, field.valueKey, options),
    [field.displayKey, field.valueKey, options]
  );

  useEffect(() => {
    const ds = field.dataSource;
    if (ds?.type !== "api" || !ds.api) {
      setOptions([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchSchemaApiOptions(ds, apiContext)
      .then(({ options: list, error: fetchError }) => {
        if (cancelled) return;
        setOptions(list);
        setError(fetchError);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load options.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [field.dataSource, requestKey, apiContext]);

  return (
    <Box sx={{ minWidth: 240, flex: "1 1 240px", maxWidth: 320 }}>
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
        disabled={readOnly || field.readonly || loading}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        sx={buildInputSx(theme, "100%")}
        helperText={error ?? undefined}
        error={Boolean(error)}
        InputProps={{
          endAdornment: loading ? <CircularProgress size={14} sx={{ mr: 2 }} /> : undefined,
        }}
      >
        <MenuItem value="">Select</MenuItem>
        {options.map((opt, idx) => {
          const optValue = String(opt[valueKey] ?? opt[displayKey] ?? idx);
          const optLabel = String(opt[displayKey] ?? opt[valueKey] ?? optValue);
          return (
            <MenuItem key={`${optValue}-${idx}`} value={optValue}>
              {optLabel}
            </MenuItem>
          );
        })}
      </TextField>
    </Box>
  );
};

export default SchemaApiDropdownField;
