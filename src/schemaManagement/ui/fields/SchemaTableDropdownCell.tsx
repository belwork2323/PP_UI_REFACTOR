import { useEffect, useMemo, useState } from "react";
import { CircularProgress, MenuItem, TextField } from "@mui/material";
import type { SchemaApiContext, SchemaColumn, SchemaThemeTokens } from "../../models/schema.types";
import { resolveFieldOptions } from "../../utils/fieldOptions";
import {
  fetchSchemaApiOptions,
  resolveSchemaOptionKeys,
} from "../../utils/schemaApiDataSource";
import { buildInputSx } from "../theme";

type SchemaTableDropdownCellProps = {
  column: SchemaColumn;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const SchemaTableDropdownCell = ({
  column,
  value,
  disabled = false,
  onChange,
  theme,
  apiContext,
}: SchemaTableDropdownCellProps) => {
  const [apiOptions, setApiOptions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usesApi = column.dataSource?.type === "api" && Boolean(column.dataSource.api);
  const staticOptions = resolveFieldOptions(column.options);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        dataSource: column.dataSource,
        subDepartmentId: apiContext?.subDepartmentId ?? null,
        batchId: apiContext?.batchId ?? null,
      }),
    [column.dataSource, apiContext?.subDepartmentId, apiContext?.batchId]
  );

  const { displayKey, valueKey } = useMemo(
    () => resolveSchemaOptionKeys(column.displayKey, column.valueKey, apiOptions),
    [column.displayKey, column.valueKey, apiOptions]
  );

  useEffect(() => {
    if (!usesApi || !column.dataSource) {
      setApiOptions([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchSchemaApiOptions(column.dataSource, apiContext)
      .then(({ options, error: fetchError }) => {
        if (cancelled) return;
        setApiOptions(options);
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
  }, [column.dataSource, usesApi, requestKey, apiContext]);

  const inputSx = buildInputSx(theme, "100%");

  return (
    <TextField
      select
      size="small"
      fullWidth
      disabled={disabled || loading}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={inputSx}
      error={Boolean(error)}
      helperText={error ?? undefined}
      SelectProps={{
        endAdornment: loading ? <CircularProgress size={14} sx={{ mr: 2 }} /> : undefined,
      }}
    >
      <MenuItem value="">Select</MenuItem>
      {usesApi
        ? apiOptions.map((opt, idx) => {
            const optValue = String(opt[valueKey] ?? opt[displayKey] ?? idx);
            const optLabel = String(opt[displayKey] ?? opt[valueKey] ?? optValue);
            return (
              <MenuItem key={`${optValue}-${idx}`} value={optValue}>
                {optLabel}
              </MenuItem>
            );
          })
        : staticOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
    </TextField>
  );
};

export default SchemaTableDropdownCell;
