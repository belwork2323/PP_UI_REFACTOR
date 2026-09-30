import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Box,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  ABRADING_WHEEL_OPTIONS,
  LINER_TYPE_OPTIONS,
  PRE_HEATING_RECIPE_OPTIONS,
  VACUUM_BAGGING_OPTIONS,
  computeAbradingTotalDustWeight,
  syncPreHeatingTemperatureDurationRows,
  type CasePrepAbradingDetailsRow,
  type CasePrepIngredientRow,
  type CasePrepMotorData,
  type CasePrepParameterRow,
  type CasePrepQualificationParameterRow,
} from "../../../../../data/models/user/CasePrepMotorDataModel";
import {
  buildLinerIngredientTablesFromApi,
  isRecipeLinerType,
} from "../../../../../data/models/user/casePrepLinerRecipes";
import casePreparationController from "../../../../../controllers/user/manufacturing/casePreparationController";
import { useCasePrepLinerMaterials } from "../../../../../hooks/user/manufacturing/useCasePrepLinerMaterials";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import { DateTimeField, TimeField } from "../../../../components/common/DateField";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import CasePrepDateField from "./CasePrepDateField";
import CasePrepFileField from "./CasePrepFileField";
import CasePrepSelect from "./CasePrepSelect";
import CasePrepTextField from "./CasePrepTextField";
import {
  FieldGrid,
  FieldLabel,
  ParameterTable,
  ReadOnlyField,
  SectionCard,
  SubsectionHeading,
  TableTextInput,
  casePrepHeaderRowSx,
  casePrepTableCellSx,
  casePrepTableContainerSx,
  casePrepTableHeaderCellSx,
  casePrepTableInputSx,
  casePrepTableRowSx,
} from "./CasePrepFormPrimitives";
import type { CasePrepValidationErrors } from "../../../../../data/models/user/casePrepValidation";
import { casePrepFieldError } from "../../../../../data/models/user/casePrepValidation";

type Props = {
  value: CasePrepMotorData;
  onChange: (next: CasePrepMotorData) => void;
  motorId: string;
  batchId?: string;
  /** @deprecated Liner mix tables come from liner-type recipes, not the sheet. */
  materials?: unknown[];
  disabled?: boolean;
  readOnly?: boolean;
  /** Field path → message from validateCasePrepMotorData */
  validationErrors?: CasePrepValidationErrors;
  theme?: any;
};

const FieldErrorText = ({ message }: { message?: string }) =>
  message ? (
    <Typography sx={{ fontSize: "0.68rem", color: "error.main", mt: 0.35, lineHeight: 1.3 }}>
      {message}
    </Typography>
  ) : null;

const BRAND = CASE_PREP_BRAND;
const ABRADING_DUST_A = "Dust Weight (in gm) (A)";
const ABRADING_DUST_B = "Dust Weight (in gm) (B)";
const ABRADING_DUST_TOTAL = "Total Dust Weight (in gm) (A+B)";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const isAbradingHeader = (
  row: CasePrepAbradingDetailsRow,
): row is Extract<CasePrepAbradingDetailsRow, { type: "header" }> => row.type === "header";

const isAbradingTotalRow = (row: CasePrepAbradingDetailsRow) =>
  !isAbradingHeader(row) && str(row.operation).trim() === ABRADING_DUST_TOTAL;

const isAbradingStartRow = (row: CasePrepAbradingDetailsRow) =>
  !isAbradingHeader(row) && /^Start Date & Time$/i.test(str(row.operation).trim());

type AbradingCutRenderGroup = {
  headerIndex: number;
  headerLabel: string;
  /** Data row indices in this cut (excludes total dust). */
  dataIndices: number[];
  totalIndex: number | null;
};

const groupAbradingDetailsForRender = (
  rows: CasePrepAbradingDetailsRow[],
): AbradingCutRenderGroup[] => {
  const groups: AbradingCutRenderGroup[] = [];
  let current: AbradingCutRenderGroup | null = null;

  rows.forEach((row, index) => {
    if (isAbradingHeader(row)) {
      current = {
        headerIndex: index,
        headerLabel: row.label,
        dataIndices: [],
        totalIndex: null,
      };
      groups.push(current);
      return;
    }
    if (!current) return;
    if (isAbradingTotalRow(row)) {
      current.totalIndex = index;
      return;
    }
    current.dataIndices.push(index);
  });

  return groups;
};

const resolveAbradingCutObservation = (
  rows: CasePrepAbradingDetailsRow[],
  dataIndices: number[],
): string => {
  for (const index of dataIndices) {
    const row = rows[index];
    if (!row || isAbradingHeader(row)) continue;
    if (isAbradingStartRow(row) && str(row.remarksObservations).trim()) {
      return str(row.remarksObservations).trim();
    }
  }
  for (const index of dataIndices) {
    const row = rows[index];
    if (!row || isAbradingHeader(row)) continue;
    const remarks = str(row.remarksObservations).trim();
    if (remarks) return remarks;
  }
  return "";
};

const resolveAbradingCutAttachments = (
  rows: CasePrepAbradingDetailsRow[],
  dataIndices: number[],
): FileRef[] => {
  const merged: FileRef[] = [];
  const seen = new Set<string>();

  const collect = (preferStart: boolean) => {
    for (const index of dataIndices) {
      const row = rows[index];
      if (!row || isAbradingHeader(row)) continue;
      if (preferStart !== isAbradingStartRow(row)) continue;
      for (const ref of row.attachments ?? []) {
        const key = String(ref.fileId ?? ref.fileName ?? "").trim();
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        merged.push(ref);
      }
    }
  };

  // Prefer Start-row uploads (canonical), then any legacy per-row uploads.
  collect(true);
  collect(false);
  return merged;
};

const CompactDateTime = ({
  value,
  onChange,
  disabled,
  placeholder = "DD-MM-YYYY HH:mm",
  readOnly,
  required = false,
  dataCpField,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  required?: boolean;
  dataCpField?: string;
  error?: boolean;
}) => (
  <Box {...(dataCpField ? { "data-cp-field": dataCpField } : {})}>
    <DateTimeField
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      compact
      placeholder={placeholder}
      required={required}
      error={error}
      inputSx={casePrepTableInputSx}
    />
  </Box>
);

const CompactTime = ({
  value,
  onChange,
  disabled,
  readOnly,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
}) => (
  <TimeField
    value={value}
    onChange={onChange}
    disabled={disabled}
    readOnly={readOnly}
    compact
    error={error}
    inputSx={casePrepTableInputSx}
  />
);

const CompactDate = ({
  value,
  onChange,
  disabled,
  theme,
  readOnly,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme: any;
  error?: boolean;
}) => (
  <Box sx={{ minWidth: 0, "& > .MuiBox-root": { minWidth: 0, maxWidth: "100%" } }}>
    <CasePrepDateField
      label=""
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      theme={theme}
      error={error}
    />
  </Box>
);

const MultilineNoteField = ({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  minRows = 2,
  required = false,
  dataCpField,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  minRows?: number;
  required?: boolean;
  dataCpField?: string;
}) => (
  <Box
    sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
    {...(dataCpField ? { "data-cp-field": dataCpField } : {})}
  >
    <FieldLabel required={required}>{label}</FieldLabel>
    {readOnly ? (
      <WorkflowReadOnlyText value={value} sx={{ fontSize: "0.82rem", py: 0.75 }} />
    ) : (
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={minRows}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        sx={casePrepTableInputSx}
      />
    )}
  </Box>
);

const ValueByFieldType = ({
  value,
  valueFieldType,
  onChange,
  disabled,
  theme,
  readOnly,
  dataCpField,
  error = false,
}: {
  value: string;
  valueFieldType?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme: any;
  dataCpField?: string;
  error?: boolean;
}) => {
  const type = String(valueFieldType ?? "text").toLowerCase();
  const control =
    type === "datetime" ? (
      <CompactDateTime
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        error={error}
      />
    ) : type === "date" ? (
      <CompactDate
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        theme={theme}
        error={error}
      />
    ) : type === "time" ? (
      <CompactTime
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        error={error}
      />
    ) : type === "textarea" ? (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        multiline
        minRows={2}
        placeholder="Enter value"
        error={error}
      />
    ) : type === "number" ? (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        type="text"
        inputMode="decimal"
        placeholder="0"
        error={error}
      />
    ) : (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder="Enter value"
        error={error}
      />
    );

  if (!dataCpField) return control;
  return <Box data-cp-field={dataCpField}>{control}</Box>;
};

type MfgLotCellProps = {
  row: CasePrepIngredientRow;
  disabled?: boolean;
  readOnly?: boolean;
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
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (mfgLot: string) => void;
}) => (
  <TextField
    size="small"
    fullWidth
    placeholder="Enter lot no"
    disabled={disabled}
    value={value}
    onChange={(e) => onChange(String(e.target.value))}
    sx={casePrepTableInputSx}
  />
);

const MfgLotCell = ({
  row,
  disabled = false,
  readOnly = false,
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
      <WorkflowReadOnlyText
        value={currentLot || "—"}
        sx={{ fontSize: "0.78rem", py: 0.5 }}
      />
    );
  }

  // No material code, or fetch finished with zero approved lots → text only (never both).
  if (!hasCode || (fetched && !loading && apiLotCount === 0)) {
    return <MfgLotTextField value={currentLot} disabled={disabled} onChange={onChange} />;
  }

  const options = getCachedLotOptions(materialCode, currentLot);
  const selectValue =
    currentLot && options.some((opt) => opt.value === currentLot) ? currentLot : currentLot || "";

  return (
    <TextField
      select
      size="small"
      fullWidth
      disabled={disabled}
      value={selectValue}
      onChange={(e) => onChange(String(e.target.value))}
      sx={casePrepTableInputSx}
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
};

const CasePrepMotorPanel = ({
  value,
  onChange,
  motorId: _motorId,
  batchId: _batchId,
  materials: _materials,
  disabled = false,
  readOnly = false,
  validationErrors,
  theme,
}: Props) => {
  const err = (path: string) => casePrepFieldError(validationErrors, path);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const prevLinerTypeRef = useRef<string | null>(null);
  const ingredientsFetchGenRef = useRef(0);
  const fixedPartsSyncedForTypeRef = useRef<string | null>(null);
  const [fixedPartsFromApi, setFixedPartsFromApi] = useState<boolean | null>(null);
  const {
    fetchLotsForMaterialCode,
    getCachedLotOptions,
    getApiLotCount,
    hasFetchedLots,
    isLoadingLots,
  } = useCasePrepLinerMaterials();

  const patchSection = <K extends keyof CasePrepMotorData>(
    sectionKey: K,
    partial: Partial<CasePrepMotorData[K]>,
  ) => {
    onChange({
      ...value,
      [sectionKey]: {
        ...value[sectionKey],
        ...partial,
      },
    });
  };

  // Build / rebuild premix + final mix from liner-ingredients API.
  useEffect(() => {
    const linerType = str(value.linerCoatingOperation.linerType).trim();
    const prev = prevLinerTypeRef.current;
    const liner = valueRef.current.linerCoatingOperation;

    const applyTables = (
      premixIngredients: CasePrepIngredientRow[],
      finalMixIngredients: CasePrepIngredientRow[],
    ) => {
      onChangeRef.current({
        ...valueRef.current,
        linerCoatingOperation: {
          ...valueRef.current.linerCoatingOperation,
          premixIngredients,
          finalMixIngredients,
        },
      });
    };

    const loadFromApi = async (type: string, replaceTables: boolean) => {
      const gen = ++ingredientsFetchGenRef.current;
      if (!isRecipeLinerType(type)) {
        setFixedPartsFromApi(false);
        fixedPartsSyncedForTypeRef.current = type;
        if (replaceTables) applyTables([], []);
        return;
      }
      const result = await casePreparationController.fetchLinerIngredients(type);
      if (gen !== ingredientsFetchGenRef.current) return;
      if (!result.success || !result.data) {
        setFixedPartsFromApi(false);
        fixedPartsSyncedForTypeRef.current = type;
        if (replaceTables) applyTables([], []);
        return;
      }
      setFixedPartsFromApi(Boolean(result.data.fixedPartsByWeight));
      fixedPartsSyncedForTypeRef.current = type;
      if (replaceTables) {
        const built = buildLinerIngredientTablesFromApi(result.data);
        applyTables(built.premixIngredients, built.finalMixIngredients);
      }
    };

    // User changed liner type → rebuild from API (or clear for OTHERS).
    if (prev !== null && prev !== linerType) {
      prevLinerTypeRef.current = linerType;
      setFixedPartsFromApi(null);
      fixedPartsSyncedForTypeRef.current = null;
      void loadFromApi(linerType, true);
      return;
    }

    if (prev === null) {
      prevLinerTypeRef.current = linerType;
    }

    const premix = liner.premixIngredients ?? [];
    const finalMix = liner.finalMixIngredients ?? [];

    // Empty tables + recipe type → seed from API.
    if (!premix.length && !finalMix.length && isRecipeLinerType(linerType)) {
      void loadFromApi(linerType, true);
      return;
    }

    // Existing rows (e.g. hydrated form) → sync fixedParts flag without wiping lots/qty.
    if (
      isRecipeLinerType(linerType) &&
      (premix.length || finalMix.length) &&
      fixedPartsSyncedForTypeRef.current !== linerType
    ) {
      void loadFromApi(linerType, false);
    }
  }, [value.linerCoatingOperation.linerType]);

  const updateAbradingDetails = (rows: CasePrepAbradingDetailsRow[]) => {
    patchSection("abradingOperation", {
      abradingDetails: computeAbradingTotalDustWeight(rows),
    });
  };

  const updateAbradingDataRow = (
    index: number,
    patch: Partial<Extract<CasePrepAbradingDetailsRow, { operation?: string }>>,
  ) => {
    const next = value.abradingOperation.abradingDetails.map((row, i) => {
      if (i !== index || isAbradingHeader(row)) return row;
      return { ...row, ...patch };
    });

    const operation = str(
      !isAbradingHeader(value.abradingOperation.abradingDetails[index])
        ? (value.abradingOperation.abradingDetails[index] as { operation?: string }).operation
        : "",
    ).trim();

    if (
      patch.value !== undefined &&
      (operation === ABRADING_DUST_A || operation === ABRADING_DUST_B)
    ) {
      updateAbradingDetails(next);
      return;
    }
    patchSection("abradingOperation", { abradingDetails: next });
  };

  /** One observation per cut — stored on the Start Date & Time row. */
  const updateAbradingCutObservation = (dataIndices: number[], observation: string) => {
    const next = value.abradingOperation.abradingDetails.map((row, index) => {
      if (isAbradingHeader(row) || !dataIndices.includes(index)) return row;
      return {
        ...row,
        remarksObservations: isAbradingStartRow(row) ? observation : "",
      };
    });
    patchSection("abradingOperation", { abradingDetails: next });
  };

  /** One attachment list per cut — stored on the Start Date & Time row. */
  const updateAbradingCutAttachments = (dataIndices: number[], attachments: FileRef[]) => {
    const next = value.abradingOperation.abradingDetails.map((row, index) => {
      if (isAbradingHeader(row) || !dataIndices.includes(index)) return row;
      return {
        ...row,
        attachments: isAbradingStartRow(row) ? attachments : [],
      };
    });
    patchSection("abradingOperation", { abradingDetails: next });
  };

  const patchPreHeating = (partial: Partial<CasePrepMotorData["preHeating"]>) => {
    const next: CasePrepMotorData = {
      ...value,
      preHeating: {
        ...value.preHeating,
        ...partial,
      },
    };
    if (partial.preHeatingRecipe !== undefined || partial.otherDuration !== undefined) {
      onChange(syncPreHeatingTemperatureDurationRows(next));
      return;
    }
    onChange(next);
  };

  const updateParameterRow = (
    sectionKey: "preHeating" | "linerCoatingOperation" | "dispatchToCasting",
    listKey: string,
    index: number,
    patch: Partial<CasePrepParameterRow>,
  ) => {
    const section = value[sectionKey] as Record<string, unknown>;
    const rows = Array.isArray(section[listKey])
      ? ([...section[listKey]] as CasePrepParameterRow[])
      : [];
    rows[index] = { ...rows[index], ...patch };
    onChange({
      ...value,
      [sectionKey]: {
        ...section,
        [listKey]: rows,
      },
    });
  };

  const updateIngredientRow = (
    listKey: "premixIngredients" | "finalMixIngredients",
    index: number,
    patch: Partial<CasePrepIngredientRow>,
  ) => {
    const rows = value.linerCoatingOperation[listKey].map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchSection("linerCoatingOperation", { [listKey]: rows });
  };

  const updateQualificationRow = (
    index: number,
    patch: Partial<CasePrepQualificationParameterRow>,
  ) => {
    const rows = value.linerCoatingOperation.qualificationParameters.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchSection("linerCoatingOperation", { qualificationParameters: rows });
  };

  const addQualificationRow = () => {
    const rows = value.linerCoatingOperation.qualificationParameters;
    patchSection("linerCoatingOperation", {
      qualificationParameters: [
        ...rows,
        {
          srNo: rows.length + 1,
          parameter: "",
          specification: "",
          result: "",
          readonly: false,
        },
      ],
    });
  };

  const deleteQualificationRow = (index: number) => {
    const rows = value.linerCoatingOperation.qualificationParameters
      .filter((_, i) => i !== index)
      .map((row, i) => ({ ...row, srNo: i + 1 }));
    patchSection("linerCoatingOperation", { qualificationParameters: rows });
  };

  const renderParamValue = (
    row: { value?: string; valueFieldType?: string },
    onValue: (v: string) => void,
    fieldPath: string,
  ) => {
    const message = err(fieldPath);
    return (
      <>
        <ValueByFieldType
          value={row.value ?? ""}
          valueFieldType={row.valueFieldType}
          onChange={onValue}
          disabled={disabled}
          readOnly={readOnly}
          theme={theme}
          dataCpField={fieldPath}
          error={Boolean(message)}
        />
        <FieldErrorText message={message} />
      </>
    );
  };

  const fixedPartsByWeight = Boolean(fixedPartsFromApi);

  const ingredientTable = (
    title: string,
    listKey: "premixIngredients" | "finalMixIngredients",
  ): ReactNode => {
    const rows = value.linerCoatingOperation[listKey];
    return (
      <Box sx={{ mb: 2 }}>
        <SubsectionHeading>{title}</SubsectionHeading>
        <TableContainer sx={casePrepTableContainerSx}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                {["Sr No", "Ingredient", "Mfg Lot", "Parts by Wt.", "Qty Taken", "Total Qty"].map(
                  (label, idx) => (
                    <TableCell key={label} sx={casePrepTableHeaderCellSx(idx === 0)}>
                      {label}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ ...casePrepTableCellSx, color: BRAND.textSub, textAlign: "center" }}
                  >
                    {str(value.linerCoatingOperation.linerType).trim()
                      ? "No ingredients for this liner type"
                      : "Select liner type to load ingredients"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={`${listKey}-${index}`} sx={casePrepTableRowSx(index)}>
                    <TableCell sx={casePrepTableCellSx}>{row.srNo || index + 1}</TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <WorkflowReadOnlyText
                        value={row.ingredient || row.materialName || "—"}
                        sx={{ fontSize: "0.78rem", py: 0.5 }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...casePrepTableCellSx, minWidth: 160 }}>
                      <MfgLotCell
                        row={row}
                        disabled={disabled}
                        readOnly={readOnly}
                        onChange={(mfgLot) => updateIngredientRow(listKey, index, { mfgLot })}
                        fetchLotsForMaterialCode={fetchLotsForMaterialCode}
                        getCachedLotOptions={getCachedLotOptions}
                        getApiLotCount={getApiLotCount}
                        hasFetchedLots={hasFetchedLots}
                        isLoadingLots={isLoadingLots}
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.partsByWeight}
                        onChange={(v) => updateIngredientRow(listKey, index, { partsByWeight: v })}
                        disabled={disabled || fixedPartsByWeight}
                        readOnly={readOnly || fixedPartsByWeight}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.quantityTaken}
                        onChange={(v) => updateIngredientRow(listKey, index, { quantityTaken: v })}
                        disabled={disabled}
                        readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.totalQuantity}
                        onChange={(v) => updateIngredientRow(listKey, index, { totalQuantity: v })}
                        disabled={disabled}
                        readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const abrading = value.abradingOperation;
  const bellow = value.bellowBonding;
  const tce = value.tceCleaning;
  const preHeating = value.preHeating;
  const liner = value.linerCoatingOperation;
  const dispatch = value.dispatchToCasting;

  const showVacuumApplied = str(preHeating.vacuumBaggingApplied).toUpperCase() === "YES";
  const showOtherRecipe = str(preHeating.preHeatingRecipe).toUpperCase() === "OTHERS";
  const showOtherLiner = str(liner.linerType).toUpperCase() === "OTHERS";

  return (
    <Box>
      {/* 1. Abrading Operation */}
      <SectionCard title="Abrading Operation" theme={theme}>
        <SubsectionHeading>Abrading Configuration</SubsectionHeading>
        <FieldGrid columns={3}>
          <ReadOnlyField
            label="Type of Casing"
            value={abrading.typeOfCasing}
            error={err("abradingOperation.typeOfCasing")}
          />
          <ReadOnlyField
            label="Type of Insulation"
            value={abrading.typeOfInsulation}
            error={err("abradingOperation.typeOfInsulation")}
          />
          <Box>
            <CasePrepSelect
              label="Abrading Wheel Type"
              value={abrading.abradingWheelType}
              placeholder="Select wheel type"
              options={[...ABRADING_WHEEL_OPTIONS]}
              onChange={(v) => patchSection("abradingOperation", { abradingWheelType: v })}
              disabled={disabled}
              readOnly={readOnly}
              required
              theme={theme}
              error={Boolean(err("abradingOperation.abradingWheelType"))}
              dataCpField="abradingOperation.abradingWheelType"
            />
            <FieldErrorText message={err("abradingOperation.abradingWheelType")} />
          </Box>
        </FieldGrid>

        <SubsectionHeading>Abrading Details</SubsectionHeading>
        <TableContainer sx={casePrepTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Operation", "Value", "Observations", "Attachments"].map((label, idx) => (
                  <TableCell key={label} sx={casePrepTableHeaderCellSx(idx === 0)}>
                    {label === "Value" ? (
                      <>
                        {label}
                        <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                          *
                        </Typography>
                      </>
                    ) : (
                      label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {groupAbradingDetailsForRender(abrading.abradingDetails).map((group) => {
                const cutObservation = resolveAbradingCutObservation(
                  abrading.abradingDetails,
                  group.dataIndices,
                );
                const cutAttachments = resolveAbradingCutAttachments(
                  abrading.abradingDetails,
                  group.dataIndices,
                );
                const cutRowSpan = Math.max(group.dataIndices.length, 1);

                return (
                  <Fragment key={`cut-${group.headerIndex}`}>
                    <TableRow sx={casePrepHeaderRowSx}>
                      <TableCell
                        colSpan={4}
                        sx={{
                          ...casePrepTableCellSx,
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          color: BRAND.cp,
                        }}
                      >
                        {group.headerLabel}
                      </TableCell>
                    </TableRow>
                    {group.dataIndices.map((index, rowOffset) => {
                      const row = abrading.abradingDetails[index];
                      if (!row || isAbradingHeader(row)) return null;
                      return (
                        <TableRow key={`abr-${index}`} sx={casePrepTableRowSx(index)}>
                          <TableCell sx={{ ...casePrepTableCellSx, fontWeight: 600 }}>
                            {row.operation}
                          </TableCell>
                          <TableCell sx={casePrepTableCellSx}>
                            <ValueByFieldType
                              value={row.value}
                              valueFieldType={row.valueFieldType}
                              onChange={(v) => updateAbradingDataRow(index, { value: v })}
                              disabled={disabled}
                              readOnly={readOnly}
                              theme={theme}
                              dataCpField={`abradingOperation.abradingDetails.${index}.value`}
                              error={Boolean(
                                err(`abradingOperation.abradingDetails.${index}.value`),
                              )}
                            />
                            <FieldErrorText
                              message={err(`abradingOperation.abradingDetails.${index}.value`)}
                            />
                          </TableCell>
                          {rowOffset === 0 ? (
                            <TableCell
                              sx={{ ...casePrepTableCellSx, verticalAlign: "top" }}
                              rowSpan={cutRowSpan}
                            >
                              <TableTextInput
                                value={cutObservation}
                                onChange={(v) => updateAbradingCutObservation(group.dataIndices, v)}
                                disabled={disabled}
                                readOnly={readOnly}
                                placeholder="Observations"
                                multiline
                                minRows={Math.max(cutRowSpan, 2)}
                              />
                            </TableCell>
                          ) : null}
                          {rowOffset === 0 ? (
                            <TableCell
                              sx={{ ...casePrepTableCellSx, verticalAlign: "top" }}
                              rowSpan={cutRowSpan}
                            >
                              <CasePrepFileField
                                files={cutAttachments}
                                onChange={(next) =>
                                  updateAbradingCutAttachments(group.dataIndices, next)
                                }
                                disabled={disabled}
                                readOnly={readOnly}
                                compact
                                multiple
                                acceptMode="imageVideo"
                              />
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                    {group.totalIndex != null
                      ? (() => {
                          const totalRow = abrading.abradingDetails[group.totalIndex!];
                          if (!totalRow || isAbradingHeader(totalRow)) return null;
                          return (
                            <TableRow
                              key={`abr-total-${group.totalIndex}`}
                              sx={casePrepTableRowSx(group.totalIndex!)}
                            >
                              <TableCell sx={{ ...casePrepTableCellSx, fontWeight: 600 }}>
                                {totalRow.operation}
                              </TableCell>
                              <TableCell sx={casePrepTableCellSx}>
                                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                                  {totalRow.value || "—"}
                                </Typography>
                              </TableCell>
                              <TableCell sx={casePrepTableCellSx}>
                                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                  —
                                </Typography>
                              </TableCell>
                              <TableCell sx={casePrepTableCellSx}>
                                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                  —
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })()
                      : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      {/* 2. Bellow Bonding */}
      <SectionCard title="Bellow Bonding" theme={theme}>
        <SubsectionHeading>Adhesive Details</SubsectionHeading>
        <FieldGrid columns={2}>
          <CasePrepTextField
            label="Adhesive Details"
            value={bellow.adhesiveDetails}
            onChange={(v) => patchSection("bellowBonding", { adhesiveDetails: v })}
            disabled={disabled}
            readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <Box>
            <CasePrepTextField
              label="Number of Spacers"
              value={bellow.numberOfSpacers}
              onChange={(v) => patchSection("bellowBonding", { numberOfSpacers: v })}
              disabled={disabled}
              readOnly={readOnly}
              theme={theme}
              width="100%"
              required
              dataCpField="bellowBonding.numberOfSpacers"
            />
            <FieldErrorText message={err("bellowBonding.numberOfSpacers")} />
          </Box>
          <Box>
            <CasePrepTextField
              label="HE Bellow Dimension"
              value={bellow.heBellowDimension}
              onChange={(v) => patchSection("bellowBonding", { heBellowDimension: v })}
              disabled={disabled}
              readOnly={readOnly}
              theme={theme}
              width="100%"
              required
              dataCpField="bellowBonding.heBellowDimension"
            />
            <FieldErrorText message={err("bellowBonding.heBellowDimension")} />
          </Box>
          <Box>
            <FieldLabel required>HE Motor Pasting Date & Time</FieldLabel>
            <CompactDateTime
              value={bellow.heMotorPastingDateTime}
              onChange={(v) => patchSection("bellowBonding", { heMotorPastingDateTime: v })}
              disabled={disabled}
              readOnly={readOnly}
              required
              dataCpField="bellowBonding.heMotorPastingDateTime"
            />
            <FieldErrorText message={err("bellowBonding.heMotorPastingDateTime")} />
          </Box>
          <Box>
            <CasePrepTextField
              label="NE Bellow Dimension"
              value={bellow.neBellowDimension}
              onChange={(v) => patchSection("bellowBonding", { neBellowDimension: v })}
              disabled={disabled}
              readOnly={readOnly}
              theme={theme}
              width="100%"
              required
              dataCpField="bellowBonding.neBellowDimension"
            />
            <FieldErrorText message={err("bellowBonding.neBellowDimension")} />
          </Box>
          <Box>
            <FieldLabel required>NE Motor Pasting Date & Time</FieldLabel>
            <CompactDateTime
              value={bellow.neMotorPastingDateTime}
              onChange={(v) => patchSection("bellowBonding", { neMotorPastingDateTime: v })}
              disabled={disabled}
              readOnly={readOnly}
              required
              dataCpField="bellowBonding.neMotorPastingDateTime"
            />
            <FieldErrorText message={err("bellowBonding.neMotorPastingDateTime")} />
          </Box>
        </FieldGrid>
        <FieldGrid columns={2}>
          <MultilineNoteField
            label="Pasting Details"
            value={bellow.pastingDetails}
            onChange={(v) => patchSection("bellowBonding", { pastingDetails: v })}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Pasting details"
          />
          <MultilineNoteField
            label="Remarks"
            value={bellow.remarks}
            onChange={(v) => patchSection("bellowBonding", { remarks: v })}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Remarks"
          />
        </FieldGrid>
      </SectionCard>

      {/* 3. TCE Cleaning */}
      <SectionCard title="TCE Cleaning" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabel required>TCE Cleaning Date & Time</FieldLabel>
            <CompactDateTime
              value={tce.tceCleaningDateTime}
              onChange={(v) => patchSection("tceCleaning", { tceCleaningDateTime: v })}
              disabled={disabled}
              readOnly={readOnly}
              required
              dataCpField="tceCleaning.tceCleaningDateTime"
            />
            <FieldErrorText message={err("tceCleaning.tceCleaningDateTime")} />
          </Box>
          <Box>
            <CasePrepTextField
              label="Solvent Used Qty (kg)"
              value={tce.solventUsedQtyKg}
              onChange={(v) => patchSection("tceCleaning", { solventUsedQtyKg: v })}
              disabled={disabled}
              readOnly={readOnly}
              theme={theme}
              width="100%"
              placeholder="0"
              required
              dataCpField="tceCleaning.solventUsedQtyKg"
            />
            <FieldErrorText message={err("tceCleaning.solventUsedQtyKg")} />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <MultilineNoteField
              label="Observation"
              value={tce.observation}
              onChange={(v) => patchSection("tceCleaning", { observation: v })}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="Observation"
              minRows={3}
              required
              dataCpField="tceCleaning.observation"
            />
            <FieldErrorText message={err("tceCleaning.observation")} />
          </Box>
          <CasePrepFileField
            label="Test Report"
            files={tce.testReport ? [tce.testReport] : []}
            onChange={(next) => patchSection("tceCleaning", { testReport: next[0] ?? null })}
            disabled={disabled}
            readOnly={readOnly}
            multiple={false}
            acceptMode="imageVideoPdf"
          />
        </FieldGrid>
      </SectionCard>

      {/* 4. Pre-heating */}
      <SectionCard title="Pre-heating" theme={theme}>
        <FieldGrid columns={3}>
          <Box>
            <CasePrepSelect
              label="Vacuum Bagging Applied"
              value={preHeating.vacuumBaggingApplied}
              placeholder="Select"
              options={[...VACUUM_BAGGING_OPTIONS]}
              onChange={(v) =>
                patchPreHeating({
                  vacuumBaggingApplied: v,
                  ...(v.toUpperCase() !== "YES" ? { vacuumApplied: "" } : {}),
                })
              }
              disabled={disabled}
              readOnly={readOnly}
              required
              theme={theme}
              dataCpField="preHeating.vacuumBaggingApplied"
            />
            <FieldErrorText message={err("preHeating.vacuumBaggingApplied")} />
          </Box>
          {showVacuumApplied ? (
            <Box>
              <CasePrepTextField
                label="Vacuum Applied"
                value={preHeating.vacuumApplied}
                onChange={(v) => patchPreHeating({ vacuumApplied: v })}
                disabled={disabled}
                readOnly={readOnly}
                theme={theme}
                width="100%"
                required
                dataCpField="preHeating.vacuumApplied"
              />
              <FieldErrorText message={err("preHeating.vacuumApplied")} />
            </Box>
          ) : null}
          <Box>
            <CasePrepSelect
              label="Pre-heating Recipe"
              value={preHeating.preHeatingRecipe}
              placeholder="Select recipe"
              options={[...PRE_HEATING_RECIPE_OPTIONS]}
              onChange={(v) =>
                patchPreHeating({
                  preHeatingRecipe: v,
                  ...(v.toUpperCase() !== "OTHERS"
                    ? { otherTemperature: "", otherDuration: "" }
                    : {}),
                })
              }
              disabled={disabled}
              readOnly={readOnly}
              required
              theme={theme}
              dataCpField="preHeating.preHeatingRecipe"
            />
            <FieldErrorText message={err("preHeating.preHeatingRecipe")} />
          </Box>
          {showOtherRecipe ? (
            <>
              <CasePrepTextField
                label="Other Temperature"
                value={preHeating.otherTemperature}
                onChange={(v) => patchPreHeating({ otherTemperature: v })}
                disabled={disabled}
                readOnly={readOnly}
                theme={theme}
                width="100%"
                required
              />
              <CasePrepTextField
                label="Other Duration (hrs)"
                value={preHeating.otherDuration}
                onChange={(v) => patchPreHeating({ otherDuration: v })}
                disabled={disabled}
                readOnly={readOnly}
                theme={theme}
                width="100%"
                placeholder="Hours"
                required
              />
            </>
          ) : null}
          <CasePrepDateField
            label="Pre-heating Date"
            value={preHeating.preHeatingDate ?? ""}
            onChange={(v) => patchPreHeating({ preHeatingDate: v })}
            disabled={disabled}
            readOnly={readOnly}
            theme={theme}
          />
        </FieldGrid>

        <Box sx={{ mb: 2 }}>
          <SubsectionHeading>Temperature Duration</SubsectionHeading>
          <ParameterTable
            rows={preHeating.temperatureDuration}
            requiredValue
            disabled={disabled}
            readOnly={readOnly}
            emptyText="Select a recipe to generate temperature rows"
            onChangeValue={(index, v) =>
              updateParameterRow("preHeating", "temperatureDuration", index, { value: v })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("preHeating", "temperatureDuration", index, { remarks: v })
            }
            renderValue={(row, index) =>
              renderParamValue(
                row,
                (v) =>
                  updateParameterRow("preHeating", "temperatureDuration", index, { value: v }),
                `preHeating.temperatureDuration.${index}.value`,
              )
            }
          />
        </Box>

        <Box>
          <SubsectionHeading>Pre-heating Monitoring</SubsectionHeading>
          <ParameterTable
            rows={preHeating.preHeatingMonitoring}
            requiredValue
            disabled={disabled}
            readOnly={readOnly}
            onChangeValue={(index, v) =>
              updateParameterRow("preHeating", "preHeatingMonitoring", index, { value: v })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("preHeating", "preHeatingMonitoring", index, { remarks: v })
            }
            renderValue={(row, index) =>
              renderParamValue(
                row,
                (v) =>
                  updateParameterRow("preHeating", "preHeatingMonitoring", index, { value: v }),
                `preHeating.preHeatingMonitoring.${index}.value`,
              )
            }
          />
        </Box>
      </SectionCard>

      {/* 5. Liner Coating */}
      <SectionCard title="Liner Coating Operation" theme={theme}>
        <FieldGrid columns={3}>
          <Box>
            <CasePrepSelect
              label="Liner Type"
              value={str(liner.linerType).trim()}
              placeholder="Select liner type"
              options={[...LINER_TYPE_OPTIONS]}
              onChange={(v) =>
                patchSection("linerCoatingOperation", {
                  linerType: v,
                  ...(v.toUpperCase() !== "OTHERS" ? { otherLinerType: "" } : {}),
                })
              }
              disabled={disabled}
              readOnly={readOnly}
              required
              theme={theme}
              dataCpField="linerCoatingOperation.linerType"
            />
            <FieldErrorText message={err("linerCoatingOperation.linerType")} />
          </Box>
          {showOtherLiner ? (
            <Box>
              <CasePrepTextField
                label="Other Liner Type"
                value={liner.otherLinerType}
                onChange={(v) => patchSection("linerCoatingOperation", { otherLinerType: v })}
                disabled={disabled}
                readOnly={readOnly}
                theme={theme}
                width="100%"
                required
                dataCpField="linerCoatingOperation.otherLinerType"
              />
              <FieldErrorText message={err("linerCoatingOperation.otherLinerType")} />
            </Box>
          ) : null}
          <Box>
            <CasePrepTextField
              label="Batch No"
              value={liner.batchNo}
              onChange={(v) => patchSection("linerCoatingOperation", { batchNo: v })}
              disabled={disabled}
              readOnly={readOnly}
              theme={theme}
              width="100%"
              required
              dataCpField="linerCoatingOperation.batchNo"
            />
            <FieldErrorText message={err("linerCoatingOperation.batchNo")} />
          </Box>
          <ReadOnlyField label="Batch Size" value={liner.batchSize} />
          <Box>
            <CasePrepTextField
              label="Qualifying Subscale Batch No"
              value={liner.qualifyingSubscaleBatchNo}
              onChange={(v) =>
                patchSection("linerCoatingOperation", { qualifyingSubscaleBatchNo: v })
              }
              disabled={disabled}
              readOnly={readOnly}
              theme={theme}
              width="100%"
              required
              dataCpField="linerCoatingOperation.qualifyingSubscaleBatchNo"
            />
            <FieldErrorText message={err("linerCoatingOperation.qualifyingSubscaleBatchNo")} />
          </Box>
          <CasePrepDateField
            label="Liner Coating Date"
            value={liner.linerCoatingDate ?? ""}
            onChange={(v) => patchSection("linerCoatingOperation", { linerCoatingDate: v })}
            disabled={disabled}
            readOnly={readOnly}
            theme={theme}
          />
        </FieldGrid>

        {ingredientTable("Premix Ingredients", "premixIngredients")}
        {ingredientTable("Final Mix Ingredients", "finalMixIngredients")}

        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <SubsectionHeading>Qualification Parameters</SubsectionHeading>
            {!disabled && !readOnly ? (
              <Typography
                component="button"
                type="button"
                onClick={addQualificationRow}
                sx={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: BRAND.cp,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  p: 0,
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                Add row
              </Typography>
            ) : null}
          </Stack>
          <TableContainer sx={casePrepTableContainerSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Sr No", "Parameter", "Specification", "Result", ""].map((label, idx) => (
                    <TableCell key={`${label}-${idx}`} sx={casePrepTableHeaderCellSx(idx === 0)}>
                      {label === "Result" ? (
                        <>
                          {label}
                          <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                            *
                          </Typography>
                        </>
                      ) : (
                        label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {liner.qualificationParameters.map((row, index) => (
                  <TableRow key={`qual-${index}`} sx={casePrepTableRowSx(index)}>
                    <TableCell sx={casePrepTableCellSx}>{row.srNo || index + 1}</TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {row.readonly ? (
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          {row.parameter}
                        </Typography>
                      ) : (
                        <TableTextInput
                          value={row.parameter}
                          onChange={(v) => updateQualificationRow(index, { parameter: v })}
                          disabled={disabled}
                          readOnly={readOnly}
                          dataCpField={`linerCoatingOperation.qualificationParameters.${index}.parameter`}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {row.readonly ? (
                        <Typography sx={{ fontSize: "0.82rem" }}>{row.specification}</Typography>
                      ) : (
                        <TableTextInput
                          value={row.specification}
                          onChange={(v) => updateQualificationRow(index, { specification: v })}
                          disabled={disabled}
                          readOnly={readOnly}
                          dataCpField={`linerCoatingOperation.qualificationParameters.${index}.specification`}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.result}
                        onChange={(v) => updateQualificationRow(index, { result: v })}
                        disabled={disabled}
                        readOnly={readOnly}
                        placeholder="Result"
                        dataCpField={`linerCoatingOperation.qualificationParameters.${index}.result`}
                      />
                      <FieldErrorText
                        message={err(
                          `linerCoatingOperation.qualificationParameters.${index}.result`,
                        )}
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {!disabled && !readOnly && !row.readonly ? (
                        <IconButton
                          size="small"
                          onClick={() => deleteQualificationRow(index)}
                          aria-label="Delete row"
                          sx={{ color: BRAND.danger }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <SubsectionHeading>Liner Application Log</SubsectionHeading>
          <ParameterTable
            rows={liner.linerApplicationLog}
            requiredValue
            disabled={disabled}
            readOnly={readOnly}
            onChangeValue={(index, v) =>
              updateParameterRow("linerCoatingOperation", "linerApplicationLog", index, {
                value: v,
              })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("linerCoatingOperation", "linerApplicationLog", index, {
                remarks: v,
              })
            }
            renderValue={(row, index) =>
              renderParamValue(
                row,
                (v) =>
                  updateParameterRow("linerCoatingOperation", "linerApplicationLog", index, {
                    value: v,
                  }),
                `linerCoatingOperation.linerApplicationLog.${index}.value`,
              )
            }
          />
        </Box>
      </SectionCard>

      {/* 6. Dispatch To Casting */}
      <SectionCard title="Dispatch To Casting" theme={theme} mb={0}>
        <Box sx={{ mb: 2 }}>
          <SubsectionHeading>Visual Observations</SubsectionHeading>
          <ParameterTable
            columns={[
              { key: "parameter", label: "Parameter", width: "36%" },
              { key: "observations", label: "Observations" },
              { key: "remarks", label: "Remarks" },
            ]}
            rows={dispatch.dispatchVisualObservations}
            requiredValue
            disabled={disabled}
            readOnly={readOnly}
            onChangeObservations={(index, v) => {
              const rows = dispatch.dispatchVisualObservations.map((row, i) =>
                i === index ? { ...row, observations: v } : row,
              );
              patchSection("dispatchToCasting", { dispatchVisualObservations: rows });
            }}
            onChangeRemarks={(index, v) => {
              const rows = dispatch.dispatchVisualObservations.map((row, i) =>
                i === index ? { ...row, remarks: v } : row,
              );
              patchSection("dispatchToCasting", { dispatchVisualObservations: rows });
            }}
            getObservationsFieldPath={(index) =>
              `dispatchToCasting.dispatchVisualObservations.${index}.observations`
            }
            getObservationsError={(index) =>
              err(`dispatchToCasting.dispatchVisualObservations.${index}.observations`)
            }
          />
        </Box>

        <Box>
          <SubsectionHeading>Dispatch Details</SubsectionHeading>
          <ParameterTable
            rows={dispatch.dispatchToCastingDetails}
            requiredValue
            disabled={disabled}
            readOnly={readOnly}
            onChangeValue={(index, v) =>
              updateParameterRow("dispatchToCasting", "dispatchToCastingDetails", index, {
                value: v,
              })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("dispatchToCasting", "dispatchToCastingDetails", index, {
                remarks: v,
              })
            }
            renderValue={(row, index) =>
              renderParamValue(
                row,
                (v) =>
                  updateParameterRow("dispatchToCasting", "dispatchToCastingDetails", index, {
                    value: v,
                  }),
                `dispatchToCasting.dispatchToCastingDetails.${index}.value`,
              )
            }
          />
        </Box>
      </SectionCard>
    </Box>
  );
};

export default CasePrepMotorPanel;
