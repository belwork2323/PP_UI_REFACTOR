import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  countMixingTotalFields,
  countMixingTotalFilled,
  createMixingData,
} from "./mixingConfig";
import type { MixingFormState } from "../../../data/models/user/MixingFormModel";

type MixingData = ReturnType<typeof createMixingData>;
type MixingFormRow = {
  id?: number;
  operation: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

const withFixedIds = (rows: MixingFormRow[]) =>
  rows.map((row, index) => ({ ...row, id: index + 1 }));

const withDynamicIds = (rows: MixingFormRow[]) =>
  rows.map((row, index) => ({ ...row, id: row.id ?? index + 1 }));

const toFormPayload = (
  preFixedRows: MixingFormRow[],
  preDynamicRows: MixingFormRow[],
  samplingRow: MixingFormRow,
  finalState: { tdi: MixingFormRow; viscosity: MixingFormRow }
): MixingFormState => ({
  pre: {
    fixed: preFixedRows,
    dynamic: preDynamicRows,
    sampling: samplingRow,
  },
  final: {
    tdi: finalState.tdi,
    viscosity: finalState.viscosity,
  },
});

export const useMixingFormHook = (
  initialData?: Partial<MixingData>,
  onBlocksChange?: (payload: MixingFormState) => void
) => {
  const defaults = useMemo(() => createMixingData(), []);
  const dynamicIdRef = useRef(0);

  const [preFixed, setPreFixed] = useState<MixingFormRow[]>(() =>
    withFixedIds((initialData?.pre?.fixed ?? defaults.pre.fixed) as MixingFormRow[])
  );
  const [preDynamic, setPreDynamic] = useState<MixingFormRow[]>(
    withDynamicIds((initialData?.pre?.dynamic ?? []) as MixingFormRow[])
  );
  const [sampling, setSampling] = useState(
    (initialData?.pre?.sampling ?? defaults.pre.sampling) as MixingFormRow
  );
  const [finalRows, setFinalRows] = useState({
    tdi: (initialData?.final?.tdi ?? defaults.final.tdi) as MixingFormRow,
    viscosity: (initialData?.final?.viscosity ?? defaults.final.viscosity) as MixingFormRow,
  });

  useEffect(() => {
    const nextFixed = withFixedIds((initialData?.pre?.fixed ?? defaults.pre.fixed) as MixingFormRow[]);
    const nextDynamic = withDynamicIds((initialData?.pre?.dynamic ?? []) as MixingFormRow[]);
    const nextSampling = (initialData?.pre?.sampling ?? defaults.pre.sampling) as MixingFormRow;
    const nextFinal = {
      tdi: (initialData?.final?.tdi ?? defaults.final.tdi) as MixingFormRow,
      viscosity: (initialData?.final?.viscosity ?? defaults.final.viscosity) as MixingFormRow,
    };

    dynamicIdRef.current = nextDynamic.reduce<number>(
      (maxId, row, index) => Math.max(maxId, row.id ?? index + 1),
      0
    );

    setPreFixed(nextFixed);
    setPreDynamic(nextDynamic);
    setSampling(nextSampling);
    setFinalRows(nextFinal);
  }, [initialData, defaults]);

  const notify = useCallback(
    (
      nextPreFixed: MixingFormRow[],
      nextPreDynamic: MixingFormRow[],
      nextSampling: MixingFormRow,
      nextFinalRows: { tdi: MixingFormRow; viscosity: MixingFormRow }
    ) => {
      onBlocksChange?.(toFormPayload(nextPreFixed, nextPreDynamic, nextSampling, nextFinalRows));
    },
    [onBlocksChange]
  );

  const updateFixed = useCallback(
    (index: number, field: string, value: string) => {
      setPreFixed((prev) => {
        const next = prev.map((row: MixingFormRow, rowIndex: number) =>
          rowIndex === index ? { ...row, [field]: value } : row
        );
        notify(next, preDynamic, sampling, finalRows);
        return next;
      });
    },
    [finalRows, notify, preDynamic, sampling]
  );

  const addDynamicRow = useCallback(() => {
    dynamicIdRef.current += 1;
    setPreDynamic((prev) => {
      const next = [...prev, { id: dynamicIdRef.current, operation: "", rpm: "", time: "", temp: "", vacuum: "" }];
      notify(preFixed, next, sampling, finalRows);
      return next;
    });
  }, [finalRows, notify, preFixed, sampling]);

  const deleteDynamicRow = useCallback(
    (id: number) => {
      setPreDynamic((prev) => {
        const next = prev.filter((row: MixingFormRow) => row.id !== id);
        notify(preFixed, next, sampling, finalRows);
        return next;
      });
    },
    [finalRows, notify, preFixed, sampling]
  );

  const updateDynamic = useCallback(
    (id: number, field: string, value: string) => {
      setPreDynamic((prev) => {
        const next = prev.map((row: MixingFormRow) =>
          row.id === id ? { ...row, [field]: value } : row
        );
        notify(preFixed, next, sampling, finalRows);
        return next;
      });
    },
    [finalRows, notify, preFixed, sampling]
  );

  const updateSampling = useCallback(
    (field: string, value: string) => {
      setSampling((prev) => {
        const next = { ...prev, [field]: value };
        notify(preFixed, preDynamic, next, finalRows);
        return next;
      });
    },
    [finalRows, notify, preDynamic, preFixed]
  );

  const updateFinal = useCallback(
    (key: "tdi" | "viscosity", field: string, value: string) => {
      setFinalRows((prev) => {
        const next = { ...prev, [key]: { ...prev[key], [field]: value } };
        notify(preFixed, preDynamic, sampling, next);
        return next;
      });
    },
    [notify, preDynamic, preFixed, sampling]
  );

  const preFilled = useMemo(
    () => countMixingTotalFilled([...preFixed, sampling], preDynamic),
    [preDynamic, preFixed, sampling]
  );
  const preTotal = useMemo(
    () => countMixingTotalFields([...preFixed, sampling], preDynamic),
    [preDynamic, preFixed, sampling]
  );
  const finalFilled = useMemo(() => countMixingTotalFilled(Object.values(finalRows), []), [finalRows]);
  const finalTotal = useMemo(() => countMixingTotalFields(Object.values(finalRows), []), [finalRows]);

  return {
    preFixed,
    preDynamic,
    sampling,
    finalRows,
    preFilled,
    preTotal,
    finalFilled,
    finalTotal,
    updateFixed,
    addDynamicRow,
    deleteDynamicRow,
    updateDynamic,
    updateSampling,
    updateFinal,
  };
};

export default useMixingFormHook;
