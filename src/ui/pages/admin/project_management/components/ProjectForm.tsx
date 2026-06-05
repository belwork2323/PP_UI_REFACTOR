import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Stack, Zoom,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import Input from "../../../../components/common/Input";

const ProjectForm = ({
  open = false,
  onClose = () => {},
  onSave = () => {},
  editTarget = null,
  form = {},
  onFormChange = () => {},
  saving = false,
  t,
}: any) => {
  const isEdit = !!editTarget;
  const { modal, input } = t;

  const handleChange = (field: string, value: any) => {
    onFormChange(field, value);
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
        <Box sx={modal.header.wrapper}>
          <Box sx={modal.header.titleRow}>
            <Box sx={modal.header.iconBadge}>
              <icons.userMgmt.info sx={modal.header.icon} />
            </Box>
            <Box>
              <Typography sx={modal.header.title}>
                {isEdit ? "Edit Project" : "Create New Project"}
              </Typography>
              <Typography sx={modal.header.subtitle}>
                {isEdit
                  ? `Updating: ${form.projectName}`
                  : "Enter project details below. All fields are required."}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => !saving && onClose()} sx={modal.header.closeButton}>
            <icons.userMgmt.close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          <Input
            fullWidth
            label="Project Name"
            value={form.projectName || ""}
            onChange={(e: any) => handleChange("projectName", e.target.value)}
            placeholder="e.g. Solid Propellant Development"
            size="small"
            sx={input}
            required
            disabled={saving}
          />
          <Input
            fullWidth
            label="Project Description"
            value={form.projectDescription || ""}
            onChange={(e: any) => handleChange("projectDescription", e.target.value)}
            placeholder="e.g. Development of next-generation propellant"
            size="small"
            multiline
            rows={3}
            sx={input}
            disabled={saving}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: modal.actions }}>
        <Button onClick={() => onClose()} disabled={saving} sx={modal.cancelButton}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || !form.projectName?.trim()}
          sx={modal.saveButton}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectForm;
