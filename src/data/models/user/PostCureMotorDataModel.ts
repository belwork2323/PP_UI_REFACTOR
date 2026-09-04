import {
  asArray,
  asRecord,
  pickField,
  str,
  toApiDate,
  toApiDateTime,
  toApiNumber,
  toUiDate,
  toUiDateTime,
} from "./castingCuringFieldCodec";
import {
  isFileUploadIncomplete,
  parseFileRefs,
  toFileIdListPayload,
  type FileIdPayload,
  type FileRef,
} from "../common/FileUploadModel";

type LegacySectionSubmission = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export type PostCureDataVariant =
  "loose-flap-filling" | "inhibition-ir1" | "inhibition-hemcoat-3k" | "inhibition-not-applicable";

export type LocationDateRow = {
  location: string;
  fromDate: string;
  toDate: string;
  observations: string;
};

export type LocationQtyRow = {
  location: string;
  fromDate: string;
  toDate: string;
  qtyFilled: string;
  observations: string;
};

export type LocationAppliedRow = {
  location: string;
  fromDate: string;
  toDate: string;
  qtyApplied: string;
  observations: string;
};

export type IngredientQuantityRow = {
  srNo: string | number;
  ingredient: string;
  mfgLot: string;
  partsByWeight: string;
  quantity: string;
};

export type IngredientTakenRow = {
  srNo: string | number;
  ingredient: string;
  mfgLot: string;
  partsByWeight: string;
  qtyTaken: string;
};

export type QualificationRow = {
  srNo: number;
  parameter: string;
  specification: string;
  result: string;
};

export type LooseFlapMotorData = {
  variant: "loose-flap-filling";
  bellowRemovalDetails: { bellowRemovalTable: LocationDateRow[] };
  looseFlapEpoxyPreparation: {
    epoxyBatchNo: string;
    epoxyPreparationDate: string;
    preparationDetails: IngredientQuantityRow[];
  };
  qualificationDetails: {
    qualificationBatchNo: string;
    qualificationPreparationDate: string;
    qualificationTable: QualificationRow[];
    qualificationQcReport: FileRef[];
  };
  lfEpoxyFillingDetails: { lfFillingTable: LocationQtyRow[] };
};

export type InhibitionIr1MotorData = {
  variant: "inhibition-ir1";
  ir1Premix: {
    ir1PremixBatchNo: string;
    ir1PremixDate: string;
    ir1PremixTable: IngredientTakenRow[];
  };
  ir1FinalMix: {
    ir1FinalMixBatchNo: string;
    ir1FinalMixDate: string;
    ir1FinalMixTable: IngredientTakenRow[];
  };
  ir1Qualification: {
    qualificationBatchNo: string;
    qualificationPreparationDate: string;
    qualificationTable: QualificationRow[];
    qualificationQcReport: FileRef[];
  };
  inhibitionBatchDetails: {
    inhibitorBatchNo: string;
    inhibitorBatchSize: string;
  };
  inhibitionApplicationDetails: {
    inhibitionApplicationTable: LocationAppliedRow[];
  };
  dispatchDetails: {
    dispatchDate: string;
    dispatchStation: string;
  };
};

export type InhibitionHemcoatMotorData = {
  variant: "inhibition-hemcoat-3k";
  hemcoat3kPreparation: {
    hemcoatPremixBatchNo: string;
    hemcoatPremixDate: string;
    premixPreparationTable: IngredientTakenRow[];
  };
  hemcoat3kFinalMix: {
    hemcoatFinalMixBatchNo: string;
    hemcoatFinalMixDate: string;
    finalMixTable: IngredientTakenRow[];
  };
  hemcoat3kQualification: {
    qualificationBatchNo: string;
    qualificationPreparationDate: string;
    qualificationTable: QualificationRow[];
    qualificationQcReport: FileRef[];
  };
  inhibitionBatchDetails: {
    inhibitorBatchNo: string;
    inhibitorBatchSize: string;
  };
  inhibitionApplicationDetails: {
    inhibitionApplicationTable: LocationAppliedRow[];
  };
  dispatchDetails: {
    dispatchDate: string;
    dispatchStation: string;
  };
};

export type InhibitionNotApplicableMotorData = {
  variant: "inhibition-not-applicable";
  inhibitionNotApplicable: { remarks: string };
};

export type PostCureMotorData =
  | LooseFlapMotorData
  | InhibitionIr1MotorData
  | InhibitionHemcoatMotorData
  | InhibitionNotApplicableMotorData;

const locationDateRow = (location: string): LocationDateRow => ({
  location,
  fromDate: "",
  toDate: "",
  observations: "",
});

const locationQtyRow = (location: string): LocationQtyRow => ({
  location,
  fromDate: "",
  toDate: "",
  qtyFilled: "",
  observations: "",
});

const locationAppliedRow = (location: string): LocationAppliedRow => ({
  location,
  fromDate: "",
  toDate: "",
  qtyApplied: "",
  observations: "",
});
const lfIngredientRows = (): IngredientQuantityRow[] => [
  { srNo: 1, ingredient: "A-125 Hardener", mfgLot: "", partsByWeight: "60 ±1", quantity: "" },
  { srNo: 2, ingredient: "GX-257 Resin", mfgLot: "", partsByWeight: "40 ±1", quantity: "" },
  { srNo: 3, ingredient: "HY-960 Accelerator", mfgLot: "", partsByWeight: "6 ±0.5", quantity: "" },
  { srNo: 4, ingredient: "DY-026 Diluent", mfgLot: "", partsByWeight: "10 ±0.5", quantity: "" },
  { srNo: "TOTAL", ingredient: "Total Quantity", mfgLot: "", partsByWeight: "", quantity: "" },
];

const ir1PremixRows = (): IngredientTakenRow[] => [
  { srNo: 1, ingredient: "Castor Oil", mfgLot: "", partsByWeight: "60.0±1.0", qtyTaken: "" },
  { srNo: 2, ingredient: "Asbestos Powder", mfgLot: "", partsByWeight: "38.5±1.0", qtyTaken: "" },
  { srNo: 3, ingredient: "Nonox-D", mfgLot: "", partsByWeight: "1.0±0.1", qtyTaken: "" },
  { srNo: 4, ingredient: "Ferric Oxide", mfgLot: "", partsByWeight: "0.5±0.05", qtyTaken: "" },
  { srNo: "TOTAL", ingredient: "Total Quantity", mfgLot: "", partsByWeight: "", qtyTaken: "" },
];

const ir1FinalMixRows = (): IngredientTakenRow[] => [
  { srNo: 1, ingredient: "IR-1 Premix", mfgLot: "", partsByWeight: "100", qtyTaken: "" },
  { srNo: 2, ingredient: "TDI", mfgLot: "", partsByWeight: "14.5", qtyTaken: "" },
  {
    srNo: 3,
    ingredient: "Catalyst (5% w/w FeAA in benzene)",
    mfgLot: "",
    partsByWeight: "2 ml",
    qtyTaken: "",
  },
  { srNo: "TOTAL", ingredient: "Total Quantity", mfgLot: "", partsByWeight: "", qtyTaken: "" },
];

const hemcoatPremixRows = (): IngredientTakenRow[] => [
  { srNo: 1, ingredient: "HTPB", mfgLot: "", partsByWeight: "80.00", qtyTaken: "" },
  { srNo: 2, ingredient: "NBD", mfgLot: "", partsByWeight: "2.80", qtyTaken: "" },
  { srNo: 3, ingredient: "HT", mfgLot: "", partsByWeight: "2.15", qtyTaken: "" },
  { srNo: 4, ingredient: "Kaolin", mfgLot: "", partsByWeight: "15.00", qtyTaken: "" },
  { srNo: 5, ingredient: "Nonox-D", mfgLot: "", partsByWeight: "0.05", qtyTaken: "" },
  { srNo: "TOTAL", ingredient: "Total Quantity", mfgLot: "", partsByWeight: "", qtyTaken: "" },
];

const hemcoatFinalMixRows = (): IngredientTakenRow[] => [
  { srNo: 1, ingredient: "Hemcoat-3K Premix", mfgLot: "", partsByWeight: "98", qtyTaken: "" },
  { srNo: 2, ingredient: "H12MDI", mfgLot: "", partsByWeight: "2.3", qtyTaken: "" },
  {
    srNo: 3,
    ingredient: "Catalyst (2.5% w/w FeAA in HTPB)",
    mfgLot: "",
    partsByWeight: "2 ml",
    qtyTaken: "",
  },
  { srNo: "TOTAL", ingredient: "Total Quantity", mfgLot: "", partsByWeight: "", qtyTaken: "" },
];
const qualificationRows = (
  specs: Array<{ parameter: string; specification: string }>,
): QualificationRow[] =>
  specs.map((row, index) => ({
    srNo: index + 1,
    parameter: row.parameter,
    specification: row.specification,
    result: "",
  }));

export const createEmptyPostCureMotorData = (variant: PostCureDataVariant): PostCureMotorData => {
  switch (variant) {
    case "loose-flap-filling":
      return {
        variant,
        bellowRemovalDetails: {
          bellowRemovalTable: [locationDateRow("HE_SIDE"), locationDateRow("NE_SIDE")],
        },
        looseFlapEpoxyPreparation: {
          epoxyBatchNo: "",
          epoxyPreparationDate: "",
          preparationDetails: lfIngredientRows(),
        },
        qualificationDetails: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            { parameter: "Tensile Strength", specification: ">=40 KSC" },
            { parameter: "% Elongation", specification: ">=25" },
          ]),
          qualificationQcReport: [],
        },
        lfEpoxyFillingDetails: {
          lfFillingTable: [locationQtyRow("HE_SIDE"), locationQtyRow("NE_SIDE")],
        },
      };
    case "inhibition-ir1":
      return {
        variant,
        ir1Premix: {
          ir1PremixBatchNo: "",
          ir1PremixDate: "",
          ir1PremixTable: ir1PremixRows(),
        },
        ir1FinalMix: {
          ir1FinalMixBatchNo: "",
          ir1FinalMixDate: "",
          ir1FinalMixTable: ir1FinalMixRows(),
        },
        ir1Qualification: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            { parameter: "Tensile Strength", specification: ">=8 KSC" },
            { parameter: "% Elongation", specification: ">=30" },
          ]),
          qualificationQcReport: [],
        },
        inhibitionBatchDetails: { inhibitorBatchNo: "", inhibitorBatchSize: "" },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        dispatchDetails: { dispatchDate: "", dispatchStation: "" },
      };
    case "inhibition-hemcoat-3k":
      return {
        variant,
        hemcoat3kPreparation: {
          hemcoatPremixBatchNo: "",
          hemcoatPremixDate: "",
          premixPreparationTable: hemcoatPremixRows(),
        },
        hemcoat3kFinalMix: {
          hemcoatFinalMixBatchNo: "",
          hemcoatFinalMixDate: "",
          finalMixTable: hemcoatFinalMixRows(),
        },
        hemcoat3kQualification: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            { parameter: "Tensile Strength", specification: "≥25 KSC" },
            { parameter: "% Elongation", specification: "≥100" },
          ]),
          qualificationQcReport: [],
        },
        inhibitionBatchDetails: { inhibitorBatchNo: "", inhibitorBatchSize: "" },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        dispatchDetails: { dispatchDate: "", dispatchStation: "" },
      };
    case "inhibition-not-applicable":
      return {
        variant: "inhibition-not-applicable",
        inhibitionNotApplicable: { remarks: "" },
      };
    default:
      return createEmptyPostCureMotorData("loose-flap-filling");
  }
};

const sectionDataRow = (sections: LegacySectionSubmission[] | undefined, sectionId: string) => {
  const section = (sections ?? []).find((entry) => entry.sectionId === sectionId);
  const row = asArray(section?.sectionData)[0];
  return asRecord(row) ?? {};
};

const parseLocationDateRows = (rows: unknown): LocationDateRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      location: str(pickField(rec, "LOCATION", "location")),
      fromDate: toUiDate(pickField(rec, "FROM_DATE", "fromDate")),
      toDate: toUiDate(pickField(rec, "TO_DATE", "toDate")),
      observations: str(pickField(rec, "OBSERVATIONS", "observations")),
    };
  });

const parseLocationQtyRows = (rows: unknown): LocationQtyRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      location: str(pickField(rec, "LOCATION", "location")),
      fromDate: toUiDate(pickField(rec, "FROM_DATE", "fromDate")),
      toDate: toUiDate(pickField(rec, "TO_DATE", "toDate")),
      qtyFilled: str(pickField(rec, "QTY_FILLED", "qtyFilled", "quantityFilled")),
      observations: str(pickField(rec, "OBSERVATIONS", "observations")),
    };
  });

const parseLocationAppliedRows = (rows: unknown): LocationAppliedRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      location: str(pickField(rec, "LOCATION", "location")),
      fromDate: toUiDate(pickField(rec, "FROM_DATE", "fromDate")),
      toDate: toUiDate(pickField(rec, "TO_DATE", "toDate")),
      qtyApplied: str(pickField(rec, "QTY_APPLIED", "qtyApplied", "quantityApplied")),
      observations: str(pickField(rec, "OBSERVATIONS", "observations")),
    };
  });

export const POST_CURE_INGREDIENT_TOTAL_SR_LABEL = "Total Quanity";

const findSavedIngredientRow = (
  savedRows: unknown[],
  presetRow: { srNo: string | number; ingredient: string },
  index: number,
): Record<string, unknown> => {
  if (isIngredientTotalRow(presetRow.srNo, presetRow.ingredient)) {
    const totalSaved = savedRows.find((entry) => {
      const rec = asRecord(entry);
      if (!rec) return false;
      const sr = str(pickField(rec, "srNo", "rowKey", "SR_NO"));
      const ing = str(pickField(rec, "INGREDIENT", "ingredient"));
      return isIngredientTotalRow(sr, ing);
    });
    return asRecord(totalSaved) ?? asRecord(savedRows[savedRows.length - 1]) ?? {};
  }

  const savedRow = savedRows.find((entry) => {
    const rec = asRecord(entry);
    if (!rec) return false;
    const key = str(pickField(rec, "srNo", "rowKey", "SR_NO")).trim();
    const presetKey = str(presetRow.srNo).trim();
    return key && presetKey && key.toUpperCase() === presetKey.toUpperCase();
  });
  return asRecord(savedRow) ?? asRecord(savedRows[index]) ?? {};
};

const mergeIngredientQuantityRows = (
  preset: IngredientQuantityRow[],
  saved: unknown,
): IngredientQuantityRow[] => {
  const savedRows = asArray(saved);
  return preset.map((presetRow, index) => {
    const savedRow =
      asRecord(
        savedRows.find((entry) => {
          const rec = asRecord(entry);
          if (!rec) return false;
          const key = str(pickField(rec, "srNo", "rowKey", "SR_NO")).trim();
          const presetKey = str(presetRow.srNo).trim();
          return key && presetKey && key.toUpperCase() === presetKey.toUpperCase();
        }),
      ) ??
      asRecord(savedRows[index]) ??
      {};

    const resolvedMfgLot =
      str(pickField(savedRow, "MFG_LOT", "mfgLot", "Mfg Lot")) || presetRow.mfgLot;
    const resolvedQuantity =
      str(pickField(savedRow, "QUANTITY", "quantity", "quantityTaken", "QTY_TAKEN")) ||
      presetRow.quantity ||
      "";

    return {
      ...presetRow,
      // keep legacy/api uppercase keys for other consumers
      MFG_LOT: resolvedMfgLot,
      QUANTITY: resolvedQuantity,
      // also set lowercase keys used by the UI components
      mfgLot: resolvedMfgLot,
      quantity: resolvedQuantity,
      qtyTaken: resolvedQuantity, // handles qtyTaken variant mapping seamlessly
    };
  });
};

const mergeIngredientTakenRows = (
  preset: IngredientTakenRow[],
  saved: unknown,
): IngredientTakenRow[] => {
  const savedRows = asArray(saved);
  return preset.map((presetRow, index) => {
    const savedRow = findSavedIngredientRow(savedRows, presetRow, index);
    return {
      ...presetRow,
      mfgLot: str(pickField(savedRow, "MFG_LOT", "mfgLot", "Mfg Lot")) || presetRow.mfgLot,
      qtyTaken:
        str(pickField(savedRow, "QTY_TAKEN", "qtyTaken", "quantityTaken")) || presetRow.qtyTaken,
    };
  });
};

const mergeQualificationRows = (preset: QualificationRow[], saved: unknown): QualificationRow[] => {
  const savedRows = asArray(saved);
  return preset.map((presetRow, index) => {
    const savedRow = asRecord(savedRows[index]) ?? {};
    return {
      ...presetRow,
      result: str(pickField(savedRow, "RESULT", "result")) || presetRow.result,
    };
  });
};

export const parsePostCureMotorDataFromSections = (
  sections: LegacySectionSubmission[] | undefined,
  variant: PostCureDataVariant,
): PostCureMotorData => {
  switch (variant) {
    case "loose-flap-filling": {
      const empty = createEmptyPostCureMotorData("loose-flap-filling") as LooseFlapMotorData;
      const bellow = sectionDataRow(sections, "BELLOW_REMOVAL_DETAILS");
      const prep = sectionDataRow(sections, "LOOSE_FLAP_EPOXY_PREPARATION");
      const qual = sectionDataRow(sections, "QUALIFICATION_DETAILS");
      const fill = sectionDataRow(sections, "LF_EPOXY_FILLING_DETAILS");
      const bellowRows = parseLocationDateRows(
        pickField(bellow, "BELLOW_REMOVAL_TABLE", "bellowRemovalTable"),
      );
      const fillRows = parseLocationQtyRows(pickField(fill, "LF_FILLING_TABLE", "lfFillingTable"));
      return {
        variant: "loose-flap-filling",
        bellowRemovalDetails: {
          bellowRemovalTable: bellowRows.length
            ? bellowRows
            : empty.bellowRemovalDetails.bellowRemovalTable,
        },
        looseFlapEpoxyPreparation: {
          epoxyBatchNo: str(
            pickField(prep, "EPOXY_BATCH_NO", "epoxyBatchNo", "LF_EPOXY_BATCH_NO", "batchNo"),
          ),
          epoxyPreparationDate: toUiDate(
            pickField(
              prep,
              "EPOXY_PREPARATION_DATE",
              "epoxyPreparationDate",
              "LF_EPOXY_PREPARATION_DATE",
              "preparationDate",
            ),
          ),
          preparationDetails: mergeIngredientQuantityRows(
            empty.looseFlapEpoxyPreparation.preparationDetails,
            pickField(prep, "PREPARATION_DETAILS", "preparationDetails", "parameters"),
          ),
        },
        qualificationDetails: {
          qualificationBatchNo: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          qualificationPreparationDate: toUiDate(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          qualificationTable: mergeQualificationRows(
            empty.qualificationDetails.qualificationTable,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          qualificationQcReport: parseFileRefs(
            pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport"),
          ),
        },
        lfEpoxyFillingDetails: {
          lfFillingTable: fillRows.length ? fillRows : empty.lfEpoxyFillingDetails.lfFillingTable,
        },
      };
    }
    case "inhibition-ir1": {
      const empty = createEmptyPostCureMotorData("inhibition-ir1") as InhibitionIr1MotorData;
      const premix = sectionDataRow(sections, "IR1_PREMIX");
      const finalMix = sectionDataRow(sections, "IR1_FINAL_MIX");
      const qual = sectionDataRow(sections, "IR1_QUALIFICATION");
      const batch = sectionDataRow(sections, "INHIBITION_BATCH_DETAILS");
      const app = sectionDataRow(sections, "INHIBITION_APPLICATION_DETAILS");
      const dispatch = sectionDataRow(sections, "DISPATCH_DETAILS");
      const appRows = parseLocationAppliedRows(
        pickField(app, "INHIBITION_APPLICATION_TABLE", "inhibitionApplicationTable"),
      );
      return {
        variant: "inhibition-ir1",
        ir1Premix: {
          ir1PremixBatchNo: str(pickField(premix, "IR1_PREMIX_BATCH_NO", "ir1PremixBatchNo")),
          ir1PremixDate: toUiDate(pickField(premix, "IR1_PREMIX_DATE", "ir1PremixDate")),
          ir1PremixTable: mergeIngredientTakenRows(
            empty.ir1Premix.ir1PremixTable,
            pickField(premix, "IR1_PREMIX_TABLE", "ir1PremixTable"),
          ),
        },
        ir1FinalMix: {
          ir1FinalMixBatchNo: str(
            pickField(finalMix, "IR1_FINAL_MIX_BATCH_NO", "ir1FinalMixBatchNo"),
          ),
          ir1FinalMixDate: toUiDate(pickField(finalMix, "IR1_FINAL_MIX_DATE", "ir1FinalMixDate")),
          ir1FinalMixTable: mergeIngredientTakenRows(
            empty.ir1FinalMix.ir1FinalMixTable,
            pickField(finalMix, "IR1_FINAL_MIX_TABLE", "ir1FinalMixTable"),
          ),
        },
        ir1Qualification: {
          qualificationBatchNo: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          qualificationPreparationDate: toUiDate(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          qualificationTable: mergeQualificationRows(
            empty.ir1Qualification.qualificationTable,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          qualificationQcReport: parseFileRefs(
            pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport"),
          ),
        },
        inhibitionBatchDetails: {
          inhibitorBatchNo: str(pickField(batch, "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
          inhibitorBatchSize: str(pickField(batch, "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize")),
        },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: appRows.length
            ? appRows
            : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
        },
        dispatchDetails: {
          dispatchDate: toUiDate(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          dispatchStation: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
        },
      };
    }
    case "inhibition-hemcoat-3k": {
      const empty = createEmptyPostCureMotorData(
        "inhibition-hemcoat-3k",
      ) as InhibitionHemcoatMotorData;
      const prep = sectionDataRow(sections, "HEMCOAT_3K_PREPARATION");
      const finalMix = sectionDataRow(sections, "HEMCOAT_3K_FINAL_MIX");
      const qual = sectionDataRow(sections, "HEMCOAT_3K_QUALIFICATION");
      const batch = sectionDataRow(sections, "INHIBITION_BATCH_DETAILS");
      const app = sectionDataRow(sections, "INHIBITION_APPLICATION_DETAILS");
      const dispatch = sectionDataRow(sections, "DISPATCH_DETAILS");
      const appRows = parseLocationAppliedRows(
        pickField(app, "INHIBITION_APPLICATION_TABLE", "inhibitionApplicationTable"),
      );
      return {
        variant: "inhibition-hemcoat-3k",
        hemcoat3kPreparation: {
          hemcoatPremixBatchNo: str(
            pickField(prep, "HEMCOAT_PREMIX_BATCH_NO", "hemcoatPremixBatchNo"),
          ),
          hemcoatPremixDate: toUiDate(pickField(prep, "HEMCOAT_PREMIX_DATE", "hemcoatPremixDate")),
          premixPreparationTable: mergeIngredientTakenRows(
            empty.hemcoat3kPreparation.premixPreparationTable,
            pickField(prep, "PREMIX_PREPARATION_TABLE", "premixPreparationTable"),
          ),
        },
        hemcoat3kFinalMix: {
          hemcoatFinalMixBatchNo: str(
            pickField(finalMix, "HEMCOAT_FINAL_MIX_BATCH_NO", "hemcoatFinalMixBatchNo"),
          ),
          hemcoatFinalMixDate: toUiDate(
            pickField(finalMix, "HEMCOAT_FINAL_MIX_DATE", "hemcoatFinalMixDate"),
          ),
          finalMixTable: mergeIngredientTakenRows(
            empty.hemcoat3kFinalMix.finalMixTable,
            pickField(finalMix, "FINAL_MIX_TABLE", "finalMixTable"),
          ),
        },
        hemcoat3kQualification: {
          qualificationBatchNo: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          qualificationPreparationDate: toUiDate(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          qualificationTable: mergeQualificationRows(
            empty.hemcoat3kQualification.qualificationTable,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          qualificationQcReport: parseFileRefs(
            pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport"),
          ),
        },
        inhibitionBatchDetails: {
          inhibitorBatchNo: str(pickField(batch, "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
          inhibitorBatchSize: str(pickField(batch, "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize")),
        },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: appRows.length
            ? appRows
            : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
        },
        dispatchDetails: {
          dispatchDate: toUiDate(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          dispatchStation: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
        },
      };
    }
    case "inhibition-not-applicable": {
      const na = sectionDataRow(sections, "INHIBITION_NOT_APPLICABLE");
      return {
        variant: "inhibition-not-applicable",
        inhibitionNotApplicable: {
          remarks: str(pickField(na, "REMARKS", "remarks")),
        },
      };
    }
    default:
      return createEmptyPostCureMotorData("loose-flap-filling");
  }
};

const payloadLocationDateRows = (rows: LocationDateRow[]) =>
  rows.map((row) => ({
    LOCATION: row.location,
    FROM_DATE: (toApiDate(row.fromDate) ?? row.fromDate.trim()) || undefined,
    TO_DATE: (toApiDate(row.toDate) ?? row.toDate.trim()) || undefined,
    OBSERVATIONS: row.observations.trim() || undefined,
  }));

const payloadLocationQtyRows = (rows: LocationQtyRow[]) =>
  rows.map((row) => ({
    LOCATION: row.location,
    FROM_DATE: (toApiDate(row.fromDate) ?? row.fromDate.trim()) || undefined,
    TO_DATE: (toApiDate(row.toDate) ?? row.toDate.trim()) || undefined,
    QTY_FILLED: toApiNumber(row.qtyFilled),
    OBSERVATIONS: row.observations.trim() || undefined,
  }));

const payloadLocationAppliedRows = (rows: LocationAppliedRow[]) =>
  rows.map((row) => ({
    LOCATION: row.location,
    FROM_DATE: (toApiDate(row.fromDate) ?? row.fromDate.trim()) || undefined,
    TO_DATE: (toApiDate(row.toDate) ?? row.toDate.trim()) || undefined,
    QTY_APPLIED: toApiNumber(row.qtyApplied),
    OBSERVATIONS: row.observations.trim() || undefined,
  }));

const payloadIngredientQuantityRows = (rows: IngredientQuantityRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    INGREDIENT: row.ingredient,
    MFG_LOT: row.mfgLot.trim() || undefined,
    PARTS_BY_WEIGHT: row.partsByWeight,
    QUANTITY: toApiNumber(row.quantity),
  }));

const payloadIngredientTakenRows = (rows: IngredientTakenRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    INGREDIENT: row.ingredient,
    MFG_LOT: row.mfgLot.trim() || undefined,
    PARTS_BY_WEIGHT: row.partsByWeight,
    QTY_TAKEN: toApiNumber(row.qtyTaken),
  }));

const payloadQualificationRows = (rows: QualificationRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    PARAMETER: row.parameter,
    SPECIFICATION: row.specification,
    RESULT: row.result.trim() || undefined,
  }));

const makeSection = (
  sectionId: string,
  sectionData: Record<string, unknown>,
): LegacySectionSubmission => ({
  sectionId,
  sectionData: [sectionData],
});

const apiDateOrUi = (value: string): string | undefined =>
  (toApiDate(value) ?? String(value).trim()) || undefined;

/** UI / API datetime → API `YYYY-MM-DDTHH:mm:ss` for motor receipt fields. */
export const formatPostCureMotorReceiptDateForApi = (value: unknown): string => {
  const raw = str(value).trim();
  if (!raw) return "";
  const dt = toApiDateTime(value);
  if (!dt) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) return `${dt}T00:00:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return `${dt}:00`;
  return dt.length === 16 ? `${dt}:00` : dt;
};

/** API datetime → UI `DD-MM-YYYY HH:mm` for motor receipt fields. */
export const formatPostCureMotorReceiptDateForUi = (value: unknown): string =>
  toUiDateTime(value) || str(value).trim();

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

export type LooseFlapFillingDetailsApi = {
  bellowRemovalDetails?: Array<{
    location?: string;
    fromDate?: string;
    toDate?: string;
    observations?: string;
  }>;
  epoxyPreparationIngredients?: {
    batchNo?: string;
    preparationDate?: string;
    parameters?: Array<{
      rowKey?: string | number;
      ingredient?: string;
      mfgLot?: string;
      partsByWeight?: string;
      quantityTaken?: number;
    }>;
  };
  qualificationDetails?: {
    batchNo?: string;
    preparationDate?: string;
    parameters?: Array<{
      srNo?: number;
      parameter?: string;
      specification?: string;
      result?: string;
    }>;
    qcReport?: FileIdPayload[] | string;
  };
  fillingDetails?: Array<{
    location?: string;
    fromDate?: string;
    toDate?: string;
    quantityFilled?: number;
    observations?: string;
  }>;
};

export type InhibitionDetailsApi = {
  premixDetails?: {
    batchNo?: string;
    preparationDate?: string;
    ingredients?: Array<{
      rowKey?: string | number;
      ingredient?: string;
      mfgLot?: string;
      partsByWeight?: string;
      quantityTaken?: number;
    }>;
  };
  finalMixDetails?: {
    batchNo?: string;
    preparationDate?: string;
    ingredients?: Array<{
      rowKey?: string | number;
      ingredient?: string;
      mfgLot?: string;
      partsByWeight?: string;
      quantityTaken?: number;
    }>;
  };
  qualificationDetails?: {
    batchNo?: string;
    preparationDate?: string;
    parameters?: Array<{
      srNo?: number;
      parameter?: string;
      specification?: string;
      result?: string;
    }>;
    qcReport?: FileIdPayload[] | string;
  };
  inhibitorBatchDetails?: {
    batchNo?: string;
    batchSize?: number;
  };
  applicationDetails?: Array<{
    location?: string;
    fromDate?: string;
    toDate?: string;
    quantityApplied?: number;
    observations?: string;
  }>;
  dispatchDetails?: {
    dispatchDate?: string;
    dispatchStation?: string;
  };
  notApplicableRemarks?: string;
};

export type PostCureMotorDetailsPayload = {
  looseFlapFillingDetails?: LooseFlapFillingDetailsApi;
  inhibitionDetails?: InhibitionDetailsApi;
};

const mapLocationDateRowsForApi = (rows: LocationDateRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.location || undefined,
      fromDate: apiDateOrUi(row.fromDate),
      toDate: apiDateOrUi(row.toDate),
      observations: row.observations.trim() || undefined,
    }),
  );

const mapLocationQtyRowsForApi = (rows: LocationQtyRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.location || undefined,
      fromDate: apiDateOrUi(row.fromDate),
      toDate: apiDateOrUi(row.toDate),
      quantityFilled: toApiNumber(row.qtyFilled),
      observations: row.observations.trim() || undefined,
    }),
  );

const mapLocationAppliedRowsForApi = (rows: LocationAppliedRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.location || undefined,
      fromDate: apiDateOrUi(row.fromDate),
      toDate: apiDateOrUi(row.toDate),
      quantityApplied: toApiNumber(row.qtyApplied),
      observations: row.observations.trim() || undefined,
    }),
  );

const ingredientRowKey = (srNo: string | number | undefined, index: number): string =>
  String(srNo ?? index + 1);

const isIngredientTotalRow = (srNo: string | number | undefined, ingredient: string): boolean =>
  String(srNo ?? "")
    .trim()
    .toUpperCase() === "TOTAL" ||
  String(ingredient ?? "")
    .trim()
    .toLowerCase() === "total quantity";

const mapIngredientQuantityRowsForApi = (rows: IngredientQuantityRow[]) =>
  rows.map((row, index) => {
    const isTotal = isIngredientTotalRow(row.srNo, row.ingredient);
    const base = {
      rowKey: ingredientRowKey(row.srNo, index),
      ingredient: row.ingredient,
      quantityTaken: toApiNumber(row.quantity),
    };
    if (isTotal) {
      return omitEmpty(base);
    }
    return omitEmpty({
      ...base,
      mfgLot: row.mfgLot.trim() || undefined,
      partsByWeight: row.partsByWeight,
    });
  });

const mapIngredientTakenRowsForApi = (rows: IngredientTakenRow[]) =>
  rows.map((row, index) => {
    const isTotal = isIngredientTotalRow(row.srNo, row.ingredient);
    const base = {
      rowKey: ingredientRowKey(row.srNo, index),
      ingredient: row.ingredient,
      quantityTaken: toApiNumber(row.qtyTaken),
    };
    if (isTotal) {
      return omitEmpty(base);
    }
    return omitEmpty({
      ...base,
      mfgLot: row.mfgLot.trim() || undefined,
      partsByWeight: row.partsByWeight,
    });
  });

const mapQualificationParamsForApi = (rows: QualificationRow[]) =>
  rows.map((row) =>
    omitEmpty({
      srNo: row.srNo,
      parameter: row.parameter,
      specification: row.specification,
      result: row.result.trim() || undefined,
    }),
  );

const buildLooseFlapFillingDetailsPayload = (
  data: LooseFlapMotorData,
): LooseFlapFillingDetailsApi => ({
  bellowRemovalDetails: mapLocationDateRowsForApi(data.bellowRemovalDetails.bellowRemovalTable),
  epoxyPreparationIngredients: omitEmpty({
    batchNo: data.looseFlapEpoxyPreparation.epoxyBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.looseFlapEpoxyPreparation.epoxyPreparationDate),
    parameters: mapIngredientQuantityRowsForApi(data.looseFlapEpoxyPreparation.preparationDetails),
  }) as LooseFlapFillingDetailsApi["epoxyPreparationIngredients"],
  qualificationDetails: omitEmpty({
    batchNo: data.qualificationDetails.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.qualificationDetails.qualificationPreparationDate),
    parameters: mapQualificationParamsForApi(data.qualificationDetails.qualificationTable),
    qcReport: (() => {
      const files = toFileIdListPayload(data.qualificationDetails.qualificationQcReport);
      return files.length ? files : undefined;
    })(),
  }) as LooseFlapFillingDetailsApi["qualificationDetails"],
  fillingDetails: mapLocationQtyRowsForApi(data.lfEpoxyFillingDetails.lfFillingTable),
});

const buildInhibitionIr1DetailsPayload = (data: InhibitionIr1MotorData): InhibitionDetailsApi => ({
  premixDetails: omitEmpty({
    batchNo: data.ir1Premix.ir1PremixBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.ir1Premix.ir1PremixDate),
    ingredients: mapIngredientTakenRowsForApi(data.ir1Premix.ir1PremixTable),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.ir1FinalMix.ir1FinalMixBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.ir1FinalMix.ir1FinalMixDate),
    ingredients: mapIngredientTakenRowsForApi(data.ir1FinalMix.ir1FinalMixTable),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.ir1Qualification.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.ir1Qualification.qualificationPreparationDate),
    parameters: mapQualificationParamsForApi(data.ir1Qualification.qualificationTable),
    qcReport: (() => {
      const files = toFileIdListPayload(data.ir1Qualification.qualificationQcReport);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
    batchSize: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchSize),
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.inhibitionApplicationDetails.inhibitionApplicationTable,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateOrUi(data.dispatchDetails.dispatchDate),
    dispatchStation: data.dispatchDetails.dispatchStation.trim() || undefined,
  }) as InhibitionDetailsApi["dispatchDetails"],
});

const buildInhibitionHemcoatDetailsPayload = (
  data: InhibitionHemcoatMotorData,
): InhibitionDetailsApi => ({
  premixDetails: omitEmpty({
    batchNo: data.hemcoat3kPreparation.hemcoatPremixBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.hemcoat3kPreparation.hemcoatPremixDate),
    ingredients: mapIngredientTakenRowsForApi(data.hemcoat3kPreparation.premixPreparationTable),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.hemcoat3kFinalMix.hemcoatFinalMixBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.hemcoat3kFinalMix.hemcoatFinalMixDate),
    ingredients: mapIngredientTakenRowsForApi(data.hemcoat3kFinalMix.finalMixTable),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.hemcoat3kQualification.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateOrUi(data.hemcoat3kQualification.qualificationPreparationDate),
    parameters: mapQualificationParamsForApi(data.hemcoat3kQualification.qualificationTable),
    qcReport: (() => {
      const files = toFileIdListPayload(data.hemcoat3kQualification.qualificationQcReport);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
    batchSize: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchNo),
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.inhibitionApplicationDetails.inhibitionApplicationTable,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateOrUi(data.dispatchDetails.dispatchDate),
    dispatchStation: data.dispatchDetails.dispatchStation.trim() || undefined,
  }) as InhibitionDetailsApi["dispatchDetails"],
});

export const buildPostCureMotorDetailsPayload = (
  data: PostCureMotorData,
): PostCureMotorDetailsPayload => {
  switch (data.variant) {
    case "loose-flap-filling":
      return { looseFlapFillingDetails: buildLooseFlapFillingDetailsPayload(data) };
    case "inhibition-ir1":
      return { inhibitionDetails: buildInhibitionIr1DetailsPayload(data) };
    case "inhibition-hemcoat-3k":
      return { inhibitionDetails: buildInhibitionHemcoatDetailsPayload(data) };
    case "inhibition-not-applicable":
      return {
        inhibitionDetails: {
          notApplicableRemarks: data.inhibitionNotApplicable.remarks.trim() || undefined,
        },
      };
    default:
      return {};
  }
};

const parseQualificationParamsFromApi = (
  preset: QualificationRow[],
  saved: unknown,
): QualificationRow[] => {
  const savedRows = asArray(saved);
  return preset.map((presetRow, index) => {
    const savedRow = asRecord(savedRows[index]) ?? {};
    return {
      ...presetRow,
      result: str(pickField(savedRow, "RESULT", "result")) || presetRow.result,
    };
  });
};

const parseLooseFlapFromApi = (details: Record<string, unknown>): LooseFlapMotorData => {
  const empty = createEmptyPostCureMotorData("loose-flap-filling") as LooseFlapMotorData;
  const epoxy = asRecord(details.epoxyPreparationIngredients) ?? {};
  const qual = asRecord(details.qualificationDetails) ?? {};
  const bellowRows = parseLocationDateRows(
    details.bellowRemovalDetails ?? details.bellowBondingDetails,
  );
  const fillRows = parseLocationQtyRows(details.fillingDetails);

  return {
    variant: "loose-flap-filling",
    bellowRemovalDetails: {
      bellowRemovalTable: bellowRows.length
        ? bellowRows
        : empty.bellowRemovalDetails.bellowRemovalTable,
    },
    looseFlapEpoxyPreparation: {
      epoxyBatchNo: str(pickField(epoxy, "batchNo", "EPOXY_BATCH_NO", "epoxyBatchNo")),
      epoxyPreparationDate: toUiDate(
        pickField(epoxy, "preparationDate", "EPOXY_PREPARATION_DATE", "epoxyPreparationDate"),
      ),
      preparationDetails: mergeIngredientQuantityRows(
        empty.looseFlapEpoxyPreparation.preparationDetails,
        epoxy.parameters ?? epoxy.ingredients,
      ),
    },
    qualificationDetails: {
      qualificationBatchNo: str(
        pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
      ),
      qualificationPreparationDate: toUiDate(
        pickField(
          qual,
          "preparationDate",
          "QUALIFICATION_PREPARATION_DATE",
          "qualificationPreparationDate",
        ),
      ),
      qualificationTable: parseQualificationParamsFromApi(
        empty.qualificationDetails.qualificationTable,
        qual.parameters ?? qual.qualification,
      ),
      qualificationQcReport: parseFileRefs(
        pickField(qual, "qcReport", "QUALIFICATION_QC_REPORT", "qualificationQcReport"),
      ),
    },
    lfEpoxyFillingDetails: {
      lfFillingTable: fillRows.length ? fillRows : empty.lfEpoxyFillingDetails.lfFillingTable,
    },
  };
};

const parseInhibitionFromApi = (
  details: Record<string, unknown>,
  variant: PostCureDataVariant,
): PostCureMotorData => {
  if (variant === "inhibition-not-applicable") {
    return {
      variant: "inhibition-not-applicable",
      inhibitionNotApplicable: {
        remarks: str(pickField(details, "notApplicableRemarks", "REMARKS", "remarks")),
      },
    };
  }

  const premix = asRecord(details.premixDetails) ?? {};
  const finalMix = asRecord(details.finalMixDetails) ?? {};
  const qual = asRecord(details.qualificationDetails) ?? {};
  const batch = asRecord(details.inhibitorBatchDetails) ?? {};
  const dispatch = asRecord(details.dispatchDetails) ?? {};
  const appRows = parseLocationAppliedRows(details.applicationDetails);

  if (variant === "inhibition-hemcoat-3k") {
    const empty = createEmptyPostCureMotorData(
      "inhibition-hemcoat-3k",
    ) as InhibitionHemcoatMotorData;
    return {
      variant: "inhibition-hemcoat-3k",
      hemcoat3kPreparation: {
        hemcoatPremixBatchNo: str(pickField(premix, "batchNo", "HEMCOAT_PREMIX_BATCH_NO")),
        hemcoatPremixDate: toUiDate(pickField(premix, "preparationDate", "HEMCOAT_PREMIX_DATE")),
        premixPreparationTable: mergeIngredientTakenRows(
          empty.hemcoat3kPreparation.premixPreparationTable,
          premix.ingredients ?? premix.parameters,
        ),
      },
      hemcoat3kFinalMix: {
        hemcoatFinalMixBatchNo: str(pickField(finalMix, "batchNo", "HEMCOAT_FINAL_MIX_BATCH_NO")),
        hemcoatFinalMixDate: toUiDate(
          pickField(finalMix, "preparationDate", "HEMCOAT_FINAL_MIX_DATE"),
        ),
        finalMixTable: mergeIngredientTakenRows(
          empty.hemcoat3kFinalMix.finalMixTable,
          finalMix.ingredients ?? finalMix.parameters,
        ),
      },
      hemcoat3kQualification: {
        qualificationBatchNo: str(pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO")),
        qualificationPreparationDate: toUiDate(
          pickField(qual, "preparationDate", "QUALIFICATION_PREPARATION_DATE"),
        ),
        qualificationTable: parseQualificationParamsFromApi(
          empty.hemcoat3kQualification.qualificationTable,
          qual.parameters ?? qual.qualification,
        ),
        qualificationQcReport: parseFileRefs(
          pickField(qual, "qcReport", "QUALIFICATION_QC_REPORT"),
        ),
      },
      inhibitionBatchDetails: {
        inhibitorBatchNo: str(
          pickField(batch, "batchNo", "INHIBITOR_BATCH_NO", "inhibitorBatchNo"),
        ),
        inhibitorBatchSize: str(
          pickField(batch, "batchSize", "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize"),
        ),
      },
      inhibitionApplicationDetails: {
        inhibitionApplicationTable: appRows.length
          ? appRows
          : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
      },
      dispatchDetails: {
        dispatchDate: toUiDate(pickField(dispatch, "dispatchDate", "DISPATCH_DATE")),
        dispatchStation: str(pickField(dispatch, "dispatchStation", "DISPATCH_STATION")),
      },
    };
  }

  const empty = createEmptyPostCureMotorData("inhibition-ir1") as InhibitionIr1MotorData;
  return {
    variant: "inhibition-ir1",
    ir1Premix: {
      ir1PremixBatchNo: str(
        pickField(premix, "batchNo", "IR1_PREMIX_BATCH_NO", "ir1PremixBatchNo"),
      ),
      ir1PremixDate: toUiDate(
        pickField(premix, "preparationDate", "IR1_PREMIX_DATE", "ir1PremixDate"),
      ),
      ir1PremixTable: mergeIngredientTakenRows(
        empty.ir1Premix.ir1PremixTable,
        premix.ingredients ?? premix.parameters,
      ),
    },
    ir1FinalMix: {
      ir1FinalMixBatchNo: str(
        pickField(finalMix, "batchNo", "IR1_FINAL_MIX_BATCH_NO", "ir1FinalMixBatchNo"),
      ),
      ir1FinalMixDate: toUiDate(
        pickField(finalMix, "preparationDate", "IR1_FINAL_MIX_DATE", "ir1FinalMixDate"),
      ),
      ir1FinalMixTable: mergeIngredientTakenRows(
        empty.ir1FinalMix.ir1FinalMixTable,
        finalMix.ingredients ?? finalMix.parameters,
      ),
    },
    ir1Qualification: {
      qualificationBatchNo: str(
        pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
      ),
      qualificationPreparationDate: toUiDate(
        pickField(
          qual,
          "preparationDate",
          "QUALIFICATION_PREPARATION_DATE",
          "qualificationPreparationDate",
        ),
      ),
      qualificationTable: parseQualificationParamsFromApi(
        empty.ir1Qualification.qualificationTable,
        qual.parameters ?? qual.qualification,
      ),
      qualificationQcReport: parseFileRefs(
        pickField(qual, "qcReport", "QUALIFICATION_QC_REPORT", "qualificationQcReport"),
      ),
    },
    inhibitionBatchDetails: {
      inhibitorBatchNo: str(pickField(batch, "batchNo", "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
      inhibitorBatchSize: str(
        pickField(batch, "batchSize", "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize"),
      ),
    },
    inhibitionApplicationDetails: {
      inhibitionApplicationTable: appRows.length
        ? appRows
        : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
    },
    dispatchDetails: {
      dispatchDate: toUiDate(pickField(dispatch, "dispatchDate", "DISPATCH_DATE")),
      dispatchStation: str(pickField(dispatch, "dispatchStation", "DISPATCH_STATION")),
    },
  };
};

export const parsePostCureMotorDataFromApi = (
  motor: Record<string, unknown> | null | undefined,
  variant: PostCureDataVariant,
): PostCureMotorData => {
  const looseFlap = asRecord(motor?.looseFlapFillingDetails);
  if (looseFlap && variant === "loose-flap-filling") {
    return parseLooseFlapFromApi(looseFlap);
  }

  const inhibition = asRecord(motor?.inhibitionDetails);
  if (inhibition && variant.startsWith("inhibition")) {
    return parseInhibitionFromApi(inhibition, variant);
  }

  const legacySections = Array.isArray(motor?.sections)
    ? (motor.sections as LegacySectionSubmission[])
    : undefined;
  if (legacySections?.length) {
    return parsePostCureMotorDataFromSections(legacySections, variant);
  }

  return createEmptyPostCureMotorData(variant);
};

/** Legacy section payload — used for read-only display conversion only. */
export const buildPostCureSectionsPayload = (
  data: PostCureMotorData,
): LegacySectionSubmission[] => {
  switch (data.variant) {
    case "loose-flap-filling":
      return [
        makeSection("BELLOW_REMOVAL_DETAILS", {
          bellowRemovalTable: payloadLocationDateRows(data.bellowRemovalDetails.bellowRemovalTable),
        }),
        makeSection("LOOSE_FLAP_EPOXY_PREPARATION", {
          EPOXY_BATCH_NO: data.looseFlapEpoxyPreparation.epoxyBatchNo.trim() || undefined,
          EPOXY_PREPARATION_DATE: apiDateOrUi(data.looseFlapEpoxyPreparation.epoxyPreparationDate),
          PREPARATION_DETAILS: payloadIngredientQuantityRows(
            data.looseFlapEpoxyPreparation.preparationDetails,
          ),
        }),
        makeSection("QUALIFICATION_DETAILS", {
          QUALIFICATION_BATCH_NO:
            data.qualificationDetails.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateOrUi(
            data.qualificationDetails.qualificationPreparationDate,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(
            data.qualificationDetails.qualificationTable,
          ),
          QUALIFICATION_QC_REPORT: (() => {
            const files = toFileIdListPayload(data.qualificationDetails.qualificationQcReport);
            return files.length ? files : undefined;
          })(),
        }),
        makeSection("LF_EPOXY_FILLING_DETAILS", {
          LF_FILLING_TABLE: payloadLocationQtyRows(data.lfEpoxyFillingDetails.lfFillingTable),
        }),
      ];
    case "inhibition-ir1":
      return [
        makeSection("IR1_PREMIX", {
          IR1_PREMIX_BATCH_NO: data.ir1Premix.ir1PremixBatchNo.trim() || undefined,
          IR1_PREMIX_DATE: apiDateOrUi(data.ir1Premix.ir1PremixDate),
          IR1_PREMIX_TABLE: payloadIngredientTakenRows(data.ir1Premix.ir1PremixTable),
        }),
        makeSection("IR1_FINAL_MIX", {
          IR1_FINAL_MIX_BATCH_NO: data.ir1FinalMix.ir1FinalMixBatchNo.trim() || undefined,
          IR1_FINAL_MIX_DATE: apiDateOrUi(data.ir1FinalMix.ir1FinalMixDate),
          IR1_FINAL_MIX_TABLE: payloadIngredientTakenRows(data.ir1FinalMix.ir1FinalMixTable),
        }),
        makeSection("IR1_QUALIFICATION", {
          QUALIFICATION_BATCH_NO: data.ir1Qualification.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateOrUi(
            data.ir1Qualification.qualificationPreparationDate,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(data.ir1Qualification.qualificationTable),
          QUALIFICATION_QC_REPORT: (() => {
            const files = toFileIdListPayload(data.ir1Qualification.qualificationQcReport);
            return files.length ? files : undefined;
          })(),
        }),
        makeSection("INHIBITION_BATCH_DETAILS", {
          INHIBITOR_BATCH_NO: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
          INHIBITOR_BATCH_SIZE: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchSize),
        }),
        makeSection("INHIBITION_APPLICATION_DETAILS", {
          INHIBITION_APPLICATION_TABLE: payloadLocationAppliedRows(
            data.inhibitionApplicationDetails.inhibitionApplicationTable,
          ),
        }),
        makeSection("DISPATCH_DETAILS", {
          DISPATCH_DATE: apiDateOrUi(data.dispatchDetails.dispatchDate),
          DISPATCH_STATION: data.dispatchDetails.dispatchStation.trim() || undefined,
        }),
      ];
    case "inhibition-hemcoat-3k":
      return [
        makeSection("HEMCOAT_3K_PREPARATION", {
          HEMCOAT_PREMIX_BATCH_NO:
            data.hemcoat3kPreparation.hemcoatPremixBatchNo.trim() || undefined,
          HEMCOAT_PREMIX_DATE: apiDateOrUi(data.hemcoat3kPreparation.hemcoatPremixDate),
          PREMIX_PREPARATION_TABLE: payloadIngredientTakenRows(
            data.hemcoat3kPreparation.premixPreparationTable,
          ),
        }),
        makeSection("HEMCOAT_3K_FINAL_MIX", {
          HEMCOAT_FINAL_MIX_BATCH_NO:
            data.hemcoat3kFinalMix.hemcoatFinalMixBatchNo.trim() || undefined,
          HEMCOAT_FINAL_MIX_DATE: apiDateOrUi(data.hemcoat3kFinalMix.hemcoatFinalMixDate),
          FINAL_MIX_TABLE: payloadIngredientTakenRows(data.hemcoat3kFinalMix.finalMixTable),
        }),
        makeSection("HEMCOAT_3K_QUALIFICATION", {
          QUALIFICATION_BATCH_NO:
            data.hemcoat3kQualification.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateOrUi(
            data.hemcoat3kQualification.qualificationPreparationDate,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(
            data.hemcoat3kQualification.qualificationTable,
          ),
          QUALIFICATION_QC_REPORT: (() => {
            const files = toFileIdListPayload(data.hemcoat3kQualification.qualificationQcReport);
            return files.length ? files : undefined;
          })(),
        }),
        makeSection("INHIBITION_BATCH_DETAILS", {
          INHIBITOR_BATCH_NO: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
          INHIBITOR_BATCH_SIZE: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchSize),
        }),
        makeSection("INHIBITION_APPLICATION_DETAILS", {
          INHIBITION_APPLICATION_TABLE: payloadLocationAppliedRows(
            data.inhibitionApplicationDetails.inhibitionApplicationTable,
          ),
        }),
        makeSection("DISPATCH_DETAILS", {
          DISPATCH_DATE: apiDateOrUi(data.dispatchDetails.dispatchDate),
          DISPATCH_STATION: data.dispatchDetails.dispatchStation.trim() || undefined,
        }),
      ];
    case "inhibition-not-applicable":
      return [
        makeSection("INHIBITION_NOT_APPLICABLE", {
          REMARKS: data.inhibitionNotApplicable.remarks.trim() || undefined,
        }),
      ];
    default:
      return [];
  }
};

export const collectPostCureFileRefsFromMotorData = (
  data: PostCureMotorData | null | undefined,
): FileRef[] => {
  if (!data) return [];
  if (data.variant === "loose-flap-filling") {
    return data.qualificationDetails?.qualificationQcReport ?? [];
  }
  if (data.variant === "inhibition-ir1") {
    return data.ir1Qualification?.qualificationQcReport ?? [];
  }
  if (data.variant === "inhibition-hemcoat-3k") {
    return data.hemcoat3kQualification?.qualificationQcReport ?? [];
  }
  return [];
};

export const collectPostCureFileRefsFromForm = (form: {
  motors?: Array<{ postCureData?: PostCureMotorData | null }>;
}): FileRef[] => {
  const refs: FileRef[] = [];
  for (const motor of form?.motors ?? []) {
    refs.push(...collectPostCureFileRefsFromMotorData(motor?.postCureData));
  }
  return refs;
};

export const hasIncompletePostCureUploads = (form: {
  motors?: Array<{ postCureData?: PostCureMotorData | null }>;
}): boolean => collectPostCureFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromPostCureForm = (form: {
  motors?: Array<{ postCureData?: PostCureMotorData | null }>;
}): string[] => [
  ...new Set(
    collectPostCureFileRefsFromForm(form)
      .filter((ref) => ref.isTemp !== false)
      .map((ref) => String(ref.fileId ?? "").trim())
      .filter(Boolean),
  ),
];

const META_KEYS = new Set(["type", "label", "readonly", "srNo", "SR_NO", "_readonly", "_rowType"]);

const hasUserContent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (Array.isArray(value)) return value.some((item) => hasUserContent(item));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, entry]) => {
      if (key.startsWith("_") || META_KEYS.has(key) || key.endsWith("__fieldType")) return false;
      return hasUserContent(entry);
    });
  }
  return false;
};

export const postCureMotorDataHasUserInput = (
  data: PostCureMotorData | null | undefined,
): boolean => Boolean(data && hasUserContent(data));

export const resolvePostCureDataVariant = (
  operation: string,
  inhibitorType: string,
): PostCureDataVariant | null => {
  const op = String(operation ?? "")
    .trim()
    .toLowerCase();
  if (op === "loose-flap-filling") return "loose-flap-filling";
  if (op !== "inhibition") return null;
  const inhibitor = String(inhibitorType ?? "").trim();
  const upper = inhibitor.toUpperCase().replace(/[-\s]/g, "_");
  if (inhibitor === "IR1" || upper === "IR1") return "inhibition-ir1";
  if (inhibitor === "Hemcoat-3K" || upper === "HEMCOAT_3K") return "inhibition-hemcoat-3k";
  if (inhibitor === "not-applicable" || upper === "NOT_APPLICABLE")
    return "inhibition-not-applicable";
  return null;
};
