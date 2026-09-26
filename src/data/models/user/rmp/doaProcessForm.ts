import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** DOA — lot details replace mfg lot nos / quantity; dispatch + total qty for premix. */
export type DoaProcessForm = {
  uiKey: "doa";
  lotDetails: LotDetailFormRow[];
  dispatchDatetime: string;
  observation: string;
  totalQtySentForPremix: string;
};

export const createEmptyDoaProcessForm = (): DoaProcessForm => ({
  uiKey: "doa",
  lotDetails: [createEmptyLotDetailRow()],
  dispatchDatetime: "",
  observation: "",
  totalQtySentForPremix: "",
});

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const doaFormHasUserData = (form: DoaProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  return [form.dispatchDatetime, form.observation, form.totalQtySentForPremix].some((v) =>
    str(v),
  );
};

export const isDoaUiKey = (uiKey: RmpMaterialUiKey): boolean => uiKey === "doa";
