import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { SchemaField, SchemaThemeTokens } from "../../models/schema.types";
import { cloneSchemaRow } from "../../models/schemaFormState";

type NestedTableFieldProps = {
  field: SchemaField;
  rows: Record<string, unknown>[];
  onChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
};

const NestedTableField = ({ field, rows, onChange, readOnly = false, theme }: NestedTableFieldProps) => {
  const columns = field.columns ?? [];
  const tableRows =
    rows.length > 0
      ? rows
      : (field.defaultRows ?? [{}]).map((r) => cloneSchemaRow(r as Record<string, unknown>));

  const updateCell = (rowIdx: number, key: string, value: string) => {
    const next = tableRows.map((row, idx) =>
      idx === rowIdx ? { ...(row ?? {}), [key]: value } : row
    );
    onChange(next);
  };

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 1 }}>
        {field.label}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 700 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.map((row, rowIdx) => (
              <TableRow key={`${field.key}-${rowIdx}`}>
                {columns.map((col) => {
                  if (col.readonly) {
                    return (
                      <TableCell key={col.key}>
                        <Typography sx={{ fontSize: "0.78rem" }}>
                          {String((row as Record<string, unknown>)[col.key] ?? "")}
                        </Typography>
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={col.key}>
                      <TextField
                        size="small"
                        fullWidth
                        disabled={readOnly}
                        type={col.type === "number" ? "number" : "text"}
                        value={String((row as Record<string, unknown>)[col.key] ?? "")}
                        onChange={(e) => updateCell(rowIdx, col.key, e.target.value)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default NestedTableField;
