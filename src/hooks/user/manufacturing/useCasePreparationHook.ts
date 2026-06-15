import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import casePreparationController from "../../../controllers/user/manufacturing/casePreparationController";
import {
  createDefaultCasePreparationFormState,
  createEmptyMotorSession,
  hasAnyCasePreparationValue,
  hydrateCasePreparationFormState,
  mapCasePreparationDetailsToFormState,
  mapCasePreparationFormStateToPayload,
  type CasePrepMotorSession,
  type CasePreparationFormState,
} from "../../../data/models/user/CasePreparationFormModel";
import {
  buildCasePreparationSchemaRequest,
  casePreparationSchemaFetchConfig,
  createCasePrepInitialValues,
  type SchemaDocument,
  type SchemaFormValues,
} from "../../../schemaManagement";
import schemaManagementController from "../../../schemaManagement/controllers/schemaManagementController";
import {
  getSelectedCasePrepDraftMotorIds,
  isMainMotorBatch,
  isSubscaleBatch,
  resolveCasePrepMotorOptions,
  type CasePrepAddedMotor,
} from "./casePreparationFlowConfig";
import { OPERATION_STATUS } from "../../operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form" | "details";

type CasePrepBatch = {
  batchId: string;
  cpStatus?: string;
  formId?: string | null;
  batchType?: string;
  motorId?: string;
  [key: string]: any;
};

const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const resolveFormId = (batch: CasePrepBatch | null | undefined) => {
  const formId = String(batch?.formId ?? "").trim();
  return formId || null;
};

const buildAddedMotorsFromForm = (formData: CasePreparationFormState): CasePrepAddedMotor[] =>
  (formData.motors ?? []).map((motor) => ({
    motorId: motor.motorId,
    prrcClearanceDate: motor.prrcClearanceDate,
  }));

export const useCasePreparationHook = () => {
  const listParams = useSubdepartmentBatches("case-preparation");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "case-preparation")
        ?.subDepartmentId,
    [user]
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CasePrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<CasePreparationFormState>(
    createDefaultCasePreparationFormState()
  );
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [prrcClearanceDate, setPrrcClearanceDate] = useState("");
  const [addedMotors, setAddedMotors] = useState<CasePrepAddedMotor[]>([]);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        addedMotors,
      }),
    [formData, addedMotors]
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFlowDraft = useCallback(() => {
    setMotorCount("");
    setDraftMotorIds([]);
    setPrrcClearanceDate("");
    setAddedMotors([]);
    setSchemaError(null);
  }, []);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCasePreparationFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        addedMotors: [],
      })
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchCasePrepSchema = useCallback(
    async (batchType: string | undefined): Promise<SchemaDocument | null> => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      setSchemaLoading(true);
      setSchemaError(null);

      const response = await schemaManagementController.fetchSchema(
        casePreparationSchemaFetchConfig,
        buildCasePreparationSchemaRequest({
          subDepartmentId,
          batchType: batchType ?? "",
        })
      );

      setSchemaLoading(false);

      if (!response?.success || !response.data) {
        const message = getErrorMessage(response, STRINGS.MANUFACTURING.CASE_PREP.SCHEMA_LOAD_ERROR);
        setSchemaError(message);
        showAlert(message, "error");
        return null;
      }

      return response.data;
    },
    [showAlert, subDepartmentId]
  );

  const openFormWithResolvedData = useCallback(
    async (batch: CasePrepBatch, editMode: boolean) => {
      const status = parseStatus(batch.cpStatus);
      const shouldFetchDetails =
        editMode || status === parseStatus(OPERATION_STATUS.IN_PROGRESS);

      let nextBatch = batch;
      let nextFormData = createDefaultCasePreparationFormState();

      if (shouldFetchDetails) {
        const formId = resolveFormId(batch);
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!formId) {
          showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        try {
          const detailsResponse = await casePreparationController.fetchFormDetails({
            formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.CASE_PREP.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = {
            ...batch,
            formId: detailsResponse.data.formId || formId,
            batchType: batch.batchType ?? detailsResponse.data.batchType ?? batch.batchType,
          };
          nextFormData = mapCasePreparationDetailsToFormState(detailsResponse.data);

          const schema = await fetchCasePrepSchema(nextBatch.batchType);
          if (schema) {
            nextFormData = hydrateCasePreparationFormState(nextFormData, schema);
          }
        } finally {
          setLoadingFormDetails(false);
        }
      }

      const nextAddedMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setAddedMotors(nextAddedMotors);
      setMotorCount(nextAddedMotors.length > 0 ? nextAddedMotors.length : "");
      setDraftMotorIds([]);
      setPrrcClearanceDate("");
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: nextAddedMotors,
        })
      );
      setView("form");
    },
    [fetchCasePrepSchema, showAlert, subDepartmentId]
  );

  const handleViewCasePrepDetails = useCallback(
    async (row: CasePrepBatch) => {
      if (!row.formId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
        return;
      }
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await casePreparationController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR,
          "error"
        );
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [showAlert, subDepartmentId]
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
  }, []);

  const handleFillForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData]
  );

  const handleEditForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData]
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

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    if (count === "") {
      setDraftMotorIds([]);
      return;
    }
    setDraftMotorIds((prev) => Array.from({ length: Number(count) }, (_, idx) => prev[idx] ?? ""));
  }, []);

  const handleDraftMotorIdChange = useCallback((index: number, motorId: string) => {
    setDraftMotorIds((prev) => {
      const next = [...prev];
      next[index] = motorId;
      return next;
    });
  }, []);

  useEffect(() => {
    if (view !== "form" || !activeBatch) return;

    const motorOptions = resolveCasePrepMotorOptions(activeBatch);
    const count = motorCount === "" ? 0 : Number(motorCount);
    if (count !== 1 || motorOptions.length !== 1) return;

    const onlyMotorId = motorOptions[0]?.value ?? "";
    if (!onlyMotorId) return;

    setDraftMotorIds((prev) => (prev[0] === onlyMotorId ? prev : [onlyMotorId]));
  }, [view, activeBatch, motorCount]);

  const handleAddMotors = useCallback(async () => {
    if (!activeBatch) return;

    const schema =
      formData.schema ?? (await fetchCasePrepSchema(activeBatch.batchType));
    if (!schema) return;

    if (isSubscaleBatch(activeBatch.batchType)) {
      const motorOptions = resolveCasePrepMotorOptions(activeBatch);

      if (motorOptions.length > 0) {
        const count = motorCount === "" ? 0 : Number(motorCount);
        if (count <= 0) return;

        const selectedIds = getSelectedCasePrepDraftMotorIds(count, draftMotorIds);
        if (selectedIds.length !== count || !prrcClearanceDate.trim()) return;
      }

      const nextFormData = hydrateCasePreparationFormState(
        {
          ...formData,
          schema,
          motors: [],
          subscaleFormValues: createCasePrepInitialValues(schema),
        },
        schema,
      );
      setFormData(nextFormData);
      setDraftMotorIds([]);
      setMotorCount("");
      setPrrcClearanceDate("");
      return;
    }

    if (!isMainMotorBatch(activeBatch.batchType)) return;

    const count = motorCount === "" ? 0 : Number(motorCount);
    if (count <= 0) return;

    const selectedIds = Array.from({ length: count }, (_, idx) => draftMotorIds[idx]?.trim()).filter(
      Boolean
    ) as string[];
    if (selectedIds.length !== count || !prrcClearanceDate.trim()) return;

    const existingIds = new Set(addedMotors.map((m) => m.motorId));
    const newEntries: CasePrepAddedMotor[] = selectedIds
      .filter((id) => !existingIds.has(id))
      .map((motorId) => ({
        motorId,
        prrcClearanceDate: prrcClearanceDate.trim(),
      }));

    if (newEntries.length === 0) return;

    const nextAdded = [...addedMotors, ...newEntries];
    const existingSessions = formData.motors ?? [];
    const nextSessions: CasePrepMotorSession[] = [
      ...existingSessions,
      ...newEntries.map((entry) => {
        const existing = existingSessions.find((m) => m.motorId === entry.motorId);
        return existing ?? createEmptyMotorSession(entry.motorId, entry.prrcClearanceDate, schema);
      }),
    ];

    const nextFormData = hydrateCasePreparationFormState(
      {
        ...formData,
        schema,
        motors: nextSessions,
      },
      schema
    );

    setAddedMotors(nextAdded);
    setFormData(nextFormData);
    setDraftMotorIds([]);
    setMotorCount("");
    setPrrcClearanceDate("");
  }, [
    activeBatch,
    addedMotors,
    draftMotorIds,
    fetchCasePrepSchema,
    formData,
    motorCount,
    prrcClearanceDate,
  ]);

  const handleRemoveMotor = useCallback(
    (motorId: string) => {
      const nextAdded = addedMotors.filter((m) => m.motorId !== motorId);
      const nextSessions = (formData.motors ?? []).filter((m) => m.motorId !== motorId);
      setAddedMotors(nextAdded);
      setFormData({ ...formData, motors: nextSessions });
    },
    [addedMotors, formData]
  );

  const handleMotorSessionChange = useCallback(
    (motorId: string, nextMotor: CasePrepMotorSession) => {
      const nextSessions = (formData.motors ?? []).map((motor) =>
        motor.motorId === motorId ? nextMotor : motor
      );
      setFormData({ ...formData, motors: nextSessions });
    },
    [formData]
  );

  const handleSubscaleValuesChange = useCallback(
    (values: SchemaFormValues) => {
      setFormData({ ...formData, subscaleFormValues: values });
    },
    [formData]
  );

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!formData.schema) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SCHEMA_LOAD_ERROR, "warning");
        return false;
      }

      if (!hasAnyCasePreparationValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const isCreateFlow = !resolveFormId(activeBatch);
      const payloadBody = mapCasePreparationFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASE_PREP.BATCH_ID_MISSING, "error");
            return false;
          }

          response = await casePreparationController.createForm({
            batchId: activeBatch.batchId,
            batchType: activeBatch.batchType ?? "",
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            casePreparationDetails: payloadBody,
          });
        } else {
          const formId = resolveFormId(activeBatch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.CASE_PREP.FORM_ID_MISSING, "error");
            return false;
          }

          response = await casePreparationController.updateForm({
            batchId: activeBatch.batchId,
            formId: activeBatch.formId,
            batchType: activeBatch.batchType ?? "",
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            casePreparationDetails: payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.CASE_PREP.CREATE_FAILED
            : STRINGS.MANUFACTURING.CASE_PREP.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASE_PREP.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.CASE_PREP.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASE_PREP.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.CASE_PREP.UPDATE_SUBMIT_SUCCESS,
            "success",
            { autoCloseMs: 2200 }
          );

          await listParams.refreshUserBatches();
          resetFormContext();
        }

        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      subDepartmentId,
      formData,
      formSnapshot,
      showAlert,
      listParams,
      resetFormContext,
    ]
  );

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    addedMotors,
    motorCount,
    draftMotorIds,
    prrcClearanceDate,
    schemaLoading,
    schemaError,
    subDepartmentId,
    isFormDirty,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewCasePrepDetails,
    handleBackFromDetails,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    setPrrcClearanceDate,
    handleAddMotors,
    handleRemoveMotor,
    handleMotorSessionChange,
    handleSubscaleValuesChange,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useCasePreparationHook;
