import { useState, useCallback, useEffect } from "react";
import { batchManagementController } from "../../../controllers/admin/batch_management/batchManagementController";
import { generalController } from "../../../controllers/admin/common/generalController";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";

const EMPTY_FORM = {
  batchId: "", motorId: "", projectName: "", batchType: "",
  priority: "Medium", assignedTo: "", notes: "",
};

export const useBatchManagement = () => {
  const [batches, setBatches]           = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [subDepts, setSubDepts]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);

  // Filter states
  const [search, setSearch]                 = useState("");
  const [filterStage, setFilterStage]       = useState("All");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterDept, setFilterDept]         = useState("All");
  const [page, setPage]                     = useState(0);
  const [rowsPerPage, setRowsPerPage]       = useState(8);
  const [filterOpen, setFilterOpen]         = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  // Modal states
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  // ── Delete reason — required by the API ───────────────────────────────────
  const [deleteReason, setDeleteReason] = useState("");

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        ...(search.trim()              && { search      : search.trim() }),
        ...(filterStatus  !== "All"    && { status      : filterStatus }),
        ...(filterPriority !== "All"   && { priority    : filterPriority }),
        ...(filterDept    !== "All"    && { department  : filterDept }),
      };

      const [batchResp, deptResp, subDeptResp, userResp] = await Promise.all([
        batchManagementController.getAllBatches(page + 1, rowsPerPage, filters),
        generalController.getDepartments(),
        generalController.getSubDepartments(),
        userManagementController.getAllUsers({ page: 1, pageSize: 1000, status: "Active" }),
      ]);

      if (batchResp) {
        setBatches(batchResp.batches || []);
        setPaginationData({
          totalRecords: batchResp.pagination?.totalRecords || 0,
          totalPages  : batchResp.pagination?.totalPages   || 0,
        });
      }

      setDepartments(deptResp?.data || []);
      setSubDepts(subDeptResp?.data || []);

      if (userResp) {
        setUsers(Array.isArray(userResp) ? userResp : (userResp.users || []));
      }
    } catch (err) {
      console.error("Failed to load batch management data:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority, filterDept, page, rowsPerPage]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  const activeFilters = [filterStage, filterStatus, filterPriority, filterDept]
    .filter(v => v !== "All").length;

  const handleClearFilters = () => {
    setFilterStage("All");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterDept("All");
    setPage(0);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlers = {
    handleSearch    : (val: string) => { setSearch(val); setPage(0); },
    handlePageChange: (_: any, p: number) => setPage(p),
    handleRowsChange: (e: any) => { setRowsPerPage(+e.target.value); setPage(0); },
    handleClearFilters,
    refresh         : loadAllData,

    openCreate: () => {
      setEditTarget(null);
      setForm(EMPTY_FORM);
      setModalOpen(true);
    },

    openEdit: (batch: any) => {
      setEditTarget(batch);
      setForm({ ...batch, assignedTo: batch.assignedTo?.id || "" });
      setModalOpen(true);
    },

    // Reset reason each time the delete dialog opens
    openDelete: (batch: any) => {
      setDeleteTarget(batch);
      setDeleteReason("");
      setDeleteOpen(true);
    },

    handleFormChange: (field: string) => (e: any) =>
      setForm(prev => ({ ...prev, [field]: e.target.value })),

    handleSave: async () => {
      setSaving(true);
      const success = editTarget
        ? await batchManagementController.updateBatch(editTarget.batchId, form)
        : await batchManagementController.createBatch(form);
      if (success) { await loadAllData(); setModalOpen(false); }
      setSaving(false);
    },

    // Passes both batchId and reason to satisfy the API contract
    handleDelete: async () => {
      if (!deleteTarget || !deleteReason.trim()) return;
      setDeleting(true);
      const success = await batchManagementController.deleteBatch(
        deleteTarget.batchId,
        deleteReason.trim()
      );
      if (success) {
        await loadAllData();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteReason("");
      }
      setDeleting(false);
    },
  };

  return {
    state: {
      batches,
      loading,
      filtered: batches,
      page,
      rowsPerPage,
      search,
      filterOpen,
      filterStage,
      filterStatus,
      filterPriority,
      filterDept,
      modalOpen,
      deleteOpen,
      editTarget,
      deleteTarget,
      deleteReason,       // ← wire into DeleteDialog as value
      form,
      saving,
      deleting,
      departments,
      subDepts,
      users,
      paginationData,
      activeFilters,
    },
    setters: {
      setFilterStage,
      setFilterStatus,
      setFilterPriority,
      setFilterDept,
      setFilterOpen,
      setModalOpen,
      setDeleteOpen,
      setSearch,
      setPage,
      setRowsPerPage,
      setDeleteReason,    // ← wire into DeleteDialog onChange
    },
    handlers,
  };
};