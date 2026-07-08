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
  compact?: boolean;
  compactWrap?: boolean;
};

const buildCompactSelectSx = (wrap: boolean) => ({
  mb: 0,
  width: "100%",
  maxWidth: "100%",
  "& .MuiInputBase-root:not(.MuiInputBase-multiline)": {
    minHeight: 40,
    height: wrap ? "auto" : 40,
    alignItems: "center",
  },
  "& .MuiSelect-select": {
    lineHeight: 1.4,
    py: "9px",
    minHeight: wrap ? 22 : "unset",
    height: wrap ? "auto !important" : "100%",
    display: "flex",
    alignItems: "center",
    paddingRight: "32px !important",
    boxSizing: "border-box",
    overflow: "hidden",
    ...(wrap
      ? {
          whiteSpace: "normal",
          wordBreak: "break-word",
          textOverflow: "unset",
        }
      : {
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }),
  },
  "& .MuiSelect-icon": {
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
  },
});

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
  compact = false,
  compactWrap = false,
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
  const resolvedLabel = selectedLabel ?? (value ? String(value) : "");
  const compactSelectSx = useMemo(() => buildCompactSelectSx(compactWrap), [compactWrap]);

  return (
    <FormInput
      select
      label={label}
      value={value}
      onChange={(e) => onChange(String(e.target.value))}
      disabled={disabled || loading}
      required={required}
      helperText={error ?? undefined}
      sx={compact ? compactSelectSx : undefined}
      SelectProps={{
        MenuProps: schemaSelectMenuProps,
        displayEmpty: Boolean(placeholder),
        renderValue: (selected) => {
          if (!selected) {
            return (
              <Box
                component="span"
                sx={{ color: "text.secondary", fontSize: "0.78rem", lineHeight: 1.4 }}
              >
                {placeholder}
              </Box>
            );
          }
          return (
            <Box
              component="span"
              title={resolvedLabel}
              sx={{
                width: "100%",
                fontSize: "0.78rem",
                lineHeight: 1.4,
                ...(compact && compactWrap
                  ? { whiteSpace: "normal", wordBreak: "break-word" }
                  : {
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }),
              }}
            >
              {resolvedLabel}
            </Box>
          );
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
