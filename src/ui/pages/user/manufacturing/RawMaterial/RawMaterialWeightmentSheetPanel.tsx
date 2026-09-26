import {
  alpha,
  Box,
  Button,
  Checkbox,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import { useEffect, useMemo, useState } from "react";

import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import {
  createEmptyWeightmentDetail,
  type RawMaterialPrepWeightmentDetail,
  type RawMaterialPrepWeightmentSheet,
} from "../../../../../data/models/user/RawMaterialPreparationModel";
import type { IdentificationSheet } from "../../../../../data/models/admin/BatchManagement/BatchManagementModel";
import { batchManagementController } from "../../../../../controllers/admin/BatchManagement/batchManagementController";
import {
  findSheetMaterialForWeightmentRow,
  formatSheetMaterialLabel,
  getExpectedWeightmentForSheetMaterial,
  getWeightmentRowSheetKey,
  normalizeSheetMaterialsForWeightmentCompare,
  validateWeightmentRowAgainstSheet,
  weightmentRowsHaveSheetDeviations,
  type WeightmentRowFieldErrors,
} from "../../../../../data/models/user/rawMaterialWeightmentValidation";
import {
  weightmentMixerBuildingPath,
  weightmentPath,
} from "../../../../../data/validation/adapters/rawMaterialPreparation.validation";
import type { ValidationErrors } from "../../../../../data/validation/submissionIntent";
import useValidationDisplay, {
  type ValidationAttemptFlags,
} from "../../../../components/validation/useValidationDisplay";
import IdentificationSheetCollapsible from "./components/IdentificationSheetCollapsible";
import {
  WeightmentSelectField,
  WeightmentTableInput,
  WeightmentTextField,
} from "./components/RawMaterialWeightmentFormFields";
import { useBuildingOptions } from "../../../../../hooks/user/useBuildingOptions";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const CONTAINER_TYPES = ["Drum", "Bin", "Bag", "Other"];
const { info: InfoOutlinedIcon } = icons.user.manufacturing.rawMaterial.builderPage;

const checkboxLabelSx = {
  fontSize: "0.78rem",
  lineHeight: 1.35,
  fontWeight: 600,
};

const validationMessages = {
  materialNotInSheet: RM.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
  nameMismatch: RM.WEIGHTMENT_NAME_MISMATCH,
  percentageMismatch: RM.WEIGHTMENT_PERCENTAGE_MISMATCH,
  weightMismatch: RM.WEIGHTMENT_WEIGHT_MISMATCH,
};

const TABLE_COLUMNS = [
  RM.WEIGHTMENT_TABLE_COL_MATERIAL_CODE,
  RM.WEIGHTMENT_TABLE_COL_MATERIAL_NAME,
  RM.WEIGHTMENT_TABLE_COL_CONTAINER_TYPE,
  RM.WEIGHTMENT_TABLE_COL_CONTAINER_NO,
  RM.WEIGHTMENT_TABLE_COL_WEIGH_SCALE,
  RM.WEIGHTMENT_TABLE_COL_WEIGHT,
  RM.WEIGHTMENT_TABLE_COL_WEIGHING_TIME,
] as const;

type RawMaterialWeightmentSheetPanelProps = {
  value: RawMaterialPrepWeightmentSheet;
  onChange: (
    next:
      | RawMaterialPrepWeightmentSheet
      | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
  ) => void;
  /**
   * Optional validation-only updater (QC). Compare / deviation checkboxes must use this
   * so filtered merge paths never rewrite weighment detail rows.
   */
  onValidationChange?: (
    patch: Partial<RawMaterialPrepWeightmentSheet["validation"]>,
  ) => void;
  theme: any;
  batchId?: string;
  identificationSheet?: IdentificationSheet | null;
  /** Shared across premixes — false when any premix is waiting for approval / approved. */
  disabled?: boolean;
  /**
   * QC mode: compare only highlights mismatches.
   * Does not switch material to a dropdown, auto-fill/replace values, or auto-check deviation.
   */
  compareHighlightOnly?: boolean;
  /** When false, hide Add Row / delete. Default true so users can add bin/container rows. */
  allowAddRemoveRows?: boolean;
  weightmentErrors?: ValidationErrors;
  validationAttempt?: ValidationAttemptFlags;
};

const RawMaterialWeightmentSheetPanel = ({
  value,
  onChange,
  onValidationChange,
  theme,
  batchId = "",
  identificationSheet = null,
  disabled = false,
  compareHighlightOnly = false,
  allowAddRemoveRows = true,
  weightmentErrors = {},
  validationAttempt = { format: false, unit: false, submit: false },
}: RawMaterialWeightmentSheetPanelProps) => {
  const { visibleError: submitVisibleError } = useValidationDisplay(
    weightmentErrors,
    validationAttempt,
  );
  const [identificationViewOpen, setIdentificationViewOpen] = useState(false);
  const [resolvedIdentificationSheet, setResolvedIdentificationSheet] =
    useState<IdentificationSheet | null>(identificationSheet ?? null);
  const { dropdownOptions: buildingOptions, loadingBuildings } = useBuildingOptions(true);
  const mixerBuildingSelectOptions = useMemo(() => {
    const current = String(value.mixerBuildingNumber ?? "").trim();
    if (!current) return buildingOptions;
    if (buildingOptions.some((option) => option.value === current)) return buildingOptions;
    return [{ value: current, label: current }, ...buildingOptions];
  }, [buildingOptions, value.mixerBuildingNumber]);
  const compareEnabled = value.validation.compareWithIdentificationSheet === true;
  const sheetMaterials = useMemo(
    () =>
      normalizeSheetMaterialsForWeightmentCompare(
        resolvedIdentificationSheet?.materials ?? identificationSheet?.materials ?? [],
      ),
    [identificationSheet?.materials, resolvedIdentificationSheet?.materials],
  );
  const palette = theme.palette ?? {};
  const dt = theme.manufacturing?.rawMaterialPrep?.details ?? {};
  const primary = palette.primary ?? "#1B4F72";
  const primaryLight = palette.primaryLight ?? "#2E86C1";

  const updateSheet = (
    patch:
      | Partial<RawMaterialPrepWeightmentSheet>
      | ((prev: RawMaterialPrepWeightmentSheet) => Partial<RawMaterialPrepWeightmentSheet>),
  ) => {
    onChange((prev) => {
      const resolved = typeof patch === "function" ? patch(prev) : patch;
      // Always preserve existing detail rows unless the patch explicitly replaces them.
      return {
        ...prev,
        ...resolved,
        weightmentDetails:
          resolved.weightmentDetails !== undefined
            ? resolved.weightmentDetails
            : prev.weightmentDetails,
        validation: resolved.validation
          ? { ...prev.validation, ...resolved.validation }
          : prev.validation,
      };
    });
  };

  useEffect(() => {
    if (identificationSheet) {
      setResolvedIdentificationSheet(identificationSheet);
    }
  }, [identificationSheet]);

  // Load identification materials for compare validation when prop is missing
  // (QC often only has batchId; collapsible already fetches for display).
  useEffect(() => {
    if (!compareEnabled) return;
    if (normalizeSheetMaterialsForWeightmentCompare(identificationSheet?.materials).length > 0) {
      setResolvedIdentificationSheet(identificationSheet);
      return;
    }
    const id = String(batchId ?? "").trim();
    if (!id) return;

    let cancelled = false;
    void (async () => {
      const batch = await batchManagementController.getBatchById(id);
      if (cancelled || !batch?.identificationSheet) return;
      setResolvedIdentificationSheet(batch.identificationSheet);
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, compareEnabled, identificationSheet]);

  useEffect(() => {
    if (!compareEnabled) {
      setIdentificationViewOpen(false);
      return;
    }
    // When compare is enabled, open the sheet so users can see expected values.
    setIdentificationViewOpen(true);
  }, [compareEnabled]);

  const rowErrors = useMemo((): WeightmentRowFieldErrors[] => {
    // Sheet comparison / "not listed" errors only when user opted in.
    if (!compareEnabled) {
      return value.weightmentDetails.map(() => ({}));
    }

    return value.weightmentDetails.map((row) =>
      validateWeightmentRowAgainstSheet(row, sheetMaterials, validationMessages),
    );
  }, [compareEnabled, sheetMaterials, value.weightmentDetails]);

  const getRowFieldError = (
    rowIndex: number,
    field: keyof RawMaterialPrepWeightmentDetail,
  ): string | undefined => {
    const submitError = submitVisibleError(weightmentPath(rowIndex, field));
    if (submitError) return submitError;
    return rowErrors[rowIndex]?.[field];
  };

  const mixerBuildingError = submitVisibleError(weightmentMixerBuildingPath());

  const hasSheetDeviations = useMemo(
    () =>
      compareEnabled &&
      weightmentRowsHaveSheetDeviations(
        value.weightmentDetails,
        sheetMaterials,
        validationMessages,
      ),
    [compareEnabled, sheetMaterials, value.weightmentDetails],
  );

  useEffect(() => {
    if (!compareEnabled || !hasSheetDeviations || value.validation.deviationFound) return;
    // QC highlight-only: never auto-toggle deviation / rewrite validation flags.
    if (compareHighlightOnly) return;

    onChange((prev) => {
      if (prev.validation.compareWithIdentificationSheet !== true) return prev;
      if (prev.validation.deviationFound) return prev;
      if (
        !weightmentRowsHaveSheetDeviations(
          prev.weightmentDetails,
          sheetMaterials,
          validationMessages,
        )
      ) {
        return prev;
      }
      return {
        ...prev,
        validation: {
          ...prev.validation,
          deviationFound: true,
        },
      };
    });
  }, [
    compareEnabled,
    compareHighlightOnly,
    hasSheetDeviations,
    onChange,
    sheetMaterials,
    value.validation.deviationFound,
  ]);

  const updateRow = (index: number, patch: Partial<RawMaterialPrepWeightmentDetail>) => {
    updateSheet((prev) => ({
      weightmentDetails: prev.weightmentDetails.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    }));
  };

  const removeRow = (index: number) => {
    updateSheet((prev) => {
      // Keep at least one row so the material still has a weighment slot.
      if (prev.weightmentDetails.length <= 1) return {};
      return {
        weightmentDetails: prev.weightmentDetails.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  };

  const addRow = () => {
    updateSheet((prev) => {
      const seedFrom = prev.weightmentDetails[0];
      return {
        weightmentDetails: [
          ...prev.weightmentDetails,
          createEmptyWeightmentDetail(
            seedFrom
              ? {
                  materialCode: seedFrom.materialCode,
                  materialName: seedFrom.materialName,
                  premixNo: seedFrom.premixNo,
                  scopeMaterialCode: seedFrom.scopeMaterialCode ?? seedFrom.materialCode,
                  percentage: seedFrom.percentage,
                }
              : undefined,
          ),
        ],
      };
    });
  };

  const handleMaterialSelect = (index: number, srNo: string) => {
    const material = sheetMaterials.find((entry) => String(entry.srNo) === srNo);
    if (!material) {
      updateRow(index, { materialCode: "", materialName: "", percentage: "", weightTransferred: "" });
      return;
    }

    const { percentage, expectedWeightKg } = getExpectedWeightmentForSheetMaterial(material);

    updateRow(index, {
      materialCode: material.materialCode,
      materialName: material.materialName || material.materialCode,
      percentage: String(percentage),
      weightTransferred: String(expectedWeightKg),
    });
  };

  const getMaterialSelectOptionsForRow = (_rowIndex: number) =>
    sheetMaterials.map((material) => {
      const sheetKey = String(material.srNo);
      return {
        value: sheetKey,
        label: formatSheetMaterialLabel(material),
        // Same material may appear on multiple bin/container rows.
        disabled: false,
      };
    });

  const containerOptions = CONTAINER_TYPES.map((type) => ({ value: type, label: type }));

  const renderMaterialCodeField = (row: RawMaterialPrepWeightmentDetail, index: number) => {
    const materialCodeError = getRowFieldError(index, "materialCode");

    // QC (compareHighlightOnly): always free-text; compare only highlights mismatches.
    // RMP: when compare is on, use identification-sheet dropdown + auto-fill.
    if (compareHighlightOnly !== true && compareEnabled === true && sheetMaterials.length > 0) {
      return (
        <WeightmentTableInput
          value={getWeightmentRowSheetKey(row, sheetMaterials)}
          onChange={(next) => handleMaterialSelect(index, next)}
          placeholder={RM.WEIGHTMENT_SELECT_MATERIAL}
          error={Boolean(materialCodeError)}
          helperText={materialCodeError}
          palette={palette}
          selectOptions={getMaterialSelectOptionsForRow(index)}
          disabled={disabled}
        />
      );
    }

    return (
      <WeightmentTableInput
        value={row.materialCode}
        onChange={(next) => updateRow(index, { materialCode: next })}
        placeholder={RM.WEIGHTMENT_PLACEHOLDER_MATERIAL_CODE}
        error={Boolean(materialCodeError)}
        helperText={materialCodeError}
        palette={palette}
        disabled={disabled}
      />
    );
  };

  const renderExpectedHint = (row: RawMaterialPrepWeightmentDetail) => {
    if (!compareEnabled || compareHighlightOnly) return null;

    const sheetMaterial = findSheetMaterialForWeightmentRow(row, sheetMaterials);
    if (!sheetMaterial) return null;

    const { percentage, expectedWeightKg } = getExpectedWeightmentForSheetMaterial(sheetMaterial);

    return (
      <Typography sx={{ fontSize: "0.65rem", color: palette.textSub, mt: 0.5, lineHeight: 1.35 }}>
        {RM.WEIGHTMENT_EXPECTED_HINT(percentage, expectedWeightKg)}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        mt: 2,
        borderRadius: 3,
        border: `1px solid ${alpha(palette.border ?? "#D5D8DC", 0.85)}`,
        overflow: "hidden",
        boxShadow: `0 4px 20px ${alpha(primary, 0.08)}`,
        background: palette.pageBg ?? "#fff",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.35,
          background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
          color: "#fff",
          display: "flex",
          alignItems: "flex-start",
          gap: 1.25,
        }}
      >
        <ScaleRoundedIcon sx={{ fontSize: 22, mt: 0.15, opacity: 0.95 }} />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", lineHeight: 1.3 }}>
            {RM.WEIGHTMENT_SHEET_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: alpha("#fff", 0.82), mt: 0.35 }}>
            {RM.WEIGHTMENT_SHEET_SUBTITLE}
          </Typography>
          {disabled ? (
            <Typography sx={{ fontSize: "0.72rem", color: alpha("#fff", 0.92), mt: 0.55, fontWeight: 600 }}>
              {RM.WEIGHTMENT_SHEET_LOCKED_HINT}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ width: { xs: "100%", sm: 360 } }}>
          <WeightmentSelectField
            label={RM.WEIGHTMENT_MIXER_BUILDING}
            value={value.mixerBuildingNumber}
            onChange={(next) => updateSheet({ mixerBuildingNumber: next })}
            placeholder={
              loadingBuildings
                ? "Loading buildings..."
                : buildingOptions.length
                  ? RM.WEIGHTMENT_PLACEHOLDER_MIXER_BUILDING
                  : "No buildings available"
            }
            options={mixerBuildingSelectOptions}
            palette={palette}
            disabled={disabled || loadingBuildings}
            error={Boolean(mixerBuildingError)}
            helperText={mixerBuildingError}
          />
        </Box>

        {value.weightmentDetails.length === 0 ? (
          <Box
            sx={{
              border: `1.5px dashed ${alpha(palette.border ?? "#D5D8DC", 0.9)}`,
              borderRadius: 2.5,
              py: 3.5,
              px: 2,
              textAlign: "center",
              mt: 1.5,
              mb: 1.5,
              background: alpha(palette.surface ?? "#F4F6F8", 0.45),
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 30, color: alpha(palette.textSub, 0.35), mb: 1 }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: palette.text }}>
              {RM.WEIGHTMENT_EMPTY_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, mt: 0.5 }}>
              {RM.WEIGHTMENT_EMPTY_SUBTITLE}
            </Typography>
          </Box>
        ) : (
          <TableContainer
            sx={{
              mt: 1.5,
              mb: 1.5,
              borderRadius: 2,
              overflow: "hidden",
              ...(dt.tableContainer ?? {
                border: `1px solid ${palette.border}`,
              }),
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {TABLE_COLUMNS.map((header) => (
                    <TableCell
                      key={header}
                      sx={
                        dt.tableHeaderCell
                          ? dt.tableHeaderCell()
                          : {
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                              background: `linear-gradient(180deg, ${primaryLight} 0%, ${primary} 100%)`,
                              color: "#fff",
                              borderBottom: "none",
                              borderRight: `1px solid ${alpha("#fff", 0.32)}`,
                              py: 1.15,
                              px: 1.5,
                              "&:last-of-type": { borderRight: "none" },
                            }
                      }
                    >
                      {header}
                    </TableCell>
                  ))}
                  {allowAddRemoveRows ? (
                    <TableCell
                      sx={
                        dt.tableHeaderCell
                          ? dt.tableHeaderCell()
                          : {
                              background: `linear-gradient(180deg, ${primaryLight} 0%, ${primary} 100%)`,
                              borderBottom: "none",
                            }
                      }
                      align="center"
                    />
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {value.weightmentDetails.map((row, index) => {
                  return (
                    <TableRow key={index} sx={dt.tableRow ? dt.tableRow(index) : undefined}>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 190, py: 1.1, verticalAlign: "top" }}>
                        {renderMaterialCodeField(row, index)}
                        {renderExpectedHint(row)}
                      </TableCell>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 170, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.materialName}
                          onChange={(next) => updateRow(index, { materialName: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_MATERIAL_NAME}
                          // QC highlight-only: keep name editable when compare is on.
                          // RMP compare mode: lock name when selecting from identification sheet.
                          readOnly={compareEnabled && !compareHighlightOnly}
                          disabled={disabled}
                          error={Boolean(getRowFieldError(index, "materialName"))}
                          helperText={getRowFieldError(index, "materialName")}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 140, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.containerType}
                          onChange={(next) => updateRow(index, { containerType: next })}
                          placeholder="—"
                          palette={palette}
                          selectOptions={containerOptions}
                          disabled={disabled}
                          error={Boolean(getRowFieldError(index, "containerType"))}
                          helperText={getRowFieldError(index, "containerType")}
                        />
                      </TableCell>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 130, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.containerNumber}
                          onChange={(next) => updateRow(index, { containerNumber: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_CONTAINER_NO}
                          palette={palette}
                          disabled={disabled}
                          error={Boolean(getRowFieldError(index, "containerNumber"))}
                          helperText={getRowFieldError(index, "containerNumber")}
                        />
                      </TableCell>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 130, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.weighScaleNumber}
                          onChange={(next) => updateRow(index, { weighScaleNumber: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_WEIGH_SCALE}
                          palette={palette}
                          disabled={disabled}
                          error={Boolean(getRowFieldError(index, "weighScaleNumber"))}
                          helperText={getRowFieldError(index, "weighScaleNumber")}
                        />
                      </TableCell>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 150, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          type="number"
                          value={row.weightTransferred}
                          onChange={(next) => updateRow(index, { weightTransferred: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_WEIGHT}
                          error={Boolean(getRowFieldError(index, "weightTransferred"))}
                          helperText={getRowFieldError(index, "weightTransferred")}
                          palette={palette}
                          disabled={disabled}
                        />
                      </TableCell>
                      <TableCell sx={{ ...(dt.tableCell ?? {}), minWidth: 200, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          type="datetime"
                          value={row.weighingDateTime}
                          onChange={(next) => updateRow(index, { weighingDateTime: next })}
                          palette={palette}
                          disabled={disabled}
                          error={Boolean(getRowFieldError(index, "weighingDateTime"))}
                          helperText={getRowFieldError(index, "weighingDateTime")}
                        />
                      </TableCell>
                      {allowAddRemoveRows ? (
                        <TableCell align="center" sx={{ ...(dt.tableCell ?? {}), verticalAlign: "top", py: 1.1 }}>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={disabled || value.weightmentDetails.length <= 1}
                            onClick={() => removeRow(index)}
                            sx={{
                              border: `1px solid ${alpha(palette.danger ?? "#C0392B", 0.2)}`,
                              background: alpha(palette.danger ?? "#C0392B", 0.04),
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {allowAddRemoveRows ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddRoundedIcon fontSize="small" />}
            disabled={disabled}
            onClick={addRow}
            sx={{
              mb: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderColor: alpha(primaryLight, 0.45),
              color: primary,
              "&:hover": {
                borderColor: primaryLight,
                background: alpha(primaryLight, 0.06),
              },
            }}
          >
            {RM.WEIGHTMENT_ADD_ROW}
          </Button>
        ) : null}

        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(palette.border ?? "#D5D8DC", 0.85)}`,
            background: alpha(palette.surface ?? "#F4F6F8", 0.55),
            px: 1.5,
            py: 1.25,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ alignSelf: "flex-start" }}>
              <Checkbox
                size="small"
                checked={compareEnabled === true}
                disabled={disabled}
                onChange={(event) => {
                  const checked = event.target.checked;
                  const validationPatch = {
                    compareWithIdentificationSheet: checked,
                    deviationFound: checked ? value.validation.deviationFound : false,
                    deviationMessage: checked ? value.validation.deviationMessage : "",
                  };
                  // Prefer validation-only callback so parents never remap detail rows.
                  if (onValidationChange) {
                    onValidationChange(validationPatch);
                    return;
                  }
                  updateSheet((prev) => ({
                    validation: {
                      ...prev.validation,
                      ...validationPatch,
                    },
                  }));
                }}
                inputProps={{ "aria-label": RM.WEIGHTMENT_COMPARE_LABEL }}
                sx={{ p: 0.5 }}
              />
              <Typography sx={checkboxLabelSx}>
                {RM.WEIGHTMENT_COMPARE_LABEL}
              </Typography>
            </Stack>
            {compareEnabled ? (
              <IdentificationSheetCollapsible
                batchId={batchId}
                identificationSheet={resolvedIdentificationSheet ?? identificationSheet}
                theme={theme}
                open={identificationViewOpen}
                onToggle={() => setIdentificationViewOpen((prev) => !prev)}
              />
            ) : null}
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ alignSelf: "flex-start" }}>
              <Checkbox
                size="small"
                checked={value.validation.deviationFound === true}
                disabled={disabled}
                onChange={(event) => {
                  const checked = event.target.checked;
                  const validationPatch = {
                    deviationFound: checked,
                    deviationMessage: checked ? value.validation.deviationMessage : "",
                  };
                  if (onValidationChange) {
                    onValidationChange(validationPatch);
                    return;
                  }
                  updateSheet((prev) => ({
                    validation: {
                      ...prev.validation,
                      ...validationPatch,
                    },
                  }));
                }}
                inputProps={{ "aria-label": RM.WEIGHTMENT_DEVIATION_FOUND }}
                sx={{ p: 0.5 }}
              />
              <Typography sx={checkboxLabelSx}>
                {RM.WEIGHTMENT_DEVIATION_FOUND}
              </Typography>
            </Stack>
            {value.validation.deviationFound ? (
              <WeightmentTextField
                label={RM.WEIGHTMENT_DEVIATION_MESSAGE}
                value={value.validation.deviationMessage}
                onChange={(next) => {
                  if (onValidationChange) {
                    onValidationChange({ deviationMessage: next });
                    return;
                  }
                  updateSheet((prev) => ({
                    validation: {
                      ...prev.validation,
                      deviationMessage: next,
                    },
                  }));
                }}
                palette={palette}
                width={{ xs: "100%", sm: 480 }}
                disabled={disabled}
              />
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default RawMaterialWeightmentSheetPanel;
