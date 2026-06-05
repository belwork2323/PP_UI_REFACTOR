import { useCallback, useMemo, useState } from "react";
import { useAlertStore } from "../../../app/store/alertStore";
import { QUALITY_CONTROL_STATUS, type QualityControlWorkflowView } from "./qualityControlWorkflowData";

type WorkflowBatch<FormState> = {
  id: number | string;
  batchId: string;
  motorId: string;
  priority: string;
  rejectionReason?: string | null;
  draftData?: FormState | null;
  [key: string]: any;
};

type WorkflowMessages = {
  EMPTY_FORM_ERROR: string;
  CREATE_DRAFT_SUCCESS: string;
  UPDATE_DRAFT_SUCCESS: string;
  CREATE_SUBMIT_SUCCESS: string;
  UPDATE_SUBMIT_SUCCESS: string;
};

type UseQualityControlWorkflowOptions<FormState, Batch extends WorkflowBatch<FormState>> = {
  initialBatches: Batch[];
  statusField: keyof Batch & string;
  createDefaultFormState: () => FormState;
  hasAnyValue: (form: FormState) => boolean;
  messages: WorkflowMessages;
};

export const useQualityControlWorkflow = <
  FormState,
  Batch extends WorkflowBatch<FormState>,
>({
  initialBatches,
  statusField,
  createDefaultFormState,
  hasAnyValue,
  messages,
}: UseQualityControlWorkflowOptions<FormState, Batch>) => {
  const showAlert = useAlertStore((state) => state.showAlert);

  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [view, setView] = useState<QualityControlWorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(createDefaultFormState());
  const [initialSnapshot, setInitialSnapshot] = useState<string>(
    JSON.stringify(createDefaultFormState())
  );

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
  }, [createDefaultFormState]);

  const openForm = useCallback(
    (batch: Batch, editMode: boolean) => {
      const nextFormData = batch.draftData ?? createDefaultFormState();
      setActiveBatch(batch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setInitialSnapshot(JSON.stringify(nextFormData));
      setView("form");
    },
    [createDefaultFormState]
  );

  const handleFillForm = useCallback(
    async (batch: Batch) => openForm(batch, false),
    [openForm]
  );

  const handleEditForm = useCallback(
    async (batch: Batch) => openForm(batch, true),
    [openForm]
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }

    resetFormContext();
  }, [isFormDirty, resetFormContext]);

  const handleDiscardAndBack = useCallback(() => {
    resetFormContext();
  }, [resetFormContext]);

  const handleFormChange = useCallback(
    (payload: FormState) => {
      setFormData(payload ?? createDefaultFormState());
    },
    [createDefaultFormState]
  );

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!hasAnyValue(formData)) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const currentStatus = activeBatch[statusField] as string | undefined;
      const isCreateFlow = currentStatus === QUALITY_CONTROL_STATUS.INITIATED;

      setActionLoading(true);
      try {
        const nextStatus =
          intent === "draft"
            ? QUALITY_CONTROL_STATUS.IN_PROGRESS
            : QUALITY_CONTROL_STATUS.WAITING_FOR_APPROVAL;

        setBatches((prev) =>
          prev.map((batch) =>
            batch.id === activeBatch.id
              ? {
                  ...batch,
                  [statusField]: nextStatus,
                  draftData: formData,
                }
              : batch
          )
        );

        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                [statusField]: nextStatus,
                draftData: formData,
              }
            : prev
        );
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow ? messages.CREATE_DRAFT_SUCCESS : messages.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );
          return true;
        }

        showAlert(
          isCreateFlow ? messages.CREATE_SUBMIT_SUCCESS : messages.UPDATE_SUBMIT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );
        resetFormContext();
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBatch, formData, formSnapshot, hasAnyValue, messages, resetFormContext, showAlert, statusField]
  );

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

  const handleLegacySaveDraft = useCallback(
    async (payload: FormState) => {
      setFormData(payload);
      const nextSnapshot = JSON.stringify(payload);
      setInitialSnapshot(nextSnapshot);
      if (!activeBatch) return false;

      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === activeBatch.id
            ? {
                ...batch,
                [statusField]: QUALITY_CONTROL_STATUS.IN_PROGRESS,
                draftData: payload,
              }
            : batch
        )
      );
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              [statusField]: QUALITY_CONTROL_STATUS.IN_PROGRESS,
              draftData: payload,
            }
          : prev
      );

      showAlert(
        activeBatch[statusField] === QUALITY_CONTROL_STATUS.INITIATED
          ? messages.CREATE_DRAFT_SUCCESS
          : messages.UPDATE_DRAFT_SUCCESS,
        "success",
        { autoCloseMs: 2200 }
      );
      return true;
    },
    [activeBatch, messages, showAlert, statusField]
  );

  const handleLegacySubmit = useCallback(
    async (payload: FormState) => {
      setFormData(payload);
      if (!activeBatch) return false;

      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === activeBatch.id
            ? {
                ...batch,
                [statusField]: QUALITY_CONTROL_STATUS.WAITING_FOR_APPROVAL,
                draftData: payload,
              }
            : batch
        )
      );

      showAlert(
        activeBatch[statusField] === QUALITY_CONTROL_STATUS.INITIATED
          ? messages.CREATE_SUBMIT_SUCCESS
          : messages.UPDATE_SUBMIT_SUCCESS,
        "success",
        { autoCloseMs: 2200 }
      );
      resetFormContext();
      return true;
    },
    [activeBatch, messages, resetFormContext, showAlert, statusField]
  );

  return {
    batches,
    loading: false,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleFormChange,
    handleSaveDraft,
    handleSubmit,
    handleLegacySaveDraft,
    handleLegacySubmit,
  };
};

export default useQualityControlWorkflow;
