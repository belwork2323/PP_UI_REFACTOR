import {
  alpha,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
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
import {
  findSheetMaterialForWeightmentRow,
  formatSheetMaterialLabel,
  getExpectedWeightmentForSheetMaterial,
  getWeightmentRowSheetKey,
  validateWeightmentRowAgainstSheet,
  weightmentRowsHaveSheetDeviations,
  type WeightmentRowFieldErrors,
} from "../../../../../data/models/user/rawMaterialWeightmentValidation";
import IdentificationSheetCollapsible from "./components/IdentificationSheetCollapsible";
import {
  WeightmentTableInput,
  WeightmentTextField,
} from "./components/RawMaterialWeightmentFormFields";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const CONTAINER_TYPES = ["Drum", "Bin", "Bag", "Other"];
const { info: InfoOutlinedIcon } = icons.user.manufacturing.rawMaterial.builderPage;

const checkboxLabelSx = {
  m: 0,
  "& .MuiFormControlLabel-label": {
    fontSize: "0.78rem",
    lineHeight: 1.35,
    fontWeight: 600,
  },
};

const validationMessages = {
  materialNotInSheet: RM.WEIGHTMENT_MATERIAL_NOT_IN_SHEET,
  percentageMismatch: RM.WEIGHTMENT_PERCENTAGE_MISMATCH,
  weightMismatch: RM.WEIGHTMENT_WEIGHT_MISMATCH,
};

const TABLE_COLUMNS = [
  RM.WEIGHTMENT_TABLE_COL_MATERIAL_CODE,
  RM.WEIGHTMENT_TABLE_COL_MATERIAL_NAME,
  RM.WEIGHTMENT_TABLE_COL_PERCENTAGE,
  RM.WEIGHTMENT_TABLE_COL_WEIGHT,
  RM.WEIGHTMENT_TABLE_COL_CONTAINER_TYPE,
  RM.WEIGHTMENT_TABLE_COL_CONTAINER_NO,
  RM.WEIGHTMENT_TABLE_COL_WEIGH_SCALE,
  RM.WEIGHTMENT_TABLE_COL_WEIGHING_TIME,
] as const;

type RawMaterialWeightmentSheetPanelProps = {
  value: RawMaterialPrepWeightmentSheet;
  onChange: (next: RawMaterialPrepWeightmentSheet) => void;
  theme: any;
  batchId?: string;
  identificationSheet?: IdentificationSheet | null;
};

const RawMaterialWeightmentSheetPanel = ({
  value,
  onChange,
  theme,
  batchId = "",
  identificationSheet = null,
}: RawMaterialWeightmentSheetPanelProps) => {
  const [identificationViewOpen, setIdentificationViewOpen] = useState(false);
  const compareEnabled = value.validation.compareWithIdentificationSheet;
  const sheetMaterials = identificationSheet?.materials ?? [];
  const palette = theme.palette ?? {};
  const dt = theme.manufacturing?.rawMaterialPrep?.details ?? {};
  const primary = palette.primary ?? "#1B4F72";
  const primaryLight = palette.primaryLight ?? "#2E86C1";

  useEffect(() => {
    if (!compareEnabled) {
      setIdentificationViewOpen(false);
    }
  }, [compareEnabled]);

  const rowErrors = useMemo((): WeightmentRowFieldErrors[] => {
    if (!compareEnabled) {
      return value.weightmentDetails.map(() => ({}));
    }

    return value.weightmentDetails.map((row) =>
      validateWeightmentRowAgainstSheet(row, sheetMaterials, validationMessages),
    );
  }, [compareEnabled, sheetMaterials, value.weightmentDetails]);

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

    updateSheet({
      validation: {
        ...value.validation,
        deviationFound: true,
      },
    });
  }, [compareEnabled, hasSheetDeviations, value.validation]);

  const updateSheet = (patch: Partial<RawMaterialPrepWeightmentSheet>) => {
    onChange({ ...value, ...patch });
  };

  const updateRow = (index: number, patch: Partial<RawMaterialPrepWeightmentDetail>) => {
    const nextRows = value.weightmentDetails.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row,
    );
    updateSheet({ weightmentDetails: nextRows });
  };

  const removeRow = (index: number) => {
    updateSheet({
      weightmentDetails: value.weightmentDetails.filter((_, rowIndex) => rowIndex !== index),
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

  const getUsedSheetSrNos = (excludeIndex: number) => {
    const used = new Set<string>();
    value.weightmentDetails.forEach((entry, rowIndex) => {
      if (rowIndex === excludeIndex) return;
      const sheetKey = getWeightmentRowSheetKey(entry, sheetMaterials);
      if (sheetKey) used.add(sheetKey);
    });
    return used;
  };

  const getMaterialSelectOptionsForRow = (rowIndex: number) =>
    sheetMaterials.map((material) => {
      const sheetKey = String(material.srNo);
      return {
        value: sheetKey,
        label: formatSheetMaterialLabel(material),
        disabled: getUsedSheetSrNos(rowIndex).has(sheetKey),
      };
    });

  const containerOptions = CONTAINER_TYPES.map((type) => ({ value: type, label: type }));

  const renderMaterialCodeField = (row: RawMaterialPrepWeightmentDetail, index: number) => {
    const errors = rowErrors[index] ?? {};

    if (compareEnabled && sheetMaterials.length > 0) {
      return (
        <WeightmentTableInput
          value={getWeightmentRowSheetKey(row, sheetMaterials)}
          onChange={(next) => handleMaterialSelect(index, next)}
          placeholder={RM.WEIGHTMENT_SELECT_MATERIAL}
          error={Boolean(errors.materialCode)}
          helperText={errors.materialCode}
          palette={palette}
          selectOptions={getMaterialSelectOptionsForRow(index)}
        />
      );
    }

    return (
      <WeightmentTableInput
        value={row.materialCode}
        onChange={(next) => updateRow(index, { materialCode: next })}
        placeholder={RM.WEIGHTMENT_PLACEHOLDER_MATERIAL_CODE}
        error={Boolean(errors.materialCode)}
        helperText={errors.materialCode}
        palette={palette}
      />
    );
  };

  const renderExpectedHint = (row: RawMaterialPrepWeightmentDetail) => {
    if (!compareEnabled) return null;

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
        </Box>
      </Box>

      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <WeightmentTextField
          label={RM.WEIGHTMENT_MIXER_BUILDING}
          value={value.mixerBuildingNumber}
          onChange={(next) => updateSheet({ mixerBuildingNumber: next })}
          placeholder={RM.WEIGHTMENT_PLACEHOLDER_MIXER_BUILDING}
          palette={palette}
          width={{ xs: "100%", sm: 360 }}
        />

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
                  {TABLE_COLUMNS.map((header, columnIndex) => (
                    <TableCell
                      key={header}
                      sx={
                        dt.tableHeaderCell
                          ? dt.tableHeaderCell(columnIndex === 0)
                          : {
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              whiteSpace: "nowrap",
                              background: alpha(primaryLight, 0.08),
                            }
                      }
                    >
                      {header}
                    </TableCell>
                  ))}
                  <TableCell
                    sx={
                      dt.tableHeaderCell
                        ? dt.tableHeaderCell(false)
                        : { background: alpha(primaryLight, 0.08) }
                    }
                    align="center"
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {value.weightmentDetails.map((row, index) => {
                  const errors = rowErrors[index] ?? {};

                  return (
                    <TableRow key={index} sx={dt.tableRow ? dt.tableRow(index) : undefined}>
                      <TableCell sx={{ minWidth: 190, py: 1.1, verticalAlign: "top" }}>
                        {renderMaterialCodeField(row, index)}
                        {renderExpectedHint(row)}
                      </TableCell>
                      <TableCell sx={{ minWidth: 170, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.materialName}
                          onChange={(next) => updateRow(index, { materialName: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_MATERIAL_NAME}
                          readOnly={compareEnabled}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 120, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          type="number"
                          value={row.percentage}
                          onChange={(next) => updateRow(index, { percentage: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_PERCENTAGE}
                          error={Boolean(errors.percentage)}
                          helperText={errors.percentage}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 150, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          type="number"
                          value={row.weightTransferred}
                          onChange={(next) => updateRow(index, { weightTransferred: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_WEIGHT}
                          error={Boolean(errors.weightTransferred)}
                          helperText={errors.weightTransferred}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 140, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.containerType}
                          onChange={(next) => updateRow(index, { containerType: next })}
                          placeholder="—"
                          palette={palette}
                          selectOptions={containerOptions}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 130, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.containerNumber}
                          onChange={(next) => updateRow(index, { containerNumber: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_CONTAINER_NO}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 130, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          value={row.weighScaleNumber}
                          onChange={(next) => updateRow(index, { weighScaleNumber: next })}
                          placeholder={RM.WEIGHTMENT_PLACEHOLDER_WEIGH_SCALE}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 200, py: 1.1, verticalAlign: "top" }}>
                        <WeightmentTableInput
                          type="datetime"
                          value={row.weighingDateTime}
                          onChange={(next) => updateRow(index, { weighingDateTime: next })}
                          palette={palette}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: "top", py: 1.1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeRow(index)}
                          sx={{
                            border: `1px solid ${alpha(palette.danger ?? "#C0392B", 0.2)}`,
                            background: alpha(palette.danger ?? "#C0392B", 0.04),
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddRoundedIcon fontSize="small" />}
          onClick={() =>
            updateSheet({
              weightmentDetails: [...value.weightmentDetails, createEmptyWeightmentDetail()],
            })
          }
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
            <FormControlLabel
              sx={checkboxLabelSx}
              control={
                <Checkbox
                  size="small"
                  checked={compareEnabled}
                  onChange={(event) =>
                    updateSheet({
                      validation: {
                        ...value.validation,
                        compareWithIdentificationSheet: event.target.checked,
                        ...(event.target.checked
                          ? {}
                          : { deviationFound: false, deviationMessage: "" }),
                      },
                    })
                  }
                />
              }
              label={RM.WEIGHTMENT_COMPARE_LABEL}
            />
            {compareEnabled ? (
              <IdentificationSheetCollapsible
                batchId={batchId}
                identificationSheet={identificationSheet}
                theme={theme}
                open={identificationViewOpen}
                onToggle={() => setIdentificationViewOpen((prev) => !prev)}
              />
            ) : null}
            <FormControlLabel
              sx={checkboxLabelSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.validation.deviationFound}
                  onChange={(event) =>
                    updateSheet({
                      validation: {
                        ...value.validation,
                        deviationFound: event.target.checked,
                        ...(event.target.checked ? {} : { deviationMessage: "" }),
                      },
                    })
                  }
                />
              }
              label={RM.WEIGHTMENT_DEVIATION_FOUND}
            />
            {value.validation.deviationFound ? (
              <WeightmentTextField
                label={RM.WEIGHTMENT_DEVIATION_MESSAGE}
                value={value.validation.deviationMessage}
                onChange={(next) =>
                  updateSheet({
                    validation: {
                      ...value.validation,
                      deviationMessage: next,
                    },
                  })
                }
                palette={palette}
                width={{ xs: "100%", sm: 480 }}
              />
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default RawMaterialWeightmentSheetPanel;
