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

const validateUserForm = (form: any, isEditMode: boolean) => {
  const errors: Record<string, string> = {};

  const username = String(form.username || "").trim();
  if (!username) {
    errors.username = "Username is required";
  } else if (!/^[A-Za-z\s]+$/.test(username)) {
    errors.username = "Username must contain only alphabetic characters and spaces";
  }

  if (!isEditMode) {
    const userId = String(form.userId || "").trim();
    if (!userId) {
      errors.userId = "User ID is required";
    } else if (userId.length < 3) {
      errors.userId = "User ID must be at least 3 characters long";
    } else if (!/^[A-Za-z0-9]+$/.test(userId)) {
      errors.userId = "User ID must be alphanumeric only (no spaces or special characters)";
    }
  }

  return errors;
};

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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationAttempt, setValidationAttempt] = useState({
    format: false,
    submit: false,
  });

  const getFieldError = (fieldPath: string) => {
    if (validationAttempt.format || validationAttempt.submit) {
      return validationErrors[fieldPath];
    }
    return undefined;
  };

  // Reset errors and validation attempts when dialog opens/closes or target changes
  useEffect(() => {
    if (!open) {
      setValidationErrors({});
      setValidationAttempt({ format: false, submit: false });
    }
  }, [open, editTarget]);

  const handleFieldChange = (field: string) => (e: any) => {
    const value = e?.target?.value ?? e;
    onFormChange(field)({ target: { value } });

    // Enable format validation attempt on change for live feedback
    setValidationAttempt((prev) => (prev.format ? prev : { ...prev, format: true }));

    const updatedForm = { ...form, [field]: value };
    const errors = validateUserForm(updatedForm, Boolean(editTarget));
    setValidationErrors(errors);
  };

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingSubDepts, setPendingSubDepts] = useState<any[]>([]);

  const subDeptsRestricted = useMemo(
    () => SUBDEPT_RESTRICTED_ROLES.includes(form.role),
    [form.role],
  );

  const subDeptsMandatory = useMemo(() => SUBDEPT_MANDATORY_ROLES.includes(form.role), [form.role]);

  const formErrors = useMemo(() => validateUserForm(form, Boolean(editTarget)), [form, editTarget]);

  const createFormValid = useMemo(
    () =>
      Boolean(
        Object.keys(formErrors).length === 0 &&
        form.role &&
        (subDeptsMandatory ? form.subDepts.length > 0 : true),
      ),
    [formErrors, form.role, form.subDepts, subDeptsMandatory],
  );

  const updateFormValid = useMemo(
    () =>
      Boolean(
        Object.keys(formErrors).length === 0 &&
        form.role &&
        (subDeptsMandatory ? form.subDepts.length > 0 : true),
      ),
    [formErrors, form.role, form.subDepts, subDeptsMandatory],
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

  const handleSaveClick = () => {
    setValidationAttempt({ format: true, submit: true });
    const errors = validateUserForm(form, Boolean(editTarget));
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      onSave();
    }
  };

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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth
                label="Username"
                value={form.username}
                onChange={handleFieldChange("username")}
                placeholder="e.g. arjunsharma"
                size="small"
                sx={input}
                required
                inputProps={{ maxLength: 100 }}
                error={Boolean(getFieldError("username"))}
                helperText={getFieldError("username")}
              />
              <Input
                fullWidth
                label="User ID"
                value={form.userId}
                onChange={handleFieldChange("userId")}
                placeholder="e.g. EMP123"
                size="small"
                sx={input}
                required
                inputProps={{ maxLength: 20 }}
                disabled={Boolean(editTarget)}
                error={Boolean(getFieldError("userId"))}
                helperText={getFieldError("userId")}
              />
            </Stack>
          </Box>

          {/* Role */}
          <Box>
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

            {!subDeptsRestricted && (
              <Box sx={modal.selectorWrapper}>
                <Collapse in={selectorOpen} unmountOnExit sx={modal.selectorCollapse}>
                  <Card variant="outlined" sx={modal.selectorCard}>
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

                    {filteredDepts.length > 0 &&
                      (() => {
                        const allFilteredIds = filteredDepts.map((sd) => sd.subDepartmentId);
                        const isAllSelected = allFilteredIds.every((id) =>
                          pendingSubDeptIds.includes(id),
                        );

                        const handleToggleSelectAll = () => {
                          if (isAllSelected) {
                            const updated = pendingSubDepts.filter(
                              (item) => !allFilteredIds.includes(item.subDepartmentId),
                            );
                            setPendingSubDepts(updated);
                          } else {
                            const newItems = filteredDepts.filter(
                              (sd) => !pendingSubDeptIds.includes(sd.subDepartmentId),
                            );
                            setPendingSubDepts([...pendingSubDepts, ...newItems]);
                          }
                        };

                        return (
                          <Box
                            onClick={handleToggleSelectAll}
                            sx={(theme) => ({
                              ...modal.selectorListItem(isAllSelected, theme),
                              borderBottom: "1px solid",
                              borderColor: "divider",
                              fontWeight: 600,
                            })}
                          >
                            <Checkbox
                              checked={isAllSelected}
                              size="small"
                              disableRipple
                              sx={modal.selectorCheckbox}
                            />
                            <Typography sx={modal.selectorItemText(isAllSelected)}>
                              Select All
                            </Typography>
                          </Box>
                        );
                      })()}

                    <Divider sx={{ flexShrink: 0 }} />

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
          onClick={handleSaveClick}
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
