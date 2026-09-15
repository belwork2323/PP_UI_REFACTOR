import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMasterDataActiveToggle } from "@hooks/admin/MasterData/useMasterDataActiveToggle";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { masterDataController } from "@controllers/admin/MasterData/masterDataController";
import {
  createMasterData,
  deleteMasterData,
  enableMasterData,
} from "@data/api/admin/MasterData/masterDataApi";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import {
  getMasterDataErrorMessage,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  buildDimensionalParameterCreatePayload,
  buildStageEditFormForMotorType,
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
  const [motorStageFilter, setMotorStageFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [inlineMode, setInlineMode] = useState<"create" | "edit" | null>(null);
  const [createForm, setCreateForm] = useState(createEmptyDimensionalParametersCreateForm());
  const [editForm, setEditForm] = useState<DimensionalParametersStageEditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const body: { search?: string } = {};
      if (search.trim()) body.search = search.trim();

      const resp = await masterDataController.list(MASTER_TYPE, body);

      if (resp.success && resp.data) {
        const mappedItems = resp.data.items.map(mapDimensionalRecordFromMasterData);
        setItems(mappedItems);
        setStats(resp.data.stats);
        onStatsChangeRef.current?.(resp.data.stats);
      } else {
        setItems([]);
        setStats(emptyMasterDataStats());
        onStatsChangeRef.current?.(emptyMasterDataStats());
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.LOAD_LIST_FAILED), "error");
      }
    } catch (error: any) {
      setItems([]);
      setStats(emptyMasterDataStats());
      onStatsChangeRef.current?.(emptyMasterDataStats());
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(error?.response?.data, S.ERRORS.LOAD_LIST_FAILED), "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(0);
    setInlineMode(null);
    void loadList();
  }, [loadList, refreshKey]);

  const filteredItems = useMemo(() => {
    return items.filter((record) => {
      if (activeFilter === "ACTIVE" && !record.isActive) return false;
      if (activeFilter === "INACTIVE" && record.isActive) return false;
      if (motorStageFilter && String(record.motorType) !== motorStageFilter) {
        return false;
      }
      return dimensionalParametersRecordMatchesSearch(record, search);
    });
  }, [items, activeFilter, motorStageFilter, search]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  const closeInline = () => {
    if (saving) return;
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
    setEditForm(buildStageEditFormForMotorType(record.motorType, items, unitOptions));
    setInlineMode("edit");
  };

  const refreshAfterMutation = useCallback(async () => {
    await loadList();
    onRefreshRef.current?.();
  }, [loadList]);

  const saveForm = async (): Promise<boolean> => {
    if (inlineMode === "create") {
      const err = validateDimensionalCreateForm(createForm);
      if (err) {
        useAlertStore.getState().showValidationAlert(err);
        return false;
      }
      setSaving(true);
      useAlertStore.getState().showAlert(S.MESSAGES.CREATING, "loading");
      try {
        for (const row of createForm.parameters) {
          const payload = buildDimensionalParameterCreatePayload(
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
          .showAlert(getMasterDataErrorMessage(error?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
        return false;
      } finally {
        setSaving(false);
      }
    }

    if (inlineMode === "edit" && editForm) {
      const stageRecords = items.filter((record) => record.motorType === editForm.motorType);
      const err = validateDimensionalStageEditForm(editForm, stageRecords);
      if (err) {
        useAlertStore.getState().showValidationAlert(err);
        return false;
      }

      setSaving(true);
      useAlertStore.getState().showAlert(S.MESSAGES.UPDATING, "loading");
      try {
        const originalById = new Map(
          stageRecords.map((record) => [record.parameterId, record]),
        );

        for (const row of editForm.parameters) {
          if (!row.isExisting) {
            const payload = buildDimensionalParameterCreatePayload(
              editForm.motorType,
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
            continue;
          }

          if (row.parameterId == null) continue;
          const original = originalById.get(row.parameterId);
          if (!original || original.isActive === row.isActive) continue;

          if (row.isActive) {
            const resp = new ApiResponseModel(
              await enableMasterData(MASTER_TYPE, { id: row.parameterId }),
            );
            if (!resp.success) {
              useAlertStore
                .getState()
                .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
              return false;
            }
          } else {
            const resp = new ApiResponseModel(
              await deleteMasterData(MASTER_TYPE, { id: row.parameterId }),
            );
            if (!resp.success) {
              useAlertStore
                .getState()
                .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
              return false;
            }
          }
        }

        useAlertStore.getState().showAlert(S.MESSAGES.UPDATE_SUCCESS, "success");
        closeInline();
        await refreshAfterMutation();
        return true;
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
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
      useAlertStore.getState().showAlert(S.MESSAGES.ENABLING, "loading");
      try {
        const resp = new ApiResponseModel(
          await enableMasterData(MASTER_TYPE, { id: record.parameterId }),
        );
        if (resp.success) {
          useAlertStore.getState().showAlert(S.MESSAGES.ENABLE_SUCCESS, "success");
          await refreshAfterMutation();
        } else {
          useAlertStore
            .getState()
            .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
        }
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
      } finally {
        setEnabling(false);
      }
    },
    [refreshAfterMutation],
  );

  const disableRecord = useCallback(
    async (record: DimensionalParametersMasterRecord) => {
      setDisabling(true);
      useAlertStore.getState().showAlert(S.MESSAGES.DISABLING, "loading");
      try {
        const resp = new ApiResponseModel(
          await deleteMasterData(MASTER_TYPE, { id: record.parameterId }),
        );
        if (resp.success) {
          useAlertStore.getState().showAlert(S.MESSAGES.DISABLE_SUCCESS, "success");
          await refreshAfterMutation();
        } else {
          useAlertStore
            .getState()
            .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
        }
      } catch (error: any) {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(error?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
      } finally {
        setDisabling(false);
      }
    },
    [refreshAfterMutation],
  );

  const { toggleTarget, handleToggleActive, confirmToggle, cancelToggle } =
    useMasterDataActiveToggle<DimensionalParametersMasterRecord>({
      canToggle: () => inlineMode == null && !saving && !disabling && !enabling,
      enableRecord,
      disableRecord,
    });

  return {
    items: filteredItems,
    stats,
    loading,
    search,
    setSearch,
    motorStageFilter,
    setMotorStageFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
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
    toggleTarget,
    handleToggleActive,
    confirmToggle,
    cancelToggle,
  };
}
