import { useCallback, useState } from "react";
import { systemManagerController } from "@controllers/system_manager/systemManagerController";
import {
  BatchStagesModel,
  normalizeWorkflowStatus,
  SubDeptStageItemModel,
} from "@data/models/SystemManagerModel";

export type BatchTrackingSubDept = {
  id: number;
  name: string;
  status: string;
  progress: number;
};

export type BatchTrackingDepartment = {
  id: number;
  name: string;
  status: string;
  progress: number;
  subDepartments: BatchTrackingSubDept[];
};

export type BatchTrackingData = {
  batchId: string;
  overallProgress: number;
  departments: BatchTrackingDepartment[];
};

const mapSubDeptItem = (item: SubDeptStageItemModel): BatchTrackingSubDept => ({
  id: item.subDepartmentId,
  name: item.subDepartmentName,
  status: item.status,
  progress: item.displayProgress,
});

const mapSubDeptFromStageModel = (item: {
  subDepartmentId: number;
  name: string;
  status: string;
  completionPercentage: number;
}): BatchTrackingSubDept => ({
  id: item.subDepartmentId,
  name: item.name,
  status: normalizeWorkflowStatus(item.status),
  progress: item.completionPercentage ?? 0,
});

const buildDepartments = async (
  batchId: string,
  batchStages: BatchStagesModel,
): Promise<BatchTrackingDepartment[]> => {
  const departments = await Promise.all(
    batchStages.stages.map(async (dept) => {
      let subDepartments: BatchTrackingSubDept[] = dept.subDepartments.map(mapSubDeptFromStageModel);

      if (subDepartments.length === 0 && dept.departmentId) {
        const subResult = await systemManagerController.getBatchSubDeptStages({
          batchId,
          departmentId: dept.departmentId,
        });

        if (subResult.success && subResult.subDeptStages) {
          const model = subResult.subDeptStages;
          const seen = new Set<number>();

          subDepartments = model.timelineEntries.map((entry) => {
            seen.add(entry.item.subDepartmentId);
            return mapSubDeptItem(entry.item);
          });

          model.currentStage.forEach((item) => {
            if (seen.has(item.subDepartmentId)) return;
            subDepartments.push(mapSubDeptItem(item));
          });
        }
      }

      return {
        id: dept.departmentId,
        name: dept.departmentName,
        status: dept.status,
        progress: dept.completionPercentage ?? 0,
        subDepartments,
      };
    }),
  );

  return departments;
};

export const useBatchTracking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<BatchTrackingData | null>(null);

  const loadTracking = useCallback(async (batchId: string) => {
    if (!batchId) {
      setTracking(null);
      setError("Batch ID is missing.");
      return;
    }

    setLoading(true);
    setError(null);
    setTracking(null);

    try {
      const result = await systemManagerController.getBatchStages({ batchId });
      if (!result.success || !result.batchStages) {
        setError(result.message || "Failed to load batch tracking.");
        return;
      }

      const batchStages = result.batchStages;
      const departments = await buildDepartments(batchId, batchStages);

      setTracking({
        batchId: batchStages.batchId || batchId,
        overallProgress: batchStages.overallProgress ?? 0,
        departments,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batch tracking.");
    } finally {
      setLoading(false);
    }
  }, []);

  const resetTracking = useCallback(() => {
    setTracking(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, tracking, loadTracking, resetTracking };
};

export default useBatchTracking;
