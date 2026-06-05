import { useState } from "react";
import { projectManagementController } from "../../../controllers/admin/project_management/projectManagementController";
import { useAlertStore } from "../../../app/store/alertStore";

const EMPTY_FORM = { projectName: "", projectDescription: "" };

const getErrorMessage = (response: any): string => {
  // Show API error message if available
  if (response?.error?.details) return response.error.details;
  if (response?.message) return response.message;
  // Fallback to generic error
  return "An error occurred on server";
};

export const useProjectActions = (onRefresh: () => void) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (project: any) => {
    setEditTarget(project);
    setForm({
      projectName: project.projectName || "",
      projectDescription: project.projectDescription || "",
    });
    setModalOpen(true);
  };

  const openDelete = (project: any) => {
    setDeleteTarget(project);
    setDeleteOpen(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.projectName.trim()) {
      useAlertStore.getState().showAlert("Project name is required", "error");
      return;
    }

    setSaving(true);
    useAlertStore.getState().showAlert(
      editTarget ? "Updating project..." : "Creating project...",
      "info",
      { loading: true }
    );

    try {
      let resp;

      if (editTarget) {
        resp = await projectManagementController.updateProject({
          projectId: editTarget.projectId,
          ...form,
        });
      } else {
        resp = await projectManagementController.createProject(form);
      }

      if (resp?.success) {
        useAlertStore.getState().showAlert(
          resp.message || (editTarget ? "Project updated successfully" : "Project created successfully"),
          "success",
          { autoCloseMs: 2000 }
        );
        setTimeout(() => {
          setModalOpen(false);
          resetForm();
          onRefresh();
          setSaving(false);
        }, 1000);
      } else {
        const errorMsg = getErrorMessage(resp);
        useAlertStore.getState().showAlert(errorMsg, "error", { autoCloseMs: 3000 });
        setSaving(false);
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error?.response?.data);
      useAlertStore.getState().showAlert(errorMsg, "error", { autoCloseMs: 3000 });
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const projectId = String(deleteTarget?.projectId ?? "").trim();
    if (!projectId) {
      useAlertStore.getState().showAlert("Project ID not found for deletion", "error", { autoCloseMs: 3000 });
      return;
    }

    setDeleting(true);
    useAlertStore.getState().showAlert("Deleting project...", "info", { loading: true });

    try {
      const resp = await projectManagementController.deleteProject(projectId);

      if (resp?.success) {
        useAlertStore.getState().showAlert(
          resp.message || "Project deleted successfully",
          "success",
          { autoCloseMs: 2000 }
        );
        setTimeout(() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
          onRefresh();
          setDeleting(false);
        }, 1000);
      } else {
        const errorMsg = getErrorMessage(resp);
        useAlertStore.getState().showAlert(errorMsg, "error", { autoCloseMs: 3000 });
        setDeleting(false);
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error?.response?.data);
      useAlertStore.getState().showAlert(errorMsg, "error", { autoCloseMs: 3000 });
      setDeleting(false);
    }
  };

  return {
    modalOpen, setModalOpen,
    deleteOpen, setDeleteOpen,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    saving, setSaving,
    deleting, setDeleting,
    form, setForm,
    openCreate,
    openEdit,
    openDelete,
    handleFormChange,
    handleSave,
    handleDelete,
  };
};
