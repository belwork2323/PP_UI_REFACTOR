import { useState } from "react";
import { batchManagementController } from "../../../controllers/admin/batch_management/batchManagementController";
import { parseIdentificationSheetFromApi } from "../../../data/models/admin/BatchManagementModel";
import { useAlertStore } from "../../../app/store/alertStore";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.BATCH_MANAGEMENT;

const EMPTY_IDENTIFICATION_SHEET = {
  date:            "",
  batchSize:       0,
  bondingSheetNo:  "",
  mixerType:       "",
  BldgNo:          "",
  numberOfPremix:  1,
  remarks:         "",
  materials:       [] as any[],
};

const EMPTY_BATCH_FORM = {
  batchType:       "",
  subBatchType:    "",
  projectId:       "",
  motorStage:      "",
  numberOfMotors:  1,
  motorIds:        [""],
  priority:        "Medium",
  systemManagerId: "",
  objective:       "",
  articles:        [],
  identificationSheet: { ...EMPTY_IDENTIFICATION_SHEET },
};

const EMPTY_IMPL_FORM = {
  identificationSheet: { ...EMPTY_IDENTIFICATION_SHEET },
  objective:       "",
  articles:        [],
};

export const useBatchActions = (userOptions: any[], onSuccess: () => void) => {
  const [modalOpen, setModalOpen]           = useState(false);
  const [implModalOpen, setImplModalOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen]         = useState(false);
  
  const [editTarget, setEditTarget]         = useState<any>(null);
  const [editImplTarget, setEditImplTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget]     = useState<any>(null);
  
  const [deleteReason, setDeleteReason]     = useState("");
  const [batchForm, setBatchForm]           = useState({ ...EMPTY_BATCH_FORM });
  const [implForm, setImplForm]             = useState({ ...EMPTY_IMPL_FORM });
  
  const [saving, setSaving]                 = useState(false);
  const [implSaving, setImplSaving]         = useState(false);
  const [implViewOnly, setImplViewOnly]     = useState(false);
  const [deleting, setDeleting]             = useState(false);

  /* ── Convert BatchListItemModel to batch form ──────────────────────────── */
  const batchModelToForm = (b: any) => {
    const motorStageRaw = b.motorStage ?? b.motorType;
    const motorStage =
      motorStageRaw != null && motorStageRaw !== ""
        ? String(
            typeof motorStageRaw === "object"
              ? motorStageRaw.motorTypeName ?? motorStageRaw.motorStage ?? ""
              : motorStageRaw
          )
        : "";

    return {
      batchType:       b.batchType       ?? "MAIN",
      subBatchType:    b.subBatchType    ?? "",
      projectId:       b.projectId       ?? "",
      motorStage,
      numberOfMotors:  b.numberOfMotors  ?? 1,
      motorIds:        Array.isArray(b.motorIds) && b.motorIds.length > 0 ? b.motorIds : [""],
      priority:        b.priority        ?? "Medium",
      systemManagerId: b.systemManager?.id ?? b.systemManagerId ?? "",
      objective:       b.objective ?? "",
      articles:        Array.isArray(b.articles) ? b.articles : [],
      identificationSheet: b.identificationSheet
        ? parseIdentificationSheetFromApi(b.identificationSheet)
        : { ...EMPTY_IDENTIFICATION_SHEET },
    };
  };

  /* ── Convert BatchListItemModel to implementation form ───────────────────── */
  const implModelToForm = (b: any) => ({
    identificationSheet: b.identificationSheet
      ? parseIdentificationSheetFromApi(b.identificationSheet)
      : { ...EMPTY_IDENTIFICATION_SHEET },
    objective:          b.objective ?? "",
    articles:           Array.isArray(b.articles) ? b.articles : [],
  });

  /* ── Open create batch (Step 1) ──────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setBatchForm({ ...EMPTY_BATCH_FORM });
    setModalOpen(true);
  };

  /* ── Open edit batch details ─────────────────────────────────────────── */
  const openEdit = async (batch: any) => {
    const batchId = batch.batchId;

    setSaving(true);
    setModalOpen(true);
    setEditTarget(batch);
    setBatchForm(batchModelToForm(batch));

    try {
      const resp = await batchManagementController.getBatchById(batchId);
      if (resp) {
        setEditTarget(resp);
        setBatchForm(batchModelToForm(resp));
      } else {
        useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const loadImplementationForm = async (batch: any, viewOnly: boolean) => {
    const batchId = batch.batchId;

    setImplViewOnly(viewOnly);
    setImplSaving(true);
    setImplModalOpen(true);
    setEditImplTarget(batch);
    setImplForm(implModelToForm(batch));

    try {
      const resp = await batchManagementController.getBatchById(batchId);
      if (resp) {
        setEditImplTarget(resp);
        setImplForm(implModelToForm(resp));
      } else {
        useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
        setImplModalOpen(false);
        setImplViewOnly(false);
      }
    } finally {
      setImplSaving(false);
    }
  };

  /* ── Open complete implementation details (Step 2) ────────────────────── */
  const openCompleteImplementation = async (batch: any) => {
    await loadImplementationForm(batch, false);
  };

  /** Read-only view of completed implementation sheet */
  const openViewImplementation = async (batch: any) => {
    await loadImplementationForm(batch, true);
  };

  const openImplementationFromCreate = () => {
    setImplViewOnly(false);
    setEditImplTarget(null);
    setImplForm({
      identificationSheet: batchForm.identificationSheet ?? { ...EMPTY_IMPL_FORM.identificationSheet },
      objective: batchForm.objective ?? "",
      articles: Array.isArray(batchForm.articles) ? batchForm.articles : [],
    });
    setImplModalOpen(true);
  };

  /* ── Open delete: reset reason each time ──────────────────────────────── */
  const openDelete = (batch: any) => {
    setDeleteTarget(batch);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  /* ── Save batch details (create or update) — Step 1 ───────────────────── */
  const handleSaveBatch = async () => {
    const motorIdsValid = Array.isArray(batchForm.motorIds)
      && batchForm.motorIds.length === batchForm.numberOfMotors
      && batchForm.motorIds.every((id: string) => id && id.trim());

    if (!batchForm.batchType || !batchForm.numberOfMotors || !motorIdsValid ||
        !batchForm.priority || !batchForm.systemManagerId) {
      useAlertStore.getState().showAlert("Please fill in all required fields.", "warning");
      return;
    }

    const isMainOrQualification = batchForm.batchType === "MAIN"
      || (batchForm.batchType === "SUBSCALE" && batchForm.subBatchType === "QUALIFICATION");

    if (isMainOrQualification && !batchForm.projectId) {
      useAlertStore.getState().showAlert("Project ID is required for this batch type.", "warning");
      return;
    }

    if (batchForm.batchType === "SUBSCALE" && batchForm.subBatchType === "EXPERIMENTAL") {
      if (!batchForm.objective?.trim()) {
        useAlertStore.getState().showAlert("Experiment objective is required.", "warning");
        return;
      }
      if (!Array.isArray(batchForm.articles) || batchForm.articles.length === 0) {
        useAlertStore.getState().showAlert("Select at least one subscale article.", "warning");
        return;
      }
    }

    setSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_BATCH, "info", { loading: true });

    const ok = editTarget
      ? await batchManagementController.updateBatch(editTarget.batchId, batchForm)
      : await batchManagementController.createBatch(batchForm);

    if (ok) {
      setTimeout(() => {
        onSuccess();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      setSaving(false);
    }
  };

  /* ── Save implementation details (complete batch) — Step 2 ───────────── */
  const handleSaveImplementation = async () => {
    setImplSaving(true);
    useAlertStore.getState().showAlert("Saving implementation details...", "info", { loading: true });

    if (!editImplTarget) {
      setBatchForm(prev => ({
        ...prev,
        identificationSheet: implForm.identificationSheet,
        objective: implForm.objective,
        articles: implForm.articles,
      }));

      setImplModalOpen(false);
      setEditImplTarget(null);
      setImplForm({ ...EMPTY_IMPL_FORM });
      setImplSaving(false);
      useAlertStore.getState().showAlert("Implementation sheet saved for batch creation.", "success");
      return;
    }

    // Get existing batch form to merge with implementation details
    const fullForm = {
      ...batchModelToForm(editImplTarget),
      ...implForm,
    };

    const ok = await batchManagementController.updateBatch(editImplTarget.batchId, fullForm);

    if (ok) {
      setTimeout(() => {
        onSuccess();
        setImplModalOpen(false);
        setEditImplTarget(null);
        setImplForm({ ...EMPTY_IMPL_FORM });
        setImplSaving(false);
      }, 1000);
    } else {
      setImplSaving(false);
    }
  };

  /* ── Delete — validates reason ─────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget || !deleteReason.trim()) return;

    const batchId = deleteTarget.batchId;

    setDeleting(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DELETING_BATCH, "info", { loading: true });

    const ok = await batchManagementController.deleteBatch(
      batchId,
      deleteReason.trim(),
    );

    if (ok) {
      setTimeout(() => {
        onSuccess();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteReason("");
        setDeleting(false);
      }, 1000);
    } else {
      setDeleting(false);
    }
  };

  const handleBatchFormChange = (field: string) => (e: any) => {
    if (field === "numberOfMotors") {
      const numberOfMotors = Number(e.target.value) || 1;
      const motorIds = Array.from({ length: numberOfMotors }, (_, idx) => batchForm.motorIds[idx] || "");
      setBatchForm(prev => ({ ...prev, numberOfMotors, motorIds }));
      return;
    }

    if (field === "batchType") {
      const nextValue = e.target.value;
      setBatchForm(prev => ({
        ...prev,
        batchType: nextValue,
        subBatchType: nextValue === "SUBSCALE" ? prev.subBatchType : "",
      }));
      return;
    }

    if (field === "subBatchType") {
      const nextValue = e.target.value;
      setBatchForm(prev => ({
        ...prev,
        subBatchType: nextValue,
        objective: nextValue === "EXPERIMENTAL" ? prev.objective : "",
        articles: nextValue === "EXPERIMENTAL" ? prev.articles : [],
      }));
      return;
    }

    if (field.startsWith("identificationSheet.")) {
      const key = field.split(".")[1];
      setBatchForm(prev => ({
        ...prev,
        identificationSheet: {
          ...prev.identificationSheet,
          [key]: e.target.value,
        },
      }));
      return;
    }

    setBatchForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleMotorIdsChange = (motorIds: string[]) =>
    setBatchForm(prev => ({ ...prev, motorIds }));

  const handleBatchMaterialsChange = (materials: any[]) =>
    setBatchForm(prev => ({
      ...prev,
      identificationSheet: { ...prev.identificationSheet, materials }
    }));

  const handleImplFormChange = (field: string, value: any) => {
    if (field === "identificationSheet") {
      setImplForm(prev => ({ ...prev, identificationSheet: value }));
      return;
    }

    setImplForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialsChange = (materials: any[]) =>
    setImplForm(prev => ({
      ...prev,
      identificationSheet: { ...prev.identificationSheet, materials }
    }));

  return {
    // Batch form (Step 1)
    modalOpen,  setModalOpen,
    editTarget,
    batchForm,
    saving,
    openCreate,
    openEdit,
    handleSaveBatch,
    handleBatchFormChange,
    handleMotorIdsChange,

    // Implementation form (Step 2)
    implModalOpen, setImplModalOpen,
    editImplTarget,
    implForm,
    implSaving,
    openCompleteImplementation,
    openViewImplementation,
    implViewOnly,
    setImplViewOnly,
    openImplementationFromCreate,
    handleSaveImplementation,
    handleImplFormChange,
    handleMaterialsChange,

    // Delete
    deleteOpen, setDeleteOpen,
    deleteTarget,
    deleteReason, setDeleteReason,
    deleting,
    openDelete,
    handleDelete,
    handleBatchMaterialsChange,
  };
};
