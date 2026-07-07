import { Box, MenuItem } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import FormInput from "./FormInput";
import { schemaSelectMenuProps } from "./fieldStyles";
import {
  fetchSchemaDataSourceOptions,
  resolveDataSourceApi,
  resolveSchemaOptionKeys,
  staticDataSourceOptions,
  type SchemaApiContext,
} from "../../../schema-engine/rules/apiDependency";
import type { SchemaDataSource } from "../../../schema-engine/types";

type SchemaApiDropdownProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  dataSource?: SchemaDataSource;
  apiContext?: SchemaApiContext;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  onOptionsCountChange?: (count: number) => void;
};

const SchemaApiDropdown = ({
  label,
  value,
  onChange,
  dataSource,
  apiContext,
  disabled,
  required,
  placeholder,
  onOptionsCountChange,
}: SchemaApiDropdownProps) => {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedApi = useMemo(
    () => (dataSource?.type === "api" ? resolveDataSourceApi(dataSource as SchemaDataSource & Record<string, unknown>) : null),
    [dataSource],
  );

  const apiContextKey = useMemo(() => JSON.stringify(apiContext ?? {}), [apiContext]);
  const onOptionsCountChangeRef = useRef(onOptionsCountChange);
  const lastReportedCountRef = useRef<number | null>(null);

  onOptionsCountChangeRef.current = onOptionsCountChange;

  const reportOptionsCount = (count: number) => {
    if (lastReportedCountRef.current === count) return;
    lastReportedCountRef.current = count;
    onOptionsCountChangeRef.current?.(count);
  };

  useEffect(() => {
    lastReportedCountRef.current = null;
  }, [dataSource, apiContextKey, resolvedApi]);

  useEffect(() => {
    if (!dataSource) {
      setOptions([]);
      reportOptionsCount(0);
      return;
    }

    if (dataSource.type === "static") {
      const staticOptions = staticDataSourceOptions(dataSource);
      setOptions(staticOptions);
      reportOptionsCount(staticOptions.length);
      return;
    }

    if (!resolvedApi?.endpoint) {
      setOptions([]);
      setError("API endpoint is not configured.");
      reportOptionsCount(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchSchemaDataSourceOptions(dataSource, apiContext).then(({ options: rows, error: fetchError }) => {
      if (cancelled) return;
      setLoading(false);
      setError(fetchError);
      const keys = resolveSchemaOptionKeys(resolvedApi.displayKey, resolvedApi.valueKey, rows);
      const nextOptions = rows.map((row) => ({
        label: String(row[keys.displayKey] ?? ""),
        value: String(row[keys.valueKey] ?? ""),
      }));
      setOptions(nextOptions);
      reportOptionsCount(nextOptions.length);
    });

    return () => {
      cancelled = true;
    };
  }, [dataSource, apiContextKey, resolvedApi]);

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <FormInput
      select
      label={label}
      value={value}
      onChange={(e) => onChange(String(e.target.value))}
      disabled={disabled || loading}
      required={required}
      helperText={error ?? undefined}
      SelectProps={{
        MenuProps: schemaSelectMenuProps,
        displayEmpty: Boolean(placeholder),
        renderValue: (selected) => {
          if (!selected) {
            return (
              <Box component="span" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                {placeholder}
              </Box>
            );
          }
          return selectedLabel ?? String(selected);
        },
      }}
    >
      {placeholder ? (
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
      ) : null}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </FormInput>
  );
};

export default SchemaApiDropdown;
