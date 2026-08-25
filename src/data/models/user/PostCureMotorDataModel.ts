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
import { isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileIdPayload, type FileRef } from "../common/FileUploadModel";

type LegacySectionSubmission = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export type PostCureDataVariant =
  | "loose-flap-filling"
  | "inhibition-ir1"
  | "inhibition-hemcoat-3k"
  | "inhibition-not-applicable";

export type LocationDateRow = {
  LOCATION: string;
  FROM_DATE: string;
  TO_DATE: string;
  OBSERVATIONS: string;
};

export type LocationQtyRow = {
  LOCATION: string;
  FROM_DATE: string;
  TO_DATE: string;
  QTY_FILLED: string;
  OBSERVATIONS: string;
};

export type LocationAppliedRow = {
  LOCATION: string;
  FROM_DATE: string;
  TO_DATE: string;
  QTY_APPLIED: string;
  OBSERVATIONS: string;
};

export type IngredientQuantityRow = {
  srNo: string | number;
  INGREDIENT: string;
  MFG_LOT: string;
  PARTS_BY_WEIGHT: string;
  QUANTITY: string;
};

export type IngredientTakenRow = {
  srNo: string | number;
  INGREDIENT: string;
  MFG_LOT: string;
  PARTS_BY_WEIGHT: string;
  QTY_TAKEN: string;
};

export type QualificationRow = {
  srNo: number;
  PARAMETER: string;
  SPECIFICATION: string;
  RESULT: string;
};

export type LooseFlapMotorData = {
  variant: "loose-flap-filling";
  BELLOW_REMOVAL_DETAILS: { BELLOW_REMOVAL_TABLE: LocationDateRow[] };
  LOOSE_FLAP_EPOXY_PREPARATION: {
    EPOXY_BATCH_NO: string;
    EPOXY_PREPARATION_DATE: string;
    PREPARATION_DETAILS: IngredientQuantityRow[];
  };
  QUALIFICATION_DETAILS: {
    QUALIFICATION_BATCH_NO: string;
    QUALIFICATION_PREPARATION_DATE: string;
    QUALIFICATION_TABLE: QualificationRow[];
    QUALIFICATION_QC_REPORT: FileRef[];
  };
  LF_EPOXY_FILLING_DETAILS: { LF_FILLING_TABLE: LocationQtyRow[] };
};

export type InhibitionIr1MotorData = {
  variant: "inhibition-ir1";
  IR1_PREMIX: {
    IR1_PREMIX_BATCH_NO: string;
    IR1_PREMIX_DATE: string;
    IR1_PREMIX_TABLE: IngredientTakenRow[];
  };
  IR1_FINAL_MIX: {
    IR1_FINAL_MIX_BATCH_NO: string;
    IR1_FINAL_MIX_DATE: string;
    IR1_FINAL_MIX_TABLE: IngredientTakenRow[];
  };
  IR1_QUALIFICATION: {
    QUALIFICATION_BATCH_NO: string;
    QUALIFICATION_PREPARATION_DATE: string;
    QUALIFICATION_TABLE: QualificationRow[];
    QUALIFICATION_QC_REPORT: FileRef[];
  };
  INHIBITION_BATCH_DETAILS: {
    INHIBITOR_BATCH_NO: string;
    INHIBITOR_BATCH_SIZE: string;
  };
  INHIBITION_APPLICATION_DETAILS: {
    INHIBITION_APPLICATION_TABLE: LocationAppliedRow[];
  };
  DISPATCH_DETAILS: {
    DISPATCH_DATE: string;
    DISPATCH_STATION: string;
  };
};

export type InhibitionHemcoatMotorData = {
  variant: "inhibition-hemcoat-3k";
  HEMCOAT_3K_PREPARATION: {
    HEMCOAT_PREMIX_BATCH_NO: string;
    HEMCOAT_PREMIX_DATE: string;
    PREMIX_PREPARATION_TABLE: IngredientTakenRow[];
  };
  HEMCOAT_3K_FINAL_MIX: {
    HEMCOAT_FINAL_MIX_BATCH_NO: string;
    HEMCOAT_FINAL_MIX_DATE: string;
    FINAL_MIX_TABLE: IngredientTakenRow[];
  };
  HEMCOAT_3K_QUALIFICATION: {
    QUALIFICATION_BATCH_NO: string;
    QUALIFICATION_PREPARATION_DATE: string;
    QUALIFICATION_TABLE: QualificationRow[];
    QUALIFICATION_QC_REPORT: FileRef[];
  };
  INHIBITION_BATCH_DETAILS: {
    INHIBITOR_BATCH_NO: string;
    INHIBITOR_BATCH_SIZE: string;
  };
  INHIBITION_APPLICATION_DETAILS: {
    INHIBITION_APPLICATION_TABLE: LocationAppliedRow[];
  };
  DISPATCH_DETAILS: {
    DISPATCH_DATE: string;
    DISPATCH_STATION: string;
  };
};

export type InhibitionNotApplicableMotorData = {
  variant: "inhibition-not-applicable";
  INHIBITION_NOT_APPLICABLE: { REMARKS: string };
};

export type PostCureMotorData =
  | LooseFlapMotorData
  | InhibitionIr1MotorData
  | InhibitionHemcoatMotorData
  | InhibitionNotApplicableMotorData;

const META_KEYS = new Set([
  "type",
  "label",
  "readonly",
  "srNo",
  "SR_NO",
  "_readonly",
  "_rowType",
]);

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

export const postCureMotorDataHasUserInput = (data: PostCureMotorData | null | undefined): boolean =>
  Boolean(data && hasUserContent(data));

export const resolvePostCureDataVariant = (
  operation: string,
  inhibitorType: string,
): PostCureDataVariant | null => {
  const op = String(operation ?? "").trim().toLowerCase();
  if (op === "loose-flap-filling") return "loose-flap-filling";
  if (op !== "inhibition") return null;
  const inhibitor = String(inhibitorType ?? "").trim();
  const upper = inhibitor.toUpperCase().replace(/[-\s]/g, "_");
  if (inhibitor === "IR1" || upper === "IR1") return "inhibition-ir1";
  if (inhibitor === "Hemcoat-3K" || upper === "HEMCOAT_3K") return "inhibition-hemcoat-3k";
  if (inhibitor === "not-applicable" || upper === "NOT_APPLICABLE") return "inhibition-not-applicable";
  return null;
};

const locationDateRow = (location: string): LocationDateRow => ({
  LOCATION: location,
  FROM_DATE: "",
  TO_DATE: "",
  OBSERVATIONS: "",
});

const locationQtyRow = (location: string): LocationQtyRow => ({
  LOCATION: location,
  FROM_DATE: "",
  TO_DATE: "",
  QTY_FILLED: "",
  OBSERVATIONS: "",
});

const locationAppliedRow = (location: string): LocationAppliedRow => ({
  LOCATION: location,
  FROM_DATE: "",
  TO_DATE: "",
  QTY_APPLIED: "",
  OBSERVATIONS: "",
});

const lfIngredientRows = (): IngredientQuantityRow[] => [
  { srNo: 1, INGREDIENT: "A-125 Hardener", MFG_LOT: "", PARTS_BY_WEIGHT: "60 ±1", QUANTITY: "" },
  { srNo: 2, INGREDIENT: "GX-257 Resin", MFG_LOT: "", PARTS_BY_WEIGHT: "40 ±1", QUANTITY: "" },
  { srNo: 3, INGREDIENT: "HY-960 Accelerator", MFG_LOT: "", PARTS_BY_WEIGHT: "6 ±0.5", QUANTITY: "" },
  { srNo: 4, INGREDIENT: "DY-026 Diluent", MFG_LOT: "", PARTS_BY_WEIGHT: "10 ±0.5", QUANTITY: "" },
  { srNo: "TOTAL", INGREDIENT: "Total Quantity", MFG_LOT: "", PARTS_BY_WEIGHT: "", QUANTITY: "" },
];

const ir1PremixRows = (): IngredientTakenRow[] => [
  { srNo: 1, INGREDIENT: "Castor Oil", MFG_LOT: "", PARTS_BY_WEIGHT: "60.0±1.0", QTY_TAKEN: "" },
  { srNo: 2, INGREDIENT: "Asbestos Powder", MFG_LOT: "", PARTS_BY_WEIGHT: "38.5±1.0", QTY_TAKEN: "" },
  { srNo: 3, INGREDIENT: "Nonox-D", MFG_LOT: "", PARTS_BY_WEIGHT: "1.0±0.1", QTY_TAKEN: "" },
  { srNo: 4, INGREDIENT: "Ferric Oxide", MFG_LOT: "", PARTS_BY_WEIGHT: "0.5±0.05", QTY_TAKEN: "" },
  { srNo: "TOTAL", INGREDIENT: "Total Quantity", MFG_LOT: "", PARTS_BY_WEIGHT: "", QTY_TAKEN: "" },
];

const ir1FinalMixRows = (): IngredientTakenRow[] => [
  { srNo: 1, INGREDIENT: "IR-1 Premix", MFG_LOT: "", PARTS_BY_WEIGHT: "100", QTY_TAKEN: "" },
  { srNo: 2, INGREDIENT: "TDI", MFG_LOT: "", PARTS_BY_WEIGHT: "14.5", QTY_TAKEN: "" },
  {
    srNo: 3,
    INGREDIENT: "Catalyst (5% w/w FeAA in benzene)",
    MFG_LOT: "",
    PARTS_BY_WEIGHT: "2 ml",
    QTY_TAKEN: "",
  },
  { srNo: "TOTAL", INGREDIENT: "Total Quantity", MFG_LOT: "", PARTS_BY_WEIGHT: "", QTY_TAKEN: "" },
];

const hemcoatPremixRows = (): IngredientTakenRow[] => [
  { srNo: 1, INGREDIENT: "HTPB", MFG_LOT: "", PARTS_BY_WEIGHT: "80.00", QTY_TAKEN: "" },
  { srNo: 2, INGREDIENT: "NBD", MFG_LOT: "", PARTS_BY_WEIGHT: "2.80", QTY_TAKEN: "" },
  { srNo: 3, INGREDIENT: "HT", MFG_LOT: "", PARTS_BY_WEIGHT: "2.15", QTY_TAKEN: "" },
  { srNo: 4, INGREDIENT: "Kaolin", MFG_LOT: "", PARTS_BY_WEIGHT: "15.00", QTY_TAKEN: "" },
  { srNo: 5, INGREDIENT: "Nonox-D", MFG_LOT: "", PARTS_BY_WEIGHT: "0.05", QTY_TAKEN: "" },
  { srNo: "TOTAL", INGREDIENT: "Total Quantity", MFG_LOT: "", PARTS_BY_WEIGHT: "", QTY_TAKEN: "" },
];

const hemcoatFinalMixRows = (): IngredientTakenRow[] => [
  { srNo: 1, INGREDIENT: "Hemcoat-3K Premix", MFG_LOT: "", PARTS_BY_WEIGHT: "98", QTY_TAKEN: "" },
  { srNo: 2, INGREDIENT: "H12MDI", MFG_LOT: "", PARTS_BY_WEIGHT: "2.3", QTY_TAKEN: "" },
  {
    srNo: 3,
    INGREDIENT: "Catalyst (2.5% w/w FeAA in HTPB)",
    MFG_LOT: "",
    PARTS_BY_WEIGHT: "2 ml",
    QTY_TAKEN: "",
  },
  { srNo: "TOTAL", INGREDIENT: "Total Quantity", MFG_LOT: "", PARTS_BY_WEIGHT: "", QTY_TAKEN: "" },
];

const qualificationRows = (
  specs: Array<{ PARAMETER: string; SPECIFICATION: string }>,
): QualificationRow[] =>
  specs.map((row, index) => ({
    srNo: index + 1,
    PARAMETER: row.PARAMETER,
    SPECIFICATION: row.SPECIFICATION,
    RESULT: "",
  }));

export const createEmptyPostCureMotorData = (variant: PostCureDataVariant): PostCureMotorData => {
  switch (variant) {
    case "loose-flap-filling":
      return {
        variant,
        BELLOW_REMOVAL_DETAILS: {
          BELLOW_REMOVAL_TABLE: [locationDateRow("HE_SIDE"), locationDateRow("NE_SIDE")],
        },
        LOOSE_FLAP_EPOXY_PREPARATION: {
          EPOXY_BATCH_NO: "",
          EPOXY_PREPARATION_DATE: "",
          PREPARATION_DETAILS: lfIngredientRows(),
        },
        QUALIFICATION_DETAILS: {
          QUALIFICATION_BATCH_NO: "",
          QUALIFICATION_PREPARATION_DATE: "",
          QUALIFICATION_TABLE: qualificationRows([
            { PARAMETER: "Tensile Strength", SPECIFICATION: ">=40 KSC" },
            { PARAMETER: "% Elongation", SPECIFICATION: ">=25" },
          ]),
          QUALIFICATION_QC_REPORT: [],
        },
        LF_EPOXY_FILLING_DETAILS: {
          LF_FILLING_TABLE: [locationQtyRow("HE_SIDE"), locationQtyRow("NE_SIDE")],
        },
      };
    case "inhibition-ir1":
      return {
        variant,
        IR1_PREMIX: {
          IR1_PREMIX_BATCH_NO: "",
          IR1_PREMIX_DATE: "",
          IR1_PREMIX_TABLE: ir1PremixRows(),
        },
        IR1_FINAL_MIX: {
          IR1_FINAL_MIX_BATCH_NO: "",
          IR1_FINAL_MIX_DATE: "",
          IR1_FINAL_MIX_TABLE: ir1FinalMixRows(),
        },
        IR1_QUALIFICATION: {
          QUALIFICATION_BATCH_NO: "",
          QUALIFICATION_PREPARATION_DATE: "",
          QUALIFICATION_TABLE: qualificationRows([
            { PARAMETER: "Tensile Strength", SPECIFICATION: ">=8 KSC" },
            { PARAMETER: "% Elongation", SPECIFICATION: ">=30" },
          ]),
          QUALIFICATION_QC_REPORT: [],
        },
        INHIBITION_BATCH_DETAILS: { INHIBITOR_BATCH_NO: "", INHIBITOR_BATCH_SIZE: "" },
        INHIBITION_APPLICATION_DETAILS: {
          INHIBITION_APPLICATION_TABLE: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        DISPATCH_DETAILS: { DISPATCH_DATE: "", DISPATCH_STATION: "" },
      };
    case "inhibition-hemcoat-3k":
      return {
        variant,
        HEMCOAT_3K_PREPARATION: {
          HEMCOAT_PREMIX_BATCH_NO: "",
          HEMCOAT_PREMIX_DATE: "",
          PREMIX_PREPARATION_TABLE: hemcoatPremixRows(),
        },
        HEMCOAT_3K_FINAL_MIX: {
          HEMCOAT_FINAL_MIX_BATCH_NO: "",
          HEMCOAT_FINAL_MIX_DATE: "",
          FINAL_MIX_TABLE: hemcoatFinalMixRows(),
        },
        HEMCOAT_3K_QUALIFICATION: {
          QUALIFICATION_BATCH_NO: "",
          QUALIFICATION_PREPARATION_DATE: "",
          QUALIFICATION_TABLE: qualificationRows([
            { PARAMETER: "Tensile Strength", SPECIFICATION: "≥25 KSC" },
            { PARAMETER: "% Elongation", SPECIFICATION: "≥100" },
          ]),
          QUALIFICATION_QC_REPORT: [],
        },
        INHIBITION_BATCH_DETAILS: { INHIBITOR_BATCH_NO: "", INHIBITOR_BATCH_SIZE: "" },
        INHIBITION_APPLICATION_DETAILS: {
          INHIBITION_APPLICATION_TABLE: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        DISPATCH_DETAILS: { DISPATCH_DATE: "", DISPATCH_STATION: "" },
      };
    case "inhibition-not-applicable":
      return {
        variant: "inhibition-not-applicable",
        INHIBITION_NOT_APPLICABLE: { REMARKS: "" },
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
      LOCATION: str(pickField(rec, "LOCATION", "location")),
      FROM_DATE: toUiDate(pickField(rec, "FROM_DATE", "fromDate")),
      TO_DATE: toUiDate(pickField(rec, "TO_DATE", "toDate")),
      OBSERVATIONS: str(pickField(rec, "OBSERVATIONS", "observations")),
    };
  });

const parseLocationQtyRows = (rows: unknown): LocationQtyRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      LOCATION: str(pickField(rec, "LOCATION", "location")),
      FROM_DATE: toUiDate(pickField(rec, "FROM_DATE", "fromDate")),
      TO_DATE: toUiDate(pickField(rec, "TO_DATE", "toDate")),
      QTY_FILLED: str(pickField(rec, "QTY_FILLED", "qtyFilled", "quantityFilled")),
      OBSERVATIONS: str(pickField(rec, "OBSERVATIONS", "observations")),
    };
  });

const parseLocationAppliedRows = (rows: unknown): LocationAppliedRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      LOCATION: str(pickField(rec, "LOCATION", "location")),
      FROM_DATE: toUiDate(pickField(rec, "FROM_DATE", "fromDate")),
      TO_DATE: toUiDate(pickField(rec, "TO_DATE", "toDate")),
      QTY_APPLIED: str(pickField(rec, "QTY_APPLIED", "qtyApplied", "quantityApplied")),
      OBSERVATIONS: str(pickField(rec, "OBSERVATIONS", "observations")),
    };
  });

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
    return {
      ...presetRow,
      MFG_LOT: str(pickField(savedRow, "MFG_LOT", "mfgLot", "Mfg Lot")) || presetRow.MFG_LOT,
      QUANTITY: str(pickField(savedRow, "QUANTITY", "quantity", "quantityTaken")) || presetRow.QUANTITY,
    };
  });
};

const mergeIngredientTakenRows = (
  preset: IngredientTakenRow[],
  saved: unknown,
): IngredientTakenRow[] => {
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
    return {
      ...presetRow,
      MFG_LOT: str(pickField(savedRow, "MFG_LOT", "mfgLot", "Mfg Lot")) || presetRow.MFG_LOT,
      QTY_TAKEN: str(pickField(savedRow, "QTY_TAKEN", "qtyTaken", "quantityTaken")) || presetRow.QTY_TAKEN,
    };
  });
};

const mergeQualificationRows = (preset: QualificationRow[], saved: unknown): QualificationRow[] => {
  const savedRows = asArray(saved);
  return preset.map((presetRow, index) => {
    const savedRow = asRecord(savedRows[index]) ?? {};
    return {
      ...presetRow,
      RESULT: str(pickField(savedRow, "RESULT", "result")) || presetRow.RESULT,
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
      const bellowRows = parseLocationDateRows(pickField(bellow, "BELLOW_REMOVAL_TABLE", "bellowRemovalTable"));
      const fillRows = parseLocationQtyRows(pickField(fill, "LF_FILLING_TABLE", "lfFillingTable"));
      return {
        variant: "loose-flap-filling",
        BELLOW_REMOVAL_DETAILS: {
          BELLOW_REMOVAL_TABLE: bellowRows.length
            ? bellowRows
            : empty.BELLOW_REMOVAL_DETAILS.BELLOW_REMOVAL_TABLE,
        },
        LOOSE_FLAP_EPOXY_PREPARATION: {
          EPOXY_BATCH_NO: str(
            pickField(prep, "EPOXY_BATCH_NO", "epoxyBatchNo", "LF_EPOXY_BATCH_NO", "batchNo"),
          ),
          EPOXY_PREPARATION_DATE: toUiDate(
            pickField(
              prep,
              "EPOXY_PREPARATION_DATE",
              "epoxyPreparationDate",
              "LF_EPOXY_PREPARATION_DATE",
              "preparationDate",
            ),
          ),
          PREPARATION_DETAILS: mergeIngredientQuantityRows(
            empty.LOOSE_FLAP_EPOXY_PREPARATION.PREPARATION_DETAILS,
            pickField(prep, "PREPARATION_DETAILS", "preparationDetails", "parameters"),
          ),
        },
        QUALIFICATION_DETAILS: {
          QUALIFICATION_BATCH_NO: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          QUALIFICATION_PREPARATION_DATE: toUiDate(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          QUALIFICATION_TABLE: mergeQualificationRows(
            empty.QUALIFICATION_DETAILS.QUALIFICATION_TABLE,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          QUALIFICATION_QC_REPORT: parseFileRefs(pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport")),
        },
        LF_EPOXY_FILLING_DETAILS: {
          LF_FILLING_TABLE: fillRows.length
            ? fillRows
            : empty.LF_EPOXY_FILLING_DETAILS.LF_FILLING_TABLE,
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
        IR1_PREMIX: {
          IR1_PREMIX_BATCH_NO: str(pickField(premix, "IR1_PREMIX_BATCH_NO", "ir1PremixBatchNo")),
          IR1_PREMIX_DATE: toUiDate(pickField(premix, "IR1_PREMIX_DATE", "ir1PremixDate")),
          IR1_PREMIX_TABLE: mergeIngredientTakenRows(
            empty.IR1_PREMIX.IR1_PREMIX_TABLE,
            pickField(premix, "IR1_PREMIX_TABLE", "ir1PremixTable"),
          ),
        },
        IR1_FINAL_MIX: {
          IR1_FINAL_MIX_BATCH_NO: str(
            pickField(finalMix, "IR1_FINAL_MIX_BATCH_NO", "ir1FinalMixBatchNo"),
          ),
          IR1_FINAL_MIX_DATE: toUiDate(
            pickField(finalMix, "IR1_FINAL_MIX_DATE", "ir1FinalMixDate"),
          ),
          IR1_FINAL_MIX_TABLE: mergeIngredientTakenRows(
            empty.IR1_FINAL_MIX.IR1_FINAL_MIX_TABLE,
            pickField(finalMix, "IR1_FINAL_MIX_TABLE", "ir1FinalMixTable"),
          ),
        },
        IR1_QUALIFICATION: {
          QUALIFICATION_BATCH_NO: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          QUALIFICATION_PREPARATION_DATE: toUiDate(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          QUALIFICATION_TABLE: mergeQualificationRows(
            empty.IR1_QUALIFICATION.QUALIFICATION_TABLE,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          QUALIFICATION_QC_REPORT: parseFileRefs(pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport")),
        },
        INHIBITION_BATCH_DETAILS: {
          INHIBITOR_BATCH_NO: str(pickField(batch, "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
          INHIBITOR_BATCH_SIZE: str(
            pickField(batch, "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize"),
          ),
        },
        INHIBITION_APPLICATION_DETAILS: {
          INHIBITION_APPLICATION_TABLE: appRows.length
            ? appRows
            : empty.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
        },
        DISPATCH_DETAILS: {
          DISPATCH_DATE: toUiDate(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          DISPATCH_STATION: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
        },
      };
    }
    case "inhibition-hemcoat-3k": {
      const empty = createEmptyPostCureMotorData("inhibition-hemcoat-3k") as InhibitionHemcoatMotorData;
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
        HEMCOAT_3K_PREPARATION: {
          HEMCOAT_PREMIX_BATCH_NO: str(
            pickField(prep, "HEMCOAT_PREMIX_BATCH_NO", "hemcoatPremixBatchNo"),
          ),
          HEMCOAT_PREMIX_DATE: toUiDate(pickField(prep, "HEMCOAT_PREMIX_DATE", "hemcoatPremixDate")),
          PREMIX_PREPARATION_TABLE: mergeIngredientTakenRows(
            empty.HEMCOAT_3K_PREPARATION.PREMIX_PREPARATION_TABLE,
            pickField(prep, "PREMIX_PREPARATION_TABLE", "premixPreparationTable"),
          ),
        },
        HEMCOAT_3K_FINAL_MIX: {
          HEMCOAT_FINAL_MIX_BATCH_NO: str(
            pickField(finalMix, "HEMCOAT_FINAL_MIX_BATCH_NO", "hemcoatFinalMixBatchNo"),
          ),
          HEMCOAT_FINAL_MIX_DATE: toUiDate(
            pickField(finalMix, "HEMCOAT_FINAL_MIX_DATE", "hemcoatFinalMixDate"),
          ),
          FINAL_MIX_TABLE: mergeIngredientTakenRows(
            empty.HEMCOAT_3K_FINAL_MIX.FINAL_MIX_TABLE,
            pickField(finalMix, "FINAL_MIX_TABLE", "finalMixTable"),
          ),
        },
        HEMCOAT_3K_QUALIFICATION: {
          QUALIFICATION_BATCH_NO: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          QUALIFICATION_PREPARATION_DATE: toUiDate(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          QUALIFICATION_TABLE: mergeQualificationRows(
            empty.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_TABLE,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          QUALIFICATION_QC_REPORT: parseFileRefs(pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport")),
        },
        INHIBITION_BATCH_DETAILS: {
          INHIBITOR_BATCH_NO: str(pickField(batch, "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
          INHIBITOR_BATCH_SIZE: str(
            pickField(batch, "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize"),
          ),
        },
        INHIBITION_APPLICATION_DETAILS: {
          INHIBITION_APPLICATION_TABLE: appRows.length
            ? appRows
            : empty.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
        },
        DISPATCH_DETAILS: {
          DISPATCH_DATE: toUiDate(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          DISPATCH_STATION: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
        },
      };
    }
    case "inhibition-not-applicable": {
      const na = sectionDataRow(sections, "INHIBITION_NOT_APPLICABLE");
      return {
        variant: "inhibition-not-applicable",
        INHIBITION_NOT_APPLICABLE: {
          REMARKS: str(pickField(na, "REMARKS", "remarks")),
        },
      };
    }
    default:
      return createEmptyPostCureMotorData("loose-flap-filling");
  }
};

const payloadLocationDateRows = (rows: LocationDateRow[]) =>
  rows.map((row) => ({
    LOCATION: row.LOCATION,
    FROM_DATE: (toApiDate(row.FROM_DATE) ?? row.FROM_DATE.trim()) || undefined,
    TO_DATE: (toApiDate(row.TO_DATE) ?? row.TO_DATE.trim()) || undefined,
    OBSERVATIONS: row.OBSERVATIONS.trim() || undefined,
  }));

const payloadLocationQtyRows = (rows: LocationQtyRow[]) =>
  rows.map((row) => ({
    LOCATION: row.LOCATION,
    FROM_DATE: (toApiDate(row.FROM_DATE) ?? row.FROM_DATE.trim()) || undefined,
    TO_DATE: (toApiDate(row.TO_DATE) ?? row.TO_DATE.trim()) || undefined,
    QTY_FILLED: toApiNumber(row.QTY_FILLED),
    OBSERVATIONS: row.OBSERVATIONS.trim() || undefined,
  }));

const payloadLocationAppliedRows = (rows: LocationAppliedRow[]) =>
  rows.map((row) => ({
    LOCATION: row.LOCATION,
    FROM_DATE: (toApiDate(row.FROM_DATE) ?? row.FROM_DATE.trim()) || undefined,
    TO_DATE: (toApiDate(row.TO_DATE) ?? row.TO_DATE.trim()) || undefined,
    QTY_APPLIED: toApiNumber(row.QTY_APPLIED),
    OBSERVATIONS: row.OBSERVATIONS.trim() || undefined,
  }));

const payloadIngredientQuantityRows = (rows: IngredientQuantityRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    INGREDIENT: row.INGREDIENT,
    MFG_LOT: row.MFG_LOT.trim() || undefined,
    PARTS_BY_WEIGHT: row.PARTS_BY_WEIGHT,
    QUANTITY: toApiNumber(row.QUANTITY),
  }));

const payloadIngredientTakenRows = (rows: IngredientTakenRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    INGREDIENT: row.INGREDIENT,
    MFG_LOT: row.MFG_LOT.trim() || undefined,
    PARTS_BY_WEIGHT: row.PARTS_BY_WEIGHT,
    QTY_TAKEN: toApiNumber(row.QTY_TAKEN),
  }));

const payloadQualificationRows = (rows: QualificationRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    PARAMETER: row.PARAMETER,
    SPECIFICATION: row.SPECIFICATION,
    RESULT: row.RESULT.trim() || undefined,
  }));

const makeSection = (sectionId: string, sectionData: Record<string, unknown>): LegacySectionSubmission => ({
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
      location: row.LOCATION || undefined,
      fromDate: apiDateOrUi(row.FROM_DATE),
      toDate: apiDateOrUi(row.TO_DATE),
      observations: row.OBSERVATIONS.trim() || undefined,
    }),
  );

const mapLocationQtyRowsForApi = (rows: LocationQtyRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.LOCATION || undefined,
      fromDate: apiDateOrUi(row.FROM_DATE),
      toDate: apiDateOrUi(row.TO_DATE),
      quantityFilled: toApiNumber(row.QTY_FILLED),
      observations: row.OBSERVATIONS.trim() || undefined,
    }),
  );

const mapLocationAppliedRowsForApi = (rows: LocationAppliedRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.LOCATION || undefined,
      fromDate: apiDateOrUi(row.FROM_DATE),
      toDate: apiDateOrUi(row.TO_DATE),
      quantityApplied: toApiNumber(row.QTY_APPLIED),
      observations: row.OBSERVATIONS.trim() || undefined,
    }),
  );

const ingredientRowKey = (srNo: string | number | undefined, index: number): string =>
  String(srNo ?? index + 1);

const isIngredientTotalRow = (srNo: string | number | undefined, ingredient: string): boolean =>
  String(srNo ?? "").trim().toUpperCase() === "TOTAL" ||
  String(ingredient ?? "").trim().toLowerCase() === "total quantity";

const mapIngredientQuantityRowsForApi = (rows: IngredientQuantityRow[]) =>
  rows.map((row, index) => {
    const isTotal = isIngredientTotalRow(row.srNo, row.INGREDIENT);
    const base = {
      rowKey: ingredientRowKey(row.srNo, index),
      ingredient: row.INGREDIENT,
      quantityTaken: toApiNumber(row.QUANTITY),
    };
    if (isTotal) {
      return omitEmpty(base);
    }
    return omitEmpty({
      ...base,
      mfgLot: row.MFG_LOT.trim() || undefined,
      partsByWeight: row.PARTS_BY_WEIGHT,
    });
  });

const mapIngredientTakenRowsForApi = (rows: IngredientTakenRow[]) =>
  rows.map((row, index) => {
    const isTotal = isIngredientTotalRow(row.srNo, row.INGREDIENT);
    const base = {
      rowKey: ingredientRowKey(row.srNo, index),
      ingredient: row.INGREDIENT,
      quantityTaken: toApiNumber(row.QTY_TAKEN),
    };
    if (isTotal) {
      return omitEmpty(base);
    }
    return omitEmpty({
      ...base,
      mfgLot: row.MFG_LOT.trim() || undefined,
      partsByWeight: row.PARTS_BY_WEIGHT,
    });
  });

const mapQualificationParamsForApi = (rows: QualificationRow[]) =>
  rows.map((row) =>
    omitEmpty({
      srNo: row.srNo,
      parameter: row.PARAMETER,
      specification: row.SPECIFICATION,
      result: row.RESULT.trim() || undefined,
    }),
  );

const buildLooseFlapFillingDetailsPayload = (data: LooseFlapMotorData): LooseFlapFillingDetailsApi => ({
  bellowRemovalDetails: mapLocationDateRowsForApi(data.BELLOW_REMOVAL_DETAILS.BELLOW_REMOVAL_TABLE),
  epoxyPreparationIngredients: omitEmpty({
    batchNo: data.LOOSE_FLAP_EPOXY_PREPARATION.EPOXY_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.LOOSE_FLAP_EPOXY_PREPARATION.EPOXY_PREPARATION_DATE),
    parameters: mapIngredientQuantityRowsForApi(
      data.LOOSE_FLAP_EPOXY_PREPARATION.PREPARATION_DETAILS,
    ),
  }) as LooseFlapFillingDetailsApi["epoxyPreparationIngredients"],
  qualificationDetails: omitEmpty({
    batchNo: data.QUALIFICATION_DETAILS.QUALIFICATION_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.QUALIFICATION_DETAILS.QUALIFICATION_PREPARATION_DATE),
    parameters: mapQualificationParamsForApi(data.QUALIFICATION_DETAILS.QUALIFICATION_TABLE),
    qcReport: (() => {
      const files = toFileIdListPayload(data.QUALIFICATION_DETAILS.QUALIFICATION_QC_REPORT);
      return files.length ? files : undefined;
    })(),
  }) as LooseFlapFillingDetailsApi["qualificationDetails"],
  fillingDetails: mapLocationQtyRowsForApi(data.LF_EPOXY_FILLING_DETAILS.LF_FILLING_TABLE),
});

const buildInhibitionIr1DetailsPayload = (data: InhibitionIr1MotorData): InhibitionDetailsApi => ({
  premixDetails: omitEmpty({
    batchNo: data.IR1_PREMIX.IR1_PREMIX_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.IR1_PREMIX.IR1_PREMIX_DATE),
    ingredients: mapIngredientTakenRowsForApi(data.IR1_PREMIX.IR1_PREMIX_TABLE),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.IR1_FINAL_MIX.IR1_FINAL_MIX_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.IR1_FINAL_MIX.IR1_FINAL_MIX_DATE),
    ingredients: mapIngredientTakenRowsForApi(data.IR1_FINAL_MIX.IR1_FINAL_MIX_TABLE),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.IR1_QUALIFICATION.QUALIFICATION_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.IR1_QUALIFICATION.QUALIFICATION_PREPARATION_DATE),
    parameters: mapQualificationParamsForApi(data.IR1_QUALIFICATION.QUALIFICATION_TABLE),
    qcReport: (() => {
      const files = toFileIdListPayload(data.IR1_QUALIFICATION.QUALIFICATION_QC_REPORT);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_NO.trim() || undefined,
    batchSize: toApiNumber(data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_SIZE),
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateOrUi(data.DISPATCH_DETAILS.DISPATCH_DATE),
    dispatchStation: data.DISPATCH_DETAILS.DISPATCH_STATION.trim() || undefined,
  }) as InhibitionDetailsApi["dispatchDetails"],
});

const buildInhibitionHemcoatDetailsPayload = (
  data: InhibitionHemcoatMotorData,
): InhibitionDetailsApi => ({
  premixDetails: omitEmpty({
    batchNo: data.HEMCOAT_3K_PREPARATION.HEMCOAT_PREMIX_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.HEMCOAT_3K_PREPARATION.HEMCOAT_PREMIX_DATE),
    ingredients: mapIngredientTakenRowsForApi(
      data.HEMCOAT_3K_PREPARATION.PREMIX_PREPARATION_TABLE,
    ),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.HEMCOAT_3K_FINAL_MIX.HEMCOAT_FINAL_MIX_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.HEMCOAT_3K_FINAL_MIX.HEMCOAT_FINAL_MIX_DATE),
    ingredients: mapIngredientTakenRowsForApi(data.HEMCOAT_3K_FINAL_MIX.FINAL_MIX_TABLE),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_BATCH_NO.trim() || undefined,
    preparationDate: apiDateOrUi(data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_PREPARATION_DATE),
    parameters: mapQualificationParamsForApi(data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_TABLE),
    qcReport: (() => {
      const files = toFileIdListPayload(data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_QC_REPORT);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_NO.trim() || undefined,
    batchSize: toApiNumber(data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_SIZE),
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateOrUi(data.DISPATCH_DETAILS.DISPATCH_DATE),
    dispatchStation: data.DISPATCH_DETAILS.DISPATCH_STATION.trim() || undefined,
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
          notApplicableRemarks: data.INHIBITION_NOT_APPLICABLE.REMARKS.trim() || undefined,
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
      RESULT: str(pickField(savedRow, "RESULT", "result")) || presetRow.RESULT,
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
    BELLOW_REMOVAL_DETAILS: {
      BELLOW_REMOVAL_TABLE: bellowRows.length
        ? bellowRows
        : empty.BELLOW_REMOVAL_DETAILS.BELLOW_REMOVAL_TABLE,
    },
    LOOSE_FLAP_EPOXY_PREPARATION: {
      EPOXY_BATCH_NO: str(pickField(epoxy, "batchNo", "EPOXY_BATCH_NO", "epoxyBatchNo")),
      EPOXY_PREPARATION_DATE: toUiDate(
        pickField(epoxy, "preparationDate", "EPOXY_PREPARATION_DATE", "epoxyPreparationDate"),
      ),
      PREPARATION_DETAILS: mergeIngredientQuantityRows(
        empty.LOOSE_FLAP_EPOXY_PREPARATION.PREPARATION_DETAILS,
        epoxy.parameters ?? epoxy.ingredients,
      ),
    },
    QUALIFICATION_DETAILS: {
      QUALIFICATION_BATCH_NO: str(
        pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
      ),
      QUALIFICATION_PREPARATION_DATE: toUiDate(
        pickField(qual, "preparationDate", "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
      ),
      QUALIFICATION_TABLE: parseQualificationParamsFromApi(
        empty.QUALIFICATION_DETAILS.QUALIFICATION_TABLE,
        qual.parameters ?? qual.qualification,
      ),
      QUALIFICATION_QC_REPORT: parseFileRefs(pickField(qual, "qcReport", "QUALIFICATION_QC_REPORT", "qualificationQcReport")),
    },
    LF_EPOXY_FILLING_DETAILS: {
      LF_FILLING_TABLE: fillRows.length ? fillRows : empty.LF_EPOXY_FILLING_DETAILS.LF_FILLING_TABLE,
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
      INHIBITION_NOT_APPLICABLE: {
        REMARKS: str(pickField(details, "notApplicableRemarks", "REMARKS", "remarks")),
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
    const empty = createEmptyPostCureMotorData("inhibition-hemcoat-3k") as InhibitionHemcoatMotorData;
    return {
      variant: "inhibition-hemcoat-3k",
      HEMCOAT_3K_PREPARATION: {
        HEMCOAT_PREMIX_BATCH_NO: str(pickField(premix, "batchNo", "HEMCOAT_PREMIX_BATCH_NO")),
        HEMCOAT_PREMIX_DATE: toUiDate(pickField(premix, "preparationDate", "HEMCOAT_PREMIX_DATE")),
        PREMIX_PREPARATION_TABLE: mergeIngredientTakenRows(
          empty.HEMCOAT_3K_PREPARATION.PREMIX_PREPARATION_TABLE,
          premix.ingredients ?? premix.parameters,
        ),
      },
      HEMCOAT_3K_FINAL_MIX: {
        HEMCOAT_FINAL_MIX_BATCH_NO: str(pickField(finalMix, "batchNo", "HEMCOAT_FINAL_MIX_BATCH_NO")),
        HEMCOAT_FINAL_MIX_DATE: toUiDate(
          pickField(finalMix, "preparationDate", "HEMCOAT_FINAL_MIX_DATE"),
        ),
        FINAL_MIX_TABLE: mergeIngredientTakenRows(
          empty.HEMCOAT_3K_FINAL_MIX.FINAL_MIX_TABLE,
          finalMix.ingredients ?? finalMix.parameters,
        ),
      },
      HEMCOAT_3K_QUALIFICATION: {
        QUALIFICATION_BATCH_NO: str(pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO")),
        QUALIFICATION_PREPARATION_DATE: toUiDate(
          pickField(qual, "preparationDate", "QUALIFICATION_PREPARATION_DATE"),
        ),
        QUALIFICATION_TABLE: parseQualificationParamsFromApi(
          empty.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_TABLE,
          qual.parameters ?? qual.qualification,
        ),
        QUALIFICATION_QC_REPORT: parseFileRefs(pickField(qual, "qcReport", "QUALIFICATION_QC_REPORT")),
      },
      INHIBITION_BATCH_DETAILS: {
        INHIBITOR_BATCH_NO: str(pickField(batch, "batchNo", "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
        INHIBITOR_BATCH_SIZE: str(pickField(batch, "batchSize", "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize")),
      },
      INHIBITION_APPLICATION_DETAILS: {
        INHIBITION_APPLICATION_TABLE: appRows.length
          ? appRows
          : empty.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
      },
      DISPATCH_DETAILS: {
        DISPATCH_DATE: toUiDate(pickField(dispatch, "dispatchDate", "DISPATCH_DATE")),
        DISPATCH_STATION: str(pickField(dispatch, "dispatchStation", "DISPATCH_STATION")),
      },
    };
  }

  const empty = createEmptyPostCureMotorData("inhibition-ir1") as InhibitionIr1MotorData;
  return {
    variant: "inhibition-ir1",
    IR1_PREMIX: {
      IR1_PREMIX_BATCH_NO: str(pickField(premix, "batchNo", "IR1_PREMIX_BATCH_NO", "ir1PremixBatchNo")),
      IR1_PREMIX_DATE: toUiDate(pickField(premix, "preparationDate", "IR1_PREMIX_DATE", "ir1PremixDate")),
      IR1_PREMIX_TABLE: mergeIngredientTakenRows(
        empty.IR1_PREMIX.IR1_PREMIX_TABLE,
        premix.ingredients ?? premix.parameters,
      ),
    },
    IR1_FINAL_MIX: {
      IR1_FINAL_MIX_BATCH_NO: str(
        pickField(finalMix, "batchNo", "IR1_FINAL_MIX_BATCH_NO", "ir1FinalMixBatchNo"),
      ),
      IR1_FINAL_MIX_DATE: toUiDate(
        pickField(finalMix, "preparationDate", "IR1_FINAL_MIX_DATE", "ir1FinalMixDate"),
      ),
      IR1_FINAL_MIX_TABLE: mergeIngredientTakenRows(
        empty.IR1_FINAL_MIX.IR1_FINAL_MIX_TABLE,
        finalMix.ingredients ?? finalMix.parameters,
      ),
    },
    IR1_QUALIFICATION: {
      QUALIFICATION_BATCH_NO: str(pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO", "qualificationBatchNo")),
      QUALIFICATION_PREPARATION_DATE: toUiDate(
        pickField(qual, "preparationDate", "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
      ),
      QUALIFICATION_TABLE: parseQualificationParamsFromApi(
        empty.IR1_QUALIFICATION.QUALIFICATION_TABLE,
        qual.parameters ?? qual.qualification,
      ),
      QUALIFICATION_QC_REPORT: parseFileRefs(pickField(qual, "qcReport", "QUALIFICATION_QC_REPORT", "qualificationQcReport")),
    },
    INHIBITION_BATCH_DETAILS: {
      INHIBITOR_BATCH_NO: str(pickField(batch, "batchNo", "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
      INHIBITOR_BATCH_SIZE: str(pickField(batch, "batchSize", "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize")),
    },
    INHIBITION_APPLICATION_DETAILS: {
      INHIBITION_APPLICATION_TABLE: appRows.length
        ? appRows
        : empty.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
    },
    DISPATCH_DETAILS: {
      DISPATCH_DATE: toUiDate(pickField(dispatch, "dispatchDate", "DISPATCH_DATE")),
      DISPATCH_STATION: str(pickField(dispatch, "dispatchStation", "DISPATCH_STATION")),
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
export const buildPostCureSectionsPayload = (data: PostCureMotorData): LegacySectionSubmission[] => {
  switch (data.variant) {
    case "loose-flap-filling":
      return [
        makeSection("BELLOW_REMOVAL_DETAILS", {
          BELLOW_REMOVAL_TABLE: payloadLocationDateRows(data.BELLOW_REMOVAL_DETAILS.BELLOW_REMOVAL_TABLE),
        }),
        makeSection("LOOSE_FLAP_EPOXY_PREPARATION", {
          EPOXY_BATCH_NO: data.LOOSE_FLAP_EPOXY_PREPARATION.EPOXY_BATCH_NO.trim() || undefined,
          EPOXY_PREPARATION_DATE: apiDateOrUi(
            data.LOOSE_FLAP_EPOXY_PREPARATION.EPOXY_PREPARATION_DATE,
          ),
          PREPARATION_DETAILS: payloadIngredientQuantityRows(
            data.LOOSE_FLAP_EPOXY_PREPARATION.PREPARATION_DETAILS,
          ),
        }),
        makeSection("QUALIFICATION_DETAILS", {
          QUALIFICATION_BATCH_NO: data.QUALIFICATION_DETAILS.QUALIFICATION_BATCH_NO.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateOrUi(
            data.QUALIFICATION_DETAILS.QUALIFICATION_PREPARATION_DATE,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(data.QUALIFICATION_DETAILS.QUALIFICATION_TABLE),
          QUALIFICATION_QC_REPORT: (() => {
              const files = toFileIdListPayload(data.QUALIFICATION_DETAILS.QUALIFICATION_QC_REPORT);
              return files.length ? files : undefined;
            })(),
        }),
        makeSection("LF_EPOXY_FILLING_DETAILS", {
          LF_FILLING_TABLE: payloadLocationQtyRows(data.LF_EPOXY_FILLING_DETAILS.LF_FILLING_TABLE),
        }),
      ];
    case "inhibition-ir1":
      return [
        makeSection("IR1_PREMIX", {
          IR1_PREMIX_BATCH_NO: data.IR1_PREMIX.IR1_PREMIX_BATCH_NO.trim() || undefined,
          IR1_PREMIX_DATE: apiDateOrUi(data.IR1_PREMIX.IR1_PREMIX_DATE),
          IR1_PREMIX_TABLE: payloadIngredientTakenRows(data.IR1_PREMIX.IR1_PREMIX_TABLE),
        }),
        makeSection("IR1_FINAL_MIX", {
          IR1_FINAL_MIX_BATCH_NO: data.IR1_FINAL_MIX.IR1_FINAL_MIX_BATCH_NO.trim() || undefined,
          IR1_FINAL_MIX_DATE: apiDateOrUi(data.IR1_FINAL_MIX.IR1_FINAL_MIX_DATE),
          IR1_FINAL_MIX_TABLE: payloadIngredientTakenRows(data.IR1_FINAL_MIX.IR1_FINAL_MIX_TABLE),
        }),
        makeSection("IR1_QUALIFICATION", {
          QUALIFICATION_BATCH_NO: data.IR1_QUALIFICATION.QUALIFICATION_BATCH_NO.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateOrUi(
            data.IR1_QUALIFICATION.QUALIFICATION_PREPARATION_DATE,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(data.IR1_QUALIFICATION.QUALIFICATION_TABLE),
          QUALIFICATION_QC_REPORT: (() => {
              const files = toFileIdListPayload(data.IR1_QUALIFICATION.QUALIFICATION_QC_REPORT);
              return files.length ? files : undefined;
            })(),
        }),
        makeSection("INHIBITION_BATCH_DETAILS", {
          INHIBITOR_BATCH_NO: data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_NO.trim() || undefined,
          INHIBITOR_BATCH_SIZE: toApiNumber(data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_SIZE),
        }),
        makeSection("INHIBITION_APPLICATION_DETAILS", {
          INHIBITION_APPLICATION_TABLE: payloadLocationAppliedRows(
            data.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
          ),
        }),
        makeSection("DISPATCH_DETAILS", {
          DISPATCH_DATE: apiDateOrUi(data.DISPATCH_DETAILS.DISPATCH_DATE),
          DISPATCH_STATION: data.DISPATCH_DETAILS.DISPATCH_STATION.trim() || undefined,
        }),
      ];
    case "inhibition-hemcoat-3k":
      return [
        makeSection("HEMCOAT_3K_PREPARATION", {
          HEMCOAT_PREMIX_BATCH_NO:
            data.HEMCOAT_3K_PREPARATION.HEMCOAT_PREMIX_BATCH_NO.trim() || undefined,
          HEMCOAT_PREMIX_DATE: apiDateOrUi(data.HEMCOAT_3K_PREPARATION.HEMCOAT_PREMIX_DATE),
          PREMIX_PREPARATION_TABLE: payloadIngredientTakenRows(
            data.HEMCOAT_3K_PREPARATION.PREMIX_PREPARATION_TABLE,
          ),
        }),
        makeSection("HEMCOAT_3K_FINAL_MIX", {
          HEMCOAT_FINAL_MIX_BATCH_NO:
            data.HEMCOAT_3K_FINAL_MIX.HEMCOAT_FINAL_MIX_BATCH_NO.trim() || undefined,
          HEMCOAT_FINAL_MIX_DATE: apiDateOrUi(data.HEMCOAT_3K_FINAL_MIX.HEMCOAT_FINAL_MIX_DATE),
          FINAL_MIX_TABLE: payloadIngredientTakenRows(data.HEMCOAT_3K_FINAL_MIX.FINAL_MIX_TABLE),
        }),
        makeSection("HEMCOAT_3K_QUALIFICATION", {
          QUALIFICATION_BATCH_NO:
            data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_BATCH_NO.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateOrUi(
            data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_PREPARATION_DATE,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(
            data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_TABLE,
          ),
          QUALIFICATION_QC_REPORT: (() => {
              const files = toFileIdListPayload(data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_QC_REPORT);
              return files.length ? files : undefined;
            })(),
        }),
        makeSection("INHIBITION_BATCH_DETAILS", {
          INHIBITOR_BATCH_NO: data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_NO.trim() || undefined,
          INHIBITOR_BATCH_SIZE: toApiNumber(data.INHIBITION_BATCH_DETAILS.INHIBITOR_BATCH_SIZE),
        }),
        makeSection("INHIBITION_APPLICATION_DETAILS", {
          INHIBITION_APPLICATION_TABLE: payloadLocationAppliedRows(
            data.INHIBITION_APPLICATION_DETAILS.INHIBITION_APPLICATION_TABLE,
          ),
        }),
        makeSection("DISPATCH_DETAILS", {
          DISPATCH_DATE: apiDateOrUi(data.DISPATCH_DETAILS.DISPATCH_DATE),
          DISPATCH_STATION: data.DISPATCH_DETAILS.DISPATCH_STATION.trim() || undefined,
        }),
      ];
    case "inhibition-not-applicable":
      return [
        makeSection("INHIBITION_NOT_APPLICABLE", {
          REMARKS: data.INHIBITION_NOT_APPLICABLE.REMARKS.trim() || undefined,
        }),
      ];
    default:
      return [];
  }
};

/** Recompute total row for ingredient tables with numeric qty column. */
export const recomputeIngredientTotal = <
  T extends { srNo: string | number; QTY_TAKEN?: string; QUANTITY?: string },
>(
  rows: T[],
  qtyKey: "QTY_TAKEN" | "QUANTITY",
): T[] => {
  const totalIndex = rows.findIndex((row) => String(row.srNo).toUpperCase() === "TOTAL");
  if (totalIndex < 0) return rows;
  const sum = rows.reduce((acc, row, index) => {
    if (index === totalIndex) return acc;
    const n = Number(String(row[qtyKey] ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? acc + n : acc;
  }, 0);
  return rows.map((row, index) =>
    index === totalIndex
      ? { ...row, [qtyKey]: sum > 0 ? String(sum) : "" }
      : row,
  );
};

export const collectPostCureFileRefsFromMotorData = (
  data: PostCureMotorData | null | undefined,
): FileRef[] => {
  if (!data) return [];
  if (data.variant === "loose-flap-filling") {
    return data.QUALIFICATION_DETAILS?.QUALIFICATION_QC_REPORT ?? [];
  }
  if (data.variant === "inhibition-ir1") {
    return data.IR1_QUALIFICATION?.QUALIFICATION_QC_REPORT ?? [];
  }
  if (data.variant === "inhibition-hemcoat-3k") {
    return data.HEMCOAT_3K_QUALIFICATION?.QUALIFICATION_QC_REPORT ?? [];
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
}): boolean =>
  collectPostCureFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromPostCureForm = (form: {
  motors?: Array<{ postCureData?: PostCureMotorData | null }>;
}): string[] =>
  [
    ...new Set(
      collectPostCureFileRefsFromForm(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];
