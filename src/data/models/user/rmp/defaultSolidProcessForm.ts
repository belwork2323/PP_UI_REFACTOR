import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";

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
  drying: DryingTrayOvenForm;
  sieving: SievingForm;
};

export type DefaultLiquidProcessForm = {
  uiKey: "defaultLiquid";
};

export type RmpMaterialProcessForm = DefaultSolidProcessForm | DefaultLiquidProcessForm;

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
  drying: createEmptyDryingTrayOvenForm(),
  sieving: createEmptySievingForm(),
});

export const createEmptyDefaultLiquidProcessForm = (): DefaultLiquidProcessForm => ({
  uiKey: "defaultLiquid",
});

export const createEmptyProcessFormForUiKey = (uiKey: RmpMaterialUiKey): RmpMaterialProcessForm =>
  uiKey === "defaultSolid"
    ? createEmptyDefaultSolidProcessForm()
    : createEmptyDefaultLiquidProcessForm();

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const defaultSolidFormHasUserData = (form: DefaultSolidProcessForm): boolean => {
  const dryingValues = Object.values(form.drying).some((v) => str(v));
  const sievingValues = Object.values(form.sieving).some((v) => str(v));
  return dryingValues || sievingValues;
};

export const processFormHasUserData = (form: RmpMaterialProcessForm): boolean => {
  if (form.uiKey === "defaultLiquid") return false;
  return defaultSolidFormHasUserData(form);
};
