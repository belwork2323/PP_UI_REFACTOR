import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** NONOX-D — lot details + quantity sieved + mesh + dispatch block. */
export type NonoxDProcessForm = {
  uiKey: "nonoxD";
  lotDetails: LotDetailFormRow[];
  quantitySieved: string;
  sieveMeshSize: string;
  dispatchDatetime: string;
  observation: string;
  totalQtySentForPremix: string;
};

export const createEmptyNonoxDProcessForm = (): NonoxDProcessForm => ({
  uiKey: "nonoxD",
  lotDetails: [createEmptyLotDetailRow()],
  quantitySieved: "",
  sieveMeshSize: "",
  dispatchDatetime: "",
  observation: "",
  totalQtySentForPremix: "",
});

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const nonoxDFormHasUserData = (form: NonoxDProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  return [
    form.quantitySieved,
    form.sieveMeshSize,
    form.dispatchDatetime,
    form.observation,
    form.totalQtySentForPremix,
  ].some((v) => str(v));
};

export const isNonoxDUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "nonoxD";
