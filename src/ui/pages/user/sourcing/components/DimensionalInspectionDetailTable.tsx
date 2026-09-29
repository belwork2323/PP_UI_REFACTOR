import { Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import {
  DIM_READING_KEYS,
  DIM_READING_LABELS,
} from "../../../../../data/models/user/RocketMotorCasingFormModel";
import type { CasingDimensionalTableRow } from "../../../../../data/models/user/RocketMotorCasingProcurementModel";
import type { getRocketMotorCasingTheme } from "../../../../../app/theme/custom_themes/user/sourcing/rocketMotorCasing_theme";

export type CasingDetailsTableTheme = ReturnType<typeof getRocketMotorCasingTheme>["casingDetails"];

type DimensionalInspectionDetailTableProps = {
  rows: CasingDimensionalTableRow[];
  dt: CasingDetailsTableTheme;
};

const DimensionalInspectionDetailTable = ({ rows, dt }: DimensionalInspectionDetailTableProps) => {
  const headers = [
    "#",
    "Dimension",
    "Spec range (ACEM)",
    ...DIM_READING_KEYS.map((k) => DIM_READING_LABELS[k]),
  ];

  return (
    <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {headers.map((label, i) => (
              <TableCell
                key={label}
                sx={dt.tableHeaderCell(i === 0)}
                align={i === 0 || i >= 3 ? "center" : "left"}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={`${row.paramId}-${row.side}-${row.sequenceNo}-${ri}`} sx={dt.tableRow(ri)}>
              <TableCell sx={dt.tableCell} align="center">
                {row.sequenceNo || "—"}
              </TableCell>
              <TableCell sx={{ ...dt.tableCell, ...dt.dimParamCell }}>
                <Stack spacing={0.4} alignItems="flex-start">
                  <Typography component="span" sx={{ fontWeight: 600, fontSize: "0.82rem" }}>
                    {row.paramName}
                  </Typography>
                  {row.side && row.side !== "—" ? (
                    <Chip
                      label={row.side}
                      size="small"
                      sx={{ height: 18, fontSize: "0.6rem" }}
                    />
                  ) : null}
                </Stack>
              </TableCell>
              <TableCell sx={dt.tableCell}>
                <Chip label={row.specRange} size="small" sx={dt.specRangeChip} />
              </TableCell>
              {row.isLooseFlap ? (
                <TableCell colSpan={4} sx={dt.tableCell}>
                  <Typography sx={{ fontSize: "0.82rem" }}>
                    {row.looseFlap.arcLength ? `Arc length: ${row.looseFlap.arcLength}` : null}
                    {row.looseFlap.arcLength && row.looseFlap.axialLength ? " · " : null}
                    {row.looseFlap.axialLength ? `Axial length: ${row.looseFlap.axialLength}` : null}
                    {!row.looseFlap.arcLength && !row.looseFlap.axialLength ? "—" : null}
                  </Typography>
                </TableCell>
              ) : (
                DIM_READING_KEYS.map((key) => (
                  <TableCell key={key} sx={{ ...dt.tableCell, ...dt.dimReadingCell }} align="center">
                    {row.readings[key] || "—"}
                  </TableCell>
                ))
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DimensionalInspectionDetailTable;
