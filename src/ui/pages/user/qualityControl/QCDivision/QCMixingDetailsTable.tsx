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

const readOnlyCellSx = {
  ...cellSx,
  py: 0.5,
  verticalAlign: "middle",
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
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  padding: "10px 12px",
  whiteSpace: "nowrap" as const,
  border: `1px solid ${HEADER_CELL_BORDER}`,
};

type QCMixingDetailsTableProps = {
  variant: QcMixingDetailsVariant;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  autoSeed?: QcMixingDetailsSeed | null;
};

const displayValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

const QCMixingDetailsTable = ({
  variant,
  values,
  onChange,
  readOnly = false,
  autoSeed = null,
}: QCMixingDetailsTableProps) => {
  const rows = useMemo(() => getMixingDetailsRows(values, variant), [values, variant]);
  const valueFields = useMemo(() => getMixingValueFields(variant), [variant]);
  const mergeColumns =
    variant === "premix" ? QC_MIXING_PREMIX_MERGE_COLUMNS : QC_MIXING_FINAL_MIX_MERGE_COLUMNS;
  const dateKey = variant === "premix" ? "DATE_OF_PREMIX" : "DATE_OF_FINAL_MIX";
  const title =
    variant === "premix" ? "Premix Details" : S.MIXING_FINAL_MIX_SHARED_DETAILS_TITLE;
  const dateLabel = variant === "premix" ? "Date of Premix" : "Date of Final Mix";
  const baseCellSx = readOnly ? readOnlyCellSx : cellSx;
  const tableMinWidth = variant === "premix" ? 1080 : 860;

  const isSharedFieldLocked = useCallback(
    (field: keyof QcMixingDetailsSeed) => Boolean(String(autoSeed?.[field] ?? "").trim()),
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
    seedField: keyof QcMixingDetailsSeed,
    input: ReactNode,
  ) => {
    const display = displayValue(row[field]);
    if (readOnly || isSharedFieldLocked(seedField)) return display;
    return input;
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 1 }}>
        {title}
      </Typography>
      <TableContainer
        sx={{
          overflow: "hidden",
          overflowX: "auto",
          border: `1px solid ${TABLE_BORDER}`,
          borderRadius: 2,
          background: "#fff",
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: tableMinWidth,
            tableLayout: "fixed",
            borderCollapse: "collapse",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={TH}>Bowl No</TableCell>
              <TableCell sx={TH}>{dateLabel}</TableCell>
              <TableCell sx={TH}>Mixer & Bldg No.</TableCell>
              <TableCell sx={TH}>Batch size (KG)</TableCell>
              <TableCell sx={TH}>Parameter</TableCell>
              <TableCell sx={TH}>Specification</TableCell>
              <TableCell sx={TH} colSpan={valueFields.length} align="center">
                Value
              </TableCell>
              <TableCell sx={TH}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={`${row.PARAMETER}-${rowIndex}`}
                sx={{ background: rowIndex % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55) }}
              >
                {mergeColumns.includes("BOWL_NO")
                  ? renderSharedCell(
                      rowIndex,
                      renderSharedField(
                        "BOWL_NO",
                        row,
                        "BOWL_NO",
                        <TextField
                          size="small"
                          fullWidth
                          value={row.BOWL_NO ?? ""}
                          onChange={(event) => updateSharedField("BOWL_NO", event.target.value)}
                          sx={tableFieldSx}
                        />,
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
                        <DateField
                          compact
                          value={String(row[dateKey] ?? "")}
                          onChange={(value) => updateSharedField(dateKey, value)}
                          placeholder="DD-MM-YYYY"
                          inputSx={tableDateFieldSx}
                        />,
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
                        <TextField
                          size="small"
                          fullWidth
                          value={row.MIXER_BLDG_NO ?? ""}
                          onChange={(event) =>
                            updateSharedField("MIXER_BLDG_NO", event.target.value)
                          }
                          sx={tableFieldSx}
                        />,
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
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={row.PREMIX_QTY ?? ""}
                          onChange={(event) => updateSharedField("PREMIX_QTY", event.target.value)}
                          sx={tableFieldSx}
                        />,
                      ),
                    )
                  : null}
                <TableCell sx={baseCellSx}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.text }}>
                    {row.PARAMETER}
                  </Typography>
                </TableCell>
                <TableCell sx={baseCellSx}>
                  {readOnly ? (
                    displayValue(row.SPECIFICATION)
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      value={row.SPECIFICATION ?? ""}
                      onChange={(event) =>
                        updateRowField(rowIndex, "SPECIFICATION", event.target.value)
                      }
                      sx={tableFieldSx}
                    />
                  )}
                </TableCell>
                {valueFields.map((field) => (
                  <TableCell key={field} sx={baseCellSx}>
                    {readOnly ? (
                      displayValue(row[field])
                    ) : (
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={row[field] ?? ""}
                        onChange={(event) => updateRowField(rowIndex, field, event.target.value)}
                        sx={tableFieldSx}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell sx={baseCellSx}>
                  {readOnly ? (
                    displayValue(row.REMARKS)
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
