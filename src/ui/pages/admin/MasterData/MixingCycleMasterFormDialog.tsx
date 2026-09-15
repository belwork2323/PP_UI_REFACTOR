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
  TextField,
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
  emptyMixingOperation,
  formatMotorStageLabel,
  getMixingCycleFieldErrors,
  getMixingCycleValidationMessage,
  type MixingCycleFieldErrors,
  type MixingCycleFormState,
  type MixingOperationForm,
} from "@data/models/admin/MasterData/MixingCycleMasterModel";
import { visibleValidationError } from "./masterDataValidationUtils";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  isEdit: boolean;
  form: MixingCycleFormState;
  saving: boolean;
  motorStageOptions: AppDropdownOption[];
  motorStageLoading?: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (next: MixingCycleFormState) => void;
  t: any;
};

const OperationsEditor = ({
  title,
  ops,
  disabled,
  isEdit,
  showErrors,
  operationErrors,
  theme,
  onChange,
}: {
  title: string;
  ops: MixingOperationForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  operationErrors?: MixingCycleFieldErrors["premixOperations"];
  theme: any;
  onChange: (next: MixingOperationForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    <Typography variant="subtitle2">{title}</Typography>
    {ops.map((op, idx) => {
      const locked = isEdit && Boolean(op.isExisting);
      const opError = visibleValidationError(
        operationErrors?.[idx]?.operationName,
        op.operationName.trim().length > 0,
        showErrors,
      );
      return (
        <Box
          key={`${op.operationId ?? "new"}-${idx}`}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            p: 1.5,
            border: "1px solid",
            borderColor: opError ? "error.main" : "divider",
            borderRadius: 1.5,
            bgcolor: locked ? "action.hover" : "background.paper",
            opacity: !op.isActive ? 0.72 : 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CasePrepTextField
              label={S.MIXING_CYCLES.COL_NAME}
              value={op.operationName}
              disabled={disabled || locked}
              error={Boolean(opError)}
              helperText={opError ?? null}
              width="100%"
              theme={theme}
              onChange={(value) => {
                const next = [...ops];
                next[idx] = { ...op, operationName: value };
                onChange(next);
              }}
            />
          </Box>
          <MasterDataEnableDisableField
            checked={op.isActive}
            disabled={disabled}
            labelVariant="caption"
            minWidth={96}
            requireConfirmation={locked}
            confirmName={op.operationName || "operation"}
            onChange={(isActive) => {
              const next = [...ops];
              next[idx] = { ...op, isActive };
              onChange(next);
            }}
          />
          {!locked ? (
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(ops.filter((_, i) => i !== idx))}
              aria-label={S.MIXING_CYCLES.REMOVE_OPERATION}
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
      onClick={() => onChange([...ops, emptyMixingOperation()])}
    >
      {S.MIXING_CYCLES.ADD_OPERATION}
    </Button>
  </Stack>
);

const MixingCycleMasterFormDialog = ({
  open,
  isEdit,
  form,
  saving,
  motorStageOptions,
  motorStageLoading = false,
  onClose,
  onSave,
  onChange,
  t,
}: Props) => {
  const { modal } = t;
  const mode = useThemeStore((state) => state.mode);
  const fieldTheme = getManufacturingTheme(mode);
  const flowBar = fieldTheme.manufacturing?.casePreparation?.flowBar ?? {};
  const palette = fieldTheme.palette ?? {};
  const descriptionHasValue = form.description.trim().length > 0;
  const [showErrors, setShowErrors] = useState(false);
  const recordLabel = form.mixingCycleName.trim() || form.mixingCycleCode || "record";
  const fieldErrors = useMemo(
    () => getMixingCycleFieldErrors(form, isEdit),
    [form, isEdit],
  );
  const nameError = visibleValidationError(
    fieldErrors.mixingCycleName,
    form.mixingCycleName.trim().length > 0,
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
    const err = getMixingCycleValidationMessage(getMixingCycleFieldErrors(form, isEdit));
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
            isEdit ? S.MIXING_CYCLES.EDIT_SUBTITLE(recordLabel) : S.MIXING_CYCLES.CREATE_SUBTITLE
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
            <Typography sx={modal.fieldLabel}>Mixing cycle details</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(180px, 200px) minmax(150px, 160px) minmax(220px, 1fr) auto",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <CasePrepTextField
                label={S.MIXING_CYCLES.COL_NAME}
                value={form.mixingCycleName}
                disabled={saving}
                required
                error={Boolean(nameError)}
                helperText={nameError ?? null}
                width="100%"
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, mixingCycleName: value })}
              />
              {isEdit ? (
                <CasePrepTextField
                  label={S.MIXING_CYCLES.COL_MOTOR_STAGE}
                  value={formatMotorStageLabel(form.motorStage, motorStageOptions)}
                  disabled
                  width="100%"
                  theme={fieldTheme}
                  onChange={() => undefined}
                />
              ) : (
                <Box sx={flowBar.selectField?.("100%")}>
                  <Typography component="label" sx={flowBar.selectLabel}>
                    <FieldLabelWithAsterisk label={S.MIXING_CYCLES.COL_MOTOR_STAGE} required />
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
                    placeholder={S.MIXING_CYCLES.MOTOR_STAGE_SELECT_PLACEHOLDER}
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
              <Box sx={{ minWidth: 0 }}>
                <Box sx={flowBar.selectField?.("100%")}>
                  <Typography component="label" sx={flowBar.selectLabel}>
                    {S.MIXING_CYCLES.LABEL_DESCRIPTION}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    variant="outlined"
                    value={form.description}
                    disabled={saving}
                    onChange={(event) => onChange({ ...form, description: event.target.value })}
                    sx={{
                      ...flowBar.selectInput?.(descriptionHasValue),
                      "& .MuiInputBase-input": {
                        fontWeight: descriptionHasValue ? 600 : 500,
                        color: descriptionHasValue ? palette.text : palette.textSub,
                        fontSize: "0.82rem",
                      },
                    }}
                  />
                </Box>
              </Box>
              <MasterDataEnableDisableField
                checked={form.isActive}
                disabled={saving}
                minWidth={120}
                confirmName={form.mixingCycleName || form.mixingCycleCode || "mixing cycle"}
                onChange={(isActive) => onChange({ ...form, isActive })}
              />
            </Box>
          </Box>

          <Box>
            {isEdit ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {S.MIXING_CYCLES.EDIT_NESTED_HINT}
              </Typography>
            ) : null}
            {showErrors && fieldErrors.form ? (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                {fieldErrors.form}
              </Typography>
            ) : null}
            <Divider sx={{ mb: 1.5 }} />
            <OperationsEditor
              title={S.MIXING_CYCLES.PREMIX_OPERATIONS}
              ops={form.cycles.premixOperations}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              operationErrors={fieldErrors.premixOperations}
              theme={fieldTheme}
              onChange={(premixOperations) =>
                onChange({ ...form, cycles: { ...form.cycles, premixOperations } })
              }
            />
            <Box sx={{ mt: 2 }} />
            <OperationsEditor
              title={S.MIXING_CYCLES.FINAL_MIX_OPERATIONS}
              ops={form.cycles.finalMixOperations}
              disabled={saving}
              isEdit={isEdit}
              showErrors={showErrors}
              operationErrors={fieldErrors.finalMixOperations}
              theme={fieldTheme}
              onChange={(finalMixOperations) =>
                onChange({ ...form, cycles: { ...form.cycles, finalMixOperations } })
              }
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          {S.FORM.CANCEL}
        </Button>
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

export default MixingCycleMasterFormDialog;
