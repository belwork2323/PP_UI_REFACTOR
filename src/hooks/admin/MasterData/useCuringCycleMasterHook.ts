import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import { getMasterDataErrorMessage } from "@data/models/admin/MasterData/MasterDataModel";
import {
  buildCuringCycleCreatePayload,
  buildCuringCycleDeletePayload,
  buildCuringCycleUpdatePayload,
  createEmptyCuringCycleForm,
  emptyMasterDataStats,
  mapCuringRecordToForm,
  CuringCycleListModel,
  validateCuringCycleForm,
  type CuringCycleFormState,
  type CuringCycleListPayload,
  type CuringCycleRecord,
} from "@data/models/admin/MasterData/CuringCycleMasterModel";
import {
  createCuringCycleMaster,
  deleteCuringCycleMaster,
  fetchCuringCycleMasterList,
  updateCuringCycleMaster,
} from "@data/api/admin/MasterData/curingCycleMasterApi";

const S = STRINGS.MASTER_DATA;

type Options = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  onListPayloadChange?: (payload: CuringCycleListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

export default function useCuringCycleMasterHook({
  activeFilter,
  refreshKey = 0,
  onListPayloadChange,
  onStatsChange,
}: Options) {
  const onListPayloadChangeRef = useRef(onListPayloadChange);
  const onStatsChangeRef = useRef(onStatsChange);
  onListPayloadChangeRef.current = onListPayloadChange;
  onStatsChangeRef.current = onStatsChange;

  const [items, setItems] = useState<CuringCycleRecord[]>([]);
  const [listPayload, setListPayload] = useState<CuringCycleListPayload | null>(null);
  const [stats, setStats] = useState(emptyMasterDataStats());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inlineMode, setInlineMode] = useState<"create" | "edit" | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<CuringCycleFormState>(createEmptyCuringCycleForm());
  const [saving, setSaving] = useState(false);
  const [disableTarget, setDisableTarget] = useState<CuringCycleRecord | null>(null);
  const [disabling, setDisabling] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (search.trim()) body.search = search.trim();
      if (activeFilter === "ACTIVE") body.isActive = true;
      if (activeFilter === "INACTIVE") body.isActive = false;
      const resp = new ApiResponseModel(await fetchCuringCycleMasterList(body), CuringCycleListModel.fromApi);
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
        useAlertStore.getState().showAlert(getMasterDataErrorMessage(resp, S.ERRORS.LOAD_LIST_FAILED), "error");
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
    setExpandedId(null);
    void loadList();
  }, [loadList, refreshKey]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const closeInline = () => {
    if (saving) return;
    setInlineMode(null);
    setForm(createEmptyCuringCycleForm());
  };

  const openCreate = () => {
    setExpandedId(null);
    setForm(createEmptyCuringCycleForm());
    setInlineMode("create");
  };

  const openEdit = (record: CuringCycleRecord) => {
    setExpandedId(record.id);
    setForm(mapCuringRecordToForm(record));
    setInlineMode("edit");
  };

  const saveForm = async () => {
    const isEdit = inlineMode === "edit";
    const err = validateCuringCycleForm(form, isEdit);
    if (err) {
      useAlertStore.getState().showAlert(err, "error");
      return;
    }
    setSaving(true);
    useAlertStore.getState().showAlert(isEdit ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING, "loading");
    try {
      const raw = isEdit
        ? await updateCuringCycleMaster(buildCuringCycleUpdatePayload(form))
        : await createCuringCycleMaster(buildCuringCycleCreatePayload(form));
      const resp = new ApiResponseModel(raw);
      if (resp.success) {
        useAlertStore
          .getState()
          .showAlert(isEdit ? S.MESSAGES.UPDATE_SUCCESS : S.MESSAGES.CREATE_SUCCESS, "success");
        setInlineMode(null);
        setForm(createEmptyCuringCycleForm());
        await loadList();
      } else {
        useAlertStore.getState().showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
      }
    } catch (e: any) {
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(e?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDisable = async () => {
    if (!disableTarget) return;
    setDisabling(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DISABLING, "loading");
    try {
      const resp = new ApiResponseModel(
        await deleteCuringCycleMaster(buildCuringCycleDeletePayload(disableTarget.id)),
      );
      if (resp.success) {
        useAlertStore.getState().showAlert(S.MESSAGES.DISABLE_SUCCESS, "success");
        setDisableTarget(null);
        await loadList();
      } else {
        useAlertStore.getState().showAlert(getMasterDataErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
      }
    } catch (e: any) {
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(e?.response?.data, S.ERRORS.OPERATION_FAILED), "error");
    } finally {
      setDisabling(false);
    }
  };

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
    expandedId,
    setExpandedId,
    form,
    setForm,
    saving,
    openCreate,
    openEdit,
    closeInline,
    saveForm,
    disableTarget,
    setDisableTarget,
    disabling,
    confirmDisable,
    refresh: loadList,
  };
}
