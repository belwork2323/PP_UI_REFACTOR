import { useState, useMemo, useCallback, useEffect } from "react";

const SUBDEPT_RESTRICTED_ROLES = ["Admin", "System Manager"];
const SUBDEPT_MANDATORY_ROLES = ["User", "Approver"];
const normalizeSubDeptIds = (subDepts: any[]) =>
  (Array.isArray(subDepts) ? subDepts : [])
    .map((sd: any) => Number(sd?.subDepartmentId))
    .filter((id: number) => Number.isFinite(id))
    .sort((a, b) => a - b);

export const useUserFormModal = ({
  open,
  editTarget,
  availableSubDepts,
  form,
  onSubDeptsChange,
}: {
  open: boolean;
  editTarget: any;
  availableSubDepts: any[];
  form: any;
  onSubDeptsChange: (subDepts: any[]) => void;
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingSubDepts, setPendingSubDepts] = useState<any[]>([]);
  const [selectorMaxHeight, setSelectorMaxHeight] = useState(240);

  useEffect(() => {
    if (!open) {
      setSelectorOpen(false);
      setSearch("");
      setPendingSubDepts([]);
    }
  }, [open, editTarget]);

  useEffect(() => {
    const computeHeight = () => {
      const viewportHeight = window.innerHeight;
      const reserved = 72 + 60 + 220 + 90;
      const available = Math.floor(viewportHeight * 0.9) - reserved;
      setSelectorMaxHeight(Math.min(320, Math.max(120, available)));
    };

    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  const subDeptsRestricted = useMemo(
    () => SUBDEPT_RESTRICTED_ROLES.includes(form.role),
    [form.role]
  );

  const subDeptsMandatory = useMemo(
    () => SUBDEPT_MANDATORY_ROLES.includes(form.role),
    [form.role]
  );

  const createFormValid = useMemo(
    () =>
      Boolean(
        form.username?.trim() &&
          form.userId?.trim() &&
          form.role &&
          (subDeptsMandatory ? form.subDepts.length > 0 : true)
      ),
    [form.username, form.userId, form.role, form.subDepts, subDeptsMandatory]
  );

  const updateFormValid = useMemo(
    () =>
      Boolean(
        form.username?.trim() &&
          form.role &&
          (subDeptsMandatory ? form.subDepts.length > 0 : true)
      ),
    [form.username, form.role, form.subDepts, subDeptsMandatory]
  );

  const hasCommittedChanges = useMemo(() => {
    if (!editTarget) return true;
    const currentUsername = String(form.username ?? "").trim();
    const originalUsername = String(editTarget?.username ?? "").trim();
    const usernameChanged = currentUsername !== originalUsername;

    const currentSubDeptIds = normalizeSubDeptIds(form.subDepts);
    const originalSubDeptIds = normalizeSubDeptIds(editTarget?.subDepartments);
    const subDeptChanged =
      currentSubDeptIds.length !== originalSubDeptIds.length ||
      currentSubDeptIds.some((id, idx) => id !== originalSubDeptIds[idx]);

    return usernameChanged || subDeptChanged;
  }, [editTarget, form.username, form.subDepts]);

  const canSubmit = useMemo(
    () => (editTarget ? updateFormValid && hasCommittedChanges : createFormValid),
    [editTarget, updateFormValid, hasCommittedChanges, createFormValid]
  );

  const pendingSubDeptIds = useMemo(
    () => pendingSubDepts.map((sd: any) => sd.subDepartmentId),
    [pendingSubDepts]
  );

  const filteredDepts = useMemo(() => {
    if (!search.trim()) return availableSubDepts || [];
    return (availableSubDepts || []).filter((sd: any) =>
      sd.subDepartmentName.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableSubDepts, search]);

  const handleOpenSelector = useCallback(() => {
    setPendingSubDepts([...form.subDepts]);
    setSelectorOpen(true);
  }, [form.subDepts]);

  const handleCommitSelector = useCallback(() => {
    onSubDeptsChange(pendingSubDepts);
    setSelectorOpen(false);
    setSearch("");
    setPendingSubDepts([]);
  }, [pendingSubDepts, onSubDeptsChange]);

  const handleCancelSelector = useCallback(() => {
    setSelectorOpen(false);
    setSearch("");
    setPendingSubDepts([]);
  }, []);

  const handleToggleDept = useCallback((sd: any) => {
    setPendingSubDepts((prev) => {
      const exists = prev.some((s: any) => s.subDepartmentId === sd.subDepartmentId);
      return exists
        ? prev.filter((s: any) => s.subDepartmentId !== sd.subDepartmentId)
        : [...prev, sd];
    });
  }, []);

  const handleRemoveSubDept = useCallback(
    (id: number) => {
      onSubDeptsChange(
        form.subDepts.filter((sd: any) => sd.subDepartmentId !== id)
      );
    },
    [form.subDepts, onSubDeptsChange]
  );

  const handleClearPending = useCallback(() => {
    setPendingSubDepts([]);
  }, []);

  return {
    selectorOpen,
    search,
    setSearch,
    selectorMaxHeight,
    subDeptsRestricted,
    subDeptsMandatory,
    createFormValid,
    updateFormValid,
    hasCommittedChanges,
    canSubmit,
    pendingSubDeptIds,
    pendingSubDepts,
    filteredDepts,
    handleOpenSelector,
    handleCommitSelector,
    handleCancelSelector,
    handleToggleDept,
    handleRemoveSubDept,
    handleClearPending,
  };
};
