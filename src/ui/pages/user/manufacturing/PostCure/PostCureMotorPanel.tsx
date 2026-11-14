import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";
import postCureController from "../../../../../controllers/user/manufacturing/postCureController";
import { operationsController } from "../../../../../controllers/user/operationsController";
import type { MaterialsListItem } from "../../../../../data/models/user/MaterialsListModel";
import {
  buildPostCureIngredientRowsFromApi,
  POST_CURE_RECIPE_TYPES,
} from "../../../../../data/models/user/postCureIngredientRecipes";
import {
  postCureIngredientRowsHaveUserInput,
  postCureMotorDataHasUserInput,
  type PostCureMotorData,
} from "../../../../../data/models/user/PostCureMotorDataModel";
import { useCasePrepLinerMaterials } from "../../../../../hooks/user/manufacturing/useCasePrepLinerMaterials";
import { postCureTableInputSx } from "./postCureFormPrimitivesShared";

import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import { DateTimeField } from "../../../../components/common/DateField";
import PostCureFileField from "./PostCureFileField";
import QCDivisionFileField from "../../qualityControl/QCDivision/QCDivisionFileField";
import {
  FieldGrid,
  SectionCard,
  TableSelectInput,
  TableTextInput,
  postCureTableCellSx,
  postCureTableContainerSx,
  postCureTableHeaderCellSx,
  postCureTableRowSx,
} from "./PostCureFormPrimitives";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import { WorkflowReadOnlyText } from "@/ui/components/common/WorkflowReadOnlyText";
import { isStartAfterEnd } from "../../../../../data/validation/dateRangeValidation";

const str = (value: unknown): string => String(value ?? "");

const postCureTableHeaderLabelSx = postCureTableHeaderCellSx(false);

const formatLocation = (location?: string) => {
  if (!location) return "";
  const upper = String(location).toUpperCase();
  if (upper === "HE_SIDE") return "HE Side";
  if (upper === "NE_SIDE") return "NE Side";
  return upper.replace(/_/g, " ");
};

// ==========================================
// 1. LOCATION DATE TABLE
// ==========================================
export const LocationDateTable = ({
  basePath,
  value = [],
  onChange,
  validationErrors = {},
  clearFieldError,
  disabled,
  readOnly = false,
  qaRemarksMode = false,
}: {
  basePath: string;
  value?: any[];
  onChange: (updatedRows: any[]) => void;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** QC Division only: show QA Remarks column beside Observations. */
  qaRemarksMode?: boolean;
}) => {
  const rows = value || [];
  const headers = [
    "Location",
    "From Date & Time",
    "To Date & Time",
    "Observations",
    ...(qaRemarksMode ? ["QA Remarks"] : []),
  ];

  const handleFieldChange = (index: number, fieldName: string, val: any) => {
    const updated = [...rows];
    const updatedRow = { ...updated[index], [fieldName]: val };
    if (fieldName === "fromDate" && isStartAfterEnd(val, updatedRow.toDate)) {
      updatedRow.toDate = "";
      clearFieldError?.(`${basePath}.${index}.toDate`);
    }
    updated[index] = updatedRow;
    const errorKey = `${basePath}.${index}.${fieldName}`;
    clearFieldError?.(errorKey);
    onChange(updated);
  };

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk
                  label={label}
                  required={!readOnly && label !== "QA Remarks"}
                  sx={postCureTableHeaderLabelSx}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row: any, index: number) => {
              const locationVal = row.location ?? row.LOCATION;
              const fromDateErrKey = `${basePath}.${index}.fromDate`;
              const toDateErrKey = `${basePath}.${index}.toDate`;
              const obsErrKey = `${basePath}.${index}.observations`;
              const qaErrKey = `${basePath}.${index}.qaRemarks`;

              return (
                <TableRow key={`loc-date-${locationVal || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {formatLocation(locationVal)}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.fromDate} />
                    ) : (
                      <Box data-qc-field={fromDateErrKey}>
                        <DateTimeField
                          value={row.fromDate ?? ""}
                          onChange={(val: any) => handleFieldChange(index, "fromDate", val)}
                          error={Boolean(validationErrors[fromDateErrKey])}
                          helperText={validationErrors[fromDateErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          compact
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.toDate} />
                    ) : (
                      <Box data-qc-field={toDateErrKey}>
                        <DateTimeField
                          value={row.toDate ?? ""}
                          minDate={row.fromDate ?? ""}
                          requiresMinDateTime
                          onChange={(val: any) => handleFieldChange(index, "toDate", val)}
                          error={Boolean(validationErrors[toDateErrKey])}
                          helperText={validationErrors[toDateErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          compact
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.observations} />
                    ) : (
                      <TableTextInput
                        value={row.observations ?? ""}
                        onChange={(val: any) => handleFieldChange(index, "observations", val)}
                        error={Boolean(validationErrors[obsErrKey])}
                        helperText={validationErrors[obsErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        multiline
                        minRows={2}
                        fieldPath={obsErrKey}
                      />
                    )}
                  </TableCell>
                  {qaRemarksMode ? (
                    <TableCell sx={postCureTableCellSx}>
                      {readOnly ? (
                        <WorkflowReadOnlyText value={row.qaRemarks} />
                      ) : (
                        <TableTextInput
                          value={row.qaRemarks ?? ""}
                          onChange={(val: any) => handleFieldChange(index, "qaRemarks", val)}
                          error={Boolean(validationErrors[qaErrKey])}
                          helperText={validationErrors[qaErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          multiline
                          minRows={2}
                          fieldPath={qaErrKey}
                        />
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 2 }}>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  No data available.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ==========================================
// 2. LOCATION QTY / APPLIED TABLE
// ==========================================
export const LocationQtyTable = ({
  basePath,
  value = [],
  onChange,
  qtyLabel,
  qtyKey = "qtyFilled",
  validationErrors = {},
  clearFieldError,
  disabled = false,
  readOnly = false,
  qaRemarksMode = false,
}: {
  basePath: string;
  value?: any[];
  onChange: (updatedRows: any[]) => void;
  qtyLabel: string;
  qtyKey?: "qtyFilled" | "qtyApplied" | string;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** QC Division only: show QA Remarks column beside Observations. */
  qaRemarksMode?: boolean;
}) => {
  const rows = value || [];
  const headers = [
    "Location",
    "From Date & Time",
    "To Date & Time",
    qtyLabel,
    "Observations",
    ...(qaRemarksMode ? ["QA Remarks"] : []),
  ];

  const handleFieldChange = (index: number, fieldName: string, val: any) => {
    const updated = [...rows];
    const updatedRow = { ...updated[index], [fieldName]: val };
    if (fieldName === "fromDate" && isStartAfterEnd(val, updatedRow.toDate)) {
      updatedRow.toDate = "";
      clearFieldError?.(`${basePath}.${index}.toDate`);
    }
    updated[index] = updatedRow;

    const errorKey = `${basePath}.${index}.${fieldName}`;
    clearFieldError?.(errorKey);

    onChange(updated);
  };

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk
                  label={label}
                  required={idx >= 1 && !readOnly && label !== "QA Remarks"}
                  sx={postCureTableHeaderLabelSx}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row: any, index: number) => {
              const locationVal = row.location ?? row.LOCATION;
              const fromDateErrKey = `${basePath}.${index}.fromDate`;
              const toDateErrKey = `${basePath}.${index}.toDate`;
              const qtyErrKey = `${basePath}.${index}.${qtyKey}`;
              const obsErrKey = `${basePath}.${index}.observations`;
              const qaErrKey = `${basePath}.${index}.qaRemarks`;

              return (
                <TableRow key={`loc-qty-${locationVal || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {formatLocation(locationVal)}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.fromDate} />
                    ) : (
                      <Box data-qc-field={fromDateErrKey}>
                        <DateTimeField
                          value={row.fromDate ?? ""}
                          onChange={(val: any) => handleFieldChange(index, "fromDate", val)}
                          error={Boolean(validationErrors[fromDateErrKey])}
                          helperText={validationErrors[fromDateErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          compact
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.toDate} />
                    ) : (
                      <Box data-qc-field={toDateErrKey}>
                        <DateTimeField
                          value={row.toDate ?? ""}
                          minDate={row.fromDate ?? ""}
                          requiresMinDateTime
                          onChange={(val: any) => handleFieldChange(index, "toDate", val)}
                          error={Boolean(validationErrors[toDateErrKey])}
                          helperText={validationErrors[toDateErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          compact
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row[qtyKey]} />
                    ) : (
                      <TableTextInput
                        value={String(row[qtyKey] ?? "")}
                        onChange={(val: any) => handleFieldChange(index, qtyKey, val)}
                        error={Boolean(validationErrors[qtyErrKey])}
                        helperText={validationErrors[qtyErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        type="number"
                        fieldPath={qtyErrKey}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.observations} />
                    ) : (
                      <TableTextInput
                        value={row.observations ?? ""}
                        onChange={(val: any) => handleFieldChange(index, "observations", val)}
                        error={Boolean(validationErrors[obsErrKey])}
                        helperText={validationErrors[obsErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        multiline
                        minRows={2}
                        fieldPath={obsErrKey}
                      />
                    )}
                  </TableCell>
                  {qaRemarksMode ? (
                    <TableCell sx={postCureTableCellSx}>
                      {readOnly ? (
                        <WorkflowReadOnlyText value={row.qaRemarks} />
                      ) : (
                        <TableTextInput
                          value={row.qaRemarks ?? ""}
                          onChange={(val: any) => handleFieldChange(index, "qaRemarks", val)}
                          error={Boolean(validationErrors[qaErrKey])}
                          helperText={validationErrors[qaErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          multiline
                          minRows={2}
                          fieldPath={qaErrKey}
                        />
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 2 }}>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  No data available.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ==========================================
// 3. INGREDIENT QUANTITY TABLE
// ==========================================
type MfgLotCellProps = {
  row: { materialCode?: string | null; mfgLot?: string };
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;
  fieldPath?: string;
  onChange: (mfgLot: string) => void;
  fetchLotsForMaterialCode: (materialCode: string) => Promise<unknown>;
  getCachedLotOptions: (
    materialCode: string,
    currentLot?: string,
  ) => Array<{ value: string; label: string }>;
  getApiLotCount: (materialCode: string) => number;
  hasFetchedLots: (materialCode: string) => boolean;
  isLoadingLots: (materialCode: string) => boolean;
};

const MfgLotTextField = ({
  value,
  disabled,
  error,
  helperText,
  fieldPath,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fieldPath?: string;
  onChange: (mfgLot: string) => void;
}) => {
  const control = (
    <TextField
      size="small"
      fullWidth
      placeholder="Enter lot no"
      disabled={disabled}
      value={value}
      error={error}
      helperText={helperText}
      onChange={(e) => onChange(String(e.target.value))}
      inputProps={fieldPath ? { "data-qc-field": fieldPath } : undefined}
      sx={postCureTableInputSx}
    />
  );
  return fieldPath ? <Box data-qc-field={fieldPath}>{control}</Box> : control;
};

const MfgLotCell = ({
  row,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  fieldPath,
  onChange,
  fetchLotsForMaterialCode,
  getCachedLotOptions,
  getApiLotCount,
  hasFetchedLots,
  isLoadingLots,
}: MfgLotCellProps) => {
  const materialCode = str(row.materialCode).trim();
  const hasCode = Boolean(materialCode);
  const currentLot = str(row.mfgLot).trim();
  const [menuOpen, setMenuOpen] = useState(false);
  const loading = hasCode && isLoadingLots(materialCode);
  const fetched = hasCode && hasFetchedLots(materialCode);
  const apiLotCount = hasCode ? getApiLotCount(materialCode) : 0;

  useEffect(() => {
    if (!hasCode || fetched || loading) return;
    void fetchLotsForMaterialCode(materialCode);
  }, [fetched, fetchLotsForMaterialCode, hasCode, loading, materialCode]);

  if (readOnly) {
    return (
      <WorkflowReadOnlyText value={currentLot || "—"} muted sx={{ fontSize: "0.78rem", py: 0.5 }} />
    );
  }

  // No material code, or fetch finished with zero approved lots → text only (never both).
  if (!hasCode || (fetched && !loading && apiLotCount === 0)) {
    return (
      <MfgLotTextField
        value={currentLot}
        disabled={disabled}
        error={error}
        helperText={helperText}
        fieldPath={fieldPath}
        onChange={onChange}
      />
    );
  }

  const options = getCachedLotOptions(materialCode, currentLot);
  const selectValue =
    currentLot && options.some((opt) => opt.value === currentLot) ? currentLot : currentLot || "";

  const control = (
    <TextField
      select
      size="small"
      fullWidth
      disabled={disabled}
      value={selectValue}
      error={error}
      helperText={helperText}
      onChange={(e) => onChange(String(e.target.value))}
      sx={postCureTableInputSx}
      SelectProps={{
        displayEmpty: true,
        onOpen: () => {
          setMenuOpen(true);
          void fetchLotsForMaterialCode(materialCode);
        },
        onClose: () => setMenuOpen(false),
        renderValue: (selected) => {
          const v = String(selected ?? "").trim();
          if (!v) {
            return (
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                {loading ? "Loading lots…" : "Select lot"}
              </Typography>
            );
          }
          return v;
        },
      }}
    >
      <MenuItem value="">
        <em>Select lot</em>
      </MenuItem>
      {loading && menuOpen ? (
        <MenuItem disabled value="__loading__">
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={14} />
            Loading lots…
          </Stack>
        </MenuItem>
      ) : null}
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return fieldPath ? <Box data-qc-field={fieldPath}>{control}</Box> : control;
};

export const IngredientQuantityTable = ({
  basePath,
  value = [],
  onChange,
  qtyKey = "quantity",
  validationErrors = {},
  clearFieldError,
  disabled = false,
  readOnly = false,
  qaRemarksMode = false,
}: {
  basePath: string;
  value?: any[];
  onChange: (updatedRows: any[]) => void;
  qtyKey?: "quantity" | "qtyTaken" | string;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** QC Division only: show QA Remarks column. */
  qaRemarksMode?: boolean;
}) => {
  const rows = value || [];
  const headers = [
    "Sr No.",
    "Ingredient",
    "Mfg Lot",
    "Parts By Weight",
    qtyKey === "quantity" ? "Quantity (g)" : "Qty Taken (g)",
    ...(qaRemarksMode ? ["QA Remarks"] : []),
  ];

  const {
    fetchLotsForMaterialCode,
    getCachedLotOptions,
    getApiLotCount,
    hasFetchedLots,
    isLoadingLots,
  } = useCasePrepLinerMaterials();

  const handleQuantityChange = (currentIndex: number, newValue: string) => {
    const updatedRows = [...rows];
    updatedRows[currentIndex] = { ...updatedRows[currentIndex], [qtyKey]: newValue };

    const qtyErrKey = `${basePath}.${currentIndex}.${qtyKey}`;
    clearFieldError?.(qtyErrKey);
    const totalQty = updatedRows.reduce((acc: number, row: any) => {
      const srNo = String(row.srNo ?? row.SR_NO ?? "").toUpperCase();
      const isTotalRow = srNo === "TOTAL";
      const val = parseFloat(row[qtyKey] ?? row.quantity ?? row.qtyTaken ?? 0);
      return !isTotalRow && !isNaN(val) ? acc + val : acc;
    }, 0);

    const totalRowIndex = updatedRows.findIndex(
      (row: any) => String(row.srNo ?? row.SR_NO ?? "").toUpperCase() === "TOTAL",
    );
    if (totalRowIndex !== -1) {
      updatedRows[totalRowIndex] = {
        ...updatedRows[totalRowIndex],
        [qtyKey]: totalQty > 0 ? String(totalQty) : "",
      };
    }

    onChange(updatedRows);
  };

  const handleMfgLotChange = (currentIndex: number, newValue: string) => {
    const updatedRows = [...rows];
    updatedRows[currentIndex] = { ...updatedRows[currentIndex], mfgLot: newValue };

    const lotErrKey = `${basePath}.${currentIndex}.mfgLot`;
    clearFieldError?.(lotErrKey);

    onChange(updatedRows);
  };

  const handleQaRemarksChange = (currentIndex: number, newValue: string) => {
    const updatedRows = [...rows];
    updatedRows[currentIndex] = { ...updatedRows[currentIndex], qaRemarks: newValue };
    clearFieldError?.(`${basePath}.${currentIndex}.qaRemarks`);
    onChange(updatedRows);
  };

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: qaRemarksMode ? 900 : 720 }}>
        <TableHead>
          <TableRow>
            {headers.map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk
                  label={label}
                  required={!readOnly && label !== "QA Remarks"}
                  sx={postCureTableHeaderLabelSx}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row: any, index: number) => {
              const srNo = row.srNo ?? row.SR_NO;
              const ingredient = row.ingredient ?? row.INGREDIENT;
              const partsByWeight = row.partsByWeight ?? row.PARTS_BY_WEIGHT;
              const isTotal = String(srNo ?? "").toUpperCase() === "TOTAL";

              const mfgLotErrKey = `${basePath}.${index}.mfgLot`;
              const qtyErrKey = `${basePath}.${index}.${qtyKey}`;
              const qaErrKey = `${basePath}.${index}.qaRemarks`;

              return (
                <TableRow key={`ing-${srNo || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>{srNo}</TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: isTotal ? 700 : 500 }}>
                    {ingredient}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isTotal ? (
                      <WorkflowReadOnlyText value={row.mfgLot} muted />
                    ) : (
                      <MfgLotCell
                        row={row}
                        disabled={disabled}
                        readOnly={readOnly}
                        error={Boolean(validationErrors[mfgLotErrKey])}
                        helperText={validationErrors[mfgLotErrKey]}
                        fieldPath={mfgLotErrKey}
                        onChange={(mfgLot) => handleMfgLotChange(index, mfgLot)}
                        fetchLotsForMaterialCode={fetchLotsForMaterialCode}
                        getCachedLotOptions={getCachedLotOptions}
                        getApiLotCount={getApiLotCount}
                        hasFetchedLots={hasFetchedLots}
                        isLoadingLots={isLoadingLots}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>
                    {partsByWeight}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row[qtyKey]} />
                    ) : (
                      <TableTextInput
                        value={String(row[qtyKey] ?? "")}
                        onChange={(next: any) => handleQuantityChange(index, next)}
                        error={Boolean(validationErrors[qtyErrKey])}
                        helperText={validationErrors[qtyErrKey]}
                        disabled={disabled || isTotal}
                        readOnly={readOnly}
                        type="number"
                        fieldPath={qtyErrKey}
                      />
                    )}
                  </TableCell>
                  {qaRemarksMode ? (
                    <TableCell sx={postCureTableCellSx}>
                      {isTotal ? (
                        <WorkflowReadOnlyText value="" muted />
                      ) : readOnly ? (
                        <WorkflowReadOnlyText value={row.qaRemarks} />
                      ) : (
                        <TableTextInput
                          value={String(row.qaRemarks ?? "")}
                          onChange={(next: any) => handleQaRemarksChange(index, next)}
                          error={Boolean(validationErrors[qaErrKey])}
                          helperText={validationErrors[qaErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          multiline
                          minRows={2}
                          fieldPath={qaErrKey}
                        />
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 2 }}>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  No data available.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/** Others-only flexible mix table (IR1/Hemcoat keep IngredientQuantityTable unchanged). */
export const FlexibleOthersIngredientTable = ({
  basePath,
  value = [],
  onChange,
  qtyKey = "qtyTaken",
  validationErrors = {},
  clearFieldError,
  disabled = false,
  readOnly = false,
  qaRemarksMode = false,
}: {
  basePath: string;
  value?: any[];
  onChange: (updatedRows: any[]) => void;
  qtyKey?: "quantity" | "qtyTaken" | string;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  qaRemarksMode?: boolean;
}) => {
  const rows = value || [];
  const [materials, setMaterials] = useState<MaterialsListItem[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const {
    fetchLotsForMaterialCode,
    getCachedLotOptions,
    getApiLotCount,
    hasFetchedLots,
    isLoadingLots,
  } = useCasePrepLinerMaterials();

  useEffect(() => {
    let active = true;
    setMaterialsLoading(true);
    void operationsController
      .fetchAllMaterialsList()
      .then((res) => {
        if (!active) return;
        if (res.success && Array.isArray(res.data)) {
          setMaterials(res.data);
        } else {
          setMaterials([]);
        }
      })
      .catch(() => {
        if (active) setMaterials([]);
      })
      .finally(() => {
        if (active) setMaterialsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const renumberRows = (next: any[]) => {
    let n = 1;
    return next.map((row) => {
      if (String(row?.srNo ?? "").toUpperCase() === "TOTAL") {
        return { ...row, srNo: "TOTAL", ingredient: "Total Quantity" };
      }
      return { ...row, srNo: n++ };
    });
  };

  const recomputeTotal = (next: any[]) => {
    const totalQty = next.reduce((acc: number, row: any) => {
      if (String(row?.srNo ?? "").toUpperCase() === "TOTAL") return acc;
      const val = parseFloat(row[qtyKey] ?? row.quantity ?? row.qtyTaken ?? 0);
      return !isNaN(val) ? acc + val : acc;
    }, 0);
    const totalIdx = next.findIndex(
      (row: any) => String(row?.srNo ?? "").toUpperCase() === "TOTAL",
    );
    if (totalIdx === -1) {
      return [
        ...next,
        {
          srNo: "TOTAL",
          ingredient: "Total Quantity",
          materialId: null,
          materialCode: null,
          mfgLot: "",
          partsByWeight: "",
          [qtyKey]: totalQty > 0 ? String(totalQty) : "",
        },
      ];
    }
    const copy = [...next];
    copy[totalIdx] = {
      ...copy[totalIdx],
      [qtyKey]: totalQty > 0 ? String(totalQty) : "",
    };
    return copy;
  };

  const commitRows = (next: any[]) => onChange(renumberRows(recomputeTotal(next)));

  const handleFieldChange = (index: number, field: string, newValue: unknown) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: newValue };
    clearFieldError?.(`${basePath}.${index}.${field}`);
    commitRows(updated);
  };

  const handleIngredientInput = (
    index: number,
    typed: string,
    selected?: MaterialsListItem | null,
  ) => {
    const updated = [...rows];
    if (selected) {
      updated[index] = {
        ...updated[index],
        ingredient: selected.materialName || selected.materialCode,
        materialId: selected.materialId,
        materialCode: selected.materialCode,
      };
    } else {
      updated[index] = {
        ...updated[index],
        ingredient: typed,
        materialId: null,
        materialCode: null,
      };
    }
    clearFieldError?.(`${basePath}.${index}.ingredient`);
    commitRows(updated);
  };

  const handleAddRow = () => {
    const withoutTotal = rows.filter((row) => String(row?.srNo ?? "").toUpperCase() !== "TOTAL");
    commitRows([
      ...withoutTotal,
      {
        srNo: withoutTotal.length + 1,
        ingredient: "",
        materialId: null,
        materialCode: null,
        mfgLot: "",
        partsByWeight: "",
        [qtyKey]: "",
      },
      rows.find((row) => String(row?.srNo ?? "").toUpperCase() === "TOTAL") ?? {
        srNo: "TOTAL",
        ingredient: "Total Quantity",
        materialId: null,
        materialCode: null,
        mfgLot: "",
        partsByWeight: "",
        [qtyKey]: "",
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    const row = rows[index];
    if (!row || String(row.srNo ?? "").toUpperCase() === "TOTAL") return;
    const next = rows.filter((_, i) => i !== index);
    commitRows(
      next.length
        ? next
        : [
            {
              srNo: 1,
              ingredient: "",
              materialId: null,
              materialCode: null,
              mfgLot: "",
              partsByWeight: "",
              [qtyKey]: "",
            },
            {
              srNo: "TOTAL",
              ingredient: "Total Quantity",
              materialId: null,
              materialCode: null,
              mfgLot: "",
              partsByWeight: "",
              [qtyKey]: "",
            },
          ],
    );
  };

  const flexibleHeaders = [
    "Sr No.",
    "Ingredient",
    "Mfg Lot",
    "Parts By Weight",
    qtyKey === "quantity" ? "Quantity (g)" : "Qty Taken (g)",
    ...(qaRemarksMode ? ["QA Remarks"] : []),
    "",
  ];

  return (
    <Box>
      <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: qaRemarksMode ? 960 : 780 }}>
          <TableHead>
            <TableRow>
              {flexibleHeaders.map((label, idx) => (
                <TableCell key={`${label}-${idx}`} sx={postCureTableHeaderCellSx(idx === 0)}>
                  {label ? (
                    <FieldLabelWithAsterisk
                      label={label}
                      required={!readOnly && label !== "" && label !== "QA Remarks"}
                      sx={postCureTableHeaderLabelSx}
                    />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row: any, index: number) => {
                const srNo = row.srNo ?? row.SR_NO;
                const isTotal = String(srNo ?? "").toUpperCase() === "TOTAL";
                const ingredientErr = `${basePath}.${index}.ingredient`;
                const partsErr = `${basePath}.${index}.partsByWeight`;
                const mfgLotErr = `${basePath}.${index}.mfgLot`;
                const qtyErr = `${basePath}.${index}.${qtyKey}`;
                const qaErr = `${basePath}.${index}.qaRemarks`;
                const selectedMaterial =
                  materials.find(
                    (m) =>
                      m.materialCode === String(row.materialCode ?? "").trim() ||
                      m.materialId === Number(row.materialId),
                  ) ?? null;

                return (
                  <TableRow key={`others-ing-${srNo || index}`} sx={postCureTableRowSx(index)}>
                    <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>{srNo}</TableCell>
                    <TableCell sx={postCureTableCellSx}>
                      {isTotal || readOnly ? (
                        <Typography sx={{ fontWeight: isTotal ? 700 : 500, fontSize: "0.78rem" }}>
                          {row.ingredient ?? row.INGREDIENT}
                        </Typography>
                      ) : (
                        <Autocomplete
                          freeSolo
                          options={materials}
                          loading={materialsLoading}
                          value={selectedMaterial}
                          inputValue={String(row.ingredient ?? "")}
                          getOptionLabel={(opt) =>
                            typeof opt === "string"
                              ? opt
                              : `${opt.materialName} (${opt.materialCode})`
                          }
                          filterOptions={(options, state) => {
                            const q = String(state.inputValue ?? "")
                              .trim()
                              .toLowerCase();
                            if (!q) return options.slice(0, 50);
                            return options
                              .filter(
                                (opt) =>
                                  opt.materialName.toLowerCase().includes(q) ||
                                  opt.materialCode.toLowerCase().includes(q),
                              )
                              .slice(0, 50);
                          }}
                          onInputChange={(_, next, reason) => {
                            if (reason === "reset") return;
                            handleIngredientInput(index, next, null);
                          }}
                          onChange={(_, next) => {
                            if (typeof next === "string") {
                              handleIngredientInput(index, next, null);
                            } else {
                              handleIngredientInput(index, next?.materialName ?? "", next);
                            }
                          }}
                          disabled={disabled}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Search or type ingredient"
                              error={Boolean(validationErrors[ingredientErr])}
                              helperText={validationErrors[ingredientErr]}
                              sx={postCureTableInputSx}
                              inputProps={{
                                ...params.inputProps,
                                "data-qc-field": ingredientErr,
                              }}
                            />
                          )}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={postCureTableCellSx}>
                      {isTotal ? (
                        <WorkflowReadOnlyText value={row.mfgLot} muted />
                      ) : (
                        <MfgLotCell
                          row={row}
                          disabled={disabled}
                          readOnly={readOnly}
                          error={Boolean(validationErrors[mfgLotErr])}
                          helperText={validationErrors[mfgLotErr]}
                          fieldPath={mfgLotErr}
                          onChange={(mfgLot) => handleFieldChange(index, "mfgLot", mfgLot)}
                          fetchLotsForMaterialCode={fetchLotsForMaterialCode}
                          getCachedLotOptions={getCachedLotOptions}
                          getApiLotCount={getApiLotCount}
                          hasFetchedLots={hasFetchedLots}
                          isLoadingLots={isLoadingLots}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={postCureTableCellSx}>
                      {isTotal || readOnly ? (
                        <WorkflowReadOnlyText value={row.partsByWeight} />
                      ) : (
                        <TableTextInput
                          value={String(row.partsByWeight ?? "")}
                          onChange={(next: any) => handleFieldChange(index, "partsByWeight", next)}
                          error={Boolean(validationErrors[partsErr])}
                          helperText={validationErrors[partsErr]}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={partsErr}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={postCureTableCellSx}>
                      {readOnly ? (
                        <WorkflowReadOnlyText value={row[qtyKey]} />
                      ) : (
                        <TableTextInput
                          value={String(row[qtyKey] ?? "")}
                          onChange={(next: any) => handleFieldChange(index, qtyKey, next)}
                          error={Boolean(validationErrors[qtyErr])}
                          helperText={validationErrors[qtyErr]}
                          disabled={disabled || isTotal}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={qtyErr}
                        />
                      )}
                    </TableCell>
                    {qaRemarksMode ? (
                      <TableCell sx={postCureTableCellSx}>
                        {isTotal ? (
                          <WorkflowReadOnlyText value="" muted />
                        ) : readOnly ? (
                          <WorkflowReadOnlyText value={row.qaRemarks} />
                        ) : (
                          <TableTextInput
                            value={String(row.qaRemarks ?? "")}
                            onChange={(next: any) => handleFieldChange(index, "qaRemarks", next)}
                            error={Boolean(validationErrors[qaErr])}
                            helperText={validationErrors[qaErr]}
                            disabled={disabled}
                            readOnly={readOnly}
                            multiline
                            minRows={2}
                            fieldPath={qaErr}
                          />
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell sx={postCureTableCellSx}>
                      {!readOnly && !isTotal ? (
                        <IconButton
                          size="small"
                          aria-label="Remove ingredient row"
                          disabled={disabled}
                          onClick={() => handleDeleteRow(index)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                    No ingredients yet. Add a row to begin.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!readOnly ? (
        <Button
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={handleAddRow}
          disabled={disabled}
          sx={{ mt: 1, textTransform: "none" }}
        >
          Add Row
        </Button>
      ) : null}
    </Box>
  );
};

// ==========================================
// 4. QUALIFICATION SECTION
// ==========================================
export const QualificationSection = ({
  basePath,
  value,
  onChange,
  validationErrors = {},
  clearFieldError,
  disabled = false,
  readOnly = false,
  useQcDivisionFileField = false,
  /** Others: allow editing specification (IR1/Hemcoat keep fixed recipe specs). */
  editableSpecification = false,
  qaRemarksMode = false,
}: {
  basePath: string;
  value?: any;
  onChange: (updatedSection: any) => void;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  useQcDivisionFileField?: boolean;
  editableSpecification?: boolean;
  qaRemarksMode?: boolean;
}) => {
  const tableValues = value?.qualificationTable || [];
  const qualHeaders = [
    "Parameter",
    "Specification",
    "Result",
    ...(qaRemarksMode ? ["QA Remarks"] : []),
  ];

  const handleSectionFieldChange = (fieldName: string, val: any) => {
    const updated = { ...(value || {}), [fieldName]: val };
    const errKey = `${basePath}.${fieldName}`;
    clearFieldError?.(errKey); // Clears only this specific section field
    onChange(updated);
  };

  const handleTableResultChange = (index: number, resultVal: any) => {
    const updatedTable = [...tableValues];
    updatedTable[index] = { ...updatedTable[index], result: resultVal };

    const errKey = `${basePath}.qualificationTable.${index}.result`;
    clearFieldError?.(errKey); // Clears only this specific qualification table row result

    onChange({ ...(value || {}), qualificationTable: updatedTable });
  };

  const handleTableSpecificationChange = (index: number, specificationVal: any) => {
    const updatedTable = [...tableValues];
    updatedTable[index] = { ...updatedTable[index], specification: specificationVal };
    const errKey = `${basePath}.qualificationTable.${index}.specification`;
    clearFieldError?.(errKey);
    onChange({ ...(value || {}), qualificationTable: updatedTable });
  };

  const handleTableQaRemarksChange = (index: number, qaRemarksVal: any) => {
    const updatedTable = [...tableValues];
    updatedTable[index] = { ...updatedTable[index], qaRemarks: qaRemarksVal };
    const errKey = `${basePath}.qualificationTable.${index}.qaRemarks`;
    clearFieldError?.(errKey);
    onChange({ ...(value || {}), qualificationTable: updatedTable });
  };

  const handleQcReportChange = (files: FileRef[]) => {
    const errKey = `${basePath}.qualificationQcReport`;
    clearFieldError?.(errKey); // Clears only the QC report error
    onChange({ ...(value || {}), qualificationQcReport: files });
  };

  const batchNoErrKey = `${basePath}.qualificationBatchNo`;
  const prepDateErrKey = `${basePath}.qualificationPreparationDate`;
  const qcReportErrKey = `${basePath}.qualificationQcReport`;

  return (
    <>
      <FieldGrid columns={2}>
        <Box>
          <FieldLabelWithAsterisk label="Batch No" required />
          <TableTextInput
            value={value?.qualificationBatchNo ?? ""}
            onChange={(e: any) => handleSectionFieldChange("qualificationBatchNo", e)}
            error={Boolean(validationErrors[batchNoErrKey])}
            helperText={validationErrors[batchNoErrKey]}
            disabled={disabled}
            readOnly={readOnly}
            fieldPath={batchNoErrKey}
          />
        </Box>
        <Box>
          <FieldLabelWithAsterisk label="Date & Time of Preparation" required />
          <Box data-qc-field={prepDateErrKey}>
            <DateTimeField
              value={value?.qualificationPreparationDate ?? ""}
              onChange={(val: any) => handleSectionFieldChange("qualificationPreparationDate", val)}
              error={Boolean(validationErrors[prepDateErrKey])}
              helperText={validationErrors[prepDateErrKey]}
              disabled={disabled}
              readOnly={readOnly}
              compact
            />
          </Box>
        </Box>
      </FieldGrid>

      <TableContainer sx={postCureTableContainerSx}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {qualHeaders.map((label, idx) => (
                <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                  <FieldLabelWithAsterisk
                    label={label}
                    required={!readOnly && label !== "QA Remarks"}
                    sx={postCureTableHeaderLabelSx}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableValues.map((row: any, index: number) => {
              const parameter = row.parameter ?? row.PARAMETER;
              const specification = row.specification ?? row.SPECIFICATION;
              const resultErrKey = `${basePath}.qualificationTable.${index}.result`;
              const specificationErrKey = `${basePath}.qualificationTable.${index}.specification`;
              const qaErrKey = `${basePath}.qualificationTable.${index}.qaRemarks`;
              const canEditSpec = editableSpecification && !readOnly;

              // Helper to format the specification object into a single display string
              const formatSpecification = (spec: any) => {
                if (!spec) return "-";
                if (typeof spec === "string") return spec; // Fallback if string

                const { min, max, unit } = spec;
                let label = "";

                if (min !== null && min !== undefined && max !== null && max !== undefined) {
                  label = `${min} - ${max}`;
                } else if (min !== null && min !== undefined) {
                  label = `>= ${min}`;
                } else if (max !== null && max !== undefined) {
                  label = `<= ${max}`;
                }

                return `${label}${unit ? ` ${unit}` : ""}`.trim() || "-";
              };

              return (
                <TableRow key={`qual-${index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {parameter}
                  </TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>
                    {canEditSpec ? (
                      <TableTextInput
                        value={formatSpecification(specification)}
                        onChange={(e: any) => handleTableSpecificationChange(index, e)}
                        error={Boolean(validationErrors[specificationErrKey])}
                        helperText={validationErrors[specificationErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        fieldPath={specificationErrKey}
                      />
                    ) : (
                      formatSpecification(specification)
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <WorkflowReadOnlyText value={row.result} />
                    ) : (
                      <TableTextInput
                        value={row.result ?? ""}
                        onChange={(e: any) => handleTableResultChange(index, e)}
                        error={Boolean(validationErrors[resultErrKey])}
                        helperText={validationErrors[resultErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        fieldPath={resultErrKey}
                      />
                    )}
                  </TableCell>
                  {qaRemarksMode ? (
                    <TableCell sx={postCureTableCellSx}>
                      {readOnly ? (
                        <WorkflowReadOnlyText value={row.qaRemarks} />
                      ) : (
                        <TableTextInput
                          value={row.qaRemarks ?? ""}
                          onChange={(e: any) => handleTableQaRemarksChange(index, e)}
                          error={Boolean(validationErrors[qaErrKey])}
                          helperText={validationErrors[qaErrKey]}
                          disabled={disabled}
                          readOnly={readOnly}
                          multiline
                          minRows={2}
                          fieldPath={qaErrKey}
                        />
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1.5 }}>
        <FieldLabelWithAsterisk label="QC Report" required />
        <Box sx={{ mt: 1 }} data-qc-field={qcReportErrKey}>
          {useQcDivisionFileField ? (
            <QCDivisionFileField
              files={value?.qualificationQcReport || []}
              onChange={handleQcReportChange}
              multiple
              disabled={disabled}
              readOnly={readOnly}
            />
          ) : (
            <PostCureFileField
              files={value?.qualificationQcReport || []}
              onChange={handleQcReportChange}
              multiple
              acceptMode="imageVideoPdf"
              disabled={disabled}
              readOnly={readOnly}
              required
            />
          )}
          {validationErrors[qcReportErrKey] && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
              {validationErrors[qcReportErrKey]}
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

// ==========================================
// 5. SHARED INHIBITION SECTIONS
// ==========================================
export const InhibitionSharedSections = ({
  disabled = false,
  readOnly = false,
  stationOptions = [],
  theme,
  value,
  onChange,
  validationErrors = {},
  clearFieldError,
  qaRemarksMode = false,
}: {
  disabled?: boolean;
  readOnly?: boolean;
  stationOptions: Array<{ value: string; label: string }>;
  theme?: any;
  value?: any;
  onChange: (updated: any) => void;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  qaRemarksMode?: boolean;
}) => {
  const handleAppTableChange = (tableRows: any[]) => {
    const updated = {
      ...(value || {}),
      inhibitionApplicationDetails: {
        ...(value?.inhibitionApplicationDetails || {}),
        inhibitionApplicationTable: tableRows,
      },
    };
    onChange(updated);
  };

  const handleBatchDetailsChange = (field: string, val: any) => {
    const updated = {
      ...(value || {}),
      inhibitionBatchDetails: {
        ...(value?.inhibitionBatchDetails || {}),
        [field]: val,
      },
    };
    clearFieldError?.(`inhibitionBatchDetails.${field}`);
    onChange(updated);
  };

  const handleDispatchChange = (field: string, val: any) => {
    const updated = {
      ...(value || {}),
      dispatchDetails: {
        ...(value?.dispatchDetails || {}),
        [field]: val,
      },
    };
    clearFieldError?.(`dispatchDetails.${field}`);
    onChange(updated);
  };

  return (
    <>
      <SectionCard title="Inhibitor Batch Information" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabelWithAsterisk label="Batch No" required />
            <TableTextInput
              value={value?.inhibitionBatchDetails?.inhibitorBatchNo ?? ""}
              onChange={(e: any) => handleBatchDetailsChange("inhibitorBatchNo", e)}
              error={Boolean(validationErrors["inhibitionBatchDetails.inhibitorBatchNo"])}
              helperText={validationErrors["inhibitionBatchDetails.inhibitorBatchNo"]}
              disabled={disabled}
              readOnly={readOnly}
              fieldPath={"inhibitionBatchDetails.inhibitorBatchNo"}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Batch Size (g)" required />
            <TableTextInput
              value={value?.inhibitionBatchDetails?.inhibitorBatchSize ?? ""}
              onChange={(e: any) => handleBatchDetailsChange("inhibitorBatchSize", e)}
              error={Boolean(validationErrors["inhibitionBatchDetails.inhibitorBatchSize"])}
              helperText={validationErrors["inhibitionBatchDetails.inhibitorBatchSize"]}
              disabled={disabled}
              readOnly={readOnly}
              type="number"
              fieldPath={"inhibitionBatchDetails.inhibitorBatchSize"}
            />
          </Box>
        </FieldGrid>
        {qaRemarksMode ? (
          <Box sx={{ mt: 1.5 }} data-qc-field="inhibitionBatchDetails.qaRemarks">
            <FieldLabelWithAsterisk label="QA Remarks" />
            {readOnly ? (
              <WorkflowReadOnlyText value={value?.inhibitionBatchDetails?.qaRemarks} />
            ) : (
              <TableTextInput
                value={value?.inhibitionBatchDetails?.qaRemarks ?? ""}
                onChange={(e: any) => handleBatchDetailsChange("qaRemarks", e)}
                error={Boolean(validationErrors["inhibitionBatchDetails.qaRemarks"])}
                helperText={validationErrors["inhibitionBatchDetails.qaRemarks"]}
                disabled={disabled}
                readOnly={readOnly}
                multiline
                minRows={2}
                fieldPath={"inhibitionBatchDetails.qaRemarks"}
              />
            )}
          </Box>
        ) : null}
      </SectionCard>

      <SectionCard title="Inhibition Application Details" theme={theme}>
        <LocationQtyTable
          basePath="inhibitionApplicationDetails.inhibitionApplicationTable"
          value={value?.inhibitionApplicationDetails?.inhibitionApplicationTable || []}
          onChange={handleAppTableChange}
          qtyLabel="Qty Applied (g)"
          qtyKey="qtyApplied"
          validationErrors={validationErrors}
          clearFieldError={clearFieldError}
          disabled={disabled}
          readOnly={readOnly}
          qaRemarksMode={qaRemarksMode}
        />
      </SectionCard>

      <SectionCard title="Dispatch Details" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabelWithAsterisk label="Date & Time Of Dispatch" required />
            <Box data-qc-field={"dispatchDetails.dispatchDate"}>
              <DateTimeField
                value={value?.dispatchDetails?.dispatchDate ?? ""}
                onChange={(val: any) => handleDispatchChange("dispatchDate", val)}
                error={Boolean(validationErrors["dispatchDetails.dispatchDate"])}
                helperText={validationErrors["dispatchDetails.dispatchDate"]}
                disabled={disabled}
                readOnly={readOnly}
                compact
              />
            </Box>
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Dispatch Station" required />
            <Box data-qc-field={"dispatchDetails.dispatchStation"}>
              <TableSelectInput
                value={value?.dispatchDetails?.dispatchStation ?? ""}
                onChange={(e: any) => handleDispatchChange("dispatchStation", e)}
                options={stationOptions}
                placeholder="Select station"
                error={Boolean(validationErrors["dispatchDetails.dispatchStation"])}
                helperText={validationErrors["dispatchDetails.dispatchStation"]}
                disabled={disabled}
                readOnly={readOnly}
              />
            </Box>
          </Box>
        </FieldGrid>
        {qaRemarksMode ? (
          <Box sx={{ mt: 1.5 }} data-qc-field="dispatchDetails.qaRemarks">
            <FieldLabelWithAsterisk label="QA Remarks" />
            {readOnly ? (
              <WorkflowReadOnlyText value={value?.dispatchDetails?.qaRemarks} />
            ) : (
              <TableTextInput
                value={value?.dispatchDetails?.qaRemarks ?? ""}
                onChange={(e: any) => handleDispatchChange("qaRemarks", e)}
                error={Boolean(validationErrors["dispatchDetails.qaRemarks"])}
                helperText={validationErrors["dispatchDetails.qaRemarks"]}
                disabled={disabled}
                readOnly={readOnly}
                multiline
                minRows={2}
                fieldPath={"dispatchDetails.qaRemarks"}
              />
            )}
          </Box>
        ) : null}
      </SectionCard>
    </>
  );
};

// ==========================================
// 6. MAIN PANEL
// ==========================================
export const PostCureMotorPanel: React.FC<any> = ({
  value,
  onChange,
  validationErrors = {},
  clearFieldError,
  disabled = false,
  readOnly = false,
  theme,
  useQcDivisionFileField = false,
  qaRemarksMode = false,
  motorId,
}) => {
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const ingredientsFetchGenRef = useRef(0);
  const ingredientsHydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchCastingStationsApi()
      .then((response: any) => {
        if (!active) return;
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        setStationOptions(
          list
            .map((rec: any) => {
              const val = String(rec.STATION_CODE ?? rec.stationCode ?? rec.station_code ?? "");
              return {
                value: val,
                label: String(rec.STATION_NAME ?? rec.stationName ?? rec.station_name ?? val),
              };
            })
            .filter((item) => item.value),
        );
      })
      .catch(() => active && setStationOptions([]));
    return () => {
      active = false;
    };
  }, []);

  const variantRaw = value?.variant || "loose-flap-filling";
  const variant = String(variantRaw || "")
    .toLowerCase()
    .replace(/_/g, "-");

  // Case Prep–style: seed mix tables from POST /post-cure/ingredients (parent owns fetch).
  // Skip when the session already has user/hydrated input so a late recipe response cannot
  // race and wipe reopen data; still merge material codes when tables are empty shells.
  useEffect(() => {
    const hydrateKey = `${str(motorId).trim()}::${variant}`;
    if (ingredientsHydratedKeyRef.current === hydrateKey) return;

    if (postCureMotorDataHasUserInput(valueRef.current as PostCureMotorData | null)) {
      ingredientsHydratedKeyRef.current = hydrateKey;
      return;
    }

    const recipePairs: Array<{
      recipeType: string;
      qtyKey: "quantity" | "qtyTaken";
      apply: (rows: any[]) => void;
    }> = [];

    if (variant === "loose-flap-filling") {
      recipePairs.push({
        recipeType: POST_CURE_RECIPE_TYPES.LOOSE_FLAP_EPOXY,
        qtyKey: "quantity",
        apply: (rows) => {
          const current = valueRef.current || {};
          onChangeRef.current?.({
            ...current,
            looseFlapEpoxyPreparation: {
              ...current.looseFlapEpoxyPreparation,
              preparationDetails: rows,
            },
          });
        },
      });
    } else if (variant === "inhibition-ir1") {
      recipePairs.push(
        {
          recipeType: POST_CURE_RECIPE_TYPES.IR1_PREMIX,
          qtyKey: "qtyTaken",
          apply: (rows) => {
            const current = valueRef.current || {};
            onChangeRef.current?.({
              ...current,
              ir1Premix: { ...current.ir1Premix, ir1PremixTable: rows },
            });
          },
        },
        {
          recipeType: POST_CURE_RECIPE_TYPES.IR1_FINAL_MIX,
          qtyKey: "qtyTaken",
          apply: (rows) => {
            const current = valueRef.current || {};
            onChangeRef.current?.({
              ...current,
              ir1FinalMix: { ...current.ir1FinalMix, ir1FinalMixTable: rows },
            });
          },
        },
      );
    } else if (variant === "inhibition-hemcoat-3k") {
      recipePairs.push(
        {
          recipeType: POST_CURE_RECIPE_TYPES.HEMCOAT_3K_PREMIX,
          qtyKey: "qtyTaken",
          apply: (rows) => {
            const current = valueRef.current || {};
            onChangeRef.current?.({
              ...current,
              hemcoat3kPreparation: {
                ...current.hemcoat3kPreparation,
                premixPreparationTable: rows,
              },
            });
          },
        },
        {
          recipeType: POST_CURE_RECIPE_TYPES.HEMCOAT_3K_FINAL_MIX,
          qtyKey: "qtyTaken",
          apply: (rows) => {
            const current = valueRef.current || {};
            onChangeRef.current?.({
              ...current,
              hemcoat3kFinalMix: { ...current.hemcoat3kFinalMix, finalMixTable: rows },
            });
          },
        },
      );
    } else {
      ingredientsHydratedKeyRef.current = hydrateKey;
      return;
    }

    const gen = ++ingredientsFetchGenRef.current;
    void (async () => {
      for (const pair of recipePairs) {
        const result = await postCureController.fetchIngredients(pair.recipeType);
        if (gen !== ingredientsFetchGenRef.current) return;
        if (!result.success || !result.data) continue;

        // Re-read latest session before apply. Skip only this recipe when its mix
        // table already has qty/lot/remarks — do not abort sibling recipes (IR1 /
        // Hemcoat premix + final mix must both hydrate in one pass).
        const current = valueRef.current || {};
        const existingByRecipe: Record<string, any[]> = {
          [POST_CURE_RECIPE_TYPES.LOOSE_FLAP_EPOXY]:
            current.looseFlapEpoxyPreparation?.preparationDetails ?? [],
          [POST_CURE_RECIPE_TYPES.IR1_PREMIX]: current.ir1Premix?.ir1PremixTable ?? [],
          [POST_CURE_RECIPE_TYPES.IR1_FINAL_MIX]: current.ir1FinalMix?.ir1FinalMixTable ?? [],
          [POST_CURE_RECIPE_TYPES.HEMCOAT_3K_PREMIX]:
            current.hemcoat3kPreparation?.premixPreparationTable ?? [],
          [POST_CURE_RECIPE_TYPES.HEMCOAT_3K_FINAL_MIX]:
            current.hemcoat3kFinalMix?.finalMixTable ?? [],
        };
        const existing = existingByRecipe[pair.recipeType] ?? [];
        if (postCureIngredientRowsHaveUserInput(existing, pair.qtyKey)) {
          continue;
        }
        const next = buildPostCureIngredientRowsFromApi(result.data, pair.qtyKey, existing);
        if (next.length) pair.apply(next);
      }
      if (gen === ingredientsFetchGenRef.current) {
        ingredientsHydratedKeyRef.current = hydrateKey;
      }
    })();
  }, [motorId, variant]);

  const updateSubSection = (sectionKey: string, sectionData: any) => {
    onChange?.({
      ...(value || {}),
      [sectionKey]: sectionData,
    });
  };

  if (variant === "loose-flap-filling") {
    return (
      <Box>
        <SectionCard title="Bellow Removal Details" theme={theme}>
          <LocationDateTable
            basePath="bellowRemovalDetails.bellowRemovalTable"
            value={value?.bellowRemovalDetails?.bellowRemovalTable || []}
            onChange={(rows) =>
              updateSubSection("bellowRemovalDetails", { bellowRemovalTable: rows })
            }
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Loose Flap Epoxy Preparation Details" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.looseFlapEpoxyPreparation?.epoxyBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("looseFlapEpoxyPreparation.epoxyBatchNo");
                  updateSubSection("looseFlapEpoxyPreparation", {
                    ...value?.looseFlapEpoxyPreparation,
                    epoxyBatchNo: e,
                  });
                }}
                error={Boolean(validationErrors["looseFlapEpoxyPreparation.epoxyBatchNo"])}
                helperText={validationErrors["looseFlapEpoxyPreparation.epoxyBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"looseFlapEpoxyPreparation.epoxyBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Date & Time of Preparation" required />
              <Box data-qc-field={"looseFlapEpoxyPreparation.epoxyPreparationDate"}>
                <DateTimeField
                  value={value?.looseFlapEpoxyPreparation?.epoxyPreparationDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("looseFlapEpoxyPreparation.epoxyPreparationDate");
                    updateSubSection("looseFlapEpoxyPreparation", {
                      ...value?.looseFlapEpoxyPreparation,
                      epoxyPreparationDate: val,
                    });
                  }}
                  error={Boolean(
                    validationErrors["looseFlapEpoxyPreparation.epoxyPreparationDate"],
                  )}
                  helperText={validationErrors["looseFlapEpoxyPreparation.epoxyPreparationDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>

          <IngredientQuantityTable
            basePath="looseFlapEpoxyPreparation.preparationDetails"

            value={value?.looseFlapEpoxyPreparation?.preparationDetails || []}
            onChange={(rows) =>
              updateSubSection("looseFlapEpoxyPreparation", {
                ...value?.looseFlapEpoxyPreparation,
                preparationDetails: rows,
              })
            }
            qtyKey="quantity"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="qualificationDetails"
            value={value?.qualificationDetails}
            onChange={(sec) => updateSubSection("qualificationDetails", sec)}
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            useQcDivisionFileField={useQcDivisionFileField}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="LF Epoxy Filling Details" theme={theme}>
          <LocationQtyTable
            basePath="lfEpoxyFillingDetails.lfFillingTable"
            value={value?.lfEpoxyFillingDetails?.lfFillingTable || []}
            onChange={(rows) => updateSubSection("lfEpoxyFillingDetails", { lfFillingTable: rows })}
            qtyLabel="Quantity Filled"
            qtyKey="qtyFilled"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>
      </Box>
    );
  }

  if (variant === "inhibition-not-applicable") {
    return (
      <SectionCard title="Inhibition" theme={theme}>
        <FieldLabelWithAsterisk label="Remarks" required />
        <TableTextInput
          value={value?.inhibitionNotApplicable?.remarks ?? ""}
          onChange={(e: any) => {
            clearFieldError?.("inhibitionNotApplicable.remarks");
            updateSubSection("inhibitionNotApplicable", { remarks: e });
          }}
          error={Boolean(validationErrors["inhibitionNotApplicable.remarks"])}
          helperText={validationErrors["inhibitionNotApplicable.remarks"]}
          disabled={disabled}
          readOnly={readOnly}
          multiline
          minRows={4}
          fieldPath={"inhibitionNotApplicable.remarks"}
        />
      </SectionCard>
    );
  }

  if (variant === "inhibition-ir1") {
    return (
      <Box>
        <SectionCard title="IR-1 Premix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.ir1Premix?.ir1PremixBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("ir1Premix.ir1PremixBatchNo");
                  updateSubSection("ir1Premix", { ...value?.ir1Premix, ir1PremixBatchNo: e });
                }}
                error={Boolean(validationErrors["ir1Premix.ir1PremixBatchNo"])}
                helperText={validationErrors["ir1Premix.ir1PremixBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"ir1Premix.ir1PremixBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Premix Date & Time" required />
              <Box data-qc-field={"ir1Premix.ir1PremixDate"}>
                <DateTimeField
                  value={value?.ir1Premix?.ir1PremixDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("ir1Premix.ir1PremixDate");
                    updateSubSection("ir1Premix", { ...value?.ir1Premix, ir1PremixDate: val });
                  }}
                  error={Boolean(validationErrors["ir1Premix.ir1PremixDate"])}
                  helperText={validationErrors["ir1Premix.ir1PremixDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="ir1Premix.ir1PremixTable"

            value={value?.ir1Premix?.ir1PremixTable || []}
            onChange={(rows) =>
              updateSubSection("ir1Premix", { ...value?.ir1Premix, ir1PremixTable: rows })
            }
            qtyKey="qtyTaken"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Final Mix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.ir1FinalMix?.ir1FinalMixBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("ir1FinalMix.ir1FinalMixBatchNo");
                  updateSubSection("ir1FinalMix", {
                    ...value?.ir1FinalMix,
                    ir1FinalMixBatchNo: e,
                  });
                }}
                error={Boolean(validationErrors["ir1FinalMix.ir1FinalMixBatchNo"])}
                helperText={validationErrors["ir1FinalMix.ir1FinalMixBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"ir1FinalMix.ir1FinalMixBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Final Mix Date & Time" required />
              <Box data-qc-field={"ir1FinalMix.ir1FinalMixDate"}>
                <DateTimeField
                  value={value?.ir1FinalMix?.ir1FinalMixDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("ir1FinalMix.ir1FinalMixDate");
                    updateSubSection("ir1FinalMix", {
                      ...value?.ir1FinalMix,
                      ir1FinalMixDate: val,
                    });
                  }}
                  error={Boolean(validationErrors["ir1FinalMix.ir1FinalMixDate"])}
                  helperText={validationErrors["ir1FinalMix.ir1FinalMixDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="ir1FinalMix.ir1FinalMixTable"

            value={value?.ir1FinalMix?.ir1FinalMixTable || []}
            onChange={(rows) =>
              updateSubSection("ir1FinalMix", { ...value?.ir1FinalMix, ir1FinalMixTable: rows })
            }
            qtyKey="qtyTaken"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="ir1Qualification"
            value={value?.ir1Qualification}
            onChange={(sec) => updateSubSection("ir1Qualification", sec)}
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            useQcDivisionFileField={useQcDivisionFileField}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <InhibitionSharedSections
          disabled={disabled}
          readOnly={readOnly}
          stationOptions={stationOptions}
          theme={theme}
          value={value}
          onChange={onChange}
          validationErrors={validationErrors}
          clearFieldError={clearFieldError}
          qaRemarksMode={qaRemarksMode}
        />
      </Box>
    );
  }

  if (variant === "inhibition-hemcoat-3k") {
    return (
      <Box>
        <SectionCard title="Hemcoat-3K Preparation" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.hemcoat3kPreparation?.hemcoatPremixBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("hemcoat3kPreparation.hemcoatPremixBatchNo");
                  updateSubSection("hemcoat3kPreparation", {
                    ...value?.hemcoat3kPreparation,
                    hemcoatPremixBatchNo: e,
                  });
                }}
                error={Boolean(validationErrors["hemcoat3kPreparation.hemcoatPremixBatchNo"])}
                helperText={validationErrors["hemcoat3kPreparation.hemcoatPremixBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"hemcoat3kPreparation.hemcoatPremixBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Premix Date & Time" required />
              <Box data-qc-field={"hemcoat3kPreparation.hemcoatPremixDate"}>
                <DateTimeField
                  value={value?.hemcoat3kPreparation?.hemcoatPremixDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("hemcoat3kPreparation.hemcoatPremixDate");
                    updateSubSection("hemcoat3kPreparation", {
                      ...value?.hemcoat3kPreparation,
                      hemcoatPremixDate: val,
                    });
                  }}
                  error={Boolean(validationErrors["hemcoat3kPreparation.hemcoatPremixDate"])}
                  helperText={validationErrors["hemcoat3kPreparation.hemcoatPremixDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="hemcoat3kPreparation.premixPreparationTable"

            value={value?.hemcoat3kPreparation?.premixPreparationTable || []}
            onChange={(rows) =>
              updateSubSection("hemcoat3kPreparation", {
                ...value?.hemcoat3kPreparation,
                premixPreparationTable: rows,
              })
            }
            qtyKey="qtyTaken"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Final Mix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.hemcoat3kFinalMix?.hemcoatFinalMixBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("hemcoat3kFinalMix.hemcoatFinalMixBatchNo");
                  updateSubSection("hemcoat3kFinalMix", {
                    ...value?.hemcoat3kFinalMix,
                    hemcoatFinalMixBatchNo: e,
                  });
                }}
                error={Boolean(validationErrors["hemcoat3kFinalMix.hemcoatFinalMixBatchNo"])}
                helperText={validationErrors["hemcoat3kFinalMix.hemcoatFinalMixBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"hemcoat3kFinalMix.hemcoatFinalMixBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Final Mix Date & Time" required />
              <Box data-qc-field={"hemcoat3kFinalMix.hemcoatFinalMixDate"}>
                <DateTimeField
                  value={value?.hemcoat3kFinalMix?.hemcoatFinalMixDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("hemcoat3kFinalMix.hemcoatFinalMixDate");
                    updateSubSection("hemcoat3kFinalMix", {
                      ...value?.hemcoat3kFinalMix,
                      hemcoatFinalMixDate: val,
                    });
                  }}
                  error={Boolean(validationErrors["hemcoat3kFinalMix.hemcoatFinalMixDate"])}
                  helperText={validationErrors["hemcoat3kFinalMix.hemcoatFinalMixDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="hemcoat3kFinalMix.finalMixTable"

            value={value?.hemcoat3kFinalMix?.finalMixTable || []}
            onChange={(rows) =>
              updateSubSection("hemcoat3kFinalMix", {
                ...value?.hemcoat3kFinalMix,
                finalMixTable: rows,
              })
            }
            qtyKey="qtyTaken"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="hemcoat3kQualification"
            value={value?.hemcoat3kQualification}
            onChange={(sec) => updateSubSection("hemcoat3kQualification", sec)}
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            useQcDivisionFileField={useQcDivisionFileField}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <InhibitionSharedSections
          disabled={disabled}
          readOnly={readOnly}
          stationOptions={stationOptions}
          theme={theme}
          value={value}
          onChange={onChange}
          validationErrors={validationErrors}
          clearFieldError={clearFieldError}
          qaRemarksMode={qaRemarksMode}
        />
      </Box>
    );
  }

  if (variant === "inhibition-others") {
    return (
      <Box>
        <SectionCard title="Premix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.othersPremix?.othersPremixBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("othersPremix.othersPremixBatchNo");
                  updateSubSection("othersPremix", {
                    ...value?.othersPremix,
                    othersPremixBatchNo: e,
                  });
                }}
                error={Boolean(validationErrors["othersPremix.othersPremixBatchNo"])}
                helperText={validationErrors["othersPremix.othersPremixBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"othersPremix.othersPremixBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Premix Date & Time" required />
              <Box data-qc-field={"othersPremix.othersPremixDate"}>
                <DateTimeField
                  value={value?.othersPremix?.othersPremixDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("othersPremix.othersPremixDate");
                    updateSubSection("othersPremix", {
                      ...value?.othersPremix,
                      othersPremixDate: val,
                    });
                  }}
                  error={Boolean(validationErrors["othersPremix.othersPremixDate"])}
                  helperText={validationErrors["othersPremix.othersPremixDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>
          <FlexibleOthersIngredientTable
            basePath="othersPremix.othersPremixTable"
            value={value?.othersPremix?.othersPremixTable || []}
            onChange={(rows) =>
              updateSubSection("othersPremix", {
                ...value?.othersPremix,
                othersPremixTable: rows,
              })
            }
            qtyKey="qtyTaken"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Final Mix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Batch No" required />
              <TableTextInput
                value={value?.othersFinalMix?.othersFinalMixBatchNo ?? ""}
                onChange={(e: any) => {
                  clearFieldError?.("othersFinalMix.othersFinalMixBatchNo");
                  updateSubSection("othersFinalMix", {
                    ...value?.othersFinalMix,
                    othersFinalMixBatchNo: e,
                  });
                }}
                error={Boolean(validationErrors["othersFinalMix.othersFinalMixBatchNo"])}
                helperText={validationErrors["othersFinalMix.othersFinalMixBatchNo"]}
                disabled={disabled}
                readOnly={readOnly}
                fieldPath={"othersFinalMix.othersFinalMixBatchNo"}
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Final Mix Date & Time" required />
              <Box data-qc-field={"othersFinalMix.othersFinalMixDate"}>
                <DateTimeField
                  value={value?.othersFinalMix?.othersFinalMixDate ?? ""}
                  onChange={(val: any) => {
                    clearFieldError?.("othersFinalMix.othersFinalMixDate");
                    updateSubSection("othersFinalMix", {
                      ...value?.othersFinalMix,
                      othersFinalMixDate: val,
                    });
                  }}
                  error={Boolean(validationErrors["othersFinalMix.othersFinalMixDate"])}
                  helperText={validationErrors["othersFinalMix.othersFinalMixDate"]}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              </Box>
            </Box>
          </FieldGrid>
          <FlexibleOthersIngredientTable
            basePath="othersFinalMix.othersFinalMixTable"
            value={value?.othersFinalMix?.othersFinalMixTable || []}
            onChange={(rows) =>
              updateSubSection("othersFinalMix", {
                ...value?.othersFinalMix,
                othersFinalMixTable: rows,
              })
            }
            qtyKey="qtyTaken"
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="othersQualification"
            value={value?.othersQualification}
            onChange={(sec) => updateSubSection("othersQualification", sec)}
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
            disabled={disabled}
            readOnly={readOnly}
            useQcDivisionFileField={useQcDivisionFileField}
            editableSpecification
            qaRemarksMode={qaRemarksMode}
          />
        </SectionCard>

        <InhibitionSharedSections
          disabled={disabled}
          readOnly={readOnly}
          stationOptions={stationOptions}
          theme={theme}
          value={value}
          onChange={onChange}
          validationErrors={validationErrors}
          clearFieldError={clearFieldError}
          qaRemarksMode={qaRemarksMode}
        />
      </Box>
    );
  }

  return null;
};

export default PostCureMotorPanel;
