import React, { useMemo, useState } from "react";
import { useThemeStore } from "@app/store/themeStore";
import getManufacturingTheme from "@app/theme/custom_themes/user/manufacturing/manufacturing_theme";
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
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import AppDropdown from "@ui/components/common/AppDropdown";
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSearchableSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSearchableSelect";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import {
  emptyDimensionalParameterRow,
  formatMotorStageLabel,
  getDimensionalCreateFormFieldErrors,
  getDimensionalStageEditFormFieldErrors,
  type DimensionalParameterRowForm,
  type DimensionalParametersCreateFormState,
  type DimensionalParametersStageEditFormState,
} from "@data/models/admin/MasterData/DimensionalParametersMasterModel";
import { visibleValidationError } from "./masterDataValidationUtils";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  isEdit: boolean;
  createForm: DimensionalParametersCreateFormState;
  editForm: DimensionalParametersStageEditFormState | null;
  saving: boolean;
  motorStageOptions: AppDropdownOption[];
  motorStageLoading?: boolean;
  unitOptions: AppDropdownOption[];
  unitLoading?: boolean;
  onClose: () => void;
  onSave: () => void;
  onCreateFormChange: (next: DimensionalParametersCreateFormState) => void;
  onEditFormChange: (next: DimensionalParametersStageEditFormState) => void;
  t: any;
};

const ParameterRowsEditor = ({
  rows,
  disabled,
  isEditMode,
  showErrors,
  rowErrors,
  unitOptions,
  unitLoading,
  theme,
  onChange,
}: {
  rows: DimensionalParameterRowForm[];
  disabled?: boolean;
  isEditMode?: boolean;
  showErrors: boolean;
  rowErrors: DimensionalParameterRowFieldErrors[];
  unitOptions: AppDropdownOption[];
  unitLoading?: boolean;
  theme: any;
  onChange: (next: DimensionalParameterRowForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    {rows.map((row, index) => {
      const locked = Boolean(isEditMode && row.isExisting);
      const editable = !locked;
      const errors = rowErrors[index] ?? {};
      const nameError = visibleValidationError(
        errors.paramName,
        row.paramName.trim().length > 0,
        showErrors && editable,
      );
      const minError = visibleValidationError(
        errors.minValue,
        row.minValue != null,
        showErrors && editable,
      );
      const maxError = visibleValidationError(
        errors.maxValue,
        row.maxValue != null,
        showErrors && editable,
      );

      const updateRow = (patch: Partial<DimensionalParameterRowForm>) => {
        onChange(rows.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
      };

      const rowKey = row.parameterId != null ? `parameter-${row.parameterId}` : `parameter-new-${index}`;

      return (
        <Box
          key={rowKey}
          sx={{
            border: "1px solid",
            borderColor: nameError || minError || maxError ? "error.main" : "divider",
            borderRadius: 1.5,
            p: 1.5,
            bgcolor: locked ? "action.hover" : "background.paper",
            opacity: locked && !row.isActive ? 0.72 : 1,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(160px, 1.4fr) 90px 90px minmax(120px, 160px) auto auto",
              },
              gap: 1.25,
              alignItems: "flex-end",
            }}
          >
            {locked ? (
              <Box sx={{ pb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {S.DIMENSIONAL_PARAMETERS.EXISTING_PARAMETER_LABEL}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.paramName}
                </Typography>
              </Box>
            ) : (
              <CasePrepTextField
                label={S.DIMENSIONAL_PARAMETERS.COL_NAME}
                required={editable}
                value={row.paramName}
                disabled={disabled || locked}
                error={Boolean(nameError)}
                helperText={nameError}
                width="100%"
                theme={theme}
                onChange={(value) => updateRow({ paramName: value })}
              />
            )}
            <CasePrepTextField
              label={S.DIMENSIONAL_PARAMETERS.COL_MIN}
              value={row.minValue != null ? String(row.minValue) : ""}
              disabled={disabled || locked}
              error={Boolean(minError)}
              helperText={minError}
              width="100%"
              theme={theme}
              onChange={(value) =>
                updateRow({
                  minValue: value === "" ? null : Number(value),
                })
              }
            />
            <CasePrepTextField
              label={S.DIMENSIONAL_PARAMETERS.COL_MAX}
              value={row.maxValue != null ? String(row.maxValue) : ""}
              disabled={disabled || locked}
              error={Boolean(maxError)}
              helperText={maxError}
              width="100%"
              theme={theme}
              onChange={(value) =>
                updateRow({
                  maxValue: value === "" ? null : Number(value),
                })
              }
            />
            <CasePrepSearchableSelect
              label={S.DIMENSIONAL_PARAMETERS.COL_UNIT}
              value={row.unitId}
              placeholder="Select unit"
              disabled={disabled || locked || unitLoading}
              options={unitOptions}
              width="100%"
              theme={theme}
              onChange={(value) => {
                const option = unitOptions.find((item) => item.value === value);
                updateRow({
                  unitId: value,
                  unit: option ? String(option.label ?? "") : "",
                });
              }}
            />
            <MasterDataEnableDisableField
              checked={row.isActive}
              disabled={disabled}
              labelVariant="caption"
              confirmName={row.paramName || "parameter"}
              onChange={(checked) => updateRow({ isActive: checked })}
            />
            {!locked && (!isEditMode ? rows.length > 1 : true) ? (
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => onChange(rows.filter((_, idx) => idx !== index))}
                aria-label={S.DIMENSIONAL_PARAMETERS.REMOVE_PARAMETER}
                sx={{ mb: 0.5 }}
              >
                <icons.Delete fontSize="small" />
              </IconButton>
            ) : (
              <Box sx={{ width: 40 }} />
            )}
          </Box>
        </Box>
      );
    })}

    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...rows, emptyDimensionalParameterRow()])}
      sx={{ alignSelf: "flex-start" }}
    >
      {S.DIMENSIONAL_PARAMETERS.ADD_PARAMETER}
    </Button>
  </Stack>
);

type DimensionalParameterRowFieldErrors = {
  paramName?: string;
  minValue?: string;
  maxValue?: string;
  unit?: string;
};

const DimensionalParametersMasterFormDialog = ({
  open,
  isEdit,
  createForm,
  editForm,
  saving,
  motorStageOptions,
  motorStageLoading = false,
  unitOptions,
  unitLoading = false,
  onClose,
  onSave,
  onCreateFormChange,
  onEditFormChange,
  t,
}: Props) => {
  const mode = useThemeStore((s) => s.mode);
  const fieldTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const { modal } = t;
  const [showErrors, setShowErrors] = useState(false);

  const createFieldErrors = useMemo(
    () => getDimensionalCreateFormFieldErrors(createForm),
    [createForm],
  );
  const editFieldErrors = useMemo(
    () => (editForm ? getDimensionalStageEditFormFieldErrors(editForm) : { parameters: [] }),
    [editForm],
  );

  const motorStageError = visibleValidationError(
    createFieldErrors.motorType,
    createForm.motorType !== "",
    showErrors,
  );

  const handleSave = () => {
    setShowErrors(true);
    onSave();
  };

  const handleClose = () => {
    if (saving) return;
    setShowErrors(false);
    onClose();
  };

  const stageLabel = editForm
    ? formatMotorStageLabel(editForm.motorType, motorStageOptions)
    : "";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Zoom}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={
            isEdit ? (
              <icons.Edit sx={modal.header.icon} />
            ) : (
              <icons.projectMgmt.add sx={modal.header.icon} />
            )
          }
          title={
            isEdit ? S.DIMENSIONAL_PARAMETERS.EDIT_TITLE : S.DIMENSIONAL_PARAMETERS.CREATE_TITLE
          }
          subtitle={
            isEdit
              ? S.DIMENSIONAL_PARAMETERS.EDIT_SUBTITLE(stageLabel)
              : S.DIMENSIONAL_PARAMETERS.CREATE_SUBTITLE
          }
          onClose={handleClose}
          closeDisabled={saving}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        {isEdit && editForm ? (
          <Stack spacing={2}>
            <Typography variant="body2">
              <strong>{S.DIMENSIONAL_PARAMETERS.COL_MOTOR_STAGE}:</strong> {stageLabel}
            </Typography>
            <ParameterRowsEditor
              rows={editForm.parameters}
              disabled={saving}
              isEditMode
              showErrors={showErrors}
              rowErrors={editFieldErrors.parameters}
              unitOptions={unitOptions}
              unitLoading={unitLoading}
              theme={fieldTheme}
              onChange={(parameters) => onEditFormChange({ ...editForm, parameters })}
            />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <AppDropdown
              label={S.DIMENSIONAL_PARAMETERS.COL_MOTOR_STAGE}
              value={createForm.motorType === "" ? "" : String(createForm.motorType)}
              onChange={(value) => {
                const nextMotorType = value === "" ? "" : Number(value);
                const stageChanged =
                  createForm.motorType !== "" && createForm.motorType !== nextMotorType;
                onCreateFormChange({
                  ...createForm,
                  motorType: nextMotorType,
                  parameters:
                    nextMotorType === ""
                      ? []
                      : stageChanged || createForm.parameters.length === 0
                        ? [emptyDimensionalParameterRow()]
                        : createForm.parameters,
                });
              }}
              options={motorStageOptions}
              loading={motorStageLoading}
              placeholder={S.DIMENSIONAL_PARAMETERS.MOTOR_STAGE_SELECT_PLACEHOLDER}
              required
              error={Boolean(motorStageError)}
              helperText={motorStageError}
              disabled={saving}
            />
            {createForm.motorType === "" ? (
              <Typography variant="body2" color="text.secondary">
                {S.DIMENSIONAL_PARAMETERS.MOTOR_STAGE_SELECT_FIRST_HINT}
              </Typography>
            ) : (
              <ParameterRowsEditor
                rows={createForm.parameters}
                disabled={saving}
                showErrors={showErrors}
                rowErrors={createFieldErrors.parameters}
                unitOptions={unitOptions}
                unitLoading={unitLoading}
                theme={fieldTheme}
                onChange={(parameters) => onCreateFormChange({ ...createForm, parameters })}
              />
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? S.FORM.SAVING : S.FORM.SAVE}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DimensionalParametersMasterFormDialog;
