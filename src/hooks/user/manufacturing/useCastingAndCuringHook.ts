import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import castingCuringController from "../../../controllers/user/manufacturing/castingCuringController";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import {
  collectCrossMotorExcludedBowlLabels,
  createDefaultCastingCuringFormState,
  createEmptyMotorSession,
  hasAnyCastingCuringValue,
  hydrateCastingCuringFormState,
  mapCastingCuringDetailsToFormState,
  mapCastingCuringFormStateToPayload,
  normalizeCastingCuringMotorId,
  type CastingCuringFormState,
  type CastingCuringMotorSession,
  type CuringProcessSetup,
  createDefaultCuringProcessSetup,
  createDefaultCastingProcessSetup,
  type CastingCuringMotorStatusMeta,
  type CastingCuringMotorSubmissionType,
  type CastingCuringMotorSubmissionStatus,
  mapCastingCuringMotorStatusesFromApi,
  isCastingCuringMotorEditable,
  areAllCastingCuringMotorsApproved,
  normalizeCastingCuringMotorStatus,
  normalizeCastingCuringMotorSubmissionType,
} from "../../../data/models/user/CastingCuringFormModel";
import type { CuringCycleConfig } from "../../../data/models/user/CuringCycleConfigModel";
import {
  applyCuringCycleConfigRows,
  createEmptyCuringMotorData,
} from "../../../data/models/user/CuringMotorDataModel";
import { createEmptyCastingMotorData } from "../../../data/models/user/CastingMotorDataModel";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import {
  isMotorEnabledByPreviousStage,
  isMotorEnabledForWorkflow,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import {
  enrichCastingCuringBatchFromDetails,
  getCastingCuringOrderedMotorIds,
  resolveMotorStage,
  canLoadCuringForm,
  canLoadCastingFormForMotor,
  DEFAULT_CASTING_TYPE,
  type CastingCuringAddedMotor,
  type CastingMotorDraftEntry,
} from "./castingCuringFlowConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { useFileService } from "../../../hooks/useFileService";
import { discardWorkflowSnapshotForm } from "../../../utils/workflowDiscard";

type WorkflowView = "list" | "form" | "details";

type CastingCuringBatch = {
  batchId: string;
  ccStatus?: string;
  formId?: string | null;
  motorId?: string;
  motorIds?: Array<string | number>;
  numberOfMotors?: number | string;
  projectName?: string;
  projectId?: string;
  motorStage?: unknown;
  motorType?: unknown;
  [key: string]: any;
};

const CC_STATUS = MANUFACTURING_STATUS;
const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

const buildAddedMotorsFromForm = (formData: CastingCuringFormState): CastingCuringAddedMotor[] =>
  (formData.motors ?? []).map((motor) => ({
    motorId: motor.motorId,
    motorReceivedAt: motor.motorReceivedAt,
    castingStation: motor.castingStation,
  }));

const createEmptyCastingMotorSetupDraft = (): Pick<
  CastingMotorDraftEntry,
  "castingStation" | "motorReceivedAt"
> => ({
  castingStation: "",
  motorReceivedAt: "",
});

export const useCastingAndCuringHook = () => {
  const listParams = useSubdepartmentBatches("casting-and-curing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const { deleteTemp } = useFileService();

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "casting-and-curing")
        ?.subDepartmentId,
    [user],
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<CastingCuringBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [detailsRow, setDetailsRow] = useState<CastingCuringBatch | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<CastingCuringFormState>(createDefaultCastingCuringFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const [castingMotorDraftsById, setCastingMotorDraftsById] = useState<
    Record<string, Pick<CastingMotorDraftEntry, "castingStation" | "motorReceivedAt">>
  >({});
  const [addedMotors, setAddedMotors] = useState<CastingCuringAddedMotor[]>([]);
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [curingSetupDrafts, setCuringSetupDrafts] = useState<Record<string, CuringProcessSetup>>({});
  const [motorStatusById, setMotorStatusById] = useState<Record<string, CastingCuringMotorStatusMeta>>({});
  const [previousStageGate, setPreviousStageGate] = useState<PreviousStageApprovedUnits | null>(null);
  const [curingCycleConfig, setCuringCycleConfig] = useState<CuringCycleConfig | null>(null);
  const [curingCyclesLoading, setCuringCyclesLoading] = useState(false);
  const [curingCyclesError, setCuringCyclesError] = useState<string | null>(null);
  const curingCycleConfigRef = useRef<CuringCycleConfig | null>(null);

  useEffect(() => {
    curingCycleConfigRef.current = curingCycleConfig;
  }, [curingCycleConfig]);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        addedMotors,
      }),
    [formData, addedMotors],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const snapshotStateRef = useRef({ formData, addedMotors });
  snapshotStateRef.current = { formData, addedMotors };
  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  const resetFlowDraft = useCallback(() => {
    setCastingMotorDraftsById({});
    setAddedMotors([]);
    setActiveMotorIndex(0);
    setCuringSetupDrafts({});
    setMotorStatusById({});
    setPreviousStageGate(null);
  }, []);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultCastingCuringFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setMotorStatusById({});
    setCuringCycleConfig(null);
    curingCycleConfigRef.current = null;
    setCuringCyclesLoading(false);
    setCuringCyclesError(null);
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        addedMotors: [],
      }),
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(
    async (batch: CastingCuringBatch, editMode: boolean) => {
      const shouldFetchDetails = Boolean(batch.formId);

      let nextBatch = batch;
      let nextFormData = createDefaultCastingCuringFormState();
      let detailsResponse: any = null;

      setLoadingFormDetails(true);
      try {
        if (batch.batchId) {
          try {
            const batchDetails = await batchManagementController.getBatchById(batch.batchId);
            nextBatch = enrichCastingCuringBatchFromDetails(batch, batchDetails);
          } catch (error) {
            console.error("Unable to resolve batch motor details", error);
          }
        }

        setPreviousStageGate(
          resolvePreviousStageApprovedUnits({
            stageProgress: nextBatch.stageProgress ?? batch.stageProgress,
            currentStage: nextBatch.currentStage ?? batch.currentStage,
            currentSlug: "casting-and-curing",
            currentSubDepartmentId: subDepartmentId,
            subDepartments: user?.allSubDepartments,
          }),
        );

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
            return;
          }
          if (!batch.formId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
            return;
          }

          detailsResponse = await castingCuringController.fetchFormDetails({
            formId: batch.formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse?.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_NOT_FOUND
                : STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextBatch = { ...nextBatch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = hydrateCastingCuringFormState(
            mapCastingCuringDetailsToFormState(
              detailsResponse.data?.castingCuringDetails ?? detailsResponse.data,
            ),
          );
        }
      } finally {
        setLoadingFormDetails(false);
      }

      const formMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);

      if (detailsResponse?.data) {
        const statuses = mapCastingCuringMotorStatusesFromApi(detailsResponse.data);
        setMotorStatusById(statuses);
      } else {
        setMotorStatusById({});
      }

      if (nextFormData.castingFormLoaded) {
        setCastingMotorDraftsById({});
      }
      setAddedMotors(formMotors);
      setCuringSetupDrafts(
        Object.fromEntries(
          (nextFormData.motors ?? [])
            .filter((motor) => !motor.curingFormLoaded)
            .map((motor) => [motor.motorId, motor.curingSetup ?? createDefaultCuringProcessSetup()]),
        ),
      );
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: formMotors,
        }),
      );
      setView("form");
    },
    [showAlert, subDepartmentId, user?.allSubDepartments],
  );

  const handleFillForm = useCallback(
    async (batch: CastingCuringBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: CastingCuringBatch) => await openFormWithResolvedData(batch, true),
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

  const handleDiscardAndBack = useCallback(async () => {
    setBackConfirmOpen(false);
    await discardWorkflowSnapshotForm({
      subDepartmentId,
      initialSnapshot: initialSnapshotRef.current,
      currentState: snapshotStateRef.current,
      deleteTemp,
      resetForm: () => {
        bumpBatchRefresh();
        resetFormContext();
      },
    });
  }, [bumpBatchRefresh, deleteTemp, resetFormContext, subDepartmentId]);

  const handleCastingMotorDraftChange = useCallback(
    (motorId: string, field: "castingStation" | "motorReceivedAt", value: string) => {
      const id = String(motorId ?? "").trim();
      if (!id) return;
      setCastingMotorDraftsById((prev) => {
        const current = prev[id] ?? createEmptyCastingMotorSetupDraft();
        return {
          ...prev,
          [id]: { ...current, [field]: value },
        };
      });
    },
    [],
  );

  const handleLoadCastingForm = useCallback(
    (motorId: string) => {
      if (!activeBatch) return;

      const id = String(motorId ?? "").trim();
      if (!id) return;

      if (!isMotorEnabledByPreviousStage(id, previousStageGate)) {
        showAlert(STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED, "warning");
        return;
      }

      const draft = {
        motorId: id,
        ...(castingMotorDraftsById[id] ?? createEmptyCastingMotorSetupDraft()),
      };
      if (!canLoadCastingFormForMotor(draft)) return;

      const alreadyLoaded = (formData.motors ?? []).some(
        (motor) => String(motor.motorId ?? "").trim() === id,
      );
      if (alreadyLoaded) return;

      const castingType = DEFAULT_CASTING_TYPE;
      const castingStation = draft.castingStation.trim();
      const motorReceivedAt = draft.motorReceivedAt.trim();
      const isFirstLoad = !formData.castingFormLoaded;

      const newSession = createEmptyMotorSession(id, motorReceivedAt, {
        castingType,
        castingStation,
        castingSetup: createDefaultCastingProcessSetup(),
      });

      const nextFormData: CastingCuringFormState = {
        ...formData,
        ...(isFirstLoad
          ? {
              castingType,
              castingStation,
              castingFormLoaded: true,
              readyForCuring: false,
            }
          : {}),
        motors: [...(formData.motors ?? []), newSession],
      };

      const nextAdded: CastingCuringAddedMotor[] = [
        ...addedMotors.filter((motor) => String(motor.motorId ?? "").trim() !== id),
        {
          motorId: id,
          motorReceivedAt,
          castingStation,
        },
      ];

      setFormData(nextFormData);
      setAddedMotors(nextAdded);
      setCastingMotorDraftsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setCuringSetupDrafts((prev) => ({
        ...prev,
        [id]: prev[id] ?? createDefaultCuringProcessSetup(),
      }));
    },
    [activeBatch, addedMotors, castingMotorDraftsById, formData, previousStageGate, showAlert],
  );

  const fetchCuringCycleConfig = useCallback(async () => {
    if (!activeBatch) return null;

    const motorStage = resolveMotorStage(activeBatch);
    if (curingCycleConfigRef.current?.motorStage === motorStage) {
      return curingCycleConfigRef.current;
    }

    setCuringCyclesLoading(true);
    setCuringCyclesError(null);

    try {
      const response = await castingCuringController.fetchCuringCycles({ motorStage });
      if (response?.success && response.data) {
        setCuringCycleConfig(response.data);
        return response.data;
      }

      const message = response?.message ?? "Unable to load curing cycle configuration.";
      setCuringCyclesError(message);
      showAlert(message, "warning");
      return null;
    } finally {
      setCuringCyclesLoading(false);
    }
  }, [activeBatch, showAlert]);

  useEffect(() => {
    if (view !== "form" || !activeBatch) return;
    void fetchCuringCycleConfig();
  }, [view, activeBatch, fetchCuringCycleConfig]);

  const getCuringSetupDraft = useCallback(
    (motorId: string): CuringProcessSetup =>
      curingSetupDrafts[normalizeCastingCuringMotorId(motorId)] ?? createDefaultCuringProcessSetup(),
    [curingSetupDrafts],
  );

  const handleCuringSetupDraftChange = useCallback(
    (motorId: string, field: keyof CuringProcessSetup, value: string | number | "") => {
      const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
      setCuringSetupDrafts((prev) => {
        const current = prev[normalizedMotorId] ?? createDefaultCuringProcessSetup();
        const nextSetup = {
          ...current,
          [field]: value,
        };
        if (field === "configuration" && String(value).toLowerCase() !== "multiple") {
          nextSetup.motorsToCureCount = "";
        }
        return { ...prev, [normalizedMotorId]: nextSetup };
      });
    },
    [],
  );

  const handleLoadCuringForm = useCallback(
    async (motorId: string) => {
      if (!activeBatch) return;

      const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
      if (!normalizedMotorId) return;

      const draft = curingSetupDrafts[normalizedMotorId] ?? createDefaultCuringProcessSetup();
      if (!canLoadCuringForm({ setup: draft, curingFormLoaded: false })) return;

      const motorStage = resolveMotorStage(activeBatch);
      let cycleConfig =
        curingCycleConfigRef.current?.motorStage === motorStage
          ? curingCycleConfigRef.current
          : null;
      if (!cycleConfig) {
        cycleConfig = await fetchCuringCycleConfig();
      }

      const setupSnapshot = {
        ...draft,
        curingType: cycleConfig?.curingType ?? draft.curingType,
      };
      const targetMotor = (formData.motors ?? []).find(
        (motor) => normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId,
      );
      if (!targetMotor) return;

      const baseCuringData = targetMotor.curingData ?? createEmptyCuringMotorData();
      const nextCuringData = cycleConfig?.cycles?.length
        ? applyCuringCycleConfigRows(baseCuringData, cycleConfig.cycles)
        : baseCuringData;

      setFormData((prev) => ({
        ...prev,
        readyForCuring: true,
        motors: (prev.motors ?? []).map((motor) => {
          if (normalizeCastingCuringMotorId(motor.motorId) !== normalizedMotorId) return motor;

          return {
            ...motor,
            curingSetup: setupSnapshot,
            curingFormLoaded: true,
            castingSavedForCuring: true,
            curingData: nextCuringData,
          };
        }),
      }));

      setCuringSetupDrafts((prev) => ({
        ...prev,
        [normalizedMotorId]: createDefaultCuringProcessSetup(),
      }));
    },
    [activeBatch, curingSetupDrafts, fetchCuringCycleConfig, formData],
  );

  const handleRemoveMotor = useCallback((motorId: string) => {
    const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
    if (!normalizedMotorId) return;

    setAddedMotors((prev) =>
      prev.filter((motor) => normalizeCastingCuringMotorId(motor.motorId) !== normalizedMotorId),
    );
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).filter(
        (motor) => normalizeCastingCuringMotorId(motor.motorId) !== normalizedMotorId,
      ),
    }));
    setCuringSetupDrafts((prev) => {
      const next = { ...prev };
      delete next[normalizedMotorId];
      return next;
    });
  }, []);

  const handleMotorSessionChange = useCallback(
    (motorId: string, nextMotor: CastingCuringMotorSession) => {
      const normalizedMotorId = normalizeCastingCuringMotorId(motorId);

      setFormData((prev) => ({
        ...prev,
        motors: (prev.motors ?? []).map((motor) =>
          normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId
            ? {
                ...nextMotor,
                castingData: nextMotor.castingData ?? createEmptyCastingMotorData(),
                curingData: nextMotor.curingData ?? createEmptyCuringMotorData(),
              }
            : motor,
        ),
      }));
    },
    [],
  );

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!hasAnyCastingCuringValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const status = parseStatus(activeBatch.ccStatus);
      const isCreateFlow = status === parseStatus(CC_STATUS.TO_BE_INITIATED) && !activeBatch.formId;
      const motors = mapCastingCuringFormStateToPayload(formData).motors;

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            motors,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
            return false;
          }
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.updateForm({
            formId: activeBatch.formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            motors,
          });
        }

        if (!response?.success) {
          const fallback = isCreateFlow
            ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_FAILED
            : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_FAILED;
          showAlert(getErrorMessage(response, fallback), "error");
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);

        if (intent === "draft") {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_DRAFT_SUCCESS
              : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_DRAFT_SUCCESS,
            "success",
            { autoCloseMs: 2200 },
          );
          setHasSavedDraft(true);
        } else {
          showAlert(
            isCreateFlow
              ? STRINGS.MANUFACTURING.CASTING_CURING.CREATE_SUBMIT_SUCCESS
              : STRINGS.MANUFACTURING.CASTING_CURING.UPDATE_SUBMIT_SUCCESS,
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
    [activeBatch, formData, formSnapshot, showAlert, listParams, resetFormContext, subDepartmentId],
  );

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      if (
        !isMotorEnabledForWorkflow(
          motorId,
          getCastingCuringOrderedMotorIds(activeBatch, addedMotors),
          previousStageGate,
          (id) => motorStatusById[id]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
        )
      ) {
        showAlert(STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED, "warning");
        return false;
      }
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      const motorSubmissionType: CastingCuringMotorSubmissionType =
        intent === "draft" ? "DRAFT" : "SUBMIT";
      const body = mapCastingCuringFormStateToPayload(formData, {
        targetMotorIds: [motorId],
        motorSubmissionType,
      });

      const status = parseStatus(activeBatch.ccStatus);
      const isCreateFlow = status === parseStatus(CC_STATUS.TO_BE_INITIATED) && !activeBatch.formId;

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            motors: body.motors,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
            return false;
          }
          response = await castingCuringController.updateForm({
            formId: activeBatch.formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            motors: body.motors,
          });
        }

        if (!response?.success) {
          showAlert(
            getErrorMessage(response, `Failed to ${intent} motor ${motorId}.`),
            "error",
          );
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setInitialSnapshot(formSnapshot);
        setHasSavedDraft(true);

        setMotorStatusById((prev) => {
          const nextStatus: CastingCuringMotorSubmissionStatus =
            intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";
          const updated: Record<string, CastingCuringMotorStatusMeta> = {
            ...prev,
            [motorId]: {
              ...prev[motorId],
              motorSubmissionType: motorSubmissionType,
              motorSubmissionStatus: nextStatus,
            },
          };

          const responseStatuses =
            response.data?.motorStatuses ??
            (response.data as { motorStatuses?: unknown[] } | undefined)?.motorStatuses;
          if (Array.isArray(responseStatuses)) {
            responseStatuses.forEach((entry: any) => {
              const id = String(entry?.motorId ?? "").trim();
              if (!id) return;
              updated[id] = {
                ...updated[id],
                motorSubmissionType:
                  normalizeCastingCuringMotorSubmissionType(entry?.motorSubmissionType) ??
                  updated[id]?.motorSubmissionType,
                motorSubmissionStatus: normalizeCastingCuringMotorStatus(
                  entry?.motorSubmissionStatus ?? updated[id]?.motorSubmissionStatus,
                ),
              };
            });
          }

          return updated;
        });

        showAlert(
          intent === "draft"
            ? `Motor ${motorId} draft saved successfully.`
            : `Motor ${motorId} submitted for approval.`,
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
      addedMotors,
      formData,
      formSnapshot,
      motorStatusById,
      previousStageGate,
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

  const getMotorStatus = useCallback(
    (motorId: string): CastingCuringMotorSubmissionStatus =>
      motorStatusById[motorId]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
    [motorStatusById],
  );

  const getCrossMotorExcludedBowlSelections = useCallback(
    (motorId: string) => collectCrossMotorExcludedBowlLabels(formData.motors ?? [], motorId),
    [formData.motors],
  );

  const orderedMotorIds = useMemo(
    () => getCastingCuringOrderedMotorIds(activeBatch, addedMotors),
    [activeBatch, addedMotors],
  );

  const checkMotorEditable = useCallback(
    (motorId: string) => {
      if (
        !isMotorEnabledForWorkflow(
          motorId,
          orderedMotorIds,
          previousStageGate,
          (id) => getMotorStatus(id),
        )
      ) {
        return false;
      }
      return isCastingCuringMotorEditable(getMotorStatus(motorId));
    },
    [getMotorStatus, orderedMotorIds, previousStageGate],
  );

  const handleSubmitForFinalApproval = useCallback(async () => {
    if (!activeBatch?.formId) return false;
    if (!subDepartmentId) return false;
    if (!areAllCastingCuringMotorsApproved(motorStatusById)) return false;

    setActionLoading(true);
    try {
      const detailsRes = await castingCuringController.fetchFormDetails({
        formId: activeBatch.formId,
        subDepartmentId,
      });

      if (!detailsRes?.success || !detailsRes?.data) {
        showAlert("Failed to fetch latest form data for final approval.", "error");
        return false;
      }

      const latestPayload = detailsRes.data?.castingCuringDetails ?? detailsRes.data;
      const rawMotors = Array.isArray(latestPayload?.motors) ? latestPayload.motors : [];

      const response = await castingCuringController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId,
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        motors: rawMotors.map((m: any) => ({
          motorId: String(m.motorId ?? ""),
          motorReceivedAt: String(m.motorReceivedAt ?? m.details?.motorReceivedAt ?? ""),
          motorSubmissionType: "SUBMIT",
          setup: m.setup ?? m.details?.setup ?? {},
          curingSetup: m.curingSetup ?? m.details?.curingSetup ?? {},
          castingSections: m.castingSections ?? m.details?.castingSections ?? [],
          curingSections: m.curingSections ?? m.details?.curingSections ?? [],
        })),
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, "Final approval submission failed."), "error");
        return false;
      }

      showAlert("Form submitted for final approval successfully.", "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [activeBatch, motorStatusById, showAlert, subDepartmentId, listParams, resetFormContext]);

  const handleViewCastingCuringDetails = useCallback(
    async (row: CastingCuringBatch) => {
      if (!row.formId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
        return;
      }
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return;
      }
      setDetailsLoading(true);
      const response = await castingCuringController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      setDetailsLoading(false);
      if (!response?.success || !response?.data) {
        showAlert(
          response?.message || STRINGS.MANUFACTURING.CASTING_CURING.DETAILS_FETCH_ERROR,
          "error",
        );
        return;
      }
      setDetailsRow(row);
      setDetailsData(response.data);
      setView("details");
    },
    [showAlert, subDepartmentId],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
    bumpBatchRefresh();
  }, [bumpBatchRefresh]);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    actionLoading,
    curingCycleConfig,
    curingCyclesLoading,
    curingCyclesError,
    subDepartmentId,
    castingMotorDraftsById,
    addedMotors,
    activeMotorIndex,
    setActiveMotorIndex,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleCastingMotorDraftChange,
    handleLoadCastingForm,
    handleLoadCuringForm,
    getCuringSetupDraft,
    getCrossMotorExcludedBowlSelections,
    handleCuringSetupDraftChange,
    fetchCuringCycleConfig,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleSaveDraft,
    handleSubmit,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
    motorStatusById,
    previousStageGate,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewCastingCuringDetails,
    handleBackFromDetails,
    hasSavedDraft,
  };
};

export default useCastingAndCuringHook;
