import React, { useEffect, useMemo, useState } from "react";
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
import { useAlertStore } from "@app/store/alertStore";
import { useThemeStore } from "@app/store/themeStore";
import getManufacturingTheme from "@app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSearchableSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSearchableSelect";
import useUnitMasterOptions from "@hooks/admin/MasterData/useUnitMasterOptions";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";
import {
  emptyInsulationCategory,
  emptyInsulationParameter,
  getInsulationFormFieldErrors,
  getInsulationFormValidationMessage,
  type InsulationCategoryFieldErrors,
  type InsulationCategoryForm,
  type InsulationFormFieldErrors,
  type InsulationParameterForm,
  type InsulationSpecFormState,
} from "@data/models/admin/MasterData/InsulationSpecMasterModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";
import { visibleValidationError } from "./masterDataValidationUtils";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  isEdit: boolean;
  form: InsulationSpecFormState;
  saving: boolean;
  existingTypes?: string[];
  onClose: () => void;
  onSave: () => void;
  onChange: (next: InsulationSpecFormState) => void;
  t: any;
};

const ParameterEditor = ({
  parameters,
  disabled,
  isEdit,
  showErrors,
  parameterErrors,
  theme,
  unitOptions,
  onChange,
}: {
  parameters: InsulationParameterForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  parameterErrors?: InsulationCategoryFieldErrors["parameters"];
  theme: any;
  unitOptions: AppDropdownOption[];
  onChange: (next: InsulationParameterForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    {parameters.map((param, idx) => {
      const locked = isEdit && Boolean(param.isExisting);
      const editable = !locked;
      const updateRange = (referenceRange: MasterDataReferenceRange) => {
        const next = [...parameters];
        next[idx] = { ...param, referenceRange };
        onChange(next);
      };

      const rawErr = editable ? parameterErrors?.[idx] : undefined;
      const nameVisibleErr = visibleValidationError(
        rawErr?.specificationName,
        param.specificationName.trim().length > 0,
        showErrors,
      );
      const minVisibleErr = visibleValidationError(
        rawErr?.minValue,
        param.referenceRange.minValue != null,
        showErrors,
      );
      const maxVisibleErr = visibleValidationError(
        rawErr?.maxValue,
        param.referenceRange.maxValue != null,
        showErrors,
      );
      const nameError = Boolean(nameVisibleErr);
      const minError = Boolean(minVisibleErr);
      const maxError = Boolean(maxVisibleErr);

      return (
        <Box
          key={idx}
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
            opacity: locked && !param.isActive ? 0.72 : 1,
          }}
        >
          <CasePrepTextField
            label="Name"
            value={param.specificationName}
            disabled={disabled || locked}
            required={editable}
            error={nameError}
            helperText={nameVisibleErr ?? null}
            width="100%"
            theme={theme}
            onChange={(value) => {
              const next = [...parameters];
              next[idx] = { ...param, specificationName: value };
              onChange(next);
            }}
          />
          <CasePrepTextField
            label="Min"
            value={param.referenceRange.minValue != null ? String(param.referenceRange.minValue) : ""}
            disabled={disabled || locked}
            required={false}
            error={minError}
            helperText={minVisibleErr ?? null}
            width="100%"
            theme={theme}
            onChange={(value) =>
              updateRange({
                ...param.referenceRange,
                minValue: value === "" ? null : Number(value),
              })
            }
          />
          <CasePrepTextField
            label="Max"
            value={param.referenceRange.maxValue != null ? String(param.referenceRange.maxValue) : ""}
            disabled={disabled || locked}
            required={false}
            error={maxError}
            helperText={maxVisibleErr ?? null}
            width="100%"
            theme={theme}
            onChange={(value) =>
              updateRange({
                ...param.referenceRange,
                maxValue: value === "" ? null : Number(value),
              })
            }
          />
          <CasePrepSearchableSelect
            label="Unit"
            value={param.referenceRange.unitId != null ? String(param.referenceRange.unitId) : ""}
            placeholder="Select unit"
            options={unitOptions}
            disabled={disabled || locked}
            required={false}
            width="100%"
            theme={theme}
            onChange={(value) =>
              updateRange({
                ...param.referenceRange,
                unitId: value ? Number(value) : null,
                unit: "",
              })
            }
          />
          {locked ? (
            <MasterDataEnableDisableField
              checked={param.isActive}
              disabled={disabled}
              labelVariant="caption"
              confirmName={param.specificationName || "parameter"}
              onChange={(isActive) => {
                const next = [...parameters];
                next[idx] = { ...param, isActive };
                onChange(next);
              }}
            />
          ) : (
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(parameters.filter((_, i) => i !== idx))}
              sx={{ mb: 0.5 }}
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
      onClick={() => onChange([...parameters, emptyInsulationParameter()])}
      sx={{ alignSelf: "flex-start" }}
    >
      Add parameter
    </Button>
  </Stack>
);

const CategoryEditor = ({
  categories,
  disabled,
  isEdit,
  showErrors,
  specificationErrors,
  theme,
  unitOptions,
  onChange,
}: {
  categories: InsulationCategoryForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  specificationErrors?: InsulationFormFieldErrors["specifications"];
  theme: any;
  unitOptions: AppDropdownOption[];
  onChange: (next: InsulationCategoryForm[]) => void;
}) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};

  return (
    <Stack spacing={1.5}>
      {categories.map((cat, idx) => {
        const locked = isEdit && Boolean(cat.isExisting);
        const editable = !locked;
        const categoryVisibleErr = visibleValidationError(
          editable ? specificationErrors?.[idx]?.category : undefined,
          cat.category.trim().length > 0,
          showErrors,
        );
        const categoryError = Boolean(categoryVisibleErr);

        return (
          <Box
            key={idx}
            sx={{
              p: 1.5,
              border: "1px solid",
              borderColor: categoryError ? "error.main" : "divider",
              borderRadius: 1.5,
              bgcolor: "action.hover",
              opacity: locked && !cat.isActive ? 0.72 : 1,
            }}
          >
            <Box sx={{ ...flowBar.topRow, mb: 1.5 }}>
              <CasePrepTextField
                label="Category"
                value={cat.category}
                disabled={disabled || locked}
                required={editable}
                error={categoryError}
                helperText={categoryVisibleErr ?? null}
                width={320}
                theme={theme}
                onChange={(value) => {
                  const next = [...categories];
                  next[idx] = { ...cat, category: value };
                  onChange(next);
                }}
              />
              {locked ? (
                <MasterDataEnableDisableField
                  checked={cat.isActive}
                  disabled={disabled}
                  confirmName={cat.category || "category"}
                  onChange={(isActive) => {
                    const next = [...categories];
                    next[idx] = { ...cat, isActive };
                    onChange(next);
                  }}
                />
              ) : (
                <IconButton
                  size="small"
                  disabled={disabled}
                  onClick={() => onChange(categories.filter((_, i) => i !== idx))}
                  sx={{ alignSelf: "flex-end" }}
                >
                  <icons.Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
            <ParameterEditor
              parameters={cat.parameters}
              disabled={disabled}
              isEdit={isEdit}
              showErrors={showErrors}
              parameterErrors={specificationErrors?.[idx]?.parameters}
              theme={theme}
              unitOptions={unitOptions}
              onChange={(parameters) => {
                const next = [...categories];
                next[idx] = { ...cat, parameters };
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
        onClick={() => onChange([...categories, emptyInsulationCategory()])}
        sx={{ alignSelf: "flex-start" }}
      >
        Add category
      </Button>
    </Stack>
  );
};

const InsulationSpecMasterFormDialog = ({
  open,
  isEdit,
  form,
  saving,
  existingTypes = [],
  onClose,
  onSave,
  onChange,
  t,
}: Props) => {
  const mode = useThemeStore((s) => s.mode);
  const fieldTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const flowBar = fieldTheme.manufacturing?.casePreparation?.flowBar ?? {};
  const { modal } = t;
  const { options: unitOptions } = useUnitMasterOptions(open);
  const [showErrors, setShowErrors] = useState(false);
  const recordLabel = String(form.insulationType).trim() || "record";
  const fieldErrors = useMemo(
    () => getInsulationFormFieldErrors(form, isEdit, existingTypes),
    [form, isEdit, existingTypes],
  );
  const typeFieldError = visibleValidationError(
    fieldErrors.insulationType,
    String(form.insulationType ?? "").trim().length > 0,
    showErrors,
  );
  const typeError = Boolean(typeFieldError);

  useEffect(() => {
    if (!open) setShowErrors(false);
  }, [open]);

  const handleSave = () => {
    setShowErrors(true);
    const err = getInsulationFormValidationMessage(
      getInsulationFormFieldErrors(form, isEdit, existingTypes),
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
          icon={<icons.Inventory sx={modal.header.icon} />}
          title={isEdit ? S.FORM.EDIT_TITLE : S.FORM.CREATE_TITLE}
          subtitle={
            isEdit ? S.FORM.EDIT_SUBTITLE(recordLabel) : S.INSULATION_SPEC.CREATE_SUBTITLE
          }
          onClose={() => !saving && onClose()}
          closeDisabled={saving}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          <Box>
            <Typography sx={modal.fieldLabel}>Insulation details</Typography>
            <Box sx={flowBar.topRow}>
              <CasePrepTextField
                label={S.INSULATION_SPEC.COL_INSULATION_TYPE}
                value={String(form.insulationType)}
                disabled={saving || isEdit}
                required
                error={typeError}
                helperText={typeFieldError ?? null}
                width={220}
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, insulationType: value })}
              />
              <MasterDataEnableDisableField
                checked={form.isActive}
                disabled={saving}
                minWidth={120}
                confirmName={String(form.insulationType) || "insulation specification"}
                onChange={(isActive) => onChange({ ...form, isActive })}
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={modal.fieldLabel}>Categories & parameters</Typography>
            {isEdit ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {S.INSULATION_SPEC.EDIT_NESTED_HINT}
              </Typography>
            ) : null}
            {showErrors && fieldErrors.form ? (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                {fieldErrors.form}
              </Typography>
            ) : null}
            <CategoryEditor
              categories={form.specifications}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              specificationErrors={fieldErrors.specifications}
              theme={fieldTheme}
              unitOptions={unitOptions}
              onChange={(specifications) => onChange({ ...form, specifications })}
            />
          </Box>
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

export default InsulationSpecMasterFormDialog;
