import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Stack, Zoom,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import Input from "@ui/components/common/Input";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import { STRINGS } from "@app/config/strings";

const S = STRINGS.PROJECT_MANAGEMENT;

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
          subtitle={
            isEdit
              ? S.FORM.EDIT_SUBTITLE(form.projectName)
              : S.FORM.CREATE_SUBTITLE
          }
          icon={<icons.userMgmt.info sx={modal.header.icon} />}
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
            label={S.FORM.NAME_LABEL}
            value={form.projectName || ""}
            onChange={(e: any) => onFormChange("projectName", e.target.value)}
            placeholder={S.FORM.NAME_PLACEHOLDER}
            size="small"
            sx={input}
            required
            disabled={saving}
          />
          <Input
            fullWidth
            label={S.FORM.DESCRIPTION_LABEL}
            value={form.projectDescription || ""}
            onChange={(e: any) => onFormChange("projectDescription", e.target.value)}
            placeholder={S.FORM.DESCRIPTION_PLACEHOLDER}
            size="small"
            multiline
            rows={3}
            sx={input}
            disabled={saving}
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
