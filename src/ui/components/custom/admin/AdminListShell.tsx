import type { ReactNode } from "react";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import FilterToggleButton from "@ui/components/common/FilterToggleButton";
import BatchListShell from "@ui/components/custom/BatchListShell";

type AdminListShellTheme = {
  batchListShell: Parameters<typeof BatchListShell>[0]["theme"];
  filterToggle: {
    filterBtn: (active: boolean) => object;
    filterBtnIcon: object;
    filterBtnText: object;
    filterBadgePill: object;
    filterBtnChevron: object;
  };
};

type AdminListShellProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filterOpen: boolean;
  onFilterToggle: () => void;
  activeFilterCount: number;
  filtersToggleLabel: string;
  resultText: string;
  loading?: boolean;
  hasItems: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  filterExtension?: ReactNode;
  toolbarEnd?: ReactNode;
  children?: ReactNode;
  theme: AdminListShellTheme;
};

const AdminListShell = ({
  search,
  onSearchChange,
  searchPlaceholder,
  filterOpen,
  onFilterToggle,
  activeFilterCount,
  filtersToggleLabel,
  resultText,
  loading = false,
  hasItems,
  emptyTitle = "No records found",
  emptySubtitle = "Try adjusting your search or filters",
  filterExtension,
  toolbarEnd,
  children,
  theme,
}: AdminListShellProps) => {
  const filterActive = filterOpen || activeFilterCount > 0;
  const { batchListShell, filterToggle } = theme;

  const searchBarEnd = (
    <>
      <FilterToggleButton
        label={filtersToggleLabel}
        count={activeFilterCount}
        isOpen={filterOpen}
        onClick={onFilterToggle}
        sx={filterToggle.filterBtn(filterActive)}
        iconSx={filterToggle.filterBtnIcon}
        textSx={filterToggle.filterBtnText}
        badgeSx={filterToggle.filterBadgePill}
        chevronSx={filterToggle.filterBtnChevron}
      />
      {toolbarEnd}
    </>
  );

  return (
    <BatchListShell
      activeStatus=""
      emptyIcon={LayersRoundedIcon}
      emptySubtitle={emptySubtitle}
      emptyTitle={emptyTitle}
      filterExtension={filterOpen ? filterExtension : null}
      hasItems={hasItems}
      loading={loading}
      onSearchChange={onSearchChange}
      resultIcon={LayersRoundedIcon}
      resultText={resultText}
      searchBarEnd={searchBarEnd}
      searchPlaceholder={searchPlaceholder}
      searchValue={search}
      theme={batchListShell}
    >
      {children}
    </BatchListShell>
  );
};

export default AdminListShell;
