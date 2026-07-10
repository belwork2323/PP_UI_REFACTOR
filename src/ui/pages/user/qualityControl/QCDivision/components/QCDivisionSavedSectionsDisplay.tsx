import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SchemaSectionSubmission } from "../../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../../app/theme/custom_themes/user/qualityControl/tokens";

const BRAND = QC_DIVISION_BRAND;

const formatLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatCellValue = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? `[${value.length} rows]` : "—";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([key]) => !key.startsWith("_") && !key.endsWith("__tableColumns"),
    );
    if (!entries.length) return "—";
    return entries.map(([key, nested]) => `${formatLabel(key)}: ${formatCellValue(nested)}`).join(", ");
  }
  return "—";
};

const isTableKey = (key: string, value: unknown) =>
  !key.endsWith("__tableColumns") && Array.isArray(value) && value.length > 0 && typeof value[0] === "object";

type QCDivisionSavedSectionsDisplayProps = {
  sections: SchemaSectionSubmission[];
};

const QCDivisionSavedSectionsDisplay = ({ sections }: QCDivisionSavedSectionsDisplayProps) => {
  if (!sections.length) return null;

  return (
    <Stack spacing={2}>
      {sections.map((section, sectionIndex) => {
        const sectionEntries = section.sectionData ?? [];
        if (!sectionEntries.length) return null;

        return (
          <Box key={`${section.sectionId}-${sectionIndex}`}>
            <Box
              sx={{
                px: 1.5,
                py: 1,
                mb: 1,
                background: alpha(BRAND.primary, 0.06),
                borderRadius: 1,
                borderLeft: `3px solid ${BRAND.primary}`,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.primary }}>
                {formatLabel(section.sectionId)}
              </Typography>
            </Box>

            {sectionEntries.map((entry, entryIndex) => {
              const record = entry as Record<string, unknown>;
              const simpleFields = Object.entries(record).filter(
                ([key, value]) =>
                  !key.startsWith("_") && !key.endsWith("__tableColumns") && !isTableKey(key, value),
              );
              const tableFields = Object.entries(record).filter(([key, value]) => isTableKey(key, value));

              return (
                <Box key={`${section.sectionId}-entry-${entryIndex}`} sx={{ mb: 1.5 }}>
                  {simpleFields.length > 0 ? (
                    <TableContainer
                      sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: tableFields.length ? 1 : 0 }}
                    >
                      <Table size="small">
                        <TableBody>
                          {simpleFields.map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                  color: BRAND.textSub,
                                  px: 1.5,
                                  py: 0.6,
                                  width: 220,
                                  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
                                }}
                              >
                                {formatLabel(key)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: BRAND.text,
                                  px: 1.5,
                                  py: 0.6,
                                  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
                                }}
                              >
                                {formatCellValue(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : null}

                  {tableFields.map(([tableKey, rows]) => {
                    const tableRows = rows as Record<string, unknown>[];
                    const columns = Object.keys(tableRows[0] ?? {}).filter((key) => !key.startsWith("_"));

                    return (
                      <Box key={tableKey} sx={{ mb: 1 }}>
                        {tableFields.length > 1 || simpleFields.length > 0 ? (
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, mb: 0.5 }}>
                            {formatLabel(tableKey)}
                          </Typography>
                        ) : null}
                        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {columns.map((column) => (
                                  <TableCell
                                    key={column}
                                    sx={{ fontWeight: 700, fontSize: "0.65rem", color: BRAND.textSub, px: 1, py: 0.5 }}
                                  >
                                    {formatLabel(column)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tableRows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {columns.map((column) => (
                                    <TableCell key={column} sx={{ fontSize: "0.72rem", px: 1, py: 0.5 }}>
                                      {formatCellValue(row[column])}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Stack>
  );
};

export default QCDivisionSavedSectionsDisplay;
