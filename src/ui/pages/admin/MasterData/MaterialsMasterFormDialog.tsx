import React, { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSelect";
import {
  emptyMaterialGrade,
  emptyMaterialSpec,
  type MaterialGradeForm,
  type MaterialSpecForm,
  type MaterialsMasterFormState,
} from "@data/models/admin/MasterData/MaterialsMasterModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";

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
  onClose: () => void;
  onSave: () => void;
  onChange: (next: MaterialsMasterFormState) => void;
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

const SpecEditor = ({
  specs,
  disabled,
  theme,
  onChange,
}: {
  specs: MaterialSpecForm[];
  disabled?: boolean;
  theme: any;
  onChange: (next: MaterialSpecForm[]) => void;
}) => (
  <Stack spacing={1.5}>
    {specs.map((spec, idx) => (
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
          label="Spec code"
          value={spec.specificationCode}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(value) => {
            const next = [...specs];
            next[idx] = { ...spec, specificationCode: value };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Spec name"
          value={spec.specificationName}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(value) => {
            const next = [...specs];
            next[idx] = { ...spec, specificationName: value };
            onChange(next);
          }}
        />
        <Button
          size="small"
          color="inherit"
          disabled={disabled}
          onClick={() => onChange(specs.filter((_, i) => i !== idx))}
          sx={{ alignSelf: { md: "center" } }}
        >
          Remove
        </Button>
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <RangeFields
            range={spec.referenceRange}
            disabled={disabled}
            theme={theme}
            onChange={(referenceRange) => {
              const next = [...specs];
              next[idx] = { ...spec, referenceRange };
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
  theme,
  onChange,
}: {
  grades: MaterialGradeForm[];
  disabled?: boolean;
  theme: any;
  onChange: (next: MaterialGradeForm[]) => void;
}) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};

  return (
    <Stack spacing={1.5}>
      {grades.map((grade, idx) => (
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
          <Box sx={flowBar.topRow} mb={1.5}>
            <CasePrepTextField
              label="Grade code"
              value={grade.gradeCode}
              disabled={disabled}
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
              disabled={disabled}
              width={280}
              theme={theme}
              onChange={(value) => {
                const next = [...grades];
                next[idx] = { ...grade, gradeName: value };
                onChange(next);
              }}
            />
            <Button
              size="small"
              color="inherit"
              disabled={disabled}
              onClick={() => onChange(grades.filter((_, i) => i !== idx))}
              sx={{ alignSelf: "flex-end" }}
            >
              Remove grade
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Grade specifications
          </Typography>
          <SpecEditor
            specs={grade.specifications}
            disabled={disabled}
            theme={theme}
            onChange={(specifications) => {
              const next = [...grades];
              next[idx] = { ...grade, specifications };
              onChange(next);
            }}
          />
        </Box>
      ))}
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
  onClose,
  onSave,
  onChange,
  t,
}: Props) => {
  const mode = useThemeStore((s) => s.mode);
  const fieldTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const flowBar = fieldTheme.manufacturing?.casePreparation?.flowBar ?? {};
  const { modal } = t;
  const recordLabel = form.materialName.trim() || form.materialCode.trim() || "record";

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
            <Typography sx={modal.fieldLabel}>Material details</Typography>
            <Box sx={flowBar.topRow}>
              <CasePrepTextField
                label="Material code"
                value={form.materialCode}
                disabled={saving || isEdit}
                required
                width={180}
                theme={fieldTheme}
                onChange={(value) => onChange({ ...form, materialCode: value })}
              />
              <CasePrepTextField
                label="Name"
                value={form.materialName}
                disabled={saving}
                required
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 2.5, minWidth: 120 }}>
                <Typography variant="body2">{S.FORM.ACTIVE_LABEL}</Typography>
                <Switch
                  size="small"
                  checked={form.isActive}
                  disabled={saving}
                  onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
                />
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={modal.fieldLabel}>Grades</Typography>
            <GradeEditor
              grades={form.grades}
              disabled={saving}
              theme={fieldTheme}
              onChange={(grades) => onChange({ ...form, grades })}
            />
          </Box>

          <Box>
            <Typography sx={modal.fieldLabel}>Top-level specifications</Typography>
            <SpecEditor
              specs={form.specifications}
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

export default MaterialsMasterFormDialog;
