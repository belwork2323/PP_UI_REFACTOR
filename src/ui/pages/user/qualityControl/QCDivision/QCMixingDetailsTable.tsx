import { useCallback, useMemo, type ReactNode } from "react";
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
  alpha,
} from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import DateField from "../../../../components/common/DateField";
import {
  QC_MIXING_FINAL_MIX_MERGE_COLUMNS,
  QC_MIXING_PREMIX_MERGE_COLUMNS,
  getMixingDetailsRows,
  getMixingValueFields,
  setMixingDetailsRows,
  type QcMixingDetailsRow,
  type QcMixingDetailsSeed,
  type QcMixingDetailsVariant,
} from "../../../../../hooks/user/qualityControl/qcMixingTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import FieldErrorText from "@/ui/components/validation/FieldErrorText";
import { fieldError } from "@/data/validation/adapters/qcMixing.validation";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const BRAND = QC_DIVISION_BRAND;

const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

const cellSx = {
  fontSize: "0.72rem",
  py: 0.75,
  px: 0.75,
  verticalAlign: "top",
  border: `1px solid ${TABLE_BORDER}`,
};

const tableFieldSx = { "& .MuiOutlinedInput-root": { fontSize: "0.72rem" } };

const tableDateFieldSx = {
  mb: 0,
  "& .MuiOutlinedInput-root": {
    fontSize: "0.72rem",
    minHeight: "32px",
    height: "32px",
  },
  "& .MuiOutlinedInput-input": {
    py: "4px",
    fontSize: "0.72rem",
  },
};

const TH = {
  ...uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
    headerFontSize: "0.68rem",
    headerLetterSpacing: "0.06em",
    headerPaddingY: "10px",
    headerPaddingX: "12px",
  }),
  border: `1px solid ${HEADER_CELL_BORDER}`,
};

type QCMixingDetailsTableProps = {
  variant: QcMixingDetailsVariant;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  autoSeed?: QcMixingDetailsSeed | null;
  /** Paths: details.{i}.BOWL_NO | DATE_OF_PREMIX | SPECIFICATION | VALUE… */
  validationErrors?: Record<string, string> | null;
};

const QCMixingDetailsTable = ({
  variant,
  values,
  onChange,
  readOnly = false,
  autoSeed = null,
  validationErrors = null,
}: QCMixingDetailsTableProps) => {
  const rows = useMemo(() => getMixingDetailsRows(values, variant), [values, variant]);
  const err = useCallback(
    (path: string) => fieldError(validationErrors ?? undefined, path),
    [validationErrors],
  );
  const valueFields = useMemo(() => getMixingValueFields(variant), [variant]);
  const mergeColumns: readonly string[] =
    variant === "premix" ? QC_MIXING_PREMIX_MERGE_COLUMNS : QC_MIXING_FINAL_MIX_MERGE_COLUMNS;
  const dateKey = (variant === "premix" ? "DATE_OF_PREMIX" : "DATE_OF_FINAL_MIX") as
    | "DATE_OF_PREMIX"
    | "DATE_OF_FINAL_MIX";
  const title =
    variant === "premix" ? "Premix Details" : S.MIXING_FINAL_MIX_SHARED_DETAILS_TITLE;
  const dateLabel = variant === "premix" ? "Date of Premix" : "Date of Final Mix";
  const baseCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const tableMinWidth = variant === "premix" ? 1080 : 860;

  const headerColumns = useMemo(
    () => [
      { key: "bowl", label: "Bowl No", show: mergeColumns.includes("BOWL_NO"), required: true },
      { key: "date", label: dateLabel, show: mergeColumns.includes(dateKey), required: true },
      { key: "mixer", label: "Mixer & Bldg No.", show: mergeColumns.includes("MIXER_BLDG_NO"), required: true },
      { key: "qty", label: "Batch size (KG)", show: mergeColumns.includes("PREMIX_QTY"), required: true },
      { key: "parameter", label: "Parameter", show: true, required: false },
      { key: "spec", label: "Specification", show: true, required: true },
      { key: "value", label: "Value", show: true, colSpan: valueFields.length, required: true },
      { key: "remarks", label: "Remarks", show: true, required: false },
    ],
    [dateKey, dateLabel, mergeColumns, valueFields.length],
  );

  const isSharedFieldLocked = useCallback(
    (field: string) => {
      if (!autoSeed || !(field in autoSeed)) return false;
      return Boolean(String((autoSeed as Record<string, unknown>)[field] ?? "").trim());
    },
    [autoSeed],
  );

  const updateRows = useCallback(
    (nextRows: QcMixingDetailsRow[]) => {
      onChange(setMixingDetailsRows(values, variant, nextRows));
    },
    [onChange, values, variant],
  );

  const updateSharedField = useCallback(
    (field: keyof QcMixingDetailsRow, value: string) => {
      updateRows(rows.map((row) => ({ ...row, [field]: value })));
    },
    [rows, updateRows],
  );

  const updateRowField = useCallback(
    (rowIndex: number, field: keyof QcMixingDetailsRow, value: string) => {
      updateRows(rows.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row)));
    },
    [rows, updateRows],
  );

  const renderSharedCell = (rowIndex: number, content: ReactNode) => {
    if (rowIndex > 0) return null;
    return (
      <TableCell rowSpan={rows.length} sx={baseCellSx}>
        {content}
      </TableCell>
    );
  };

  const renderSharedField = (
    field: keyof QcMixingDetailsRow,
    row: QcMixingDetailsRow,
    seedField: keyof QcMixingDetailsSeed | "DATE_OF_PREMIX" | "DATE_OF_FINAL_MIX",
    input: ReactNode,
  ) => {
    if (readOnly || isSharedFieldLocked(seedField)) {
      return <QCDivisionReadOnlyValue value={row[field]} />;
    }
    return input;
  };

  const renderHeaderCell = (label: string, colSpan = 1, align?: "center", required = false) => {
    const content = required ? (
      <FieldLabelWithAsterisk
        label={label}
        required
        sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }}
      />
    ) : (
      label
    );
    return readOnly ? (
      <TableCell key={label} colSpan={colSpan} align={align} sx={qcReadOnlyTableHeaderCellSx}>
        {content}
      </TableCell>
    ) : (
      <TableCell key={label} colSpan={colSpan} align={align} sx={TH}>
        {content}
      </TableCell>
    );
  };

  return (
    <Box>
      {!readOnly ? (
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : {
                overflow: "hidden",
                overflowX: "auto",
                border: `1px solid ${TABLE_BORDER}`,
                borderRadius: 2,
                background: "#fff",
              }
        }
      >
        <Table
          size="small"
          stickyHeader={!readOnly}
          sx={{
            minWidth: tableMinWidth,
            tableLayout: "fixed",
            borderCollapse: "collapse",
          }}
        >
          <TableHead>
            <TableRow>
              {headerColumns
                .filter((column) => column.show)
                .map((column) =>
                  renderHeaderCell(
                    column.label,
                    column.colSpan,
                    column.key === "value" ? "center" : undefined,
                    Boolean((column as { required?: boolean }).required),
                  ),
                )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={`${row.PARAMETER}-${rowIndex}`}
                sx={{
                  background:
                    readOnly && rowIndex % 2 === 1
                      ? alpha(BRAND.surface, 0.45)
                      : rowIndex % 2 === 0
                        ? "#fff"
                        : alpha(BRAND.surface, 0.55),
                }}
              >
                {mergeColumns.includes("BOWL_NO")
                  ? renderSharedCell(
                      rowIndex,
                      renderSharedField(
                        "BOWL_NO",
                        row,
                        "BOWL_NO",
                        <Box>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.BOWL_NO ?? ""}
                            onChange={(event) => updateSharedField("BOWL_NO", event.target.value)}
                            sx={tableFieldSx}
                            error={Boolean(err("details.0.BOWL_NO"))}
                          />
                          <FieldErrorText message={err("details.0.BOWL_NO")} />
                        </Box>,
                      ),
                    )
                  : null}
                {mergeColumns.includes(dateKey)
                  ? renderSharedCell(
                      rowIndex,
                      renderSharedField(
                        dateKey,
                        row,
                        dateKey,
                        <Box>
                          <DateField
                            compact
                            value={String(row[dateKey] ?? "")}
                            onChange={(value) => updateSharedField(dateKey, value)}
                            placeholder="DD-MM-YYYY"
                            inputSx={tableDateFieldSx}
                            error={Boolean(
                              err(
                                variant === "premix"
                                  ? "details.0.DATE_OF_PREMIX"
                                  : "details.0.DATE_OF_FINAL_MIX",
                              ),
                            )}
                          />
                          <FieldErrorText
                            message={err(
                              variant === "premix"
                                ? "details.0.DATE_OF_PREMIX"
                                : "details.0.DATE_OF_FINAL_MIX",
                            )}
                          />
                        </Box>,
                      ),
                    )
                  : null}
                {mergeColumns.includes("MIXER_BLDG_NO")
                  ? renderSharedCell(
                      rowIndex,
                      renderSharedField(
                        "MIXER_BLDG_NO",
                        row,
                        "MIXER_BLDG_NO",
                        <Box>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.MIXER_BLDG_NO ?? ""}
                            onChange={(event) =>
                              updateSharedField("MIXER_BLDG_NO", event.target.value)
                            }
                            sx={tableFieldSx}
                            error={Boolean(err("details.0.MIXER_BLDG_NO"))}
                          />
                          <FieldErrorText message={err("details.0.MIXER_BLDG_NO")} />
                        </Box>,
                      ),
                    )
                  : null}
                {mergeColumns.includes("PREMIX_QTY")
                  ? renderSharedCell(
                      rowIndex,
                      renderSharedField(
                        "PREMIX_QTY",
                        row,
                        "PREMIX_QTY",
                        <Box>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            value={row.PREMIX_QTY ?? ""}
                            onChange={(event) => updateSharedField("PREMIX_QTY", event.target.value)}
                            sx={tableFieldSx}
                            error={Boolean(err("details.0.PREMIX_QTY"))}
                          />
                          <FieldErrorText message={err("details.0.PREMIX_QTY")} />
                        </Box>,
                      ),
                    )
                  : null}
                <TableCell sx={baseCellSx}>
                  {readOnly ? (
                    <QCDivisionReadOnlyValue value={row.PARAMETER} muted />
                  ) : (
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.text }}>
                      {row.PARAMETER}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={baseCellSx}>
                  {readOnly ? (
                    <QCDivisionReadOnlyValue value={row.SPECIFICATION} muted />
                  ) : (
                    <Box>
                      <TextField
                        size="small"
                        fullWidth
                        value={row.SPECIFICATION ?? ""}
                        onChange={(event) =>
                          updateRowField(rowIndex, "SPECIFICATION", event.target.value)
                        }
                        sx={tableFieldSx}
                        error={Boolean(err(`details.${rowIndex}.SPECIFICATION`))}
                      />
                      <FieldErrorText message={err(`details.${rowIndex}.SPECIFICATION`)} />
                    </Box>
                  )}
                </TableCell>
                {valueFields.map((field) => (
                  <TableCell key={field} sx={baseCellSx}>
                    {readOnly ? (
                      <QCDivisionReadOnlyValue value={row[field]} />
                    ) : (
                      <Box>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={row[field] ?? ""}
                          onChange={(event) => updateRowField(rowIndex, field, event.target.value)}
                          sx={tableFieldSx}
                          error={Boolean(err(`details.${rowIndex}.${field}`))}
                        />
                        <FieldErrorText message={err(`details.${rowIndex}.${field}`)} />
                      </Box>
                    )}
                  </TableCell>
                ))}
                <TableCell sx={baseCellSx}>
                  {readOnly ? (
                    <QCDivisionReadOnlyValue value={row.REMARKS} muted />
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      minRows={1}
                      value={row.REMARKS ?? ""}
                      onChange={(event) => updateRowField(rowIndex, "REMARKS", event.target.value)}
                      sx={tableFieldSx}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QCMixingDetailsTable;
