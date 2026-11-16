import type { ComponentProps, ComponentType, ReactNode } from "react";

import type { ApproverDepartmentKey, ApproverStatusMeta } from "@app/theme/approver";
import type { ListFilterPanelPalette } from "@app/theme/custom_themes/shared/listFilterPanel_theme";
import type { DataTableColumn } from "@ui/components/common/DataTable";
import type { BatchTableColumn } from "@ui/components/custom/BatchTable";
import type { FilterField, FilterFieldsTheme } from "@ui/components/custom/FilterFields";
import type ApproverActionDialog from "@ui/components/custom/ApproverActionDialog";

type ApproverActionDialogProps = ComponentProps<typeof ApproverActionDialog>;

/** Shared filter draft shape used by ApproverWorkflowListPage + FilterFields. */
export type ApproverWorkflowFilterDraft = {
  material: string;
  status: string;
  from: string;
  to: string;
  [key: string]: string;
};

export type ApproverWorkflowListState = {
  statusMeta: ApproverStatusMeta;
  statusTabs: string[];
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  listFiltersRecord: Record<string, string>;
  activeFilterCount: number;
  filterAllLabel: string;
  materialOptions: { materialCode: string; materialName: string }[];
  materialsLoading: boolean;
  statusDropdownValues: string[];
  appliedFilters: {
    materialCode: string;
    fromDate: string;
    toDate: string;
  };
  applyPanelFilters: (next: {
    materialCode: string;
    fromDate: string;
    toDate: string;
    status: string;
  }) => void;
  clearListFilters: () => void;
};

export type ApproverWorkflowListConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  department: ApproverDepartmentKey;
  subDepartment: string;
  statusField: string;
  searchKeys: string[];
  searchPlaceholder: string;
  filterTitle: string;
  filterPalette: ListFilterPanelPalette;
  filterFieldsTheme: FilterFieldsTheme;
  useListState: () => ApproverWorkflowListState;
  getFilterFields: (args: {
    filterAllLabel: string;
    materialOptions: { materialCode: string; materialName: string }[];
    materialsLoading: boolean;
    statusValues: string[];
    dateErrors?: { from?: string; to?: string } | null;
  }) => FilterField<ApproverWorkflowFilterDraft>[];
  getColumns: (args: {
    statusMeta: ApproverStatusMeta;
    onViewDetails: (row: T) => void;
  }) => DataTableColumn<T>[] | BatchTableColumn[];
  getRowKey: (row: T, index: number) => string | number;
  tableSx?: {
    headerCellSx?: object;
    bodyCellSx?: object;
    rowSx?: (row: T, index: number) => object;
  };
  /** When set, list body uses shared BatchTable (user lot list look) instead of DataTable. */
  batchTable?: {
    headerCellSx: Record<string, unknown>;
    bodyCellSx: Record<string, unknown>;
    emptySx: { wrap: unknown; icon: unknown; title: unknown; subtitle: unknown };
    stripedRowEven?: string;
    stripedRowOdd?: string;
    hoverColor: string;
    textSub?: string;
    highlightColor?: string;
    highlightRow?: (row: T) => boolean;
    tableLabel?: string;
    emptyText?: string;
  };
  renderAction?: (row: T, onViewDetails: (row: T) => void) => ReactNode;
  renderTableChrome?: (table: ReactNode) => ReactNode;
};

export type ApproverWorkflowDetailsHookResult = {
  selected: any | null;
  detailsLoading: boolean;
  dialogProps: ApproverActionDialogProps;
  requestApprove: (item: any) => void;
  requestReject: (item: any) => void;
  handleViewDetails: (row: any) => void;
  handleCloseDetail: () => void;
};

export type ApproverWorkflowDetailsPageProps = {
  item: any;
  loading: boolean;
  onBack: () => void;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
};

export type ApproverWorkflowMainPageProps = {
  listConfig: ApproverWorkflowListConfig;
  DetailsPage: ComponentType<ApproverWorkflowDetailsPageProps>;
  useDetails: () => ApproverWorkflowDetailsHookResult;
};
