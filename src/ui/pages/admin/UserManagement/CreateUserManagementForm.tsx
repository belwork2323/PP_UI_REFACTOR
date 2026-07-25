import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Zoom,
  Checkbox,
  Card,
  Divider,
  Collapse,
  Chip,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import Input from "@ui/components/common/Input";
import { roleConfig } from "@app/theme/roleConfig";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import { getDisplayName } from "@utils/userManagementUtils";
import { STRINGS } from "@app/config/strings";

const S = STRINGS.USER_MANAGEMENT;

const SUBDEPT_RESTRICTED_ROLES = ["Admin", "System Manager", "Centre Head"];
const SUBDEPT_MANDATORY_ROLES = ["User", "Approver"];

const normalizeSubDeptIds = (subDepts: any[]) =>
  (Array.isArray(subDepts) ? subDepts : [])
    .map((sd: any) => Number(sd?.subDepartmentId))
    .filter((id: number) => Number.isFinite(id))
    .sort((a, b) => a - b);

const CreateUserManagementForm = ({
  open,
  onClose,
  onSave,
  editTarget,
  form,
  onFormChange,
  onSubDeptsChange,
  availableRoles,
  availableSubDepts,
  saving,
  t,
}: any) => {
  const { modal, input } = t;

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingSubDepts, setPendingSubDepts] = useState<any[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectorOpen(false);
      setSearch("");
      setPendingSubDepts([]);
    }
  }, [open, editTarget]);

  const subDeptsRestricted = useMemo(
    () => SUBDEPT_RESTRICTED_ROLES.includes(form.role),
    [form.role],
  );

  const subDeptsMandatory = useMemo(() => SUBDEPT_MANDATORY_ROLES.includes(form.role), [form.role]);

  const createFormValid = useMemo(
    () =>
      Boolean(
        form.username?.trim() &&
        form.userId?.trim() &&
        form.role &&
        (subDeptsMandatory ? form.subDepts.length > 0 : true),
      ),
    [form.username, form.userId, form.role, form.subDepts, subDeptsMandatory],
  );

  const updateFormValid = useMemo(
    () =>
      Boolean(
        form.username?.trim() && form.role && (subDeptsMandatory ? form.subDepts.length > 0 : true),
      ),
    [form.username, form.role, form.subDepts, subDeptsMandatory],
  );

  const hasCommittedChanges = useMemo(() => {
    if (!editTarget) return true;
    const currentUsername = String(form.username ?? "").trim();
    const originalUsername = String(editTarget?.username ?? "").trim();
    const usernameChanged = currentUsername !== originalUsername;

    const currentSubDeptIds = normalizeSubDeptIds(form.subDepts);
    const originalSubDeptIds = normalizeSubDeptIds(editTarget?.subDepartments);
    const subDeptChanged =
      currentSubDeptIds.length !== originalSubDeptIds.length ||
      currentSubDeptIds.some((id, idx) => id !== originalSubDeptIds[idx]);

    return usernameChanged || subDeptChanged;
  }, [editTarget, form.username, form.subDepts]);

  const canSubmit = useMemo(
    () => (editTarget ? updateFormValid && hasCommittedChanges : createFormValid),
    [editTarget, updateFormValid, hasCommittedChanges, createFormValid],
  );

  const pendingSubDeptIds = useMemo(
    () => pendingSubDepts.map((sd: any) => sd.subDepartmentId),
    [pendingSubDepts],
  );

  const filteredDepts = useMemo(() => {
    if (!search.trim()) return availableSubDepts || [];
    return (availableSubDepts || []).filter((sd: any) =>
      sd.subDepartmentName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [availableSubDepts, search]);

  const handleOpenSelector = useCallback(() => {
    setPendingSubDepts([...form.subDepts]);
    setSelectorOpen(true);
  }, [form.subDepts]);

  const handleCommitSelector = useCallback(() => {
    onSubDeptsChange(pendingSubDepts);
    setSelectorOpen(false);
    setSearch("");
    setPendingSubDepts([]);
  }, [pendingSubDepts, onSubDeptsChange]);

  const handleCancelSelector = useCallback(() => {
    setSelectorOpen(false);
    setSearch("");
    setPendingSubDepts([]);
  }, []);

  const handleToggleDept = useCallback((sd: any) => {
    setPendingSubDepts((prev) => {
      const exists = prev.some((s: any) => s.subDepartmentId === sd.subDepartmentId);
      return exists
        ? prev.filter((s: any) => s.subDepartmentId !== sd.subDepartmentId)
        : [...prev, sd];
    });
  }, []);

  const handleRemoveSubDept = useCallback(
    (id: number) => {
      onSubDeptsChange(form.subDepts.filter((sd: any) => sd.subDepartmentId !== id));
    },
    [form.subDepts, onSubDeptsChange],
  );

  const handleClearPending = useCallback(() => {
    setPendingSubDepts([]);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={<icons.userMgmt.personOutline sx={modal.header.icon} />}
          title={editTarget ? S.FORM.EDIT_TITLE : S.FORM.CREATE_TITLE}
          subtitle={
            editTarget ? S.FORM.EDIT_SUBTITLE(getDisplayName(editTarget)) : S.FORM.CREATE_SUBTITLE
          }
          onClose={() => !saving && onClose()}
          closeDisabled={saving}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          {/* Credentials */}
          <Box>
            <Typography sx={modal.fieldLabel}>Credentials *</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth
                label="Username"
                value={form.username}
                onChange={onFormChange("username")}
                placeholder="e.g. arjun.sharma"
                size="small"
                sx={input}
                required
              />
              <Input
                fullWidth
                label="User ID"
                value={form.userId}
                onChange={onFormChange("userId")}
                placeholder="e.g. EMP12345"
                size="small"
                sx={input}
                required
                disabled={Boolean(editTarget)}
              />
            </Stack>
          </Box>

          {/* Role */}
          <Box>
            <Typography sx={modal.fieldLabel}>Role *</Typography>
            <FormControl fullWidth size="small" sx={input} required disabled={Boolean(editTarget)}>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={onFormChange("role")}
                MenuProps={t.menuPaper}
              >
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
                    ...(selectorOpen ? modal.selectorToggleOpen : modal.selectorToggleClosed),
                  }}
                >
                  {selectorOpen
                    ? "Add"
                    : form.subDepts.length > 0
                      ? "Add More"
                      : "Select Sub-departments"}
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
                          <Button
                            size="small"
                            onClick={handleClearPending}
                            sx={modal.clearAllButton}
                          >
                            Clear all
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={handleCancelSelector}
                          sx={modal.selectorCloseIcon}
                        >
                          <icons.userMgmt.close sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Search */}
                    <Box sx={modal.selectorSearchBox}>
                      <Input
                        fullWidth
                        size="small"
                        placeholder="Search sub-departments…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        icon={<icons.userMgmt.search sx={modal.selectorSearchIcon} />}
                        InputProps={{ sx: modal.selectorSearchInput }}
                      />
                    </Box>

                    <Divider sx={{ flexShrink: 0 }} />

                    {/* List */}
                    <Box sx={modal.selectorListBox}>
                      {filteredDepts.length === 0 ? (
                        <Typography sx={modal.selectorEmptyText}>No results found</Typography>
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
                                checked={checked}
                                size="small"
                                disableRipple
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
                      <Typography sx={modal.selectedCardText}>{sd.subDepartmentName}</Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveSubDept(sd.subDepartmentId)}
                      sx={(theme) => modal.selectedCardRemove(theme)}
                    >
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
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!canSubmit || saving}
          sx={modal.saveButton}
        >
          {saving ? (
            <>
              <CircularProgress size={14} sx={modal.savingSpinner} />
              Saving…
            </>
          ) : editTarget ? (
            "Update Changes"
          ) : (
            "Create User"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserManagementForm;
