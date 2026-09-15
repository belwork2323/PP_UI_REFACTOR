import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMasterDataActiveToggle } from "@hooks/admin/MasterData/useMasterDataActiveToggle";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import { getMasterDataErrorMessage } from "@data/models/admin/MasterData/MasterDataModel";
import {
  buildMaterialsCreatePayload,
  buildMaterialsDeletePayload,
  buildMaterialsUpdatePayload,
  createEmptyMaterialsForm,
  emptyMasterDataStats,
  mapMaterialRecordToForm,
  MaterialsMasterListModel,
  validateMaterialsForm,
  type MaterialsMasterFormState,
  type MaterialsMasterListPayload,
  type MaterialsMasterRecord,
} from "@data/models/admin/MasterData/MaterialsMasterModel";
import {
  createMaterialsMaster,
  deleteMaterialsMaster,
  enableMaterialsMaster,
  fetchMaterialsMasterList,
  updateMaterialsMaster,
} from "@data/api/admin/MasterData/materialsMasterApi";

const S = STRINGS.MASTER_DATA;

type Options = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  onListPayloadChange?: (payload: MaterialsMasterListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
  onRefresh?: () => void;
};

export default function useMaterialsMasterHook({
  activeFilter,
  refreshKey = 0,
  onListPayloadChange,
  onStatsChange,
  onRefresh,
}: Options) {
  const onListPayloadChangeRef = useRef(onListPayloadChange);
  const onStatsChangeRef = useRef(onStatsChange);
  const onRefreshRef = useRef(onRefresh);
  onListPayloadChangeRef.current = onListPayloadChange;
  onStatsChangeRef.current = onStatsChange;
  onRefreshRef.current = onRefresh;

  const [items, setItems] = useState<MaterialsMasterRecord[]>([]);
  const [listPayload, setListPayload] = useState<MaterialsMasterListPayload | null>(null);
  const [stats, setStats] = useState(emptyMasterDataStats());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [inlineMode, setInlineMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<MaterialsMasterFormState>(createEmptyMaterialsForm());
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (search.trim()) body.search = search.trim();
      if (activeFilter === "ACTIVE") body.isActive = true;
      if (activeFilter === "INACTIVE") body.isActive = false;
      const resp = new ApiResponseModel(await fetchMaterialsMasterList(body), MaterialsMasterListModel.fromApi);
      if (resp.success && resp.data) {
        setListPayload(resp.data);
        setItems(resp.data.items);
        setStats(resp.data.stats);
        onListPayloadChangeRef.current?.(resp.data);
        onStatsChangeRef.current?.(resp.data.stats);
      } else {
        setListPayload(null);
        setItems([]);
        setStats(emptyMasterDataStats());
        onListPayloadChangeRef.current?.(null);
        onStatsChangeRef.current?.(emptyMasterDataStats());
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.LOAD_LIST_FAILED), "error");
      }
    } catch (err: any) {
      setListPayload(null);
      setItems([]);
      setStats(emptyMasterDataStats());
      onListPayloadChangeRef.current?.(null);
      onStatsChangeRef.current?.(emptyMasterDataStats());
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(err?.response?.data, S.ERRORS.LOAD_LIST_FAILED), "error");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  useEffect(() => {
    setPage(0);
    setInlineMode(null);
    void loadList();
  }, [loadList, refreshKey]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const closeInline = () => {
    if (saving) return;
    setInlineMode(null);
    setForm(createEmptyMaterialsForm());
  };

  const openCreate = () => {
    setForm(createEmptyMaterialsForm());
    setInlineMode("create");
  };

  const openEdit = (record: MaterialsMasterRecord) => {
    setForm(mapMaterialRecordToForm(record));
    setInlineMode("edit");
  };

  const refreshAfterMutation = useCallback(async () => {
    await loadList();
    onRefreshRef.current?.();
  }, [loadList]);

  const saveForm = async (): Promise<boolean> => {
    const isEdit = inlineMode === "edit";
    const err = validateMaterialsForm(
      form,
      isEdit,
      items.map((item) => item.materialCode),
    );
    if (err) {
      useAlertStore.getState().showValidationAlert(err);
      return false;
    }
    setSaving(true);
    useAlertStore.getState().showAlert(isEdit ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING, "loading");
    try {
      const raw = isEdit
        ? await updateMaterialsMaster(buildMaterialsUpdatePayload(form))
        : await createMaterialsMaster(buildMaterialsCreatePayload(form));
      const resp = new ApiResponseModel(raw);
      const succeeded =
        resp.success || resp.statusCode === 200 || resp.statusCode === 201;
      if (succeeded) {
        useAlertStore
          .getState()
          .showAlert(isEdit ? S.MESSAGES.UPDATE_SUCCESS : S.MESSAGES.CREATE_SUCCESS, "success");
        setInlineMode(null);
        setForm(createEmptyMaterialsForm());
        await refreshAfterMutation();
        return true;
      } else {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
        return false;
      }
    } catch (e: any) {
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(e?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const enableRecord = useCallback(async (record: MaterialsMasterRecord) => {
    setEnabling(true);
    useAlertStore.getState().showAlert(S.MESSAGES.ENABLING, "loading");
    try {
      const resp = new ApiResponseModel(
        await enableMaterialsMaster(buildMaterialsDeletePayload(record.materialId)),
      );
      if (resp.success) {
        useAlertStore.getState().showAlert(S.MESSAGES.ENABLE_SUCCESS, "success");
        await refreshAfterMutation();
      } else {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
      }
    } catch (e: any) {
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(e?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
    } finally {
      setEnabling(false);
    }
  }, [refreshAfterMutation]);

  const disableRecord = useCallback(async (record: MaterialsMasterRecord) => {
    setDisabling(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DISABLING, "loading");
    try {
      const resp = new ApiResponseModel(
        await deleteMaterialsMaster(buildMaterialsDeletePayload(record.materialId)),
      );
      if (resp.success) {
        useAlertStore.getState().showAlert(S.MESSAGES.DISABLE_SUCCESS, "success");
        await refreshAfterMutation();
      } else {
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
      }
    } catch (e: any) {
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(e?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
    } finally {
      setDisabling(false);
    }
  }, [refreshAfterMutation]);

  const canToggle = useCallback(
    () => inlineMode == null && !saving && !disabling && !enabling,
    [inlineMode, saving, disabling, enabling],
  );

  const {
    toggleTarget,
    handleToggleActive,
    confirmToggle,
    cancelToggle,
  } = useMasterDataActiveToggle({
    canToggle,
    enableRecord,
    disableRecord,
  });

  return {
    items,
    paginated,
    listPayload,
    stats,
    loading,
    search,
    setSearch: (v: string) => {
      setSearch(v);
      setPage(0);
    },
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage: (n: number) => {
      setRowsPerPage(n);
      setPage(0);
    },
    inlineMode,
    form,
    setForm,
    saving,
    openCreate,
    openEdit,
    closeInline,
    saveForm,
    toggleTarget,
    disabling,
    enabling,
    handleToggleActive,
    confirmToggle,
    cancelToggle,
    refresh: refreshAfterMutation,
  };
}
