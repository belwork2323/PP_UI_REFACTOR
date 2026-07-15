import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Zoom,
  TextField,
  InputAdornment,
  Grid,
  Divider,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import Input from "@ui/components/common/Input";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import { materialSelectionKey } from "@data/models/user/MaterialsListModel";
import type { BatchMaterialOption } from "@data/models/admin/BatchManagement/BatchManagementModel";

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

const displayNumberValue = (value: number | undefined | null, emptyWhenZero = true): string => {
  if (value == null || (emptyWhenZero && value === 0)) return "";
  return String(value);
};

const parseIntField = (raw: string): number => {
  if (raw === "") return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const materialManufacturer = (material: Material): string =>
  String(material.manufacturerName ?? material.make ?? "").trim();

export default function BatchImplementationForm({
  open,
  onClose,
  onSave,
  editTarget,
  form,
  onFormChange,
  onMaterialsChange,
  readOnly = false,
  saving,
  t,
  materialOptions = [],
  loadingMaterials = false,
  loadingLots = false,
  getLotByMaterialAndId,
  getLotOptionsForRow,
  onCompositionChange,
  setConfirmOpen,
}: any) {
  const { modal, input } = t;
  const [selectedMaterialCode, setSelectedMaterialCode] = useState("");
  const [selectedGradeCode, setSelectedGradeCode] = useState("");

  const fieldDisabled = readOnly || saving;

  useEffect(() => {
    if (!open) {
      setSelectedMaterialCode("");
      setSelectedGradeCode("");
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

  const usedMaterialKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const material of form.identificationSheet?.materials ?? []) {
      keys.add(materialSelectionKey(material.materialCode, material.gradeCode));
    }
    return keys;
  }, [form.identificationSheet?.materials]);

  const selectedMaterialOption = useMemo(
    () =>
      (materialOptions as BatchMaterialOption[]).find(
        (item) => item.materialCode === selectedMaterialCode,
      ),
    [materialOptions, selectedMaterialCode],
  );

  const selectableMaterials = useMemo(() => {
    return (materialOptions as BatchMaterialOption[]).filter((material) => {
      const grades = material.grades ?? [];
      if (grades.length > 0) {
        return grades.some(
          (grade) =>
            !usedMaterialKeys.has(materialSelectionKey(material.materialCode, grade.gradeCode)),
        );
      }
      return !usedMaterialKeys.has(material.materialCode);
    });
  }, [materialOptions, usedMaterialKeys]);

  const showGradeSelect = Boolean(
    selectedMaterialOption && (selectedMaterialOption.grades?.length ?? 0) > 0,
  );

  const selectableGrades = useMemo(() => {
    if (!showGradeSelect || !selectedMaterialOption) return [];
    return (selectedMaterialOption.grades ?? []).filter(
      (grade) =>
        !usedMaterialKeys.has(
          materialSelectionKey(selectedMaterialOption.materialCode, grade.gradeCode),
        ),
    );
  }, [selectedMaterialOption, showGradeSelect, usedMaterialKeys]);

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

    const selectionKey = materialSelectionKey(
      selectedMaterialOption.materialCode,
      grade?.gradeCode,
    );
    if (usedMaterialKeys.has(selectionKey)) return;

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
    const batchSize = Number(form.identificationSheet?.batchSize) || 0;
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
          title={readOnly ? S.IMPLEMENTATION_VIEW_TITLE : S.IMPLEMENTATION_EDIT_TITLE}
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
            <Typography sx={modal.fieldLabel}>{S.IDENTIFICATION_LABEL}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth
                label="Date"
                type="date"
                value={form.identificationSheet?.date ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, date: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small"
                sx={input}
                InputLabelProps={{ shrink: true }}
                disabled={readOnly}
              />
              <Input
                fullWidth
                label="Batch Size (KG)"
                type="number"
                value={displayNumberValue(form.identificationSheet?.batchSize)}
                onChange={(e) => {
                  const newIdent = {
                    ...form.identificationSheet,
                    batchSize: parseIntField(e.target.value),
                  };
                  onFormChange("identificationSheet", newIdent);
                  recalculateMaterialQuantities(newIdent);
                }}
                required
                size="small"
                sx={input}
                inputProps={{ min: 1 }}
                disabled={readOnly}
              />
            </Stack>
          </Box>

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth
                label="Bonding Sheet No"
                value={form.identificationSheet?.bondingSheetNo ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, bondingSheetNo: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small"
                sx={input}
                disabled={fieldDisabled}
              />
              <Input
                fullWidth
                label="Mixer Type"
                value={
                  form.identificationSheet?.mixerType ??
                  form.identificationSheet?.mixerDetails ??
                  ""
                }
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, mixerType: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small"
                sx={input}
                disabled={fieldDisabled}
              />
            </Stack>
          </Box>

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth
                label="Building No"
                value={form.identificationSheet?.BldgNo ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, BldgNo: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small"
                sx={input}
                disabled={fieldDisabled}
              />
              <Input
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
                size="small"
                sx={input}
                inputProps={{ min: 1 }}
                disabled={fieldDisabled}
              />
              <Input
                fullWidth
                label="Remarks"
                value={form.identificationSheet?.remarks ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, remarks: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small"
                sx={input}
                disabled={fieldDisabled}
              />
            </Stack>
          </Box>

          {/* Materials Table */}
          <Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 2, flexWrap: "wrap" }}
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
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "flex-end" }}
                  sx={{ flex: 1, minWidth: 280, maxWidth: 720 }}
                >
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography sx={modal.fieldLabel}>{S.SELECT_MATERIAL_LABEL}</Typography>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={selectedMaterialCode}
                      onChange={(e) => handleMaterialSelectChange(e.target.value)}
                      disabled={loadingMaterials || selectableMaterials.length === 0}
                      sx={input}
                      SelectProps={{
                        displayEmpty: true,
                        IconComponent: ExpandMoreRoundedIcon,
                        MenuProps: t.menuPaper,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScienceRoundedIcon
                              sx={{
                                fontSize: 16,
                                color: selectedMaterialCode ? "primary.main" : "text.disabled",
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="" disabled>
                        <Typography color="text.disabled" fontSize="0.85rem">
                          {loadingMaterials
                            ? S.LOADING_MATERIALS
                            : S.SELECT_MATERIAL_PLACEHOLDER}
                        </Typography>
                      </MenuItem>
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
                    </TextField>
                  </Box>

                  {showGradeSelect ? (
                    <Box sx={{ flex: 1, minWidth: 180 }}>
                      <Typography sx={modal.fieldLabel}>{S.SELECT_GRADE_LABEL}</Typography>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        value={selectedGradeCode}
                        onChange={(e) => setSelectedGradeCode(e.target.value)}
                        disabled={loadingMaterials || selectableGrades.length === 0}
                        sx={input}
                        SelectProps={{
                          displayEmpty: true,
                          IconComponent: ExpandMoreRoundedIcon,
                          MenuProps: t.menuPaper,
                        }}
                      >
                        <MenuItem value="" disabled>
                          <Typography color="text.disabled" fontSize="0.85rem">
                            {S.SELECT_GRADE_PLACEHOLDER}
                          </Typography>
                        </MenuItem>
                        {selectableGrades.map((grade) => (
                          <MenuItem key={grade.gradeCode} value={grade.gradeCode}>
                            {grade.gradeName || grade.gradeCode}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ) : null}

                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAddMaterial}
                    disabled={!canAddMaterial}
                    startIcon={<AddRoundedIcon />}
                    sx={{ height: 40, whiteSpace: "nowrap" }}
                  >
                    {S.ADD_MATERIAL}
                  </Button>
                </Stack>
              )}
            </Box>

            {(form.identificationSheet?.materials?.length ?? 0) > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sr. No</TableCell>
                      <TableCell>Material Code</TableCell>
                      <TableCell>Material Name</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Lot ID</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>Required Composition %</TableCell>
                      <TableCell>Qty/Premix</TableCell>
                      <TableCell>Revalidation From</TableCell>
                      <TableCell>Revalidation To</TableCell>
                      {!readOnly && <TableCell>Action</TableCell>}
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

                      return (
                        <TableRow key={`${material.materialCode}-${material.gradeCode ?? ""}-${idx}`}>
                          <TableCell>{material.srNo}</TableCell>
                          <TableCell>
                            <Input value={material.materialCode} disabled size="small" sx={input} />
                          </TableCell>
                          <TableCell>
                            <Input value={material.materialName} disabled size="small" sx={input} />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={material.gradeName || material.gradeCode || "—"}
                              disabled
                              size="small"
                              sx={input}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small" sx={input}>
                              <Select
                                value={material.lotId}
                                displayEmpty
                                onChange={(e) => handleLotIdChange(idx, e.target.value)}
                                disabled={fieldDisabled || loadingLots || !material.materialCode}
                                MenuProps={t.menuPaper}
                                renderValue={(value) => {
                                  if (!value) {
                                    return <em>{lotPlaceholder}</em>;
                                  }
                                  return value;
                                }}
                              >
                                <MenuItem value="">
                                  <em>{lotPlaceholder}</em>
                                </MenuItem>
                                {lotOptionsForRow.map((lot) => (
                                  <MenuItem key={lot.lotId} value={lot.lotId}>
                                    {lot.lotId}
                                    {lot.grade?.gradeName || lot.grade?.gradeCode
                                      ? ` · ${lot.grade?.gradeName || lot.grade?.gradeCode}`
                                      : ""}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={materialManufacturer(material)}
                              placeholder="Select a lot"
                              disabled
                              size="small"
                              sx={input}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={displayNumberValue(material.requiredComposition)}
                              onChange={(e) => {
                                const composition = Number.parseFloat(e.target.value) || 0;
                                handleMaterialValuesChange(idx, composition);
                              }}
                              size="small"
                              sx={input}
                              inputProps={{ step: 0.1 }}
                              disabled={fieldDisabled}
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              value={displayNumberValue(material.quantityPerPremix)}
                              size="small"
                              sx={input}
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={material.revalidationFromDate ?? ""}
                              onChange={(e) =>
                                handleMaterialChange(idx, "revalidationFromDate", e.target.value)
                              }
                              size="small"
                              sx={input}
                              InputLabelProps={{ shrink: true }}
                              disabled={fieldDisabled}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={material.revalidationToDate ?? ""}
                              onChange={(e) =>
                                handleMaterialChange(idx, "revalidationToDate", e.target.value)
                              }
                              size="small"
                              sx={input}
                              InputLabelProps={{ shrink: true }}
                              disabled={fieldDisabled}
                            />
                          </TableCell>
                          {!readOnly && (
                            <TableCell>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMaterial(idx)}
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
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      fullWidth
                      label="Composition Approved as per PRC dated"
                      type="date"
                      value={form.identificationSheet?.prcApprovalDate ?? ""}
                      onChange={(e) => {
                        const newIdent = {
                          ...form.identificationSheet,
                          prcApprovalDate: e.target.value,
                        };

                        onFormChange("identificationSheet", newIdent);
                      }}
                      size="small"
                      sx={input}
                      InputLabelProps={{ shrink: true }}
                      disabled={fieldDisabled}
                    />
                  </Grid>
                </Grid>
              </TableContainer>
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
            ) : (
              "Complete Identification"
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
