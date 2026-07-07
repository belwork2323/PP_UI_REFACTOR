export type QcProcessingSlot = "SOLID_PROCESSING" | "LIQUID_PROCESSING";

export const QC_PROCESSING_PREMIX_COUNT = 15;

export const QC_PROCESSING_PREMIX_OPTIONS = Array.from(
  { length: QC_PROCESSING_PREMIX_COUNT },
  (_, index) => index + 1,
);

export const getQcPremixLabel = (premixNo: number) => `Premix - ${premixNo}`;

export const isRawMaterialRevalidationType = (rawMaterialType: string) =>
  rawMaterialType === "RAW_MATERIAL_REVALIDATION";

export const isRawMaterialProcessingType = (rawMaterialType: string) =>
  rawMaterialType === "RAW_MATERIAL_PROCESSING";

export const isSolidProcessingSubType = (processingType: string) =>
  processingType === "SOLID_PROCESSING";

export const isLiquidProcessingSubType = (processingType: string) =>
  processingType === "LIQUID_PROCESSING";

export const isBothProcessingType = (processingType: string) => processingType === "BOTH";

export const isPremixProcessingFlow = (rawMaterialType: string, processingType: string) =>
  isRawMaterialProcessingType(rawMaterialType) &&
  (isSolidProcessingSubType(processingType) ||
    isLiquidProcessingSubType(processingType) ||
    isBothProcessingType(processingType));

export const resolveActivePremixSlot = (
  processingType: string,
  premixSlot: QcProcessingSlot,
): QcProcessingSlot => {
  if (isSolidProcessingSubType(processingType)) return "SOLID_PROCESSING";
  if (isLiquidProcessingSubType(processingType)) return "LIQUID_PROCESSING";
  return premixSlot;
};
