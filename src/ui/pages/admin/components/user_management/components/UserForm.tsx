import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Stack,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Zoom, Checkbox, Card, InputAdornment, Divider, Collapse, Chip,
} from "@mui/material";
import { icons } from "../../../../../../app/theme";
import Input from "../../../../../components/common/Input";
import { roleConfig, getDisplayName } from "./UserConfigs";
import { useUserFormModal } from "../../../../../../hooks/admin/user_management/useUserFormHook";

const UserFormModal = ({
  open, onClose, onSave, editTarget, form, onFormChange,
  onSubDeptsChange, availableRoles, availableSubDepts, saving, t,
}: any) => {
  const { modal, input } = t;

  const {
    selectorOpen,
    search,
    setSearch,
    selectorMaxHeight,
    subDeptsRestricted,
    subDeptsMandatory,
    canSubmit,
    pendingSubDeptIds,
    pendingSubDepts,
    filteredDepts,
    handleOpenSelector,
    handleCommitSelector,
    handleCancelSelector,
    handleToggleDept,
    handleRemoveSubDept,
    handleClearPending,
  } = useUserFormModal({ open, editTarget, availableSubDepts, form, onSubDeptsChange });

  return (
    <Dialog
      open={open} onClose={() => !saving && onClose()}
      TransitionComponent={Zoom} maxWidth="md" fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={modal.header.wrapper}>
          <Box sx={modal.header.titleRow}>
            <Box sx={modal.header.iconBadge}>
              <icons.userMgmt.personOutline sx={modal.header.icon} />
            </Box>
            <Box>
              <Typography sx={modal.header.title}>
                {editTarget ? "Edit User" : "Create New User"}
              </Typography>
              <Typography sx={modal.header.subtitle}>
                {editTarget
                  ? `Editing ${getDisplayName(editTarget)}`
                  : "All fields below are fundamentally required to create a new profile."}
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

          {/* Credentials */}
          <Box>
            <Typography sx={modal.fieldLabel}>Credentials *</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input fullWidth label="Username" value={form.username}
                onChange={onFormChange("username")} placeholder="e.g. arjun.sharma"
                size="small" sx={input} required />
              <Input fullWidth label="User ID" value={form.userId}
                onChange={onFormChange("userId")} placeholder="e.g. EMP12345"
                size="small" sx={input} required disabled={Boolean(editTarget)} />
            </Stack>
          </Box>

          {/* Role */}
          <Box>
            <Typography sx={modal.fieldLabel}>Role *</Typography>
            <FormControl fullWidth size="small" sx={input} required disabled={Boolean(editTarget)}>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role" onChange={onFormChange("role")} MenuProps={t.menuPaper}>
                {(availableRoles || []).map((r: any) => {
                  const rc = roleConfig[r.roleName];
                  return (
                    <MenuItem key={r.roleId} value={r.roleName}>
                      <Box sx={modal.menuItemRow}>
                        {rc && <rc.Icon sx={{ fontSize: 14, color: rc.color }} />}
                        {r.roleName}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Sub-Departments */}
          <Box>
            {/* Section header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography sx={modal.fieldLabel}>
                  Sub-Departments{subDeptsMandatory && " *"}
                </Typography>
                {form.subDepts.length > 0 && (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={`${form.subDepts.length} Selected`}
                    sx={modal.selectionCountChip}
                  />
                )}
              </Box>

              {!subDeptsRestricted && (
                <Button
                  size="small"
                  variant={selectorOpen ? "contained" : "outlined"}
                  onClick={selectorOpen ? handleCommitSelector : handleOpenSelector}
                  startIcon={<icons.userMgmt.add sx={{ fontSize: "14px !important" }} />}
                  sx={{
                    ...modal.selectorToggleBase,
                    ...(selectorOpen
                      ? modal.selectorToggleOpen
                      : modal.selectorToggleClosed),
                  }}
                >
                  {selectorOpen ? "Add" : (form.subDepts.length > 0 ? "Add More" : "Select Sub-departments")}
                </Button>
              )}
            </Box>

            {/* Inline selector card — height adapts to viewport */}
            {!subDeptsRestricted && (
              <Box sx={modal.selectorWrapper}>
                <Collapse in={selectorOpen} unmountOnExit sx={modal.selectorCollapse}>
                  <Card variant="outlined" sx={modal.selectorCard}>

                    {/* Header: Selection Status, Clear All & Close List */}
                    <Box sx={modal.selectorHeader}>
                      <Typography sx={modal.selectorHeaderCount}>
                        {pendingSubDepts.length} selected
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        {pendingSubDepts.length > 0 && (
                          <Button size="small" onClick={handleClearPending} sx={modal.clearAllButton}>
                            Clear all
                          </Button>
                        )}
                        <IconButton size="small" onClick={handleCancelSelector} sx={modal.selectorCloseIcon}>
                          <icons.userMgmt.close sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Search */}
                    <Box sx={modal.selectorSearchBox}>
                      <Input
                        fullWidth size="small" placeholder="Search sub-departments…"
                        value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
                        icon={<icons.userMgmt.search sx={modal.selectorSearchIcon} />}
                        InputProps={{ sx: modal.selectorSearchInput }}
                      />
                    </Box>

                    <Divider sx={{ flexShrink: 0 }} />

                    {/* List */}
                    <Box sx={modal.selectorListBox}>
                      {filteredDepts.length === 0 ? (
                        <Typography sx={modal.selectorEmptyText}>
                          No results found
                        </Typography>
                      ) : (
                        filteredDepts.map((sd: any) => {
                          const checked = pendingSubDeptIds.includes(sd.subDepartmentId);
                          return (
                            <Box
                              key={sd.subDepartmentId}
                              onClick={() => handleToggleDept(sd)}
                              sx={(theme) => modal.selectorListItem(checked, theme)}
                            >
                              <Checkbox
                                checked={checked} size="small" disableRipple
                                sx={modal.selectorCheckbox}
                              />
                              <Typography sx={modal.selectorItemText(checked)}>
                                {sd.subDepartmentName}
                              </Typography>
                              {checked && <Box sx={modal.selectorItemDot} />}
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  </Card>
                </Collapse>
              </Box>
            )}

            {/* Selected cards / state messages */}
            {subDeptsRestricted ? (
              <Box sx={(theme) => modal.restrictedBox(theme)}>
                <icons.userMgmt.info sx={modal.restrictedIcon} />
                <Typography sx={modal.restrictedText}>
                  <b>{form.role}</b> has root-level cross-department access by default.
                </Typography>
              </Box>
            ) : form.subDepts.length === 0 ? (
              <Box sx={modal.emptySubDeptsBox(subDeptsMandatory && form.role)}>
                <Typography sx={modal.emptySubDeptsText(subDeptsMandatory && form.role)}>
                  {subDeptsMandatory && form.role
                    ? "⚠ At least one sub-department is mandatory."
                    : "No sub-departments allocated."}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0.75}>
                {form.subDepts.map((sd: any) => (
                  <Card key={sd.subDepartmentId} sx={(theme) => modal.selectedCard(theme)}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={modal.selectedCardDot} />
                      <Typography sx={modal.selectedCardText}>
                        {sd.subDepartmentName}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleRemoveSubDept(sd.subDepartmentId)}
                      sx={(theme) => modal.selectedCardRemove(theme)}>
                      <icons.userMgmt.close sx={modal.selectedCardRemoveIcon} />
                    </IconButton>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

        </Stack>
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={!canSubmit || saving} sx={modal.saveButton}>
          {saving
            ? <><CircularProgress size={14} sx={modal.savingSpinner} />Saving…</>
            : editTarget ? "Update Changes" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormModal;