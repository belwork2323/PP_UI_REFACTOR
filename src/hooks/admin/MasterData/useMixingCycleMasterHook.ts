import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import { getMasterDataErrorMessage } from "@data/models/admin/MasterData/MasterDataModel";
import {
  buildMixingCycleCreatePayload,
  buildMixingCycleDeletePayload,
  buildMixingCycleUpdatePayload,
  createEmptyMixingCycleForm,
  emptyMasterDataStats,
  mapMixingRecordToForm,
  MixingCycleListModel,
  validateMixingCycleForm,
  type MixingCycleFormState,
  type MixingCycleListPayload,
  type MixingCycleRecord,
} from "@data/models/admin/MasterData/MixingCycleMasterModel";
import {
  createMixingCycleMaster,
  deleteMixingCycleMaster,
  fetchMixingCycleMasterList,
  updateMixingCycleMaster,
} from "@data/api/admin/MasterData/mixingCycleMasterApi";

const S = STRINGS.MASTER_DATA;

type Options = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  onListPayloadChange?: (payload: MixingCycleListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

export default function useMixingCycleMasterHook({
  activeFilter,
  refreshKey = 0,
  onListPayloadChange,
  onStatsChange,
}: Options) {
  const onListPayloadChangeRef = useRef(onListPayloadChange);
  const onStatsChangeRef = useRef(onStatsChange);
  onListPayloadChangeRef.current = onListPayloadChange;
  onStatsChangeRef.current = onStatsChange;

  const [items, setItems] = useState<MixingCycleRecord[]>([]);
  const [listPayload, setListPayload] = useState<MixingCycleListPayload | null>(null);
  const [stats, setStats] = useState(emptyMasterDataStats());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inlineMode, setInlineMode] = useState<"create" | "edit" | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState<MixingCycleFormState>(createEmptyMixingCycleForm());
  const [saving, setSaving] = useState(false);
  const [disableTarget, setDisableTarget] = useState<MixingCycleRecord | null>(null);
  const [disabling, setDisabling] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (search.trim()) body.search = search.trim();
      if (activeFilter === "ACTIVE") body.isActive = true;
      if (activeFilter === "INACTIVE") body.isActive = false;
      const resp = new ApiResponseModel(await fetchMixingCycleMasterList(body), MixingCycleListModel.fromApi);
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
    setForm(createEmptyMixingCycleForm());
  };

  const openCreate = () => {
    setExpandedId(null);
    setForm(createEmptyMixingCycleForm());
    setInlineMode("create");
  };

  const openEdit = (record: MixingCycleRecord) => {
    setExpandedId(record.id);
    setForm(mapMixingRecordToForm(record));
    setInlineMode("edit");
  };

  const saveForm = async () => {
    const isEdit = inlineMode === "edit";
    const err = validateMixingCycleForm(form);
    if (err) {
      useAlertStore.getState().showAlert(err, "error");
      return;
    }
    setSaving(true);
    useAlertStore.getState().showAlert(isEdit ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING, "loading");
    try {
      const raw = isEdit
        ? await updateMixingCycleMaster(buildMixingCycleUpdatePayload(form))
        : await createMixingCycleMaster(buildMixingCycleCreatePayload(form));
      const resp = new ApiResponseModel(raw);
      if (resp.success) {
        useAlertStore
          .getState()
          .showAlert(isEdit ? S.MESSAGES.UPDATE_SUCCESS : S.MESSAGES.CREATE_SUCCESS, "success");
        setInlineMode(null);
        setForm(createEmptyMixingCycleForm());
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
        await deleteMixingCycleMaster(buildMixingCycleDeletePayload(disableTarget.id)),
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
