import { Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  fetchSchemaDataSourceOptions,
  resolveDataSourceApi,
  resolveSchemaOptionKeys,
  type SchemaApiContext,
} from "../../../schema-engine/rules/apiDependency";
import type { SchemaDataSource } from "../../../schema-engine/types";

type SchemaReadonlyDisplayProps = {
  value: string;
  dataSource?: SchemaDataSource;
  apiContext?: SchemaApiContext;
  emphasis?: boolean;
};

const SchemaReadonlyDisplay = ({
  value,
  dataSource,
  apiContext,
  emphasis = false,
}: SchemaReadonlyDisplayProps) => {
  const [label, setLabel] = useState(value);
  const apiContextKey = useMemo(() => JSON.stringify(apiContext ?? {}), [apiContext]);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setLabel("");
      return;
    }

    if (!dataSource || dataSource.type !== "api") {
      setLabel(trimmed);
      return;
    }

    let cancelled = false;
    const resolvedApi = resolveDataSourceApi(dataSource as SchemaDataSource & Record<string, unknown>);
    fetchSchemaDataSourceOptions(dataSource, apiContext).then(({ options }) => {
      if (cancelled) return;
      const keys = resolveSchemaOptionKeys(resolvedApi.displayKey, resolvedApi.valueKey, options);
      const match = options.find((row) => String(row[keys.valueKey] ?? "") === trimmed);
      setLabel(match ? String(match[keys.displayKey] ?? trimmed) : trimmed);
    });

    return () => {
      cancelled = true;
    };
  }, [value, dataSource, apiContextKey]);

  return (
    <Typography
      sx={{
        fontSize: "0.78rem",
        lineHeight: 1.45,
        wordBreak: "break-word",
        color: "text.primary",
        fontWeight: emphasis ? 600 : 400,
        py: 0.25,
      }}
    >
      {label.trim() || "—"}
    </Typography>
  );
};

export default SchemaReadonlyDisplay;
