import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import {
  getRocketMotorCasingMotorsFromSheet,
  type BatchMotorMetadataItem,
} from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import ndtController from "../../../controllers/user/quality_control/ndtController";
import {
  mapNDTDetailsFromSavedForm,
  mapNDTPayload,
  NDTDetailsModel,
} from "../../../data/models/user/NDTApiModel";
import {
  buildNDTAddedMotors,
  createDefaultNDTFormState,
  createEmptyNDTMotorSession,
  createMotorSessionFromDraft,
  hasMotorNDTValue,
  isNDTMotorEditable,
  isNDTMotorSetupReady,
  mapBatchRadiographyDetailsToNdt,
  mapNDTMotorStatusesFromApi,
  normalizeNDTFormState,
  normalizeNDTMotorSession,
  resolveRadiographyPlanRows,
  validateNDTMotorsForApi,
  type NDTFormState,
  type NDTMotorSession,
  type NDTMotorStatusMeta,
  type NDTMotorSubmissionStatus,
  type NDTMotorSubmissionType,
} from "../../../data/models/user/NDTFormModel";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import {
  isMotorEnabledByPreviousStage,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import {
  resolveNDTMotorCountLimit,
  resolveNDTMotorOptions,
  type NDTAddedMotor,
  type NDTBatch,
} from "./ndtFlowConfig";

type WorkflowView = "list" | "form" | "details";

export type { NDTBatch };

const messages = STRINGS.QUALITY_CONTROL.NDT;

const normalizeBatch = (batch: any): NDTBatch => ({
  ...batch,
  lotId: batch?.lotId ?? batch?.batchId ?? "",
  ndtStatus: batch?.ndtStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
  formId: batch?.formId ?? null,
  draftData: batch?.draftData ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

const resolveNDTFormId = (batch?: NDTBatch | null) =>
  String(batch?.formId ?? "").trim() || null;

/** Saved NDT form / batch metadata is loaded only when resuming or editing — not on first fill. */
const isNdtContinueFillingStatus = (status?: string | null) => {
  const normalized = String(status ?? "").trim();
  if (!normalized) return false;
  if (normalized === QUALITY_CONTROL_STATUS.IN_PROGRESS) return true;
  if (normalized === QUALITY_CONTROL_STATUS.REJECTED) return true;
  return normalized.toLowerCase().includes("partial");
};

const buildAddedMotorsFromForm = (formData: NDTFormState): NDTAddedMotor[] =>
  buildNDTAddedMotors(formData);

const resolveBatchMotorEntries = (
  batch: NDTBatch | null,
  batchDetails: any,
): NDTAddedMotor[] => {
  const collectIds = (source: any): string[] => {
    const ids: string[] = [];
    const push = (value: unknown) => {
      const normalized = String(value ?? "").trim();
      if (normalized) ids.push(normalized);
    };

    if (Array.isArray(source?.motorIds)) {
      source.motorIds.forEach((value: unknown) => push(value));
    }

    if (Array.isArray(source?.motors)) {
      source.motors.forEach((motor: any) => {
        push(motor?.motorId ?? motor?.motorNo ?? motor?.motorNumber ?? motor?.id);
      });
    }

    if (source?.motorId != null) {
      String(source.motorId)
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean)
        .forEach((id: string) => push(id));
    }

    return ids.filter((id, index, arr) => arr.indexOf(id) === index);
  };

  const motorIds = collectIds(batchDetails ?? batch ?? {});
  if (motorIds.length === 0) {
    const directMotorId = String(batch?.motorId ?? "").trim();
    return directMotorId ? [{ motorId: directMotorId }] : [];
  }

  return motorIds.map((motorId) => ({ motorId }));
};

/**
 * Always show every batch motor as a tab. Overlay saved form data when present
 * so a partial draft still lists remaining motors.
 */
const mergeMotorsFromBatchAndForm = (
  batchEntries: NDTAddedMotor[],
  formData: NDTFormState,
): { formData: NDTFormState; addedMotors: NDTAddedMotor[] } => {
  if (!batchEntries.length) {
    return {
      formData,
      addedMotors: buildAddedMotorsFromForm(formData),
    };
  }

  const fromFormById = new Map(
    (formData.motors ?? []).map((motor) => [motor.motorId, normalizeNDTMotorSession(motor)]),
  );
  const batchIds = new Set(batchEntries.map((entry) => entry.motorId));

  const motors: NDTMotorSession[] = batchEntries.map((entry) => {
    const existing = fromFormById.get(entry.motorId);
    if (existing) return existing;
    return createEmptyNDTMotorSession(entry.motorId);
  });

  (formData.motors ?? []).forEach((motor) => {
    if (!batchIds.has(motor.motorId)) {
      motors.push(normalizeNDTMotorSession(motor));
    }
  });

  return {
    formData: normalizeNDTFormState({
      ...formData,
      formLoaded: true,
      motors,
    }),
    addedMotors: motors.map((motor) => ({ motorId: motor.motorId })),
  };
};

export const useNDTHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<NDTBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<NDTFormState>(createDefaultNDTFormState());
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    JSON.stringify({ formData: createDefaultNDTFormState(), addedMotors: [], motorStatusById: {} }),
  );
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [detailsRow, setDetailsRow] = useState<NDTBatch | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [addedMotors, setAddedMotors] = useState<NDTAddedMotor[]>([]);
  const [batchMotorEntries, setBatchMotorEntries] = useState<NDTAddedMotor[]>([]);
  const [casingMotorsById, setCasingMotorsById] = useState<Record<string, BatchMotorMetadataItem>>(
    {},
  );
  const [motorStatusById, setMotorStatusById] = useState<Record<string, NDTMotorStatusMeta>>({});
  const [previousStageGate, setPreviousStageGate] =
    useState<PreviousStageApprovedUnits | null>(null);

  const listParams = useSubdepartmentBatches("ndt");
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((subDept) => subDept.slugs?.subDept === "ndt")?.subDepartmentId,
    [user],
  );

  const batches = useMemo(
    () => (listParams.batches ?? []).map(normalizeBatch),
    [listParams.batches],
  );

  const statusCounts = useMemo(() => listParams.statusCounts, [listParams.statusCounts]);
  const totalRecords = useMemo(() => listParams.totalRecords, [listParams.totalRecords]);

  const availableMotorOptions = useMemo(
    () =>
      resolveNDTMotorOptions(activeBatch).filter((option) =>
        isMotorEnabledByPreviousStage(option.value, previousStageGate),
      ),
    [activeBatch, previousStageGate],
  );

  const maxMotorCount = useMemo(
    () =>
      resolveNDTMotorCountLimit({
        availableMotorOptions,
        batchNumberOfMotors: Number((activeBatch as any)?.numberOfMotors ?? 0),
      }),
    [activeBatch, availableMotorOptions],
  );

  const formSnapshot = useMemo(
    () => JSON.stringify({ formData, addedMotors, motorStatusById }),
    [formData, addedMotors, motorStatusById],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setMotorCount("");
    setDraftMotorIds([]);
  }, []);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultNDTFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(defaults);
    setInitialSnapshot(
      JSON.stringify({ formData: defaults, addedMotors: [], motorStatusById: {} }),
    );
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setAddedMotors([]);
    setBatchMotorEntries([]);
    setCasingMotorsById({});
    setMotorStatusById({});
    setPreviousStageGate(null);
    resetFlowDraft();
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    const details = response?.error?.details;
    if (Array.isArray(details)) {
      const detailMessages = details
        .map((item: any) => (typeof item === "string" ? item : item?.message))
        .filter(Boolean);
      if (detailMessages.length > 0) return detailMessages.join("\n");
    }
    if (typeof details === "string" && details.trim()) return details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const handleLoadNDTForm = useCallback(
    (targetMotorId?: string) => {
      if (!activeBatch || !targetMotorId) return false;

      setFormData((prev) => {
        const draft = {
          equipment: prev.equipment ?? [],
          beamEnergies: prev.beamEnergies ?? [],
          radiographyPlan: prev.radiographyPlan ?? "",
          radiographyPlanRows:
            prev.radiographyPlanRows.length > 0
              ? prev.radiographyPlanRows
              : resolveRadiographyPlanRows(prev.radiographyPlan),
        };

        const existing = (prev.motors ?? []).map((motor) => normalizeNDTMotorSession(motor));
        const hasMotor = existing.some((motor) => motor.motorId === targetMotorId);
        const fromBatch = mapBatchRadiographyDetailsToNdt(
          casingMotorsById[targetMotorId]?.radiographyDetails,
        );
        const nextSession = normalizeNDTMotorSession({
          ...createMotorSessionFromDraft(targetMotorId, draft),
          ...(fromBatch.radiographyPlan || fromBatch.radiographyPlanRows.length > 0
            ? fromBatch
            : {}),
        });

        const nextMotors = hasMotor
          ? existing.map((motor) => (motor.motorId === targetMotorId ? nextSession : motor))
          : [...existing, nextSession];

        return normalizeNDTFormState({
          ...prev,
          batchId: activeBatch.batchId ?? prev.batchId,
          formLoaded: true,
          motors: nextMotors,
          motorId: nextMotors[0]?.motorId ?? prev.motorId,
          equipment: [],
          beamEnergies: [],
          radiographyPlan: "",
          radiographyPlanRows: [],
        });
      });

      setAddedMotors((prev) => {
        if (prev.some((motor) => motor.motorId === targetMotorId)) return prev;
        return [...prev, { motorId: targetMotorId }];
      });

      resetFlowDraft();
      return true;
    },
    [activeBatch, casingMotorsById, resetFlowDraft],
  );

  const openFormWithResolvedData = useCallback(
    async (batch: NDTBatch, editMode: boolean) => {
      const shouldFetchDetails = editMode || isNdtContinueFillingStatus(batch.ndtStatus);

      let nextBatch = batch;
      let nextFormData = normalizeNDTFormState(createDefaultNDTFormState(batch.batchId));
      let autoMotorEntries: NDTAddedMotor[] = [];
      let nextStatuses: Record<string, NDTMotorStatusMeta> = {};
      let rejectionReason = batch.rejectionReason ?? null;
      let nextCasingMotorsById: Record<string, BatchMotorMetadataItem> = {};

      setLoadingFormDetails(true);
      try {
        if (batch.batchId) {
          try {
            const batchDetails = await batchManagementController.getBatchById(batch.batchId);
            autoMotorEntries = resolveBatchMotorEntries(batch, batchDetails);
            const casingMotors = getRocketMotorCasingMotorsFromSheet(
              batchDetails?.identificationSheet,
            );
            nextCasingMotorsById = Object.fromEntries(
              casingMotors
                .filter((motor) => String(motor.motorId ?? "").trim())
                .map((motor) => [motor.motorId, motor]),
            );
            nextBatch = {
              ...batch,
              motorIds: batchDetails?.motorIds?.length
                ? batchDetails.motorIds.map(String)
                : (batch as any).motorIds,
              motorId:
                batchDetails?.motorIds?.length > 0
                  ? batchDetails.motorIds.join(", ")
                  : batch.motorId,
              stageProgress: batchDetails?.stageProgress ?? batch.stageProgress,
              currentStage: batchDetails?.currentStage ?? batch.currentStage,
            };
          } catch (error) {
            console.error("Unable to resolve batch motor details", error);
            autoMotorEntries = resolveBatchMotorEntries(batch, null);
          }
        } else {
          autoMotorEntries = resolveBatchMotorEntries(batch, null);
        }

        setPreviousStageGate(
          resolvePreviousStageApprovedUnits({
            stageProgress: nextBatch.stageProgress ?? batch.stageProgress,
            currentStage: nextBatch.currentStage ?? batch.currentStage,
            currentSlug: "ndt",
            currentSubDepartmentId: subDepartmentId,
            subDepartments: user?.allSubDepartments,
          }),
        );

        if (shouldFetchDetails) {
          if (!subDepartmentId) {
            showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
            return;
          }

          const formId = resolveNDTFormId(batch);
          if (!formId) {
            showAlert(messages.FORM_ID_MISSING, "error");
            return;
          }

          const detailsResponse = await ndtController.fetchFormDetails({
            formId,
            subDepartmentId,
          });

          if (!detailsResponse?.success || !detailsResponse.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? messages.DETAILS_NOT_FOUND
                : messages.DETAILS_FETCH_ERROR;
            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          nextFormData = normalizeNDTFormState(
            NDTDetailsModel.toFormState(detailsResponse.data),
          );
          nextBatch = {
            ...nextBatch,
            formId: detailsResponse.data.formId || formId,
          };
          rejectionReason =
            detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
          nextStatuses =
            detailsResponse.data.motorStatuses &&
            Object.keys(detailsResponse.data.motorStatuses).length > 0
              ? detailsResponse.data.motorStatuses
              : mapNDTMotorStatusesFromApi(detailsResponse.data);
        }
      } finally {
        setLoadingFormDetails(false);
      }

      nextFormData = normalizeNDTFormState({
        ...nextFormData,
        equipment: [],
        beamEnergies: [],
        radiographyPlan: "",
        radiographyPlanRows: [],
      });

      const merged = mergeMotorsFromBatchAndForm(autoMotorEntries, nextFormData);
      nextFormData = normalizeNDTFormState({
        ...merged.formData,
        motors: (merged.formData.motors ?? []).map((motor) => {
          const hasPlan =
            String(motor.radiographyPlan ?? "").trim() ||
            (Array.isArray(motor.radiographyPlanRows) && motor.radiographyPlanRows.length > 0);
          if (hasPlan) return normalizeNDTMotorSession(motor);

          const fromBatch = mapBatchRadiographyDetailsToNdt(
            nextCasingMotorsById[motor.motorId]?.radiographyDetails,
          );
          if (!fromBatch.radiographyPlan && fromBatch.radiographyPlanRows.length === 0) {
            return normalizeNDTMotorSession(motor);
          }
          return normalizeNDTMotorSession({ ...motor, ...fromBatch });
        }),
      });
      const nextAddedMotors = merged.addedMotors;

      if (Object.keys(nextStatuses).length === 0) {
        nextStatuses = Object.fromEntries(
          nextAddedMotors.map((entry) => [
            entry.motorId,
            { motorSubmissionStatus: "TO_BE_INITIATED" as NDTMotorSubmissionStatus },
          ]),
        );
      } else {
        nextAddedMotors.forEach((entry) => {
          if (!nextStatuses[entry.motorId]) {
            nextStatuses[entry.motorId] = { motorSubmissionStatus: "TO_BE_INITIATED" };
          }
        });
      }

      const openedBatch: NDTBatch = {
        ...nextBatch,
        formId: resolveNDTFormId(nextBatch),
        draftData: nextFormData,
        rejectionReason,
      };

      setActiveBatch(openedBatch);
      setFormData(nextFormData);
      setAddedMotors(nextAddedMotors);
      setBatchMotorEntries(autoMotorEntries);
      setCasingMotorsById(nextCasingMotorsById);
      setMotorStatusById(nextStatuses);
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: nextAddedMotors,
          motorStatusById: nextStatuses,
        }),
      );
      setIsEditMode(editMode);
      setView("form");
      resetFlowDraft();
    },
    [resetFlowDraft, showAlert, subDepartmentId, user?.allSubDepartments],
  );

  const handleFillForm = useCallback(
    async (batch: NDTBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: NDTBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData],
  );

  const handleFormChange = useCallback((nextForm: NDTFormState) => {
    setFormData(normalizeNDTFormState(nextForm));
  }, []);

  const handleSetupChange = useCallback((patch: Partial<NDTFormState>) => {
    setFormData((prev) => {
      const merged = { ...prev, ...patch };
      if (patch.radiographyPlan && patch.radiographyPlan !== prev.radiographyPlan) {
        merged.radiographyPlanRows = resolveRadiographyPlanRows(patch.radiographyPlan);
      }
      return normalizeNDTFormState(merged);
    });
  }, []);

  const handleMotorSessionChange = useCallback(
    (motorId: string, patch: Partial<NDTMotorSession>) => {
      setFormData((prev) =>
        normalizeNDTFormState({
          ...prev,
          motors: (prev.motors ?? []).map((motor) => {
            if (motor.motorId !== motorId) return normalizeNDTMotorSession(motor);
            const merged = { ...motor, ...patch, motorId };
            if (patch.radiographyPlan && patch.radiographyPlan !== motor.radiographyPlan) {
              merged.radiographyPlanRows = resolveRadiographyPlanRows(patch.radiographyPlan);
            }
            return normalizeNDTMotorSession(merged);
          }),
        }),
      );
    },
    [],
  );

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    setDraftMotorIds((prev) => {
      if (count === "") return [];
      return Array.from({ length: Number(count) }, (_, idx) => prev[idx] ?? "");
    });
  }, []);

  const handleDraftMotorIdChange = useCallback((index: number, motorId: string) => {
    setDraftMotorIds((prev) => {
      const next = [...prev];
      next[index] = motorId;
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    if (view === "form" && isFormDirty && !hasSavedDraft) {
      setBackConfirmOpen(true);
      return;
    }

    bumpBatchRefresh();
    resetFormContext();
  }, [bumpBatchRefresh, hasSavedDraft, isFormDirty, resetFormContext, view]);

  const handleDiscardAndBack = useCallback(() => {
    setBackConfirmOpen(false);
    bumpBatchRefresh();
    resetFormContext();
  }, [bumpBatchRefresh, resetFormContext]);

  const getMotorStatus = useCallback(
    (motorId: string): NDTMotorSubmissionStatus =>
      motorStatusById[motorId]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
    [motorStatusById],
  );

  const checkMotorEditable = useCallback(
    (motorId: string) => {
      if (!isMotorEnabledByPreviousStage(motorId, previousStageGate)) return false;
      return isNDTMotorEditable(getMotorStatus(motorId));
    },
    [getMotorStatus, previousStageGate],
  );

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!isMotorEnabledByPreviousStage(motorId, previousStageGate)) {
        showAlert(STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED, "warning");
        return false;
      }

      if (!checkMotorEditable(motorId)) {
        showAlert(
          getMotorStatus(motorId) === "APPROVED"
            ? messages.MOTOR_LOCKED_APPROVED
            : messages.MOTOR_LOCKED_WAITING,
          "warning",
        );
        return false;
      }

      const motor = (formData.motors ?? []).find((entry) => entry.motorId === motorId);
      if (!motor) return false;

      if (intent === "submit") {
        if (!isNDTMotorSetupReady(motor) || !hasMotorNDTValue(formData, motorId)) {
          showAlert(messages.EMPTY_FORM_ERROR, "warning");
          return false;
        }
        const validationError = validateNDTMotorsForApi([motor]);
        if (validationError) {
          showAlert(validationError, "warning");
          return false;
        }
      } else if (!isNDTMotorSetupReady(motor) && !hasMotorNDTValue(formData, motorId)) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const motorSubmissionType: NDTMotorSubmissionType =
        intent === "draft" ? "DRAFT" : "SUBMIT";
      const isCreateFlow = !resolveNDTFormId(activeBatch);
      const payloadBody = mapNDTPayload(formData, {
        targetMotorIds: [motorId],
        motorSubmissionType,
      });

      if (!payloadBody.motors?.length) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        let response: any;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(messages.BATCH_ID_MISSING, "error");
            return false;
          }
          response = await ndtController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            ...payloadBody,
          });
        } else {
          const formId = resolveNDTFormId(activeBatch);
          if (!formId) {
            showAlert(messages.FORM_ID_MISSING, "error");
            return false;
          }
          response = await ndtController.updateForm({
            formId,
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            ...payloadBody,
          });
        }

        if (!response?.success) {
          showAlert(
            getErrorMessage(
              response,
              isCreateFlow ? messages.CREATE_FAILED : messages.UPDATE_FAILED,
            ),
            "error",
          );
          return false;
        }

        const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
        setHasSavedDraft(true);

        const nextStatus: NDTMotorSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMotorStatusById((prev) => {
          const updated: Record<string, NDTMotorStatusMeta> = {
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
                motorSubmissionType:
                  entry.motorSubmissionType ?? updated[id]?.motorSubmissionType,
                motorSubmissionStatus:
                  (String(entry.motorSubmissionStatus ?? "").toUpperCase() as NDTMotorSubmissionStatus) ||
                  updated[id]?.motorSubmissionStatus ||
                  "TO_BE_INITIATED",
              };
            });
          }
          return updated;
        });

        setInitialSnapshot(
          JSON.stringify({
            formData,
            addedMotors,
            motorStatusById: {
              ...motorStatusById,
              [motorId]: {
                ...motorStatusById[motorId],
                motorSubmissionType,
                motorSubmissionStatus: nextStatus,
              },
            },
          }),
        );

        showAlert(
          intent === "draft"
            ? messages.MOTOR_SAVE_DRAFT_SUCCESS(motorId)
            : messages.MOTOR_SUBMIT_SUCCESS(motorId),
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
      checkMotorEditable,
      formData,
      getMotorStatus,
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

  const handleSubmitForFinalApproval = useCallback(async () => {
    if (!activeBatch?.formId) {
      showAlert(messages.FORM_ID_MISSING, "error");
      return false;
    }
    if (!subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const motorIds = addedMotors.map((m) => m.motorId);
    const allApproved =
      motorIds.length > 0 &&
      motorIds.every(
        (id) =>
          String(motorStatusById[id]?.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
      );
    if (!allApproved) {
      showAlert(messages.FINAL_APPROVAL_NOT_READY, "warning");
      return false;
    }

    setActionLoading(true);
    try {
      const detailsResponse = await ndtController.fetchFormDetails({
        formId: activeBatch.formId,
        subDepartmentId,
      });
      if (!detailsResponse?.success || !detailsResponse?.data) {
        showAlert(getErrorMessage(detailsResponse, messages.DETAILS_FETCH_ERROR), "error");
        return false;
      }

      const payloadBody = mapNDTDetailsFromSavedForm(detailsResponse.data, {
        motorStatusById,
      });

      const response = await ndtController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId,
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        ...payloadBody,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, messages.UPDATE_FAILED), "error");
        return false;
      }

      showAlert(messages.CREATE_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
      await listParams.refreshUserBatches();
      resetFormContext();
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [
    activeBatch,
    addedMotors,
    listParams,
    motorStatusById,
    resetFormContext,
    showAlert,
    subDepartmentId,
  ]);

  const handleViewDetails = useCallback(
    async (row: NDTBatch) => {
      if (!row.formId) {
        showAlert(messages.FORM_ID_MISSING, "error");
        return;
      }
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      setDetailsLoading(true);
      const response = await ndtController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      setDetailsLoading(false);

      if (!response?.success || !response?.data) {
        showAlert(response?.message || messages.DETAILS_FETCH_ERROR, "error");
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
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    batches,
    statusCounts,
    totalRecords,
    detailsRow,
    detailsData,
    detailsLoading,
    motorCount,
    draftMotorIds,
    addedMotors,
    batchMotorEntries,
    availableMotorOptions,
    maxMotorCount,
    motorStatusById,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    previousStageGate,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleFormChange,
    handleSetupChange,
    handleMotorSessionChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleLoadNDTForm,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
    handleViewDetails,
    handleBackFromDetails,
  };
};

export default useNDTHook;
