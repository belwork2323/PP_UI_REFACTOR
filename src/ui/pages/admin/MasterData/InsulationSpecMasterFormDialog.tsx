import React, { useMemo } from "react";
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
  Switch,
  Typography,
  Zoom,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import getManufacturingTheme from "@app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import { masterDataActiveSwitchSx } from "./components/MasterDataActiveSwitch";
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import {
  emptyInsulationCategory,
  emptyInsulationParameter,
  type InsulationCategoryForm,
  type InsulationParameterForm,
  type InsulationSpecFormState,
} from "@data/models/admin/MasterData/InsulationSpecMasterModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  isEdit: boolean;
  form: InsulationSpecFormState;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (next: InsulationSpecFormState) => void;
  t: any;
};

const RangeFields = ({
  range,
  disabled,
  theme,
  onChange,
}: {
  range: MasterDataReferenceRange;
  disabled?: boolean;
  theme: any;
  onChange: (next: MasterDataReferenceRange) => void;
}) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};

  return (
    <Box sx={flowBar.topRow}>
      <CasePrepTextField
        label="Min"
        value={range.minValue != null ? String(range.minValue) : ""}
        disabled={disabled}
        width={120}
        theme={theme}
        onChange={(value) =>
          onChange({ ...range, minValue: value === "" ? null : Number(value) })
        }
      />
      <CasePrepTextField
        label="Max"
        value={range.maxValue != null ? String(range.maxValue) : ""}
        disabled={disabled}
        width={120}
        theme={theme}
        onChange={(value) =>
          onChange({ ...range, maxValue: value === "" ? null : Number(value) })
        }
      />
      <CasePrepTextField
        label="Unit"
        value={range.unit}
        disabled={disabled}
        width={140}
        theme={theme}
        onChange={(value) => onChange({ ...range, unit: value })}
      />
    </Box>
  );
};

const ParameterEditor = ({
  parameters,
  disabled,
  theme,
  onChange,
}: {
  parameters: InsulationParameterForm[];
  disabled?: boolean;
  theme: any;
  onChange: (next: InsulationParameterForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    {parameters.map((param, idx) => (
      <Box
        key={idx}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
          gap: 1.5,
          alignItems: "flex-start",
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          bgcolor: "background.paper",
        }}
      >
        <CasePrepTextField
          label="Code"
          value={param.specificationCode}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(value) => {
            const next = [...parameters];
            next[idx] = { ...param, specificationCode: value };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Name"
          value={param.specificationName}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(value) => {
            const next = [...parameters];
            next[idx] = { ...param, specificationName: value };
            onChange(next);
          }}
        />
        <IconButton
          size="small"
          disabled={disabled}
          onClick={() => onChange(parameters.filter((_, i) => i !== idx))}
          sx={{ alignSelf: { md: "center" } }}
        >
          <icons.Delete fontSize="small" />
        </IconButton>
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <RangeFields
            range={param.referenceRange}
            disabled={disabled}
            theme={theme}
            onChange={(referenceRange) => {
              const next = [...parameters];
              next[idx] = { ...param, referenceRange };
              onChange(next);
            }}
          />
        </Box>
      </Box>
    ))}
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
  theme,
  onChange,
}: {
  categories: InsulationCategoryForm[];
  disabled?: boolean;
  theme: any;
  onChange: (next: InsulationCategoryForm[]) => void;
}) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};

  return (
    <Stack spacing={1.5}>
      {categories.map((cat, idx) => (
        <Box
          key={idx}
          sx={{
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: "action.hover",
          }}
        >
          <Box sx={{ ...flowBar.topRow, mb: 1.5 }}>
            <CasePrepTextField
              label="Category"
              value={cat.category}
              disabled={disabled}
              width={320}
              theme={theme}
              onChange={(value) => {
                const next = [...categories];
                next[idx] = { ...cat, category: value };
                onChange(next);
              }}
            />
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(categories.filter((_, i) => i !== idx))}
              sx={{ alignSelf: "flex-end" }}
            >
              <icons.Delete fontSize="small" />
            </IconButton>
          </Box>
          <ParameterEditor
            parameters={cat.parameters}
            disabled={disabled}
            theme={theme}
            onChange={(parameters) => {
              const next = [...categories];
              next[idx] = { ...cat, parameters };
              onChange(next);
            }}
          />
        </Box>
      ))}
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
  onClose,
  onSave,
  onChange,
  t,
}: Props) => {
  const mode = useThemeStore((s) => s.mode);
  const fieldTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const flowBar = fieldTheme.manufacturing?.casePreparation?.flowBar ?? {};
  const { modal } = t;
  const recordLabel = String(form.insulationType).trim() || "record";

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
            <Typography sx={modal.fieldLabel}>Insulation details</Typography>
            <Box sx={flowBar.topRow}>
              <CasePrepTextField
                label="Type"
                value={String(form.insulationType)}
                disabled={saving || isEdit}
                required
                width={220}
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, insulationType: value })}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 2.5, minWidth: 120 }}>
                <Typography variant="body2">{S.FORM.ACTIVE_LABEL}</Typography>
                <Switch
                  size="small"
                  checked={form.isActive}
                  disabled={saving}
                  onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
                  sx={masterDataActiveSwitchSx(form.isActive)}
                />
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={modal.fieldLabel}>Categories & parameters</Typography>
            <CategoryEditor
              categories={form.specifications}
              disabled={saving}
              theme={fieldTheme}
              onChange={(specifications) => onChange({ ...form, specifications })}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          {S.FORM.CANCEL}
        </Button>
        <Button variant="contained" onClick={onSave} disabled={saving} sx={modal.saveButton}>
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
