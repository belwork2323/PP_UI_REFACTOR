import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { operationsController } from "../../../controllers/user/operationsController";
import stfController from "../../../controllers/user/quality_control/stfController";
import { STFDetailsModel } from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  buildStaticTestingDetails,
  buildStfAddedMotors,
  createDefaultStaticTestFacilityFormState,
  createEmptyStfMotorSession,
  hasAnyStaticTestFacilityValue,
  hydrateStaticTestFacilityFormState,
  hydrateStfMotorSession,
  mapStaticTestFacilityFormStateToPayload,
  normalizeStfMotorSession,
  resolveStfFormSubTypes,
  StaticTestingDetailsPayload,
  type StaticTestFacilityFormState,
  type StfMotorSession,
} from "../../../data/models/user/StaticTestFacilityFormModel";
import {
  fetchStfSchema,
  mapStfSubType,
  toSectionSubmissions,
  type SchemaFormValues,
  type StfSubType,
} from "../../../schema-engine";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import {
  BemMotor,
  mapApprovedMotorsToOptions,
  mergeStfMockBatches,
  mergeStfMotorOptions,
  resolveBatchMotorStage,
  resolveBatchProjectId,
  resolveStfMotorCountLimit,
  resolveStfMotorOptions,
  type STFBatch,
  type StfAddedMotor,
  type StfMotorOption,
} from "./stfFlowConfig";

type WorkflowView = "list" | "form" | "details";

interface BaseHookProps {
  listParams?: {
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
    sort?: Record<string, any>;
    batches?: any[];
  };
  defaultMotorType?: StfSubType | "";
  facilityType: "ACEM" | "OTHER_BEM";
  enabled?: boolean;
}

const normalizeBatch = (batch: any): STFBatch => ({
  ...batch,
  lotId: batch?.lotId ?? "",
  stfStatus: batch?.stfStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
  formId: batch?.formId ?? null,
  subType: batch?.subType ?? "BEM",
  motorIdNo: batch?.bemNo ?? batch?.motorIdNo ?? null,
  rejectionReason: batch?.rejectionReason ?? null,
});

const normalizeBemMotor = (motor: any) => ({
  motorId: motor?.motorId ?? "",
  motorCode: motor?.motorCode ?? "",
  status: motor?.status ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
  createdBy: motor?.createdBy ?? "",
  createdOn: motor?.createdAt ?? "",
  subType: "BEM",
  rejectionReason: motor?.rejectionReason ?? null,
});

const getErrorMessage = (response: any, fallbackMessage: string): string => {
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

export const useBaseStaticTestFacility = ({
  listParams,
  defaultMotorType = "",
  facilityType,
  enabled = true,
}: BaseHookProps) => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const refreshVersion = useUserBatchRefreshStore((state) => state.version);

  const messages = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments?.find((subDept) => subDept.slugs?.subDept === "static-test-facility")
        ?.subDepartmentId,
    [user],
  );

  // State
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<STFBatch | null>(null);
  const [activeBemMotor, setActiveBemMotor] = useState<BemMotor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<StaticTestFacilityFormState>(
    createDefaultStaticTestFacilityFormState(),
  );

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify({ formData: createDefaultStaticTestFacilityFormState(), addedMotors: [] }),
  );

  const [selectedMotorType, setSelectedMotorType] = useState<StfSubType | "">(defaultMotorType);
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [draftBemNo, setDraftBemNo] = useState("");
  const [addedMotors, setAddedMotors] = useState<StfAddedMotor[]>([]);
  const [approvedMotorOptions, setApprovedMotorOptions] = useState<StfMotorOption[]>([]);
  const [approvedMotorsLoading, setApprovedMotorsLoading] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [detailsRow, setDetailsRow] = useState<Record<string, unknown> | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [fetchedBatches, setFetchedBatches] = useState<STFBatch[]>([]);
  const [fetchedBemMotors, setFetchedBemMotors] = useState<BemMotor[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(listParams?.page ?? 0);
  const [rowsPerPage, setRowsPerPage] = useState(listParams?.limit ?? 10);
  const [search, setSearch] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeMotorId, setActiveMotorId] = useState<string | null>(null);
  // Fetch Listing Data
  const loadListItems = useCallback(async () => {
    if (!enabled) return;

    setListLoading(true);

    try {
      if (facilityType === "OTHER_BEM") {
        const response = await stfController.listBemMotors({
          page: page + 1,
          limit: rowsPerPage,
          status: [],
          search,
        });

        if (response?.success && Array.isArray(response?.data?.motors)) {
          setFetchedBemMotors(response.data.motors.map(normalizeBemMotor));
        } else {
          setFetchedBemMotors([]);
        }
        setFetchedBatches([]);
      } else {
        const incoming = (listParams?.batches ?? []).map(normalizeBatch);
        setFetchedBatches(incoming);
        setFetchedBemMotors([]);
      }
    } catch (error) {
      console.error("Failed to load facility list:", error);
      setFetchedBatches([]);
      setFetchedBemMotors([]);
    } finally {
      setListLoading(false);
    }
  }, [enabled, facilityType, page, rowsPerPage, search, listParams?.batches]);

  useEffect(() => {
    if (enabled) {
      void loadListItems();
    }
  }, [loadListItems, refreshVersion, enabled]);

  // Computed Values
  const batches = useMemo(() => mergeStfMockBatches(fetchedBatches), [fetchedBatches]);
  const bemMotors = useMemo(() => fetchedBemMotors, [fetchedBemMotors]);
  const batchMotorOptions = useMemo(() => resolveStfMotorOptions(activeBatch), [activeBatch]);

  const availableMotorOptions = useMemo(
    () => mergeStfMotorOptions(approvedMotorOptions, batchMotorOptions),
    [approvedMotorOptions, batchMotorOptions],
  );

  const maxMotorCount = useMemo(
    () =>
      resolveStfMotorCountLimit({
        availableMotorOptions,
        batchNumberOfMotors: Number(activeBatch?.numberOfMotors ?? 0),
      }),
    [activeBatch?.numberOfMotors, availableMotorOptions],
  );

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        formData,
        addedMotors,
        selectedMotorType,
        draftBemNo,
      }),
    [formData, addedMotors, selectedMotorType, draftBemNo],
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot],
  );

  const resetFlowDraft = useCallback(() => {
    setMotorCount("");
    setDraftMotorIds([]);
    setDraftBemNo("");
  }, []);

  const resetFlowBarDraft = useCallback(() => {
    resetFlowDraft();
    setSchemaError(null);
  }, [resetFlowDraft]);

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultStaticTestFacilityFormState();
    setView("list");
    setActiveBatch(null);
    setActiveBemMotor(null);
    setIsEditMode(false);
    setFormData(defaults);

    setInitialSnapshot(
      JSON.stringify({ formData: defaults, addedMotors: [], selectedMotorType: defaultMotorType }),
    );

    setSelectedMotorType(defaultMotorType);
    setAddedMotors([]);
    setApprovedMotorOptions([]);
    setApprovedMotorsLoading(false);
    resetFlowDraft();
    setLoadingFormDetails(false);
    setSchemaLoading(false);
    setSchemaError(null);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setDetailsRow(null);
    setDetailsData(null);
    setDetailsLoading(false);
  }, [defaultMotorType, resetFlowDraft]);

  // Fetch Approved Motors for ACEM
  useEffect(() => {
    if (facilityType === "OTHER_BEM") return;

    const projectId = resolveBatchProjectId(activeBatch);
    const motorStage = resolveBatchMotorStage(activeBatch);

    if (!activeBatch || !projectId || !motorStage) {
      setApprovedMotorOptions([]);
      return;
    }

    let isMounted = true;
    setApprovedMotorsLoading(true);

    void operationsController
      .fetchApprovedMotorsList({ projectId, motorStage })
      .then((response) => {
        if (!isMounted) return;

        if (response?.success && response.data) {
          setApprovedMotorOptions(mapApprovedMotorsToOptions(response.data.motors ?? []));
        } else {
          setApprovedMotorOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) setApprovedMotorsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeBatch, facilityType]);

  // Fetch Schema Document
  const fetchStfSchemaDocument = useCallback(
    async (subType: StfSubType, options?: { silent?: boolean }) => {
      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return null;
      }

      const cached = formDataRef.current.schemasBySubType?.[subType];
      if (cached) return cached;

      const silent = options?.silent ?? false;
      if (!silent) {
        setSchemaLoading(true);
        setSchemaError(null);
      }
      console.log(subType);

      try {
        const response = await fetchStfSchema({ subDepartmentId, subType });

        if (!response?.success || !response?.data) {
          const message = getErrorMessage(response, messages.SCHEMA_FETCH_ERROR);
          setSchemaError(message);
          if (!silent) showAlert(message, "error");
          return null;
        }

        return response.data;
      } finally {
        if (!silent) setSchemaLoading(false);
      }
    },
    [messages.SCHEMA_FETCH_ERROR, messages.SUB_DEPARTMENT_MISSING, showAlert, subDepartmentId],
  );

  const handleCreateNewBem = useCallback(async () => {
    setView("form");
    setIsEditMode(false);
    setActiveBatch(null);
    setActiveBemMotor(null);
    setDraftBemNo("");

    const schemaData = await fetchStfSchemaDocument("BEM");
    if (!schemaData) return;

    const initialFormState: StaticTestFacilityFormState = {
      ...createDefaultStaticTestFacilityFormState(),
      stfSchema: schemaData,
      schemaFormLoaded: true,
      subType: "BEM",
      schemasBySubType: { BEM: schemaData },
      motors: [],
    };

    setFormData(initialFormState);
    setInitialSnapshot(
      JSON.stringify({
        formData: initialFormState,
        addedMotors: [],
        selectedMotorType: "BEM",
        draftBemNo: "",
      }),
    );
  }, [fetchStfSchemaDocument]);

  const appendMotorsToForm = useCallback(
    async (motorIds: string[], subType: StfSubType) => {
      if (facilityType !== "OTHER_BEM" && !activeBatch) return false;
      if (motorIds.length === 0) return false;

      const schema = await fetchStfSchemaDocument(subType);
      if (!schema) return false;

      const newMotorSessions: StfMotorSession[] = motorIds
        .filter((id) => id.trim())
        .map((id) => hydrateStfMotorSession(createEmptyStfMotorSession(id, subType), schema));

      setFormData((prev) => {
        const existing = (prev.motors ?? []).map((m) => normalizeStfMotorSession(m));
        const nextMotors = [
          ...existing,
          ...newMotorSessions.filter((nm) => !existing.some((em) => em.motorId === nm.motorId)),
        ];

        return {
          ...prev,
          subType: prev.subType ?? subType,
          schemasBySubType: {
            ...(prev.schemasBySubType ?? {}),
            [subType]: schema,
          },
          stfSchema: prev.stfSchema ?? schema,
          motors: nextMotors,
          schemaFormLoaded: nextMotors.length > 0,
        };
      });

      setAddedMotors((prev) => {
        const existingIds = new Set(prev.map((m) => m.motorId));
        return [
          ...prev,
          ...motorIds.filter((id) => !existingIds.has(id)).map((motorId) => ({ motorId, subType })),
        ];
      });

      resetFlowBarDraft();
      return true;
    },
    [activeBatch, facilityType, fetchStfSchemaDocument, resetFlowBarDraft],
  );

  const handleMotorTypeChange = useCallback(
    (value: string) => {
      const nextType = value ? mapStfSubType(value) : "";
      setSelectedMotorType(nextType);
      setSchemaError(null);
      resetFlowDraft();
    },
    [resetFlowDraft],
  );

  const handleMotorCountChange = useCallback((count: number | "") => {
    setMotorCount(count);
    setDraftMotorIds((prev) => {
      const nextCount = count === "" ? 0 : Number(count);
      if (nextCount <= 0) return [];
      return Array.from({ length: nextCount }, (_, idx) => prev[idx] ?? "");
    });
  }, []);

  const handleDraftMotorIdChange = useCallback((index: number, motorId: string) => {
    setDraftMotorIds((prev) => {
      const next = [...prev];
      next[index] = motorId;
      return next;
    });
  }, []);

  const handleDraftBemNoChange = useCallback((value: string) => {
    setDraftBemNo(value);
  }, []);

  const validateAndExtractDraftMotors = useCallback((): {
    ids: string[];
    type: StfSubType;
  } | null => {
    if (!selectedMotorType) return null;

    if (selectedMotorType === "MAIN_MOTOR") {
      const count = motorCount === "" ? 0 : Number(motorCount);
      const effectiveCount = count > 0 ? count : draftMotorIds.some((id) => id.trim()) ? 1 : 0;

      if (effectiveCount <= 0) return null;

      const selectedIds = Array.from({ length: effectiveCount }, (_, idx) =>
        String(draftMotorIds[idx] ?? "").trim(),
      ).filter(Boolean);

      if (selectedIds.length !== effectiveCount) return null;
      if (new Set(selectedIds).size !== selectedIds.length) return null;

      const usedIds = new Set(addedMotors.map((m) => m.motorId));
      const newIds = selectedIds.filter((id) => !usedIds.has(id));

      if (newIds.length === 0) return null;

      return { ids: newIds, type: "MAIN_MOTOR" };
    }

    const bemNo = String(draftBemNo ?? "").trim();
    if (!bemNo) return null;

    const usedIds = new Set(addedMotors.map((m) => m.motorId));
    if (usedIds.has(bemNo)) return null;

    return { ids: [bemNo], type: "BEM" };
  }, [addedMotors, draftBemNo, draftMotorIds, motorCount, selectedMotorType]);

  const handleLoadStfForm = useCallback(async () => {
    const valid = validateAndExtractDraftMotors();
    if (!valid) return false;
    return appendMotorsToForm(valid.ids, valid.type);
  }, [appendMotorsToForm, validateAndExtractDraftMotors]);

  const handleAddMotors = useCallback(async () => {
    const valid = validateAndExtractDraftMotors();
    if (!valid) return false;
    return appendMotorsToForm(valid.ids, valid.type);
  }, [appendMotorsToForm, validateAndExtractDraftMotors]);

  const handleRemoveMotor = useCallback(
    (motorId: string) => {
      setFormData((prev) => {
        const nextMotors = (prev.motors ?? []).filter((m) => m.motorId !== motorId);
        return {
          ...prev,
          motors: nextMotors,
          schemaFormLoaded: nextMotors.length > 0,
        };
      });

      setAddedMotors((prev) => prev.filter((m) => m.motorId !== motorId));
      resetFlowDraft();
    },
    [resetFlowDraft],
  );

  const handleFormValuesChange = useCallback((motorId: string, values: SchemaFormValues) => {
    setFormData((prev) => {
      if (!prev.motors || prev.motors.length === 0) {
        return {
          ...prev,
          schemaFormValues: values,
        };
      }

      return {
        ...prev,
        motors: prev.motors.map((motor) =>
          motor.motorId === motorId ? { ...motor, schemaFormValues: values } : motor,
        ),
      };
    });
  }, []);

  // Main Form Initialization & Detail Fetch
  const openFormWithResolvedData = useCallback(
    async (batch: STFBatch | BemMotor, editMode: boolean) => {
      const isOtherBem = facilityType === "OTHER_BEM";
      const bemMotorObj = batch as BemMotor;
      const stfBatchObj = batch as STFBatch;

      // 1. Resolve target ID safely across schema variants
      let resolvedFormId = stfBatchObj.formId || null;
      console.log("bem:", bemMotorObj);
      console.log("stf:", stfBatchObj);

      // const rawStatus = isOtherBem ? bemMotorObj.status : stfBatchObj.stfStatus;
      const normalizeStatus = (status?: string) =>
        (status || "").trim().toUpperCase().replace(/\s+/g, "_");

      const currentStatus = normalizeStatus(
        isOtherBem ? bemMotorObj.status : stfBatchObj.stfStatus,
      );

      const shouldFetchDetails =
        editMode ||
        currentStatus === normalizeStatus(QUALITY_CONTROL_STATUS.IN_PROGRESS) ||
        currentStatus === normalizeStatus(QUALITY_CONTROL_STATUS.REJECTED);

      let resolvedData = createDefaultStaticTestFacilityFormState();
      let rejectionReason = batch.rejectionReason ?? null;
      let fetchedBemNo = stfBatchObj.motorIdNo ?? bemMotorObj.motorId ?? "";
      let detailsResponse: any = null;

      const initialMotorType: StfSubType =
        (batch.subType as StfSubType) || defaultMotorType || "BEM";

      console.log(shouldFetchDetails);

      if (shouldFetchDetails) {
        console.log("api");
        if (!isOtherBem && !subDepartmentId) {
          showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
          return;
        }

        // if (!resolvedFormId) {
        //   showAlert(messages.FORM_ID_MISSING, "error");
        //   return;
        // }

        setLoadingFormDetails(true);

        try {
          detailsResponse = isOtherBem
            ? await stfController.getBemMotorDetails({ motorId: fetchedBemNo })
            : await stfController.fetchFormDetails({
                formId: resolvedFormId,
                subDepartmentId: subDepartmentId!,
              });
        } catch (err) {
          showAlert(messages.DETAILS_FETCH_ERROR, "error");
          return;
        } finally {
          setLoadingFormDetails(false);
        }

        if (!detailsResponse?.success || !detailsResponse.data) {
          const fallback =
            detailsResponse?.statusCode === 404
              ? messages.DETAILS_NOT_FOUND
              : messages.DETAILS_FETCH_ERROR;

          showAlert(getErrorMessage(detailsResponse, fallback), "error");
          return;
        }

        // 3. Transform API response into Schema Form State
        if (isOtherBem) {
          const bemDetails = detailsResponse.data;
          fetchedBemNo = bemDetails.bemNo || bemDetails.motorId || fetchedBemNo;
          setDraftBemNo(fetchedBemNo);

          // Fetch JSON Schema for the form render
          const schema = await fetchStfSchemaDocument("BEM");
          const staticTestingDetails = bemDetails.staticTestingDetails || {};

          // Safely flatten form section values
          const sectionValues = (staticTestingDetails.formSections || []).reduce(
            (acc: Record<string, any>, sec: any) => ({
              ...acc,
              ...(sec?.values || {}),
            }),
            {},
          );

          const formValues: SchemaFormValues = {
            bemNo: fetchedBemNo,
            ...staticTestingDetails,
            ...sectionValues,
          };

          resolvedData = {
            subType: "BEM",
            schemaFormLoaded: Boolean(schema),
            stfSchema: schema ?? undefined,
            schemaFormValues: formValues,
            schemasBySubType: schema ? { BEM: schema } : {},
            motors: [
              {
                motorId: fetchedBemNo,
                subType: "BEM",
                schemaFormValues: formValues,
              },
            ],
            motorId: bemDetails.bemMotorId || resolvedFormId,
            bemNo: fetchedBemNo,
          };
        } else {
          resolvedData = STFDetailsModel.toFormState(detailsResponse.data);
        }

        resolvedFormId = detailsResponse.data.formId;
        rejectionReason = detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
      }

      // 4. Resolve Active Motors & UI View State
      const nextMotorType: StfSubType | null = resolvedData.subType ?? (initialMotorType || null);
      const nextAddedMotors = buildStfAddedMotors(resolvedData);
      const subTypesToHydrate = resolveStfFormSubTypes(resolvedData);

      if (isOtherBem) {
        setActiveBemMotor({
          ...bemMotorObj,
          motorId: fetchedBemNo,
          bemNo: fetchedBemNo,
        });
      } else {
        setActiveBatch({
          ...stfBatchObj,
          formId: resolvedFormId,
          subType: nextMotorType,
          rejectionReason,
        });
      }

      setSelectedMotorType(nextMotorType ?? subTypesToHydrate[0] ?? defaultMotorType);
      setAddedMotors(nextAddedMotors);
      setIsEditMode(editMode);
      setView("form");
      resetFlowDraft();

      // 5. Schema Hydration for Multi-subtype Batches
      if (!isOtherBem && subTypesToHydrate.length > 0) {
        let hydrated = resolvedData;
        for (const subType of subTypesToHydrate) {
          const schema = await fetchStfSchemaDocument(subType, { silent: true });
          if (!schema) continue;
          hydrated = hydrateStaticTestFacilityFormState(hydrated, schema, subType);
        }

        setFormData(hydrated);
        setInitialSnapshot(
          JSON.stringify({
            formData: hydrated,
            addedMotors: nextAddedMotors,
            selectedMotorType: nextMotorType ?? subTypesToHydrate[0] ?? defaultMotorType,
            draftBemNo: fetchedBemNo,
          }),
        );
        return;
      }

      setFormData(resolvedData);
      setInitialSnapshot(
        JSON.stringify({
          formData: resolvedData,
          addedMotors: nextAddedMotors,
          selectedMotorType: nextMotorType ?? defaultMotorType,
          draftBemNo: fetchedBemNo,
        }),
      );
    },
    [
      defaultMotorType,
      facilityType,
      fetchStfSchemaDocument,
      messages,
      resetFlowDraft,
      showAlert,
      subDepartmentId,
    ],
  );
  const handleFillForm = useCallback(
    async (batch: STFBatch | BemMotor) => {
      await openFormWithResolvedData(batch, false);
    },
    [openFormWithResolvedData],
  );

  const handleEditForm = useCallback(
    async (batch: STFBatch | BemMotor) => {
      await openFormWithResolvedData(batch, true);
    },
    [openFormWithResolvedData],
  );

  const handleBack = () => {
    if (view === "form" && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }

    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const handleDiscardAndBack = () => {
    setBackConfirmOpen(false);
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  // Submit Logic
  const submitForm = async (intent: "draft" | "submit") => {
    if (facilityType !== "OTHER_BEM" && !subDepartmentId) {
      showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    setActionLoading(true);

    try {
      let response;

      // 1. SINGLE BEM MOTOR FLOW (OTHER_BEM)
      if (facilityType === "OTHER_BEM") {
        const bemNo = draftBemNo?.trim() || formData.schemaFormValues?.bemNo;

        if (!bemNo) {
          showAlert("Please enter BEM Number", "warning");
          return false;
        }

        const isBemUpdate = Boolean(activeBemMotor?.motorId || formData?.motorId);

        const rawValues =
          formData?.motors?.[0]?.schemaFormValues ?? formData?.schemaFormValues ?? {};
        console.log(formData);

        // Build staticTestingDetails containing only { formSections: [...] }
        const staticTestingDetails = buildStaticTestingDetails(rawValues);

        // Structure single motor inside an array to match the backend payload schema
        const bemMotorsPayload = {
          motorId: bemNo as string,
          subType: "BEM",
          staticTestingDetails,
        };

        if (isBemUpdate) {
          response = await stfController.updateBemMotor({
            ...bemMotorsPayload,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          });
        } else {
          response = await stfController.createBemMotor({
            ...bemMotorsPayload,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          });
        }
      }
      // 2. BATCH / MULTIPLE MOTORS FLOW
      else {
        if (!activeBatch) return false;

        if ((formData.motors ?? []).length === 0) {
          showAlert(messages.EMPTY_FORM_ERROR, "warning");
          return false;
        }

        const subTypes = resolveStfFormSubTypes(formData);
        if (subTypes.length === 0) {
          showAlert(messages.EMPTY_FORM_ERROR, "warning");
          return false;
        }

        if (!subTypes.every((subType) => formData.schemasBySubType?.[subType])) {
          showAlert(messages.SCHEMA_NOT_LOADED, "warning");
          return false;
        }

        if (!hasAnyStaticTestFacilityValue(formData)) {
          showAlert(messages.EMPTY_FORM_ERROR, "warning");
          return false;
        }

        const mapped = mapStaticTestFacilityFormStateToPayload(formData);
        const isCreateFlow =
          activeBatch.stfStatus === QUALITY_CONTROL_STATUS.TO_BE_INITIATED && !activeBatch.formId;

        if (isCreateFlow) {
          if (!activeBatch.batchId) {
            showAlert(messages.BATCH_ID_MISSING, "error");
            return false;
          }

          response = await stfController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId: subDepartmentId!,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            motors: mapped.motors,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(messages.FORM_ID_MISSING, "error");
            return false;
          }

          response = await stfController.updateForm({
            formId: activeBatch.formId,
            batchId: activeBatch.batchId ?? "",
            subDepartmentId: subDepartmentId!,
            formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
            motors: mapped.motors,
          });
        }
      }

      if (!response?.success) {
        showAlert(getErrorMessage(response, messages.CREATE_FAILED), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch?.formId ?? null;

      if (activeBatch) {
        setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
      }

      setInitialSnapshot(formSnapshot);

      if (intent === "draft") {
        showAlert(messages.CREATE_DRAFT_SUCCESS, "success", { autoCloseMs: 2200 });
        setHasSavedDraft(true);
      } else {
        showAlert(messages.CREATE_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
        bumpBatchRefresh();
        resetFormContext();
      }

      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async () => submitForm("draft");
  const handleSubmit = async () => submitForm("submit");

  // Fetch & View Details
  const handleViewDetails = useCallback(
    async (row: STFBatch | BemMotor) => {
      const targetId = (row as STFBatch).formId;

      if (!targetId) {
        showAlert(messages.FORM_ID_MISSING, "error");
        return;
      }

      setDetailsLoading(true);

      try {
        // 1. Fetch Details API
        const response =
          facilityType === "OTHER_BEM"
            ? await stfController.getBemMotorDetails({ motorId: targetId })
            : await stfController.fetchFormDetails({
                formId: targetId,
                subDepartmentId: subDepartmentId ?? 0,
              });

        if (!response?.success || !response?.data) {
          showAlert(response?.message || messages.DETAILS_FETCH_ERROR, "error");
          return;
        }

        setDetailsRow(row as Record<string, unknown>);

        // 2. Fetch Schema & Hydrate for Read-Only Display
        if (facilityType === "OTHER_BEM") {
          const bemDetails = response.data;
          const schema = await fetchStfSchemaDocument("BEM");
          const staticTestingDetails = bemDetails.staticTestingDetails || {};

          // Merge section field values into unified schema value map
          const detailsValues: SchemaFormValues = {
            bemNo: bemDetails.bemNo || bemDetails.motorId || "",
            ...staticTestingDetails,
            ...(staticTestingDetails.formSections
              ? Object.assign(
                  {},
                  ...staticTestingDetails.formSections.map((sec: any) => sec.values || {}),
                )
              : {}),
          };

          setDetailsData({
            ...bemDetails,
            schema,
            schemaFormValues: detailsValues,
          });
        } else {
          setDetailsData(response.data);
        }

        // 3. Switch to Details View
        setView("details");
      } catch (error) {
        console.error("Error viewing details:", error);
        showAlert(messages.DETAILS_FETCH_ERROR, "error");
      } finally {
        setDetailsLoading(false);
      }
    },
    [showAlert, subDepartmentId, messages, facilityType, fetchStfSchemaDocument],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
  }, []);

  return {
    ...listParams,
    facilityType,
    batches,
    bemMotors,
    loading: listLoading,
    refetchList: loadListItems,
    view,
    activeBatch,
    activeBemMotor,
    isEditMode,
    formData,
    isFormDirty,
    selectedMotorType,
    motorCount,
    draftMotorIds,
    draftBemNo,
    addedMotors,
    availableMotorOptions,
    maxMotorCount,
    approvedMotorsLoading,
    loadingFormDetails,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleMotorTypeChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleDraftBemNoChange,
    handleLoadStfForm,
    handleAddMotors,
    handleRemoveMotor,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewDetails,
    handleBackFromDetails,
    handleCreateNewBem,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    search,
    setSearch,
    totalRecords,
    handleBackFromForm: handleBack,
    onFormValuesChange: handleFormValuesChange,
  };
};
