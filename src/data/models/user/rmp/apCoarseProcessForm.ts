import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

export type ApOperationParameterRow = {
  operation: string;
  setParameter: string;
  actualParameter: string;
};

export type ApTimedOperationParameterRow = ApOperationParameterRow & {
  startTime: string;
  endTime: string;
};

export type ApParticleSizeRow = {
  psdRequirement: string;
  specification: string;
  result: string;
};

export type ApCoarseProcessForm = {
  uiKey: "apCoarse";
  lotDetails: LotDetailFormRow[];
  equipmentType: string;
  blendingDryingParameters: ApOperationParameterRow[];
  dryingOperationRvd: ApTimedOperationParameterRow[];
  particleSizeDistribution: ApParticleSizeRow[];
};

export const createEmptyApOperationParameterRow = (): ApOperationParameterRow => ({
  operation: "",
  setParameter: "",
  actualParameter: "",
});

export const createEmptyApTimedOperationParameterRow = (): ApTimedOperationParameterRow => ({
  operation: "",
  setParameter: "",
  actualParameter: "",
  startTime: "",
  endTime: "",
});

export const createEmptyApParticleSizeRow = (): ApParticleSizeRow => ({
  psdRequirement: "",
  specification: "",
  result: "",
});

/** Seeded from AP Coarse process sheet (Drying / RVD / PSD). */
export const createSeededApCoarseProcessForm = (): ApCoarseProcessForm => ({
  uiKey: "apCoarse",
  lotDetails: [createEmptyLotDetailRow()],
  equipmentType: "RVD",
  blendingDryingParameters: [
    {
      operation: "Hot Water circulation Temperature Set, °C",
      setParameter: "Temp.: 75±5°C",
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
      setParameter: "Temp: 65±2°C, Duration: 90 min",
      actualParameter: "",
      startTime: "",
      endTime: "",
    },
    {
      operation: "Vacuum Application",
      setParameter: "Vacuum: 150 torr, Time: 15 min",
      actualParameter: "",
      startTime: "",
      endTime: "",
    },
  ],
  particleSizeDistribution: [
    { psdRequirement: "Above 500µm, % max", specification: "5", result: "" },
    { psdRequirement: "500-355 µm, %", specification: "27±5", result: "" },
    { psdRequirement: "355-300 µm, %", specification: "32±5", result: "" },
    { psdRequirement: "300-45 µm, %", specification: "35±5", result: "" },
    { psdRequirement: "Less than 45 µm, %", specification: "1", result: "" },
  ],
});

export const createEmptyApCoarseProcessForm = (): ApCoarseProcessForm =>
  createSeededApCoarseProcessForm();

export const apCoarseFormHasUserData = (form: ApCoarseProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  if (
    form.blendingDryingParameters.some(
      (row) => String(row.actualParameter ?? "").trim() || String(row.operation ?? "").trim(),
    )
  ) {
    return true;
  }
  if (
    form.dryingOperationRvd.some(
      (row) =>
        String(row.actualParameter ?? "").trim() ||
        String(row.startTime ?? "").trim() ||
        String(row.endTime ?? "").trim(),
    )
  ) {
    return true;
  }
  if (form.particleSizeDistribution.some((row) => String(row.result ?? "").trim())) {
    return true;
  }
  return false;
};

export const isApCoarseUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "apCoarse";
