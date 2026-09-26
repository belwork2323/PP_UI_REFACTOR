import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyApCoarseProcessForm,
  apCoarseFormHasUserData,
  type ApCoarseProcessForm,
} from "./apCoarseProcessForm";
import {
  createEmptyApFineProcessForm,
  apFineFormHasUserData,
  type ApFineProcessForm,
} from "./apFineProcessForm";
import {
  createEmptyApUltraFineProcessForm,
  apUltraFineFormHasUserData,
  type ApUltraFineProcessForm,
} from "./apUltraFineProcessForm";
import {
  createEmptyAluminumProcessForm,
  aluminumFormHasUserData,
  type AluminumProcessForm,
} from "./aluminumProcessForm";
import {
  createEmptyDoaProcessForm,
  doaFormHasUserData,
  type DoaProcessForm,
} from "./doaProcessForm";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  sumLotDetailQuantities,
  type LotDetailFormRow,
} from "./lotDetailForm";

export type { LotDetailFormRow };
export { createEmptyLotDetailRow, lotDetailsHaveUserData, sumLotDetailQuantities };

export type DryingTrayOvenForm = {
  ovenType: string;
  ovenNumber: string;
  ovenSetTemperature: string;
  startDatetime: string;
  endDatetime: string;
  moisture: string;
  observation: string;
};

export type SievingForm = {
  sievingDispatchDatetime: string;
  sievedQuantity: string;
  sieveMeshSize: string;
  observation: string;
};

export type DefaultSolidProcessForm = {
  uiKey: "defaultSolid";
  lotDetails: LotDetailFormRow[];
  drying: DryingTrayOvenForm;
  sieving: SievingForm;
};

export type DefaultLiquidProcessForm = {
  uiKey: "defaultLiquid";
  lotDetails: LotDetailFormRow[];
};

export type RmpMaterialProcessForm =
  | DefaultSolidProcessForm
  | DefaultLiquidProcessForm
  | ApCoarseProcessForm
  | ApFineProcessForm
  | ApUltraFineProcessForm
  | AluminumProcessForm
  | DoaProcessForm;

export const createEmptyDryingTrayOvenForm = (): DryingTrayOvenForm => ({
  ovenType: "",
  ovenNumber: "",
  ovenSetTemperature: "",
  startDatetime: "",
  endDatetime: "",
  moisture: "",
  observation: "",
});

export const createEmptySievingForm = (): SievingForm => ({
  sievingDispatchDatetime: "",
  sievedQuantity: "",
  sieveMeshSize: "",
  observation: "",
});

export const createEmptyDefaultSolidProcessForm = (): DefaultSolidProcessForm => ({
  uiKey: "defaultSolid",
  lotDetails: [createEmptyLotDetailRow()],
  drying: createEmptyDryingTrayOvenForm(),
  sieving: createEmptySievingForm(),
});

export const createEmptyDefaultLiquidProcessForm = (): DefaultLiquidProcessForm => ({
  uiKey: "defaultLiquid",
  lotDetails: [createEmptyLotDetailRow()],
});

export const createEmptyProcessFormForUiKey = (uiKey: RmpMaterialUiKey): RmpMaterialProcessForm => {
  if (uiKey === "apCoarse") return createEmptyApCoarseProcessForm();
  if (uiKey === "apFine") return createEmptyApFineProcessForm();
  if (uiKey === "apUltraFine") return createEmptyApUltraFineProcessForm();
  if (uiKey === "aluminum") return createEmptyAluminumProcessForm();
  if (uiKey === "doa") return createEmptyDoaProcessForm();
  if (uiKey === "defaultLiquid") return createEmptyDefaultLiquidProcessForm();
  return createEmptyDefaultSolidProcessForm();
};

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const defaultSolidFormHasUserData = (form: DefaultSolidProcessForm): boolean => {
  const dryingValues = Object.values(form.drying).some((v) => str(v));
  const sievingValues = Object.values(form.sieving).some((v) => str(v));
  return lotDetailsHaveUserData(form.lotDetails) || dryingValues || sievingValues;
};

export const defaultLiquidFormHasUserData = (form: DefaultLiquidProcessForm): boolean =>
  lotDetailsHaveUserData(form.lotDetails);

export const processFormHasUserData = (form: RmpMaterialProcessForm): boolean => {
  if (form.uiKey === "defaultLiquid") return defaultLiquidFormHasUserData(form);
  if (form.uiKey === "apCoarse") return apCoarseFormHasUserData(form);
  if (form.uiKey === "apFine") return apFineFormHasUserData(form);
  if (form.uiKey === "apUltraFine") return apUltraFineFormHasUserData(form);
  if (form.uiKey === "aluminum") return aluminumFormHasUserData(form);
  if (form.uiKey === "doa") return doaFormHasUserData(form);
  return defaultSolidFormHasUserData(form);
};
