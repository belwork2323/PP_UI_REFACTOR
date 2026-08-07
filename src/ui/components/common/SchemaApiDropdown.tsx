import { Box, MenuItem } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import AppDropdown from "./AppDropdown";
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
  emptyPlaceholder?: string;
  excludedValues?: string[];
  /** Fetch API options on mount instead of waiting for open (e.g. bowl selection). */
  prefetch?: boolean;
  onOptionsCountChange?: (count: number) => void;
  compact?: boolean;
  compactWrap?: boolean;
};

const renderRowTemplate = (template: string, row: Record<string, unknown>): string =>
  String(template ?? "")
    .replace(/\{(\w+)\}/g, (_, key: string) => String(row[key] ?? "").trim())
    .replace(/\s*\/\s*$/, "")
    .trim();

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
  emptyPlaceholder,
  excludedValues = [],
  prefetch = false,
  onOptionsCountChange,
  compact = false,
  compactWrap = false,
}: SchemaApiDropdownProps) => {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOptions, setHasLoadedOptions] = useState(dataSource?.type === "static");
  const [shouldFetchOptions, setShouldFetchOptions] = useState(
    dataSource?.type === "static" || prefetch,
  );

  const resolvedApi = useMemo(
    () =>
      dataSource?.type === "api"
        ? resolveDataSourceApi(dataSource as SchemaDataSource & Record<string, unknown>)
        : null,
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
    setHasLoadedOptions(dataSource?.type === "static");
    setShouldFetchOptions(dataSource?.type === "static" || prefetch);
  }, [dataSource, apiContextKey, resolvedApi, prefetch]);

  useEffect(() => {
    if (!dataSource) {
      setOptions([]);
      setHasLoadedOptions(true);
      reportOptionsCount(0);
      return;
    }

    if (dataSource.type === "static") {
      const staticOptions = staticDataSourceOptions(dataSource);
      setOptions(staticOptions);
      setHasLoadedOptions(true);
      reportOptionsCount(staticOptions.length);
      return;
    }

    if (!shouldFetchOptions) {
      return;
    }

    if (!resolvedApi?.endpoint) {
      setOptions([]);
      setHasLoadedOptions(true);
      setError("API endpoint is not configured.");
      reportOptionsCount(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchSchemaDataSourceOptions(dataSource, apiContext).then(({ options: rows, error: fetchError }) => {
      if (cancelled) return;
      setLoading(false);
      setHasLoadedOptions(true);
      setError(fetchError);
      const keys = resolveSchemaOptionKeys(resolvedApi.displayKey, resolvedApi.valueKey, rows);
      const labelTemplate = resolvedApi.optionLabelTemplate;
      const valueTemplate = resolvedApi.optionValueTemplate ?? labelTemplate;
      const filterField = resolvedApi.optionFilterField;
      const filteredRows = filterField
        ? rows.filter((row) => String(row[filterField] ?? "").trim())
        : rows;
      const nextOptions = filteredRows
        .map((row) => ({
          label: labelTemplate
            ? renderRowTemplate(labelTemplate, row)
            : String(row[keys.displayKey] ?? ""),
          value: valueTemplate
            ? renderRowTemplate(valueTemplate, row)
            : String(row[keys.valueKey] ?? ""),
        }))
        .filter((option) => option.value.trim());
      setOptions(nextOptions);
      reportOptionsCount(nextOptions.length);
    });

    return () => {
      cancelled = true;
    };
  }, [dataSource, apiContextKey, resolvedApi, shouldFetchOptions]);

  const excludedSet = useMemo(
    () => new Set(excludedValues.map((entry) => String(entry).trim()).filter(Boolean)),
    [excludedValues],
  );
  const visibleOptions = useMemo(
    () => options.filter((option) => option.value === value || !excludedSet.has(option.value)),
    [excludedSet, options, value],
  );
  const resolvedEmptyPlaceholder = emptyPlaceholder ?? placeholder ?? "No options available";
  const noOptionsAvailable =
    hasLoadedOptions && !loading && visibleOptions.length === 0 && !value;
  const displayPlaceholder = noOptionsAvailable ? resolvedEmptyPlaceholder : placeholder;

  const selectedLabel = visibleOptions.find((option) => option.value === value)?.label
    ?? options.find((option) => option.value === value)?.label;
  const resolvedLabel = selectedLabel ?? (value ? String(value) : "");
  const compactSelectSx = useMemo(() => buildCompactSelectSx(compactWrap), [compactWrap]);

  return (
    <AppDropdown
      label={label}
      value={value}
      onChange={onChange}
      placeholder={displayPlaceholder}
      loading={loading}
      disabled={disabled}
      required={required}
      helperText={error ?? undefined}
      error={Boolean(error)}
      sx={compact ? compactSelectSx : undefined}
      onOpen={() => {
        if (dataSource?.type === "api") {
          setShouldFetchOptions(true);
        }
      }}
      renderValue={(selected) => {
        if (!selected) {
          return (
            <Box component="span" sx={{ color: "text.secondary", fontSize: "0.78rem", lineHeight: 1.4 }}>
              {displayPlaceholder}
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
      }}
    >
      {visibleOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </AppDropdown>
  );
};

export default SchemaApiDropdown;
