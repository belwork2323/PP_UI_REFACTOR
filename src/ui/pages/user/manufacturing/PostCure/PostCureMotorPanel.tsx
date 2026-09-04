import React, { useEffect, useState, useRef } from "react";
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
import { Controller, useFormContext } from "react-hook-form";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";

import type {
  InhibitionHemcoatMotorData,
  InhibitionIr1MotorData,
  InhibitionNotApplicableMotorData,
  IngredientQuantityRow,
  IngredientTakenRow,
  LocationAppliedRow,
  LocationDateRow,
  LocationQtyRow,
  LooseFlapMotorData,
  PostCureMotorData,
  QualificationRow,
} from "../../../../../data/models/user/PostCureMotorDataModel";

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
import {
  ControlledField,
  FieldLabelWithAsterisk,
} from "@/ui/components/common/FieldLabelWithAsterisk";

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
  disabled,
  readOnly = false,
}: {
  basePath?: string;
  value?: any[];
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const methods = useFormContext();
  const isReadOnlyMode = readOnly || !methods;
  const { control, watch } = methods || {};
  const watchedRows = basePath && watch ? watch(basePath) : [];

  const rawSourceData = (watchedRows && watchedRows.length > 0 ? watchedRows : value) || [];

  const rows = rawSourceData.map((fallbackItem: any, index: number) => {
    const watchedItem = watchedRows?.[index] || {};
    return {
      ...fallbackItem,
      ...watchedItem,
      location: watchedItem.location ?? fallbackItem.location ?? fallbackItem.LOCATION,
      fromDate: watchedItem.fromDate ?? fallbackItem.fromDate ?? fallbackItem.FROM_DATE,
      toDate: watchedItem.toDate ?? fallbackItem.toDate ?? fallbackItem.TO_DATE,
      observations:
        watchedItem.observations ?? fallbackItem.observations ?? fallbackItem.OBSERVATIONS,
    };
  });

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Location", "From Date", "To Date", "Observations"].map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk label={label} required={idx < 3 && !isReadOnlyMode} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row: any, index: number) => {
              const locationVal = row.location;
              return (
                <TableRow key={`loc-date-${locationVal || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {formatLocation(locationVal)}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.fromDate || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.fromDate`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <DateField
                            value={field.value ?? row.fromDate ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            compact
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.toDate || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.toDate`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <DateField
                            value={field.value ?? row.toDate ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            compact
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>
                        {row.observations || "—"}
                      </Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.observations`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TableTextInput
                            value={field.value ?? row.observations ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            multiline
                            minRows={2}
                          />
                        )}
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
  qtyLabel,
  qtyKey = "qtyFilled",
  disabled = false,
  readOnly = false,
}: {
  basePath?: string;
  value?: any[];
  qtyLabel: string;
  qtyKey?: "qtyFilled" | "qtyApplied" | string;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const methods = useFormContext();
  const isReadOnlyMode = readOnly || !methods;
  const { control, watch } = methods || {};
  const watchedRows = basePath && watch ? watch(basePath) : [];

  const rawSourceData = (watchedRows && watchedRows.length > 0 ? watchedRows : value) || [];

  const rows = rawSourceData.map((fallbackItem: any, index: number) => {
    const watchedItem = watchedRows?.[index] || {};
    return {
      ...fallbackItem,
      ...watchedItem,
      location: watchedItem.location ?? fallbackItem.location ?? fallbackItem.LOCATION,
      fromDate: watchedItem.fromDate ?? fallbackItem.fromDate ?? fallbackItem.FROM_DATE,
      toDate: watchedItem.toDate ?? fallbackItem.toDate ?? fallbackItem.TO_DATE,
      [qtyKey]:
        watchedItem[qtyKey] ??
        fallbackItem[qtyKey] ??
        fallbackItem.QTY_APPLIED ??
        fallbackItem.QTY_FILLED,
      observations:
        watchedItem.observations ?? fallbackItem.observations ?? fallbackItem.OBSERVATIONS,
    };
  });

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Location", "From Date", "To Date", qtyLabel, "Observations"].map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                <FieldLabelWithAsterisk
                  label={label}
                  required={idx >= 1 && idx <= 3 && !isReadOnlyMode}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row: any, index: number) => {
              const locationVal = row.location;
              return (
                <TableRow key={`loc-qty-${locationVal || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {formatLocation(locationVal)}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.fromDate || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.fromDate`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <DateField
                            value={field.value ?? row.fromDate ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            compact
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.toDate || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.toDate`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <DateField
                            value={field.value ?? row.toDate ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            compact
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row[qtyKey] || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.${qtyKey}`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TableTextInput
                            value={String(field.value ?? row[qtyKey] ?? "")}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            type="number"
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>
                        {row.observations || "—"}
                      </Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.observations`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TableTextInput
                            value={field.value ?? row.observations ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                            multiline
                            minRows={2}
                          />
                        )}
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
  qtyKey = "quantity",
  disabled = false,
  readOnly = false,
}: {
  basePath?: string;
  value?: any[];
  qtyKey?: "quantity" | "qtyTaken" | string;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const methods = useFormContext();
  const isReadOnlyMode = readOnly || !methods;
  const { control, setValue, getValues, watch } = methods || {};
  const watchedRows = basePath && watch ? watch(basePath) : [];

  const rawSourceData = (watchedRows && watchedRows.length > 0 ? watchedRows : value) || [];

  const rows = rawSourceData.map((fallbackItem: any, index: number) => {
    const watchedItem = watchedRows?.[index] || {};
    return {
      ...fallbackItem,
      ...watchedItem,
      srNo: watchedItem.srNo ?? fallbackItem.srNo ?? fallbackItem.SR_NO,
      ingredient: watchedItem.ingredient ?? fallbackItem.ingredient ?? fallbackItem.INGREDIENT,
      partsByWeight:
        watchedItem.partsByWeight ?? fallbackItem.partsByWeight ?? fallbackItem.PARTS_BY_WEIGHT,
      mfgLot: watchedItem.mfgLot ?? fallbackItem.mfgLot ?? fallbackItem.MFG_LOT,
      [qtyKey]:
        watchedItem[qtyKey] ??
        fallbackItem[qtyKey] ??
        fallbackItem.quantity ??
        fallbackItem.QTY_TAKEN,
    };
  });

  const handleQuantityChange = (
    currentIndex: number,
    newValue: string,
    fieldOnChange: (val: any) => void,
  ) => {
    fieldOnChange(newValue);
    if (!basePath || !getValues || !setValue) return;

    const currentRows = getValues(basePath) || [];
    const totalQty = currentRows.reduce((acc: number, row: any, i: number) => {
      const srNo = String(row.srNo ?? row.SR_NO ?? "").toUpperCase();
      const isTotalRow = srNo === "TOTAL";
      const val =
        i === currentIndex
          ? parseFloat(newValue)
          : parseFloat(row[qtyKey] ?? row.quantity ?? row.qtyTaken ?? 0);
      return !isTotalRow && !isNaN(val) ? acc + val : acc;
    }, 0);

    const totalRowIndex = currentRows.findIndex(
      (row: any) => String(row.srNo ?? row.SR_NO ?? "").toUpperCase() === "TOTAL",
    );
    if (totalRowIndex !== -1) {
      setValue(`${basePath}.${totalRowIndex}.${qtyKey}`, totalQty > 0 ? String(totalQty) : "");
    }
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
                <FieldLabelWithAsterisk label={label} required={!isReadOnlyMode} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row: any, index: number) => {
              const srNo = row.srNo;
              const ingredient = row.ingredient;
              const partsByWeight = row.partsByWeight;
              const isTotal = String(srNo ?? "").toUpperCase() === "TOTAL";

              return (
                <TableRow key={`ing-${srNo || index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>{srNo}</TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: isTotal ? 700 : 500 }}>
                    {ingredient}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isTotal || isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                        {row.mfgLot || "—"}
                      </Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.mfgLot`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TableTextInput
                            value={field.value ?? row.mfgLot ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>
                    {partsByWeight}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row[qtyKey] || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.${index}.${qtyKey}`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TableTextInput
                            value={String(field.value ?? row[qtyKey] ?? "")}
                            onChange={(next) => handleQuantityChange(index, next, field.onChange)}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled || isTotal}
                            readOnly={readOnly}
                            type="number"
                          />
                        )}
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
  value = [],
  sectionValue,
  disabled = false,
  readOnly = false,
}: {
  basePath: string;
  value?: any[];
  sectionValue?: any;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const methods = useFormContext();
  const isReadOnlyMode = readOnly || !methods;
  const { control, watch } = methods || {};
  const watchedTableValues = basePath && watch ? watch(`${basePath}.qualificationTable`) : [];

  const tableValues = (
    watchedTableValues && watchedTableValues.length > 0 ? watchedTableValues : value
  ).map((fallbackItem: any, index: number) => {
    const watchedItem = watchedTableValues?.[index] || {};
    return {
      ...fallbackItem,
      ...watchedItem,
      parameter: watchedItem.parameter ?? fallbackItem.parameter ?? fallbackItem.PARAMETER,
      specification:
        watchedItem.specification ?? fallbackItem.specification ?? fallbackItem.SPECIFICATION,
      result: watchedItem.result ?? fallbackItem.result ?? fallbackItem.RESULT,
    };
  });

  return (
    <>
      <FieldGrid columns={2}>
        <Box>
          <ControlledField name={`${basePath}.qualificationBatchNo`} label="Batch No" required>
            {(field, hasError, errorMessage) => (
              <TableTextInput
                {...field}
                value={field.value ?? sectionValue?.qualificationBatchNo ?? ""}
                onChange={field.onChange}
                error={hasError}
                helperText={errorMessage}
                disabled={disabled}
                readOnly={readOnly}
              />
            )}
          </ControlledField>
        </Box>
        <Box>
          <ControlledField
            name={`${basePath}.qualificationPreparationDate`}
            label="Date of Preparation"
            required
          >
            {(field, hasError, errorMessage) => (
              <DateField
                {...field}
                value={field.value ?? sectionValue?.qualificationPreparationDate ?? ""}
                onChange={field.onChange}
                error={hasError}
                helperText={errorMessage}
                disabled={disabled}
                readOnly={readOnly}
                compact
              />
            )}
          </ControlledField>
        </Box>
      </FieldGrid>

      <TableContainer sx={postCureTableContainerSx}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Parameter", "Specification", "Result"].map((label, idx) => (
                <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                  <FieldLabelWithAsterisk label={label} required={!isReadOnlyMode} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableValues.map((row: any, index: number) => {
              const parameter = row.parameter;
              const specification = row.specification;
              return (
                <TableRow key={`qual-${index}`} sx={postCureTableRowSx(index)}>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                    {parameter}
                  </TableCell>
                  <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>
                    {specification}
                  </TableCell>
                  <TableCell sx={postCureTableCellSx}>
                    {isReadOnlyMode ? (
                      <Typography sx={{ fontSize: "0.82rem" }}>{row.result || "—"}</Typography>
                    ) : (
                      <Controller
                        name={`${basePath}.qualificationTable.${index}.result`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <TableTextInput
                            value={field.value ?? row.result ?? ""}
                            onChange={field.onChange}
                            error={!!error}
                            helperText={error?.message}
                            disabled={disabled}
                            readOnly={readOnly}
                          />
                        )}
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
        <FieldLabelWithAsterisk label="QC Report" required={!isReadOnlyMode} />
        {isReadOnlyMode ? (
          <Box sx={{ mt: 1 }}>
            <PostCureFileField
              files={sectionValue?.qualificationQcReport || []}
              onChange={() => {}}
              multiple
              acceptMode="imageVideoPdf"
              disabled={true}
              readOnly={true}
            />
          </Box>
        ) : (
          <Controller
            name={`${basePath}.qualificationQcReport`}
            control={control}
            render={({ field: { value: fileVal = [], onChange }, fieldState: { error } }) => (
              <Box>
                <PostCureFileField
                  files={
                    (Array.isArray(fileVal) && fileVal.length > 0
                      ? fileVal
                      : sectionValue?.qualificationQcReport) || []
                  }
                  onChange={onChange}
                  multiple
                  acceptMode="imageVideoPdf"
                  disabled={disabled}
                  readOnly={readOnly}
                />
                {error?.message && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                    {error.message}
                  </Typography>
                )}
              </Box>
            )}
          />
        )}
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
  tableValue = [],
  value,
}: {
  disabled?: boolean;
  readOnly?: boolean;
  stationOptions: Array<{ value: string; label: string }>;
  theme?: any;
  tableValue?: any[];
  value?: any;
}) => {
  return (
    <>
      <SectionCard title="Inhibitor Batch Information" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <ControlledField
              name="inhibitionBatchDetails.inhibitorBatchNo"
              label="Batch No"
              required
            >
              {(field, hasError, errorMessage) => (
                <TableTextInput
                  {...field}
                  value={field.value ?? value?.inhibitionBatchDetails?.inhibitorBatchNo ?? ""}
                  onChange={field.onChange}
                  error={hasError}
                  helperText={errorMessage}
                  disabled={disabled}
                  readOnly={readOnly}
                />
              )}
            </ControlledField>
          </Box>
          <Box>
            <ControlledField
              name="inhibitionBatchDetails.inhibitorBatchSize"
              label="Batch Size (g)"
              required
            >
              {(field, hasError, errorMessage) => (
                <TableTextInput
                  {...field}
                  value={field.value ?? value?.inhibitionBatchDetails?.inhibitorBatchSize ?? ""}
                  onChange={field.onChange}
                  error={hasError}
                  helperText={errorMessage}
                  disabled={disabled}
                  readOnly={readOnly}
                  type="number"
                />
              )}
            </ControlledField>
          </Box>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Inhibition Application Details" theme={theme}>
        <LocationQtyTable
          basePath="inhibitionApplicationDetails.inhibitionApplicationTable"
          value={tableValue}
          qtyLabel="Qty Applied (g)"
          qtyKey="qtyApplied"
          disabled={disabled}
          readOnly={readOnly}
        />
      </SectionCard>

      <SectionCard title="Dispatch Details" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <ControlledField name="dispatchDetails.dispatchDate" label="Date Of Dispatch" required>
              {(field, hasError, errorMessage) => (
                <DateField
                  {...field}
                  value={field.value ?? value?.dispatchDetails?.dispatchDate ?? ""}
                  onChange={field.onChange}
                  error={hasError}
                  helperText={errorMessage}
                  disabled={disabled}
                  readOnly={readOnly}
                  compact
                />
              )}
            </ControlledField>
          </Box>
          <Box>
            <ControlledField
              name="dispatchDetails.dispatchStation"
              label="Dispatch Station"
              required
            >
              {(field, hasError, errorMessage) => (
                <TableSelectInput
                  {...field}
                  value={field.value ?? value?.dispatchDetails?.dispatchStation ?? ""}
                  onChange={field.onChange}
                  options={stationOptions}
                  placeholder="Select station"
                  error={hasError}
                  helperText={errorMessage}
                  disabled={disabled}
                  readOnly={readOnly}
                />
              )}
            </ControlledField>
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
  disabled = false,
  readOnly = false,
  theme,
}) => {
  const formContext = useFormContext();
  const reset = formContext?.reset ?? (() => {});

  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);
  const isInitialized = useRef(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (reset && value && Object.keys(value).length > 0) {
      // Always re-sync when the value object reference changes (or on first init)
      if (!isInitialized.current || prevValueRef.current !== value) {
        const next = { ...value };
        if (!next.variant) {
          next.variant = next.ir1Premix
            ? "inhibition-ir1"
            : next.hemcoat3kPreparation
              ? "inhibition-hemcoat-3k"
              : next.inhibitionNotApplicable
                ? "inhibition-not-applicable"
                : "loose-flap-filling";
        }
        // Keep values false so form state is fully replaced by incoming data
        reset(next, { keepDefaultValues: false, keepValues: false });
        isInitialized.current = true;
        prevValueRef.current = value;
      }
    }
  }, [value, reset]);

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

  const bellowRemovalVal = value?.bellowRemovalDetails?.bellowRemovalTable || [];
  const looseFlapIngVal = value?.looseFlapEpoxyPreparation?.preparationDetails || [];
  const lfFillingVal = value?.lfEpoxyFillingDetails?.lfFillingTable || [];
  const ir1PremixVal = value?.ir1Premix?.ir1PremixTable || [];
  const ir1FinalMixVal = value?.ir1FinalMix?.ir1FinalMixTable || [];
  const hemcoatPremixVal = value?.hemcoat3kPreparation?.premixPreparationTable || [];
  const hemcoatFinalMixVal = value?.hemcoat3kFinalMix?.finalMixTable || [];
  const looseFlapQualVal = value?.qualificationDetails?.qualificationTable || [];
  const ir1QualVal = value?.ir1Qualification?.qualificationTable || [];
  const hemcoatQualVal = value?.hemcoat3kQualification?.qualificationTable || [];
  const inhibitionAppVal = value?.inhibitionApplicationDetails?.inhibitionApplicationTable || [];

  if (variant === "loose-flap-filling") {
    return (
      <Box>
        <SectionCard title="Bellow Removal Details" theme={theme}>
          <LocationDateTable
            basePath="bellowRemovalDetails.bellowRemovalTable"
            value={bellowRemovalVal}
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Loose Flap Epoxy Preparation Details" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <ControlledField
                name="looseFlapEpoxyPreparation.epoxyBatchNo"
                label="Batch No"
                required
              >
                {(field, hasError, errorMessage) => (
                  <TableTextInput
                    {...field}
                    value={field.value ?? value?.looseFlapEpoxyPreparation?.epoxyBatchNo ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                )}
              </ControlledField>
            </Box>
            <Box>
              <ControlledField
                name="looseFlapEpoxyPreparation.epoxyPreparationDate"
                label="Date of Preparation"
                required
              >
                {(field, hasError, errorMessage) => (
                  <DateField
                    {...field}
                    value={
                      field.value ?? value?.looseFlapEpoxyPreparation?.epoxyPreparationDate ?? ""
                    }
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                    compact
                  />
                )}
              </ControlledField>
            </Box>
          </FieldGrid>

          <IngredientQuantityTable
            basePath="looseFlapEpoxyPreparation.preparationDetails"
            value={looseFlapIngVal}
            qtyKey="quantity"
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="qualificationDetails"
            value={looseFlapQualVal}
            sectionValue={value?.qualificationDetails}
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="LF Epoxy Filling Details" theme={theme}>
          <LocationQtyTable
            basePath="lfEpoxyFillingDetails.lfFillingTable"
            value={lfFillingVal}
            qtyLabel="Quantity Filled"
            qtyKey="qtyFilled"
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
        <ControlledField name="inhibitionNotApplicable.remarks" label="Remarks" required>
          {(field, hasError, errorMessage) => (
            <TableTextInput
              {...field}
              value={field.value ?? value?.inhibitionNotApplicable?.remarks ?? ""}
              onChange={field.onChange}
              error={hasError}
              helperText={errorMessage}
              disabled={disabled}
              readOnly={readOnly}
              multiline
              minRows={4}
            />
          )}
        </ControlledField>
      </SectionCard>
    );
  }

  if (variant === "inhibition-ir1") {
    return (
      <Box>
        <SectionCard title="IR-1 Premix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <ControlledField name="ir1Premix.ir1PremixBatchNo" label="Batch No" required>
                {(field, hasError, errorMessage) => (
                  <TableTextInput
                    {...field}
                    value={field.value ?? value?.ir1Premix?.ir1PremixBatchNo ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                )}
              </ControlledField>
            </Box>
            <Box>
              <ControlledField name="ir1Premix.ir1PremixDate" label="Premix Date" required>
                {(field, hasError, errorMessage) => (
                  <DateField
                    {...field}
                    value={field.value ?? value?.ir1Premix?.ir1PremixDate ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                    compact
                  />
                )}
              </ControlledField>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="ir1Premix.ir1PremixTable"
            value={ir1PremixVal}
            qtyKey="qtyTaken"
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Final Mix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <ControlledField name="ir1FinalMix.ir1FinalMixBatchNo" label="Batch No" required>
                {(field, hasError, errorMessage) => (
                  <TableTextInput
                    {...field}
                    value={field.value ?? value?.ir1FinalMix?.ir1FinalMixBatchNo ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                )}
              </ControlledField>
            </Box>
            <Box>
              <ControlledField name="ir1FinalMix.ir1FinalMixDate" label="Final Mix Date" required>
                {(field, hasError, errorMessage) => (
                  <DateField
                    {...field}
                    value={field.value ?? value?.ir1FinalMix?.ir1FinalMixDate ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                    compact
                  />
                )}
              </ControlledField>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="ir1FinalMix.ir1FinalMixTable"
            value={ir1FinalMixVal}
            qtyKey="qtyTaken"
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="ir1Qualification"
            value={ir1QualVal}
            sectionValue={value?.ir1Qualification}
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <InhibitionSharedSections
          disabled={disabled}
          readOnly={readOnly}
          stationOptions={stationOptions}
          theme={theme}
          tableValue={inhibitionAppVal}
          value={value} // <--- Pass the full parent value object here
        />
      </Box>
    );
  }
  if (variant === "inhibition-hemcoat-3k") {
    // hemcoat-3k
    return (
      <Box>
        <SectionCard title="Hemcoat-3K Preparation" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <ControlledField
                name="hemcoat3kPreparation.hemcoatPremixBatchNo"
                label="Batch No"
                required
              >
                {(field, hasError, errorMessage) => (
                  <TableTextInput
                    {...field}
                    value={field.value ?? value?.hemcoat3kPreparation?.hemcoatPremixBatchNo ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                )}
              </ControlledField>
            </Box>
            <Box>
              <ControlledField
                name="hemcoat3kPreparation.hemcoatPremixDate"
                label="Premix Date"
                required
              >
                {(field, hasError, errorMessage) => (
                  <DateField
                    {...field}
                    value={field.value ?? value?.hemcoat3kPreparation?.hemcoatPremixDate ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                    compact
                  />
                )}
              </ControlledField>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="hemcoat3kPreparation.premixPreparationTable"
            value={hemcoatPremixVal}
            qtyKey="qtyTaken"
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Final Mix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <ControlledField
                name="hemcoat3kFinalMix.hemcoatFinalMixBatchNo"
                label="Batch No"
                required
              >
                {(field, hasError, errorMessage) => (
                  <TableTextInput
                    {...field}
                    value={field.value ?? value?.hemcoat3kFinalMix?.hemcoatFinalMixBatchNo ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                )}
              </ControlledField>
            </Box>
            <Box>
              <ControlledField
                name="hemcoat3kFinalMix.hemcoatFinalMixDate"
                label="Final Mix Date"
                required
              >
                {(field, hasError, errorMessage) => (
                  <DateField
                    {...field}
                    value={field.value ?? value?.hemcoat3kFinalMix?.hemcoatFinalMixDate ?? ""}
                    onChange={field.onChange}
                    error={hasError}
                    helperText={errorMessage}
                    disabled={disabled}
                    readOnly={readOnly}
                    compact
                  />
                )}
              </ControlledField>
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            basePath="hemcoat3kFinalMix.finalMixTable"
            value={hemcoatFinalMixVal}
            qtyKey="qtyTaken"
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            basePath="hemcoat3kQualification"
            value={hemcoatQualVal}
            sectionValue={value?.hemcoat3kQualification}
            disabled={disabled}
            readOnly={readOnly}
          />
        </SectionCard>

        <InhibitionSharedSections
          disabled={disabled}
          readOnly={readOnly}
          stationOptions={stationOptions}
          theme={theme}
          tableValue={inhibitionAppVal}
          value={value}
        />
      </Box>
    );
  }
};

export default PostCureMotorPanel;
