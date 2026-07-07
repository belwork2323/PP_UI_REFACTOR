import { useEffect, useMemo, useState } from "react";

export type ApproverFilterField = {
  field: string;
  label: string;
  options: string[];
};

type UseApproverListOptions<T> = {
  items?: T[];
  statusField?: string;
  searchKeys?: string[];
  filterFields?: ApproverFilterField[];
  allLabel?: string;
};

const resolveValue = (item: unknown, path: string) => {
  if (!path) {
    return "";
  }

  return (
    path.split(".").reduce<unknown>((value, key) => {
      if (value && typeof value === "object") {
        return (value as Record<string, unknown>)[key];
      }

      return undefined;
    }, item) ?? ""
  );
};

const EMPTY_FILTER_FIELDS: ApproverFilterField[] = [];

export const useApproverList = <T,>({
  items = [],
  statusField = "status",
  searchKeys = [],
  filterFields = EMPTY_FILTER_FIELDS,
  allLabel = "All",
}: UseApproverListOptions<T>) => {
  const filterFieldKeys = useMemo(
    () => filterFields.map(({ field }) => field).join("\0"),
    [filterFields],
  );

  const initialFilters = useMemo(
    () => Object.fromEntries(filterFields.map(({ field }) => [field, allLabel])),
    [filterFieldKeys, allLabel, filterFields],
  );

  const [activeStatus, setActiveStatus] = useState(allLabel);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  useEffect(() => {
    setFilters((current) => {
      const nextFilters = Object.fromEntries(
        filterFields.map(({ field }) => [field, current[field] ?? allLabel]),
      );

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(nextFilters);
      const isSame =
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => nextFilters[key] === current[key]);

      return isSame ? current : nextFilters;
    });
  }, [allLabel, filterFieldKeys, filterFields]);

  const statusValues = useMemo(() => {
    const values = new Set<string>();

    items.forEach((item) => {
      const value = resolveValue(item, statusField);

      if (value) {
        values.add(String(value));
      }
    });

    return Array.from(values);
  }, [items, statusField]);

  const statusTabs = useMemo(
    () => [allLabel, ...statusValues],
    [allLabel, statusValues],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { [allLabel]: items.length };

    statusValues.forEach((status) => {
      map[status] = items.filter(
        (item) => String(resolveValue(item, statusField)) === status,
      ).length;
    });

    return map;
  }, [allLabel, items, statusField, statusValues]);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return items.filter((item) => {
      if (
        activeStatus !== allLabel &&
        String(resolveValue(item, statusField)) !== activeStatus
      ) {
        return false;
      }

      const filtersMatch = filterFields.every(({ field }) => {
        const value = filters[field];

        if (!value || value === allLabel) {
          return true;
        }

        return String(resolveValue(item, field)) === value;
      });

      if (!filtersMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      return searchKeys.some((key) =>
        String(resolveValue(item, key)).toLowerCase().includes(query),
      );
    });
  }, [activeStatus, allLabel, filterFields, filters, items, searchKeys, searchText, statusField]);

  return {
    activeStatus,
    counts,
    filteredItems,
    filters,
    searchText,
    setActiveStatus,
    setFilters,
    setSearchText,
    statusTabs,
  };
};
