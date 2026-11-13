import { STRINGS } from "../../../app/config/strings";
import { MANUFACTURING_BATCH_TYPE_OPTIONS } from "../../../data/models/user/SubdepartmentBatchModel";
import type { FilterField, FilterFieldOption } from "./FilterFields";

const BL = STRINGS.MANUFACTURING.BATCH_LIST;

export type BatchFilterDraft = {
  batchId: string;
  batchType: string;
  motorId: string;
  motorStage: string;
  projectId: string;
  status: string;
};

type BatchFilterFieldsArgs = {
  filterAllLabel: string;
  motorStageOptions: { motorStage: string }[];
  motorStagesLoading: boolean;
  projectOptions: { projectId: string; projectName: string }[];
  projectsLoading: boolean;
  statusOptions: FilterFieldOption[];
};

/** Filter fields for the manufacturing / QC / dispatch batch lists. */
export const getBatchFilterFields = ({
  filterAllLabel,
  motorStageOptions,
  motorStagesLoading,
  projectOptions,
  projectsLoading,
  statusOptions,
}: BatchFilterFieldsArgs): FilterField<BatchFilterDraft>[] => [
  {
    type: "text",
    key: "batchId",
    label: BL.COL_BATCH_ID,
    placeholder: "e.g. BATCH-2026-001",
    minWidth: 160,
  },
  {
    type: "select",
    key: "batchType",
    label: BL.COL_BATCH_TYPE,
    minWidth: 160,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_BATCH_TYPES },
      ...MANUFACTURING_BATCH_TYPE_OPTIONS.map((type) => ({
        value: type,
        label: type === "MAIN" ? "Main scale" : "Sub scale",
      })),
    ],
  },
  {
    type: "text",
    key: "motorId",
    label: BL.COL_MOTOR_ID,
    placeholder: "e.g. MTR-445",
    minWidth: 160,
  },
  {
    type: "select",
    key: "motorStage",
    label: BL.COL_STAGE,
    minWidth: 160,
    loading: motorStagesLoading,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_STAGES },
      ...(motorStagesLoading
        ? []
        : motorStageOptions.map((stage) => ({
            value: stage.motorStage,
            label: `Stage ${stage.motorStage}`,
          }))),
    ],
  },
  {
    type: "select",
    key: "projectId",
    label: BL.FILTERS_PROJECT,
    minWidth: 200,
    loading: projectsLoading,
    options: [
      { value: filterAllLabel, label: BL.FILTERS_ALL_PROJECTS },
      ...(projectsLoading
        ? []
        : projectOptions.map((project) => ({
            value: project.projectId,
            label: `${project.projectName} (${project.projectId})`,
          }))),
    ],
  },
  {
    type: "select",
    key: "status",
    label: BL.FILTERS_OPERATION_STATUS,
    minWidth: 180,
    options: statusOptions,
  },
];
