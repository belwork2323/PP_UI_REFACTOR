import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { SchemaMatrixBlock } from "../../../schema-engine/types";
import type { SchemaApiContext } from "../../../schema-engine/rules/apiDependency";
import {
  fetchSchemaDataSourceOptions,
  resolveSchemaOptionKeys,
} from "../../../schema-engine/rules/apiDependency";
import type { SchemaThemeTokens } from "../../../schema-engine/utils/schemaUtils";
import {
  buildStageColumnsFromApi,
  createCustomStageColumn,
  createEmptyMatrixRow,
  type CuringProjectStageMatrix,
  type CuringStageColumn,
} from "../../../data/models/user/curingProjectStageMatrix";

type MatrixTableProps = {
  config: SchemaMatrixBlock;
  value: CuringProjectStageMatrix;
  onChange: (value: CuringProjectStageMatrix) => void;
  readOnly?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
};

const MatrixTable = ({
  config,
  value,
  onChange,
  readOnly = false,
  theme,
  apiContext,
  batch = {},
  motorId = "",
}: MatrixTableProps) => {
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stagesError, setStagesError] = useState<string | null>(null);
  const [newColumnLabel, setNewColumnLabel] = useState("");

  useEffect(() => {
    if (config.columns.type !== "api" || value.columns.length > 0) return;

    let cancelled = false;
    setStagesLoading(true);
    fetchSchemaDataSourceOptions(config.columns, apiContext).then(({ options, error }) => {
      if (cancelled) return;
      setStagesLoading(false);
      setStagesError(error);
      if (!options.length) return;

      const keys = resolveSchemaOptionKeys(
        config.columns.type === "api" ? config.columns.api.displayKey : undefined,
        config.columns.type === "api" ? config.columns.api.valueKey : undefined,
        options,
      );
      const stages = options.map((row) => ({ motorStage: String(row[keys.valueKey] ?? "") }));
      const columns = buildStageColumnsFromApi(stages);
      onChange({
        columns,
        rows: value.rows.length
          ? value.rows
          : [createEmptyMatrixRow(batch, motorId, columns)],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [config.columns, apiContext, value.columns.length]);

  const stageColumns = useMemo(() => value.columns ?? [], [value.columns]);

  const updateRowCell = (rowKey: string, columnKey: string, cellValue: string) => {
    onChange({
      ...value,
      rows: value.rows.map((row) =>
        row._rowKey === rowKey ? { ...row, cells: { ...row.cells, [columnKey]: cellValue } } : row,
      ),
    });
  };

  const addRow = () => {
    onChange({
      ...value,
      rows: [...value.rows, createEmptyMatrixRow(batch, motorId, stageColumns)],
    });
  };

  const removeRow = (rowKey: string) => {
    if (value.rows.length <= 1) return;
    onChange({ ...value, rows: value.rows.filter((row) => row._rowKey !== rowKey) });
  };

  const addColumn = () => {
    const label = newColumnLabel.trim();
    if (!label || !config.allowAddColumn) return;
    const column = createCustomStageColumn(label, stageColumns);
    onChange({
      columns: [...stageColumns, column],
      rows: value.rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [column.columnKey]: "" },
      })),
    });
    setNewColumnLabel("");
  };

  const removeColumn = (column: CuringStageColumn) => {
    if (!column.isCustom || !config.allowDeleteColumn) return;
    onChange({
      columns: stageColumns.filter((col) => col.columnKey !== column.columnKey),
      rows: value.rows.map((row) => {
        const nextCells = { ...row.cells };
        delete nextCells[column.columnKey];
        return { ...row, cells: nextCells };
      }),
    });
  };

  return (
    <Box sx={{ mb: 2 }}>
      {config.title ? (
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: theme?.primary, mb: 1 }}>
          {config.title}
        </Typography>
      ) : null}
      {stagesLoading ? (
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
          <CircularProgress size={16} />
          <Typography sx={{ fontSize: "0.76rem" }}>Loading stages…</Typography>
        </Stack>
      ) : null}
      {stagesError ? (
        <Typography sx={{ fontSize: "0.76rem", color: "error.main", mb: 1 }}>{stagesError}</Typography>
      ) : null}

      <TableContainer sx={{ overflowX: "auto", border: `1px solid ${theme?.border ?? "#D5D8DC"}`, borderRadius: 2 }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
              {config.rowFields.map((field) => (
                <TableCell key={field.id} sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                  {field.label}
                </TableCell>
              ))}
              {stageColumns.map((col) => (
                <TableCell key={col.columnKey} align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                    <span>{col.stage}</span>
                    {col.isCustom && !readOnly && config.allowDeleteColumn ? (
                      <IconButton size="small" onClick={() => removeColumn(col)}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    ) : null}
                  </Stack>
                </TableCell>
              ))}
              {!readOnly && config.rows?.allowDelete !== false ? <TableCell sx={{ width: 48 }} /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {value.rows.map((row) => (
              <TableRow key={row._rowKey}>
                {config.rowFields.map((field) => (
                  <TableCell key={field.id} sx={{ fontSize: "0.78rem" }}>
                    {String((row as Record<string, unknown>)[field.id] ?? "—")}
                  </TableCell>
                ))}
                {stageColumns.map((col) => (
                  <TableCell key={`${row._rowKey}-${col.columnKey}`}>
                    <TextField
                      size="small"
                      type="number"
                      value={row.cells[col.columnKey] ?? ""}
                      disabled={readOnly}
                      onChange={(e) => updateRowCell(row._rowKey, col.columnKey, e.target.value)}
                      inputProps={{ min: 0, style: { fontSize: "0.78rem" } }}
                      sx={{ minWidth: 88 }}
                    />
                  </TableCell>
                ))}
                {!readOnly && config.rows?.allowDelete !== false ? (
                  <TableCell>
                    {value.rows.length > 1 ? (
                      <IconButton size="small" color="error" onClick={() => removeRow(row._rowKey)}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!readOnly ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mt: 1 }}>
          {config.rows?.allowAdd !== false ? (
            <Button size="small" variant="outlined" onClick={addRow} sx={{ textTransform: "none", fontWeight: 700 }}>
              Add Row
            </Button>
          ) : null}
          {config.allowAddColumn ? (
            <Stack direction="row" spacing={1} alignItems="center" flex={1}>
              <TextField
                size="small"
                value={newColumnLabel}
                placeholder="New stage name"
                onChange={(e) => setNewColumnLabel(e.target.value)}
                sx={{ minWidth: 180 }}
              />
              <Button size="small" variant="outlined" onClick={addColumn} sx={{ textTransform: "none", fontWeight: 700 }}>
                Add Column
              </Button>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
};

export default MatrixTable;
