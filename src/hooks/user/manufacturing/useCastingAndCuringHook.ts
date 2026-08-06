import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import castingCuringController from "../../../controllers/user/manufacturing/castingCuringController";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import {
  applyMotorFormValuesMaps,
  buildMotorCastingValuesMapFromSessions,
  buildMotorCuringValuesMapFromSessions,
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
  buildCastingCuringSchemaRequest,
  castingCuringCastingSchemaFetchConfig,
  castingCuringCuringSchemaFetchConfig,
  createCastingCuringInitialValues,
  buildCuringFormValuesFromCycleConfig,
  buildCastingSetupContext,
  schemaEngineController,
  type SchemaFormValues,
} from "../../../schema-engine";
import { cloneValue } from "../../../schema-engine/state/formState";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import {
  isMotorEnabledByPreviousStage,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import {
  enrichCastingCuringBatchFromDetails,
  filterUnusedCastingCuringMotorOptions,
  resolveCastingCuringMotorOptions,
  resolveCastingFinalMixCount,
  resolveCastingMotorCount,
  resizeCastingMotorDrafts,
  resolveMotorStage,
  canLoadCuringForm,
  type CastingCuringAddedMotor,
  type CastingCuringMotorOption,
  type CastingMotorDraftEntry,
} from "./castingCuringFlowConfig";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

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

export const useCastingAndCuringHook = () => {
  const listParams = useSubdepartmentBatches("casting-and-curing");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

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
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [castingSchemaError, setCastingSchemaError] = useState<string | null>(null);
  const [curingSchemaError, setCuringSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [formData, setFormData] = useState<CastingCuringFormState>(createDefaultCastingCuringFormState());
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const [castingType, setCastingType] = useState("");
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [castingMotorDrafts, setCastingMotorDrafts] = useState<CastingMotorDraftEntry[]>([]);
  const [addedMotors, setAddedMotors] = useState<CastingCuringAddedMotor[]>([]);
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [curingSetupDrafts, setCuringSetupDrafts] = useState<Record<string, CuringProcessSetup>>({});
  const [motorCastingValuesById, setMotorCastingValuesById] = useState<Record<string, SchemaFormValues>>({});
  const [motorCuringValuesById, setMotorCuringValuesById] = useState<Record<string, SchemaFormValues>>({});
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
        castingType,
        addedMotors,
      }),
    [formData, castingType, addedMotors],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setCastingType("");
    setMotorCount("");
    setCastingMotorDrafts([]);
    setAddedMotors([]);
    setActiveMotorIndex(0);
    setCuringSetupDrafts({});
    setMotorCastingValuesById({});
    setMotorCuringValuesById({});
    setMotorStatusById({});
    setPreviousStageGate(null);
    setSchemaError(null);
    setCastingSchemaError(null);
    setCuringSchemaError(null);
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
    setSchemaLoading(false);
    setSchemaError(null);
    setCastingSchemaError(null);
    setCuringSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setFormData(defaults);
    setMotorCastingValuesById({});
    setMotorCuringValuesById({});
    setMotorStatusById({});
    setCuringCycleConfig(null);
    curingCycleConfigRef.current = null;
    setCuringCyclesLoading(false);
    setCuringCyclesError(null);
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        castingType: "",
        addedMotors: [],
      }),
    );
  }, [resetFlowDraft]);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const fetchCastingSchema = useCallback(
    async (batch: CastingCuringBatch) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      setSchemaLoading(true);
      setSchemaError(null);
      setCastingSchemaError(null);

      const motorStage = resolveMotorStage(batch);
      try {
        const castingResponse = await schemaEngineController.fetchSchema(
          castingCuringCastingSchemaFetchConfig,
          buildCastingCuringSchemaRequest({ subDepartmentId, motorStage, schemaType: "CASTING" }),
        );

        const castingSchema = castingResponse?.success ? castingResponse.data : null;
        const nextCastingError = castingSchema
          ? null
          : getErrorMessage(castingResponse, "Unable to load casting schema.");

        setCastingSchemaError(nextCastingError);

        if (!castingSchema) {
          const message = nextCastingError ?? "Unable to load casting schema.";
          setSchemaError(message);
          showAlert(message, "error");
        } else {
          setSchemaError(null);
        }

        return castingSchema;
      } finally {
        setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const fetchCuringSchema = useCallback(
    async (batch: CastingCuringBatch) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      setSchemaLoading(true);
      setCuringSchemaError(null);

      const motorStage = resolveMotorStage(batch);
      try {
        const curingResponse = await schemaEngineController.fetchSchema(
          castingCuringCuringSchemaFetchConfig,
          buildCastingCuringSchemaRequest({ subDepartmentId, motorStage, schemaType: "CURING" }),
        );

        const curingSchema = curingResponse?.success ? curingResponse.data : null;
        const nextCuringError = curingSchema
          ? null
          : getErrorMessage(curingResponse, "Unable to load curing schema.");

        setCuringSchemaError(nextCuringError);

        if (!curingSchema) {
          showAlert(nextCuringError ?? "Curing schema is unavailable.", "warning");
        }

        return curingSchema;
      } finally {
        setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

  const fetchSchemas = useCallback(
    async (batch: CastingCuringBatch) => {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return { castingSchema: null, curingSchema: null };
      }

      setSchemaLoading(true);
      setSchemaError(null);
      setCastingSchemaError(null);
      setCuringSchemaError(null);

      const motorStage = resolveMotorStage(batch);
      const requestBase = {
        subDepartmentId,
        motorStage,
      };

      try {
        const [castingResponse, curingResponse] = await Promise.all([
          schemaEngineController.fetchSchema(
            castingCuringCastingSchemaFetchConfig,
            buildCastingCuringSchemaRequest({ ...requestBase, schemaType: "CASTING" }),
          ),
          schemaEngineController.fetchSchema(
            castingCuringCuringSchemaFetchConfig,
            buildCastingCuringSchemaRequest({ ...requestBase, schemaType: "CURING" }),
          ),
        ]);

        const castingSchema = castingResponse?.success ? castingResponse.data : null;
        const curingSchema = curingResponse?.success ? curingResponse.data : null;
        const nextCastingError = castingSchema
          ? null
          : getErrorMessage(castingResponse, "Unable to load casting schema.");
        const nextCuringError = curingSchema
          ? null
          : getErrorMessage(curingResponse, "Unable to load curing schema.");

        setCastingSchemaError(nextCastingError);
        setCuringSchemaError(nextCuringError);

        if (!castingSchema && !curingSchema) {
          const message = nextCuringError ?? nextCastingError ?? "Unable to load casting and curing schema.";
          setSchemaError(message);
          showAlert(message, "error");
        } else {
          setSchemaError(null);
          if (!castingSchema) {
            showAlert(nextCastingError ?? "Casting schema is unavailable.", "warning");
          }
          if (!curingSchema) {
            showAlert(nextCuringError ?? "Curing schema is unavailable.", "warning");
          }
        }

        return { castingSchema, curingSchema };
      } finally {
        setSchemaLoading(false);
      }
    },
    [showAlert, subDepartmentId],
  );

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
          nextFormData = mapCastingCuringDetailsToFormState(
            detailsResponse.data?.castingCuringDetails ?? detailsResponse.data,
          );

          const { castingSchema, curingSchema } = await fetchSchemas(nextBatch);
          nextFormData = hydrateCastingCuringFormState(nextFormData, castingSchema, curingSchema);
        }
      } finally {
        setLoadingFormDetails(false);
      }

      const nextAddedMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setMotorCastingValuesById(buildMotorCastingValuesMapFromSessions(nextFormData.motors ?? []));
      setMotorCuringValuesById(buildMotorCuringValuesMapFromSessions(nextFormData.motors ?? []));

      // Extract motor-level statuses from the API response
      if (detailsResponse?.data) {
        const statuses = mapCastingCuringMotorStatusesFromApi(detailsResponse.data);
        setMotorStatusById(statuses);
      } else {
        setMotorStatusById({});
      }

      if (nextFormData.castingFormLoaded) {
        setCastingType("");
      } else {
        setCastingType(nextFormData.castingType ?? "");
      }
      setAddedMotors(nextAddedMotors);
      setMotorCount("");
      setCastingMotorDrafts([]);
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
          castingType: nextFormData.castingFormLoaded ? "" : nextFormData.castingType,
          addedMotors: nextAddedMotors,
        }),
      );
      setView("form");
    },
    [fetchSchemas, showAlert, subDepartmentId],
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

  const handleDiscardAndBack = useCallback(() => {
    bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh]);

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    const resolvedCount = count === "" ? 0 : Number(count);
    setCastingMotorDrafts((prev) => resizeCastingMotorDrafts(resolvedCount, prev));
  }, []);

  const handleCastingTypeChange = useCallback((value: string) => {
    setCastingType(value);
    setMotorCount("");
    setCastingMotorDrafts([]);
  }, []);

  const handleCastingMotorDraftChange = useCallback(
    (index: number, field: keyof CastingMotorDraftEntry, value: string) => {
      setCastingMotorDrafts((prev) => {
        const next = [...prev];
        const current = next[index] ?? { motorId: "", castingStation: "", motorReceivedAt: "" };
        next[index] = { ...current, [field]: value };
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (!castingType) {
      setCastingMotorDrafts([]);
      return;
    }

    const normalized = String(castingType).toLowerCase();
    if (normalized === "others") {
      if (motorCount === "") {
        setCastingMotorDrafts([]);
        return;
      }
      setCastingMotorDrafts((prev) => resizeCastingMotorDrafts(Number(motorCount), prev));
      return;
    }

    const count = resolveCastingMotorCount(castingType, motorCount);
    setCastingMotorDrafts((prev) => resizeCastingMotorDrafts(count, prev));
  }, [castingType, motorCount]);

  const handleLoadCastingForm = useCallback(async () => {
    if (!activeBatch) return;

    const count = resolveCastingMotorCount(castingType, motorCount);
    if (count <= 0 || castingMotorDrafts.length !== count) return;

    const selectedDrafts = castingMotorDrafts.filter((row) => String(row.motorId ?? "").trim());
    if (selectedDrafts.length !== count) return;

    const motorOptions = resolveCastingCuringMotorOptions(activeBatch);
    const castingSchema =
      formData.castingSchema ?? (await fetchCastingSchema(activeBatch));
    if (!castingSchema) return;

    const unusedMotorIds = new Set(
      filterUnusedCastingCuringMotorOptions(
        motorOptions,
        addedMotors.map((motor) => motor.motorId),
      ).map((option) => option.value),
    );

    const selectedIds = selectedDrafts.map((row) => row.motorId.trim());

    if (motorOptions.length > 0 && selectedIds.some((id) => !unusedMotorIds.has(id))) {
      showAlert("Select motor IDs that have not already been added.", "warning");
      return;
    }

    if (motorOptions.length > 0 && selectedIds.length !== count) {
      showAlert("Select all motor IDs before loading the form.", "warning");
      return;
    }

    const existingIds = new Set(addedMotors.map((motor) => motor.motorId));
    const newDrafts = selectedDrafts.filter((row) => !existingIds.has(row.motorId.trim()));
    const isFirstLoad = !formData.castingFormLoaded;
    const primaryStation = newDrafts[0]?.castingStation ?? "";

    const newSessions: CastingCuringMotorSession[] = newDrafts.map((row) =>
      createEmptyMotorSession(
        row.motorId.trim(),
        row.motorReceivedAt.trim(),
        castingSchema,
        buildCastingSetupContext({
          castingType,
          castingStation: row.castingStation.trim(),
          motorId: row.motorId.trim(),
          finalMixCount: resolveCastingFinalMixCount(activeBatch),
        }),
        {
          castingType,
          castingStation: row.castingStation.trim(),
        },
      ),
    );

    const nextFormData = hydrateCastingCuringFormState(
      {
        ...formData,
        ...(isFirstLoad
          ? {
              castingType,
              castingStation: primaryStation,
              castingFormLoaded: true,
              readyForCuring: false,
              castingSchema,
              curingSchema: null,
              curingFormValues: {},
            }
          : {}),
        motors: [...(formData.motors ?? []), ...newSessions],
      },
      castingSchema ?? formData.castingSchema,
      isFirstLoad ? null : formData.curingSchema,
    );

    const nextAdded = [
      ...addedMotors,
      ...newDrafts.map((row) => ({
        motorId: row.motorId.trim(),
        motorReceivedAt: row.motorReceivedAt.trim(),
        castingStation: row.castingStation.trim(),
      })),
    ];

    setFormData(nextFormData);
    setMotorCastingValuesById(buildMotorCastingValuesMapFromSessions(nextFormData.motors ?? []));
    setMotorCuringValuesById(buildMotorCuringValuesMapFromSessions(nextFormData.motors ?? []));
    setAddedMotors(nextAdded);
    setCastingType("");
    setCastingMotorDrafts([]);
    setMotorCount("");
    setCuringSetupDrafts((prev) => ({
      ...prev,
      ...Object.fromEntries(
        newDrafts.map((row) => [row.motorId.trim(), createDefaultCuringProcessSetup()]),
      ),
    }));
    if (newDrafts.length > 0) {
      setActiveMotorIndex(0);
    }
  }, [
    activeBatch,
    castingMotorDrafts,
    castingType,
    fetchCastingSchema,
    formData,
    motorCount,
    showAlert,
    addedMotors,
  ]);

  const handleAddMotors = useCallback(async () => {
    if (!formData.castingFormLoaded) return;
    await handleLoadCastingForm();
  }, [formData.castingFormLoaded, handleLoadCastingForm]);

  const handleFetchCuringSchema = useCallback(async () => {
    if (!activeBatch || formData.curingSchema) return;
    const curingSchema = await fetchCuringSchema(activeBatch);
    if (!curingSchema) return;
    setFormData((prev) => ({
      ...prev,
      curingSchema,
    }));
  }, [activeBatch, fetchCuringSchema, formData.curingSchema]);

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

  const getMotorCuringFormValues = useCallback(
    (motorId: string): SchemaFormValues => {
      const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
      const fromMap = motorCuringValuesById[normalizedMotorId];
      if (fromMap) return fromMap;

      const motor = (formData.motors ?? []).find(
        (entry) => normalizeCastingCuringMotorId(entry.motorId) === normalizedMotorId,
      );
      return motor?.curingFormValues ?? {};
    },
    [formData.motors, motorCuringValuesById],
  );

  const getMotorCastingFormValues = useCallback(
    (motorId: string): SchemaFormValues => {
      const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
      const fromMap = motorCastingValuesById[normalizedMotorId];
      if (fromMap) return fromMap;

      const motor = (formData.motors ?? []).find(
        (entry) => normalizeCastingCuringMotorId(entry.motorId) === normalizedMotorId,
      );
      return motor?.formValues ?? {};
    },
    [formData.motors, motorCastingValuesById],
  );

  const handleMotorCastingValuesChange = useCallback((motorId: string, values: SchemaFormValues) => {
    const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
    if (!normalizedMotorId) return;

    const nextValues = cloneValue(values);
    setMotorCastingValuesById((prev) => ({
      ...prev,
      [normalizedMotorId]: nextValues,
    }));
    setFormData((prev) => ({
      ...prev,
      motors: (prev.motors ?? []).map((motor) =>
        normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId
          ? { ...motor, formValues: cloneValue(nextValues) }
          : motor,
      ),
    }));
  }, []);

  const handleMotorCuringValuesChange = useCallback((motorId: string, values: SchemaFormValues) => {
    const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
    if (!normalizedMotorId) return;

    const nextValues = cloneValue(values);
    setMotorCuringValuesById((prev) => ({
      ...prev,
      [normalizedMotorId]: nextValues,
    }));
    setFormData((prev) => ({
      ...prev,
      curingFormValues: {},
      motors: (prev.motors ?? []).map((motor) =>
        normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId
          ? { ...motor, curingFormValues: cloneValue(nextValues) }
          : motor,
      ),
    }));
  }, []);

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

      const cachedSchema = formData.curingSchema;
      const curingSchema = cachedSchema ?? (await fetchCuringSchema(activeBatch));
      if (!curingSchema) return;

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

      const setupContext = buildCastingSetupContext({
        castingType: targetMotor.castingType ?? formData.castingType,
        castingStation: targetMotor.castingStation ?? formData.castingStation,
      });
      const nextCuringFormValues = cycleConfig
        ? cloneValue(buildCuringFormValuesFromCycleConfig(curingSchema, cycleConfig, setupContext))
        : cloneValue(createCastingCuringInitialValues(curingSchema, setupContext));

      setMotorCuringValuesById((prevValues) => ({
        ...prevValues,
        [normalizedMotorId]: cloneValue(nextCuringFormValues),
      }));

      setFormData((prev) => ({
        ...prev,
        curingSchema,
        curingFormValues: {},
        readyForCuring: true,
        motors: (prev.motors ?? []).map((motor) => {
          if (normalizeCastingCuringMotorId(motor.motorId) !== normalizedMotorId) return motor;

          return {
            ...motor,
            curingSetup: setupSnapshot,
            curingFormLoaded: true,
            curingFormValues: cloneValue(nextCuringFormValues),
          };
        }),
      }));

      setCuringSetupDrafts((prev) => ({
        ...prev,
        [normalizedMotorId]: createDefaultCuringProcessSetup(),
      }));
    },
    [activeBatch, curingSetupDrafts, fetchCuringCycleConfig, fetchCuringSchema, formData],
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
    setMotorCastingValuesById((prev) => {
      const next = { ...prev };
      delete next[normalizedMotorId];
      return next;
    });
    setMotorCuringValuesById((prev) => {
      const next = { ...prev };
      delete next[normalizedMotorId];
      return next;
    });
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
          normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId ? nextMotor : motor,
        ),
      }));

      if (nextMotor.formValues && Object.keys(nextMotor.formValues).length > 0) {
        setMotorCastingValuesById((prev) => ({
          ...prev,
          [normalizedMotorId]: cloneValue(nextMotor.formValues),
        }));
      }

      if (nextMotor.curingFormValues && Object.keys(nextMotor.curingFormValues).length > 0) {
        setMotorCuringValuesById((prev) => ({
          ...prev,
          [normalizedMotorId]: cloneValue(nextMotor.curingFormValues!),
        }));
      }
    },
    [],
  );

  const handleCuringValuesChange = useCallback(
    (values: CastingCuringFormState["curingFormValues"]) => {
      setFormData({ ...formData, curingFormValues: values });
    },
    [formData],
  );

  const submitForm = useCallback(
    async (intent: "draft" | "submit") => {
      if (!activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      if (!formData.curingSchema && !formData.castingSchema) {
        showAlert("Load the form schema before saving.", "warning");
        return false;
      }

      if (!hasAnyCastingCuringValue(formData)) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const payloadForm = applyMotorFormValuesMaps(
        formData,
        motorCastingValuesById,
        motorCuringValuesById,
      );
      const status = parseStatus(activeBatch.ccStatus);
      const isCreateFlow = status === parseStatus(CC_STATUS.TO_BE_INITIATED) && !activeBatch.formId;
      const motors = mapCastingCuringFormStateToPayload(payloadForm).motors;

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
    [
      activeBatch,
      castingType,
      formData,
      formSnapshot,
      motorCastingValuesById,
      motorCuringValuesById,
      showAlert,
      listParams,
      resetFormContext,
      subDepartmentId,
    ],
  );

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (!activeBatch) return false;
      if (!isMotorEnabledByPreviousStage(motorId, previousStageGate)) {
        showAlert(STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED, "warning");
        return false;
      }
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }
      if (!formData.castingSchema) {
        showAlert("Load the form schema before saving.", "warning");
        return false;
      }

      const payloadForm = applyMotorFormValuesMaps(
        formData,
        motorCastingValuesById,
        motorCuringValuesById,
      );
      const motorSubmissionType: CastingCuringMotorSubmissionType = intent === "draft" ? "DRAFT" : "SUBMIT";
      const body = mapCastingCuringFormStateToPayload(payloadForm, {
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
    [activeBatch, formData, formSnapshot, motorCastingValuesById, motorCuringValuesById, previousStageGate, showAlert, subDepartmentId],
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

  const checkMotorEditable = useCallback(
    (motorId: string) => {
      if (!isMotorEnabledByPreviousStage(motorId, previousStageGate)) return false;
      return isCastingCuringMotorEditable(getMotorStatus(motorId));
    },
    [getMotorStatus, previousStageGate],
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
    schemaLoading,
    schemaError,
    castingSchemaError,
    curingSchemaError,
    curingCycleConfig,
    curingCyclesLoading,
    curingCyclesError,
    subDepartmentId,
    castingType,
    motorCount,
    castingMotorDrafts,
    addedMotors,
    activeMotorIndex,
    setActiveMotorIndex,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleCastingTypeChange,
    handleMotorCountChange,
    handleCastingMotorDraftChange,
    handleLoadCastingForm,
    handleAddMotors,
    handleLoadCuringForm,
    getCuringSetupDraft,
    getMotorCastingFormValues,
    getMotorCuringFormValues,
    handleCuringSetupDraftChange,
    handleMotorCastingValuesChange,
    handleMotorCuringValuesChange,
    handleFetchCuringSchema,
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
  };
};

export default useCastingAndCuringHook;
