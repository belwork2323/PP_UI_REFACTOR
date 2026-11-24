import { useMemo, type ElementType, type ReactNode } from "react";

import { STRINGS } from "@app/config/strings";
import {
  getApproverBrand,
  type ApproverDepartmentKey,
  type ApproverStatusMeta,
} from "@app/theme/approver";
import { icons } from "@app/theme/icons";
import { useThemeStore } from "@app/store/themeStore";
import { getApproverListTheme } from "@app/theme/custom_themes/approver/approverList_theme";
import type { ApproverFilterField } from "@hooks/approver/useApproverList";
import { useApproverList } from "@hooks/approver/useApproverList";
import useApproverSubDepartmentBatchList from "@hooks/approver/useApproverSubDepartmentBatchList";
import {
  APPROVER_BATCH_STATUS_TABS,
  approverRowMatchesSearchQuery,
  resolveApproverRowStatus,
} from "@data/models/approver/ApproverBatchListModel";
import ListLayout from "@ui/components/custom/ListLayout";
import ListPagination from "@ui/components/custom/ListPagination";
import { SUBSCALE_STATUS_FILTER_VALUES, toApiStatusEnum } from "@/hooks/operationStatus";

const APPROVER_ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export type ApproverListPaginationSlot = {
  pagination: ReactNode;
};

export type ApproverListProps<T> = {
  children: (filteredItems: T[], slot?: ApproverListPaginationSlot) => ReactNode;
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

const ApproverList = <T extends Record<string, unknown>>({
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
  const mode = useThemeStore((state) => state.mode);
  const listTheme = useMemo(() => getApproverListTheme(brand, mode), [brand, mode]);
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
  const {
    items: resolvedItems,
    loading,
    page,
    limit,
    pagination,
    setPage,
    setLimit,
    statusCounts,
  } = useApproverSubDepartmentBatchList<T>({
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
      const row = item as Record<string, unknown>;
      if (
        activeStatus !== allLabel &&
        toApiStatusEnum(resolveApproverRowStatus(row, statusField)) !== toApiStatusEnum(activeStatus)
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

        const value = field.split(".").reduce<unknown>(
          (current, part) => {
            if (current && typeof current === "object") {
              return (current as Record<string, unknown>)[part];
            }

            return undefined;
          },
          item as Record<string, unknown>,
        );

        return String(value ?? "") === selectedValue;
      });
    });
  }, [
    activeStatus,
    allLabel,
    filterFields,
    filters,
    items,
    resolvedItems,
    searchKeys,
    searchText,
    statusField,
    subDepartment,
  ]);

  const displayStatusTabs = useMemo(() => {
    if (subDepartment === "subscale") {
      return [allLabel, ...SUBSCALE_STATUS_FILTER_VALUES];
    }
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
    <ListLayout
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
      {(() => {
        const paginationNode = subDepartment ? (
          <ListPagination
            count={pagination.totalRecords}
            page={Math.max(0, page - 1)}
            rowsPerPage={limit}
            rowsPerPageOptions={APPROVER_ROWS_PER_PAGE_OPTIONS}
            onPageChange={(nextPage) => setPage(nextPage + 1)}
            onRowsPerPageChange={setLimit}
            palette={{
              border: mode === "dark" ? "rgba(255,255,255,0.2)" : brand.border,
              surface: mode === "dark" ? "#1e1e1e" : brand.surface,
              text: mode === "dark" ? "#f0f2f8" : brand.text,
              textSub: mode === "dark" ? "rgba(240,242,248,0.65)" : brand.textSub,
            }}
          />
        ) : null;

        return children(filteredItems, paginationNode ? { pagination: paginationNode } : undefined);
      })()}
    </ListLayout>
  );
};

export default ApproverList;
