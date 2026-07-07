import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { operationsController } from "../../../controllers/user/operationsController";
import trimmingController from "../../../controllers/user/manufacturing/trimmingController";
import {
  createDefaultTrimmingFormState,
  createEmptyTrimmingMotorSession,
  hasAnyTrimmingValue,
  hydrateTrimmingFormState,
    hydrateTrimmingMotorSession,
  mapTrimmingDetailsToFormState,
  mapTrimmingFormStateToPayload,
  type TrimmingFormState,
  type TrimmingMotorSession,
} from "../../../data/models/user/TrimmingFormModel";
import { fetchTrimmingSchema, mapTrimmingMotorStage, resolveTrimmingMotorStageNumber } from "../../../schema-engine";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import {
  getSelectedTrimmingDraftMotorIds,
  mapApprovedMotorsToOptions,
  mergeTrimmingMotorOptions,
  resolveEffectiveTrimmingMotorCount,
  resolveTrimmingMotorCountLimit,
  resolveTrimmingMotorOptions,
  resolveTrimmingSchemaMotorStage,
  type TrimmingAddedMotor,
  type TrimmingMotorStageOption,
} from "./trimmingFlowConfig";
import { useCuringMotorStages } from "./useCuringMotorStages";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import type { SchemaDocumentV2, SchemaFormValues } from "../../../schema-engine";

type WorkflowView = "list" | "form" | "details";

type TrimmingBatch = {
  batchId: string;
  projectId?: string;
  projectName?: string;
  trStatus?: string;
  formId?: string | null;
  motorStage?: unknown;
  motorType?: unknown;
  motorId?: string;
  motorIds?: string[];
  [key: string]: any;
};

const TR_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const resolveTrimmingFormId = (batch?: TrimmingBatch | null) =>
  String(batch?.formId ?? "").trim() || null;

const resolveBatchProjectId = (batch?: TrimmingBatch | null) =>
  String(batch?.projectId ?? batch?.projectName ?? "").trim();

const resolveInitialMotorStage = (batch?: TrimmingBatch | null) => {
  const stage = batch?.motorStage ?? batch?.motorType;
  if (stage == null || stage === "") return "";
  return String(stage).trim();
};

const buildAddedMotorsFromForm = (formData: TrimmingFormState): TrimmingAddedMotor[] =>
  (formData.motors ?? [])
    .filter((motor) => motor.motorId.trim().length > 0)
    .map((motor) => ({
      motorId: motor.motorId,
      motorStage: String(motor.motorStage),
      motorReceivedAt: motor.motorReceivedAt,
    }));

export const useTrimmingHook = () => {
  const listParams = useSubdepartmentBatches("trimming");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "trimming")?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<TrimmingBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<TrimmingFormState>(createDefaultTrimmingFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");
 const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedMotorStage, setSelectedMotorStage] = useState("");
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [motorReceivedAt, setMotorReceivedAt] = useState("");
  const [addedMotors, setAddedMotors] = useState<TrimmingAddedMotor[]>([]);
  const [approvedMotorOptions, setApprovedMotorOptions] = useState<
    ReturnType<typeof mapApprovedMotorsToOptions>
  >([]);
  const [approvedMotorsLoading, setApprovedMotorsLoading] = useState(false);

  const projectId = useMemo(() => resolveBatchProjectId(activeBatch), [activeBatch]);
  const { stages: motorStages, loading: motorStagesLoading } = useCuringMotorStages(projectId);

  const motorStageOptions = useMemo<TrimmingMotorStageOption[]>(
    () =>
      motorStages.map((stage) => ({
        value: String(stage.motorStage),
        label: `Stage ${stage.motorStage}`,
        noOfmotors: stage.noOfmotors,
      })),
    [motorStages],
  );

  const selectedStageOption = useMemo(
    () => motorStageOptions.find((stage) => stage.value === selectedMotorStage) ?? null,
    [motorStageOptions, selectedMotorStage],
  );

  const batchMotorOptions = useMemo(
    () => resolveTrimmingMotorOptions(activeBatch),
    [activeBatch],
  );

  const availableMotorOptions = useMemo(
    () => mergeTrimmingMotorOptions(approvedMotorOptions, batchMotorOptions),
    [approvedMotorOptions, batchMotorOptions],
  );

  const maxMotorCount = useMemo(
    () =>
      resolveTrimmingMotorCountLimit({
        selectedStage: selectedStageOption,
        availableMotorOptions,
        batchNumberOfMotors: Number(activeBatch?.numberOfMotors ?? 0),
      }),
    [activeBatch?.numberOfMotors, availableMotorOptions, selectedStageOption],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        addedMotors,
        selectedMotorStage,
      }),
    [formData, addedMotors, selectedMotorStage],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const clearFlowBarDrafts = useCallback(() => {
    setSelectedMotorStage("");
    setMotorCount("");
    setDraftMotorIds([]);
    setMotorReceivedAt("");
  }, []);

  const resetFlowDraft = useCallback(() => {
    clearFlowBarDrafts();
    setAddedMotors([]);
    setApprovedMotorOptions([]);
    setSchemaError(null);
  }, [clearFlowBarDrafts]);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultTrimmingFormState();
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
        selectedMotorStage: "",
      }),
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  useEffect(() => {
    const stage = String(selectedMotorStage ?? "").trim();
    const pid = resolveBatchProjectId(activeBatch);
    if (!stage || !pid) {
      setApprovedMotorOptions([]);
      return;
    }

    let active = true;
    setApprovedMotorsLoading(true);
    void operationsController
      .fetchApprovedMotorsList({ projectId: pid, motorStage: stage })
      .then((response) => {
        if (!active) return;
        if (response?.success && response.data) {
          setApprovedMotorOptions(mapApprovedMotorsToOptions(response.data.motors ?? []));
        } else {
          setApprovedMotorOptions([]);
        }
      })
      .finally(() => {
        if (active) setApprovedMotorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeBatch, selectedMotorStage]);

  const fetchTrimmingSchemaDocument = useCallback(
    async (motorStage: string | number, options?: { silent?: boolean }) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.TRIMMING.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const silent = options?.silent ?? false;
      if (!silent) {
        setSchemaLoading(true);
        setSchemaError(null);
      }
      try {
        const response = await fetchTrimmingSchema({
          subDepartmentId,
          motorStage: resolveTrimmingSchemaMotorStage(motorStage),
        });
        if (!response?.success || !response?.data) {
          const message = getErrorMessage(
            response,
            STRINGS.MANUFACTURING.TRIMMING.SCHEMA_FETCH_ERROR,
          );
          setSchemaError(message);
          if (!silent) showAlert(message, "error");
          return null;
        }
        return response.data;
      } finally {
        if (!silent) setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const appendMotorsToForm = useCallback(
    async (entries: TrimmingAddedMotor[]) => {
      if (!activeBatch || entries.length === 0) return false;

      const stageNum = resolveTrimmingMotorStageNumber({ motorStage: selectedMotorStage });
      const schemasByStage = { ...(formData.schemasByStage ?? {}) };
      let schema = schemasByStage[stageNum] ?? null;

      if (!schema) {
        schema = await fetchTrimmingSchemaDocument(selectedMotorStage);
        if (!schema) return false;
        schemasByStage[stageNum] = schema;
      }

      const existingSessions = formData.motors ?? [];
      const nextSessions: TrimmingMotorSession[] = [
        ...existingSessions,
        ...entries
          .filter((entry) => !existingSessions.some((motor) => motor.motorId === entry.motorId))
          .map((entry) =>
            createEmptyTrimmingMotorSession(
              entry.motorId,
              entry.motorStage,
              entry.motorReceivedAt,
              schema,
            ),
          ),
      ];

      setAddedMotors((prev) => {
        const existingIds = new Set(prev.map((motor) => motor.motorId));
        return [...prev, ...entries.filter((entry) => !existingIds.has(entry.motorId))];
      });
      setFormData({
        ...formData,
        schemaFormLoaded: true,
        trimmingSchema: schema,
        schemasByStage,
        selectedMotorStage: String(stageNum),
        motors: nextSessions,
      });
      clearFlowBarDrafts();
      return true;
    },
    [activeBatch, clearFlowBarDrafts, fetchTrimmingSchemaDocument, formData, selectedMotorStage],
  );

  const handleLoadTrimmingForm = useCallback(async () => {
    if (!activeBatch) return;

    const count = resolveEffectiveTrimmingMotorCount(motorCount, draftMotorIds);
    if (count <= 0 || !selectedMotorStage.trim() || !motorReceivedAt.trim()) return;

    const selectedIds = getSelectedTrimmingDraftMotorIds(count, draftMotorIds);
    if (selectedIds.length !== count) return;

    const entries: TrimmingAddedMotor[] = selectedIds.map((motorId) => ({
      motorId,
      motorStage: selectedMotorStage,
      motorReceivedAt: motorReceivedAt.trim(),
    }));

    await appendMotorsToForm(entries);
  }, [
    activeBatch,
    appendMotorsToForm,
    draftMotorIds,
    motorCount,
    motorReceivedAt,
    selectedMotorStage,
  ]);

  const handleAddMotors = useCallback(async () => {
    if (!formData.schemaFormLoaded) {
      await handleLoadTrimmingForm();
      return;
    }

    const count = resolveEffectiveTrimmingMotorCount(motorCount, draftMotorIds);
    if (count <= 0 || !selectedMotorStage.trim() || !motorReceivedAt.trim()) return;

    const selectedIds = getSelectedTrimmingDraftMotorIds(count, draftMotorIds);
    if (selectedIds.length !== count) return;

    const existingIds = new Set(addedMotors.map((motor) => motor.motorId));
    const entries: TrimmingAddedMotor[] = selectedIds
      .filter((motorId) => !existingIds.has(motorId))
      .map((motorId) => ({
        motorId,
        motorStage: selectedMotorStage,
        motorReceivedAt: motorReceivedAt.trim(),
      }));

    if (entries.length === 0) return;
    await appendMotorsToForm(entries);
  }, [
    addedMotors,
    appendMotorsToForm,
    draftMotorIds,
    formData.schemaFormLoaded,
    handleLoadTrimmingForm,
    motorCount,
    motorReceivedAt,
    selectedMotorStage,
  ]);

  const openFormWithResolvedData = useCallback(
    async (batch: TrimmingBatch, editMode: boolean) => {
      const status = parseStatus(batch.trStatus);
      const shouldFetchDetails =
        editMode ||
        status === parseStatus(TR_STATUS.IN_PROGRESS) ||
        status === parseStatus(TR_STATUS.REJECTED);

      let nextBatch = batch;
      let nextFormData = createDefaultTrimmingFormState();
      const initialStage = resolveInitialMotorStage(batch);

      setLoadingFormDetails(true);
      try {
        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!batch.formId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await trimmingController.fetchFormDetails({
            formId: batch.formId,
            // subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.TRIMMING.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.TRIMMING.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = mapTrimmingDetailsToFormState(detailsResponse.data);

          const motors = nextFormData.motors ?? [];
          const hasSavedData =
            nextFormData.schemaFormLoaded || motors.some((motor) => motor.savedSections?.length);

          if (hasSavedData && motors.length > 0) {
            const schemasByStage: Record<number, SchemaDocumentV2> = {
              ...(nextFormData.schemasByStage ?? {}),
            };
            const uniqueStages = [...new Set(motors.map((motor) => motor.motorStage))];
            const stagesToFetch = uniqueStages.filter((stage) => !schemasByStage[stage]);

            const fetchedSchemas = await Promise.all(
              stagesToFetch.map(async (stage) => ({
                stage,
                schema: await fetchTrimmingSchemaDocument(String(stage), { silent: true }),
              })),
            );

            if (fetchedSchemas.some(({ schema }) => !schema)) return;

            fetchedSchemas.forEach(({ stage, schema }) => {
              if (schema) schemasByStage[stage] = schema;
            });

            const hydratedMotors = motors.map((motor) =>
              hydrateTrimmingMotorSession(motor, schemasByStage[motor.motorStage] ?? null),
            );
            const firstStage = uniqueStages[0];

            nextFormData = {
              ...nextFormData,
              schemaFormLoaded: true,
              schemasByStage,
              trimmingSchema: firstStage != null ? schemasByStage[firstStage] ?? null : null,
              motors: hydratedMotors,
            };
          } else if (hasSavedData) {
            const stageForSchema =
              nextFormData.selectedMotorStage ??
              initialStage ??
              String(resolveTrimmingMotorStageNumber({ motorStage: batch }));
            const schema = await fetchTrimmingSchemaDocument(stageForSchema);
            if (!schema) return;
            nextFormData = hydrateTrimmingFormState(nextFormData, schema, stageForSchema);
          }
        }
      } finally {
        setLoadingFormDetails(false);
      }

      const nextAddedMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setAddedMotors(nextAddedMotors);
      clearFlowBarDrafts();
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: nextAddedMotors,
          selectedMotorStage: "",
        }),
      );
      setView("form");
    },
    [clearFlowBarDrafts, fetchTrimmingSchemaDocument, showAlert, subDepartmentId],
  );
  const handleViewTrimmingDetails = useCallback(
    async (row: any) => {
      if (!row?.formId) return;

      setDetailsLoading(true);

      try {
        const response =
          await trimmingController.fetchFormDetails({
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
    async (batch: TrimmingBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: TrimmingBatch) => await openFormWithResolvedData(batch, true),
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

  const handleMotorStageChange = useCallback(
    (value: string) => {
      setSelectedMotorStage(value);
      setMotorCount("");
      setDraftMotorIds([]);
      setMotorReceivedAt("");
    },
    [],
  );

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
    if (view !== "form") return;
    if (String(selectedMotorStage ?? "").trim()) return;

    const count = motorCount === "" ? 0 : Number(motorCount);
    if (count !== 1 || availableMotorOptions.length !== 1) return;

    const onlyMotorId = availableMotorOptions[0]?.value ?? "";
    if (!onlyMotorId) return;

    setDraftMotorIds((prev) => (prev[0] === onlyMotorId ? prev : [onlyMotorId]));
  }, [view, motorCount, availableMotorOptions, selectedMotorStage]);

  const handleMotorSessionChange = useCallback((motorId: string, next: TrimmingMotorSession) => {
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) => (motor.motorId === motorId ? next : motor)),
    }));
  }, []);

  const handleFormValuesChange = useCallback(
    (motorId: string, values: SchemaFormValues) => {
      setFormData((prev) => ({
        ...prev,
        motors: (prev.motors ?? []).map((motor) =>
          motor.motorId === motorId ? { ...motor, formValues: values } : motor,
        ),
        schemaFormValues: values,
      }));
    },
    [],
  );

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!formData.schemaFormLoaded || !formData.trimmingSchema) {
        showAlert(STRINGS.MANUFACTURING.TRIMMING.SCHEMA_NOT_LOADED, "warning");
        return false;
      }

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.TRIMMING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnyTrimmingValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.TRIMMING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const isCreateFlow = !resolveTrimmingFormId(activeBatch);
      const payloadBody = mapTrimmingFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await trimmingController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        } else {
          const formId = resolveTrimmingFormId(activeBatch);
          if (!formId) {
            showAlert(STRINGS.MANUFACTURING.TRIMMING.FORM_ID_MISSING, "error");
            return false;
          }
          response = await trimmingController.updateForm({
            formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.TRIMMING.CREATE_FAILED
            : STRINGS.MANUFACTURING.TRIMMING.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.TRIMMING.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.TRIMMING.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.TRIMMING.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.TRIMMING.UPDATE_SUBMIT_SUCCESS,
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

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    subDepartmentId,
    selectedMotorStage,
    motorStageOptions,
    motorStagesLoading,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    addedMotors,
    availableMotorOptions,
    approvedMotorsLoading,
    maxMotorCount,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleMotorStageChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleMotorReceivedAtChange: setMotorReceivedAt,
    handleLoadTrimmingForm,
    handleAddMotors,
    handleMotorSessionChange,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewTrimmingDetails,
    handleBackFromDetails,
  };
};

export default useTrimmingHook;
