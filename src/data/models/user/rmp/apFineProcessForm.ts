import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyApOperationParameterRow,
  createEmptyApParticleSizeRow,
  createEmptyApTimedOperationParameterRow,
  type ApOperationParameterRow,
  type ApParticleSizeRow,
  type ApTimedOperationParameterRow,
} from "./apCoarseProcessForm";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** Same shape as default-solid tray oven / sieving (local to avoid circular imports). */
export type ApFineTrayOvenForm = {
  ovenType: string;
  ovenNumber: string;
  ovenSetTemperature: string;
  startDatetime: string;
  endDatetime: string;
  moisture: string;
  observation: string;
};

export type ApFineSievingForm = {
  sievingDispatchDatetime: string;
  sievedQuantity: string;
  sieveMeshSize: string;
  observation: string;
};

export type ApFineProcessForm = {
  uiKey: "apFine";
  lotDetails: LotDetailFormRow[];
  /** Grinding — ACM (lot details replace multi-batch + coarse lot/qty rows). */
  acmEquipmentId: string;
  millRpm: string;
  classifierRpm: string;
  screwFeederRpm: string;
  idFanRpm: string;
  setPressure: string;
  grindingStartDatetime: string;
  grindingEndDatetime: string;
  grindingObservation: string;
  particleSizeDistribution: ApParticleSizeRow[];
  qtyKgQualified: string;
  blendingDryingParameters: ApOperationParameterRow[];
  dryingOperationRvd: ApTimedOperationParameterRow[];
  trayOvenStorage: ApFineTrayOvenForm;
  sieving: ApFineSievingForm;
};

export type {
  ApOperationParameterRow,
  ApParticleSizeRow,
  ApTimedOperationParameterRow,
};

export {
  createEmptyApOperationParameterRow,
  createEmptyApTimedOperationParameterRow,
  createEmptyApParticleSizeRow,
};

const emptyTrayOven = (): ApFineTrayOvenForm => ({
  ovenType: "",
  ovenNumber: "",
  ovenSetTemperature: "",
  startDatetime: "",
  endDatetime: "",
  moisture: "",
  observation: "",
});

const emptySieving = (): ApFineSievingForm => ({
  sievingDispatchDatetime: "",
  sievedQuantity: "",
  sieveMeshSize: "",
  observation: "",
});

/** Seeded from AP Fine process sheets (Grinding + Blending/RVD/Tray/Sieving). */
export const createSeededApFineProcessForm = (): ApFineProcessForm => ({
  uiKey: "apFine",
  lotDetails: [createEmptyLotDetailRow()],
  acmEquipmentId: "",
  millRpm: "",
  classifierRpm: "",
  screwFeederRpm: "",
  idFanRpm: "",
  setPressure: "",
  grindingStartDatetime: "",
  grindingEndDatetime: "",
  grindingObservation: "",
  particleSizeDistribution: [
    { psdRequirement: "+105", specification: "", result: "" },
    { psdRequirement: "75+105", specification: "", result: "" },
    { psdRequirement: "<75", specification: "", result: "" },
  ],
  qtyKgQualified: "",
  blendingDryingParameters: [
    {
      operation: "Hot Water circulation Temperature Set, °C",
      setParameter: "Temp: 75±5°C",
      actualParameter: "",
    },
    {
      operation: "Material Quantity",
      setParameter: "Total Quantity from various lots",
      actualParameter: "",
    },
  ],
  dryingOperationRvd: [
    {
      operation: "Drying",
      setParameter: "Temp.: 70°C, Duration: 90 min",
      actualParameter: "",
      startTime: "",
      endTime: "",
    },
    {
      operation: "Vacuum Application",
      setParameter: "Vacuum: 150 torr, Time: 25 min",
      actualParameter: "",
      startTime: "",
      endTime: "",
    },
    {
      operation: "Shifting of Material to Tray Oven",
      setParameter: "",
      actualParameter: "",
      startTime: "",
      endTime: "",
    },
  ],
  trayOvenStorage: emptyTrayOven(),
  sieving: emptySieving(),
});

export const createEmptyApFineProcessForm = (): ApFineProcessForm =>
  createSeededApFineProcessForm();

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const apFineFormHasUserData = (form: ApFineProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  if (
    [
      form.acmEquipmentId,
      form.millRpm,
      form.classifierRpm,
      form.screwFeederRpm,
      form.idFanRpm,
      form.setPressure,
      form.grindingStartDatetime,
      form.grindingEndDatetime,
      form.grindingObservation,
      form.qtyKgQualified,
    ].some((v) => str(v))
  ) {
    return true;
  }
  if (form.particleSizeDistribution.some((row) => str(row.result) || str(row.specification))) {
    return true;
  }
  if (
    form.blendingDryingParameters.some(
      (row) => str(row.actualParameter) || str(row.operation),
    )
  ) {
    return true;
  }
  if (
    form.dryingOperationRvd.some(
      (row) => str(row.actualParameter) || str(row.startTime) || str(row.endTime),
    )
  ) {
    return true;
  }
  if (Object.values(form.trayOvenStorage).some((v) => str(v))) return true;
  if (Object.values(form.sieving).some((v) => str(v))) return true;
  return false;
};

export const isApFineUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "apFine";
