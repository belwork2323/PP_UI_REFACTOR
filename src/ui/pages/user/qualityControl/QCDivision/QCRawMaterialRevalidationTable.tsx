import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  Box,
  MenuItem,
  Stack,
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
import { operationsController } from "../../../../../controllers/user/operationsController";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { computeExpandedGroupCellSpans } from "../../../../../schema-engine/rules/tableCommitGroup";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import DateField from "../../../../components/common/DateField";
import SchemaFileField from "../../../../components/common/SchemaFileField";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
import {
  QC_REVALIDATION_COLUMNS,
  QC_REVALIDATION_MERGE_COLUMNS,
  getRevalidationRows,
  renumberRevalidationRows,
  setRevalidationRows,
  type QcRevalidationRow,
} from "../../../../../hooks/user/qualityControl/qcRawMaterialRevalidationTable";

type Option = { value: string; label: string; materialCode?: string };

type QCRawMaterialRevalidationTableProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchId?: string;
  readOnly?: boolean;
};

const cellSx = {
  fontSize: "0.72rem",
  py: 0.75,
  px: 0.75,
  verticalAlign: "top",
  borderColor: alpha("#1B4F72", 0.12),
};

const readOnlyCellSx = {
  fontSize: "0.72rem",
  py: 0.5,
  px: 1,
  verticalAlign: "middle",
  borderColor: alpha("#1B4F72", 0.12),
};

const displayValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

const ReadOnlyValue = ({
  value,
  muted = false,
}: {
  value: unknown;
  muted?: boolean;
}) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: muted ? 500 : 600,
      color: muted ? QC_DIVISION_BRAND.textSub : QC_DIVISION_BRAND.text,
      lineHeight: 1.35,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >
    {displayValue(value)}
  </Typography>
);

const QCRawMaterialRevalidationTable = ({
  values,
  onChange,
  batchId,
  readOnly = false,
}: QCRawMaterialRevalidationTableProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const baseCellSx = readOnly ? readOnlyCellSx : cellSx;
  const rows = useMemo(
    () => getRevalidationRows(values).filter((row) => row._rowRole !== "picker"),
    [values],
  );
  const [lotOptions, setLotOptions] = useState<Option[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  const mergeSpans = useMemo(
    () =>
      computeExpandedGroupCellSpans(
        rows as Record<string, unknown>[],
        [...QC_REVALIDATION_MERGE_COLUMNS],
      ),
    [rows],
  );

  useEffect(() => {
    if (!batchId) {
      setLotOptions([]);
      return;
    }
    let active = true;
    setLoadingLots(true);
    void operationsController
      .fetchMaterialLots({ batchId })
      .then((response: any) => {
        if (!active) return;
        const model = response?.data;
        const materials = Array.isArray(model?.materials) ? model.materials : [];
        const options: Option[] = [];
        materials.forEach((material: Record<string, unknown>) => {
          const materialCode = String(material.materialCode ?? "").trim();
          const lotId = String(material.lotId ?? material.lotNo ?? "").trim();
          if (lotId) {
            options.push({
              value: lotId,
              label: lotId,
              materialCode,
            });
          }
        });
        setLotOptions(options);
      })
      .catch(() => {
        if (active) setLotOptions([]);
      })
      .finally(() => {
        if (active) setLoadingLots(false);
      });
    return () => {
      active = false;
    };
  }, [batchId]);

  const commitRows = useCallback(
    (nextRows: QcRevalidationRow[]) => {
      onChange(setRevalidationRows(values, renumberRevalidationRows(nextRows)));
    },
    [onChange, values],
  );

  const updateRow = useCallback(
    (index: number, patch: Partial<QcRevalidationRow>) => {
      commitRows(rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
    },
    [commitRows, rows],
  );

  const renderSelect = (
    value: string,
    options: Array<Option & { disabled?: boolean }>,
    onValueChange: (next: string) => void,
    placeholder: string,
    disabled?: boolean,
    loading?: boolean,
  ) => (
    <TextField
      select
      size="small"
      fullWidth
      value={value}
      disabled={disabled || readOnly}
      onChange={(event) => onValueChange(event.target.value)}
      SelectProps={{ displayEmpty: true }}
      sx={{ minWidth: 140, "& .MuiInputBase-input": { fontSize: "0.72rem", py: 0.7 } }}
    >
      <MenuItem value="">
        <em>{loading ? "Loading…" : placeholder}</em>
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderText = (
    value: string,
    onValueChange: (next: string) => void,
    placeholder: string,
    disabled?: boolean,
    multiline?: boolean,
  ) => (
    <TextField
      size="small"
      fullWidth
      value={value}
      disabled={disabled || readOnly}
      placeholder={placeholder}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      onChange={(event) => onValueChange(event.target.value)}
      sx={{ minWidth: 110, "& .MuiInputBase-input": { fontSize: "0.72rem", py: 0.7 } }}
    />
  );

  const mergedCellSx = (rowSpan: number) =>
    rowSpan > 1
      ? {
          ...baseCellSx,
          verticalAlign: "middle" as const,
          borderRight: `1px solid ${alpha("#1B4F72", 0.12)}`,
          background: alpha(BRAND.primaryLight, 0.04),
        }
      : baseCellSx;

  return (
    <Box>
      <TableContainer
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: readOnly ? 1 : 2,
          background: "#fff",
          overflowX: "auto",
        }}
      >
        <Table size="small" stickyHeader={!readOnly}>
          <TableHead>
            <TableRow>
              {QC_REVALIDATION_COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    ...baseCellSx,
                    fontWeight: 800,
                    fontSize: readOnly ? "0.65rem" : "0.72rem",
                    letterSpacing: readOnly ? "0.02em" : undefined,
                    textTransform: readOnly ? "uppercase" : undefined,
                    color: BRAND.primary,
                    background: alpha(BRAND.primaryLight, 0.08),
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const isExpanded = row._rowRole === "expanded";
              const groupId = String(row._groupId ?? "");
              const nextRow = rows[index + 1];
              const isLastInGroup =
                isExpanded &&
                Boolean(groupId) &&
                (!nextRow ||
                  nextRow._rowRole !== "expanded" ||
                  String(nextRow._groupId ?? "") !== groupId);
              const groupCertificate = isLastInGroup
                ? String(
                    rows.find(
                      (entry) =>
                        String(entry._groupId ?? "") === groupId &&
                        String(entry.QC_CERTIFICATE ?? "").trim(),
                    )?.QC_CERTIFICATE ??
                      row.QC_CERTIFICATE ??
                      "",
                  )
                : "";

              const srSpan = mergeSpans.get(`${index}:SR_NO`);
              const ingredientSpan = mergeSpans.get(`${index}:INGREDIENT`);
              const lotSpan = mergeSpans.get(`${index}:LOT_BATCH_NUMBER`);

              return (
              <Fragment key={`${row._groupId ?? "row"}-${index}`}>
                <TableRow>
                  {srSpan?.isContinuation ? null : (
                    <TableCell
                      sx={mergedCellSx(srSpan?.rowSpan ?? 1)}
                      rowSpan={srSpan?.rowSpan && srSpan.rowSpan > 1 ? srSpan.rowSpan : undefined}
                    >
                      <ReadOnlyValue value={row.SR_NO} />
                    </TableCell>
                  )}
                  {ingredientSpan?.isContinuation ? null : (
                    <TableCell
                      sx={{ ...mergedCellSx(ingredientSpan?.rowSpan ?? 1), minWidth: readOnly ? 100 : 180 }}
                      rowSpan={
                        ingredientSpan?.rowSpan && ingredientSpan.rowSpan > 1
                          ? ingredientSpan.rowSpan
                          : undefined
                      }
                    >
                      <ReadOnlyValue value={row.INGREDIENT} />
                    </TableCell>
                  )}
                  {lotSpan?.isContinuation ? null : (
                    <TableCell
                      sx={{ ...mergedCellSx(lotSpan?.rowSpan ?? 1), minWidth: readOnly ? 110 : 170 }}
                      rowSpan={lotSpan?.rowSpan && lotSpan.rowSpan > 1 ? lotSpan.rowSpan : undefined}
                    >
                      {isExpanded ? (
                        readOnly ? (
                          <ReadOnlyValue value={row.LOT_BATCH_NUMBER} />
                        ) : (
                          renderSelect(
                            String(row.LOT_BATCH_NUMBER ?? ""),
                            lotOptions.filter(
                              (option) =>
                                !option.materialCode ||
                                option.materialCode === String(row.INGREDIENT ?? "").trim(),
                            ),
                            (next) => {
                              commitRows(
                                rows.map((entry) =>
                                  String(entry._groupId ?? "") === groupId
                                    ? { ...entry, LOT_BATCH_NUMBER: next }
                                    : entry,
                                ),
                              );
                            },
                            "Select lot / batch",
                            !String(row.INGREDIENT ?? "").trim(),
                            loadingLots,
                          )
                        )
                      ) : (
                        <ReadOnlyValue value={row.LOT_BATCH_NUMBER} />
                      )}
                    </TableCell>
                  )}
                  <TableCell sx={{ ...baseCellSx, minWidth: readOnly ? 140 : 180 }}>
                    <ReadOnlyValue value={row.PARAMETER} muted />
                  </TableCell>
                  <TableCell sx={{ ...baseCellSx, minWidth: readOnly ? 90 : 120 }}>
                    <ReadOnlyValue value={row.SPECIFICATION} muted />
                  </TableCell>
                  <TableCell sx={{ ...baseCellSx, minWidth: readOnly ? 90 : 120 }}>
                    {isExpanded ? (
                      readOnly ? (
                        <ReadOnlyValue value={row.RESULT} />
                      ) : (
                        renderText(
                          String(row.RESULT ?? ""),
                          (next) => updateRow(index, { RESULT: next }),
                          "Analysed Result",
                        )
                      )
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ ...baseCellSx, minWidth: readOnly ? 90 : 120 }}>
                    {isExpanded ? (
                      readOnly ? (
                        <ReadOnlyValue value={row.ACEM_QC_RESULT} />
                      ) : (
                        renderText(
                          String(row.ACEM_QC_RESULT ?? ""),
                          (next) => updateRow(index, { ACEM_QC_RESULT: next }),
                          "ACEM QC Result",
                        )
                      )
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ ...baseCellSx, minWidth: readOnly ? 100 : 150 }}>
                    {isExpanded ? (
                      readOnly ? (
                        <ReadOnlyValue value={row.VALIDITY} />
                      ) : (
                        <DateField
                          value={String(row.VALIDITY ?? "")}
                          onChange={(next) => updateRow(index, { VALIDITY: next })}
                          placeholder="Validity"
                        />
                      )
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ ...baseCellSx, minWidth: readOnly ? 110 : 150 }}>
                    {isExpanded ? (
                      readOnly ? (
                        <ReadOnlyValue value={row.REMARKS} muted />
                      ) : (
                        renderText(
                          String(row.REMARKS ?? ""),
                          (next) => updateRow(index, { REMARKS: next }),
                          "Remarks",
                          false,
                          true,
                        )
                      )
                    ) : null}
                  </TableCell>
                </TableRow>
                {isLastInGroup ? (
                  <TableRow sx={{ background: alpha(BRAND.primaryLight, 0.03) }}>
                    <TableCell
                      colSpan={QC_REVALIDATION_COLUMNS.length}
                      sx={{ ...baseCellSx, py: readOnly ? 0.65 : 1 }}
                    >
                      {readOnly ? (
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          justifyContent="space-between"
                          gap={0.75}
                        >
                          <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub }}>
                            QC Certificate
                          </Typography>
                          <ReadOnlyValue value={groupCertificate} />
                        </Stack>
                      ) : (
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          justifyContent="space-between"
                          gap={1.25}
                        >
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.text }}>
                            Upload QC Certificate
                          </Typography>
                          <Box sx={{ minWidth: { sm: 260 }, maxWidth: 420, width: "100%" }}>
                            <SchemaFileField
                              value={groupCertificate}
                              onChange={(next) =>
                                commitRows(
                                  rows.map((entry) =>
                                    String(entry._groupId ?? "") === groupId
                                      ? { ...entry, QC_CERTIFICATE: next }
                                      : entry,
                                  ),
                                )
                              }
                              compact
                              accept={FILE_PICKER_ACCEPT.IMAGE_PDF}
                              emptyLabel="Upload"
                              multiple={false}
                            />
                          </Box>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QCRawMaterialRevalidationTable;
