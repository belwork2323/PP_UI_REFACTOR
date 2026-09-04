import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from "@mui/material";
import { Controller, useFormContext, get } from "react-hook-form";
import { MixingTableInput } from "./MixingFormFields";
import { STRINGS } from "../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { createDataTableTheme } from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import type { QualityCheckRow } from "../../../../../data/models/user/MixingFormModel";

const S = STRINGS.MANUFACTURING.MIXING;
const BRAND = MIXING_BRAND;
const dt = createDataTableTheme({ ...MIXING_BRAND });

const observedGroupBorder = `1px solid ${alpha("#fff", 0.55)}`;

type MixingQualityChecksTableProps = {
  rows: QualityCheckRow[];
  readOnly?: boolean;
  /** Pass full path like `premixes.${cardIdx}.qualityChecks` or `finalMixes.${cardIdx}.qualityChecks` */
  arrayName?: string;
  onChange?: (parameterId: string | number, index: number, value: string) => void;
};

const resolveRowSampleCount = (row: QualityCheckRow): number => {
  const rawCount = Number(row.noOfSamples);
  if (Number.isFinite(rawCount) && rawCount > 0) {
    return Math.floor(rawCount);
  }
  if (Array.isArray(row.observedValues) && row.observedValues.length > 0) {
    return row.observedValues.length;
  }
  return 1;
};

const displayValue = (value: any, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

export const MixingQualityChecksTable = ({
  rows = [],
  readOnly = false,
  arrayName = "qualityChecks",
  onChange,
}: MixingQualityChecksTableProps) => {
  const formContext = useFormContext?.() ?? null;
  const control = formContext?.control;
  const errors = formContext?.formState?.errors;

  const maxSampleCount = Math.max(1, ...rows.map(resolveRowSampleCount), 1);
  const sampleIndices = Array.from({ length: maxSampleCount }, (_, i) => i);

  return (
    <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 720, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "16%" }} />
          {sampleIndices.map((idx) => (
            <col key={idx} style={{ width: `${62 / maxSampleCount}%` }} />
          ))}
        </colgroup>

        <TableHead>
          <TableRow>
            <TableCell
              rowSpan={maxSampleCount > 1 ? 2 : 1}
              sx={{ ...dt.tableHeaderCell(true), minWidth: 140 }}
            >
              {S.COL_PARAMETER}
            </TableCell>
            <TableCell
              rowSpan={maxSampleCount > 1 ? 2 : 1}
              sx={{ ...dt.tableHeaderCell(false), minWidth: 120 }}
            >
              {S.COL_SPECIFICATION}
            </TableCell>
            <TableCell
              colSpan={maxSampleCount}
              align="center"
              sx={{
                ...dt.tableHeaderCell(false),
                borderLeft: observedGroupBorder,
              }}
            >
              {S.COL_OBSERVED_VALUES}
            </TableCell>
          </TableRow>

          {maxSampleCount > 1 ? (
            <TableRow>
              {sampleIndices.map((sampleIdx) => (
                <TableCell
                  key={sampleIdx}
                  align="center"
                  sx={{
                    ...dt.tableHeaderCell(false),
                    borderLeft:
                      sampleIdx === 0 ? observedGroupBorder : `1px solid ${alpha("#fff", 0.32)}`,
                    fontSize: "0.65rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {sampleIdx + 1}{" "}
                  <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                    *
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableHead>

        <TableBody>
          {rows.map((row, rowIdx) => {
            const rowSampleCount = resolveRowSampleCount(row);

            const spec = row.specification;
            let specText = "NA";
            if (spec && typeof spec === "object") {
              const { minValue, maxValue, unit } = spec as {
                minValue?: number;
                maxValue?: number;
                unit?: string;
              };
              if (minValue != null || maxValue != null) {
                const unitStr = unit ? ` ${unit}` : "";
                if (minValue != null && maxValue != null) {
                  specText = `${minValue} – ${maxValue}${unitStr}`;
                } else if (minValue != null) {
                  specText = `≥ ${minValue}${unitStr}`;
                } else if (maxValue != null) {
                  specText = `≤ ${maxValue}${unitStr}`;
                }
              }
            }

            return (
              <TableRow
                key={row.parameterId || `${row.parameter}-${rowIdx}`}
                sx={dt.tableRow(rowIdx)}
              >
                <TableCell sx={{ ...dt.tableCell, fontWeight: 700 }}>
                  {row.parameter || row.parameterName}
                </TableCell>

                <TableCell sx={dt.tableCell}>{specText}</TableCell>

                {sampleIndices.map((sampleIdx) => {
                  const shouldRenderValue = sampleIdx < rowSampleCount;
                  const value = row.observedValues?.[sampleIdx] ?? "";
                  const fieldPath = `${arrayName}.${rowIdx}.observedValues.${sampleIdx}`;

                  return (
                    <TableCell
                      key={sampleIdx}
                      sx={{
                        ...dt.tableCell,
                        borderLeft:
                          sampleIdx === 0
                            ? observedGroupBorder
                            : `1px solid ${alpha(BRAND.border, 0.45)}`,
                      }}
                    >
                      {shouldRenderValue ? (
                        readOnly ? (
                          displayValue(value)
                        ) : control ? (
                          <Controller
                            name={fieldPath}
                            control={control}
                            render={({ field: rhfField, fieldState: { error } }) => {
                              // Safely extract deep nested Zod/RHF error messages across card tabs
                              const nestedError = error?.message || get(errors, fieldPath)?.message;

                              return (
                                <MixingTableInput
                                  inputRef={rhfField.ref}
                                  value={rhfField.value ?? ""}
                                  placeholder={S.PLACEHOLDER_OBSERVED_VALUE}
                                  error={!!nestedError}
                                  helperText={nestedError}
                                  onChange={(val: string) => {
                                    rhfField.onChange(val);
                                    onChange?.(row.parameterId, sampleIdx, val);
                                  }}
                                  required
                                />
                              );
                            }}
                          />
                        ) : (
                          <MixingTableInput
                            value={value}
                            placeholder={S.PLACEHOLDER_OBSERVED_VALUE}
                            onChange={(val: string) => onChange?.(row.parameterId, sampleIdx, val)}
                            required
                          />
                        )
                      ) : null}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MixingQualityChecksTable;
