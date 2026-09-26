import type { MaterialsListGrade, MaterialsListItem } from "../MaterialsListModel";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";

export type RmpProcessType =
  | "DEFAULT_SOLID"
  | "DEFAULT_LIQUID"
  | "AP_COARSE"
  | "AP_FINE"
  | "AP_ULTRA_FINE"
  | "ALUMINUM"
  | "DOA";

export type LotDetailDto = {
  lotId: string;
  quantity: number | null;
};

export type DryingTrayOvenDto = {
  ovenType?: string | null;
  ovenNumber?: string | null;
  ovenSetTemperature?: string | null;
  startDatetime?: string | null;
  endDatetime?: string | null;
  moisture?: string | null;
  observation?: string | null;
};

export type SievingDto = {
  sievingDispatchDatetime?: string | null;
  sievedQuantity?: string | null;
  sieveMeshSize?: string | null;
  observation?: string | null;
};

export type ApOperationParameterRowDto = {
  operation?: string | null;
  setParameter?: string | null;
  actualParameter?: string | null;
};

export type ApTimedOperationParameterRowDto = ApOperationParameterRowDto & {
  startTime?: string | null;
  endTime?: string | null;
};

export type ApParticleSizeRowDto = {
  psdRequirement?: string | null;
  specification?: string | null;
  result?: string | null;
};

export type ApCoarseProcessDto = {
  equipmentType?: string | null;
  blendingDryingParameters?: ApOperationParameterRowDto[];
  dryingOperationRvd?: ApTimedOperationParameterRowDto[];
  particleSizeDistribution?: ApParticleSizeRowDto[];
};

export type ApFineProcessDto = {
  acmEquipmentId?: string | null;
  millRpm?: string | null;
  classifierRpm?: string | null;
  screwFeederRpm?: string | null;
  idFanRpm?: string | null;
  setPressure?: string | null;
  grindingStartDatetime?: string | null;
  grindingEndDatetime?: string | null;
  grindingObservation?: string | null;
  particleSizeDistribution?: ApParticleSizeRowDto[];
  qtyKgQualified?: string | null;
  blendingDryingParameters?: ApOperationParameterRowDto[];
  dryingOperationRvd?: ApTimedOperationParameterRowDto[];
  trayOvenStorage?: DryingTrayOvenDto | null;
  sieving?: SievingDto | null;
};

export type ApUltraFineProcessDto = {
  equipmentId?: string | null;
  screwFeederRpm?: string | null;
  feedPressure?: string | null;
  grindingPressure?: string | null;
  grindingStartDatetime?: string | null;
  grindingEndDatetime?: string | null;
  grindingObservation?: string | null;
  particleSizeResult?: string | null;
  qtyKgQualified?: string | null;
  drying?: DryingTrayOvenDto | null;
  sieving?: SievingDto | null;
};

export type AluminumProcessDto = {
  equipmentId?: string | null;
  setRpm?: string | null;
  startDatetime?: string | null;
  endDatetime?: string | null;
  observation?: string | null;
  qtyKgQualified?: string | null;
  dispatchDatetime?: string | null;
};

export type DoaProcessDto = {
  dispatchDatetime?: string | null;
  observation?: string | null;
  totalQtySentForPremix?: string | null;
};

/** Typed API process entry — no sections bag for RMP writes. */
export type PreparationProcessEntry = {
  materialId: number;
  materialCode: string;
  materialName: string;
  gradeId: number | null;
  gradeCode: string | null;
  /** RMP typed process; optional for legacy QC section payloads. */
  processType?: RmpProcessType | string;
  lotDetails?: LotDetailDto[];
  drying?: DryingTrayOvenDto | null;
  sieving?: SievingDto | null;
  apCoarse?: ApCoarseProcessDto | null;
  apFine?: ApFineProcessDto | null;
  apUltraFine?: ApUltraFineProcessDto | null;
  aluminum?: AluminumProcessDto | null;
  doa?: DoaProcessDto | null;
  /** @deprecated QC / legacy */
  schemaVersion?: string;
  /** @deprecated QC / legacy */
  schemaType?: string;
  /**
   * Legacy only — present on old saved docs. Prefer typed fields.
   * @deprecated
   */
  sections?: Array<{
    sectionId: string;
    sectionData: Record<string, unknown>[];
  }>;
};

/** @deprecated Prefer PreparationProcessEntry — same shape, kept for QC hydrate helpers. */
export type SchemaProcessSubmission = PreparationProcessEntry;

export type PreparationPremixEntry = {
  premixNo: number;
  premixDate: string;
  materialType: "SOLID" | "LIQUID" | "BOTH";
  premixSubmissionType?: "DRAFT" | "SUBMIT";
  solidProcess: PreparationProcessEntry[];
  liquidProcess: PreparationProcessEntry[];
};

export const uiKeyToProcessType = (uiKey: RmpMaterialUiKey): RmpProcessType => {
  if (uiKey === "defaultLiquid") return "DEFAULT_LIQUID";
  if (uiKey === "apCoarse") return "AP_COARSE";
  if (uiKey === "apFine") return "AP_FINE";
  if (uiKey === "apUltraFine") return "AP_ULTRA_FINE";
  if (uiKey === "aluminum") return "ALUMINUM";
  if (uiKey === "doa") return "DOA";
  return "DEFAULT_SOLID";
};

export const processTypeToUiKey = (processType: string | null | undefined): RmpMaterialUiKey => {
  const raw = String(processType ?? "")
    .trim()
    .toUpperCase();
  if (raw === "DEFAULT_LIQUID" || raw === "LIQUID") return "defaultLiquid";
  if (raw === "AP_COARSE") return "apCoarse";
  if (raw === "AP_FINE") return "apFine";
  if (raw === "AP_ULTRA_FINE") return "apUltraFine";
  if (raw === "ALUMINUM" || raw === "ALUMINIUM") return "aluminum";
  if (raw === "DOA") return "doa";
  return "defaultSolid";
};

export const findMaterialInList = (
  materials: MaterialsListItem[],
  materialCode: string,
): MaterialsListItem | undefined =>
  materials.find((m) => m.materialCode.toUpperCase() === String(materialCode ?? "").toUpperCase());

export const findGradeInMaterial = (
  material: MaterialsListItem | undefined,
  gradeCode: string,
): MaterialsListGrade | undefined => {
  const raw = String(gradeCode ?? "").trim();
  if (!raw || !material?.grades?.length) return undefined;

  return material.grades.find((grade) => {
    const code = String(grade.gradeCode ?? "").trim();
    const name = String(grade.gradeName ?? "").trim();
    return code.toUpperCase() === raw.toUpperCase() || name.toUpperCase() === raw.toUpperCase();
  });
};

export const derivePremixMaterialType = (premix: {
  selectedProcesses: { solid: boolean; liquid: boolean };
}): "SOLID" | "LIQUID" | "BOTH" => {
  const { solid, liquid } = premix.selectedProcesses;
  if (solid && liquid) return "BOTH";
  if (solid) return "SOLID";
  return "LIQUID";
};

/** Kept for QC modules that still reference legacy constants. */
export const RMP_SCHEMA_FUNCTIONALITY = "CREATE_RAW_MATERIAL_PREPARATION_FORM";
export const RMP_SCHEMA_TYPE = "RAW_MATERIALS";
export const RMP_SCHEMA_VERSION = "1.0";
