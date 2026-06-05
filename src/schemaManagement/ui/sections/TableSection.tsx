import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { SchemaColumn, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import { isPresetTableCell } from "../../models/schemaFormState";
import { cloneSchemaRow } from "../../models/schemaFormState";
import { applyFormulaColumns } from "../../utils/formulaEval";
import { getAllTableColumns, sectionHasGroupedColumns } from "../../utils/schemaTableColumns";

type TableSectionProps = {
  section: SchemaSection;
  rows: Record<string, unknown>[];
  onRowsChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
};

const isFormulaColumn = (col: SchemaColumn) =>
  col.type === "formula" || Boolean(col.formula?.expression);

const isEditableColumn = (col: SchemaColumn) =>
  !col.readonly && !isFormulaColumn(col) && col.type !== "formula";

const renderBodyCell = (
  section: SchemaSection,
  col: SchemaColumn,
  colIdx: number,
  row: Record<string, unknown>,
  rowIdx: number,
  readOnly: boolean,
  theme: SchemaThemeTokens,
  onFieldChange: (rowIdx: number, key: string, value: string) => void
) => {
  if (col.key === "srNo") {
    return (
      <TableCell key={col.key} sx={col.width ? { width: col.width, minWidth: col.width } : undefined}>
        {String(row.srNo ?? rowIdx + 1)}
      </TableCell>
    );
  }

  const presetCell = isPresetTableCell(section.sectionId, col.key, row);
  if (presetCell || !isEditableColumn(col) || readOnly) {
    const displayText =
      col.key === "setParameter"
        ? String(row.displayValue ?? row[col.key] ?? "")
        : String(row[col.key] ?? "");
    const unit = col.formula?.unit ?? col.measurementConfig?.unit ?? col.unit;
    const withUnit =
      displayText && unit && isFormulaColumn(col) ? `${displayText} ${unit}` : displayText;

    return (
      <TableCell
        key={`${col.key}-${colIdx}`}
        sx={col.width ? { width: col.width, minWidth: col.width } : undefined}
      >
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: theme.text,
            whiteSpace: col.key === "setParameter" ? "pre-line" : "normal",
            lineHeight: 1.45,
          }}
        >
          {withUnit}
        </Typography>
      </TableCell>
    );
  }

  return (
    <TableCell
      key={`${col.key}-${colIdx}`}
      sx={col.width ? { width: col.width, minWidth: col.width } : undefined}
    >
      <TextField
        size="small"
        fullWidth
        type={
          col.type === "number" || col.type === "measurement" ? "number" : col.type === "datetime" ? "datetime-local" : "text"
        }
        value={String(row[col.key] ?? "")}
        onChange={(e) => onFieldChange(rowIdx, col.key, e.target.value)}
      />
    </TableCell>
  );
};

const TableSection = ({ section, rows, onRowsChange, readOnly = false, theme }: TableSectionProps) => {
  const allColumns = getAllTableColumns(section);
  const hasGrouped = sectionHasGroupedColumns(section);
  const baseColumns = section.columns ?? [];
  const groupedColumns = section.groupedColumns ?? [];

  const displayRows =
    rows.length > 0
      ? rows
      : (section.defaultRows ?? []).map((r) => cloneSchemaRow(r as Record<string, unknown>));

  const updateRowField = (rowIdx: number, key: string, value: string) => {
    const next = displayRows.map((row, idx) => {
      if (idx !== rowIdx) return row;
      return applyFormulaColumns({ ...(row ?? {}), [key]: value }, allColumns);
    });
    onRowsChange(next);
  };

  const addRow = () => {
    onRowsChange([
      ...displayRows,
      applyFormulaColumns({ srNo: displayRows.length + 1 }, allColumns),
    ]);
  };

  const headerCellSx = { fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap" as const };

  return (
    <>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: hasGrouped ? 720 : undefined }}>
          <TableHead>
            {hasGrouped ? (
              <>
                <TableRow>
                  {baseColumns.map((col) => (
                    <TableCell
                      key={`group-top-${col.key}`}
                      rowSpan={2}
                      sx={{ ...headerCellSx, ...(col.width ? { width: col.width, minWidth: col.width } : {}) }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                  {groupedColumns.map((group) => (
                    <TableCell
                      key={`group-${group.groupLabel ?? "group"}`}
                      align="center"
                      colSpan={group.columns?.length ?? 1}
                      sx={{ ...headerCellSx, borderBottom: `1px solid ${theme.border}` }}
                    >
                      {group.groupLabel ?? ""}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {groupedColumns.flatMap((group) =>
                    (group.columns ?? []).map((col) => (
                      <TableCell
                        key={`sub-${col.key}`}
                        sx={{ ...headerCellSx, ...(col.width ? { width: col.width, minWidth: col.width } : {}) }}
                      >
                        {col.label}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              </>
            ) : (
              <TableRow>
                {allColumns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{ ...headerCellSx, ...(col.width ? { width: col.width, minWidth: col.width } : {}) }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {displayRows.map((row, rowIdx) => (
              <TableRow key={`${section.sectionId}-${rowIdx}`}>
                {allColumns.map((col, colIdx) =>
                  renderBodyCell(section, col, colIdx, row as Record<string, unknown>, rowIdx, readOnly, theme, updateRowField)
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {section.addRowAllowed && !readOnly && (
        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={addRow}>
          Add Row
        </Button>
      )}
    </>
  );
};

export default TableSection;
