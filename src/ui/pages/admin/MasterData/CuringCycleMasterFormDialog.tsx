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
  Switch,
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
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import {
  emptyCuringCycleStep,
  formatMotorStageLabel,
  getCuringCycleFieldErrors,
  getCuringCycleValidationMessage,
  type CuringCycleFieldErrors,
  type CuringCycleFormState,
  type CuringCycleRecord,
  type CuringCycleStepForm,
} from "@data/models/admin/MasterData/CuringCycleMasterModel";
import { visibleValidationError } from "./masterDataValidationUtils";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  isEdit: boolean;
  form: CuringCycleFormState;
  saving: boolean;
  motorStageOptions: AppDropdownOption[];
  motorStageLoading?: boolean;
  curingTypeOptions: AppDropdownOption[];
  existingRecords?: CuringCycleRecord[];
  onClose: () => void;
  onSave: () => void;
  onChange: (next: CuringCycleFormState) => void;
  t: any;
};

const StepsEditor = ({
  steps,
  disabled,
  isEdit,
  showErrors,
  showPressure,
  stepErrors,
  theme,
  onChange,
}: {
  steps: CuringCycleStepForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  showPressure: boolean;
  stepErrors?: CuringCycleFieldErrors["cycles"];
  theme: any;
  onChange: (next: CuringCycleStepForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    <Typography variant="subtitle2">{S.CURING_CYCLES.CYCLE_STEPS}</Typography>
    {steps.map((step, idx) => {
      const locked = isEdit && Boolean(step.isExisting);
      const tempError = visibleValidationError(
        stepErrors?.[idx]?.temperature,
        step.temperature !== "",
        showErrors,
      );
      const durationError = visibleValidationError(
        stepErrors?.[idx]?.durationMinutes,
        step.durationMinutes !== "",
        showErrors,
      );
      return (
        <Box
          key={`${step.stepId ?? "new"}-${idx}`}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            p: 1.5,
            border: "1px solid",
            borderColor: tempError || durationError ? "error.main" : "divider",
            borderRadius: 1.5,
            bgcolor: locked ? "action.hover" : "background.paper",
            opacity: !step.isActive ? 0.72 : 1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: showPressure ? "1fr 1fr 1fr" : "1fr 1fr",
              },
              gap: 1,
            }}
          >
            <CasePrepTextField
              label={S.CURING_CYCLES.STEP_TEMPERATURE}
              value={step.temperature === "" ? "" : String(step.temperature)}
              disabled={disabled || locked}
              error={Boolean(tempError)}
              helperText={tempError ?? null}
              width="100%"
              theme={theme}
              onChange={(value) => {
                const next = [...steps];
                next[idx] = {
                  ...step,
                  temperature: value === "" ? "" : Number(value),
                };
                onChange(next);
              }}
            />
            <CasePrepTextField
              label={S.CURING_CYCLES.STEP_DURATION}
              value={step.durationMinutes === "" ? "" : String(step.durationMinutes)}
              disabled={disabled || locked}
              error={Boolean(durationError)}
              helperText={durationError ?? null}
              width="100%"
              theme={theme}
              onChange={(value) => {
                const next = [...steps];
                next[idx] = {
                  ...step,
                  durationMinutes: value === "" ? "" : Number(value),
                };
                onChange(next);
              }}
            />
            {showPressure ? (
              <CasePrepTextField
                label={S.CURING_CYCLES.STEP_PRESSURE}
                value={step.propellantPressure === "" ? "" : String(step.propellantPressure)}
                disabled={disabled || locked}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...steps];
                  next[idx] = {
                    ...step,
                    propellantPressure: value === "" ? "" : Number(value),
                  };
                  onChange(next);
                }}
              />
            ) : null}
          </Box>
          <MasterDataEnableDisableField
            checked={step.isActive}
            disabled={disabled}
            labelVariant="caption"
            minWidth={96}
            requireConfirmation={locked}
            confirmName={`step ${step.sequenceNo ?? idx + 1}`}
            onChange={(isActive) => {
              const next = [...steps];
              next[idx] = { ...step, isActive };
              onChange(next);
            }}
          />
          {!locked ? (
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(steps.filter((_, i) => i !== idx))}
              aria-label={S.CURING_CYCLES.REMOVE_STEP}
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
      onClick={() => onChange([...steps, emptyCuringCycleStep()])}
    >
      {S.CURING_CYCLES.ADD_STEP}
    </Button>
  </Stack>
);

const CuringCycleMasterFormDialog = ({
  open,
  isEdit,
  form,
  saving,
  motorStageOptions,
  motorStageLoading = false,
  curingTypeOptions,
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
  const [showErrors, setShowErrors] = useState(false);
  const recordLabel =
    form.curingCycleCode || formatMotorStageLabel(form.motorStage, motorStageOptions) || "record";
  const fieldErrors = useMemo(
    () => getCuringCycleFieldErrors(form, isEdit, existingRecords),
    [form, isEdit, existingRecords],
  );
  const stageError = visibleValidationError(
    fieldErrors.motorStage,
    form.motorStage !== "",
    showErrors,
  );
  const curingTypeError = visibleValidationError(
    fieldErrors.curingType,
    form.curingType.trim().length > 0,
    showErrors,
  );

  useEffect(() => {
    if (!open) setShowErrors(false);
  }, [open]);

  const handleSave = () => {
    setShowErrors(true);
    const err = getCuringCycleValidationMessage(
      getCuringCycleFieldErrors(form, isEdit, existingRecords),
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
            isEdit ? S.CURING_CYCLES.EDIT_SUBTITLE(recordLabel) : S.CURING_CYCLES.CREATE_SUBTITLE
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
            <Typography sx={modal.fieldLabel}>Curing cycle details</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(180px, 200px) minmax(220px, 1fr) minmax(220px, 1fr) auto auto",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              {isEdit ? (
                <CasePrepTextField
                  label={S.CURING_CYCLES.COL_MOTOR_STAGE}
                  value={formatMotorStageLabel(form.motorStage, motorStageOptions)}
                  disabled
                  width="100%"
                  theme={fieldTheme}
                  onChange={() => undefined}
                />
              ) : (
                <Box sx={flowBar.selectField?.("100%")}>
                  <Typography component="label" sx={flowBar.selectLabel}>
                    <FieldLabelWithAsterisk label={S.CURING_CYCLES.COL_MOTOR_STAGE} required />
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
                    placeholder={S.CURING_CYCLES.MOTOR_STAGE_SELECT_PLACEHOLDER}
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
              )}
              <Box sx={flowBar.selectField?.("100%")}>
                <Typography component="label" sx={flowBar.selectLabel}>
                  <FieldLabelWithAsterisk label={S.CURING_CYCLES.COL_CURING_TYPE} required />
                </Typography>
                <AppDropdown
                  value={form.curingType}
                  onChange={(value) => onChange({ ...form, curingType: value })}
                  options={curingTypeOptions}
                  placeholder={S.CURING_CYCLES.CURING_TYPE_SELECT_PLACEHOLDER}
                  disabled={saving}
                  error={Boolean(curingTypeError)}
                  helperText={curingTypeError}
                  fullWidth
                  sx={{
                    mb: 0,
                    ...flowBar.selectInput?.(form.curingType.trim().length > 0),
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pt: 2.5 }}>
                <Typography variant="body2">{S.CURING_CYCLES.LABEL_SHOW_PRESSURE}</Typography>
                <Switch
                  size="small"
                  checked={form.showPropellantPressure}
                  disabled={saving}
                  onChange={(e) => onChange({ ...form, showPropellantPressure: e.target.checked })}
                />
              </Box>
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
                {S.CURING_CYCLES.EDIT_NESTED_HINT}
              </Typography>
            ) : null}
            {showErrors && fieldErrors.form ? (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                {fieldErrors.form}
              </Typography>
            ) : null}
            <Divider sx={{ mb: 1.5 }} />
            <StepsEditor
              steps={form.cycles}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              showPressure={form.showPropellantPressure}
              stepErrors={fieldErrors.cycles}
              theme={fieldTheme}
              onChange={(cycles) => onChange({ ...form, cycles })}
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

export default CuringCycleMasterFormDialog;
