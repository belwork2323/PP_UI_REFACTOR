export type CuringStageColumn = {
  columnKey: string;
  stage: string;
  isCustom?: boolean;
};

export type CuringProjectStageRow = {
  _rowKey: string;
  projectName: string;
  projectId: string;
  batchId: string;
  motorId: string;
  /** columnKey → cycle duration (minutes) or other cell value */
  cells: Record<string, string>;
};

export type CuringProjectStageMatrix = {
  columns: CuringStageColumn[];
  rows: CuringProjectStageRow[];
};

export type CuringBatchContext = {
  batchId?: string;
  projectName?: string;
  projectId?: string;
};

export type MotorStageOption = {
  motorStage: string;
  noOfmotors?: number;
};

const stageColumnKey = (stage: string, index: number) =>
  `stage-${String(stage).replace(/\s+/g, "_")}-${index}`;

export const buildStageColumnsFromApi = (stages: MotorStageOption[]): CuringStageColumn[] =>
  stages.map((item, index) => ({
    columnKey: stageColumnKey(item.motorStage, index),
    stage: item.motorStage,
  }));

export const buildDefaultCuringProjectStageMatrix = (
  batch: CuringBatchContext,
  motorId: string,
  stages: MotorStageOption[],
): CuringProjectStageMatrix => {
  const columns = buildStageColumnsFromApi(stages);
  const cells = Object.fromEntries(columns.map((col) => [col.columnKey, ""]));

  return {
    columns,
    rows: [
      {
        _rowKey: `row-${Date.now()}`,
        projectName: String(batch.projectName ?? "").trim(),
        projectId: String(batch.projectId ?? batch.batchId ?? "").trim(),
        batchId: String(batch.batchId ?? "").trim(),
        motorId: String(motorId ?? "").trim(),
        cells,
      },
    ],
  };
};

export const createCustomStageColumn = (stage: string, existingColumns: CuringStageColumn[]): CuringStageColumn => ({
  columnKey: stageColumnKey(stage, existingColumns.length),
  stage,
  isCustom: true,
});

export const createEmptyMatrixRow = (
  batch: CuringBatchContext,
  motorId: string,
  columns: CuringStageColumn[],
): CuringProjectStageRow => ({
  _rowKey: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  projectName: String(batch.projectName ?? "").trim(),
  projectId: String(batch.projectId ?? batch.batchId ?? "").trim(),
  batchId: String(batch.batchId ?? "").trim(),
  motorId: String(motorId ?? "").trim(),
  cells: Object.fromEntries(columns.map((col) => [col.columnKey, ""])),
});
