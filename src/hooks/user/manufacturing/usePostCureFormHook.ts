import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countPostCureFilled,
  countPostCureTotal,
  createPostCureData,
} from "./postCureConfig";
import type { PostCureFormState } from "../../../data/models/user/PostCureFormModel";

type PostCureData = ReturnType<typeof createPostCureData>;

export const usePostCureFormHook = (
  initialData?: Partial<PostCureData> | PostCureFormState,
  onBlocksChange?: (payload: PostCureFormState) => void
) => {
  const defaults = useMemo(() => createPostCureData(), []);

  const [motorId, setMotorId] = useState(initialData?.motorId ?? defaults.motorId);
  const [r1,   setR1]   = useState(initialData?.r1   ?? defaults.r1);
  const [r2,   setR2]   = useState(initialData?.r2   ?? defaults.r2);
  const [r3a,  setR3a]  = useState(initialData?.r3a  ?? defaults.r3a);
  const [r3b1, setR3b1] = useState(initialData?.r3b1 ?? defaults.r3b1);
  const [r3b2, setR3b2] = useState(initialData?.r3b2 ?? defaults.r3b2);
  const [r3b3, setR3b3] = useState(initialData?.r3b3 ?? defaults.r3b3);
  const [r4a,  setR4a]  = useState(initialData?.r4a  ?? defaults.r4a);
  const [r4b1, setR4b1] = useState(initialData?.r4b1 ?? defaults.r4b1);
  const [r4b2, setR4b2] = useState(initialData?.r4b2 ?? defaults.r4b2);
  const [r4b3, setR4b3] = useState(initialData?.r4b3 ?? defaults.r4b3);

  useEffect(() => {
    setMotorId(initialData?.motorId ?? defaults.motorId);
    setR1(initialData?.r1 ?? defaults.r1);
    setR2(initialData?.r2 ?? defaults.r2);
    setR3a(initialData?.r3a ?? defaults.r3a);
    setR3b1(initialData?.r3b1 ?? defaults.r3b1);
    setR3b2(initialData?.r3b2 ?? defaults.r3b2);
    setR3b3(initialData?.r3b3 ?? defaults.r3b3);
    setR4a(initialData?.r4a ?? defaults.r4a);
    setR4b1(initialData?.r4b1 ?? defaults.r4b1);
    setR4b2(initialData?.r4b2 ?? defaults.r4b2);
    setR4b3(initialData?.r4b3 ?? defaults.r4b3);
  }, [initialData, defaults]);

  const data = useMemo(
    () => ({ motorId, r1, r2, r3a, r3b1, r3b2, r3b3, r4a, r4b1, r4b2, r4b3 }),
    [motorId, r1, r2, r3a, r3b1, r3b2, r3b3, r4a, r4b1, r4b2, r4b3]
  );

  const notify = useCallback(
    (nextData: PostCureData) => {
      onBlocksChange?.(nextData as PostCureFormState);
    },
    [onBlocksChange]
  );

  const makeUpdater = useCallback(
    <T extends string>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof PostCureData) =>
      (value: T) => {
        setter(value);
        notify({ ...data, [key]: value });
      },
    [data, notify]
  );

  const filled = useMemo(() => countPostCureFilled(data), [data]);
  const total = useMemo(() => countPostCureTotal(), []);

  return {
    motorId, setMotorId: makeUpdater(setMotorId as any, "motorId"),
    r1,   setR1:   makeUpdater(setR1 as any,   "r1"),
    r2,   setR2:   makeUpdater(setR2 as any,   "r2"),
    r3a,  setR3a:  makeUpdater(setR3a as any,  "r3a"),
    r3b1, setR3b1: makeUpdater(setR3b1 as any, "r3b1"),
    r3b2, setR3b2: makeUpdater(setR3b2 as any, "r3b2"),
    r3b3, setR3b3: makeUpdater(setR3b3 as any, "r3b3"),
    r4a,  setR4a:  makeUpdater(setR4a as any,  "r4a"),
    r4b1, setR4b1: makeUpdater(setR4b1 as any, "r4b1"),
    r4b2, setR4b2: makeUpdater(setR4b2 as any, "r4b2"),
    r4b3, setR4b3: makeUpdater(setR4b3 as any, "r4b3"),
    filled,
    total,
  };
};

export default usePostCureFormHook;
