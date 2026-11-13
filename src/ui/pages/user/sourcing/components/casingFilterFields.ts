import { STRINGS } from "@app/config/strings";
import type { FilterField, FilterFieldOption } from "@ui/components/custom/FilterFields";

const BL = STRINGS.SOURCING.BATCH_LIST;
const CASING_TYPES = ["COMPOSITE", "METALLIC"] as const;
const INSULATION_TYPES = ["ROCASIN", "EPDM"] as const;

export type CasingFilterDraft = {
  projectId: string;
  motorStage: string;
  casingType: string;
  insulationType: string;
  status: string;
  from: string;
  to: string;
};

type CasingFilterFieldsArgs = {
  filterAllLabel: string;
  projectOptions: { projectId: string; projectName: string }[];
  projectsLoading: boolean;
  motorStageOptions: { motorStage: string }[];
  motorStagesLoading: boolean;
  statusOptions: FilterFieldOption[];
  dateErrors?: { from?: string; to?: string } | null;
};

/** Filter fields for the rocket motor casing list. */
export const getCasingFilterFields = ({
  filterAllLabel,
  projectOptions,
  projectsLoading,
  motorStageOptions,
  motorStagesLoading,
  statusOptions,
  dateErrors,
}: CasingFilterFieldsArgs): FilterField<CasingFilterDraft>[] => [
  {
    type: "select",
    key: "projectId",
    label: BL.FILTERS_PROJECT,
    minWidth: 160,
    loading: projectsLoading,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_PROJECTS },
      ...(projectsLoading
        ? []
        : projectOptions.map((p) => ({
            value: p.projectId,
            label: `${p.projectName} (${p.projectId})`,
          }))),
    ],
  },
  {
    type: "select",
    key: "motorStage",
    label: BL.FILTERS_MOTOR_STAGE,
    loading: motorStagesLoading,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_STAGES },
      ...(motorStagesLoading
        ? []
        : motorStageOptions.map((s) => ({ value: s.motorStage, label: `Stage ${s.motorStage}` }))),
    ],
  },
  {
    type: "select",
    key: "casingType",
    label: BL.FILTERS_CASING_TYPE,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_CASING_TYPES },
      ...CASING_TYPES.map((t) => ({ value: t, label: t })),
    ],
  },
  {
    type: "select",
    key: "insulationType",
    label: BL.FILTERS_INSULATION_TYPE,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_INSULATION },
      ...INSULATION_TYPES.map((t) => ({ value: t, label: t })),
    ],
  },
  { type: "select", key: "status", label: BL.FILTERS_STATUS, minWidth: 130, options: statusOptions },
  {
    type: "dateRange",
    fromKey: "from",
    toKey: "to",
    fromLabel: BL.FILTERS_FROM_DATE,
    toLabel: BL.FILTERS_TO_DATE,
    minWidth: 130,
    errors: dateErrors,
  },
];
