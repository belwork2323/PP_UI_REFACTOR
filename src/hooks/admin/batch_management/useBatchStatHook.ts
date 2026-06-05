import { useState, useCallback, useEffect } from "react";
import { batchManagementController } from "../../../controllers/admin/batch_management/batchManagementController";
import { getDateRange } from "../../../utils/DateUtlis";

export const useBatchStats = (initialType = "month") => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(initialType);

  /**
   * Internal function to trigger the controller
   */
  const fetchStats = useCallback(async (type, start, end) => {
    setLoading(true);
    const data = await batchManagementController.getBatchStats(type, start, end);
    if (data) {
      setStats(data);
    }
    setLoading(false);
  }, []);

  /**
   * Handler to be used by the UI Dropdown
   */
  const handleStatsFilterChange = async (e) => {
    const newType = e.target.value;
    setFilterType(newType);

    const { startDate, endDate } = getDateRange(newType);
    await fetchStats(newType, startDate, endDate);
  };

  /**
   * Initial Load: Always fetches the current month range on mount
   */
  useEffect(() => {
    const { startDate, endDate } = getDateRange(initialType);
    fetchStats(initialType, startDate, endDate);
  }, [fetchStats, initialType]);

  return {
    stats,
    loading,
    filterType,
    handleStatsFilterChange,
    refreshStats: () => {
      const { startDate, endDate } = getDateRange(filterType);
      fetchStats(filterType, startDate, endDate);
    },
  };
};