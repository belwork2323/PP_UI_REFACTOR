import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Zoom,
  Divider,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import FormInput from "@ui/components/common/FormInput";
import AppTextField from "@ui/components/common/AppTextField";
import AppDropdown from "@ui/components/common/AppDropdown";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import type { BatchMaterialOption } from "@data/models/admin/BatchManagement/BatchManagementModel";
import type { SystemMasterOption } from "@data/api/common/generalAPI";
import DateField from "@ui/components/common/DateField";
import { formatToUiDate } from "@utils/dateUtils";
import { appDenseControlSx } from "@ui/components/common/fieldStyles";

const S = STRINGS.BATCH_MANAGEMENT.FORM;

interface Material {
  srNo: number;
  materialCode: string;
  materialName: string;
  gradeCode?: string;
  gradeName?: string;
  lotId: string;
  manufacturerName?: string;
  make?: string;
  requiredComposition: number;
  quantityPerPremix: number;
  revalidationFromDate: string;
  revalidationToDate: string;
}

const displayNumberValue = (value: number | string | undefined | null, emptyWhenZero = true): string => {
  if (value == null || value === "") return "";
  if (emptyWhenZero && Number(value) === 0) return "";
  return String(value);
};

/** Parse a non-negative float; empty input stays clearable (returns ""). */
const parseClearableNonNegativeFloat = (raw: string): number | "" => {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === ".") return "";
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return "";
  return parsed;
};

const compositionMaterialKey = (material: Material, index: number) =>
  `${material.materialCode}-${material.srNo ?? index}`;

const parseCompositionFloat = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === ".") return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBatchSizeNumber = (value: number | string | undefined | null): number => {
  if (value === "" || value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const materialManufacturer = (material: Material): string =>
  String(material.manufacturerName ?? material.make ?? "").trim();

const withCurrentMasterOption = (
  options: SystemMasterOption[],
  currentValue: string,
): SystemMasterOption[] => {
  const trimmed = String(currentValue ?? "").trim();
  if (!trimmed) return options;
  if (options.some((opt) => opt.code === trimmed || opt.name === trimmed)) return options;
  return [{ id: 0, code: trimmed, name: trimmed }, ...options];
};

export default function BatchImplementationForm({
  open,
  onClose,
  onSave,
  editTarget,
  form,
  onFormChange,
  onMaterialsChange,
  readOnly = false,
  isBatchEditMode = false,
  saving,
  t,
  materialOptions = [],
  mixerOptions = [],
  buildingOptions = [],
  loadingMaterials = false,
  loadingLots = false,
  loadingMasterLookups = false,
  getLotByMaterialAndId,
  getLotOptionsForRow,
  onCompositionChange,
  setConfirmOpen,
}: any) {
  const { modal, input, materialSelectField, materialsTable } = t;
  const [selectedMaterialCode, setSelectedMaterialCode] = useState("");
  const [selectedGradeCode, setSelectedGradeCode] = useState("");
  const [compositionDrafts, setCompositionDrafts] = useState<Record<string, string>>({});

  const fieldDisabled = readOnly || saving;

  const currentMixerValue = String(
    form.identificationSheet?.mixerType ?? form.identificationSheet?.mixerDetails ?? "",
  ).trim();
  const currentBuildingValue = String(form.identificationSheet?.BldgNo ?? "").trim();

  const mixerSelectOptions = useMemo(
    () => withCurrentMasterOption(mixerOptions as SystemMasterOption[], currentMixerValue),
    [mixerOptions, currentMixerValue],
  );
  const buildingSelectOptions = useMemo(
    () => withCurrentMasterOption(buildingOptions as SystemMasterOption[], currentBuildingValue),
    [buildingOptions, currentBuildingValue],
  );

  useEffect(() => {
    if (!open) {
      setSelectedMaterialCode("");
      setSelectedGradeCode("");
      setCompositionDrafts({});
    }
  }, [open]);

  const selectedLotIdsElsewhere = useMemo(() => {
    const ids = new Set<string>();
    for (const material of form.identificationSheet?.materials ?? []) {
      const lotId = String(material.lotId ?? "").trim();
      if (lotId) ids.add(lotId);
    }
    return ids;
  }, [form.identificationSheet?.materials]);

  const selectedMaterialOption = useMemo(
    () =>
      (materialOptions as BatchMaterialOption[]).find(
        (item) => item.materialCode === selectedMaterialCode,
      ),
    [materialOptions, selectedMaterialCode],
  );

  const selectableMaterials = useMemo(() => {
    return materialOptions as BatchMaterialOption[];
  }, [materialOptions]);

  const showGradeSelect = Boolean(
    selectedMaterialOption && (selectedMaterialOption.grades?.length ?? 0) > 0,
  );

  const selectableGrades = useMemo(() => {
    if (!showGradeSelect || !selectedMaterialOption) return [];
    return selectedMaterialOption.grades ?? [];
  }, [selectedMaterialOption, showGradeSelect]);

  const canAddMaterial =
    Boolean(selectedMaterialCode) && (!showGradeSelect || Boolean(selectedGradeCode));

  const getLotSelectPlaceholder = (materialCode: string, lotOptionCount: number): string => {
    if (loadingLots) return "Loading approved lots...";
    if (lotOptionCount > 0) return "Select lot";
    return "No approved lots for this material";
  };

  const handleMaterialSelectChange = (materialCode: string) => {
    setSelectedMaterialCode(materialCode);
    setSelectedGradeCode("");
  };

  useEffect(() => {
    if (!open || loadingLots) return;

    const materials = form.identificationSheet?.materials ?? [];
    if (!materials.length) return;

    let changed = false;
    const synced = materials.map((material: Material) => {
      const lotId = String(material.lotId ?? "").trim();
      if (!lotId) return material;

      const fromApi = getLotByMaterialAndId(material.materialCode, lotId)?.manufacturerName ?? "";
      const current = materialManufacturer(material);
      if (!fromApi || fromApi === current) return material;

      changed = true;
      return { ...material, manufacturerName: fromApi, make: fromApi };
    });

    if (changed) onMaterialsChange(synced);
  }, [
    open,
    loadingLots,
    form.identificationSheet?.materials,
    getLotByMaterialAndId,
    onMaterialsChange,
  ]);

  const handleIdentificationChange = (field: string) => (e: any) => {
    onFormChange(field, {
      ...form.identificationSheet,
      [field.split(".")[1]]: e.target.value,
    });
  };

  const handleAddMaterial = () => {
    if (!canAddMaterial || !selectedMaterialOption) return;

    const grade =
      showGradeSelect
        ? selectableGrades.find((item) => item.gradeCode === selectedGradeCode)
        : undefined;

    const newMaterial: Material = {
      srNo: (form.identificationSheet?.materials?.length ?? 0) + 1,
      materialCode: selectedMaterialOption.materialCode,
      materialName: selectedMaterialOption.materialName,
      gradeCode: grade?.gradeCode,
      gradeName: grade?.gradeName || grade?.gradeCode,
      lotId: "",
      manufacturerName: "",
      make: "",
      requiredComposition: 0,
      quantityPerPremix: 0,
      revalidationFromDate: "",
      revalidationToDate: "",
    };
    onMaterialsChange([...(form.identificationSheet?.materials ?? []), newMaterial]);
    setSelectedMaterialCode("");
    setSelectedGradeCode("");
  };

  const handleRemoveMaterial = (index: number) => {
    const newMaterials =
      form.identificationSheet?.materials?.filter((_: any, i: number) => i !== index) ?? [];
    onMaterialsChange(newMaterials);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const newMaterials = [...(form.identificationSheet?.materials ?? [])];
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: value,
    };
    onMaterialsChange(newMaterials);
  };

  const handleLotIdChange = (index: number, lotId: string) => {
    const material = (form.identificationSheet?.materials ?? [])[index] as Material | undefined;
    if (!material) return;

    const lot = lotId ? getLotByMaterialAndId(material.materialCode, lotId) : undefined;
    const manufacturerName = lot?.manufacturerName ?? "";

    const newMaterials = [...(form.identificationSheet?.materials ?? [])];
    newMaterials[index] = {
      ...newMaterials[index],
      lotId,
      manufacturerName,
      make: manufacturerName,
    };
    onMaterialsChange(newMaterials);
  };
  const totalComposition =
    form.identificationSheet?.materials?.reduce(
      (sum, material) => sum + (Number(material.requiredComposition) || 0),
      0,
    ) ?? 0;
  const roundedTotal = Number(totalComposition.toFixed(2));

  useEffect(() => {
    onCompositionChange?.(roundedTotal);
  }, [roundedTotal, onCompositionChange]);
  const handleMaterialValuesChange = (index: number, composition: number) => {
    const batchSize = toBatchSizeNumber(form.identificationSheet?.batchSize);
    const qty = Number(((batchSize * composition) / 100).toFixed(3));

    const newMaterials = [...(form.identificationSheet?.materials ?? [])];
    newMaterials[index] = {
      ...newMaterials[index],
      requiredComposition: composition,
      quantityPerPremix: qty,
    };

    onMaterialsChange(newMaterials);
    const total = newMaterials.reduce(
      (sum, item) => sum + (Number(item.requiredComposition) || 0),
      0,
    );

    onCompositionChange?.(Number(total.toFixed(2)));
  };

  const getCompositionDisplayValue = (material: Material, index: number) => {
    const key = compositionMaterialKey(material, index);
    if (compositionDrafts[key] !== undefined) return compositionDrafts[key];
    return displayNumberValue(material.requiredComposition);
  };

  const handleCompositionInputChange = (index: number, material: Material, raw: string) => {
    const key = compositionMaterialKey(material, index);
    setCompositionDrafts((prev) => ({ ...prev, [key]: raw }));

    if (raw === "" || raw.endsWith(".")) return;

    const composition = parseCompositionFloat(raw);
    if (composition === null) return;
    handleMaterialValuesChange(index, composition);
  };

  const commitCompositionInput = (index: number, material: Material) => {
    const key = compositionMaterialKey(material, index);
    const raw =
      compositionDrafts[key] ?? displayNumberValue(material.requiredComposition);
    const composition = parseCompositionFloat(raw);
    handleMaterialValuesChange(index, composition ?? 0);
    setCompositionDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const recalculateMaterialQuantities = (batchSize: number) => {
    const newMaterials = (form.identificationSheet?.materials ?? []).map((material) => ({
      ...material,
      requiredComposition: 0,
      quantityPerPremix: 0,
    }));

    onMaterialsChange(newMaterials);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          width: "95vw",
          maxWidth: "1800px", // or any value you want
          height: "90vh",
        },
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={<icons.batchMgmt.batchIcon sx={modal.header.icon} />}
          title={
            readOnly
              ? S.IMPLEMENTATION_VIEW_TITLE
              : isBatchEditMode
                ? S.IMPLEMENTATION_BATCH_EDIT_TITLE
                : S.IMPLEMENTATION_EDIT_TITLE
          }
          subtitle={
            editTarget?.batchId
              ? S.IMPLEMENTATION_SUBTITLE(editTarget?.batchId || editTarget?.id || "—")
              : ""
          }
          onClose={() => !saving && onClose()}
          closeDisabled={saving}
          closeIcon={<icons.batchMgmt.close fontSize="small" />}
          theme={t}
        />
      </DialogTitle>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          {/* Identification Sheet Details */}
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <DateField
                label="Date"
                value={formatToUiDate(form.identificationSheet?.date ?? "")}
                onChange={(date) => {
                  const newIdent = { ...form.identificationSheet, date };
                  onFormChange("identificationSheet", newIdent);
                }}
                disabled={readOnly}
                sx={{ mb: 0, ...input }}
              />
              <FormInput
                fullWidth
                label="Batch Size (KG)"
                type="number"
                value={displayNumberValue(form.identificationSheet?.batchSize, true)}
                onChange={(e) => {
                  const batchSize = parseClearableNonNegativeFloat(e.target.value);
                  const newIdent = {
                    ...form.identificationSheet,
                    batchSize,
                  };
                  onFormChange("identificationSheet", newIdent);
                  recalculateMaterialQuantities(toBatchSizeNumber(batchSize));
                }}
                onKeyDown={(e) => {
                  if (["-", "e", "E", "+"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
                inputProps={{ min: 0, step: "any" }}
                disabled={readOnly}
                sx={{
                  mb: 0,
                  ...input,
                  "& input[type=number]": { MozAppearance: "textfield" },
                  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                    {
                      WebkitAppearance: "none",
                      margin: 0,
                    },
                }}
              />
            </Stack>
          </Box>

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <FormInput
                fullWidth
                label="Bonding Sheet No"
                value={form.identificationSheet?.bondingSheetNo ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, bondingSheetNo: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                disabled={fieldDisabled}
                sx={{ mb: 0, ...input }}
              />
              <AppDropdown
                label={S.MIXER_TYPE}
                value={currentMixerValue}
                onChange={(value) => {
                  onFormChange("identificationSheet", {
                    ...form.identificationSheet,
                    mixerType: value,
                  });
                }}
                disabled={fieldDisabled || loadingMasterLookups}
                placeholder={
                  loadingMasterLookups
                    ? "Loading mixers..."
                    : mixerSelectOptions.length
                      ? "Select mixer"
                      : "No mixers available"
                }
                options={mixerSelectOptions.map((opt) => ({
                  value: opt.code,
                  label: opt.name || opt.code,
                }))}
                renderValue={(selected) => {
                  const value = String(selected ?? "").trim();
                  if (!value) return null;
                  const opt = mixerSelectOptions.find((o) => o.code === value);
                  return opt?.name || opt?.code || value;
                }}
                sx={{ mb: 0, ...input }}
                MenuProps={t.menuPaper}
              />
            </Stack>
          </Box>

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <AppDropdown
                label={S.BUILDING_NO}
                value={currentBuildingValue}
                onChange={(value) => {
                  onFormChange("identificationSheet", {
                    ...form.identificationSheet,
                    BldgNo: value,
                  });
                }}
                disabled={fieldDisabled || loadingMasterLookups}
                placeholder={
                  loadingMasterLookups
                    ? "Loading buildings..."
                    : buildingSelectOptions.length
                      ? "Select building"
                      : "No buildings available"
                }
                options={buildingSelectOptions.map((opt) => ({
                  value: opt.code,
                  label: opt.name || opt.code,
                }))}
                renderValue={(selected) => {
                  const value = String(selected ?? "").trim();
                  if (!value) return null;
                  const opt = buildingSelectOptions.find((o) => o.code === value);
                  return opt?.name || opt?.code || value;
                }}
                sx={{ mb: 0, ...input }}
                MenuProps={t.menuPaper}
              />
              <FormInput
                fullWidth
                label="Number of Premix"
                type="number"
                value={form.identificationSheet?.numberOfPremix ?? ""}
                onChange={(e) => {
                  const value = e.target.value;

                  const newIdent = {
                    ...form.identificationSheet,
                    numberOfPremix: value === "" ? "" : Math.max(1, Number(value)),
                  };

                  onFormChange("identificationSheet", newIdent);
                }}
                onBlur={() => {
                  if (
                    !form.identificationSheet?.numberOfPremix ||
                    Number(form.identificationSheet.numberOfPremix) < 1
                  ) {
                    onFormChange("identificationSheet", {
                      ...form.identificationSheet,
                      numberOfPremix: 1,
                    });
                  }
                }}
                inputProps={{ min: 1 }}
                disabled={fieldDisabled}
                sx={{ mb: 0, ...input }}
              />
              <FormInput
                fullWidth
                label="Remarks"
                value={form.identificationSheet?.remarks ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, remarks: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                disabled={fieldDisabled}
                sx={{ mb: 0, ...input }}
              />
            </Stack>
          </Box>

          {/* Materials Table */}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                mb: 1.5,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography sx={modal.fieldLabel}>Materials</Typography>
                <Typography variant="caption" color="textSecondary">
                  {S.MATERIALS_AVAILABLE(materialOptions.length)}
                </Typography>
              </Box>
              {!readOnly && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "stretch", sm: "flex-end" }}
                  sx={{ flex: 1, minWidth: 280, maxWidth: 640 }}
                >
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <AppDropdown
                      label={S.SELECT_MATERIAL_LABEL}
                      value={selectedMaterialCode}
                      onChange={handleMaterialSelectChange}
                      disabled={loadingMaterials || selectableMaterials.length === 0}
                      loading={loadingMaterials}
                      placeholder={S.SELECT_MATERIAL_PLACEHOLDER}
                      options={selectableMaterials.map((item) => ({
                        value: item.materialCode,
                        label: item.materialName || item.materialCode,
                      }))}
                      renderValue={(selected) => {
                        const item = selectableMaterials.find(
                          (m) => m.materialCode === selected,
                        );
                        if (!item) return selected;
                        return (
                          <Box
                            component="span"
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                            title={item.materialName || item.materialCode}
                          >
                            {item.materialName || item.materialCode}
                          </Box>
                        );
                      }}
                      MenuProps={t.menuPaper}
                      sx={{ mb: 0, ...(materialSelectField ?? input) }}
                    >
                      {selectableMaterials.map((item) => {
                        const gradeCount = item.grades?.length ?? 0;
                        return (
                          <MenuItem key={item.materialCode} value={item.materialCode}>
                            {item.materialCode} - {item.materialName}
                            {gradeCount > 0 ? (
                              <Typography
                                component="span"
                                sx={{ ml: 0.75, fontSize: "0.75rem", color: "text.secondary" }}
                              >
                                ({gradeCount} grade{gradeCount > 1 ? "s" : ""})
                              </Typography>
                            ) : null}
                          </MenuItem>
                        );
                      })}
                    </AppDropdown>
                  </Box>

                  {showGradeSelect ? (
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                      <AppDropdown
                        label={S.SELECT_GRADE_LABEL}
                        value={selectedGradeCode}
                        onChange={setSelectedGradeCode}
                        disabled={loadingMaterials || selectableGrades.length === 0}
                        placeholder={S.SELECT_GRADE_PLACEHOLDER}
                        options={selectableGrades.map((grade) => ({
                          value: grade.gradeCode,
                          label: grade.gradeName || grade.gradeCode,
                        }))}
                        MenuProps={t.menuPaper}
                        sx={{ mb: 0, ...(materialSelectField ?? input) }}
                      />
                    </Box>
                  ) : null}

                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAddMaterial}
                    disabled={!canAddMaterial}
                    startIcon={<AddRoundedIcon />}
                    sx={{ height: 40, whiteSpace: "nowrap", px: 1.5 }}
                  >
                    {S.ADD_MATERIAL}
                  </Button>
                </Stack>
              )}
            </Box>

            {(form.identificationSheet?.materials?.length ?? 0) > 0 ? (
              <>
              <TableContainer sx={materialsTable?.container}>
                <Table size="small" sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow sx={materialsTable?.headerRow}>
                      {[
                        "Sr. No",
                        "Material Code",
                        "Material Name",
                        "Grade",
                        "Lot ID",
                        "Manufacturer",
                        "Composition %",
                        "Qty/Premix",
                        "Revalidation From",
                        "Revalidation To",
                        ...(!readOnly ? ["Action"] : []),
                      ].map((header) => (
                        <TableCell key={header} sx={materialsTable?.headerCell}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.identificationSheet?.materials?.map((material: Material, idx: number) => {
                      const lotOptionsForRow = getLotOptionsForRow(
                        material.materialCode,
                        material.lotId,
                        new Set([...selectedLotIdsElsewhere].filter((id) => id !== material.lotId)),
                        material.gradeCode,
                      );
                      const lotPlaceholder = getLotSelectPlaceholder(
                        material.materialCode,
                        lotOptionsForRow.length,
                      );
                      const cellSx = materialsTable?.bodyCell;
                      const textSx = materialsTable?.textCell;

                      return (
                        <TableRow
                          key={`${material.materialCode}-${material.gradeCode ?? ""}-${idx}`}
                          hover
                        >
                          <TableCell sx={{ ...cellSx, width: 56 }}>{material.srNo}</TableCell>
                          <TableCell sx={cellSx}>
                            <Typography sx={{ ...textSx, fontWeight: 700 }} noWrap>
                              {material.materialCode || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ ...cellSx, minWidth: 160, maxWidth: 220 }}>
                            <Typography sx={textSx} noWrap title={material.materialName}>
                              {material.materialName || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={cellSx}>
                            <Typography sx={textSx} noWrap>
                              {material.gradeName || material.gradeCode || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ ...cellSx, width: 150 }}>
                            <AppDropdown
                              value={material.lotId ?? ""}
                              onChange={(value) => handleLotIdChange(idx, value)}
                              disabled={fieldDisabled || loadingLots || !material.materialCode}
                              loading={loadingLots}
                              placeholder={lotPlaceholder}
                              compact
                              options={lotOptionsForRow.map((lot) => ({
                                value: lot.lotId,
                                label:
                                  lot.grade?.gradeName || lot.grade?.gradeCode
                                    ? `${lot.lotId} · ${lot.grade?.gradeName || lot.grade?.gradeCode}`
                                    : lot.lotId,
                              }))}
                              MenuProps={t.menuPaper}
                              sx={[appDenseControlSx, materialsTable?.lotControl]}
                            />
                          </TableCell>
                          <TableCell sx={{ ...cellSx, minWidth: 110 }}>
                            <Typography
                              sx={{
                                ...textSx,
                                color: materialManufacturer(material)
                                  ? undefined
                                  : "text.secondary",
                              }}
                              noWrap
                            >
                              {materialManufacturer(material) || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ ...cellSx, width: 130, minWidth: 130 }}>
                            <AppTextField
                              type="text"
                              inputMode="decimal"
                              value={getCompositionDisplayValue(material, idx)}
                              onChange={(e) =>
                                handleCompositionInputChange(idx, material, e.target.value)
                              }
                              onBlur={() => commitCompositionInput(idx, material)}
                              disabled={fieldDisabled}
                              compact
                              sx={materialsTable?.compositionControl}
                            />
                          </TableCell>
                          <TableCell sx={{ ...cellSx, width: 90 }}>
                            <Typography sx={textSx} noWrap>
                              {displayNumberValue(material.quantityPerPremix) || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ ...cellSx, width: 150, minWidth: 150 }}>
                            <DateField
                              value={formatToUiDate(material.revalidationFromDate ?? "")}
                              onChange={(date) =>
                                handleMaterialChange(idx, "revalidationFromDate", date)
                              }
                              disabled={fieldDisabled}
                              compact
                              placeholder="DD-MM-YYYY"
                              sx={materialsTable?.dateControl}
                            />
                          </TableCell>
                          <TableCell sx={{ ...cellSx, width: 150, minWidth: 150 }}>
                            <DateField
                              value={formatToUiDate(material.revalidationToDate ?? "")}
                              onChange={(date) =>
                                handleMaterialChange(idx, "revalidationToDate", date)
                              }
                              disabled={fieldDisabled}
                              compact
                              placeholder="DD-MM-YYYY"
                              sx={materialsTable?.dateControl}
                            />
                          </TableCell>
                          {!readOnly && (
                            <TableCell sx={{ ...cellSx, width: 80 }}>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMaterial(idx)}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 700,
                                  minWidth: 0,
                                  px: 1,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
                <Box sx={{ my: 2 }}>
                  {roundedTotal < 100 && (
                    <Typography color="error.main" variant="body2" fontWeight={800}>
                      Total composition is {roundedTotal.toFixed(2)}%. Please add{" "}
                      {(100 - roundedTotal).toFixed(2)}% more.
                    </Typography>
                  )}

                  {roundedTotal > 100 && (
                    <Typography color="error.main" variant="body2" fontWeight={800}>
                      Total composition is {roundedTotal.toFixed(2)}%. It exceeds the limit by{" "}
                      {(roundedTotal - 100).toFixed(2)}%.
                    </Typography>
                  )}

                  {roundedTotal === 100 && (
                    <Typography color="success.main" variant="body2" fontWeight={800}>
                      Total composition is 100.00%.
                    </Typography>
                  )}
                </Box>

                <Divider />
                <Box sx={{ mt: 2, maxWidth: 320 }}>
                  <DateField
                    label="Composition Approved as per PRC dated"
                    value={formatToUiDate(form.identificationSheet?.prcApprovalDate ?? "")}
                    onChange={(date) => {
                      const newIdent = {
                        ...form.identificationSheet,
                        prcApprovalDate: date,
                      };

                      onFormChange("identificationSheet", newIdent);
                    }}
                    disabled={fieldDisabled}
                    sx={materialsTable?.prcDateField ?? { mb: 0, maxWidth: 280, ...input }}
                  />
                </Box>
              </>
            ) : (
              <Typography color="textSecondary">{S.NO_MATERIALS_ADDED}</Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={() => {
              if (roundedTotal !== 100) {
                setConfirmOpen(true);
                return;
              }

              onSave();
            }}
            disabled={saving}
            sx={modal.saveButton}
          >
            {saving ? (
              <>
                <CircularProgress size={14} sx={modal.savingSpinner} />
                Saving
              </>
            ) : isBatchEditMode ? (
              S.SAVE_IDENTIFICATION_DETAILS
            ) : (
              S.IMPLEMENTATION_EDIT_TITLE
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
