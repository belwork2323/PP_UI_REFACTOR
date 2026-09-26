import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** Same shape as default-solid tray oven / sieving (local to avoid circular imports). */
export type ApUltraFineTrayOvenForm = {
  ovenType: string;
  ovenNumber: string;
  ovenSetTemperature: string;
  startDatetime: string;
  endDatetime: string;
  moisture: string;
  observation: string;
};

export type ApUltraFineSievingForm = {
  sievingDispatchDatetime: string;
  sievedQuantity: string;
  sieveMeshSize: string;
  observation: string;
};

export type ApUltraFineProcessForm = {
  uiKey: "apUltraFine";
  lotDetails: LotDetailFormRow[];
  /** Grinding — lot details replace multi-batch + coarse lot/qty rows. */
  equipmentId: string;
  screwFeederRpm: string;
  feedPressure: string;
  grindingPressure: string;
  grindingStartDatetime: string;
  grindingEndDatetime: string;
  grindingObservation: string;
  /** Spec is fixed: 6±1μm — user enters measured result. */
  particleSizeResult: string;
  qtyKgQualified: string;
  drying: ApUltraFineTrayOvenForm;
  sieving: ApUltraFineSievingForm;
};

const emptyTrayOven = (): ApUltraFineTrayOvenForm => ({
  ovenType: "",
  ovenNumber: "",
  ovenSetTemperature: "",
  startDatetime: "",
  endDatetime: "",
  moisture: "",
  observation: "",
});

const emptySieving = (): ApUltraFineSievingForm => ({
  sievingDispatchDatetime: "",
  sievedQuantity: "",
  sieveMeshSize: "",
  observation: "",
});

export const AP_ULTRA_FINE_PARTICLE_SIZE_SPEC = "6±1μm";

export const createSeededApUltraFineProcessForm = (): ApUltraFineProcessForm => ({
  uiKey: "apUltraFine",
  lotDetails: [createEmptyLotDetailRow()],
  equipmentId: "",
  screwFeederRpm: "",
  feedPressure: "",
  grindingPressure: "",
  grindingStartDatetime: "",
  grindingEndDatetime: "",
  grindingObservation: "",
  particleSizeResult: "",
  qtyKgQualified: "",
  drying: emptyTrayOven(),
  sieving: emptySieving(),
});

export const createEmptyApUltraFineProcessForm = (): ApUltraFineProcessForm =>
  createSeededApUltraFineProcessForm();

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const apUltraFineFormHasUserData = (form: ApUltraFineProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  if (
    [
      form.equipmentId,
      form.screwFeederRpm,
      form.feedPressure,
      form.grindingPressure,
      form.grindingStartDatetime,
      form.grindingEndDatetime,
      form.grindingObservation,
      form.particleSizeResult,
      form.qtyKgQualified,
    ].some((v) => str(v))
  ) {
    return true;
  }
  if (Object.values(form.drying).some((v) => str(v))) return true;
  if (Object.values(form.sieving).some((v) => str(v))) return true;
  return false;
};

export const isApUltraFineUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "apUltraFine";
