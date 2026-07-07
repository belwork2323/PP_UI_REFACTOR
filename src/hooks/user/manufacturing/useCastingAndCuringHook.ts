import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import castingCuringController from "../../../controllers/user/manufacturing/castingCuringController";
import {
  applyMotorCuringValuesMap,
  buildMotorCuringValuesMapFromSessions,
  createDefaultCastingCuringFormState,
  createDefaultCastingProcessSetup,
  createEmptyMotorSession,
  hasAnyCastingCuringValue,
  hydrateCastingCuringFormState,
  mapCastingCuringDetailsToFormState,
  mapCastingCuringFormStateToPayload,
  normalizeCastingCuringMotorId,
  type CastingCuringFormState,
  type CastingCuringMotorSession,
  type CastingProcessSetup,
  type CuringProcessSetup,
  createDefaultCuringProcessSetup,
} from "../../../data/models/user/CastingCuringFormModel";
import {
  buildCastingCuringSchemaRequest,
  castingCuringCastingSchemaFetchConfig,
  castingCuringCuringSchemaFetchConfig,
  createCastingCuringInitialValues,
  buildCastingSetupContext,
  schemaEngineController,
  type SchemaFormValues,
} from "../../../schema-engine";
import { cloneValue } from "../../../schema-engine/state/formState";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import {
  filterUnusedCastingCuringMotorOptions,
  getSelectedCastingDraftMotorIds,
  resolveCastingCuringMotorOptions,
  resolveCastingMotorCount,
  resolveMotorStage,
  canLoadCuringForm,
  isMotorCastingComplete,
  type CastingCuringAddedMotor,
  type CastingCuringMotorOption,
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
  const [castingStation, setCastingStation] = useState("");
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [motorReceivedAt, setMotorReceivedAt] = useState("");
  const [castingSetupDraft, setCastingSetupDraft] = useState<CastingProcessSetup>(
    createDefaultCastingProcessSetup(),
  );
  const [addedMotors, setAddedMotors] = useState<CastingCuringAddedMotor[]>([]);
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [curingSetupDrafts, setCuringSetupDrafts] = useState<Record<string, CuringProcessSetup>>({});
  const [motorCuringValuesById, setMotorCuringValuesById] = useState<Record<string, SchemaFormValues>>({});

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        castingType,
        castingStation,
        castingSetupDraft,
        addedMotors,
      }),
    [formData, castingType, castingStation, castingSetupDraft, addedMotors],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setCastingType("");
    setCastingStation("");
    setMotorCount("");
    setDraftMotorIds([]);
    setMotorReceivedAt("");
    setCastingSetupDraft(createDefaultCastingProcessSetup());
    setAddedMotors([]);
    setActiveMotorIndex(0);
    setCuringSetupDrafts({});
    setMotorCuringValuesById({});
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
    setMotorCuringValuesById({});
    resetFlowDraft();
    setInitialSnapshot(
      JSON.stringify({
        formData: defaults,
        castingType: "",
        castingStation: "",
        castingSetupDraft: createDefaultCastingProcessSetup(),
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

      if (shouldFetchDetails) {
        if (!subDepartmentId) {
          showAlert(STRINGS.MANUFACTURING.CASTING_CURING.SUB_DEPARTMENT_MISSING, "error");
          return;
        }
        if (!batch.formId) {
          showAlert(STRINGS.MANUFACTURING.CASTING_CURING.FORM_ID_MISSING, "error");
          return;
        }

        setLoadingFormDetails(true);
        try {
          const detailsResponse = await castingCuringController.fetchFormDetails({
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

          nextBatch = { ...batch, formId: detailsResponse.data.formId || batch.formId };
          nextFormData = mapCastingCuringDetailsToFormState(
            detailsResponse.data?.castingCuringDetails ?? detailsResponse.data,
          );

          const { castingSchema, curingSchema } = await fetchSchemas(nextBatch);
          nextFormData = hydrateCastingCuringFormState(nextFormData, castingSchema, curingSchema);
        } finally {
          setLoadingFormDetails(false);
        }
      }

      const nextAddedMotors = buildAddedMotorsFromForm(nextFormData);

      setActiveBatch(nextBatch);
      setIsEditMode(editMode);
      setFormData(nextFormData);
      setMotorCuringValuesById(buildMotorCuringValuesMapFromSessions(nextFormData.motors ?? []));
      if (nextFormData.castingFormLoaded) {
        setCastingType("");
        setCastingStation("");
        setCastingSetupDraft(createDefaultCastingProcessSetup());
      } else {
        setCastingType(nextFormData.castingType);
        setCastingStation(nextFormData.castingStation);
        setCastingSetupDraft(nextFormData.castingSetup);
      }
      setAddedMotors(nextAddedMotors);
      setMotorCount("");
      setDraftMotorIds([]);
      setMotorReceivedAt("");
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
          castingStation: nextFormData.castingFormLoaded ? "" : nextFormData.castingStation,
          castingSetupDraft: nextFormData.castingFormLoaded
            ? createDefaultCastingProcessSetup()
            : nextFormData.castingSetup,
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
    const count = resolveCastingMotorCount(castingType, motorCount);
    if (count !== 1) return;

    const motorOptions = filterUnusedCastingCuringMotorOptions(
      resolveCastingCuringMotorOptions(activeBatch),
      addedMotors.map((motor) => motor.motorId),
    );
    if (motorOptions.length !== 1) return;

    const singleId = motorOptions[0]?.value ?? "";
    if (!singleId) return;

    setDraftMotorIds((prev) => (prev[0] === singleId ? prev : [singleId]));
  }, [view, activeBatch, castingType, motorCount, addedMotors]);

  const handleLoadCastingForm = useCallback(async () => {
    if (!activeBatch) return;

    const count = resolveCastingMotorCount(castingType, motorCount);
    if (count <= 0) return;

    const selectedIds = getSelectedCastingDraftMotorIds(count, draftMotorIds);
    if (!motorReceivedAt.trim()) return;

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

    if (motorOptions.length > 0 && selectedIds.some((id) => !unusedMotorIds.has(id))) {
      showAlert("Select motor IDs that have not already been added.", "warning");
      return;
    }

    if (motorOptions.length > 0 && selectedIds.length !== count) {
      showAlert("Select all motor IDs before loading the form.", "warning");
      return;
    }

    const setupSnapshot = { ...castingSetupDraft };
    const setupContext = buildCastingSetupContext({
      finalMixCount: setupSnapshot.finalMixCount,
      castingType,
      castingStation,
    });
    const castingMeta = {
      castingType,
      castingStation,
      castingSetup: setupSnapshot,
    };
    const existingIds = new Set(addedMotors.map((motor) => motor.motorId));
    const newIds = selectedIds.filter((id) => !existingIds.has(id));
    const isFirstLoad = !formData.castingFormLoaded;

    const newSessions: CastingCuringMotorSession[] = newIds.map((motorId) =>
      createEmptyMotorSession(motorId, motorReceivedAt.trim(), castingSchema, setupContext, castingMeta),
    );

    const nextFormData = hydrateCastingCuringFormState(
      {
        ...formData,
        ...(isFirstLoad
          ? {
              castingType,
              castingStation,
              castingSetup: setupSnapshot,
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
      ...newIds.map((motorId) => ({
        motorId,
        motorReceivedAt: motorReceivedAt.trim(),
      })),
    ];

    setFormData(nextFormData);
    setMotorCuringValuesById(buildMotorCuringValuesMapFromSessions(nextFormData.motors ?? []));
    setAddedMotors(nextAdded);
    setCastingType("");
    setCastingStation("");
    setCastingSetupDraft(createDefaultCastingProcessSetup());
    setMotorReceivedAt("");
    setDraftMotorIds([]);
    setMotorCount("");
    setCuringSetupDrafts((prev) => ({
      ...prev,
      ...Object.fromEntries(newIds.map((motorId) => [motorId, createDefaultCuringProcessSetup()])),
    }));
    if (newIds.length > 0) {
      setActiveMotorIndex(nextAdded.length - newIds.length);
    }
  }, [
    activeBatch,
    castingSetupDraft,
    castingStation,
    castingType,
    draftMotorIds,
    fetchCastingSchema,
    formData,
    motorCount,
    motorReceivedAt,
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

  const handleRemoveLoadedCastingForm = useCallback(() => {
    setCastingType("");
    setCastingStation("");
    setCastingSetupDraft(createDefaultCastingProcessSetup());
    setDraftMotorIds([]);
    setMotorReceivedAt("");
    setMotorCount("");
    setAddedMotors([]);
    setActiveMotorIndex(0);
    setCuringSetupDrafts({});

    setFormData((prev) => ({
      ...prev,
      castingFormLoaded: false,
      readyForCuring: false,
      motors: [],
      curingFormValues: {},
    }));
    setMotorCuringValuesById({});
  }, []);

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

      const setupSnapshot = { ...draft };
      const targetMotor = (formData.motors ?? []).find(
        (motor) => normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId,
      );
      if (!targetMotor) return;

      const setupContext = buildCastingSetupContext({
        ...(targetMotor.castingSetup ?? formData.castingSetup),
        castingType: targetMotor.castingType ?? formData.castingType,
        castingStation: targetMotor.castingStation ?? formData.castingStation,
      });
      const nextCuringFormValues = cloneValue(
        createCastingCuringInitialValues(curingSchema, setupContext),
      );

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
    [activeBatch, curingSetupDrafts, fetchCuringSchema, formData],
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

  const handleSetupDraftChange = useCallback(
    (field: keyof CastingProcessSetup, value: string) => {
      setCastingSetupDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleMotorSessionChange = useCallback(
    (motorId: string, nextMotor: CastingCuringMotorSession) => {
      const normalizedMotorId = normalizeCastingCuringMotorId(motorId);
      const nextCuringFormValues = nextMotor.curingFormValues
        ? cloneValue(nextMotor.curingFormValues)
        : nextMotor.curingFormValues;

      setFormData((prev) => ({
        ...prev,
        motors: (prev.motors ?? []).map((motor) =>
          normalizeCastingCuringMotorId(motor.motorId) === normalizedMotorId
            ? {
                ...nextMotor,
                curingFormValues: nextCuringFormValues,
              }
            : motor,
        ),
      }));

      if (nextCuringFormValues) {
        setMotorCuringValuesById((prev) => ({
          ...prev,
          [normalizedMotorId]: cloneValue(nextCuringFormValues),
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

      const payloadForm = applyMotorCuringValuesMap(formData, motorCuringValuesById);
      const status = parseStatus(activeBatch.ccStatus);
      const isCreateFlow = status === parseStatus(CC_STATUS.INITIATED) && !activeBatch.formId;
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
      castingStation,
      castingType,
      formData,
      formSnapshot,
      motorCuringValuesById,
      showAlert,
      listParams,
      resetFormContext,
      subDepartmentId,
    ],
  );

  const handleSaveDraft = useCallback(async () => submitForm("draft"), [submitForm]);
  const handleSubmit = useCallback(async () => submitForm("submit"), [submitForm]);

  const handleSaveCastingAndContinue = useCallback(
    async (motorId: string) => {
      const motorSession = (formData.motors ?? []).find((motor) => motor.motorId === motorId);
      if (!motorSession || !formData.castingSchema) {
        return false;
      }

      if (!isMotorCastingComplete(formData.castingSchema, motorSession.formValues ?? {})) {
        showAlert(STRINGS.MANUFACTURING.CASTING_CURING.CASTING_INCOMPLETE_FOR_CURING, "warning");
        return false;
      }

      const saved = await submitForm("draft");
      if (!saved) {
        return false;
      }

      let curingSchema = formData.curingSchema;
      if (activeBatch && !curingSchema) {
        curingSchema = await fetchCuringSchema(activeBatch);
      }

      setFormData((prev) => ({
        ...prev,
        curingSchema: curingSchema ?? prev.curingSchema,
        motors: (prev.motors ?? []).map((motor) =>
          motor.motorId === motorId ? { ...motor, castingSavedForCuring: true } : motor,
        ),
      }));

      return true;
    },
    [
      activeBatch,
      fetchCuringSchema,
      formData.castingSchema,
      formData.curingSchema,
      formData.motors,
      showAlert,
      submitForm,
    ],
  );

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
  }, []);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
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
    subDepartmentId,
    castingType,
    castingStation,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    castingSetupDraft,
    addedMotors,
    activeMotorIndex,
    setActiveMotorIndex,
    backConfirmOpen,
    setBackConfirmOpen,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    setCastingType,
    setCastingStation,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    setMotorReceivedAt,
    handleSetupDraftChange,
    handleLoadCastingForm,
    handleAddMotors,
    handleRemoveLoadedCastingForm,
    handleLoadCuringForm,
    getCuringSetupDraft,
    getMotorCuringFormValues,
    handleCuringSetupDraftChange,
    handleMotorCuringValuesChange,
    handleFetchCuringSchema,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleSaveDraft,
    handleSubmit,
    handleSaveCastingAndContinue,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewCastingCuringDetails,
    handleBackFromDetails,
  };
};

export default useCastingAndCuringHook;
