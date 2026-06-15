import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { SchemaApiContext, SchemaColumn, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import { isPresetTableCell } from "../../models/schemaFormState";
import { cloneSchemaRow } from "../../models/schemaFormState";
import { applyFormulaColumns } from "../../utils/formulaEval";
import { getAllTableColumns, getTableColumnLayout, sectionHasGroupedColumns } from "../../utils/schemaTableColumns";
import {
  getSchemaTableHeaderLabel,
  isSchemaTableHeaderRow,
  isSchemaTableRowReadonly,
  resolveSchemaTableCellType,
} from "../../utils/tableCellTypes";
import SchemaTableCellInput from "../fields/SchemaTableCellInput";
import SchemaTableDropdownCell from "../fields/SchemaTableDropdownCell";

type TableSectionProps = {
  section: SchemaSection;
  rows: Record<string, unknown>[];
  onRowsChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const isFormulaColumn = (col: SchemaColumn) =>
  col.type === "formula" || Boolean(col.formula?.expression);

const isEditableColumn = (col: SchemaColumn) =>
  !col.readonly && !isFormulaColumn(col) && col.type !== "formula" && col.type !== "static";

const isRowValueReadonly = (col: SchemaColumn, row: Record<string, unknown>) => {
  if (isSchemaTableHeaderRow(row)) return true;
  if (col.type === "static" || col.readonly) return true;
  if (isSchemaTableRowReadonly(row) && (col.readonly || col.key === "value" || col.type === "dynamic")) {
    return true;
  }
  return false;
};

const renderBodyCell = (
  section: SchemaSection,
  col: SchemaColumn,
  colIdx: number,
  row: Record<string, unknown>,
  rowIdx: number,
  readOnly: boolean,
  theme: SchemaThemeTokens,
  apiContext: SchemaApiContext | undefined,
  onFieldChange: (rowIdx: number, key: string, value: string) => void
) => {
  if (col.key === "srNo") {
    return (
      <TableCell key={col.key} sx={col.width ? { width: col.width, minWidth: col.width } : undefined}>
        {String(row.srNo ?? rowIdx + 1)}
      </TableCell>
    );
  }

  const presetCell = isPresetTableCell(section.sectionId, col.key, row, col);
  const cellReadonly = readOnly || isRowValueReadonly(col, row);
  const cellType = resolveSchemaTableCellType(col, row);

  if (presetCell || !isEditableColumn(col) || cellReadonly) {
    const displayText =
      col.key === "setParameter"
        ? String(row.displayValue ?? row[col.key] ?? "")
        : String(row[col.key] ?? "");
    const unit = col.formula?.unit ?? col.measurementConfig?.unit ?? col.unit ?? row.unit;
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
            fontWeight: col.key === "operation" || col.key === "parameter" || col.type === "static" ? 600 : 400,
            whiteSpace: col.key === "setParameter" ? "pre-line" : "normal",
            lineHeight: 1.45,
          }}
        >
          {withUnit}
        </Typography>
      </TableCell>
    );
  }

  const cellValue = String(row[col.key] ?? "");

  if (cellType === "dropdown" || col.type === "dropdown") {
    return (
      <TableCell
        key={`${col.key}-${colIdx}`}
        sx={col.width ? { width: col.width, minWidth: col.width } : undefined}
      >
        <SchemaTableDropdownCell
          column={col}
          value={cellValue}
          disabled={readOnly}
          theme={theme}
          apiContext={apiContext}
          onChange={(next) => onFieldChange(rowIdx, col.key, next)}
        />
      </TableCell>
    );
  }

  return (
    <TableCell
      key={`${col.key}-${colIdx}`}
      sx={col.width ? { width: col.width, minWidth: col.width } : undefined}
    >
      <SchemaTableCellInput
        column={col}
        row={row}
        value={cellValue}
        disabled={readOnly}
        theme={theme}
        onChange={(next) => onFieldChange(rowIdx, col.key, next)}
      />
    </TableCell>
  );
};

const TableSection = ({
  section,
  rows,
  onRowsChange,
  readOnly = false,
  theme,
  apiContext,
}: TableSectionProps) => {
  const allColumns = getAllTableColumns(section);
  const hasGrouped = sectionHasGroupedColumns(section);
  const columnLayout = getTableColumnLayout(section);

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
                  {columnLayout.map((slot, slotIdx) =>
                    slot.kind === "column" ? (
                      <TableCell
                        key={`group-top-${slot.column.key}-${slotIdx}`}
                        rowSpan={2}
                        sx={{
                          ...headerCellSx,
                          ...(slot.column.width
                            ? { width: slot.column.width, minWidth: slot.column.width }
                            : {}),
                        }}
                      >
                        {slot.column.label}
                      </TableCell>
                    ) : (
                      <TableCell
                        key={`group-${slot.group.groupLabel ?? slotIdx}`}
                        align="center"
                        colSpan={slot.group.columns?.length ?? 1}
                        sx={{ ...headerCellSx, borderBottom: `1px solid ${theme.border}` }}
                      >
                        {slot.group.groupLabel ?? ""}
                      </TableCell>
                    ),
                  )}
                </TableRow>
                <TableRow>
                  {columnLayout.flatMap((slot, slotIdx) =>
                    slot.kind === "group"
                      ? (slot.group.columns ?? []).map((col) => (
                          <TableCell
                            key={`sub-${col.key}-${slotIdx}`}
                            sx={{
                              ...headerCellSx,
                              ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                            }}
                          >
                            {col.label}
                          </TableCell>
                        ))
                      : [],
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
            {displayRows.map((row, rowIdx) => {
              const rowRecord = row as Record<string, unknown>;

              if (isSchemaTableHeaderRow(rowRecord)) {
                return (
                  <TableRow
                    key={`${section.sectionId}-header-${rowIdx}`}
                    sx={{ background: "rgba(21,101,192,0.06)" }}
                  >
                    <TableCell colSpan={allColumns.length} sx={{ py: 1 }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: theme.primary }}>
                        {getSchemaTableHeaderLabel(rowRecord)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={`${section.sectionId}-${rowIdx}`}>
                  {allColumns.map((col, colIdx) =>
                    renderBodyCell(
                      section,
                      col,
                      colIdx,
                      rowRecord,
                      rowIdx,
                      readOnly,
                      theme,
                      apiContext,
                      updateRowField
                    )
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {Boolean(section.addRowAllowed) && !readOnly && (
        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={addRow}>
          Add Row
        </Button>
      )}
    </>
  );
};

export default TableSection;
