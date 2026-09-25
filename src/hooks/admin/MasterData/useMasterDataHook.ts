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
  const [projectFilter, setProjectFilter] = useState("");
  const [motorStageFilter, setMotorStageFilter] = useState("");
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
        .showAlert(
          getMasterDataErrorMessage(err, S.ERRORS.LOAD_TYPES_FAILED),
          "error",
        );
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
      // Nested panels own stats via onStatsChange. Do not zero them here —
      // activeFilter / search changes would wipe correct counts until a remount.
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
        .showAlert(
          getMasterDataErrorMessage(err, S.ERRORS.LOAD_LIST_FAILED),
          "error",
        );
    } finally {
      setLoadingList(false);
    }
  }, [selectedType, search, activeFilter, types]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  // Reset status cards when switching master type (nested panels re-push after load).
  useEffect(() => {
    if (!selectedType || isNestedMasterDataType(selectedType)) {
      setStats(emptyMasterDataStats());
    }
  }, [selectedType]);

  useEffect(() => {
    setPage(0);
    setInlineMode(null);
    setEditTarget(null);
    if (!selectedType) {
      setListPayload(null);
      setItems([]);
      setSchema(null);
      setLoadingList(false);
      return;
    }
    void loadList();
  }, [loadList, selectedType, activeFilter, types]);

  const filteredItems = useMemo(() => {
    if (selectedType !== "motor-stages") return items;
    return items.filter((record) => {
      if (projectFilter && String(record.attributes?.projectId ?? "") !== projectFilter) {
        return false;
      }
      if (motorStageFilter && String(record.attributes?.motorStage ?? "") !== motorStageFilter) {
        return false;
      }
      return true;
    });
  }, [items, selectedType, projectFilter, motorStageFilter]);

  const motorStageFilterOptions = useMemo(() => {
    if (selectedType !== "motor-stages") return [];
    const stages = new Set<string>();
    for (const record of items) {
      if (projectFilter && String(record.attributes?.projectId ?? "") !== projectFilter) {
        continue;
      }
      const stage = record.attributes?.motorStage;
      if (stage == null || stage === "") continue;
      stages.add(String(stage));
    }
    return Array.from(stages)
      .sort((a, b) => Number(a) - Number(b))
      .map((value) => ({ value, label: `Stage ${value}` }));
  }, [items, selectedType, projectFilter]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

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
    useAlertStore
      .getState()
      .showAlert(isEdit ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING, "loading");
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
        .showAlert(
          getMasterDataErrorMessage(e, S.ERRORS.OPERATION_FAILED),
          "error",
        );
    } finally {
      setSaving(false);
    }
  };

  const enableRecord = useCallback(
    async (record: MasterDataRecord) => {
      setEnabling(true);
      useAlertStore.getState().showAlert(S.MESSAGES.ENABLING, "loading");
      try {
        const resp = await masterDataController.enable(selectedType, record.id);
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
          .showAlert(
            getMasterDataErrorMessage(e, S.ERRORS.OPERATION_FAILED),
            "error",
          );
      } finally {
        setEnabling(false);
      }
    },
    [loadList, selectedType],
  );

  const disableRecord = useCallback(
    async (record: MasterDataRecord) => {
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
          .showAlert(
            getMasterDataErrorMessage(e, S.ERRORS.OPERATION_FAILED),
            "error",
          );
      } finally {
        setDisabling(false);
      }
    },
    [loadList, selectedType],
  );

  const canToggle = useCallback(
    () => inlineMode == null && !saving && !disabling && !enabling,
    [inlineMode, saving, disabling, enabling],
  );

  const { toggleTarget, handleToggleActive, confirmToggle, cancelToggle } =
    useMasterDataActiveToggle({
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
      setProjectFilter("");
      setMotorStageFilter("");
      setInlineMode(null);
      setEditTarget(null);
    },
    loadingTypes,
    loadingList,
    items,
    filteredItems,
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
