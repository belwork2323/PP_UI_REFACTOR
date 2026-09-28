import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import type { DryingTrayOvenForm, SievingForm } from "./defaultSolidProcessForm";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** CC / IO — lot details + sieving datetime + dispatch block. CC also has drying + sieving. */
export type CcIoUiKey = "cc" | "io";

export type CcProcessForm = {
  uiKey: CcIoUiKey;
  lotDetails: LotDetailFormRow[];
  sievingDatetime: string;
  dispatchDatetime: string;
  observation: string;
  totalQtySentForPremix: string;
  /** Used by CC (default-solid drying / sieving). Empty for IO. */
  drying: DryingTrayOvenForm;
  sieving: SievingForm;
};

const emptyDrying = (): DryingTrayOvenForm => ({
  ovenType: "",
  ovenNumber: "",
  ovenSetTemperature: "",
  startDatetime: "",
  endDatetime: "",
  moisture: "",
  observation: "",
});

const emptySieving = (): SievingForm => ({
  sievingDispatchDatetime: "",
  sievedQuantity: "",
  sieveMeshSize: "",
  observation: "",
});

export const createEmptyCcProcessForm = (uiKey: CcIoUiKey = "cc"): CcProcessForm => ({
  uiKey,
  lotDetails: [createEmptyLotDetailRow()],
  sievingDatetime: "",
  dispatchDatetime: "",
  observation: "",
  totalQtySentForPremix: "",
  drying: emptyDrying(),
  sieving: emptySieving(),
});

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const ccFormHasUserData = (form: CcProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  if (
    [form.sievingDatetime, form.dispatchDatetime, form.observation, form.totalQtySentForPremix].some(
      (v) => str(v),
    )
  ) {
    return true;
  }
  if (Object.values(form.drying).some((v) => str(v))) return true;
  return Object.values(form.sieving).some((v) => str(v));
};

export const isCcIoUiKey = (uiKey: RmpMaterialUiKey): uiKey is CcIoUiKey =>
  uiKey === "cc" || uiKey === "io";

export const ccIoSectionTitle = (uiKey: CcIoUiKey): string =>
  uiKey === "io" ? "Iron Oxide (IO)" : "Copper Chromite (CC)";
