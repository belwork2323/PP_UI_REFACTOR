import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import casePreparationController from "../../../controllers/user/manufacturing/casePreparationController";
import {
  createDefaultCasePreparationFormState,
  createEmptyMotorSession,
  hasMotorCasePreparationValue,
  hydrateCasePreparationFormState,
  isMotorEditable,
  mapCasePreparationDetailsFromSavedForm,
  mapCasePreparationDetailsToFormState,
  mapCasePreparationFormStateToPayload,
  mapCasePreparationMotorStatusesFromApi,
  type CasePrepMotorSession,
  type CasePreparationFormState,
  type MotorStatusMeta,
  type MotorSubmissionStatus,
} from "../../../data/models/user/CasePreparationFormModel";
import {
  buildCasePreparationSchemaRequest,
  casePreparationSchemaFetchConfig,
  createCasePrepInitialValues,
  mapCasePrepBatchTypeToSchema,
  schemaEngineController,
  type SchemaDocumentV2,
  type SchemaFormValues,
} from "../../../schema-engine";
import {
  isMainMotorBatch,
  isSubscaleBatch,
  resolveCasePrepBatchMotorCount,
  resolveCasePrepMotorsFromBatch,
  type CasePrepAddedMotor,
} from "./casePreparationFlowConfig";
import { isManufacturingContinueFillingStatus } from "../../operationStatus";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form" | "details";

type CasePrepBatch = {
  batchId: string;
  cpStatus?: string;
  formId?: string | null;
  batchType?: string;
  motorId?: string;
  motorIds?: Array<string | number>;
  numberOfMotors?: number | string;
  identificationSheet?: { prcApprovalDate?: string } | null;
  prrcClearanceDate?: string;
  [key: string]: any;
};

const resolveFormId = (batch: CasePrepBatch | null | undefined) => {
  const formId = String(batch?.formId ?? "").trim();
  return formId || null;
};

const buildAddedMotorsFromForm = (formData: CasePreparationFormState): CasePrepAddedMotor[] =>
  (formData.motors ?? []).map((motor) => ({
    motorId: motor.motorId,
    prrcClearanceDate: motor.prrcClearanceDate,
  }));

/**
 * Always show every batch motor as a tab. Overlay saved form data when present
 * so a partial draft (1 of N motors submitted) still lists the remaining motors.
 */
const mergeMotorsFromBatchAndForm = (
  batch: CasePrepBatch,
  formData: CasePreparationFormState,
): { formData: CasePreparationFormState; addedMotors: CasePrepAddedMotor[] } => {
  const fromBatch = resolveCasePrepMotorsFromBatch(batch);
  if (!fromBatch.length) {
    return {
      formData,
      addedMotors: buildAddedMotorsFromForm(formData),
    };
  }

  const fromFormById = new Map((formData.motors ?? []).map((motor) => [motor.motorId, motor]));
  const batchIds = new Set(fromBatch.map((entry) => entry.motorId));

  const motors: CasePrepMotorSession[] = fromBatch.map((entry) => {
    const existing = fromFormById.get(entry.motorId);
    if (existing) {
      return {
        ...existing,
        prrcClearanceDate: existing.prrcClearanceDate || entry.prrcClearanceDate,
      };
    }
    return createEmptyMotorSession(entry.motorId, entry.prrcClearanceDate);
  });

  (formData.motors ?? []).forEach((motor) => {
    if (!batchIds.has(motor.motorId)) {
      motors.push(motor);
    }
  });

  return {
    formData: { ...formData, motors },
    addedMotors: motors.map((motor) => ({
      motorId: motor.motorId,
      prrcClearanceDate: motor.prrcClearanceDate,
    })),
  };
};

const buildCasePrepSetupContext = (
  batch: CasePrepBatch | null | undefined,
  fallbackCount = 1,
) => ({
  numberOfMotors: resolveCasePrepBatchMotorCount(batch, fallbackCount),
});

const enrichBatchFromDetails = (
  batch: CasePrepBatch,
  batchDetails: Awaited<ReturnType<typeof batchManagementController.getBatchById>>,
): CasePrepBatch | null => {
  if (!batchDetails) return null;

  return {
    ...batch,
    batchType: batch.batchType ?? batchDetails.batchType ?? batch.batchType,
    motorIds: batchDetails.motorIds?.length ? batchDetails.motorIds : batch.motorIds,
    numberOfMotors: batchDetails.numberOfMotors ?? batch.numberOfMotors,
    motorId:
      batchDetails.motorIds?.length > 0
        ? batchDetails.motorIds.join(", ")
        : batch.motorId,
    identificationSheet: batchDetails.identificationSheet,
    stageProgress:
      (batchDetails as { stageProgress?: unknown }).stageProgress ?? batch.stageProgress,
    currentStage:
      (batchDetails as { currentStage?: unknown }).currentStage ?? batch.currentStage,
  };
};

/** Create motor shells only — no schema walks. First motor is hydrated below. */
const initializeCasePrepFormFromBatch = (
  batch: CasePrepBatch,
  schema: SchemaDocumentV2,
  baseFormData: CasePreparationFormState = createDefaultCasePreparationFormState(),
): { formData: CasePreparationFormState; addedMotors: CasePrepAddedMotor[] } => {
  const motorsFromBatch = resolveCasePrepMotorsFromBatch(batch);
  const setupContext = buildCasePrepSetupContext(
    batch,
    Math.max(motorsFromBatch.length, 1),
  );

  if (isSubscaleBatch(batch.batchType)) {
    return {
      formData: hydrateCasePreparationFormState(
        {
          ...baseFormData,
          schema,
          motors: [],
          subscaleFormValues: createCasePrepInitialValues(schema, setupContext),
        },
        schema,
        setupContext,
      ),
      addedMotors: [],
    };
  }

  const sessions: CasePrepMotorSession[] = motorsFromBatch.map((entry) =>
    createEmptyMotorSession(entry.motorId, entry.prrcClearanceDate),
  );

  const firstMotorId = sessions[0]?.motorId;
  return {
    formData: hydrateCasePreparationFormState(
      {
        ...baseFormData,
        schema,
        motors: sessions,
      },
      schema,
      setupContext,
      firstMotorId ? { hydrateMotorIds: [firstMotorId] } : undefined,
    ),
    addedMotors: motorsFromBatch,
  };
};

export const useCasePreparationHook = () => {
  const listParams = useSubdepartmentBatches("case-preparation");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "case-preparation")
        ?.subDepartmentId,
    [user],
  );

  const schemaCacheRef = useRef<Map<string, SchemaDocumentV2>>(new Map());

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CasePrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsSchema, setDetailsSchema] = useState<SchemaDocumentV2 | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formData, setFormData] = useState<CasePreparationFormState>(
    createDefaultCasePreparationFormState(),
  );

  const [addedMotors, setAddedMotors] = useState<CasePrepAddedMotor[]>([]);
  const [motorStatusById, setMotorStatusById] = useState<Record<string, MotorStatusMeta>>({});

  const resetFlowDraft = useCallback(() => {
    setAddedMotors([]);
    setSchemaError(null);
    setMotorStatusById({});
  }, []);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCasePreparationFormState();
    setView("list");
    setActiveBatch(null);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsSchema(null);
    setDetailsLoading(false);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setIsFormDirty(false);
    setFormData(defaults);
    resetFlowDraft();
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchCasePrepSchema = useCallback(
    async (batchType: string | undefined): Promise<SchemaDocumentV2 | null> => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const cacheKey = `${subDepartmentId}:${mapCasePrepBatchTypeToSchema(batchType ?? "")}`;
      const cached = schemaCacheRef.current.get(cacheKey);
      if (cached) {
        setSchemaError(null);
        return cached;
      }

      setSchemaLoading(true);
      setSchemaError(null);

      const response = await schemaEngineController.fetchSchema(
        casePreparationSchemaFetchConfig,
        buildCasePreparationSchemaRequest({
          subDepartmentId,
          batchType: batchType ?? "",
        }),
      );

      setSchemaLoading(false);

      if (!response?.success || !response.data) {
        const message = getErrorMessage(response, STRINGS.MANUFACTURING.CASE_PREP.SCHEMA_LOAD_ERROR);
        setSchemaError(message);
        showAlert(message, "error");
        return null;
      }

      schemaCacheRef.current.set(cacheKey, response.data);
      return response.data;
    },
    [showAlert, subDepartmentId],
  );

  const openFormWithResolvedData = useCallback(
    async (batch: CasePrepBatch, editMode: boolean) => {
      if (!batch.batchId) {
        showAlert(STRINGS.MANUFACTURING.CASE_PREP.BATCH_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      try {
        const status = batch.cpStatus ?? batch.status;
        const shouldFetchDetails =
          editMode || isManufacturingContinueFillingStatus(String(status ?? ""));
        const knownBatchType = batch.batchType;

        // Parallelize: batch details + schema (when batchType known) start together.
        const batchDetailsPromise = batchManagementController.getBatchById(batch.batchId);
        const schemaPromise = knownBatchType
          ? fetchCasePrepSchema(knownBatchType)
          : Promise.resolve(null);

        const batchDetails = await batchDetailsPromise;
        const nextBatch = enrichBatchFromDetails(batch, batchDetails);
        if (!nextBatch) return;

        let nextFormData = createDefaultCasePreparationFormState();
        let nextAddedMotors: CasePrepAddedMotor[] = [];
        let nextMotorStatuses: Record<string, MotorStatusMeta> = {};

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

          const detailsPromise = casePreparationController.fetchFormDetails({
            formId,
            subDepartmentId,
          });
          const [detailsResponse, schemaFromKnown] = await Promise.all([
            detailsPromise,
            schemaPromise,
          ]);

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.CASE_PREP.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch.formId = detailsResponse.data.formId || formId;
          nextBatch.batchType =
            batch.batchType ?? detailsResponse.data.batchType ?? nextBatch.batchType;
          nextFormData = mapCasePreparationDetailsToFormState(detailsResponse.data);

          const schema =
            schemaFromKnown &&
            mapCasePrepBatchTypeToSchema(knownBatchType) ===
              mapCasePrepBatchTypeToSchema(nextBatch.batchType)
              ? schemaFromKnown
              : await fetchCasePrepSchema(nextBatch.batchType);

          const merged = mergeMotorsFromBatchAndForm(nextBatch, nextFormData);
          nextFormData = merged.formData;
          nextAddedMotors = merged.addedMotors;

          if (schema) {
            const firstMotorId = nextFormData.motors[0]?.motorId;
            nextFormData = hydrateCasePreparationFormState(
              nextFormData,
              schema,
              buildCasePrepSetupContext(nextBatch, nextFormData.motors.length),
              firstMotorId ? { hydrateMotorIds: [firstMotorId] } : undefined,
            );
          }

          if (isMainMotorBatch(nextBatch.batchType) && nextAddedMotors.length === 0) {
            if (!schema) return;
            const initialized = initializeCasePrepFormFromBatch(nextBatch, schema, nextFormData);
            nextFormData = initialized.formData;
            nextAddedMotors = initialized.addedMotors;
          }

          nextMotorStatuses = mapCasePreparationMotorStatusesFromApi(
            detailsResponse.data,
            nextAddedMotors.map((m) => m.motorId),
          );
        } else {
          const schemaFromKnown = await schemaPromise;
          const schema =
            schemaFromKnown ?? (await fetchCasePrepSchema(nextBatch.batchType));
          if (!schema) return;

          if (isMainMotorBatch(nextBatch.batchType)) {
            const motorsFromBatch = resolveCasePrepMotorsFromBatch(nextBatch);
            if (!motorsFromBatch.length) {
              showAlert(STRINGS.MANUFACTURING.CASE_PREP.BATCH_MOTOR_DETAILS_MISSING, "error");
              return;
            }
          }

          const initialized = initializeCasePrepFormFromBatch(nextBatch, schema);
          nextFormData = initialized.formData;
          nextAddedMotors = initialized.addedMotors;
          nextMotorStatuses = Object.fromEntries(
            nextAddedMotors.map((motor) => [
              motor.motorId,
              { motorSubmissionStatus: "TO_BE_INITIATED" as MotorSubmissionStatus },
            ]),
          );
        }

        setActiveBatch(nextBatch);
        setIsEditMode(editMode);
        setFormData(nextFormData);
        setAddedMotors(nextAddedMotors);
        setMotorStatusById(nextMotorStatuses);
        setIsFormDirty(false);
        setView("form");
      } finally {
        setLoadingFormDetails(false);
      }
    },
    [fetchCasePrepSchema, showAlert, subDepartmentId],
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
      const batchType = mapCasePrepBatchTypeToSchema(row.batchType ?? "MAIN_BATCH");
      const [response, schemaResponse] = await Promise.all([
        casePreparationController.fetchFormDetails({
          formId: row.formId,
          subDepartmentId,
        }),
        schemaEngineController.fetchSchema(
          casePreparationSchemaFetchConfig,
          buildCasePreparationSchemaRequest({
            subDepartmentId,
            batchType,
          }),
        ),
      ]);
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || STRINGS.MANUFACTURING.CASE_PREP.DETAILS_FETCH_ERROR,
          "error",
        );
        return;
      }

      setDetailsRow(row);
      setDetailsData(response.data);
      setDetailsSchema(schemaResponse?.success ? schemaResponse.data ?? null : null);
      setView("details");
    },
    [showAlert, subDepartmentId],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsSchema(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

  const handleFillForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: CasePrepBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh]);

  const handleDiscardAndBack = useCallback(() => {
    bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh]);

  const handleMotorSessionChange = useCallback(
    (motorId: string, nextMotor: CasePrepMotorSession, meta?: { hydrate?: boolean }) => {
      setFormData((prev) => {
        const motors = prev.motors ?? [];
        let changed = false;
        const nextMotors = motors.map((motor) => {
          if (motor.motorId !== motorId) return motor;
          if (motor === nextMotor) return motor;
          changed = true;
          return nextMotor;
        });
        return changed ? { ...prev, motors: nextMotors } : prev;
      });
      setAddedMotors((prev) => {
        let changed = false;
        const next = prev.map((motor) => {
          if (motor.motorId !== motorId) return motor;
          if (motor.prrcClearanceDate === nextMotor.prrcClearanceDate) return motor;
          changed = true;
          return { ...motor, prrcClearanceDate: nextMotor.prrcClearanceDate };
        });
        return changed ? next : prev;
      });
      if (!meta?.hydrate) {
        setIsFormDirty(true);
      }
    },
    [],
  );

  const handleSubscaleValuesChange = useCallback((values: SchemaFormValues) => {
    setFormData((prev) => ({ ...prev, subscaleFormValues: values }));
    setIsFormDirty(true);
  }, []);

  const getMotorStatus = useCallback(
    (motorId: string): MotorSubmissionStatus =>
      motorStatusById[motorId]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
    [motorStatusById],
  );

  const checkMotorEditable = useCallback(
    (motorId: string) => isMotorEditable(getMotorStatus(motorId)),
    [getMotorStatus],
  );

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      const S = STRINGS.MANUFACTURING.CASE_PREP;

      if (!subDepartmentId) {
        showAlert(S.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }
      if (!formData.schema) {
        showAlert(S.SCHEMA_LOAD_ERROR, "warning");
        return false;
      }
      if (!checkMotorEditable(motorId)) {
        showAlert(
          getMotorStatus(motorId) === "APPROVED" ? S.MOTOR_LOCKED_APPROVED : S.MOTOR_LOCKED_WAITING,
          "warning",
        );
        return false;
      }

      const motor = (formData.motors ?? []).find((entry) => entry.motorId === motorId);
      if (!motor) return false;

      if (intent === "submit") {
        if (!String(motor.prrcClearanceDate ?? "").trim()) {
          showAlert(S.MOTOR_PRRC_REQUIRED, "warning");
          return false;
        }
        if (!hasMotorCasePreparationValue(formData, motorId)) {
          showAlert(S.MOTOR_EMPTY_ERROR, "warning");
          return false;
        }
      }

      const isDraft = intent === "draft";
      const motorSubmissionType = isDraft ? "DRAFT" : "SUBMIT";
      const formSubmissionType = "DRAFT" as const;
      const isCreateFlow = !resolveFormId(activeBatch);
      const payloadBody = mapCasePreparationFormStateToPayload(formData, {
        targetMotorIds: [motorId],
        motorSubmissionType,
      });

      if (!payloadBody.motors.length) {
        showAlert(S.MOTOR_EMPTY_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        let response: any;
        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(S.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await casePreparationController.createForm({
            batchId: activeBatch.batchId,
            batchType: mapCasePrepBatchTypeToSchema(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType,
            casePreparationDetails: payloadBody,
          });
        } else {
          const formId = resolveFormId(activeBatch);
          if (!formId) {
            showAlert(S.FORM_ID_MISSING, "error");
            return false;
          }
          response = await casePreparationController.updateForm({
            batchId: activeBatch.batchId,
            formId,
            batchType: mapCasePrepBatchTypeToSchema(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType,
            casePreparationDetails: payloadBody,
          });
        }

        if (!response?.success) {
          showAlert(
            getErrorMessage(response, isCreateFlow ? S.CREATE_FAILED : S.UPDATE_FAILED),
            "error",
          );
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setIsFormDirty(false);
        setHasSavedDraft(true);

        const nextStatus: MotorSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMotorStatusById((prev) => {
          const updated: Record<string, MotorStatusMeta> = {
            ...prev,
            [motorId]: {
              ...prev[motorId],
              motorSubmissionType,
              motorSubmissionStatus: nextStatus,
            },
          };

          if (Array.isArray(response.data?.motorStatuses)) {
            response.data.motorStatuses.forEach((entry: any) => {
              const id = String(entry?.motorId ?? "").trim();
              if (!id) return;
              updated[id] = {
                ...updated[id],
                motorSubmissionType: entry.motorSubmissionType ?? updated[id]?.motorSubmissionType,
                motorSubmissionStatus:
                  (String(entry.motorSubmissionStatus ?? "").toUpperCase() as MotorSubmissionStatus) ||
                  updated[id]?.motorSubmissionStatus ||
                  "TO_BE_INITIATED",
              };
            });
          }
          return updated;
        });

        showAlert(
          intent === "draft" ? S.MOTOR_SAVE_DRAFT_SUCCESS(motorId) : S.MOTOR_SUBMIT_SUCCESS(motorId),
          "success",
          { autoCloseMs: 2200 },
        );
        return true;
      } finally {
        setActionLoading(false);
      }
    },
    [
      activeBatch,
      checkMotorEditable,
      formData,
      getMotorStatus,
      showAlert,
      subDepartmentId,
    ],
  );

  const handleSaveMotorDraft = useCallback(
    async (motorId: string) => submitMotor(motorId, "draft"),
    [submitMotor],
  );

  const handleSubmitMotor = useCallback(
    async (motorId: string) => submitMotor(motorId, "submit"),
    [submitMotor],
  );

  const handleSubmitForFinalApproval = useCallback(async () => {
    const S = STRINGS.MANUFACTURING.CASE_PREP;
    if (!activeBatch?.formId) {
      showAlert(S.FORM_ID_MISSING, "error");
      return false;
    }
    if (!subDepartmentId) {
      showAlert(S.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const motorIds = addedMotors.map((m) => m.motorId);
    const allApproved =
      motorIds.length > 0 &&
      motorIds.every(
        (id) => String(motorStatusById[id]?.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
      );
    if (!allApproved) {
      showAlert(S.FINAL_APPROVAL_NOT_READY, "warning");
      return false;
    }

    setActionLoading(true);
    try {
      const detailsResponse = await casePreparationController.fetchFormDetails({
        formId: activeBatch.formId,
        subDepartmentId,
      });
      if (!detailsResponse?.success || !detailsResponse?.data) {
        showAlert(getErrorMessage(detailsResponse, S.DETAILS_FETCH_ERROR), "error");
        return false;
      }

      const payloadBody = mapCasePreparationDetailsFromSavedForm(detailsResponse.data, {
        motorStatusById,
      });

      const response = await casePreparationController.updateForm({
        batchId: activeBatch.batchId,
        formId: activeBatch.formId,
        batchType: mapCasePrepBatchTypeToSchema(activeBatch.batchType),
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        casePreparationDetails: payloadBody,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, S.FINAL_APPROVAL_FAILED), "error");
        return false;
      }

      showAlert(S.FINAL_APPROVAL_SUCCESS, "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      bumpBatchRefresh();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    addedMotors,
    bumpBatchRefresh,
    listParams,
    motorStatusById,
    resetFormContext,
    showAlert,
    subDepartmentId,
  ]);

  // Subscale still uses whole-form draft/submit.
  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      const S = STRINGS.MANUFACTURING.CASE_PREP;
      if (!subDepartmentId) {
        showAlert(S.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }
      if (!formData.schema) {
        showAlert(S.SCHEMA_LOAD_ERROR, "warning");
        return false;
      }

      const isCreateFlow = !resolveFormId(activeBatch);
      const payloadBody = mapCasePreparationFormStateToPayload(formData);

      setActionLoading(true);
      try {
        let response: any;
        if (isCreateFlow) {
          response = await casePreparationController.createForm({
            batchId: activeBatch.batchId,
            batchType: mapCasePrepBatchTypeToSchema(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            casePreparationDetails: payloadBody,
          });
        } else {
          response = await casePreparationController.updateForm({
            batchId: activeBatch.batchId,
            formId: activeBatch.formId,
            batchType: mapCasePrepBatchTypeToSchema(activeBatch.batchType),
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            casePreparationDetails: payloadBody,
          });
        }

        if (!response?.success) {
          showAlert(
            getErrorMessage(response, isCreateFlow ? S.CREATE_FAILED : S.UPDATE_FAILED),
            "error",
          );
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setIsFormDirty(false);

        if (intent === "draft") {
          showAlert(
            isCreateFlow ? S.CREATE_DRAFT_SUCCESS : S.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow ? S.CREATE_SUBMIT_SUCCESS : S.UPDATE_SUBMIT_SUCCESS,
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
    [activeBatch, formData, listParams, resetFormContext, showAlert, subDepartmentId],
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
    addedMotors,
    motorStatusById,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    schemaLoading,
    schemaError,
    subDepartmentId,
    batchMotorCount: resolveCasePrepBatchMotorCount(
      activeBatch,
      addedMotors.length > 0 ? addedMotors.length : 1,
    ),
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    detailsRow,
    detailsData,
    detailsSchema,
    detailsLoading,
    handleViewCasePrepDetails,
    handleBackFromDetails,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleMotorSessionChange,
    handleSubscaleValuesChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useCasePreparationHook;
