import { useState } from "react";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";
import { useAlertStore } from "../../../app/store/alertStore";
import { STRINGS } from "../../../app/config/strings";

const EMPTY_FORM = { username: "", userId: "", role: "", subDepts: [] };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asUuid = (value: any) => {
  const v = String(value ?? "").trim();
  return UUID_REGEX.test(v) ? v : "";
};

const getUserUUID = (user: any) =>
  asUuid(user?.userUUID) ||
  asUuid(user?.user_uuid) ||
  asUuid(user?.uuid) ||
  asUuid(user?.id) ||
  "";
const normalizeIds = (values: any[]) =>
  Array.from(
    new Set(
      (values || [])
        .map((value: any) => Number(value))
        .filter((id: number) => Number.isFinite(id))
    )
  ).sort((a, b) => a - b);

export const useUserActions = (availableRoles: any[], onSuccess: () => void) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = async (user: any) => {
    const userUUID = getUserUUID(user);

    setSaving(true);
    setModalOpen(true);
    
    // Quick initialize so form doesn't flicker empty
    setForm({
      username: user.username || "",
      userId: user.userId || "",
      role: user.role?.roleName || user.role || "",
      subDepts: Array.isArray(user.subDepartments) ? user.subDepartments : [],
    });

    try {
      // API 4: fetch strict user details layout specifically for updating mapping
      const resp = await userManagementController.getUserById(userUUID);
      if (resp?.success && resp.data) {
         const resolvedUUID = getUserUUID(resp.data) || userUUID;
         setEditTarget({
           ...resp.data,
           userUUID: resolvedUUID,
           user_uuid: resolvedUUID,
         });
         setForm({
           username: resp.data.username || "",
           userId: (resp.data.userId || user.userId || "") as string,
           role: resp.data.role || "",
           subDepts: Array.isArray(resp.data.subDepartments) ? resp.data.subDepartments : [],
         });
      } else {
         useAlertStore.getState().showAlert(resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.LOAD_USER_FAILED, "error");
         setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (user: any) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    const trimmedUsername = form.username?.trim() || "";
    if (!editTarget && (!trimmedUsername || !form.role || !form.userId?.trim())) return;
    setSaving(true);
    useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.SAVING_USER, "info", { loading: true });
    
    const selectedRoleObj = availableRoles.find(r => r.roleName === form.role);
    if (!editTarget && !selectedRoleObj?.roleId) {
      useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.OPERATION_FAILED, "error", { autoCloseMs: 3000 });
      setSaving(false);
      return;
    }
    const subDepartmentIds = normalizeIds(
      form.subDepts.map((sd: any) => sd?.subDepartmentId)
    );
    
    let resp;
    
    if (editTarget) {
      // API 3: update requires user_uuid and only changed fields.
      const updatePayload: any = {
        user_uuid: getUserUUID(editTarget),
      };
      if (!updatePayload.user_uuid) {
        useAlertStore.getState().showAlert("Unable to resolve user UUID for update.", "error", { autoCloseMs: 3000 });
        setSaving(false);
        return;
      }
      const originalUsername = String(editTarget?.username || "").trim();
      const originalSubDepartmentIds = normalizeIds(
        Array.isArray(editTarget?.subDepartments)
          ? editTarget.subDepartments.map((sd: any) => sd?.subDepartmentId)
          : []
      );
      const subDepartmentsChanged =
        subDepartmentIds.length !== originalSubDepartmentIds.length ||
        subDepartmentIds.some((id, idx) => id !== originalSubDepartmentIds[idx]);

      if (trimmedUsername && trimmedUsername !== originalUsername) {
        updatePayload.username = trimmedUsername;
      }
      if (subDepartmentsChanged) {
        updatePayload.subDepartmentIds = subDepartmentIds;
      }
      if (!updatePayload.username && !updatePayload.subDepartmentIds) {
        useAlertStore.getState().showAlert("No changes to update.", "info", { autoCloseMs: 2000 });
        setSaving(false);
        return;
      }
      resp = await userManagementController.updateUser(updatePayload);
    } else {
      // API 1: create expects userId, username, roleId, and subDepartmentIds.
      const createPayload: any = {
        userId: form.userId.trim(),
        username: trimmedUsername,
        roleId: selectedRoleObj?.roleId,
        subDepartmentIds,
      };
      resp = await userManagementController.createUser(createPayload);
    }
      
    if (resp?.success) {
      useAlertStore.getState().showAlert(resp.message || STRINGS.USER_MANAGEMENT.MESSAGES.SAVE_SUCCESS, "success", { autoCloseMs: 2000 });
      setTimeout(() => {
        onSuccess();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      useAlertStore.getState().showAlert(resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.OPERATION_FAILED, "error", { autoCloseMs: 3000 });
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.DELETING_USER, "info", { loading: true });
    
    // API 5: delete mapped exactly to target user_uuid
    const resp = await userManagementController.deleteUser(getUserUUID(deleteTarget));
    if (resp?.success) {
      useAlertStore.getState().showAlert(resp.message || STRINGS.USER_MANAGEMENT.MESSAGES.DELETE_SUCCESS, "success", { autoCloseMs: 2000 });
      setTimeout(() => {
        onSuccess();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleting(false);
      }, 1000);
    } else {
      useAlertStore.getState().showAlert(resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.DELETE_FAILED, "error", { autoCloseMs: 3000 });
      setDeleting(false);
    }
  };

  const handleFormChange = (field: string) => (e: any) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubDeptsChange = (val: any) => {
    setForm(prev => ({ ...prev, subDepts: val }));
  };

  return {
    modalOpen, setModalOpen,
    deleteOpen, setDeleteOpen,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    form, setForm,
    saving,
    deleting,
    openCreate,
    openEdit,
    openDelete,
    handleSave,
    handleDelete,
    handleFormChange,
    handleSubDeptsChange,
  };
};
