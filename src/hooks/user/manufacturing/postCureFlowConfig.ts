import {
  mapPostCureInhibitorTypeToApi,
  resolvePostCureMotorOptions,
  type PostCureMotorOption,
} from "./postCureConfig";

export type PostCureAddedMotor = {
  motorId: string;
  motorReceiptDate: string;
};

export type PostCureBatchMotorSource = {
  batchId?: string;
  motorId?: string;
  motorIds?: Array<string | number>;
  numberOfMotors?: number | string;
  projectId?: string;
  projectName?: string;
  [key: string]: unknown;
};

/** Seed motor tabs from batch details (receipt datetime is entered per motor). */
export const resolvePostCureMotorsFromBatch = (
  batch?: PostCureBatchMotorSource | null,
): PostCureAddedMotor[] => {
  const motorOptions = resolvePostCureMotorOptions(batch);
  if (!motorOptions.length) return [];

  return motorOptions.map((option) => ({
    motorId: option.value,
    motorReceiptDate: "",
  }));
};

export const enrichPostCureBatchFromDetails = <T extends PostCureBatchMotorSource>(
  batch: T,
  batchDetails: PostCureBatchMotorSource | null | undefined,
): T => {
  if (!batchDetails) return batch;

  const resolvedMotorIds = (
    batchDetails.motorIds?.length ? batchDetails.motorIds : batch.motorIds
  )
    ?.map((id) => String(id).trim())
    .filter(Boolean);

  return {
    ...batch,
    motorIds: resolvedMotorIds?.length ? resolvedMotorIds : batch.motorIds,
    numberOfMotors: resolvedMotorIds?.length ?? batchDetails.numberOfMotors ?? batch.numberOfMotors,
    motorId: resolvedMotorIds?.length ? resolvedMotorIds.join(", ") : batch.motorId,
    projectId: batch.projectId ?? batchDetails.projectId ?? batch.projectId,
    projectName: batch.projectName ?? batchDetails.projectName ?? batch.projectName,
    stageProgress:
      (batchDetails as { stageProgress?: unknown }).stageProgress ??
      (batch as { stageProgress?: unknown }).stageProgress,
    currentStage:
      (batchDetails as { currentStage?: unknown }).currentStage ??
      (batch as { currentStage?: unknown }).currentStage,
  };
};

export const mergePostCureMotorsFromBatchAndForm = (
  batch: PostCureBatchMotorSource | null | undefined,
  formMotors: PostCureAddedMotor[],
): PostCureAddedMotor[] => {
  const fromBatch = resolvePostCureMotorsFromBatch(batch);
  if (!fromBatch.length) return formMotors;

  const formById = new Map(formMotors.map((motor) => [motor.motorId, motor]));
  return fromBatch.map((entry) => {
    const existing = formById.get(entry.motorId);
    return existing
      ? {
          motorId: entry.motorId,
          motorReceiptDate: existing.motorReceiptDate || "",
        }
      : entry;
  });
};

/** Load form for a specific motor tab that does not yet have a schema. */
export const canLoadPostCureMotorForm = ({
  motorId,
  motorReceiptDate,
  alreadyLoaded,
}: {
  motorId: string;
  motorReceiptDate: string;
  alreadyLoaded: boolean;
}) => {
  if (alreadyLoaded) return false;
  if (!String(motorId ?? "").trim()) return false;
  return Boolean(String(motorReceiptDate ?? "").trim());
};

/** @deprecated Use canLoadPostCureMotorForm */
export const canLoadPostCureForm = ({
  motorId,
  motorReceiptDate,
  schemaFormLoaded,
}: {
  motorId: string;
  motorReceiptDate: string;
  schemaFormLoaded: boolean;
}) =>
  canLoadPostCureMotorForm({
    motorId,
    motorReceiptDate,
    alreadyLoaded: schemaFormLoaded,
  });

export const canSubmitPostCureMotor = ({
  inhibitorType,
}: {
  inhibitorType: string;
}) => Boolean(mapPostCureInhibitorTypeToApi(inhibitorType));
