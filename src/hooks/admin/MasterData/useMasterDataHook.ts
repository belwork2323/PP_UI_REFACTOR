import { useCallback, useEffect, useMemo, useState } from "react";
import { useMasterDataActiveToggle } from "@hooks/admin/MasterData/useMasterDataActiveToggle";
import { masterDataController } from "@controllers/admin/MasterData/masterDataController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import {
  createEmptyMasterDataForm,
  emptyMasterDataStats,
  getMasterDataErrorMessage,
  isMasterDataFormComplete,
  mapRecordToForm,
  validateMasterDataForm,
  type MasterDataFormState,
  type MasterDataListPayload,
  type MasterDataRecord,
  type MasterDataTypeDescriptor,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  EXCLUDED_MASTER_DATA_TYPES,
  isNestedMasterDataType,
} from "@data/models/admin/MasterData/nestedMasterDataTypes";

const S = STRINGS.MASTER_DATA;

export default function useMasterDataHook() {
  const [types, setTypes] = useState<MasterDataTypeDescriptor[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [listPayload, setListPayload] = useState<MasterDataListPayload | null>(null);
  const [items, setItems] = useState<MasterDataRecord[]>([]);
  const [stats, setStats] = useState(emptyMasterDataStats());
  const [schema, setSchema] = useState<MasterDataTypeDescriptor | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [nestedRefreshKey, setNestedRefreshKey] = useState(0);

  const [inlineMode, setInlineMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<MasterDataRecord | null>(null);
  const [form, setForm] = useState<MasterDataFormState>(createEmptyMasterDataForm(null));
  const [saving, setSaving] = useState(false);

  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const closeInline = useCallback(() => {
    if (saving) return;
    setInlineMode(null);
    setEditTarget(null);
    setForm(createEmptyMasterDataForm(schema));
  }, [saving, schema]);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const resp = await masterDataController.getTypes();
      if (resp.success && Array.isArray(resp.data)) {
        const visibleTypes = resp.data.filter(
          (type) => !(EXCLUDED_MASTER_DATA_TYPES as readonly string[]).includes(type.type),
        );
        setTypes(visibleTypes);
        setSelectedType((prev) =>
          prev && !(EXCLUDED_MASTER_DATA_TYPES as readonly string[]).includes(prev) ? prev : "",
        );
      } else {
        setTypes([]);
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.LOAD_TYPES_FAILED), "error");
      }
    } catch (err: any) {
      setTypes([]);
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(err?.response?.data, S.ERRORS.LOAD_TYPES_FAILED), "error");
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    if (!selectedType) return;
    if (isNestedMasterDataType(selectedType)) {
      const typeMeta = types.find((t) => t.type === selectedType) ?? null;
      setSchema(typeMeta);
      setListPayload(null);
      setItems([]);
      setStats(emptyMasterDataStats());
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    try {
      const resp = await masterDataController.list(selectedType, {
        search,
        isActive: activeFilter === "ALL" ? null : activeFilter === "ACTIVE",
      });
      if (resp.success && resp.data) {
        setListPayload(resp.data);
        setItems(resp.data.items);
        setStats(resp.data.stats);
        setSchema(resp.data.schema);
      } else {
        setListPayload(null);
        setItems([]);
        setStats(emptyMasterDataStats());
        useAlertStore
          .getState()
          .showAlert(getMasterDataErrorMessage(resp, S.ERRORS.LOAD_LIST_FAILED), "error");
      }
    } catch (err: any) {
      setListPayload(null);
      setItems([]);
      setStats(emptyMasterDataStats());
      useAlertStore
        .getState()
        .showAlert(getMasterDataErrorMessage(err?.response?.data, S.ERRORS.LOAD_LIST_FAILED), "error");
    } finally {
      setLoadingList(false);
    }
  }, [selectedType, search, activeFilter, types]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    setPage(0);
    setInlineMode(null);
    setEditTarget(null);
    if (!selectedType) {
      setListPayload(null);
      setItems([]);
      setStats(emptyMasterDataStats());
      setSchema(null);
      setLoadingList(false);
      return;
    }
    void loadList();
  }, [loadList, selectedType, activeFilter, types]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(createEmptyMasterDataForm(schema));
    setInlineMode("create");
  };

  const openEdit = (record: MasterDataRecord) => {
    setEditTarget(record);
    setForm(mapRecordToForm(record, schema));
    setInlineMode("edit");
  };

  const onFormChange = (key: string, value: string | number | boolean, isAttribute = false) => {
    setForm((prev) => {
      if (!isAttribute) {
        return { ...prev, [key]: value } as MasterDataFormState;
      }
      return {
        ...prev,
        attributes: { ...prev.attributes, [key]: value },
      };
    });
  };

  const saveForm = async () => {
    const isEdit = inlineMode === "edit";
    const err = validateMasterDataForm(form, schema, isEdit);
    if (err) {
      useAlertStore.getState().showValidationAlert(err);
      return;
    }

    setSaving(true);
    useAlertStore.getState().showAlert(isEdit ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING, "loading");
    try {
      const resp = isEdit
        ? await masterDataController.update(selectedType, form, schema)
        : await masterDataController.create(selectedType, form, schema);
      if (resp.success) {
        useAlertStore
          .getState()
          .showAlert(isEdit ? S.MESSAGES.UPDATE_SUCCESS : S.MESSAGES.CREATE_SUCCESS, "success");
        setInlineMode(null);
        setEditTarget(null);
        setForm(createEmptyMasterDataForm(schema));
        await loadList();
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
      setSaving(false);
    }
  };

  const enableRecord = useCallback(async (record: MasterDataRecord) => {
    setEnabling(true);
    useAlertStore.getState().showAlert(S.MESSAGES.ENABLING, "loading");
    try {
      const nextForm = { ...mapRecordToForm(record, schema), isActive: true };
      const resp = await masterDataController.update(selectedType, nextForm, schema);
      if (resp.success) {
        useAlertStore.getState().showAlert(S.MESSAGES.ENABLE_SUCCESS, "success");
        await loadList();
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
  }, [loadList, schema, selectedType]);

  const disableRecord = useCallback(async (record: MasterDataRecord) => {
    setDisabling(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DISABLING, "loading");
    try {
      const resp = await masterDataController.disable(selectedType, record.id);
      if (resp.success) {
        useAlertStore.getState().showAlert(S.MESSAGES.DISABLE_SUCCESS, "success");
        await loadList();
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
  }, [loadList, selectedType]);

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

  const canSave = isMasterDataFormComplete(form, schema, inlineMode === "edit");

  return {
    types,
    selectedType,
    setSelectedType: (type: string) => {
      setSelectedType(type);
      setSearch("");
      setActiveFilter("ALL");
      setInlineMode(null);
      setEditTarget(null);
    },
    loadingTypes,
    loadingList,
    items,
    paginated,
    stats,
    schema,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
    activeFilter,
    setActiveFilter: (value: "ALL" | "ACTIVE" | "INACTIVE") => {
      setActiveFilter(value);
      setPage(0);
    },
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage: (n: number) => {
      setRowsPerPage(n);
      setPage(0);
    },
    listPayload,
    setListPayload,
    setStats,
    nestedRefreshKey,
    inlineMode,
    editTarget,
    form,
    saving,
    canSave,
    openCreate,
    openEdit,
    closeInline,
    onFormChange,
    saveForm,
    toggleTarget,
    disabling,
    enabling,
    handleToggleActive,
    confirmToggle,
    cancelToggle,
    refresh: () => {
      if (!selectedType) return;
      if (isNestedMasterDataType(selectedType)) {
        setNestedRefreshKey((k) => k + 1);
        return;
      }
      void loadList();
    },
  };
}
