import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PART_A_INITIAL } from "./liquidPreparationConfig";

type PartAState = {
  jacketTemp: string;
  rpm: string;
  time: string;
};

type WeightmentRow = {
  id: number;
  material: string;
  percentage: string;
  weightKg: string;
  lotNo: string;
  dateTime: string;
  remarks: string;
};

const createWeightmentRow = (id: number, material: string): WeightmentRow => ({
  id,
  material,
  percentage: "",
  weightKg: "",
  lotNo: "",
  dateTime: "",
  remarks: "",
});

export const useLiquidPreparationHook = (
  initialData?: { partA?: Partial<PartAState>; rows?: WeightmentRow[] },
  onBlocksChange?: (payload: { partA: PartAState; rows: WeightmentRow[] }) => void
) => {
  const rowIdRef = useRef(1);
  const [partA, setPartA] = useState<PartAState>({
    ...PART_A_INITIAL,
    ...(initialData?.partA ?? {}),
  });
  const [partBRows, setPartBRows] = useState<WeightmentRow[]>(initialData?.rows ?? []);
  const [selectedMaterial, setSelectedMaterial] = useState("");

  useEffect(() => {
    const nextPartA = {
      ...PART_A_INITIAL,
      ...(initialData?.partA ?? {}),
    };
    const nextRows = initialData?.rows ?? [];
    setPartA(nextPartA);
    setPartBRows(nextRows);
    const maxId = nextRows.reduce((acc, row) => Math.max(acc, Number(row.id) || 0), 0);
    rowIdRef.current = maxId + 1;
  }, [initialData]);

  const pushStateToParent = useCallback(
    (nextPartA: PartAState, nextPartBRows: WeightmentRow[]) => {
      onBlocksChange?.({ partA: nextPartA, rows: nextPartBRows });
    },
    [onBlocksChange]
  );

  const notifyParent = useCallback(
    (nextPartA: PartAState, nextPartBRows: WeightmentRow[]) => {
      pushStateToParent(nextPartA, nextPartBRows);
    },
    [pushStateToParent]
  );

  const handlePartAChange = useCallback(
    (field: keyof PartAState, value: string) => {
      setPartA((prev) => {
        const next = { ...prev, [field]: value };
        notifyParent(next, partBRows);
        return next;
      });
    },
    [notifyParent, partBRows]
  );

  const handleRowsChange = useCallback(
    (nextRows: WeightmentRow[]) => {
      setPartBRows(nextRows);
      notifyParent(partA, nextRows);
    },
    [notifyParent, partA]
  );

  const handleAddMaterialRow = useCallback(() => {
    if (!selectedMaterial) return;
    const newRow = createWeightmentRow(rowIdRef.current, selectedMaterial);
    rowIdRef.current += 1;
    const next = [...partBRows, newRow];
    handleRowsChange(next);
    setSelectedMaterial("");
  }, [handleRowsChange, partBRows, selectedMaterial]);

  const handleRowChange = useCallback(
    (id: number, field: keyof WeightmentRow, value: string) => {
      const next = partBRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      );
      handleRowsChange(next);
    },
    [handleRowsChange, partBRows]
  );

  const handleRowRemove = useCallback(
    (id: number) => {
      const next = partBRows.filter((row) => row.id !== id);
      handleRowsChange(next);
    },
    [handleRowsChange, partBRows]
  );

  const filledRowsCount = useMemo(
    () =>
      partBRows.filter(
        (row) => row.percentage || row.weightKg || row.lotNo || row.dateTime
      ).length,
    [partBRows]
  );

  return {
    partA,
    partBRows,
    selectedMaterial,
    setSelectedMaterial,
    filledRowsCount,
    handlePartAChange,
    handleAddMaterialRow,
    handleRowChange,
    handleRowRemove,
  };
};

export default useLiquidPreparationHook;
