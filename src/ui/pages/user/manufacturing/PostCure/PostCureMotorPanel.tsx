import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";

import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import { DateField } from "../../../../components/common/DateField";
import PostCureFileField from "./PostCureFileField";
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
}: {
  basePath: string;
  value?: any[];
  onChange: (updatedRows: any[]) => void;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const rows = value || [];

  const handleFieldChange = (index: number, fieldName: string, val: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [fieldName]: val };
    const errorKey = `${basePath}.${index}.${fieldName}`;
    clearFieldError?.(errorKey);
    onChange(updated);
  };

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Location", "From Date", "To Date", "Observations"].map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk label={label} required={!readOnly} />
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

              return (
                <TableRow key={`loc-date-${locationVal || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {formatLocation(locationVal)}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.fromDate || "—"}</Typography>
                    ) : (
                      <DateField
                        value={row.fromDate ?? ""}
                        onChange={(val: any) => handleFieldChange(index, "fromDate", val)}
                        error={Boolean(validationErrors[fromDateErrKey])}
                        helperText={validationErrors[fromDateErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        compact
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.toDate || "—"}</Typography>
                    ) : (
                      <DateField
                        value={row.toDate ?? ""}
                        onChange={(val: any) => handleFieldChange(index, "toDate", val)}
                        error={Boolean(validationErrors[toDateErrKey])}
                        helperText={validationErrors[toDateErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        compact
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>
                        {row.observations || "—"}
                      </Typography>
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
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
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
}) => {
  const rows = value || [];

  const handleFieldChange = (index: number, fieldName: string, val: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [fieldName]: val };

    const errorKey = `${basePath}.${index}.${fieldName}`;
    clearFieldError?.(errorKey);

    onChange(updated);
  };

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Location", "From Date", "To Date", qtyLabel, "Observations"].map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk label={label} required={idx >= 1 && !readOnly} />
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

              return (
                <TableRow key={`loc-qty-${locationVal || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {formatLocation(locationVal)}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.fromDate || "—"}</Typography>
                    ) : (
                      <DateField
                        value={row.fromDate ?? ""}
                        onChange={(val: any) => handleFieldChange(index, "fromDate", val)}
                        error={Boolean(validationErrors[fromDateErrKey])}
                        helperText={validationErrors[fromDateErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        compact
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.toDate || "—"}</Typography>
                    ) : (
                      <DateField
                        value={row.toDate ?? ""}
                        onChange={(val: any) => handleFieldChange(index, "toDate", val)}
                        error={Boolean(validationErrors[toDateErrKey])}
                        helperText={validationErrors[toDateErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        compact
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row[qtyKey] || "—"}</Typography>
                    ) : (
                      <TableTextInput
                        value={String(row[qtyKey] ?? "")}
                        onChange={(val: any) => handleFieldChange(index, qtyKey, val)}
                        error={Boolean(validationErrors[qtyErrKey])}
                        helperText={validationErrors[qtyErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        type="number"
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>
                        {row.observations || "—"}
                      </Typography>
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
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
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
export const IngredientQuantityTable = ({
  basePath,
  value = [],
  onChange,
  qtyKey = "quantity",
  validationErrors = {},
  clearFieldError,
  disabled = false,
  readOnly = false,
}: {
  basePath: string;
  value?: any[];
  onChange: (updatedRows: any[]) => void;
  qtyKey?: "quantity" | "qtyTaken" | string;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const rows = value || [];

  const handleQuantityChange = (currentIndex: number, newValue: string) => {
    const updatedRows = [...rows];
    updatedRows[currentIndex] = { ...updatedRows[currentIndex], [qtyKey]: newValue };

    const qtyErrKey = `${basePath}.${currentIndex}.${qtyKey}`;
    clearFieldError?.(qtyErrKey); // Clears only this row's quantity error
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
    clearFieldError?.(lotErrKey); // Clears only this row's mfgLot error

    onChange(updatedRows);
  };

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {[
              "Sr No.",
              "Ingredient",
              "Mfg Lot",
              "Parts By Weight",
              qtyKey === "quantity" ? "Quantity (g)" : "Qty Taken (g)",
            ].map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk label={label} required={!readOnly} />
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

              return (
                <TableRow key={`ing-${srNo || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>{srNo}</TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: isTotal ? 700 : 500 }}>
                    {ingredient}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isTotal || readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                        {row.mfgLot || "—"}
                      </Typography>
                    ) : (
                      <TableTextInput
                        value={row.mfgLot ?? ""}
                        onChange={(next: any) => handleMfgLotChange(index, next)}
                        error={Boolean(validationErrors[mfgLotErrKey])}
                        helperText={validationErrors[mfgLotErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>
                    {partsByWeight}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row[qtyKey] || "—"}</Typography>
                    ) : (
                      <TableTextInput
                        value={String(row[qtyKey] ?? "")}
                        onChange={(next: any) => handleQuantityChange(index, next)}
                        error={Boolean(validationErrors[qtyErrKey])}
                        helperText={validationErrors[qtyErrKey]}
                        disabled={disabled || isTotal}
                        readOnly={readOnly}
                        type="number"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
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
}: {
  basePath: string;
  value?: any;
  onChange: (updatedSection: any) => void;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const tableValues = value?.qualificationTable || [];

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
          />
        </Box>
        <Box>
          <FieldLabelWithAsterisk label="Date of Preparation" required />
          <DateField
            value={value?.qualificationPreparationDate ?? ""}
            onChange={(val: any) => handleSectionFieldChange("qualificationPreparationDate", val)}
            error={Boolean(validationErrors[prepDateErrKey])}
            helperText={validationErrors[prepDateErrKey]}
            disabled={disabled}
            readOnly={readOnly}
            compact
          />
        </Box>
      </FieldGrid>

      <TableContainer sx={postCureTableContainerSx}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Parameter", "Specification", "Result"].map((label, idx) => (
                <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                  <FieldLabelWithAsterisk label={label} required={!readOnly} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableValues.map((row: any, index: number) => {
              const parameter = row.parameter ?? row.PARAMETER;
              const specification = row.specification ?? row.SPECIFICATION;
              const resultErrKey = `${basePath}.qualificationTable.${index}.result`;

              return (
                <TableRow key={`qual-${index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {parameter}
                  </TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>
                    {specification}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {readOnly ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.result || "—"}</Typography>
                    ) : (
                      <TableTextInput
                        value={row.result ?? ""}
                        onChange={(e: any) => handleTableResultChange(index, e)}
                        error={Boolean(validationErrors[resultErrKey])}
                        helperText={validationErrors[resultErrKey]}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1.5 }}>
        <FieldLabelWithAsterisk label="QC Report" required />
        <Box sx={{ mt: 1 }}>
          <PostCureFileField
            files={value?.qualificationQcReport || []}
            onChange={handleQcReportChange}
            multiple
            acceptMode="imageVideoPdf"
            disabled={disabled}
            readOnly={readOnly}
            required
          />
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
}: {
  disabled?: boolean;
  readOnly?: boolean;
  stationOptions: Array<{ value: string; label: string }>;
  theme?: any;
  value?: any;
  onChange: (updated: any) => void;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
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
            />
          </Box>
        </FieldGrid>
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
        />
      </SectionCard>

      <SectionCard title="Dispatch Details" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabelWithAsterisk label="Date Of Dispatch" required />
            <DateField
              value={value?.dispatchDetails?.dispatchDate ?? ""}
              onChange={(val: any) => handleDispatchChange("dispatchDate", val)}
              error={Boolean(validationErrors["dispatchDetails.dispatchDate"])}
              helperText={validationErrors["dispatchDetails.dispatchDate"]}
              disabled={disabled}
              readOnly={readOnly}
              compact
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Dispatch Station" required />
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
        </FieldGrid>
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
}) => {
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);

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
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Date of Preparation" required />
              <DateField
                value={value?.looseFlapEpoxyPreparation?.epoxyPreparationDate ?? ""}
                onChange={(val: any) => {
                  clearFieldError?.("looseFlapEpoxyPreparation.epoxyPreparationDate");
                  updateSubSection("looseFlapEpoxyPreparation", {
                    ...value?.looseFlapEpoxyPreparation,
                    epoxyPreparationDate: val,
                  });
                }}
                error={Boolean(validationErrors["looseFlapEpoxyPreparation.epoxyPreparationDate"])}
                helperText={validationErrors["looseFlapEpoxyPreparation.epoxyPreparationDate"]}
                disabled={disabled}
                readOnly={readOnly}
                compact
              />
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
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Premix Date" required />
              <DateField
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
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Final Mix Date" required />
              <DateField
                value={value?.ir1FinalMix?.ir1FinalMixDate ?? ""}
                onChange={(val: any) => {
                  clearFieldError?.("ir1FinalMix.ir1FinalMixDate");
                  updateSubSection("ir1FinalMix", { ...value?.ir1FinalMix, ir1FinalMixDate: val });
                }}
                error={Boolean(validationErrors["ir1FinalMix.ir1FinalMixDate"])}
                helperText={validationErrors["ir1FinalMix.ir1FinalMixDate"]}
                disabled={disabled}
                readOnly={readOnly}
                compact
              />
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
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Premix Date" required />
              <DateField
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
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Final Mix Date" required />
              <DateField
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
        />
      </Box>
    );
  }

  return null;
};

export default PostCureMotorPanel;
