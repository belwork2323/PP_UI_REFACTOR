import { STRINGS } from "@app/config/strings";
import type { FilterField } from "@ui/components/custom/FilterFields";
import type { ApproverWorkflowFilterDraft } from "@ui/pages/approver/components/approverWorkflowTypes";

const BL = STRINGS.SOURCING.BATCH_LIST;

type RmsApproverFilterFieldsArgs = {
  filterAllLabel: string;
  materialOptions: { materialCode: string; materialName: string }[];
  materialsLoading: boolean;
  statusValues: string[];
  dateErrors?: { from?: string; to?: string } | null;
};

/** Declarative filter fields for Approver RMS list (rendered by shared FilterFields). */
export const getRmsApproverFilterFields = ({
  filterAllLabel,
  materialOptions,
  materialsLoading,
  statusValues,
  dateErrors,
}: RmsApproverFilterFieldsArgs): FilterField<ApproverWorkflowFilterDraft>[] => [
  {
    type: "select",
    key: "material",
    label: BL.FILTERS_MATERIAL,
    minWidth: 180,
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
    type: "select",
    key: "status",
    label: BL.FILTERS_STATUS,
    minWidth: 160,
    options: statusValues.map((status) => ({ value: status, label: status })),
  },
  {
    type: "dateRange",
    fromKey: "from",
    toKey: "to",
    fromLabel: BL.FILTERS_FROM_DATE,
    toLabel: BL.FILTERS_TO_DATE,
    errors: dateErrors,
    minWidth: 140,
  },
];
