import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import postCureController from "../../../controllers/user/manufacturing/postCureController";
import {
  createDefaultPostCureFormState,
  createEmptyPostCureMotorSession,
  hasAnyPostCureValue,
  hydratePostCureMotorSession,
  mapPostCureDetailsToFormState,
  mapPostCureFormStateToPayload,
  type PostCureFormState,
  type PostCureMotorSession,
} from "../../../data/models/user/PostCureFormModel";
import { fetchPostCureSchema as fetchPostCureSchemaFromEngine } from "../../../schema-engine";
import { isPostCureInhibitionOperation, mapPostCureInhibitorTypeToApi, mapPostCureOperationToApi, resolvePostCureMotorOptions } from "./postCureConfig";
import { canAddPostCureMotor, canLoadPostCureForm, type PostCureAddedMotor } from "./postCureFlowConfig";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form" | "details";

type PostCureBatch = {
  batchId: string;
  pcStatus?: string;
  formId?: string | null;
  motorId?: string;
  motorIds?: Array<string | number>;
  [key: string]: any;
};

type PostCureSchemaSetup = {
  operation: string;
  inhibitorType: string;
};

const PC_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const mapMotorsToAdded = (motors: PostCureMotorSession[]): PostCureAddedMotor[] =>
  motors.map((motor) => ({
    motorId: motor.motorId,
    motorReceiptDate: motor.motorReceiptDate,
  }));

const resolveInhibitorType = (operation: string, inhibitorType: string) =>
  isPostCureInhibitionOperation(operation) ? inhibitorType : "";

export const usePostCureHook = () => {
  const listParams = useSubdepartmentBatches("post-cure-operations");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "post-cure-operations")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<PostCureBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<PostCureFormState>(createDefaultPostCureFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
  const [addedMotors, setAddedMotors] = useState<PostCureAddedMotor[]>([]);
  const [draftMotorId, setDraftMotorId] = useState("");
  const [draftMotorReceiptDate, setDraftMotorReceiptDate] = useState("");
  const [draftOperation, setDraftOperation] = useState("");
  const [draftInhibitorType, setDraftInhibitorType] = useState("");
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const clearSetupDrafts = useCallback(() => {
    setDraftMotorId("");
    setDraftMotorReceiptDate("");
    setDraftOperation("");
    setDraftInhibitorType("");
  }, []);

  const formSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultPostCureFormState();
    setView("list");
    setActiveBatch(null);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setInitialSnapshot(JSON.stringify(defaults));
    setAddedMotors([]);
    clearSetupDrafts();
  }, [clearSetupDrafts]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchPostCureSchema = useCallback(
    async (setup: PostCureSchemaSetup) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const operationType = mapPostCureOperationToApi(setup.operation);
      if (!operationType) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.OPERATION_MISSING, "warning");
        return null;
      }

      const inhibitorType = mapPostCureInhibitorTypeToApi(setup.inhibitorType);
      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const response = await fetchPostCureSchemaFromEngine({
          subDepartmentId,
          operationType,
          ...(operationType === "INHIBITION" && inhibitorType ? { inhibitorType } : {}),
        });
        if (!response?.success || !response?.data) {
          const message = getErrorMessage(response, STRINGS.MANUFACTURING.POST_CURE.SCHEMA_FETCH_ERROR);
          setSchemaError(message);
          showAlert(message, "error");
          return null;
        }
        return response.data;
      } finally {
        setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const hydrateMotorsWithSchemas = useCallback(
    async (motors: PostCureMotorSession[]) => {
      const hydrated: PostCureMotorSession[] = [];

      for (const motor of motors) {
        const schema = await fetchPostCureSchema({
          operation: motor.operation,
          inhibitorType: resolveInhibitorType(motor.operation, motor.inhibitorType),
        });
        if (!schema) return null;
        hydrated.push(hydratePostCureMotorSession(motor, schema));
      }

      return hydrated;
    },
    [fetchPostCureSchema],
  );

  const openFormWithResolvedData = useCallback(
    async (batch: PostCureBatch, editMode: boolean) => {
      const status = parseStatus(batch.pcStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(PC_STATUS.IN_PROGRESS) ||
        status === parseStatus(PC_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultPostCureFormState();

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        const detailsResponse = await postCureController.fetchFormDetails({
          formId: batch.formId,
          // subDepartmentId,
        });
        setLoadingFormDetails(false);

        if (!detailsResponse?.success || !detailsResponse?.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? STRINGS.MANUFACTURING.POST_CURE.DETAILS_NOT_FOUND
              : STRINGS.MANUFACTURING.POST_CURE.DETAILS_FETCH_ERROR;
          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
        nextFormData = mapPostCureDetailsToFormState(detailsResponse.data);

        if (nextFormData.motors.some((motor) => motor.savedSections?.length)) {
          const hydratedMotors = await hydrateMotorsWithSchemas(nextFormData.motors);
          if (!hydratedMotors) return;
          nextFormData = {
            ...nextFormData,
            schemaFormLoaded: true,
            motors: hydratedMotors,
          };
        }
      }

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setInitialSnapshot(JSON.stringify(nextFormData));
      setAddedMotors(mapMotorsToAdded(nextFormData.motors));
      clearSetupDrafts();
      setView("form");
    },
    [showAlert, subDepartmentId, hydrateMotorsWithSchemas, clearSetupDrafts],
  );
  const handleViewPostCureDetails = useCallback(
    async (row: any) => {
      if (!row?.formId) return;

      setDetailsLoading(true);

      try {
        const response =
          await postCureController.fetchFormDetails({
            formId: row.formId,
          });

        if (response?.success) {
          setDetailsRow(row);
          setDetailsData(response.data);
          setView("details");
        }
      } finally {
        setDetailsLoading(false);
      }
    },
    [],
  );
  const handleBackFromDetails = useCallback(() => {
  setDetailsRow(null);
  setDetailsData(null);
  setView("list");
}, []);
  const handleFillForm = useCallback(
    async (batch: PostCureBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: PostCureBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleDiscardAndBack = useCallback(() => {
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleDraftOperationChange = useCallback((operation: string) => {
    setDraftOperation(operation);
    if (!isPostCureInhibitionOperation(operation)) {
      setDraftInhibitorType("");
    }
  }, []);

  const handleDraftInhibitorTypeChange = useCallback((inhibitorType: string) => {
    setDraftInhibitorType(inhibitorType);
  }, []);

  const handleMotorSessionChange = useCallback((motorId: string, next: PostCureMotorSession) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) => (motor.motorId === motorId ? next : motor)),
    }));
  }, []);

  const handleRemoveMotor = useCallback((motorId: string) => {
    setFormData((prev) => {
      const nextMotors = (prev.motors ?? []).filter((motor) => motor.motorId !== motorId);
      return {
        ...prev,
        motors: nextMotors,
        schemaFormLoaded: nextMotors.length > 0,
      };
    });
    setAddedMotors((prev) => prev.filter((motor) => motor.motorId !== motorId));
    clearSetupDrafts();
  }, [clearSetupDrafts]);

  const handleLoadForm = useCallback(async () => {
    const inhibitorType = resolveInhibitorType(draftOperation, draftInhibitorType);

    if (
      !canLoadPostCureForm({
        motorId: draftMotorId,
        motorReceiptDate: draftMotorReceiptDate,
        operation: draftOperation,
        inhibitorType,
        schemaFormLoaded: formData.schemaFormLoaded,
      })
    ) {
      return;
    }

    const schema = await fetchPostCureSchema({ operation: draftOperation, inhibitorType });
    if (!schema) return;

    const motorSession = createEmptyPostCureMotorSession(
      draftMotorId.trim(),
      draftMotorReceiptDate.trim(),
      draftOperation,
      inhibitorType,
      schema,
    );

    setFormData({
      schemaFormLoaded: true,
      motors: [motorSession],
    });
    setAddedMotors([{ motorId: motorSession.motorId, motorReceiptDate: motorSession.motorReceiptDate }]);
    clearSetupDrafts();
    setSchemaError(null);
  }, [
    draftMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    formData.schemaFormLoaded,
    fetchPostCureSchema,
    clearSetupDrafts,
  ]);

  const handleAddMotor = useCallback(async () => {
    const availableMotorOptions = resolvePostCureMotorOptions(activeBatch);
    const usedMotorIds = addedMotors.map((motor) => motor.motorId);
    const inhibitorType = resolveInhibitorType(draftOperation, draftInhibitorType);

    if (
      !canAddPostCureMotor({
        motorId: draftMotorId,
        motorReceiptDate: draftMotorReceiptDate,
        operation: draftOperation,
        inhibitorType,
        usedMotorIds,
        availableMotorOptions,
      })
    ) {
      return;
    }

    const schema = await fetchPostCureSchema({ operation: draftOperation, inhibitorType });
    if (!schema) return;

    const motorSession = createEmptyPostCureMotorSession(
      draftMotorId.trim(),
      draftMotorReceiptDate.trim(),
      draftOperation,
      inhibitorType,
      schema,
    );

    setFormData((prev) => ({
      schemaFormLoaded: true,
      motors: [...(prev.motors ?? []), motorSession],
    }));
    setAddedMotors((prev) => [
      ...prev,
      { motorId: motorSession.motorId, motorReceiptDate: motorSession.motorReceiptDate },
    ]);
    clearSetupDrafts();
    setSchemaError(null);
  }, [
    activeBatch,
    addedMotors,
    draftMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    fetchPostCureSchema,
    clearSetupDrafts,
  ]);

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      const motorsReady =
        formData.schemaFormLoaded &&
        formData.motors.length > 0 &&
        formData.motors.every((motor) => Boolean(motor.postCureSchema));

      if (!motorsReady) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.SCHEMA_NOT_LOADED, "warning");
        return false;
      }

      if (!hasAnyPostCureValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.POST_CURE.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.pcStatus);
      const isCreateFlow = status === parseStatus(PC_STATUS.INITIATED) && !activeBatch.formId;
      const payloadBody = mapPostCureFormStateToPayload(formData);
      const firstMotor = formData.motors[0];

      const operationType = mapPostCureOperationToApi(
        firstMotor.operation
      );

      const inhibitorType =
        isPostCureInhibitionOperation(firstMotor.operation)
          ? mapPostCureInhibitorTypeToApi(firstMotor.inhibitorType)
          : undefined;

          
      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await postCureController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            operationType,
            ...(inhibitorType ? { inhibitorType } : {}),

            ...payloadBody,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.POST_CURE.FORM_ID_MISSING, "error");
            return false;
          }
          response = await postCureController.updateForm({
          formId: activeBatch.formId,
          batchId: activeBatch.batchId,

          subDepartmentId,

          formSubmissionType:
            intent === "draft" ? "DRAFT" : "SUBMIT",

          operationType,

          ...(inhibitorType ? { inhibitorType } : {}),

          ...payloadBody,
        });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.POST_CURE.CREATE_FAILED
            : STRINGS.MANUFACTURING.POST_CURE.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.POST_CURE.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.POST_CURE.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.POST_CURE.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.POST_CURE.UPDATE_SUBMIT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          await listParams.refreshUserBatches();
          resetFormContext();
        }

        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [activeBatch, subDepartmentId, formData, formSnapshot, showAlert, listParams, resetFormContext],
  );

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

  const usedMotorIds = useMemo(() => addedMotors.map((motor) => motor.motorId), [addedMotors]);
  const draftInhibitor = resolveInhibitorType(draftOperation, draftInhibitorType);

  const canLoadForm = useMemo(
    () =>
      canLoadPostCureForm({
        motorId: draftMotorId,
        motorReceiptDate: draftMotorReceiptDate,
        operation: draftOperation,
        inhibitorType: draftInhibitor,
        schemaFormLoaded: formData.schemaFormLoaded,
      }),
    [draftMotorId, draftMotorReceiptDate, draftOperation, draftInhibitor, formData.schemaFormLoaded],
  );

  const canAddMotor = useMemo(
    () =>
      canAddPostCureMotor({
        motorId: draftMotorId,
        motorReceiptDate: draftMotorReceiptDate,
        operation: draftOperation,
        inhibitorType: draftInhibitor,
        usedMotorIds,
        availableMotorOptions: resolvePostCureMotorOptions(activeBatch),
      }),
    [draftMotorId, draftMotorReceiptDate, draftOperation, draftInhibitor, usedMotorIds, activeBatch],
  );

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    addedMotors,
    draftMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    isFormDirty,
    actionLoading,
    schemaLoading,
    schemaError,
    canLoadForm,
    canAddMotor,
    usedMotorIds,
    subDepartmentId,
    backConfirmOpen,
    setBackConfirmOpen,
    setDraftMotorId,
    setDraftMotorReceiptDate,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleDraftOperationChange,
    handleDraftInhibitorTypeChange,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleLoadForm,
    handleAddMotor,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewPostCureDetails,
    handleBackFromDetails,
  };
};

export default usePostCureHook;
