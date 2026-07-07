import type { ElementType, ReactNode } from "react";

import { STRINGS } from "../../../../app/config/strings";
import type { ApproverDepartmentKey, ApproverStatusMeta } from "../../../../app/theme/approver";
import useApproverBatchListPageFilterBar from "../../../../hooks/approver/useApproverBatchListPageFilterBar";
import { APPROVER_BATCH_LIST_SEARCH_KEYS } from "../../../../data/models/approver/ApproverBatchListModel";
import ApproverList from "./ApproverList";
import ApproverSubdepartmentBatchListTable, {
  type ApproverSubdepartmentBatchListRow,
} from "./ApproverSubdepartmentBatchListTable";

export { APPROVER_BATCH_LIST_SEARCH_KEYS } from "../../../../data/models/approver/ApproverBatchListModel";

export const APPROVER_BATCH_LIST_SEARCH_PLACEHOLDER = STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER([
  "batch ID",
  "motor ID",
  "submitted by user ID",
]);

export type ApproverSubdepartmentBatchListTableTheme = {
  accentMain: string;
  accentLight?: string;
  borderColor?: string;
  surfaceColor?: string;
  textSubColor?: string;
  primaryColor?: string;
};

export type ApproverSubdepartmentBatchListSectionProps = {
  children?: ReactNode;
  department: ApproverDepartmentKey;
  items: ApproverSubdepartmentBatchListRow[];
  onViewDetails: (row: ApproverSubdepartmentBatchListRow) => void;
  statusMeta: ApproverStatusMeta;
  subDepartment: string;
  tableTheme: ApproverSubdepartmentBatchListTableTheme;
  emptyIcon?: ElementType;
  emptySubtitle?: string;
  emptyTitle?: string;
  searchKeys?: string[];
  searchPlaceholder?: string;
  statusField?: string;
  allowViewDetailsWhenApproved?: boolean;
};

const ApproverSubdepartmentBatchListSection = ({
  children,
  department,
  items,
  onViewDetails,
  statusMeta,
  subDepartment,
  tableTheme,
  emptyIcon,
  emptySubtitle,
  emptyTitle,
  searchKeys = [...APPROVER_BATCH_LIST_SEARCH_KEYS],
  searchPlaceholder = APPROVER_BATCH_LIST_SEARCH_PLACEHOLDER,
  statusField = "status",
  allowViewDetailsWhenApproved = false,
}: ApproverSubdepartmentBatchListSectionProps) => {
  const filterBar = useApproverBatchListPageFilterBar();

  return (
    <ApproverList
      department={department}
      subDepartment={subDepartment}
      items={items}
      statusField={statusField}
      statusMeta={statusMeta}
      listFilters={filterBar.listFiltersRecord}
      statusTabsOverride={filterBar.statusTabs}
      activeStatusOverride={filterBar.statusFilter}
      onActiveStatusChange={filterBar.setStatusFilter}
      searchBarEnd={filterBar.searchBarEnd}
      filterExtension={filterBar.filterExtension}
      searchKeys={searchKeys}
      searchPlaceholder={searchPlaceholder}
      emptyIcon={emptyIcon}
      emptySubtitle={emptySubtitle}
      emptyTitle={emptyTitle}
    >
      {(filtered) => {
        const rows = filterBar.applyClientFilters(filtered, filterBar.appliedFilters);

        return (
          <>
            <ApproverSubdepartmentBatchListTable
              rows={rows}
              accentMain={tableTheme.accentMain}
              accentLight={tableTheme.accentLight}
              statusMeta={statusMeta}
              onViewDetails={onViewDetails}
              borderColor={tableTheme.borderColor}
              surfaceColor={tableTheme.surfaceColor}
              textSubColor={tableTheme.textSubColor}
              primaryColor={tableTheme.primaryColor}
              allowViewDetailsWhenApproved={allowViewDetailsWhenApproved}
            />
            {children}
          </>
        );
      }}
    </ApproverList>
  );
};

export default ApproverSubdepartmentBatchListSection;
