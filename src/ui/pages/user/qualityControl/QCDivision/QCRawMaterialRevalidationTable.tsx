import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { operationsController } from "../../../../../controllers/user/operationsController";
import { normalizeMaterialsListResponse } from "../../../../../data/models/user/MaterialsListModel";
import { MaterialSpecificationListModel } from "../../../../../data/models/user/MaterialSpecificationModel";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { computeExpandedGroupCellSpans } from "../../../../../schema-engine/rules/tableCommitGroup";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import DateField from "../../../../components/common/DateField";
import SchemaFileField from "../../../../components/common/SchemaFileField";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
import {
  QC_REVALIDATION_COLUMNS,
  QC_REVALIDATION_MERGE_COLUMNS,
  expandRevalidationIngredient,
  getRevalidationRows,
  removeRevalidationGroup,
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

const QCRawMaterialRevalidationTable = ({
  values,
  onChange,
  batchId,
  readOnly = false,
}: QCRawMaterialRevalidationTableProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const rows = useMemo(() => getRevalidationRows(values), [values]);
  const [ingredientOptions, setIngredientOptions] = useState<Option[]>([]);
  const [lotOptions, setLotOptions] = useState<Option[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedIngredients = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => row._rowRole === "expanded")
          .map((row) => String(row.INGREDIENT ?? "").trim())
          .filter(Boolean),
      ),
    [rows],
  );

  const pickerRow = useMemo(
    () => [...rows].reverse().find((row) => row._rowRole === "picker") ?? null,
    [rows],
  );

  const hasExpandedRows = useMemo(
    () => rows.some((row) => row._rowRole === "expanded"),
    [rows],
  );

  const mergeSpans = useMemo(
    () =>
      computeExpandedGroupCellSpans(
        rows as Record<string, unknown>[],
        [...QC_REVALIDATION_MERGE_COLUMNS],
      ),
    [rows],
  );

  useEffect(() => {
    let active = true;
    setLoadingIngredients(true);
    void operationsController
      .fetchMaterialsList({ materialType: "BOTH" })
      .then((response: any) => {
        if (!active) return;
        const list = Array.isArray(response?.data)
          ? response.data
          : normalizeMaterialsListResponse(response?.data);
        setIngredientOptions(
          (list as Array<{ materialCode?: string; materialName?: string }>).map((item) => ({
            value: String(item.materialCode ?? "").trim(),
            label: String(item.materialName || item.materialCode || "").trim(),
          })).filter((option) => option.value),
        );
      })
      .catch(() => {
        if (active) setIngredientOptions([]);
      })
      .finally(() => {
        if (active) setLoadingIngredients(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const handleAddIngredient = useCallback(async () => {
    if (!pickerRow) return;
    const ingredient = String(pickerRow.INGREDIENT ?? "").trim();
    if (!ingredient) {
      setError("Select an ingredient before adding.");
      return;
    }
    if (usedIngredients.has(ingredient)) {
      setError("This ingredient is already added.");
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const response = await operationsController.fetchMaterialSpecificationList({
        materialCode: ingredient,
        gradeCode: null,
      });
      const model =
        response?.data instanceof MaterialSpecificationListModel
          ? response.data
          : MaterialSpecificationListModel.fromApi(response?.data ?? response);
      const specs = (model.specifications ?? []).map((spec) => ({
        specificationName: spec.specificationName,
        specificationCode: spec.specificationCode,
        specsLabel: spec.formattedReferenceRange,
      }));
      if (!specs.length) {
        setError("No specifications found for the selected ingredient.");
        return;
      }
      const next = expandRevalidationIngredient(rows, specs);
      if (next) commitRows(next);
    } catch {
      setError("Failed to load ingredient specifications.");
    } finally {
      setAdding(false);
    }
  }, [commitRows, pickerRow, rows, usedIngredients]);

  const availableIngredientOptions = useMemo(
    () =>
      ingredientOptions.map((option) => ({
        ...option,
        disabled: usedIngredients.has(option.value) && option.value !== String(pickerRow?.INGREDIENT ?? ""),
      })),
    [ingredientOptions, pickerRow?.INGREDIENT, usedIngredients],
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
          ...cellSx,
          verticalAlign: "middle" as const,
          borderRight: `1px solid ${alpha("#1B4F72", 0.12)}`,
          background: alpha(BRAND.primaryLight, 0.04),
        }
      : cellSx;

  return (
    <Box>
      <TableContainer
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          background: "#fff",
          overflowX: "auto",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {QC_REVALIDATION_COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    ...cellSx,
                    fontWeight: 800,
                    color: BRAND.primary,
                    background: alpha(BRAND.primaryLight, 0.08),
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {!readOnly ? (
                <TableCell
                  sx={{
                    ...cellSx,
                    fontWeight: 800,
                    color: BRAND.primary,
                    background: alpha(BRAND.primaryLight, 0.08),
                    width: 48,
                  }}
                />
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const isPicker = row._rowRole === "picker";
              const isExpanded = row._rowRole === "expanded";
              const groupId = String(row._groupId ?? "");
              const showGroupDelete =
                !readOnly &&
                isExpanded &&
                rows.findIndex((entry) => String(entry._groupId ?? "") === groupId) === index;
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
              <Fragment key={`${row._groupId ?? "picker"}-${index}`}>
                <TableRow
                  sx={{
                    background: isPicker ? alpha(BRAND.primaryLight, 0.03) : undefined,
                  }}
                >
                  {srSpan?.isContinuation ? null : (
                    <TableCell
                      sx={mergedCellSx(srSpan?.rowSpan ?? 1)}
                      rowSpan={srSpan?.rowSpan && srSpan.rowSpan > 1 ? srSpan.rowSpan : undefined}
                    >
                      {row.SR_NO}
                    </TableCell>
                  )}
                  {ingredientSpan?.isContinuation ? null : (
                    <TableCell
                      sx={{ ...mergedCellSx(ingredientSpan?.rowSpan ?? 1), minWidth: 180 }}
                      rowSpan={
                        ingredientSpan?.rowSpan && ingredientSpan.rowSpan > 1
                          ? ingredientSpan.rowSpan
                          : undefined
                      }
                    >
                      {isPicker
                        ? renderSelect(
                            String(row.INGREDIENT ?? ""),
                            availableIngredientOptions,
                            (next) => updateRow(index, { INGREDIENT: next, LOT_BATCH_NUMBER: "" }),
                            "Select ingredient",
                            false,
                            loadingIngredients,
                          )
                        : (
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.text }}>
                            {String(row.INGREDIENT ?? "—")}
                          </Typography>
                        )}
                    </TableCell>
                  )}
                  {lotSpan?.isContinuation ? null : (
                    <TableCell
                      sx={{ ...mergedCellSx(lotSpan?.rowSpan ?? 1), minWidth: 170 }}
                      rowSpan={lotSpan?.rowSpan && lotSpan.rowSpan > 1 ? lotSpan.rowSpan : undefined}
                    >
                      {isPicker || isExpanded
                        ? renderSelect(
                            String(row.LOT_BATCH_NUMBER ?? ""),
                            lotOptions.filter(
                              (option) =>
                                !option.materialCode ||
                                option.materialCode === String(row.INGREDIENT ?? "").trim(),
                            ),
                            (next) => {
                              if (isPicker) {
                                updateRow(index, { LOT_BATCH_NUMBER: next });
                                return;
                              }
                              commitRows(
                                rows.map((entry) =>
                                  String(entry._groupId ?? "") === groupId
                                    ? { ...entry, LOT_BATCH_NUMBER: next }
                                    : entry,
                                ),
                              );
                            },
                            "Select lot / batch",
                            readOnly || !String(row.INGREDIENT ?? "").trim(),
                            loadingLots,
                          )
                        : String(row.LOT_BATCH_NUMBER ?? "—")}
                    </TableCell>
                  )}
                  <TableCell sx={{ ...cellSx, minWidth: 180 }}>
                    {isPicker ? (
                      <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontStyle: "italic" }}>
                        Auto-filled on add
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>
                        {String(row.PARAMETER ?? "—")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, minWidth: 120 }}>
                    {isPicker ? (
                      <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontStyle: "italic" }}>
                        —
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                        {String(row.SPECIFICATION ?? "—")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, minWidth: 120 }}>
                    {isExpanded
                      ? renderText(
                          String(row.RESULT ?? ""),
                          (next) => updateRow(index, { RESULT: next }),
                          "Analysed Result",
                        )
                      : null}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, minWidth: 120 }}>
                    {isExpanded
                      ? renderText(
                          String(row.ACEM_QC_RESULT ?? ""),
                          (next) => updateRow(index, { ACEM_QC_RESULT: next }),
                          "ACEM QC Result",
                        )
                      : null}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, minWidth: 150 }}>
                    {isExpanded ? (
                      <DateField
                        value={String(row.VALIDITY ?? "")}
                        onChange={(next) => updateRow(index, { VALIDITY: next })}
                        disabled={readOnly}
                        placeholder="Validity"
                      />
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, minWidth: 150 }}>
                    {isExpanded
                      ? renderText(
                          String(row.REMARKS ?? ""),
                          (next) => updateRow(index, { REMARKS: next }),
                          "Remarks",
                          false,
                          true,
                        )
                      : null}
                  </TableCell>
                  {!readOnly ? (
                    <TableCell sx={cellSx}>
                      {showGroupDelete ? (
                        <IconButton
                          size="small"
                          onClick={() => commitRows(removeRevalidationGroup(rows, groupId))}
                          sx={{ color: BRAND.danger }}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
                {isLastInGroup ? (
                  <TableRow sx={{ background: alpha(BRAND.primaryLight, 0.03) }}>
                    <TableCell
                      colSpan={QC_REVALIDATION_COLUMNS.length + (readOnly ? 0 : 1)}
                      sx={{ ...cellSx, py: 1 }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        gap={1.25}
                      >
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.text }}>
                          Upload QC Certificate
                          {String(row.LOT_BATCH_NUMBER ?? "").trim()
                            ? ` · ${String(row.LOT_BATCH_NUMBER).trim()}`
                            : ""}
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
                            disabled={readOnly}
                            compact
                            accept={FILE_PICKER_ACCEPT.IMAGE_PDF}
                            emptyLabel="Upload"
                            multiple={false}
                          />
                        </Box>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {!readOnly ? (
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mt={1.25}>
          {error ? (
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.danger }}>{error}</Typography>
          ) : (
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
              {hasExpandedRows
                ? "Use Add Row to append another ingredient and its specification rows."
                : "Select an ingredient, then add it to load specification rows."}
            </Typography>
          )}
          <Button
            size="small"
            variant="contained"
            disabled={adding || !String(pickerRow?.INGREDIENT ?? "").trim()}
            onClick={() => void handleAddIngredient()}
            startIcon={adding ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
          >
            {adding ? "Adding…" : hasExpandedRows ? "Add Row" : "Add Ingredient"}
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
};

export default QCRawMaterialRevalidationTable;
