import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** Aluminum Powder (AL) — lot details replace lot-no / total-qty rows; no unloading block. */
export type AluminumProcessForm = {
  uiKey: "aluminum";
  lotDetails: LotDetailFormRow[];
  equipmentId: string;
  setRpm: string;
  startDatetime: string;
  endDatetime: string;
  observation: string;
  qtyKgQualified: string;
  dispatchDatetime: string;
};

export const createEmptyAluminumProcessForm = (): AluminumProcessForm => ({
  uiKey: "aluminum",
  lotDetails: [createEmptyLotDetailRow()],
  equipmentId: "",
  setRpm: "",
  startDatetime: "",
  endDatetime: "",
  observation: "",
  qtyKgQualified: "",
  dispatchDatetime: "",
});

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const aluminumFormHasUserData = (form: AluminumProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  return [
    form.equipmentId,
    form.setRpm,
    form.startDatetime,
    form.endDatetime,
    form.observation,
    form.qtyKgQualified,
    form.dispatchDatetime,
  ].some((v) => str(v));
};

export const isAluminumUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "aluminum";
