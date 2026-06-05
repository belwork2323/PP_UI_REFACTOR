import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../app/store/authStore";
import { systemManagerController } from "../../controllers/system_manager/systemManagerController";
import { SMChartDataModel } from "../../data/models/SystemManagerModel";

const createEmptyDashboard = (stageConfig: any[]) => ({
	kpiData: [], stageMetrics: [],
	stageData: { totalBatches: 0, filterType: "month", stages: [] as any[] },
	activeBatches: [], blockEvents: [],
	chartData: { areaData: [], barData: [] },
	batchStatusList: [],
	approvalMatrix: [], stageConfig,
	chartUpdatedAt: null,
});

const toStageKey = (stageName: string = "") => {
	const normalized = stageName.toLowerCase();
	if (normalized.includes("source")) return "sourcing";
	if (normalized.includes("manufact")) return "manufacturing";
	if (normalized.includes("quality") || normalized.includes("qc")) return "quality";
	if (normalized.includes("dispatch")) return "dispatch";
	return normalized || "sourcing";
};

const toApiDate = (date: Date) => {
	const day = `${date.getDate()}`.padStart(2, "0");
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const year = date.getFullYear();
	return `${day}-${month}-${year}`;
};

const getDateRange = (filterType: string, customStartDate: string, customEndDate: string) => {
	const now = new Date();
	if (filterType === "day") {
		const today = toApiDate(now);
		return { apiFilter: "day", startDate: today, endDate: today };
	}
	if (filterType === "week") {
		const start = new Date(now);
		start.setDate(now.getDate() - now.getDay());
		const end = new Date(start);
		end.setDate(start.getDate() + 6);
		return { apiFilter: "week", startDate: toApiDate(start), endDate: toApiDate(end) };
	}
	if (filterType === "custom" && customStartDate.length === 10 && customEndDate.length === 10) {
		// dates arrive as DD-MM-YYYY from DashboardDateFilter — use directly
		return { apiFilter: "custom", startDate: customStartDate, endDate: customEndDate };
	}
	// default: month
	return {
		apiFilter: "month",
		startDate: toApiDate(new Date(now.getFullYear(), now.getMonth(), 1)),
		endDate: toApiDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
	};
};

const resolveSystemManagerId = () => {
	const user = useAuthStore.getState()?.user;
	if (user?.userId !== undefined && user?.userId !== null) {
		return String(user.userId);
	}
	return user?.username ?? "SM-001";
};

export const useSMDashboard = (config: {
	stageConfig: any[];
	stageColors: Record<string, string>;
	kpiVariants: Record<string, { color: string; iconKey: string }>;
}) => {
	const [dashboard, setDashboard] = useState(createEmptyDashboard(config.stageConfig));
	const [alerts, setAlerts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [statsLoading, setStatsLoading] = useState(false);
	const [alertsLoading, setAlertsLoading] = useState(false);
	const [filterType, setFilterType] = useState("month");
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");

	const loadDashboard = useCallback(async (ft: string, csd: string, ced: string) => {
		const { apiFilter, startDate, endDate } = getDateRange(ft, csd, ced);
		const systemManagerId = resolveSystemManagerId();

		setLoading(true);
		setStatsLoading(true);

		const [statsResult, chartResult, activeBatchesResult, batchStatusResult, blockchainResult] = await Promise.all([
			systemManagerController.getStats(apiFilter, startDate, endDate),
			systemManagerController.getChartData(apiFilter, startDate, endDate),
			systemManagerController.getActiveBatches({ page: 1, limit: 10 }),
			systemManagerController.getBatchStatusList({ page: 1, limit: 10 }),
			systemManagerController.getBlockchainEvents({
				systemManagerId,
				search: "",
				eventType: "All",
				department: "All",
				subDepartment: "All",
				startDate: null,
				endDate: null,
				page: 1,
				pageSize: 5,
			}),
		]);

		const stats = statsResult.success ? statsResult.stats : [];
		const chartData = chartResult.success ? chartResult.chartData : SMChartDataModel.empty();
		const chartUpdatedAt = chartResult.success && chartResult.timestamp
			? new Date(chartResult.timestamp)
			: new Date();
		const activeBatches = activeBatchesResult.success ? activeBatchesResult.batches : [];
		const statusList = batchStatusResult.success ? batchStatusResult.batches : [];
		const blockchainEvents = blockchainResult.success ? blockchainResult.events : [];
		const stageConfig = config.stageConfig;
		const fallbackStageColor = config.stageColors.fallback;
		const fallbackKpiVariant = config.kpiVariants.fallback;

		setDashboard({
			kpiData: stats.map((item: any) => {
				const variantConfig = config.kpiVariants[item.variant] ?? fallbackKpiVariant;

				return {
					label: item.label,
					value: item.value,
					sub: item.subText,
					trend: item.subValue >= 0 ? "up" : "down",
					color: variantConfig.color,
					iconKey: variantConfig.iconKey,
				};
			}),
			stageData: {
				totalBatches: chartData.stageTotalBatches ?? 0,
				filterType: apiFilter,
				stages: (chartData.stageProcessed ?? []).map((item: any) => {
					const key = toStageKey(item.stage);
					const stageCfg = stageConfig.find((sc: any) => sc.key === key);
					return {
						stage: item.stage,
						batchCount: item.batchCount,
						percentage: item.percentage ?? 0,
						pending: Math.max(0, (chartData.stageTotalBatches || chartData.totalActiveBatches || 0) - item.batchCount),
						color: config.stageColors[key] ?? fallbackStageColor,
						iconKey: stageCfg?.iconKey ?? "Inventory2",
					};
				}),
			},
			stageMetrics: (chartData.stageProcessed ?? []).map((item: any) => ({
				stage: item.stage,
				completed: item.batchCount,
				pending: Math.max(0, (chartData.stageTotalBatches || chartData.totalActiveBatches || 0) - item.batchCount),
				color: config.stageColors[toStageKey(item.stage)] ?? fallbackStageColor,
				pct: item.percentage ?? 0,
			})),
			activeBatches: activeBatches.map((batch: any) => {
				const stageKey = toStageKey(batch.department);
				return {
					...batch,
					id: batch.batchId,
					stage: batch.department || "Unassigned",
					substage: batch.firstSubDept,
					pct: batch.progressPercentage,
					color: config.stageColors[stageKey] ?? fallbackStageColor,
					lastUpdated: batch.formattedLastUpdated,
				};
			}),
			blockEvents: blockchainEvents.map((event: any) => ({
				motorId: event.batchId || event.transactionId,
				label: event.eventStatusMessage,
				time: event.timestamp,
				color: event.color,
				icon: event.icon,
			})),
			chartData: {
				areaData: chartData.lineChartData,
				barData: chartData.barChartData,
			},
			chartUpdatedAt,
			batchStatusList: statusList,
			approvalMatrix: statusList.map((batch: any) => {
				const approvals = stageConfig.reduce((acc: Record<string, boolean>, stage) => {
					const currentStage = Array.isArray(batch.currentStage)
						? batch.currentStage.find((item: any) => toStageKey(item?.subDepartmentName || "") === stage.key)
						: null;
					const historyStage = Array.isArray(batch.stageHistory)
						? batch.stageHistory.find((item: any) => toStageKey(item?.subDepartmentName || "") === stage.key)
						: null;
					const stageEntry = currentStage || historyStage;

					acc[stage.key] = Boolean(stageEntry?.approvedOn || stageEntry?.approvedBy || stageEntry?.status === "Approved");
					return acc;
				}, {});

				return {
					approver: batch.batchId || batch.projectName || "Unknown",
					approvals,
				};
			}),
			stageConfig,
		});

		setLoading(false);
		setStatsLoading(false);
	}, [config]);

	const loadAlerts = useCallback(async () => {
		const systemManagerId = resolveSystemManagerId();

		setAlertsLoading(true);
		const alertsResult = await systemManagerController.getAlerts({ systemManagerId, page: 1, limit: 5 });
		setAlerts(
			alertsResult.success
				? alertsResult.alerts.map((alert: any) => ({
					type: alert.type,
					msg: alert.msg,
					time: alert.time,
					batchId: alert.batchId,
					motorId: alert.motorId,
					stage: alert.stage,
				}))
				: []
		);
		setAlertsLoading(false);
	}, []);

	useEffect(() => {
		if (filterType === "custom" && (customStartDate.length !== 10 || customEndDate.length !== 10)) return;
		loadDashboard(filterType, customStartDate, customEndDate);
	}, [loadDashboard, filterType, customStartDate, customEndDate]);

	return {
		dashboard,
		alerts,
		alertsLoading,
		loading,
		statsLoading,
		filterType,
		setFilterType,
		customStartDate,
		setCustomStartDate,
		customEndDate,
		setCustomEndDate,
		loadAlerts,
		loadDashboard,
	};
};

export default useSMDashboard;