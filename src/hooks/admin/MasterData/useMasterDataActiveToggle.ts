import { useCallback, useState } from "react";

export type MasterDataToggleTarget<T> = {
  record: T;
  nextActive: boolean;
};

export function useMasterDataActiveToggle<T>({
  canToggle,
  enableRecord,
  disableRecord,
}: {
  canToggle: () => boolean;
  enableRecord: (record: T) => Promise<void>;
  disableRecord: (record: T) => Promise<void>;
}) {
  const [toggleTarget, setToggleTarget] = useState<MasterDataToggleTarget<T> | null>(null);

  const handleToggleActive = useCallback(
    (record: T, nextActive: boolean) => {
      if (!canToggle()) return;
      setToggleTarget({ record, nextActive });
    },
    [canToggle],
  );

  const confirmToggle = useCallback(async () => {
    if (!toggleTarget) return;
    if (toggleTarget.nextActive) {
      await enableRecord(toggleTarget.record);
    } else {
      await disableRecord(toggleTarget.record);
    }
    setToggleTarget(null);
  }, [toggleTarget, enableRecord, disableRecord]);

  const cancelToggle = useCallback(() => {
    setToggleTarget(null);
  }, []);

  return {
    toggleTarget,
    setToggleTarget,
    handleToggleActive,
    confirmToggle,
    cancelToggle,
  };
}
