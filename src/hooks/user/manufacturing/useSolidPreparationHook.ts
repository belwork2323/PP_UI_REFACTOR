import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSolidProcessDataByKey } from "./solidPreparationConfig";

type ProcessInstance = {
  instanceId: number;
  processKey: string;
  data: any;
};

const mapForParent = (instances: ProcessInstance[]) =>
  instances.map((inst) => ({ processKey: inst.processKey, data: inst.data }));

export const useSolidPreparationHook = (
  initialInstances: ProcessInstance[] = [],
  onBlocksChange?: (blocks: any[]) => void
) => {
  const instanceCounterRef = useRef(1);
  const [selectedProcess, setSelectedProcess] = useState("");
  const [processInstances, setProcessInstances] = useState<ProcessInstance[]>(initialInstances);

  useEffect(() => {
    const next = initialInstances ?? [];
    setProcessInstances(next);
    const maxId = next.reduce((acc, inst) => Math.max(acc, Number(inst.instanceId) || 0), 0);
    instanceCounterRef.current = maxId + 1;
  }, [initialInstances]);

  const notifyParent = useCallback(
    (instances: ProcessInstance[]) => {
      onBlocksChange?.(mapForParent(instances));
    },
    [onBlocksChange]
  );

  const createProcessInstance = useCallback((processKey: string): ProcessInstance => {
    const instanceId = instanceCounterRef.current;
    instanceCounterRef.current += 1;
    return {
      instanceId,
      processKey,
      data: createSolidProcessDataByKey(processKey),
    };
  }, []);

  const handleAdd = useCallback(() => {
    if (!selectedProcess) return;
    setProcessInstances((prev) => {
      const next = [...prev, createProcessInstance(selectedProcess)];
      notifyParent(next);
      return next;
    });
    setSelectedProcess("");
  }, [createProcessInstance, notifyParent, selectedProcess]);

  const handleRemove = useCallback(
    (instanceId: number) => {
      setProcessInstances((prev) => {
        const next = prev.filter((p) => p.instanceId !== instanceId);
        notifyParent(next);
        return next;
      });
    },
    [notifyParent]
  );

  const updateNestedField = useCallback(
    (instanceId: number, rowId: string, fieldKey: string, value: any) => {
      setProcessInstances((prev) => {
        const next = prev.map((inst) =>
          inst.instanceId !== instanceId
            ? inst
            : {
                ...inst,
                data: {
                  ...inst.data,
                  [rowId]: { ...(inst.data?.[rowId] ?? {}), [fieldKey]: value },
                },
              }
        );
        notifyParent(next);
        return next;
      });
    },
    [notifyParent]
  );

  const handleAPBlendingChange = useCallback(
    (instanceId: number, rowId: string, field: string, value: any) => {
      updateNestedField(instanceId, rowId, field, value);
    },
    [updateNestedField]
  );

  const handleBlendingCumDryingChange = useCallback(
    (instanceId: number, field: string, value: any) => {
      updateNestedField(instanceId, "hotWaterCirculation", field, value);
    },
    [updateNestedField]
  );

  const handleDryingRVDChange = useCallback(
    (instanceId: number, rowId: string, fieldKey: string, value: any) => {
      updateNestedField(instanceId, rowId, fieldKey, value);
    },
    [updateNestedField]
  );

  const handleDryingOvenChange = useCallback(
    (instanceId: number, rowId: string, fieldKey: string, value: any) => {
      updateNestedField(instanceId, rowId, fieldKey, value);
    },
    [updateNestedField]
  );

  const handlePSDChange = useCallback(
    (instanceId: number, section: "header" | "specs", key: string, value: any) => {
      setProcessInstances((prev) => {
        const next = prev.map((inst) => {
          if (inst.instanceId !== instanceId) return inst;
          if (section === "header") {
            return {
              ...inst,
              data: {
                ...inst.data,
                header: { ...(inst.data?.header ?? {}), [key]: value },
              },
            };
          }

          return {
            ...inst,
            data: {
              ...inst.data,
              specs: {
                ...(inst.data?.specs ?? {}),
                [key]: { specification: value },
              },
            },
          };
        });
        notifyParent(next);
        return next;
      });
    },
    [notifyParent]
  );

  const handleAlProcessingChange = useCallback(
    (instanceId: number, rowId: string, fieldKey: string, value: any) => {
      updateNestedField(instanceId, rowId, fieldKey, value);
    },
    [updateNestedField]
  );

  return useMemo(
    () => ({
      selectedProcess,
      setSelectedProcess,
      processInstances,
      handleAdd,
      handleRemove,
      handleAPBlendingChange,
      handleBlendingCumDryingChange,
      handleDryingRVDChange,
      handleDryingOvenChange,
      handlePSDChange,
      handleAlProcessingChange,
    }),
    [
      selectedProcess,
      processInstances,
      handleAdd,
      handleRemove,
      handleAPBlendingChange,
      handleBlendingCumDryingChange,
      handleDryingRVDChange,
      handleDryingOvenChange,
      handlePSDChange,
      handleAlProcessingChange,
    ]
  );
};

export default useSolidPreparationHook;
