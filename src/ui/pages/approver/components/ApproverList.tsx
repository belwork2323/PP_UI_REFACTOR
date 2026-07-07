import { useMemo, type ElementType, type ReactNode } from "react";

import { STRINGS } from "../../../../app/config/strings";
import {
  getApproverBrand,
  type ApproverDepartmentKey,
  type ApproverStatusMeta,
} from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import { getApproverListTheme } from "../../../../app/theme/custom_themes/approver/approverList_theme";
import type { ApproverFilterField } from "../../../../hooks/approver/useApproverList";
import { useApproverList } from "../../../../hooks/approver/useApproverList";
import useApproverSubDepartmentBatchList from "../../../../hooks/approver/useApproverSubDepartmentBatchList";
import {
  APPROVER_BATCH_STATUS_TABS,
  approverRowMatchesSearchQuery,
} from "../../../../data/models/approver/ApproverBatchListModel";
import BatchListShell from "../../../components/custom/BatchListShell";
import Pagination from "../../../components/common/Pagination";

export type ApproverListProps<T> = {
  children: (filteredItems: T[]) => ReactNode;
  department: ApproverDepartmentKey;
  emptyIcon?: ElementType;
  emptySubtitle?: string;
  emptyTitle?: string;
  filterExtension?: ReactNode;
  activeStatusOverride?: string;
  filterFields?: ApproverFilterField[];
  items?: T[];
  listFilters?: Record<string, string>;
  onActiveStatusChange?: (status: string) => void;
  searchBarEnd?: ReactNode;
  searchKeys?: string[];
  searchPlaceholder?: string;
  statusField?: string;
  statusMeta?: ApproverStatusMeta;
  statusTabsOverride?: string[];
  subDepartment?: string;
};

const DEFAULT_ICONS: Record<ApproverDepartmentKey, ElementType> = {
  sourcing: icons.approver.sourcing.dashboard.store,
  manufacturing: icons.approver.manufacturing.dashboard.precisionManufacturing,
  dispatch: icons.approver.dispatch.dashboard.localShipping,
  qualityControl: icons.approver.qualityControl.dashboard.science,
};

const allLabel = STRINGS.APPROVER.COMMON.STATUS_ALL;
const EMPTY_FILTER_FIELDS: ApproverFilterField[] = [];
const EMPTY_LIST_FILTERS: Record<string, string> = {};
const EMPTY_SEARCH_KEYS: string[] = [];
const EMPTY_ITEMS: Record<string, unknown>[] = [];

const ApproverList = <T extends Record<string, unknown>,>({
  children,
  department,
  emptyIcon,
  emptySubtitle = STRINGS.APPROVER.LIST.EMPTY_SUBTITLE,
  emptyTitle = STRINGS.APPROVER.LIST.EMPTY_TITLE,
  filterExtension,
  activeStatusOverride,
  filterFields = EMPTY_FILTER_FIELDS,
  items = EMPTY_ITEMS as T[],
  listFilters = EMPTY_LIST_FILTERS,
  onActiveStatusChange,
  searchBarEnd,
  searchKeys = EMPTY_SEARCH_KEYS,
  searchPlaceholder,
  statusField = "status",
  statusMeta = {},
  statusTabsOverride,
  subDepartment,
}: ApproverListProps<T>) => {
  const brand = getApproverBrand(department);
  const listTheme = useMemo(() => getApproverListTheme(brand), [brand]);
  const EmptyIcon = emptyIcon ?? DEFAULT_ICONS[department];
  const {
    activeStatus: internalActiveStatus,
    counts,
    filters,
    searchText,
    setActiveStatus: setInternalActiveStatus,
    setFilters,
    setSearchText,
    statusTabs,
  } = useApproverList<T>({
    allLabel,
    filterFields,
    items,
    searchKeys,
    statusField,
  });
  const activeStatus = activeStatusOverride ?? internalActiveStatus;
  const handleStatusChange = onActiveStatusChange ?? setInternalActiveStatus;
  const mergedExtraFilters = useMemo(
    () => ({
      ...filters,
      ...listFilters,
    }),
    [filters, listFilters],
  );
  const { items: resolvedItems, loading, page, pagination, setPage, statusCounts } =
    useApproverSubDepartmentBatchList<T>({
      allLabel,
      department,
      extraFilters: mergedExtraFilters,
      items,
      searchText,
      status: activeStatus,
      subDepartment,
    });

  const filteredItems = useMemo(() => {
    const sourceItems = subDepartment ? resolvedItems : items;
    const query = searchText.trim();

    return sourceItems.filter((item) => {
      if (
        activeStatus !== allLabel &&
        String((item as Record<string, unknown>)[statusField]) !== activeStatus
      ) {
        return false;
      }

      if (query && searchKeys.length > 0) {
        if (!approverRowMatchesSearchQuery(item as Record<string, unknown>, query, searchKeys)) {
          return false;
        }
      }

      return filterFields.every(({ field }) => {
        const selectedValue = filters[field];

        if (!selectedValue || selectedValue === allLabel) {
          return true;
        }

        const value = field.split(".").reduce<unknown>((current, part) => {
          if (current && typeof current === "object") {
            return (current as Record<string, unknown>)[part];
          }

          return undefined;
        }, item as Record<string, unknown>);

        return String(value ?? "") === selectedValue;
      });
    });
  }, [activeStatus, allLabel, filterFields, filters, items, resolvedItems, searchKeys, searchText, statusField, subDepartment]);

  const displayStatusTabs = useMemo(() => {
    if (statusTabsOverride?.length) {
      return statusTabsOverride;
    }

    if (!subDepartment) {
      return statusTabs;
    }

    return [allLabel, ...APPROVER_BATCH_STATUS_TABS];
  }, [allLabel, statusTabs, statusTabsOverride, subDepartment]);

  const resolvedSearchPlaceholder =
    searchPlaceholder ?? STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER(searchKeys);

  const displayCounts = subDepartment ? { ...counts, ...statusCounts } : counts;
  const shellFilterFields = filterFields.map(({ field, label, options }) => ({
    field,
    label,
    options: [allLabel, ...options],
  }));

  return (
    <BatchListShell
      activeStatus={activeStatus}
      emptyIcon={EmptyIcon}
      emptySubtitle={emptySubtitle}
      emptyTitle={emptyTitle}
      filterExtension={filterExtension}
      filterFields={shellFilterFields}
      filterValues={filters}
      hasItems={filteredItems.length > 0}
      loading={Boolean(subDepartment && loading)}
      onFilterChange={(field, value) =>
        setFilters((current) => ({
          ...current,
          [field]: value,
        }))
      }
      onSearchChange={setSearchText}
      onStatusChange={handleStatusChange}
      resultIcon={EmptyIcon}
      resultText={STRINGS.APPROVER.LIST.RESULTS(filteredItems.length)}
      searchBarEnd={searchBarEnd}
      searchPlaceholder={resolvedSearchPlaceholder}
      searchValue={searchText}
      statusCounts={displayCounts}
      statusMeta={statusMeta}
      statusTabs={displayStatusTabs}
      theme={listTheme}
    >
          {children(filteredItems)}
          {subDepartment && pagination.totalPages > 1 ? (
            <Pagination currentPage={page} totalPages={pagination.totalPages} onChange={setPage} />
          ) : null}
    </BatchListShell>
  );
};

export default ApproverList;