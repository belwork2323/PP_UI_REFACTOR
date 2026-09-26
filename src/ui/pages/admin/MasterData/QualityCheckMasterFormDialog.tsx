import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import AppDropdown from "@ui/components/common/AppDropdown";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSearchableSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSearchableSelect";
import {
  masterDataNumericFieldHasValue,
  sanitizeMasterDataDecimalInput,
} from "@data/models/admin/MasterData/masterDataNumericInput";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import useUnitMasterOptions from "@hooks/admin/MasterData/useUnitMasterOptions";
import {
  emptyQualityCheckParam,
  formatMotorStageLabel,
  getQualityCheckFieldErrors,
  getQualityCheckValidationMessage,
  type QualityCheckFieldErrors,
  type QualityCheckFormState,
  type QualityCheckParamForm,
  type QualityCheckRecord,
} from "@data/models/admin/MasterData/QualityCheckMasterModel";
import { formatMixTypeLabel } from "@data/models/admin/MasterData/mixTypeOptions";
import { visibleValidationError } from "./masterDataValidationUtils";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  isEdit: boolean;
  form: QualityCheckFormState;
  saving: boolean;
  motorStageOptions: AppDropdownOption[];
  motorStageLoading?: boolean;
  mixTypeOptions: AppDropdownOption[];
  existingRecords?: QualityCheckRecord[];
  onClose: () => void;
  onSave: () => void;
  onChange: (next: QualityCheckFormState) => void;
  t: any;
};

const ParametersEditor = ({
  params,
  disabled,
  isEdit,
  showErrors,
  paramErrors,
  unitOptions,
  unitLoading,
  theme,
  onChange,
}: {
  params: QualityCheckParamForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  paramErrors?: QualityCheckFieldErrors["qualityChecks"];
  unitOptions: AppDropdownOption[];
  unitLoading?: boolean;
  theme: any;
  onChange: (next: QualityCheckParamForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    <Typography variant="subtitle2">{S.QUALITY_CHECKS.PARAMETERS}</Typography>
    {params.map((param, idx) => {
      const locked = isEdit && Boolean(param.isExisting);
      const unitMissing =
        param.specification.unitId == null && !String(param.specification.unit ?? "").trim();
      // Allow selecting unit when it was never saved; other fields stay locked.
      const unitLocked = locked && !unitMissing;
      const resolvedUnitValue = (() => {
        if (param.specification.unitId != null) {
          return String(param.specification.unitId);
        }
        const unitLabel = String(param.specification.unit ?? "").trim().toLowerCase();
        if (!unitLabel) return "";
        const match = unitOptions.find(
          (item) => String(item.label ?? "").trim().toLowerCase() === unitLabel,
        );
        return match ? String(match.value) : "";
      })();
      const rawErr = paramErrors?.[idx];
      const nameError = visibleValidationError(
        rawErr?.parameterName,
        param.parameterName.trim().length > 0,
        showErrors,
      );
      const minError = visibleValidationError(
        rawErr?.minValue,
        masterDataNumericFieldHasValue(param.specification.minValue),
        showErrors,
      );
      const maxError = visibleValidationError(
        rawErr?.maxValue,
        masterDataNumericFieldHasValue(param.specification.maxValue),
        showErrors,
      );
      const unitError = visibleValidationError(
        rawErr?.unit,
        param.specification.unitId != null || String(param.specification.unit ?? "").trim().length > 0,
        showErrors,
      );
      const samplesError = visibleValidationError(
        rawErr?.noOfSamples,
        param.noOfSamples !== "",
        showErrors,
      );
      const hasFieldError = Boolean(
        nameError || minError || maxError || unitError || samplesError,
      );

      return (
        <Box
          key={`${param.parameterId || "new"}-${idx}`}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            p: 1.5,
            border: "1px solid",
            borderColor: hasFieldError ? "error.main" : "divider",
            borderRadius: 1.5,
            bgcolor: locked ? "action.hover" : "background.paper",
            opacity: !param.isActive ? 0.72 : 1,
          }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 120px" },
                gap: 1,
              }}
            >
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_NAME}
                value={param.parameterName}
                disabled={disabled || locked}
                required={!locked}
                error={Boolean(nameError)}
                helperText={nameError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...params];
                  next[idx] = { ...param, parameterName: value };
                  onChange(next);
                }}
              />
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_SAMPLES}
                value={param.noOfSamples === "" ? "" : String(param.noOfSamples)}
                disabled={disabled || locked}
                required={!locked}
                error={Boolean(samplesError)}
                helperText={samplesError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...params];
                  next[idx] = {
                    ...param,
                    noOfSamples: value === "" ? "" : Number(value),
                  };
                  onChange(next);
                }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 1,
              }}
            >
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_MIN}
                value={param.specification.minValue}
                disabled={disabled || locked}
                error={Boolean(minError)}
                helperText={minError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const sanitized = sanitizeMasterDataDecimalInput(value);
                  if (sanitized === null) return;
                  const next = [...params];
                  next[idx] = {
                    ...param,
                    specification: { ...param.specification, minValue: sanitized },
                  };
                  onChange(next);
                }}
              />
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_MAX}
                value={param.specification.maxValue}
                disabled={disabled || locked}
                error={Boolean(maxError)}
                helperText={maxError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const sanitized = sanitizeMasterDataDecimalInput(value);
                  if (sanitized === null) return;
                  const next = [...params];
                  next[idx] = {
                    ...param,
                    specification: { ...param.specification, maxValue: sanitized },
                  };
                  onChange(next);
                }}
              />
              <Box>
                <CasePrepSearchableSelect
                  label={S.QUALITY_CHECKS.PARAM_UNIT}
                  value={resolvedUnitValue}
                  placeholder="Select unit"
                  disabled={disabled || unitLocked || unitLoading}
                  options={unitOptions}
                  width="100%"
                  theme={theme}
                  onChange={(value) => {
                    const option = unitOptions.find((item) => item.value === value);
                    const next = [...params];
                    next[idx] = {
                      ...param,
                      specification: {
                        ...param.specification,
                        unitId: value === "" ? null : Number(value),
                        unit: option ? String(option.label ?? "") : "",
                      },
                    };
                    onChange(next);
                  }}
                />
                {unitError ? (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                    {unitError}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
          <MasterDataEnableDisableField
            checked={param.isActive}
            disabled={disabled}
            labelVariant="caption"
            minWidth={96}
            requireConfirmation={locked}
            confirmName={param.parameterName.trim() || `parameter ${idx + 1}`}
            onChange={(isActive) => {
              const next = [...params];
              next[idx] = { ...param, isActive };
              onChange(next);
            }}
          />
          {!locked ? (
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(params.filter((_, i) => i !== idx))}
              aria-label={S.QUALITY_CHECKS.REMOVE_PARAMETER}
              sx={{ mt: 2.75, flexShrink: 0 }}
            >
              <icons.Delete fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      );
    })}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...params, emptyQualityCheckParam()])}
    >
      {S.QUALITY_CHECKS.ADD_PARAMETER}
    </Button>
  </Stack>
);

const QualityCheckMasterFormDialog = ({
  open,
  isEdit,
  form,
  saving,
  motorStageOptions,
  motorStageLoading = false,
  mixTypeOptions,
  existingRecords = [],
  onClose,
  onSave,
  onChange,
  t,
}: Props) => {
  const { modal } = t;
  const mode = useThemeStore((state) => state.mode);
  const fieldTheme = getManufacturingTheme(mode);
  const flowBar = fieldTheme.manufacturing?.casePreparation?.flowBar ?? {};
  const { options: unitOptions, loading: unitLoading } = useUnitMasterOptions(open);
  const [showErrors, setShowErrors] = useState(false);
  const recordLabel =
    form.qualityCheckCode ||
    `${formatMixTypeLabel(form.mixType)} · ${formatMotorStageLabel(form.motorStage, motorStageOptions)}` ||
    "record";
  const fieldErrors = useMemo(
    () => getQualityCheckFieldErrors(form, isEdit, existingRecords),
    [form, isEdit, existingRecords],
  );
  const mixTypeError = visibleValidationError(
    fieldErrors.mixType,
    form.mixType.trim().length > 0,
    showErrors,
  );
  const stageError = visibleValidationError(
    fieldErrors.motorStage,
    form.motorStage !== "",
    showErrors,
  );

  useEffect(() => {
    if (!open) setShowErrors(false);
  }, [open]);

  const handleSave = () => {
    setShowErrors(true);
    const err = getQualityCheckValidationMessage(
      getQualityCheckFieldErrors(form, isEdit, existingRecords),
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
            isEdit ? S.QUALITY_CHECKS.EDIT_SUBTITLE(recordLabel) : S.QUALITY_CHECKS.CREATE_SUBTITLE
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
            <Typography sx={modal.fieldLabel}>Quality check details</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(180px, 200px) minmax(180px, 200px) minmax(220px, 1fr) auto",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              {isEdit ? (
                <>
                  <CasePrepTextField
                    label={S.QUALITY_CHECKS.COL_MIX_TYPE}
                    value={formatMixTypeLabel(form.mixType)}
                    disabled
                    width="100%"
                    theme={fieldTheme}
                    onChange={() => undefined}
                  />
                  <CasePrepTextField
                    label={S.QUALITY_CHECKS.COL_MOTOR_STAGE}
                    value={formatMotorStageLabel(form.motorStage, motorStageOptions)}
                    disabled
                    width="100%"
                    theme={fieldTheme}
                    onChange={() => undefined}
                  />
                </>
              ) : (
                <>
                  <Box sx={flowBar.selectField?.("100%")}>
                    <Typography component="label" sx={flowBar.selectLabel}>
                      <FieldLabelWithAsterisk label={S.QUALITY_CHECKS.COL_MIX_TYPE} required />
                    </Typography>
                    <AppDropdown
                      value={form.mixType}
                      onChange={(value) => onChange({ ...form, mixType: value })}
                      options={mixTypeOptions}
                      placeholder={S.QUALITY_CHECKS.MIX_TYPE_SELECT_PLACEHOLDER}
                      disabled={saving}
                      error={Boolean(mixTypeError)}
                      helperText={mixTypeError}
                      fullWidth
                      sx={{
                        mb: 0,
                        ...flowBar.selectInput?.(form.mixType.trim().length > 0),
                      }}
                    />
                  </Box>
                  <Box sx={flowBar.selectField?.("100%")}>
                    <Typography component="label" sx={flowBar.selectLabel}>
                      <FieldLabelWithAsterisk label={S.QUALITY_CHECKS.COL_MOTOR_STAGE} required />
                    </Typography>
                    <AppDropdown
                      value={form.motorStage === "" ? "" : String(form.motorStage)}
                      onChange={(value) =>
                        onChange({
                          ...form,
                          motorStage: value === "" ? "" : Number(value),
                        })
                      }
                      options={motorStageOptions}
                      loading={motorStageLoading}
                      placeholder={S.QUALITY_CHECKS.MOTOR_STAGE_SELECT_PLACEHOLDER}
                      disabled={saving}
                      error={Boolean(stageError)}
                      helperText={stageError}
                      fullWidth
                      sx={{
                        mb: 0,
                        ...flowBar.selectInput?.(form.motorStage !== ""),
                      }}
                    />
                  </Box>
                </>
              )}
              <MasterDataEnableDisableField
                checked={form.isActive}
                disabled={saving}
                minWidth={120}
                confirmName={recordLabel}
                onChange={(isActive) => onChange({ ...form, isActive })}
              />
            </Box>
          </Box>

          <Box>
            {isEdit ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {S.QUALITY_CHECKS.EDIT_NESTED_HINT}
              </Typography>
            ) : null}
            {showErrors && fieldErrors.form ? (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                {fieldErrors.form}
              </Typography>
            ) : null}
            <Divider sx={{ mb: 1.5 }} />
            <ParametersEditor
              params={form.qualityChecks}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              paramErrors={fieldErrors.qualityChecks}
              unitOptions={unitOptions}
              unitLoading={unitLoading}
              theme={fieldTheme}
              onChange={(qualityChecks) => onChange({ ...form, qualityChecks })}
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

export default QualityCheckMasterFormDialog;
