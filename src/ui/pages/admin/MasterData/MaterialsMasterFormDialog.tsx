import React, { useEffect, useMemo, useState } from "react";
import { useAlertStore } from "@app/store/alertStore";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  Zoom,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import getManufacturingTheme from "@app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSelect";
import CasePrepSearchableSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSearchableSelect";
import {
  emptyMaterialGrade,
  emptyMaterialSpec,
  getMaterialsFormFieldErrors,
  getMaterialsFormValidationMessage,
  PREPARATION_TYPE_OPTIONS,
  RAW_MATERIAL_TYPE_OPTIONS,
  type MaterialGradeFieldErrors,
  type MaterialSpecFieldErrors,
  type MaterialsFormFieldErrors,
  type MaterialGradeForm,
  type MaterialSpecForm,
  type MaterialsMasterFormState,
  type PreparationTypeValue,
  type RawMaterialTypeValue,
} from "@data/models/admin/MasterData/MaterialsMasterModel";
import { visibleValidationError } from "./masterDataValidationUtils";
import useUnitMasterOptions from "@hooks/admin/MasterData/useUnitMasterOptions";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

const MATERIAL_TYPE_OPTIONS = [
  { value: "SOLID", label: "SOLID" },
  { value: "LIQUID", label: "LIQUID" },
];

type Props = {
  open: boolean;
  isEdit: boolean;
  form: MaterialsMasterFormState;
  saving: boolean;
  existingCodes?: string[];
  onClose: () => void;
  onSave: () => void;
  onChange: (next: MaterialsMasterFormState) => void;
  t: any;
};

const SpecEditor = ({
  specs,
  disabled,
  isEdit,
  showErrors,
  specErrors,
  theme,
  unitOptions,
  onChange,
}: {
  specs: MaterialSpecForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  specErrors?: MaterialSpecFieldErrors[];
  theme: any;
  unitOptions: AppDropdownOption[];
  onChange: (next: MaterialSpecForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    {specs.map((spec, idx) => {
      const locked = isEdit && Boolean(spec.isExisting);
      const editable = !locked;
      const rawErr = editable ? specErrors?.[idx] : undefined;
      const nameVisibleErr = visibleValidationError(
        rawErr?.specificationName,
        spec.specificationName.trim().length > 0,
        showErrors,
      );
      const minVisibleErr = visibleValidationError(
        rawErr?.minValue,
        spec.referenceRange.minValue != null,
        showErrors,
      );
      const maxVisibleErr = visibleValidationError(
        rawErr?.maxValue,
        spec.referenceRange.maxValue != null,
        showErrors,
      );
      const nameError = Boolean(nameVisibleErr);
      const minError = Boolean(minVisibleErr);
      const maxError = Boolean(maxVisibleErr);

      const updateRange = (referenceRange: MasterDataReferenceRange) => {
        const next = [...specs];
        next[idx] = { ...spec, referenceRange };
        onChange(next);
      };

      return (
        <Box
          key={spec.specificationCode || `spec-${idx}`}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(160px, 1fr) 100px 100px minmax(160px, 200px) auto",
            },
            gap: 1.5,
            alignItems: "flex-end",
            p: 1.5,
            border: "1px solid",
            borderColor: nameError || minError || maxError ? "error.main" : "divider",
            borderRadius: 1.5,
            bgcolor: locked ? "action.hover" : "background.paper",
            opacity: locked && !spec.isActive ? 0.72 : 1,
          }}
        >
          <CasePrepTextField
            label="Name"
            value={spec.specificationName}
            disabled={disabled || locked}
            required={editable}
            error={nameError}
            helperText={nameVisibleErr ?? null}
            width="100%"
            theme={theme}
            onChange={(value) => {
              const next = [...specs];
              next[idx] = { ...spec, specificationName: value };
              onChange(next);
            }}
          />
          <CasePrepTextField
            label="Min"
            value={spec.referenceRange.minValue != null ? String(spec.referenceRange.minValue) : ""}
            disabled={disabled || locked}
            required={false}
            error={minError}
            helperText={minVisibleErr ?? null}
            width="100%"
            theme={theme}
            onChange={(value) =>
              updateRange({
                ...spec.referenceRange,
                minValue: value === "" ? null : Number(value),
              })
            }
          />
          <CasePrepTextField
            label="Max"
            value={spec.referenceRange.maxValue != null ? String(spec.referenceRange.maxValue) : ""}
            disabled={disabled || locked}
            required={false}
            error={maxError}
            helperText={maxVisibleErr ?? null}
            width="100%"
            theme={theme}
            onChange={(value) =>
              updateRange({
                ...spec.referenceRange,
                maxValue: value === "" ? null : Number(value),
              })
            }
          />
          <CasePrepSearchableSelect
            label="Unit"
            value={spec.referenceRange.unitId != null ? String(spec.referenceRange.unitId) : ""}
            placeholder="Select unit"
            options={unitOptions}
            disabled={disabled || locked}
            required={false}
            width="100%"
            theme={theme}
            onChange={(value) =>
              updateRange({
                ...spec.referenceRange,
                unitId: value ? Number(value) : null,
                unit: "",
              })
            }
          />
          {locked ? (
            <MasterDataEnableDisableField
              checked={spec.isActive}
              disabled={disabled}
              labelVariant="caption"
              confirmName={spec.specificationName || "specification"}
              onChange={(isActive) => {
                const next = [...specs];
                next[idx] = { ...spec, isActive };
                onChange(next);
              }}
            />
          ) : (
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(specs.filter((_, i) => i !== idx))}
              sx={{ mb: 0.5 }}
              aria-label="Remove specification"
            >
              <icons.Delete fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    })}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...specs, emptyMaterialSpec()])}
      sx={{ alignSelf: "flex-start" }}
    >
      Add specification
    </Button>
  </Stack>
);

const GradeEditor = ({
  grades,
  disabled,
  isEdit,
  showErrors,
  gradeErrors,
  theme,
  unitOptions,
  onChange,
}: {
  grades: MaterialGradeForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  gradeErrors?: MaterialGradeFieldErrors[];
  theme: any;
  unitOptions: AppDropdownOption[];
  onChange: (next: MaterialGradeForm[]) => void;
}) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};

  return (
    <Stack spacing={1.5}>
      {grades.map((grade, idx) => {
        const locked = isEdit && Boolean(grade.isExisting);
        const editable = !locked;
        const rawErr = editable ? gradeErrors?.[idx] : undefined;
        const codeError = visibleValidationError(
          rawErr?.gradeCode,
          grade.gradeCode.trim().length > 0,
          showErrors,
        );
        const nameError = visibleValidationError(
          rawErr?.gradeName,
          grade.gradeName.trim().length > 0,
          showErrors,
        );
        const hasError = Boolean(codeError || nameError);

        return (
        <Box
          key={grade.gradeId || `grade-${idx}`}
          sx={{
            p: 1.5,
            border: "1px solid",
            borderColor: hasError ? "error.main" : "divider",
            borderRadius: 1.5,
            bgcolor: "action.hover",
            opacity: locked && !grade.isActive ? 0.72 : 1,
          }}
        >
          <Box sx={flowBar.topRow} mb={1.5}>
            <CasePrepTextField
              label="Grade code"
              value={grade.gradeCode}
              disabled={disabled || locked}
              required={editable}
              error={Boolean(codeError)}
              helperText={codeError ?? null}
              width={180}
              theme={theme}
              onChange={(value) => {
                const next = [...grades];
                next[idx] = { ...grade, gradeCode: value };
                onChange(next);
              }}
            />
            <CasePrepTextField
              label="Grade name"
              value={grade.gradeName}
              disabled={disabled || locked}
              required={editable}
              error={Boolean(nameError)}
              helperText={nameError ?? null}
              width={280}
              theme={theme}
              onChange={(value) => {
                const next = [...grades];
                next[idx] = { ...grade, gradeName: value };
                onChange(next);
              }}
            />
            {locked ? (
              <MasterDataEnableDisableField
                checked={grade.isActive}
                disabled={disabled}
                confirmName={grade.gradeName || grade.gradeCode || "grade"}
                onChange={(isActive) => {
                  const next = [...grades];
                  next[idx] = { ...grade, isActive };
                  onChange(next);
                }}
              />
            ) : (
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => onChange(grades.filter((_, i) => i !== idx))}
                sx={{ alignSelf: "flex-end" }}
                aria-label="Remove grade"
              >
                <icons.Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Grade specifications
          </Typography>
          <SpecEditor
            specs={grade.specifications}
            disabled={disabled}
            isEdit={isEdit}
            showErrors={showErrors}
            specErrors={rawErr?.specifications}
            theme={theme}
            unitOptions={unitOptions}
            onChange={(specifications) => {
              const next = [...grades];
              next[idx] = { ...grade, specifications };
              onChange(next);
            }}
          />
        </Box>
      );
      })}
      <Button
        size="small"
        startIcon={<icons.projectMgmt.add />}
        disabled={disabled}
        onClick={() => onChange([...grades, emptyMaterialGrade()])}
        sx={{ alignSelf: "flex-start" }}
      >
        Add grade
      </Button>
    </Stack>
  );
};

const MaterialsMasterFormDialog = ({
  open,
  isEdit,
  form,
  saving,
  existingCodes = [],
  onClose,
  onSave,
  onChange,
  t,
}: Props) => {
  const mode = useThemeStore((s) => s.mode);
  const fieldTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const flowBar = fieldTheme.manufacturing?.casePreparation?.flowBar ?? {};
  const { options: unitOptions } = useUnitMasterOptions(open);
  const { modal } = t;
  const [showErrors, setShowErrors] = useState(false);
  const recordLabel = form.materialName.trim() || form.materialCode.trim() || "record";
  const showMaterialFields =
    isEdit ||
    form.rawMaterialType === "NORMAL" ||
    (form.rawMaterialType === "ACEM" && Boolean(form.preparationType));
  const fieldErrors = useMemo(
    () => getMaterialsFormFieldErrors(form, isEdit, existingCodes),
    [form, isEdit, existingCodes],
  );
  const materialCodeError = visibleValidationError(
    fieldErrors.materialCode,
    form.materialCode.trim().length > 0,
    showErrors,
  );
  const materialNameError = visibleValidationError(
    fieldErrors.materialName,
    form.materialName.trim().length > 0,
    showErrors,
  );

  useEffect(() => {
    if (!open) setShowErrors(false);
  }, [open]);

  const handleSave = () => {
    setShowErrors(true);
    const err = getMaterialsFormValidationMessage(
      getMaterialsFormFieldErrors(form, isEdit, existingCodes),
    );
    if (err) {
      useAlertStore.getState().showValidationAlert(err);
      return;
    }
    onSave();
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={<icons.RawMaterial sx={modal.header.icon} />}
          title={isEdit ? S.FORM.EDIT_TITLE : S.FORM.CREATE_TITLE}
          subtitle={isEdit ? S.FORM.EDIT_SUBTITLE(recordLabel) : S.FORM.CREATE_SUBTITLE}
          onClose={() => !saving && onClose()}
          closeDisabled={saving}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          <Box>
            <Typography sx={modal.fieldLabel}>Category</Typography>
            <Box sx={flowBar.topRow}>
              <CasePrepSelect
                label="Category"
                value={form.rawMaterialType}
                placeholder="Select category"
                options={RAW_MATERIAL_TYPE_OPTIONS}
                disabled={saving || isEdit}
                required
                width={240}
                theme={fieldTheme}
                onChange={(value) => {
                  const rawMaterialType = value as RawMaterialTypeValue;
                  onChange({
                    ...form,
                    rawMaterialType,
                    preparationType: rawMaterialType === "ACEM" ? form.preparationType : "",
                  });
                }}
              />
              {form.rawMaterialType === "ACEM" ? (
                <CasePrepSelect
                  label="Preparation type"
                  value={form.preparationType}
                  placeholder="Select preparation type"
                  options={PREPARATION_TYPE_OPTIONS}
                  disabled={saving || isEdit}
                  required
                  width={220}
                  theme={fieldTheme}
                  onChange={(value) =>
                    onChange({ ...form, preparationType: value as PreparationTypeValue })
                  }
                />
              ) : null}
            </Box>
          </Box>

          {showMaterialFields ? (
            <>
          <Box>
            <Typography sx={modal.fieldLabel}>Material details</Typography>
            <Box sx={flowBar.topRow}>
              <CasePrepTextField
                label="Material code"
                value={form.materialCode}
                disabled={saving || isEdit}
                required
                error={Boolean(materialCodeError)}
                helperText={materialCodeError ?? null}
                width={180}
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, materialCode: value })}
              />
              <CasePrepTextField
                label="Name"
                value={form.materialName}
                disabled={saving}
                required
                error={Boolean(materialNameError)}
                helperText={materialNameError ?? null}
                width={320}
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, materialName: value })}
              />
              <CasePrepSelect
                label="Type"
                value={form.materialType}
                placeholder="Select type"
                options={MATERIAL_TYPE_OPTIONS}
                disabled={saving}
                required
                width={160}
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, materialType: value as "SOLID" | "LIQUID" })}
              />
              <MasterDataEnableDisableField
                checked={form.isActive}
                disabled={saving}
                minWidth={120}
                confirmName={form.materialName || form.materialCode || "material"}
                onChange={(isActive) => onChange({ ...form, isActive })}
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={modal.fieldLabel}>Grades</Typography>
            {isEdit ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {S.MATERIALS.EDIT_NESTED_HINT}
              </Typography>
            ) : null}
            {showErrors && fieldErrors.form ? (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>{fieldErrors.form}</Typography>
            ) : null}
            <GradeEditor
              grades={form.grades}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              gradeErrors={fieldErrors.grades}
              theme={fieldTheme}
              unitOptions={unitOptions}
              onChange={(grades) => onChange({ ...form, grades })}
            />
          </Box>

          <Box>
            <Typography sx={modal.fieldLabel}>Specifications</Typography>
            <SpecEditor
              specs={form.specifications}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              specErrors={fieldErrors.specifications}
              theme={fieldTheme}
              unitOptions={unitOptions}
              onChange={(specifications) => onChange({ ...form, specifications })}
            />
          </Box>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={modal.saveButton}>
          {saving ? (
            <>
              <CircularProgress size={14} sx={modal.savingSpinner} />
              {S.FORM.SAVING}
            </>
          ) : (
            S.FORM.SAVE
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialsMasterFormDialog;
