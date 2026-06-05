import { useCallback, useState } from "react";
import { systemManagerController } from "../../controllers/system_manager/systemManagerController";
import { BatchSubDeptDetailsModel } from "../../data/models/SystemManagerModel";

export const useBatchSubDeptDetails = () => {
  const [details, setDetails] = useState<BatchSubDeptDetailsModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const fetchDetails = useCallback(async (batchId: string, subDepartmentId: number) => {
    if (!batchId || !subDepartmentId) {
      setDetails(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await systemManagerController.getBatchSubDeptDetails({ batchId, subDepartmentId });
      if (result.success && result.details) {
        setDetails(result.details);
      } else {
        if (result.statusCode === 400) {
          setError(result.message || "Invalid request payload");
        } else if (result.statusCode === 404 || result.errorCode === "SUB_DEPARTMENT_NOT_FOUND") {
          setError(result.message || "Sub Department not found");
        } else if (result.statusCode === 500) {
          setError(result.message || "Failed to fetch batch stages");
        } else {
          setError(result.message || "Failed to fetch sub-department details");
        }
        setDetails(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDetails(null);
    setError(null);
    setLoading(false);
  }, []);

  return { details, loading, error, fetchDetails, reset };
};

export default useBatchSubDeptDetails;
