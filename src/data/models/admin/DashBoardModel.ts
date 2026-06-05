// src/data/models/dashboard/DashboardModel.js
import { icons }         from '../../../app/theme';
import getDashboardTheme from '../../../app/theme/custom_themes/admin/dashboard_theme';
import { STRINGS }       from '../../../app/config/strings';

// Maps the KPI `type` string from the API to icon + avatar-bg color.
// Mirrors the old buildKPI() that lived in DashboardPage.
const KPI_META = (th) => ({
  users:     { Icon: icons.users,    bg: th.kpi.avatarColors.users     },
  batches:   { Icon: icons.chart,    bg: th.kpi.avatarColors.batches   },
  dispatch:  { Icon: icons.Store,    bg: th.kpi.avatarColors.dispatch  },
  approvals: { Icon: icons.approval, bg: th.kpi.avatarColors.approvals },
});

// Maps the KPI `type` string to the display label from STRINGS.
const KPI_LABELS = () => {
  const t = STRINGS.DASHBOARD_PAGE;
  return {
    users:     { label: t.KPI.ACTIVE_USERS,      sub_default: t.KPI.SUB_USERS     },
    batches:   { label: t.KPI.OPEN_BATCHES,      sub_default: t.KPI.SUB_BATCHES   },
    dispatch:  { label: t.KPI.MOTORS_DISPATCHED, sub_default: t.KPI.SUB_DISPATCH  },
    approvals: { label: t.KPI.PENDING_APPROVALS, sub_default: t.KPI.SUB_APPROVALS },
  };
};

const getApiData = (apiResponse: any) => apiResponse?.data ?? {};

export class DashboardModel {
  kpis: unknown;
  charts: unknown;
  activeBatches: unknown;
  recentEvents: unknown;

  constructor({
    kpis,
    charts,
    activeBatches,
    recentEvents,
  }: {
    kpis: unknown;
    charts: unknown;
    activeBatches: unknown;
    recentEvents: unknown;
  }) {
    this.kpis          = kpis;
    this.charts        = charts;
    this.activeBatches = activeBatches;
    this.recentEvents  = recentEvents;
  }

  /**
   * Transforms raw API response into a DashboardModel.
   * KPI items are enriched with label, Icon and bg so the page
   * can render them without any extra mapping logic.
   *
   * @param {object} apiResponse  - raw response from fetchDashboardDataApi
   * @param {string} [mode]       - 'light' | 'dark' — needed to resolve theme colours
   */
  static fromApi(apiResponse, mode = 'light') {
    const data      = getApiData(apiResponse);
    const th        = getDashboardTheme(mode);
    const metaMap   = KPI_META(th);
    const labelMap  = KPI_LABELS();

    const kpis = (data.kpis || []).map(({ type, value, sub }) => {
      const meta  = metaMap[type]  ?? { Icon: icons.chart, bg: '#607d8b' };
      const lbl   = labelMap[type] ?? { label: type, sub_default: '' };
      return {
        label: lbl.label,
        value,
        sub:   sub ?? lbl.sub_default,
        Icon:  meta.Icon,
        bg:    meta.bg,
      };
    });

    return new DashboardModel({
      kpis,
      charts: {
        weeklyActivity:  data.charts?.weeklyActivity  ?? [],
        motorsProcessed: data.charts?.motorsProcessed ?? [],
        qcPassRate:      data.charts?.qcPassRate      ?? [],
      },
      activeBatches: data.activeBatches ?? [],
      recentEvents:  data.recentEvents  ?? [],
    });
  }

  /**
   * Transform stats API response (new endpoint) to KPI format
   * Maps the new stats response with totalUsers, activeUsers, completedBatches, etc.
   * to the KPI card format for display
   */
  static fromStatsApi(apiResponse, mode = 'light') {
    const data = getApiData(apiResponse);
    const th = getDashboardTheme(mode);

    // Map stats API response to KPI format
    const statsMap = {
      totalUsers: { type: 'users', label: 'Total Users' },
      activeUsers: { type: 'users', label: 'Active Users' },
      completedBatches: { type: 'batches', label: 'Completed Batches' },
      openBatches: { type: 'batches', label: 'Open Batches' },
      motorsDispatched: { type: 'dispatch', label: 'Motors Dispatched' },
      pendingApprovals: { type: 'approvals', label: 'Pending Approvals' },
    };

    const metaMap = KPI_META(th);

    const kpis = Object.entries(statsMap).map(([key, mapping]) => {
      const statData = (data as any)[key] ?? { count: 0, subValue: 0 };
      const count = statData.count ?? 0;
      const subValue = statData.subValue ?? 0;
      
      const meta = metaMap[mapping.type] ?? { Icon: icons.chart, bg: '#607d8b' };
      
      // Format the sub value
      const sub = subValue !== 0 
        ? (subValue > 0 ? `+${subValue}` : `${subValue}`)
        : '—';

      return {
        label: mapping.label,
        value: DashboardModel.formatNumber(count),
        rawValue: count,
        sub,
        Icon: meta.Icon,
        bg: meta.bg,
      };
    });

    return { kpis };
  }

  /**
   * Transforms chart API response to expected chart data format
   */
  static fromChartDataApi(apiResponse) {
    const data = getApiData(apiResponse);

    const mapChart = (arr: any[], labelKey: string, valueKey = "value") =>
      (arr || []).map((item) => ({
        [labelKey]: item.label,
        v: item[valueKey],
      }));

    return {
      charts: {
        weeklyActivity: mapChart(data.weeklyActivity, 'day'),
        motorsProcessed: mapChart(data.motorsProcessed, 'm'),
        qcPassRate: mapChart(data.qcPassRate, 'm'),
      }
    };
  }

  /**
   * Transforms active batches API response
   */
  static fromActiveBatchesApi(apiResponse) {
    const data = getApiData(apiResponse);
    const batches = data?.batches || [];
    
    const activeBatches = batches.map((b: any) => ({
      id: b.id ?? '',
      batchId: b.batchId ?? '',
      batchType: b.type ?? b.batchType ?? 'NA',
      motorId: b.motorId ?? '',
      motorType: b.motorType?.motorTypeName ?? b.motorType?.typeName ?? b.motorType ?? 'NA',
      projectName: b.projectName ?? '',
      stage: b.stage ?? 'NA',
      currentStage: b.stage?.department?.subDepartments?.[0]?.subDepartmentName ?? 'NA',
      stageDept: b.stage?.department?.departmentName ?? '',
      managerId: b.systemManager?.id ?? b.systemManagerId ?? 'NA',
      managerName: b.systemManager?.name ?? 'NA',
      status: b.status ?? 'NA',
      createdOn: b.createdOn ?? b.date ?? '',
      completion: typeof b.completion === 'number' ? b.completion : 0,
      color: b.color ?? '#1976d2',
    }));

    return {
      activeBatches,
      pagination: data?.pagination || { page: 1, pageSize: 10, totalRecords: 0, totalPages: 0 }
    };
  }

  /**
   * Transforms blockchain events API response
   */
  static fromBlockchainEventsApi(apiResponse: any) {
    const data = getApiData(apiResponse);
    const events = data?.events || [];
    
    const formattedEvents = events.map((e: any) => {
      let color = '#2196f3';
      let icon = 'Tx';
      
      if (e.eventType === 'APPROVAL_COMPLETED') { color = '#4caf50'; icon = '✓'; }
      if (e.eventType === 'STAGE_UPDATED') { color = '#ff9800'; icon = '↻'; }

      return {
        transactionId: e.transactionId ?? '',
        batchId: e.batchId ?? '',
        eventType: e.eventType ?? '',
        eventStatusMessage: e.eventStatusMessage ?? e.label ?? '', 
        department: e.department ?? '',
        subDepartment: e.subDepartment ?? '',
        performedBy: e.performedBy ?? '',
        timestamp: e.timestamp ?? e.time ?? '',
        blockNumber: e.blockNumber ?? '',
        channelName: e.channelName ?? '',
        // UI Helpers
        color,
        icon
      };
    });

    return {
      events: formattedEvents,
      pagination: data?.pagination || { page: 1, pageSize: 10, totalRecords: 0, totalPages: 0 }
    };
  }

  /**
   * Format numbers with thousand separators
   * 1000 → "1,000"
   * 1000000 → "1,000,000"
   */
  static formatNumber(num: number): string {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}