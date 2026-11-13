import type { ReactNode } from "react";

import { STRINGS } from "@app/config/strings";
import { useApproverListRefreshStore } from "@app/store/approverListRefreshStore";
import type { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { getFromToOrderMessages } from "@data/validation/dateRangeValidation";
import type { RawMaterialSourcingApproverListState } from "@hooks/approver/sourcing/rms/useRawMaterialSourcingApproverList";
import { useListFilterDraft } from "@hooks/useListFilterDraft";
import ApproverList from "@ui/components/custom/ApproverList";
import ListFilterPanel, { ListFilterToolbar } from "@ui/components/custom/ListFilterPanel";
import RawMaterialApproverFilterFields, {
  type RawMaterialApproverFilterDraft,
} from "./components/RawMaterialApproverFilterFields";
import RawMaterialApproverLotTable from "./components/RawMaterialApproverLotTable";

const BL = STRINGS.SOURCING.BATCH_LIST;

const SEARCH_KEYS = [
  "lotId",
  "sourcingId",
  "materialCode",
  "materialName",
  "supplyOrderNo",
  "manufacturerName",
  "submittedBy",
];

type RawMaterialSourcingApproverListPageProps = {
  list: RawMaterialSourcingApproverListState;
  theme: ReturnType<typeof getRawMaterialSourcingApproverTheme>;
  onViewDetails: (row: any) => void;
  /** Dialogs rendered inside the list so they share its mount lifecycle. */
  overlays?: ReactNode;
};

const RawMaterialSourcingApproverListPage = ({
  list,
  theme,
  onViewDetails,
  overlays,
}: RawMaterialSourcingApproverListPageProps) => {
  const {
    statusMeta,
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    materialOptions,
    materialsLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel,
  } = list;
  const bumpListVersion = useApproverListRefreshStore((state) => state.bumpVersion);

  const filterPanel = useListFilterDraft<RawMaterialApproverFilterDraft>({
    empty: { material: filterAllLabel, status: filterAllLabel, from: "", to: "" },
    fromApplied: () => ({
      material: appliedFilters.materialCode || filterAllLabel,
      status: statusFilter,
      from: appliedFilters.fromDate,
      to: appliedFilters.toDate,
    }),
    statusFilter,
  });
  const { draft } = filterPanel;

  const draftDateRangeErrors = getFromToOrderMessages(draft.from, draft.to, "date");

  const handleApplyPanelFilters = () => {
    if (draftDateRangeErrors) return;
    applyPanelFilters({
      materialCode: draft.material === filterAllLabel ? "" : draft.material,
      fromDate: draft.from,
      toDate: draft.to,
      status: draft.status,
    });
    filterPanel.close();
  };

  const handleClearAllFilters = () => {
    clearListFilters();
    filterPanel.resetDraft();
  };

  const searchBarEnd = (
    <ListFilterToolbar
      palette={theme.palette}
      activeCount={activeFilterCount}
      isOpen={filterPanel.isOpen}
      onToggle={filterPanel.toggle}
      onRefresh={bumpListVersion}
    />
  );

  const filterExtension = filterPanel.isOpen ? (
    <ListFilterPanel
      palette={theme.palette}
      title={BL.FILTERS_TITLE}
      activeCount={activeFilterCount}
      onClear={handleClearAllFilters}
      onClose={filterPanel.close}
      onApply={handleApplyPanelFilters}
    >
      <RawMaterialApproverFilterFields
        palette={theme.palette}
        draft={draft}
        onDraftChange={filterPanel.updateDraft}
        filterAllLabel={filterAllLabel}
        materialOptions={materialOptions}
        materialsLoading={materialsLoading}
        statusValues={statusDropdownValues}
        dateErrors={draftDateRangeErrors}
      />
    </ListFilterPanel>
  ) : null;

  return (
    <ApproverList
      department="sourcing"
      subDepartment="raw-material"
      statusField="status"
      statusMeta={statusMeta}
      statusTabsOverride={statusTabs}
      activeStatusOverride={statusFilter}
      onActiveStatusChange={setStatusFilter}
      listFilters={listFiltersRecord}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      searchKeys={SEARCH_KEYS}
      searchPlaceholder={STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER([
        "lot ID",
        "sourcing ID",
        "material code",
        "manufacturer",
      ])}
    >
      {(filtered) => (
        <>
          <RawMaterialApproverLotTable
            rows={filtered}
            theme={theme}
            statusMeta={statusMeta}
            onViewDetails={onViewDetails}
          />

          {overlays}
        </>
      )}
    </ApproverList>
  );
};

export default RawMaterialSourcingApproverListPage;
