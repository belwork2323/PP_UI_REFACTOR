import React, { useState } from "react";
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
  Zoom,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import Input from "@ui/components/common/Input";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import { STRINGS } from "@app/config/strings";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

const S = STRINGS.PROJECT_MANAGEMENT;
const ALLOWED_REGEX = /^[a-zA-Z0-9\s\-_./(),&+:]*$/;
const CreateProjectManagementForm = ({
  open,
  onClose,
  onSave,
  editTarget,
  form,
  onFormChange,
  saving,
  t,
}: any) => {
  const isEdit = !!editTarget;
  const { modal, input } = t;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleProjectNameChange = (value: string) => {
    onFormChange("projectName", value);

    // Independent validation logic
    if (!value.trim()) {
      setFieldErrors((prev) => ({ ...prev, projectName: "Field is required" }));
    } else if (value.length > 100) {
      setFieldErrors((prev) => ({
        ...prev,
        projectName: "cannot exceed 100 characters",
      }));
    } else if (!ALLOWED_REGEX.test(value)) {
      setFieldErrors((prev) => ({ ...prev, projectName: "Invalid characters" }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.projectName;
        return next;
      });
    }
  };

  const handleDescriptionChange = (value: string) => {
    onFormChange("projectDescription", value);

    // Description validation (e.g., optional, but max length & regex check if provided)
    if (value.length > 500) {
      setFieldErrors((prev) => ({
        ...prev,
        projectDescription: "cannot exceed 500 characters",
      }));
    } else if (value && !ALLOWED_REGEX.test(value)) {
      setFieldErrors((prev) => ({
        ...prev,
        projectDescription: "Invalid characters",
      }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.projectDescription;
        return next;
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          title={isEdit ? S.FORM.EDIT_TITLE : S.FORM.CREATE_TITLE}
          subtitle={isEdit ? S.FORM.EDIT_SUBTITLE(form.projectName) : S.FORM.CREATE_SUBTITLE}
          icon={<icons.projectMgmt.info sx={modal.header.icon} />}
          onClose={() => !saving && onClose()}
          closeDisabled={saving}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          <Input
            fullWidth
            label={<FieldLabelWithAsterisk label={S.FORM.NAME_LABEL} required />}
            value={form.projectName || ""}
            onChange={(e: any) => handleProjectNameChange(e.target.value)}
            placeholder={S.FORM.NAME_PLACEHOLDER}
            size="small"
            sx={input}

            disabled={saving}
            error={Boolean(fieldErrors.projectName)}
            helperText={fieldErrors.projectName}
            inputProps={{ maxLength: 100 }}
          />
          <Input
            fullWidth
            label={<FieldLabelWithAsterisk label={S.FORM.DESCRIPTION_LABEL} />}
            value={form.projectDescription || ""}
            onChange={(e: any) => handleDescriptionChange(e.target.value)}
            placeholder={S.FORM.DESCRIPTION_PLACEHOLDER}
            size="small"
            multiline
            rows={3}
            sx={input}
            disabled={saving}
            error={Boolean(fieldErrors.projectDescription)}
            helperText={fieldErrors.projectDescription}
            inputProps={{ maxLength: 500 }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: modal.actions }}>
        <Button onClick={onClose} disabled={saving} sx={modal.cancelButton}>
          {S.FORM.CANCEL}
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || !form.projectName?.trim()}
          sx={modal.saveButton}
        >
          {saving ? S.FORM.SAVING : S.FORM.SAVE}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectManagementForm;
