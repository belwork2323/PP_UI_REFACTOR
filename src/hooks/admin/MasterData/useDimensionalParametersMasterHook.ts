import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMasterDataActiveToggle } from "@hooks/admin/MasterData/useMasterDataActiveToggle";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { masterDataController } from "@controllers/admin/MasterData/masterDataController";
import {
  createMasterData,
} from "@data/api/admin/MasterData/masterDataApi";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import {
  getMasterDataErrorMessage,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  buildDimensionalParameterCreatePayload,
  buildStageEditFormForProjectAndMotorType,
  createEmptyDimensionalParametersCreateForm,
  dimensionalParametersRecordMatchesSearch,
  mapDimensionalRecordFromMasterData,
  emptyMasterDataStats,
  validateDimensionalCreateForm,
  validateDimensionalStageEditForm,
  type DimensionalParametersCreateFormState,
  type DimensionalParametersMasterRecord,
  type DimensionalParametersStageEditFormState,
} from "@data/models/admin/MasterData/DimensionalParametersMasterModel";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const MASTER_TYPE = "dimensional-parameters";
const S = STRINGS.MASTER_DATA;

type Options = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  unitOptions: AppDropdownOption[];
  onStatsChange?: (stats: MasterDataStats) => void;
  onRefresh?: () => void;
};

export default function useDimensionalParametersMasterHook({
  activeFilter,
  refreshKey = 0,
  unitOptions,
  onStatsChange,
  onRefresh,
}: Options) {
  const onStatsChangeRef = useRef(onStatsChange);
  const onRefreshRef = useRef(onRefresh);
  onStatsChangeRef.current = onStatsChange;
  onRefreshRef.current = onRefresh;

  const [items, setItems] = useState<DimensionalParametersMasterRecord[]>([]);
  const [stats, setStats] = useState(emptyMasterDataStats());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [motorStageFilter, setMotorStageFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [inlineMode, setInlineMode] = useState<"create" | "edit" | null>(null);
  const [createForm, setCreateForm] = useState(createEmptyDimensionalParametersCreateForm());
  const [editForm, setEditForm] = useState<DimensionalParametersStageEditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const loadList = useCallback(async (): Promise<DimensionalParametersMasterRecord[]> => {
    setLoading(true);
    try {
      const body: { search?: string } = {};
      if (search.trim()) body.search = search.trim();

      const resp = await masterDataController.list(MASTER_TYPE, body);

      if (resp.success && resp.data) {
        const mappedItems = resp.data.items.map(mapDimensionalRecordFromMasterData);
        const nextStats = {
          total: mappedItems.length,
          active: mappedItems.filter((item) => item.isActive).length,
          inactive: mappedItems.filter((item) => !item.isActive).length,
        };
        setItems(mappedItems);
        setStats(nextStats);
        onStatsChangeRef.current?.(nextStats);
        return mappedItems;
      }
      setItems([]);
      setStats(emptyMasterDataStats());
      onStatsChangeRef.current?.(emptyMasterDataStats());
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.LOAD_LIST_FAILED), "error");
      return [];
    } catch (error: any) {
      setItems([]);
      setStats(emptyMasterDataStats());
      onStatsChangeRef.current?.(emptyMasterDataStats());
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(error, S.ERRORS.LOAD_LIST_FAILED), "error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(0);
    setInlineMode(null);
    void loadList();
  }, [loadList, refreshKey]);

  // Re-publish full-list counts when status chips change (table filters client-side only).
  useEffect(() => {
    onStatsChangeRef.current?.(stats);
  }, [activeFilter, stats]);

  const filteredItems = useMemo(() => {
    return items.filter((record) => {
      if (activeFilter === "ACTIVE" && !record.isActive) return false;
      if (activeFilter === "INACTIVE" && record.isActive) return false;
      if (projectFilter && record.projectId !== projectFilter) return false;
      if (motorStageFilter && String(record.motorType) !== motorStageFilter) {
        return false;
      }
      return dimensionalParametersRecordMatchesSearch(record, search);
    });
  }, [items, activeFilter, projectFilter, motorStageFilter, search]);

  const motorStageFilterOptions = useMemo(() => {
    const stages = new Set<string>();
    for (const record of items) {
      if (projectFilter && record.projectId !== projectFilter) continue;
      if (record.motorType == null) continue;
      stages.add(String(record.motorType));
    }
    return Array.from(stages)
      .sort((a, b) => Number(a) - Number(b))
      .map((value) => ({ value, label: `Stage ${value}` }));
  }, [items, projectFilter]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  const closeInline = () => {
    if (saving || enabling || disabling) return;
    setInlineMode(null);
    setCreateForm(createEmptyDimensionalParametersCreateForm());
    setEditForm(null);
  };

  const forceCloseInline = () => {
    setInlineMode(null);
    setCreateForm(createEmptyDimensionalParametersCreateForm());
    setEditForm(null);
  };

  const openCreate = () => {
    setCreateForm(createEmptyDimensionalParametersCreateForm());
    setEditForm(null);
    setInlineMode("create");
  };

  const openEdit = (record: DimensionalParametersMasterRecord) => {
    setEditForm(
      buildStageEditFormForProjectAndMotorType(
        record.projectId,
        record.motorType,
        items,
        unitOptions,
      ),
    );
    setInlineMode("edit");
  };

  const refreshAfterMutation = useCallback(
    async (options?: { notifyParent?: boolean }): Promise<DimensionalParametersMasterRecord[]> => {
      const nextItems = await loadList();
      if (options?.notifyParent !== false) {
        onRefreshRef.current?.();
      }
      return nextItems;
    },
    [loadList],
  );

  const syncEditFormAfterListRefresh = useCallback(
    (nextItems: DimensionalParametersMasterRecord[]) => {
      setEditForm((prev) => {
        if (!prev) return prev;
        const pendingNewRows = prev.parameters.filter((row) => !row.isExisting);
        const rebuilt = buildStageEditFormForProjectAndMotorType(
          prev.projectId,
          prev.motorType,
          nextItems,
          unitOptions,
        );
        return {
          ...rebuilt,
          parameters: [...rebuilt.parameters, ...pendingNewRows],
        };
      });
    },
    [unitOptions],
  );

  const saveForm = async (): Promise<boolean> => {
    if (inlineMode === "create") {
      const err = validateDimensionalCreateForm(createForm);
      if (err) {
        useAlertStore.getState().showValidationAlert(err);
        return false;
      }
      setSaving(true);
      useAlertStore.getState().showAlert(S.MESSAGES.CREATING, "info", { loading: true });
      try {
        for (const row of createForm.parameters) {
          const payload = buildDimensionalParameterCreatePayload(
            createForm.projectId.trim(),
            Number(createForm.motorType),
            row,
            unitOptions,
          );
          const resp = new ApiResponseModel(await createMasterData(MASTER_TYPE, payload));
          if (!resp.success) {
            useAlertStore
              .getState()
              .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
            return false;
          }
        }
        useAlertStore.getState().showAlert(S.MESSAGES.CREATE_SUCCESS, "success");
        closeInline();
        await refreshAfterMutation();
        return true;
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error, S.ERRORS.OPERATION_FAILED), "error");
        return false;
      } finally {
        setSaving(false);
      }
    }

    if (inlineMode === "edit" && editForm) {
      const err = validateDimensionalStageEditForm(editForm);
      if (err) {
        useAlertStore.getState().showValidationAlert(err);
        return false;
      }

      const newRows = editForm.parameters.filter((row) => !row.isExisting);
      setSaving(true);
      useAlertStore.getState().showAlert(S.MESSAGES.UPDATING, "info", { loading: true });
      try {
        for (const row of newRows) {
          const payload = buildDimensionalParameterCreatePayload(
            editForm.projectId,
            editForm.motorType,
            row,
            unitOptions,
          );
          try {
            const resp = new ApiResponseModel(await createMasterData(MASTER_TYPE, payload));
            if (!resp.success) {
              useAlertStore
                .getState()
                .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
              return false;
            }
          } catch (error: any) {
            useAlertStore
              .getState()
              .showAlert(getMasterDataErrorMessage(error, S.ERRORS.OPERATION_FAILED), "error");
            return false;
          }
        }

        useAlertStore.getState().showAlert(S.MESSAGES.UPDATE_SUCCESS, "success");
        forceCloseInline();
        await refreshAfterMutation();
        return true;
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error, S.ERRORS.OPERATION_FAILED), "error");
        return false;
      } finally {
        setSaving(false);
      }
    }

    return false;
  };

  const enableRecord = useCallback(
    async (record: DimensionalParametersMasterRecord) => {
      setEnabling(true);
      useAlertStore.getState().showAlert(S.MESSAGES.ENABLING, "info", { loading: true });
      try {
        const resp = await masterDataController.enable(MASTER_TYPE, record.parameterId);
        if (resp.success) {
          useAlertStore.getState().showAlert(S.MESSAGES.ENABLE_SUCCESS, "success");
          // Avoid parent refreshKey bump while edit dialog is open — that clears inlineMode.
          const keepDialogOpen = inlineMode === "edit";
          const nextItems = await refreshAfterMutation({ notifyParent: !keepDialogOpen });
          if (keepDialogOpen) {
            syncEditFormAfterListRefresh(nextItems);
          }
        } else {
          useAlertStore
            .getState()
            .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
        }
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error, S.ERRORS.OPERATION_FAILED), "error");
      } finally {
        setEnabling(false);
      }
    },
    [inlineMode, refreshAfterMutation, syncEditFormAfterListRefresh],
  );

  const disableRecord = useCallback(
    async (record: DimensionalParametersMasterRecord) => {
      setDisabling(true);
      useAlertStore.getState().showAlert(S.MESSAGES.DISABLING, "info", { loading: true });
      try {
        const resp = await masterDataController.disable(MASTER_TYPE, record.parameterId);
        if (resp.success) {
          useAlertStore.getState().showAlert(S.MESSAGES.DISABLE_SUCCESS, "success");
          const keepDialogOpen = inlineMode === "edit";
          const nextItems = await refreshAfterMutation({ notifyParent: !keepDialogOpen });
          if (keepDialogOpen) {
            syncEditFormAfterListRefresh(nextItems);
          }
        } else {
          useAlertStore
            .getState()
            .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
        }
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error, S.ERRORS.OPERATION_FAILED), "error");
      } finally {
        setDisabling(false);
      }
    },
    [inlineMode, refreshAfterMutation, syncEditFormAfterListRefresh],
  );

  const toggleExistingParameterActive = useCallback(
    async (parameterId: number, nextActive: boolean) => {
      if (saving || disabling || enabling) return;
      const record = items.find((item) => item.parameterId === parameterId);
      if (!record || record.isActive === nextActive) return;
      if (nextActive) {
        await enableRecord(record);
      } else {
        await disableRecord(record);
      }
    },
    [disableRecord, disabling, enableRecord, enabling, items, saving],
  );

  const { toggleTarget, handleToggleActive, confirmToggle, cancelToggle } =
    useMasterDataActiveToggle<DimensionalParametersMasterRecord>({
      canToggle: () => inlineMode == null && !saving && !disabling && !enabling,
      enableRecord,
      disableRecord,
    });

  return {
    items: filteredItems,
    allItems: items,
    stats,
    loading,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
    projectFilter,
    setProjectFilter: (value: string) => {
      setProjectFilter(value);
      setMotorStageFilter("");
      setPage(0);
    },
    motorStageFilter,
    setMotorStageFilter: (value: string) => {
      setMotorStageFilter(value);
      setPage(0);
    },
    motorStageFilterOptions,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage: (n: number) => {
      setRowsPerPage(n);
      setPage(0);
    },
    paginated,
    inlineMode,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    saving,
    disabling,
    enabling,
    openCreate,
    openEdit,
    closeInline,
    saveForm,
    toggleExistingParameterActive,
    toggleTarget,
    handleToggleActive,
    confirmToggle,
    cancelToggle,
  };
}
