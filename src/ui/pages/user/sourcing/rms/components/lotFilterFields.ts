import { STRINGS } from "@app/config/strings";
import type { FilterField, FilterFieldOption } from "@ui/components/custom/FilterFields";

const BL = STRINGS.SOURCING.BATCH_LIST;

export type LotFilterDraft = {
  material: string;
  manufacturer: string;
  status: string;
  from: string;
  to: string;
};

type LotFilterFieldsArgs = {
  filterAllLabel: string;
  materialOptions: { materialCode: string; materialName: string }[];
  materialsLoading: boolean;
  statusOptions: FilterFieldOption[];
  dateErrors?: { from?: string; to?: string } | null;
};

/** Filter fields for the raw material lot list. */
export const getLotFilterFields = ({
  filterAllLabel,
  materialOptions,
  materialsLoading,
  statusOptions,
  dateErrors,
}: LotFilterFieldsArgs): FilterField<LotFilterDraft>[] => [
  {
    type: "select",
    key: "material",
    label: BL.FILTERS_MATERIAL,
    minWidth: 160,
    loading: materialsLoading,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_MATERIALS },
      ...(materialsLoading
        ? []
        : materialOptions.map((material) => ({
            value: material.materialCode,
            label: `${material.materialCode} — ${material.materialName}`,
          }))),
    ],
  },
  {
    type: "text",
    key: "manufacturer",
    label: BL.FILTERS_MANUFACTURER,
    placeholder: "e.g. Prefiled",
    minWidth: 160,
  },
  { type: "select", key: "status", label: BL.FILTERS_STATUS, options: statusOptions },
  {
    type: "dateRange",
    fromKey: "from",
    toKey: "to",
    fromLabel: BL.FILTERS_FROM_DATE,
    toLabel: BL.FILTERS_TO_DATE,
    errors: dateErrors,
  },
];
