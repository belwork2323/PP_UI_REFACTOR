import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { MockTrialDetailTable } from "../../../../../data/models/user/RocketMotorCasingProcurementModel";
import type { getRocketMotorCasingTheme } from "../../../../../app/theme/custom_themes/user/sourcing/rocketMotorCasing_theme";

export type CasingDetailsTableTheme = ReturnType<typeof getRocketMotorCasingTheme>["casingDetails"];

type MockTrialDetailTablesProps = {
  tables: MockTrialDetailTable[];
  dt: CasingDetailsTableTheme;
};

const MockTrialDetailTables = ({ tables, dt }: MockTrialDetailTablesProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1.5 }}>
    {tables.map((table) => (
      <Box key={table.title}>
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: dt.blockMetaStrong?.color ?? "text.primary", mb: 0.75 }}>
          {table.title}
        </Typography>
        <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                {table.columns.map((col, i) => (
                  <TableCell key={col.key} sx={dt.tableHeaderCell(i === 0)} align={col.key === "srNo" ? "center" : "left"}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((row, ri) => (
                <TableRow key={`${table.title}-${ri}`} sx={dt.tableRow(ri)}>
                  {table.columns.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{ ...dt.tableCell, ...(col.key === "srNo" ? { textAlign: "center", fontWeight: 600 } : dt.resultText) }}
                    >
                      {row[col.key] || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    ))}
  </Box>
);

export default MockTrialDetailTables;
