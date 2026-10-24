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
  lotDetailsQaRemarks: string;
  quantitySieved: string;
  sieveMeshSize: string;
  dispatchDatetime: string;
  observation: string;
  qaRemarks: string;
  totalQtySentForPremix: string;
};

export const createEmptyNonoxDProcessForm = (): NonoxDProcessForm => ({
  uiKey: "nonoxD",
  lotDetails: [createEmptyLotDetailRow()],
  lotDetailsQaRemarks: "",
  quantitySieved: "",
  sieveMeshSize: "",
  dispatchDatetime: "",
  observation: "",
  qaRemarks: "",
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
    form.qaRemarks,
    form.lotDetailsQaRemarks,
    form.totalQtySentForPremix,
  ].some((v) => str(v));
};

export const isNonoxDUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "nonoxD";
