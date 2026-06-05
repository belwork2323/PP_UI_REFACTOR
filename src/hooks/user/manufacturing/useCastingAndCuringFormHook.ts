import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCastingAndCuringData,
  newBowlRow,
  nextTLabel,
} from "./castingAndCuringConfig";
import type {
  CastingCuringFormState,
  CastingCuringIntervalRow,
} from "../../../data/models/user/CastingCuringFormModel";

type CastingData = ReturnType<typeof createCastingAndCuringData>;
type Pair = { m1: string; m2: string };

export const useCastingAndCuringFormHook = (
  initialData?: Partial<CastingData> | CastingCuringFormState,
  onBlocksChange?: (payload: CastingCuringFormState) => void
) => {
  const defaults = useMemo(() => createCastingAndCuringData(), []);
  const bowlIdRef = useRef(0);
  const r3IdRef = useRef(0);

  const bowlSeed = (initialData as any)?.bowl ?? defaults.bowl;
  const castingSeed =
    (initialData as any)?.casting ?? (initialData as any)?.curingDetails ?? defaults.curingDetails;
  const curingSeed =
    (initialData as any)?.curing ?? (initialData as any)?.curingDetails2 ?? defaults.curingDetails2;

  const [bowlMotorIds, setBowlMotorIds] = useState(
    bowlSeed.motorIds ?? defaults.bowl.motorIds
  );
  const [bowlRows, setBowlRows] = useState<any[]>(() =>
    (bowlSeed.rows ?? defaults.bowl.rows).map((row: any, idx: number) => ({
      ...row,
      id: row.id ?? ++bowlIdRef.current,
    }))
  );

  const [cdMotorIds, setCdMotorIds] = useState(
    castingSeed.motorIds ?? defaults.curingDetails.motorIds
  );
  const [cdR1, setCdR1] = useState(castingSeed.r1 ?? defaults.curingDetails.r1);
  const [cdR2, setCdR2] = useState(castingSeed.r2 ?? defaults.curingDetails.r2);
  const [cdR3, setCdR3] = useState<any[]>(
    (castingSeed.r3 ?? defaults.curingDetails.r3).map((row: any, idx: number) => ({
      ...row,
      id: row.id ?? `t_${idx + 1}`,
    }))
  );
  const [cdR4, setCdR4] = useState(castingSeed.r4 ?? defaults.curingDetails.r4);
  const [cdR5a, setCdR5a] = useState(castingSeed.r5a ?? defaults.curingDetails.r5a);
  const [cdR5b, setCdR5b] = useState(castingSeed.r5b ?? defaults.curingDetails.r5b);
  const [cdR6, setCdR6] = useState(castingSeed.r6 ?? defaults.curingDetails.r6);

  const [cdCureMotorIds, setCdCureMotorIds] = useState(
    curingSeed?.motorIds ?? defaults.curingDetails2?.motorIds ?? { m1: "", m2: "" }
  );
  const [cureR1, setCureR1] = useState(curingSeed?.r1 ?? { m1: "", m2: "" });
  const [cureR2, setCureR2] = useState(curingSeed?.r2 ?? { m1: "", m2: "" });
  const [cureR3, setCureR3] = useState(curingSeed?.r3 ?? { m1: "", m2: "" });
  const [cureR4, setCureR4] = useState(curingSeed?.r4 ?? { m1: "", m2: "" });

  useEffect(() => {
    const nextBowl = (initialData as any)?.bowl ?? defaults.bowl;
    const nextCasting =
      (initialData as any)?.casting ??
      (initialData as any)?.curingDetails ??
      defaults.curingDetails;
    const nextCuring =
      (initialData as any)?.curing ??
      (initialData as any)?.curingDetails2 ??
      defaults.curingDetails2;

    const normalizedBowlRows = (nextBowl.rows ?? defaults.bowl.rows).map((row: any, idx: number) => ({
      ...row,
      id: row.id ?? idx + 1,
    }));

    const normalizedIntervals = (nextCasting.r3 ?? defaults.curingDetails.r3).map(
      (row: any, idx: number) => ({
        ...row,
        id: row.id ?? `t_${idx + 1}`,
      })
    );

    bowlIdRef.current = normalizedBowlRows.reduce(
      (maxId: number, row: any, idx: number) => Math.max(maxId, Number(row.id ?? idx + 1)),
      0
    );
    r3IdRef.current = normalizedIntervals.reduce(
      (maxId: number, row: any, idx: number) => {
        const parsed = Number(String(row.id ?? "").replace(/[^0-9]/g, ""));
        return Math.max(maxId, Number.isNaN(parsed) ? idx + 1 : parsed);
      },
      0
    );

    setBowlMotorIds(nextBowl.motorIds ?? defaults.bowl.motorIds);
    setBowlRows(normalizedBowlRows);
    setCdMotorIds(nextCasting.motorIds ?? defaults.curingDetails.motorIds);
    setCdR1(nextCasting.r1 ?? defaults.curingDetails.r1);
    setCdR2(nextCasting.r2 ?? defaults.curingDetails.r2);
    setCdR3(normalizedIntervals);
    setCdR4(nextCasting.r4 ?? defaults.curingDetails.r4);
    setCdR5a(nextCasting.r5a ?? defaults.curingDetails.r5a);
    setCdR5b(nextCasting.r5b ?? defaults.curingDetails.r5b);
    setCdR6(nextCasting.r6 ?? defaults.curingDetails.r6);
    setCdCureMotorIds(nextCuring?.motorIds ?? defaults.curingDetails2.motorIds);
    setCureR1(nextCuring?.r1 ?? defaults.curingDetails2.r1);
    setCureR2(nextCuring?.r2 ?? defaults.curingDetails2.r2);
    setCureR3(nextCuring?.r3 ?? defaults.curingDetails2.r3);
    setCureR4(nextCuring?.r4 ?? defaults.curingDetails2.r4);
  }, [initialData, defaults]);

  useEffect(() => {
    onBlocksChange?.({
      bowl: {
        motorIds: bowlMotorIds as Pair,
        rows: bowlRows,
      },
      casting: {
        motorIds: cdMotorIds as Pair,
        r1: cdR1 as Pair,
        r2: cdR2 as Pair,
        r3: cdR3 as CastingCuringIntervalRow[],
        r4: {
          param: String((cdR4 as any)?.param ?? ""),
          m1: String((cdR4 as any)?.m1 ?? ""),
          m2: String((cdR4 as any)?.m2 ?? ""),
        },
        r5a: cdR5a as Pair,
        r5b: cdR5b as Pair,
        r6: {
          param: String((cdR6 as any)?.param ?? ""),
          m1: String((cdR6 as any)?.m1 ?? ""),
          m2: String((cdR6 as any)?.m2 ?? ""),
        },
      },
      curing: {
        motorIds: cdCureMotorIds as Pair,
        r1: cureR1 as Pair,
        r2: cureR2 as Pair,
        r3: cureR3 as Pair,
        r4: cureR4 as Pair,
      },
    });
  }, [
    bowlMotorIds,
    bowlRows,
    cdMotorIds,
    cdR1,
    cdR2,
    cdR3,
    cdR4,
    cdR5a,
    cdR5b,
    cdR6,
    cdCureMotorIds,
    cureR1,
    cureR2,
    cureR3,
    cureR4,
    onBlocksChange,
  ]);

  const updateBowl = useCallback(
    (id: number, field: string, value: string) => {
      setBowlRows((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, [field]: value } : r));
        return next;
      });
    },
    []
  );

  const addBowlRow = useCallback(() => {
    setBowlRows((prev) => {
      bowlIdRef.current += 1;
      return [
        ...prev,
        { ...newBowlRow(prev.length + 1), id: bowlIdRef.current },
      ];
    });
  }, []);

  const deleteBowlRow = useCallback(
    (id: number) => {
      setBowlRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    },
    []
  );

  const addCdR3Row = useCallback(() => {
    setCdR3((prev) => [
      ...prev,
      { id: `t_${++r3IdRef.current}`, label: nextTLabel(prev), m1: "", m2: "" },
    ]);
  }, []);

  const deleteCdR3Row = useCallback((id: string) => {
    setCdR3((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateCdR3 = useCallback((id: string, field: string, value: string) => {
    setCdR3((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }, []);

  return {
    bowlMotorIds,
    setBowlMotorIds,
    bowlRows,
    updateBowl,
    addBowlRow,
    deleteBowlRow,
    cdMotorIds,
    setCdMotorIds,
    cdR1,
    setCdR1,
    cdR2,
    setCdR2,
    cdR3,
    addCdR3Row,
    deleteCdR3Row,
    updateCdR3,
    cdR4,
    setCdR4,
    cdR5a,
    setCdR5a,
    cdR5b,
    setCdR5b,
    cdR6,
    setCdR6,
    cdCureMotorIds,
    setCdCureMotorIds,
    cureR1,
    setCureR1,
    cureR2,
    setCureR2,
    cureR3,
    setCureR3,
    cureR4,
    setCureR4,
  };
};

export default useCastingAndCuringFormHook;
