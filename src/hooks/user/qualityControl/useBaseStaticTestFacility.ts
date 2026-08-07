import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { operationsController } from "../../../controllers/user/operationsController";
import stfController from "../../../controllers/user/quality_control/stfController";
import { STFDetailsModel } from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  buildStaticTestingDetails,
  buildStfAddedMotors,
  createDefaultStaticTestFacilityFormState,
  createEmptyStfMotorSession,
  hasAnyStaticTestFacilityValue,
  hasMotorStaticTestFacilityValue,
  hydrateStaticTestFacilityFormState,
  hydrateStfMotorSession,
  isStfMotorEditable,
  mapBemDetailsResponseToFormState,
  mapStaticTestFacilityFormStateToPayload,
  mapStfDetailsFromSavedForm,
  mapStfMotorStatusesFromApi,
  mapStfTestNoByMotorIdFromApi,
  applyStfTestNoToFormMotors,
  normalizeStfMotorSession,
  resolveStfFormSubTypes,
  resolveStfNavigationMotors,
  type StaticTestFacilityFormState,
  type StfMotorSession,
  type StfMotorStatusMeta,
  type StfMotorSubmissionStatus,
  type StfMotorSubmissionType,
} from "../../../data/models/user/StaticTestFacilityFormModel";
import { normalizeSubdepartmentBatchStatus } from "../../../data/models/user/SubdepartmentBatchModel";
import {
  fetchStfSchema,
  mapStfSubType,
  type SchemaFormValues,
  type StfSubType,
} from "../../../schema-engine";
import { QUALITY_CONTROL_STATUS } from "./qualityControlWorkflowData";
import {
  toOperationStatusApiValue,
} from "../../operationStatus";
import {
  isMotorEnabledByPreviousStage,
  resolvePreviousStageApprovedUnits,
  type PreviousStageApprovedUnits,
} from "../previousStageApproval";
import {
  BemMotor,
  mapApprovedMotorsToOptions,
  mapBemMotorStatusCountsForUi,
  mergeStfMockBatches,
  mergeStfMotorOptions,
  resolveBatchMotorStage,
  resolveBatchProjectId,
  resolveBemMotorOptionsFromBatchDetails,
  resolveBemMotorStatusTabs,
  resolveStfBatchMotorEntries,
  resolveStfMotorCountLimit,
  resolveStfMotorOptions,
  resolveStfWorkingBatchType,
  resolveStfWorkingSubBatchType,
  shouldSeedStfMainMotors,
  shouldShowStfBemMotorSelection,
  isStfMotorEnabledForWorkflow,
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
    loading?: boolean;
    isRefreshing?: boolean;
    statusCounts?: Record<string, number>;
    totalRecords?: number;
    search?: string;
    statusFilter?: string;
    setPage?: (page: number) => void;
    setRowsPerPage?: (rows: number) => void;
    setSearch?: (search: string) => void;
    setStatusFilter?: (status: string) => void;
    [key: string]: unknown;
  };
  defaultMotorType?: StfSubType | "";
  facilityType: "ACEM" | "OTHER_BEM";
  enabled?: boolean;
}

const normalizeBatch = (batch: any): STFBatch => {
  const batchType = batch?.batchType ?? null;
  const subBatchType = batch?.subBatchType ?? null;
  return {
    ...batch,
    lotId: batch?.lotId ?? "",
    batchType,
    subBatchType,
    stfStatus: batch?.stfStatus ?? batch?.status ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
    formId: batch?.formId ?? null,
    subType:
      batch?.subType ??
      (shouldSeedStfMainMotors(batchType, subBatchType) ? "MAIN_MOTOR" : "BEM"),
    motorIdNo: batch?.bemNo ?? batch?.motorIdNo ?? null,
    rejectionReason: batch?.rejectionReason ?? null,
  };
};

const normalizeBemMotor = (motor: any) => ({
  motorId: motor?.motorId ?? "",
  motorCode: motor?.motorCode ?? "",
  stfTestNo: motor?.stfTestNo ?? "",
  status: normalizeSubdepartmentBatchStatus(
    motor?.status ?? motor?.operationStatus ?? QUALITY_CONTROL_STATUS.TO_BE_INITIATED,
  ),
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

const mergeMotorsFromBatchAndForm = (
  batchEntries: StfAddedMotor[],
  formData: StaticTestFacilityFormState,
): { formData: StaticTestFacilityFormState; addedMotors: StfAddedMotor[] } => {
  if (!batchEntries.length) {
    return {
      formData,
      addedMotors: buildStfAddedMotors(formData),
    };
  }

  const fromFormById = new Map(
    (formData.motors ?? []).map((motor) => [motor.motorId, normalizeStfMotorSession(motor)]),
  );
  const batchIds = new Set(batchEntries.map((entry) => entry.motorId));

  const motors: StfMotorSession[] = batchEntries.map((entry) => {
    const existing = fromFormById.get(entry.motorId);
    if (existing) return existing;
    return createEmptyStfMotorSession(entry.motorId, entry.subType);
  });

  (formData.motors ?? []).forEach((motor) => {
    if (!batchIds.has(motor.motorId)) {
      motors.push(normalizeStfMotorSession(motor));
    }
  });

  return {
    formData: {
      ...formData,
      subType: formData.subType ?? batchEntries[0]?.subType ?? null,
      schemaFormLoaded: motors.some(
        (motor) =>
          Object.keys(motor.schemaFormValues ?? {}).length > 0 ||
          Boolean(motor.savedSections?.length),
      ),
      motors,
    },
    addedMotors: motors.map((motor) => ({ motorId: motor.motorId, subType: motor.subType })),
  };
};

const isStfContinueFillingStatus = (status?: string | null) => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!normalized) return false;
  if (normalized === "IN_PROGRESS") return true;
  if (normalized === "REJECTED") return true;
  return normalized.includes("PARTIAL");
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
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify({
      formData: createDefaultStaticTestFacilityFormState(),
      addedMotors: [],
      motorStatusById: {},
    }),
  );

  const [selectedMotorType, setSelectedMotorType] = useState<StfSubType | "">(defaultMotorType);
  const [motorCount, setMotorCount] = useState<number | "">("");
  const [draftMotorIds, setDraftMotorIds] = useState<string[]>([]);
  const [draftBemNo, setDraftBemNo] = useState("");
  const [addedMotors, setAddedMotors] = useState<StfAddedMotor[]>([]);
  const [batchMotorEntries, setBatchMotorEntries] = useState<StfAddedMotor[]>([]);
  const [motorStatusById, setMotorStatusById] = useState<Record<string, StfMotorStatusMeta>>({});
  const [previousStageGate, setPreviousStageGate] =
    useState<PreviousStageApprovedUnits | null>(null);
  const [savedStfTestNoByMotorId, setSavedStfTestNoByMotorId] = useState<Record<string, string>>(
    {},
  );
  const [approvedMotorOptions, setApprovedMotorOptions] = useState<StfMotorOption[]>([]);
  const [availableBemMotorOptions, setAvailableBemMotorOptions] = useState<StfMotorOption[]>([]);
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
  const [statusFilter, setStatusFilter] = useState(STRINGS.USER_BATCH_LIST.FILTER_ALL);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [totalRecords, setTotalRecords] = useState(0);
  // Fetch Listing Data
  const loadListItems = useCallback(async () => {
    if (!enabled) return;

    setListLoading(true);

    try {
      if (facilityType === "OTHER_BEM") {
        const apiStatus = toOperationStatusApiValue(
          statusFilter,
          STRINGS.USER_BATCH_LIST.FILTER_ALL,
        );
        const response = await stfController.listBemMotors({
          page: page + 1,
          limit: rowsPerPage,
          status: apiStatus ? [apiStatus] : [],
          search,
        });

        if (response?.success && Array.isArray(response?.data?.motors)) {
          setFetchedBemMotors(response.data.motors.map(normalizeBemMotor));
        } else {
          setFetchedBemMotors([]);
        }

        const pagination = response?.data?.pagination;
        const nextTotal =
          Number(pagination?.totalRecords ?? pagination?.total ?? response?.data?.totalRecords) ||
          (Array.isArray(response?.data?.motors) ? response.data.motors.length : 0);
        setTotalRecords(nextTotal);

        const serverCounts = response?.data?.statusCounts;
        setStatusCounts(
          mapBemMotorStatusCountsForUi(
            serverCounts && typeof serverCounts === "object"
              ? (serverCounts as Record<string, number>)
              : undefined,
            nextTotal,
          ),
        );
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
  }, [enabled, facilityType, page, rowsPerPage, search, statusFilter, listParams?.batches]);

  useEffect(() => {
    if (enabled) {
      void loadListItems();
    }
  }, [loadListItems, refreshVersion, enabled]);

  // Computed Values
  const batches = useMemo(() => mergeStfMockBatches(fetchedBatches), [fetchedBatches]);
  const bemMotors = useMemo(() => fetchedBemMotors, [fetchedBemMotors]);
  const bemStatusTabs = useMemo(() => resolveBemMotorStatusTabs(statusCounts), [statusCounts]);
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
        motorStatusById,
      }),
    [formData, addedMotors, selectedMotorType, draftBemNo, motorStatusById],
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
      JSON.stringify({
        formData: defaults,
        addedMotors: [],
        selectedMotorType: defaultMotorType,
        motorStatusById: {},
      }),
    );

    setSelectedMotorType(defaultMotorType);
    setAddedMotors([]);
    setBatchMotorEntries([]);
    setMotorStatusById({});
    setPreviousStageGate(null);
    setSavedStfTestNoByMotorId({});
    setApprovedMotorOptions([]);
    setAvailableBemMotorOptions([]);
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
    setLoadingFormDetails(true);
    setIsEditMode(false);
    setActiveBatch(null);
    setActiveBemMotor(null);
    setDraftBemNo("");

    try {
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
      setView("form");
    } finally {
      setLoadingFormDetails(false);
    }
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

      const newIds = motorIds.map((id) => String(id).trim()).filter(Boolean);

      setAddedMotors((prev) => {
        const existingIds = new Set(prev.map((m) => m.motorId));
        const nextAdded = [
          ...prev,
          ...newIds.filter((id) => !existingIds.has(id)).map((motorId) => ({ motorId, subType })),
        ];
        return nextAdded;
      });

      if (facilityType === "ACEM") {
        setMotorStatusById((prevStatuses) => {
          const updated = { ...prevStatuses };
          newIds.forEach((id) => {
            if (!updated[id]) {
              updated[id] = { motorSubmissionStatus: "TO_BE_INITIATED" };
            }
          });
          return updated;
        });
      }

      resetFlowBarDraft();
      return true;
    },
    [activeBatch, facilityType, fetchStfSchemaDocument, resetFlowBarDraft],
  );

  const handleMotorTypeChange = useCallback(
    (value: string) => {
      if (facilityType === "ACEM") {
        setSelectedMotorType("BEM");
        setSchemaError(null);
        resetFlowDraft();
        return;
      }
      const nextType = value ? mapStfSubType(value) : "";
      setSelectedMotorType(nextType);
      setSchemaError(null);
      resetFlowDraft();
    },
    [facilityType, resetFlowDraft],
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
    // ACEM BEM flow bar always adds via draftBemNo, even when main motors are already seeded
    // and selectedMotorType is MAIN_MOTOR (Main / Subscale Qualification).
    const bemNo = String(draftBemNo ?? "").trim();
    if (bemNo) {
      const usedIds = new Set(addedMotors.map((m) => m.motorId));
      if (usedIds.has(bemNo)) return null;
      return { ids: [bemNo], type: "BEM" };
    }

    if (!selectedMotorType || selectedMotorType !== "MAIN_MOTOR") return null;

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

  const getMotorStatus = useCallback(
    (motorId: string): StfMotorSubmissionStatus =>
      motorStatusById[motorId]?.motorSubmissionStatus ?? "TO_BE_INITIATED",
    [motorStatusById],
  );

  const navigationMotors = useMemo(
    () => resolveStfNavigationMotors(addedMotors, batchMotorEntries),
    [addedMotors, batchMotorEntries],
  );

  const checkMotorEditable = useCallback(
    (motorId: string) => {
      const navEntry =
        addedMotors.find((entry) => entry.motorId === motorId) ??
        batchMotorEntries.find((entry) => entry.motorId === motorId);
      const sessionSubType = (formData.motors ?? []).find((motor) => motor.motorId === motorId)
        ?.subType;
      const subType = navEntry?.subType ?? sessionSubType;
      if (
        !isStfMotorEnabledForWorkflow(motorId, navigationMotors, previousStageGate, getMotorStatus, {
          facilityType,
          subType,
        })
      ) {
        return false;
      }
      return isStfMotorEditable(getMotorStatus(motorId));
    },
    [
      addedMotors,
      batchMotorEntries,
      facilityType,
      formData.motors,
      getMotorStatus,
      navigationMotors,
      previousStageGate,
    ],
  );

  const handleRemoveMotor = useCallback(
    (motorId: string) => {
      if (facilityType === "ACEM") {
        const navEntry =
          addedMotors.find((entry) => entry.motorId === motorId) ??
          batchMotorEntries.find((entry) => entry.motorId === motorId);
        const sessionSubType = (formData.motors ?? []).find((motor) => motor.motorId === motorId)
          ?.subType;
        const subType = navEntry?.subType ?? sessionSubType;
        if (subType !== "BEM") return;

        if (getMotorStatus(motorId) !== "TO_BE_INITIATED") {
          showAlert(messages.BEM_MOTOR_REMOVE_LOCKED, "warning");
          return;
        }
      } else if (!checkMotorEditable(motorId)) {
        showAlert(
          getMotorStatus(motorId) === "APPROVED"
            ? messages.MOTOR_LOCKED_APPROVED
            : messages.MOTOR_LOCKED_WAITING,
          "warning",
        );
        return;
      }

      setFormData((prev) => {
        const nextMotors = (prev.motors ?? []).filter((m) => m.motorId !== motorId);
        return {
          ...prev,
          motors: nextMotors,
          schemaFormLoaded: nextMotors.length > 0,
        };
      });

      setAddedMotors((prev) => prev.filter((m) => m.motorId !== motorId));
      setMotorStatusById((prev) => {
        const next = { ...prev };
        delete next[motorId];
        return next;
      });
      setSavedStfTestNoByMotorId((prev) => {
        const next = { ...prev };
        delete next[motorId];
        return next;
      });
      resetFlowDraft();
    },
    [
      addedMotors,
      batchMotorEntries,
      checkMotorEditable,
      facilityType,
      formData.motors,
      getMotorStatus,
      messages,
      resetFlowDraft,
      showAlert,
    ],
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
        schemaFormValues: values,
        motors: prev.motors.map((motor) =>
          motor.motorId === motorId ? { ...motor, schemaFormValues: values } : motor,
        ),
      };
    });
  }, []);

  const handleStfTestNoChange = useCallback((motorId: string, stfTestNo: string) => {
    const id = String(motorId ?? "").trim();
    if (!id || String(savedStfTestNoByMotorId[id] ?? "").trim()) return;

    setFormData((prev) => {
      if (!prev.motors || prev.motors.length === 0) {
        return {
          ...prev,
          stfTestNo,
          schemaFormValues: {
            ...prev.schemaFormValues,
            stfTestNo,
          },
        };
      }

      return {
        ...prev,
        motors: prev.motors.map((motor) =>
          motor.motorId === motorId ? { ...motor, stfTestNo } : motor,
        ),
      };
    });
  }, [savedStfTestNoByMotorId]);

  const isStfTestNoLocked = useCallback(
    (motorId: string) => Boolean(String(savedStfTestNoByMotorId[motorId] ?? "").trim()),
    [savedStfTestNoByMotorId],
  );

  const lockStfTestNoForMotor = useCallback((motorId: string, stfTestNo: string) => {
    const id = String(motorId ?? "").trim();
    const value = String(stfTestNo ?? "").trim();
    if (!id || !value) return;
    setSavedStfTestNoByMotorId((prev) => ({ ...prev, [id]: value }));
  }, []);

  const lockStfTestNoFromMotors = useCallback(
    (motors: Array<{ motorId: string; stfTestNo?: string | null }>) => {
      const next: Record<string, string> = {};
      motors.forEach((motor) => {
        const id = String(motor.motorId ?? "").trim();
        const value = String(motor.stfTestNo ?? "").trim();
        if (id && value) next[id] = value;
      });
      if (Object.keys(next).length === 0) return;
      setSavedStfTestNoByMotorId((prev) => ({ ...prev, ...next }));
    },
    [],
  );

  // Main Form Initialization & Detail Fetch
  const openFormWithResolvedData = useCallback(
    async (batch: STFBatch | BemMotor, editMode: boolean) => {
      const isOtherBem = facilityType === "OTHER_BEM";
      const bemMotorObj = batch as BemMotor;
      const stfBatchObj = batch as STFBatch;

      let resolvedFormId = stfBatchObj.formId || null;
      let resolvedData = createDefaultStaticTestFacilityFormState();
      let rejectionReason = batch.rejectionReason ?? null;
      let fetchedBemNo = stfBatchObj.motorIdNo ?? bemMotorObj.motorId ?? "";
      let detailsResponse: any = null;
      let autoMotorEntries: StfAddedMotor[] = [];
      let nextStatuses: Record<string, StfMotorStatusMeta> = {};
      let nextBatch = stfBatchObj;
      let detailsModel: STFDetailsModel | null = null;
      let nextSavedStfTestNoByMotorId: Record<string, string> = {};

      const initialMotorType: StfSubType =
        (batch.subType as StfSubType) || defaultMotorType || "BEM";

      const shouldFetchDetails = isOtherBem
        ? editMode ||
          isStfContinueFillingStatus(bemMotorObj.status) ||
          String(bemMotorObj.status ?? "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_") === "IN_PROGRESS"
        : editMode || isStfContinueFillingStatus(stfBatchObj.stfStatus);

      setLoadingFormDetails(true);
      try {
        if (!isOtherBem && stfBatchObj.batchId) {
          try {
            const batchDetails = await batchManagementController.getBatchById(stfBatchObj.batchId);
            const resolvedBatchType = resolveStfWorkingBatchType(
              stfBatchObj.batchType,
              batchDetails?.batchType,
            );
            const resolvedSubBatchType = resolveStfWorkingSubBatchType(
              stfBatchObj.subBatchType,
              batchDetails?.subBatchType,
            );
            const seedMainMotors = shouldSeedStfMainMotors(
              resolvedBatchType,
              resolvedSubBatchType,
            );
            const showBemSelection = shouldShowStfBemMotorSelection(
              resolvedBatchType,
              resolvedSubBatchType,
            );

            // Main / Subscale Qualification: seed batch-linked main motors + BEM selection.
            // Subscale Experimental: BEM selection only.
            autoMotorEntries = seedMainMotors
              ? resolveStfBatchMotorEntries(stfBatchObj, batchDetails)
              : [];
            setAvailableBemMotorOptions(
              showBemSelection ? resolveBemMotorOptionsFromBatchDetails(batchDetails) : [],
            );
            nextBatch = {
              ...stfBatchObj,
              batchType: resolvedBatchType || stfBatchObj.batchType || null,
              subBatchType: resolvedSubBatchType || stfBatchObj.subBatchType || null,
              motorIds: batchDetails?.motorIds?.length
                ? batchDetails.motorIds.map(String)
                : stfBatchObj.motorIds,
              motorId:
                batchDetails?.motorIds?.length > 0
                  ? batchDetails.motorIds.join(", ")
                  : stfBatchObj.motorId,
              projectId: batchDetails?.projectId ?? stfBatchObj.projectId,
              motorStage: batchDetails?.motorStage ?? stfBatchObj.motorStage,
              numberOfMotors: batchDetails?.numberOfMotors ?? stfBatchObj.numberOfMotors,
              subType: seedMainMotors ? "MAIN_MOTOR" : "BEM",
              stageProgress: batchDetails?.stageProgress ?? stfBatchObj.stageProgress,
              currentStage: batchDetails?.currentStage ?? stfBatchObj.currentStage,
            };
          } catch (error) {
            console.error("Unable to resolve batch motor details", error);
            const seedMainMotors = shouldSeedStfMainMotors(
              stfBatchObj.batchType,
              stfBatchObj.subBatchType,
            );
            autoMotorEntries = seedMainMotors
              ? resolveStfBatchMotorEntries(stfBatchObj, null)
              : [];
            setAvailableBemMotorOptions([]);
          }
        } else if (!isOtherBem) {
          const seedMainMotors = shouldSeedStfMainMotors(
            stfBatchObj.batchType,
            stfBatchObj.subBatchType,
          );
          autoMotorEntries = seedMainMotors
            ? resolveStfBatchMotorEntries(stfBatchObj, null)
            : [];
          setAvailableBemMotorOptions([]);
        }

        if (isOtherBem) {
          setPreviousStageGate({
            enableAll: true,
            kind: "motor",
            previousSubDepartmentId: null,
            previousSubDepartmentName: null,
            approvedPremixNos: new Set(),
            approvedMotorIds: new Set(),
          });
        } else {
          setPreviousStageGate(
            resolvePreviousStageApprovedUnits({
              stageProgress: nextBatch.stageProgress ?? stfBatchObj.stageProgress,
              currentStage: nextBatch.currentStage ?? stfBatchObj.currentStage,
              currentSlug: "static-test-facility",
              currentSubDepartmentId: subDepartmentId,
              subDepartments: user?.allSubDepartments,
            }),
          );
        }

        if (shouldFetchDetails) {
          if (!isOtherBem && !subDepartmentId) {
            showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
            return;
          }

          if (!isOtherBem && !resolvedFormId) {
            showAlert(messages.FORM_ID_MISSING, "error");
            return;
          }

          detailsResponse = isOtherBem
            ? await stfController.getBemMotorDetails({ motorId: fetchedBemNo })
            : await stfController.fetchFormDetails({
                formId: resolvedFormId!,
                subDepartmentId: subDepartmentId!,
              });

          if (!detailsResponse?.success || !detailsResponse.data) {
            const fallback =
              detailsResponse?.statusCode === 404
                ? messages.DETAILS_NOT_FOUND
                : messages.DETAILS_FETCH_ERROR;

            showAlert(getErrorMessage(detailsResponse, fallback), "error");
            return;
          }

          if (isOtherBem) {
            const bemDetails = detailsResponse.data;
            fetchedBemNo = String(
              bemDetails.bemNo ?? bemDetails.motorId ?? bemDetails.motorCode ?? fetchedBemNo,
            ).trim();
            setDraftBemNo(fetchedBemNo);

            const schema = await fetchStfSchemaDocument("BEM");
            resolvedData = mapBemDetailsResponseToFormState(
              {
                bemNo: fetchedBemNo,
                motorId: fetchedBemNo,
                motorCode: fetchedBemNo,
                staticTestingDetails: bemDetails.staticTestingDetails,
                sections: bemDetails.sections,
              },
              schema ?? undefined,
            );
            const fetchedStfTestNo = String(
              bemDetails.stfTestNo ?? bemMotorObj.stfTestNo ?? "",
            ).trim();
            resolvedData = {
              ...resolvedData,
              motorId: bemDetails.bemMotorId ?? bemDetails.id ?? resolvedFormId,
              bemNo: fetchedBemNo,
              schemaFormValues: {
                ...resolvedData.schemaFormValues,
                bemNo: fetchedBemNo,
                stfTestNo: fetchedStfTestNo,
              },
            };
          } else {
            detailsModel =
              detailsResponse.data instanceof STFDetailsModel
                ? detailsResponse.data
                : STFDetailsModel.fromApi({ data: detailsResponse.data });
            resolvedData = STFDetailsModel.toFormState(detailsModel);
            nextStatuses = mapStfMotorStatusesFromApi(detailsModel);
          }

          resolvedFormId = detailsResponse.data.formId ?? resolvedFormId;
          rejectionReason =
            detailsResponse.data.workflowInsights?.rejectionReason ?? rejectionReason;
        }
      } catch {
        showAlert(messages.DETAILS_FETCH_ERROR, "error");
        return;
      } finally {
        setLoadingFormDetails(false);
      }

      let nextFormData = resolvedData;
      let nextAddedMotors = buildStfAddedMotors(resolvedData);

      if (!isOtherBem) {
        const merged = mergeMotorsFromBatchAndForm(autoMotorEntries, resolvedData);
        nextFormData = merged.formData;
        nextAddedMotors = merged.addedMotors;
        if (detailsModel) {
          nextFormData = applyStfTestNoToFormMotors(
            nextFormData,
            mapStfTestNoByMotorIdFromApi(detailsModel),
          );
          nextSavedStfTestNoByMotorId = mapStfTestNoByMotorIdFromApi(detailsModel);
        }
      } else {
        const bemMotorId = String(fetchedBemNo).trim();
        const bemStfTestNo = String(
          resolvedData.schemaFormValues?.stfTestNo ?? resolvedData.stfTestNo ?? "",
        ).trim();
        if (bemMotorId && bemStfTestNo) {
          nextSavedStfTestNoByMotorId = { [bemMotorId]: bemStfTestNo };
        }
      }

      const nextMotorType: StfSubType | null = nextFormData.subType ?? (initialMotorType || null);
      const subTypesToHydrate = resolveStfFormSubTypes(nextFormData);

      if (Object.keys(nextStatuses).length === 0 && !isOtherBem) {
        nextStatuses = Object.fromEntries(
          nextAddedMotors.map((entry) => [
            entry.motorId,
            { motorSubmissionStatus: "TO_BE_INITIATED" as StfMotorSubmissionStatus },
          ]),
        );
      } else if (!isOtherBem) {
        nextAddedMotors.forEach((entry) => {
          if (!nextStatuses[entry.motorId]) {
            nextStatuses[entry.motorId] = { motorSubmissionStatus: "TO_BE_INITIATED" };
          }
        });
      }

      if (isOtherBem) {
        setActiveBemMotor({
          ...bemMotorObj,
          motorId: fetchedBemNo,
          bemNo: fetchedBemNo,
        });
      } else {
        setActiveBatch({
          ...nextBatch,
          formId: resolvedFormId,
          subType: nextMotorType,
          rejectionReason,
        });
        setBatchMotorEntries(autoMotorEntries);
        setMotorStatusById(nextStatuses);
      }

      const acemMotorType: StfSubType = shouldSeedStfMainMotors(
        nextBatch.batchType,
        nextBatch.subBatchType,
      )
        ? "MAIN_MOTOR"
        : "BEM";

      setSelectedMotorType(
        isOtherBem
          ? nextMotorType ?? subTypesToHydrate[0] ?? defaultMotorType
          : acemMotorType,
      );
      setAddedMotors(nextAddedMotors);
      setSavedStfTestNoByMotorId(nextSavedStfTestNoByMotorId);
      setIsEditMode(editMode);
      setView("form");
      resetFlowDraft();

      if (!isOtherBem && subTypesToHydrate.length > 0) {
        let hydrated = nextFormData;
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
            selectedMotorType: acemMotorType,
            draftBemNo: fetchedBemNo,
            motorStatusById: nextStatuses,
          }),
        );
        return;
      }

      setFormData(nextFormData);
      setInitialSnapshot(
        JSON.stringify({
          formData: nextFormData,
          addedMotors: nextAddedMotors,
          selectedMotorType: isOtherBem
            ? nextMotorType ?? defaultMotorType
            : acemMotorType,
          draftBemNo: fetchedBemNo,
          motorStatusById: nextStatuses,
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
      user?.allSubDepartments,
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

  const handleBack = useCallback(() => {
    if (view === "form" && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }

    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [view, isFormDirty, hasSavedDraft, bumpBatchRefresh, resetFormContext]);

  const handleDiscardAndBack = useCallback(() => {
    setBackConfirmOpen(false);
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [hasSavedDraft, bumpBatchRefresh, resetFormContext]);

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
        const stfNo = formData.schemaFormValues?.stfTestNo;
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
          stfTestNo: stfNo,
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

        const mapped = mapStaticTestFacilityFormStateToPayload(formData, {
          navigationMotors: resolveStfNavigationMotors(addedMotors, batchMotorEntries),
          motorStatusById,
        });
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

        if (facilityType === "OTHER_BEM") {
          const bemNo = draftBemNo?.trim() || formData.schemaFormValues?.bemNo || "";
          const stfNo = formData.schemaFormValues?.stfTestNo || "";
          lockStfTestNoForMotor(String(bemNo), String(stfNo));
          const returnedMotorId = String(response.data?.bemMotorId ?? response.data?.motorId ?? response.data?.formId ?? bemNo);
          setActiveBemMotor((prev) => ({
            ...(prev ?? {}),
            motorId: returnedMotorId,
            bemNo: bemNo,
            stfTestNo: stfNo,
            status: "In Progress",
          } as BemMotor));
          setDraftBemNo(String(bemNo));
          setFormData((prev) => ({
            ...prev,
            motorId: returnedMotorId,
          }));
        } else {
          lockStfTestNoFromMotors(formData.motors ?? []);
        }
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

  const submitMotor = useCallback(
    async (motorId: string, intent: "draft" | "submit") => {
      if (facilityType !== "ACEM" || !activeBatch) return false;

      if (!subDepartmentId) {
        showAlert(messages.SUB_DEPARTMENT_MISSING, "error");
        return false;
      }

      const navEntry =
        addedMotors.find((entry) => entry.motorId === motorId) ??
        batchMotorEntries.find((entry) => entry.motorId === motorId);
      const sessionSubType = (formData.motors ?? []).find((entry) => entry.motorId === motorId)
        ?.subType;
      const gateSubType = navEntry?.subType ?? sessionSubType;

      if (
        !isStfMotorEnabledForWorkflow(motorId, navigationMotors, previousStageGate, getMotorStatus, {
          facilityType,
          subType: gateSubType,
        })
      ) {
        showAlert(
          isMotorEnabledByPreviousStage(motorId, previousStageGate)
            ? STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED
            : STRINGS.MANUFACTURING.PREVIOUS_STAGE_UNIT_DISABLED,
          "warning",
        );
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

      const subType = motor.subType;
      if (!formData.schemasBySubType?.[subType]) {
        showAlert(messages.SCHEMA_NOT_LOADED, "warning");
        return false;
      }

      if (!hasMotorStaticTestFacilityValue(formData, motorId)) {
        showAlert(messages.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      const motorSubmissionType: StfMotorSubmissionType =
        intent === "draft" ? "DRAFT" : "SUBMIT";
      const isCreateFlow =
        activeBatch.stfStatus === QUALITY_CONTROL_STATUS.TO_BE_INITIATED && !activeBatch.formId;
      const payloadBody = mapStaticTestFacilityFormStateToPayload(formData, {
        navigationMotors: resolveStfNavigationMotors(addedMotors, batchMotorEntries),
        motorStatusById,
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
          response = await stfController.createForm({
            batchId: activeBatch.batchId,
            subDepartmentId,
            formSubmissionType: "DRAFT",
            motors: payloadBody.motors,
          });
        } else {
          if (!activeBatch.formId) {
            showAlert(messages.FORM_ID_MISSING, "error");
            return false;
          }
          response = await stfController.updateForm({
            formId: activeBatch.formId,
            batchId: activeBatch.batchId ?? "",
            subDepartmentId,
            formSubmissionType: "DRAFT",
            motors: payloadBody.motors,
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

        const nextStatus: StfMotorSubmissionStatus =
          intent === "draft" ? "IN_PROGRESS" : "WAITING_FOR_APPROVAL";

        setMotorStatusById((prev) => {
          const updated: Record<string, StfMotorStatusMeta> = {
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
                  (String(entry.motorSubmissionStatus ?? "")
                    .toUpperCase()
                    .replace(/\s+/g, "_") as StfMotorSubmissionStatus) ||
                  updated[id]?.motorSubmissionStatus ||
                  "TO_BE_INITIATED",
              };
            });
          }
          return updated;
        });

        setInitialSnapshot(formSnapshot);

        lockStfTestNoForMotor(motorId, String(motor.stfTestNo ?? "").trim());

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
      batchMotorEntries,
      checkMotorEditable,
      facilityType,
      formData,
      formSnapshot,
      getMotorStatus,
      lockStfTestNoForMotor,
      motorStatusById,
      navigationMotors,
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
    if (facilityType !== "ACEM" || !activeBatch?.formId) {
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
      const detailsResponse = await stfController.fetchFormDetails({
        formId: activeBatch.formId,
        subDepartmentId,
      });
      if (!detailsResponse?.success || !detailsResponse?.data) {
        showAlert(getErrorMessage(detailsResponse, messages.DETAILS_FETCH_ERROR), "error");
        return false;
      }

      const payloadBody = mapStfDetailsFromSavedForm(detailsResponse.data, {
        motorStatusById,
      });

      const response = await stfController.updateForm({
        formId: activeBatch.formId,
        batchId: activeBatch.batchId ?? "",
        subDepartmentId,
        formSubmissionType: "SUBMIT",
        motors: payloadBody.motors,
      });

      if (!response?.success) {
        showAlert(getErrorMessage(response, messages.UPDATE_FAILED), "error");
        return false;
      }

      showAlert(messages.CREATE_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
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
    facilityType,
    motorStatusById,
    resetFormContext,
    showAlert,
    subDepartmentId,
  ]);

  // Fetch & View Details
  const handleViewDetails = useCallback(
    async (row: STFBatch | BemMotor) => {
      const targetId =
        facilityType === "OTHER_BEM"
          ? String((row as BemMotor).motorId ?? "").trim()
          : String((row as STFBatch).formId ?? "").trim();

      if (!targetId) {
        showAlert(messages.FORM_ID_MISSING, "error");
        return;
      }

      setDetailsLoading(true);

      try {
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
        setDetailsData(
          facilityType === "OTHER_BEM"
            ? response.data
            : STFDetailsModel.toPlainRecord(
                response.data instanceof STFDetailsModel
                  ? response.data
                  : STFDetailsModel.fromApi({ data: response.data }),
              ),
        );
        setView("details");
      } catch (error) {
        console.error("Error viewing details:", error);
        showAlert(messages.DETAILS_FETCH_ERROR, "error");
      } finally {
        setDetailsLoading(false);
      }
    },
    [showAlert, subDepartmentId, messages, facilityType],
  );

  const handleBackFromDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsData(null);
    setView("list");
  }, []);

  const acemListParams = listParams as
    | (NonNullable<BaseHookProps["listParams"]> & {
        loading?: boolean;
        isRefreshing?: boolean;
        statusCounts?: Record<string, number>;
      })
    | undefined;

  return {
    ...listParams,
    facilityType,
    batches,
    bemMotors,
    loading: facilityType === "OTHER_BEM" ? listLoading : Boolean(acemListParams?.loading ?? listLoading),
    isRefreshing: facilityType === "OTHER_BEM" ? false : Boolean(acemListParams?.isRefreshing),
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
    batchMotorEntries,
    motorStatusById,
    getMotorStatus,
    isMotorEditable: checkMotorEditable,
    previousStageGate,
    isStfTestNoLocked,
    availableMotorOptions,
    availableBemMotorOptions,
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
    handleStfTestNoChange,
    handleSaveDraft,
    handleSubmit,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewDetails,
    handleBackFromDetails,
    handleCreateNewBem,
    hasSavedDraft,
    handleBackFromForm: handleBack,
    onFormValuesChange: handleFormValuesChange,
    // OTHER_BEM owns its list state; ACEM uses useSubdepartmentBatches (listParams).
    ...(facilityType === "OTHER_BEM"
      ? {
          page,
          setPage,
          rowsPerPage,
          setRowsPerPage,
          search,
          setSearch,
          statusFilter,
          setStatusFilter: (status: string) => {
            setStatusFilter(status);
            setPage(0);
          },
          statusCounts,
          statusTabs: bemStatusTabs,
          totalRecords,
        }
      : {
          statusCounts: acemListParams?.statusCounts ?? {},
        }),
  };
};
