import { useCallback, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import {
  getViscosityRows,
  setViscosityRows,
  type QcMixingViscosityRow,
} from "../../../../../hooks/user/qualityControl/qcMixingTables";

const BRAND = QC_DIVISION_BRAND;

const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

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

const cellSx = {
  fontSize: "0.72rem",
  py: 0.75,
  px: 0.75,
  verticalAlign: "middle",
  border: `1px solid ${TABLE_BORDER}`,
};

type QCMixingViscosityTableProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
};

const displayValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

const QCMixingViscosityTable = ({
  values,
  onChange,
  readOnly = false,
}: QCMixingViscosityTableProps) => {
  const rows = useMemo(() => getViscosityRows(values), [values]);

  const updateRows = useCallback(
    (nextRows: QcMixingViscosityRow[]) => {
      onChange(setViscosityRows(values, nextRows));
    },
    [onChange, values],
  );

  const updateRow = useCallback(
    (index: number, field: keyof QcMixingViscosityRow, value: string) => {
      updateRows(
        rows.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [field]: value, SR_NO: rowIndex + 1 } : row,
        ),
      );
    },
    [rows, updateRows],
  );

  const addRow = useCallback(() => {
    updateRows([...rows, { SR_NO: rows.length + 1, TIME: "", VISCOSITY_VALUE: "" }]);
  }, [rows, updateRows]);

  const removeRow = useCallback(
    (index: number) => {
      if (rows.length <= 1) return;
      updateRows(
        rows
          .filter((_, rowIndex) => rowIndex !== index)
          .map((row, rowIndex) => ({ ...row, SR_NO: rowIndex + 1 })),
      );
    },
    [rows, updateRows],
  );

  return (
    <Box>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 0.5 }}>
        Viscosity Build-up (P @ 40°C)
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 1 }}>
        {STRINGS.QUALITY_CONTROL.QC_DIVISION.MIXING_FINAL_MIX_VISCOSITY_ENTRY_HINT}
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
            minWidth: 420,
            borderCollapse: "collapse",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={TH}>S. No</TableCell>
              <TableCell sx={TH}>Time (min)</TableCell>
              <TableCell sx={TH}>Viscosity Value (P @ 40°C)</TableCell>
              {!readOnly ? <TableCell sx={TH} align="center" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`viscosity-${index}`}
                sx={{ background: index % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55) }}
              >
                <TableCell sx={cellSx}>{index + 1}</TableCell>
                <TableCell sx={cellSx}>
                  {readOnly ? (
                    displayValue(row.TIME)
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      value={row.TIME ?? ""}
                      onChange={(event) => updateRow(index, "TIME", event.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.72rem" } }}
                    />
                  )}
                </TableCell>
                <TableCell sx={cellSx}>
                  {readOnly ? (
                    displayValue(row.VISCOSITY_VALUE)
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      value={row.VISCOSITY_VALUE ?? ""}
                      onChange={(event) => updateRow(index, "VISCOSITY_VALUE", event.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.72rem" } }}
                    />
                  )}
                </TableCell>
                {!readOnly ? (
                  <TableCell sx={cellSx} align="center">
                    <IconButton
                      size="small"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(index)}
                      sx={{ color: BRAND.danger }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!readOnly ? (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={addRow}
            sx={{ textTransform: "none" }}
          >
            Add Row
          </Button>
        </Box>
      ) : null}
    </Box>
  );
};

export default QCMixingViscosityTable;
