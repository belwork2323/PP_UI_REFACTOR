import {
  asArray,
  asRecord,
  pickField,
  str,
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

const postCureDateTimeForUi = (value: unknown): string => {
  const raw = str(value).trim();
  if (/^(?:\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2}-\d{4})$/.test(raw)) {
    return `${toUiDate(raw)} 00:00`;
  }
  return toUiDateTime(value);
};

type LegacySectionSubmission = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export type PostCureDataVariant =
  | "loose-flap-filling"
  | "inhibition-ir1"
  | "inhibition-hemcoat-3k"
  | "inhibition-others"
  | "inhibition-not-applicable";

export type LocationDateRow = {
  location: string;
  fromDate: string;
  toDate: string;
  observations: string;
  /** QC Division QA Remarks column (API: qaRemarks). */
  qaRemarks?: string;
};

export type LocationQtyRow = {
  location: string;
  fromDate: string;
  toDate: string;
  qtyFilled: string;
  observations: string;
  /** QC Division QA Remarks column (API: qaRemarks). */
  qaRemarks?: string;
};

export type LocationAppliedRow = {
  location: string;
  fromDate: string;
  toDate: string;
  qtyApplied: string;
  observations: string;
  /** QC Division QA Remarks column (API: qaRemarks). */
  qaRemarks?: string;
};

export type IngredientQuantityRow = {
  srNo: string | number;
  ingredient: string;
  /** Materials-master id when resolved from ingredients API. */
  materialId?: number | null;
  /** Materials-master code when resolved → MFG Lot dropdown; null → free text. */
  materialCode?: string | null;
  mfgLot: string;
  partsByWeight: string;
  quantity: string;
  /** QC Division QA Remarks column (API: qaRemarks). */
  qaRemarks?: string;
};

export type IngredientTakenRow = {
  srNo: string | number;
  ingredient: string;
  /** Materials-master id when resolved from ingredients API. */
  materialId?: number | null;
  /** Materials-master code when resolved → MFG Lot dropdown; null → free text. */
  materialCode?: string | null;
  mfgLot: string;
  partsByWeight: string;
  qtyTaken: string;
  /** QC Division QA Remarks column (API: qaRemarks). */
  qaRemarks?: string;
};

export type QualificationRow = {
  srNo: number;
  parameter: string;
  specification: Specification;
  result: string;
  /** QC Division QA Remarks column (API: qaRemarks). */
  qaRemarks?: string;
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
    qaRemarks?: string;
  };
  inhibitionApplicationDetails: {
    inhibitionApplicationTable: LocationAppliedRow[];
  };
  dispatchDetails: {
    dispatchDate: string;
    dispatchStation: string;
    qaRemarks?: string;
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
    qaRemarks?: string;
  };
  inhibitionApplicationDetails: {
    inhibitionApplicationTable: LocationAppliedRow[];
  };
  dispatchDetails: {
    dispatchDate: string;
    dispatchStation: string;
    qaRemarks?: string;
  };
};

/** Others: flexible premix/final mixes + shared inhibition trailing sections. */
export type InhibitionOthersMotorData = {
  variant: "inhibition-others";
  othersPremix: {
    othersPremixBatchNo: string;
    othersPremixDate: string;
    othersPremixTable: IngredientTakenRow[];
  };
  othersFinalMix: {
    othersFinalMixBatchNo: string;
    othersFinalMixDate: string;
    othersFinalMixTable: IngredientTakenRow[];
  };
  othersQualification: {
    qualificationBatchNo: string;
    qualificationPreparationDate: string;
    qualificationTable: QualificationRow[];
    qualificationQcReport: FileRef[];
  };
  inhibitionBatchDetails: {
    inhibitorBatchNo: string;
    inhibitorBatchSize: string;
    qaRemarks?: string;
  };
  inhibitionApplicationDetails: {
    inhibitionApplicationTable: LocationAppliedRow[];
  };
  dispatchDetails: {
    dispatchDate: string;
    dispatchStation: string;
    qaRemarks?: string;
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
  | InhibitionOthersMotorData
  | InhibitionNotApplicableMotorData;

const emptyFlexibleTakenTable = (): IngredientTakenRow[] => [
  {
    srNo: 1,
    ingredient: "",
    materialId: null,
    materialCode: null,
    mfgLot: "",
    partsByWeight: "",
    qtyTaken: "",
  },
  {
    srNo: "TOTAL",
    ingredient: "Total Quantity",
    materialId: null,
    materialCode: null,
    mfgLot: "",
    partsByWeight: "",
    qtyTaken: "",
  },
];

const locationDateRow = (location: string): LocationDateRow => ({
  location,
  fromDate: "",
  toDate: "",
  observations: "",
  qaRemarks: "",
});

const locationQtyRow = (location: string): LocationQtyRow => ({
  location,
  fromDate: "",
  toDate: "",
  qtyFilled: "",
  observations: "",
  qaRemarks: "",
});

const locationAppliedRow = (location: string): LocationAppliedRow => ({
  location,
  fromDate: "",
  toDate: "",
  qtyApplied: "",
  observations: "",
  qaRemarks: "",
});
interface Specification {
  min: number | null;
  max: number | null;
  unit: string;
}

const qualificationRows = (
  specs: Array<{ parameter: string; specification: Specification }>,
): QualificationRow[] =>
  specs.map((row, index) => ({
    srNo: index + 1,
    parameter: row.parameter,
    specification: row.specification,
    result: "",
    qaRemarks: "",
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
          // Seeded from POST /post-cure/ingredients (LOOSE_FLAP_EPOXY).
          preparationDetails: [],
        },
        qualificationDetails: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            { parameter: "Tensile Strength", specification: { min: 40, max: null, unit: "KSC" } },
            { parameter: "% Elongation", specification: { min: 25, max: null, unit: "" } },
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
          // Seeded from POST /post-cure/ingredients (IR1_PREMIX).
          ir1PremixTable: [],
        },
        ir1FinalMix: {
          ir1FinalMixBatchNo: "",
          ir1FinalMixDate: "",
          // Seeded from POST /post-cure/ingredients (IR1_FINAL_MIX).
          ir1FinalMixTable: [],
        },
        ir1Qualification: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            {
              parameter: "Tensile Strength",
              specification: {
                min: 8,
                max: null,
                unit: "KSC",
              },
            },
            {
              parameter: "% Elongation",
              specification: {
                min: 30,
                max: null,
                unit: "",
              },
            },
          ]),
          qualificationQcReport: [],
        },
        inhibitionBatchDetails: { inhibitorBatchNo: "", inhibitorBatchSize: "", qaRemarks: "" },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        dispatchDetails: { dispatchDate: "", dispatchStation: "", qaRemarks: "" },
      };
    case "inhibition-hemcoat-3k":
      return {
        variant,
        hemcoat3kPreparation: {
          hemcoatPremixBatchNo: "",
          hemcoatPremixDate: "",
          // Seeded from POST /post-cure/ingredients (HEMCOAT_3K_PREMIX).
          premixPreparationTable: [],
        },
        hemcoat3kFinalMix: {
          hemcoatFinalMixBatchNo: "",
          hemcoatFinalMixDate: "",
          // Seeded from POST /post-cure/ingredients (HEMCOAT_3K_FINAL_MIX).
          finalMixTable: [],
        },
        hemcoat3kQualification: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            { parameter: "Tensile Strength", specification: { min: 25, max: null, unit: "KSC" } },
            { parameter: "% Elongation", specification: { min: 100, max: null, unit: "" } },
          ]),
          qualificationQcReport: [],
        },
        inhibitionBatchDetails: { inhibitorBatchNo: "", inhibitorBatchSize: "", qaRemarks: "" },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        dispatchDetails: { dispatchDate: "", dispatchStation: "", qaRemarks: "" },
      };
    case "inhibition-others":
      return {
        variant: "inhibition-others",
        othersPremix: {
          othersPremixBatchNo: "",
          othersPremixDate: "",
          othersPremixTable: emptyFlexibleTakenTable(),
        },
        othersFinalMix: {
          othersFinalMixBatchNo: "",
          othersFinalMixDate: "",
          othersFinalMixTable: emptyFlexibleTakenTable(),
        },
        othersQualification: {
          qualificationBatchNo: "",
          qualificationPreparationDate: "",
          qualificationTable: qualificationRows([
            { parameter: "Tensile Strength", specification: { min: null, max: null, unit: "" } },
            { parameter: "% Elongation", specification: { min: null, max: null, unit: "" } },
          ]),
          qualificationQcReport: [],
        },
        inhibitionBatchDetails: { inhibitorBatchNo: "", inhibitorBatchSize: "", qaRemarks: "" },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: [
            locationAppliedRow("HE_SIDE"),
            locationAppliedRow("NE_SIDE"),
          ],
        },
        dispatchDetails: { dispatchDate: "", dispatchStation: "", qaRemarks: "" },
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

const pickLocationQaRemarks = (rec: Record<string, unknown>) => {
  // Prefer camelCase API field; skip empty strings so legacy remarks keys do not blank QA.
  for (const key of ["qaRemarks", "QA_REMARKS", "remarks", "REMARKS"] as const) {
    const value = str(rec[key]).trim();
    if (value) return value;
  }
  return str(pickField(rec, "qaRemarks", "QA_REMARKS", "remarks", "REMARKS")).trim();
};

const parseLocationDateRows = (rows: unknown): LocationDateRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      location: str(pickField(rec, "LOCATION", "location")),
      fromDate: postCureDateTimeForUi(pickField(rec, "FROM_DATE", "fromDate")),
      toDate: postCureDateTimeForUi(pickField(rec, "TO_DATE", "toDate")),
      observations: str(pickField(rec, "OBSERVATIONS", "observations")),
      qaRemarks: pickLocationQaRemarks(rec),
    };
  });

const parseLocationQtyRows = (rows: unknown): LocationQtyRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      location: str(pickField(rec, "LOCATION", "location")),
      fromDate: postCureDateTimeForUi(pickField(rec, "FROM_DATE", "fromDate")),
      toDate: postCureDateTimeForUi(pickField(rec, "TO_DATE", "toDate")),
      qtyFilled: str(pickField(rec, "QTY_FILLED", "qtyFilled", "quantityFilled")),
      observations: str(pickField(rec, "OBSERVATIONS", "observations")),
      qaRemarks: pickLocationQaRemarks(rec),
    };
  });

const parseLocationAppliedRows = (rows: unknown): LocationAppliedRow[] =>
  asArray(rows).map((row) => {
    const rec = asRecord(row) ?? {};
    return {
      location: str(pickField(rec, "LOCATION", "location")),
      fromDate: postCureDateTimeForUi(pickField(rec, "FROM_DATE", "fromDate")),
      toDate: postCureDateTimeForUi(pickField(rec, "TO_DATE", "toDate")),
      qtyApplied: str(pickField(rec, "QTY_APPLIED", "qtyApplied", "quantityApplied")),
      observations: str(pickField(rec, "OBSERVATIONS", "observations")),
      qaRemarks: pickLocationQaRemarks(rec),
    };
  });

export const POST_CURE_INGREDIENT_TOTAL_SR_LABEL = "Total Quanity";

const isIngredientTotalRow = (srNo: string | number | undefined, ingredient: string): boolean =>
  String(srNo ?? "")
    .trim()
    .toUpperCase() === "TOTAL" ||
  String(ingredient ?? "")
    .trim()
    .toLowerCase() === "total quantity";

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

/** When preset is empty (API-driven seeds), rebuild rows from saved payload. */
const parseIngredientQuantityRowsFromSaved = (saved: unknown): IngredientQuantityRow[] =>
  asArray(saved).map((entry, index) => {
    const rec = asRecord(entry) ?? {};
    const ingredientRaw = str(pickField(rec, "INGREDIENT", "ingredient"));
    const materialCodeRaw = str(pickField(rec, "materialCode", "MATERIAL_CODE"));
    // Case Prep style: payload `ingredient` may be the master code.
    const materialCode = materialCodeRaw || ingredientRaw || null;
    const srRaw = pickField(rec, "srNo", "rowKey", "SR_NO");
    const srNo =
      str(srRaw).trim().toUpperCase() === "TOTAL"
        ? "TOTAL"
        : ((srRaw as string | number) ?? index + 1);
    const resolvedMfgLot = str(pickField(rec, "MFG_LOT", "mfgLot", "Mfg Lot"));
    const resolvedQuantity = str(
      pickField(rec, "QUANTITY", "quantity", "quantityTaken", "QTY_TAKEN"),
    );
    return {
      srNo,
      ingredient: ingredientRaw,
      materialId: null,
      materialCode: isIngredientTotalRow(srNo, ingredientRaw) ? null : materialCode,
      mfgLot: resolvedMfgLot,
      partsByWeight: str(pickField(rec, "PARTS_BY_WEIGHT", "partsByWeight")),
      quantity: resolvedQuantity,
      qaRemarks: pickLocationQaRemarks(rec),
    };
  });

const parseIngredientTakenRowsFromSaved = (saved: unknown): IngredientTakenRow[] =>
  asArray(saved).map((entry, index) => {
    const rec = asRecord(entry) ?? {};
    const ingredientRaw = str(pickField(rec, "INGREDIENT", "ingredient"));
    const materialCodeRaw = str(pickField(rec, "materialCode", "MATERIAL_CODE"));
    const materialCode = materialCodeRaw || ingredientRaw || null;
    const srRaw = pickField(rec, "srNo", "rowKey", "SR_NO");
    const srNo =
      str(srRaw).trim().toUpperCase() === "TOTAL"
        ? "TOTAL"
        : ((srRaw as string | number) ?? index + 1);
    return {
      srNo,
      ingredient: ingredientRaw,
      materialId: null,
      materialCode: isIngredientTotalRow(srNo, ingredientRaw) ? null : materialCode,
      mfgLot: str(pickField(rec, "MFG_LOT", "mfgLot", "Mfg Lot")),
      partsByWeight: str(pickField(rec, "PARTS_BY_WEIGHT", "partsByWeight")),
      qtyTaken: str(pickField(rec, "QTY_TAKEN", "qtyTaken", "quantityTaken", "quantity")),
      qaRemarks: pickLocationQaRemarks(rec),
    };
  });

/**
 * Others flexible mixes: rebuild rows from API ingredients (no fixed recipe preset).
 * Recipe-style merge would keep empty preset ingredient/partsByWeight and drop saved values.
 */
const parseFlexibleIngredientTakenRowsFromSaved = (saved: unknown): IngredientTakenRow[] => {
  const savedRows = asArray(saved);
  if (!savedRows.length) return emptyFlexibleTakenTable();

  const rows: IngredientTakenRow[] = savedRows.map((entry, index) => {
    const rec = asRecord(entry) ?? {};
    const ingredientRaw = str(pickField(rec, "INGREDIENT", "ingredient"));
    const materialCodeRaw = str(pickField(rec, "materialCode", "MATERIAL_CODE"));
    const srRaw = pickField(rec, "srNo", "rowKey", "SR_NO");
    const srNo =
      str(srRaw).trim().toUpperCase() === "TOTAL"
        ? "TOTAL"
        : ((srRaw as string | number) ?? index + 1);
    const isTotal = isIngredientTotalRow(srNo, ingredientRaw);
    return {
      srNo: isTotal ? "TOTAL" : srNo,
      ingredient: isTotal ? "Total Quantity" : ingredientRaw,
      materialId: null,
      // Only honor explicit materialCode — free-text ingredient must not become a code.
      materialCode: isTotal ? null : materialCodeRaw || null,
      mfgLot: isTotal ? "" : str(pickField(rec, "MFG_LOT", "mfgLot", "Mfg Lot")),
      partsByWeight: isTotal ? "" : str(pickField(rec, "PARTS_BY_WEIGHT", "partsByWeight")),
      qtyTaken: str(pickField(rec, "QTY_TAKEN", "qtyTaken", "quantityTaken", "quantity")),
      qaRemarks: isTotal ? "" : pickLocationQaRemarks(rec),
    };
  });

  const hasTotal = rows.some((row) => isIngredientTotalRow(row.srNo, row.ingredient));
  if (!hasTotal) {
    const totalQty = rows.reduce((acc, row) => {
      const val = parseFloat(row.qtyTaken || "0");
      return !isNaN(val) ? acc + val : acc;
    }, 0);
    rows.push({
      srNo: "TOTAL",
      ingredient: "Total Quantity",
      materialId: null,
      materialCode: null,
      mfgLot: "",
      partsByWeight: "",
      qtyTaken: totalQty > 0 ? String(totalQty) : "",
    });
  }

  let n = 1;
  return rows.map((row) =>
    isIngredientTotalRow(row.srNo, row.ingredient)
      ? { ...row, srNo: "TOTAL", ingredient: "Total Quantity" }
      : { ...row, srNo: n++ },
  );
};

const mergeIngredientQuantityRows = (
  preset: IngredientQuantityRow[],
  saved: unknown,
): IngredientQuantityRow[] => {
  const savedRows = asArray(saved);
  if (!preset.length) {
    return parseIngredientQuantityRowsFromSaved(saved);
  }
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
    const savedCode = str(
      pickField(savedRow, "materialCode", "MATERIAL_CODE", "ingredient", "INGREDIENT"),
    );

    return {
      ...presetRow,
      materialCode: presetRow.materialCode ?? (savedCode || null),
      MFG_LOT: resolvedMfgLot,
      QUANTITY: resolvedQuantity,
      mfgLot: resolvedMfgLot,
      quantity: resolvedQuantity,
      qtyTaken: resolvedQuantity,
      qaRemarks: pickLocationQaRemarks(savedRow) || presetRow.qaRemarks || "",
    };
  });
};

const mergeIngredientTakenRows = (
  preset: IngredientTakenRow[],
  saved: unknown,
): IngredientTakenRow[] => {
  const savedRows = asArray(saved);
  if (!preset.length) {
    return parseIngredientTakenRowsFromSaved(saved);
  }
  return preset.map((presetRow, index) => {
    const savedRow = findSavedIngredientRow(savedRows, presetRow, index);
    const savedCode = str(
      pickField(savedRow, "materialCode", "MATERIAL_CODE", "ingredient", "INGREDIENT"),
    );
    return {
      ...presetRow,
      materialCode: presetRow.materialCode ?? (savedCode || null),
      mfgLot: str(pickField(savedRow, "MFG_LOT", "mfgLot", "Mfg Lot")) || presetRow.mfgLot,
      qtyTaken:
        str(pickField(savedRow, "QTY_TAKEN", "qtyTaken", "quantityTaken")) || presetRow.qtyTaken,
      qaRemarks: pickLocationQaRemarks(savedRow) || presetRow.qaRemarks || "",
    };
  });
};

const mergeQualificationRows = (preset: QualificationRow[], saved: unknown): QualificationRow[] => {
  const savedRows = asArray(saved);
  return preset.map((presetRow, index) => {
    const savedRow = asRecord(savedRows[index]) ?? {};
    const savedSpec = asRecord(pickField(savedRow, "SPECIFICATION", "specification")) ?? {};

    return {
      ...presetRow,
      specification: {
        min:
          savedSpec.min !== undefined && savedSpec.min !== null
            ? Number(savedSpec.min)
            : presetRow.specification.min,
        max:
          savedSpec.max !== undefined && savedSpec.max !== null
            ? Number(savedSpec.max)
            : presetRow.specification.max,
        unit: str(savedSpec.unit) || presetRow.specification.unit,
      },
      result: str(pickField(savedRow, "RESULT", "result")) || presetRow.result,
      qaRemarks: pickLocationQaRemarks(savedRow) || presetRow.qaRemarks || "",
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
          epoxyPreparationDate: postCureDateTimeForUi(
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
          qualificationPreparationDate: postCureDateTimeForUi(
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
          ir1PremixDate: postCureDateTimeForUi(
            pickField(premix, "IR1_PREMIX_DATE", "ir1PremixDate"),
          ),
          ir1PremixTable: mergeIngredientTakenRows(
            empty.ir1Premix.ir1PremixTable,
            pickField(premix, "IR1_PREMIX_TABLE", "ir1PremixTable"),
          ),
        },
        ir1FinalMix: {
          ir1FinalMixBatchNo: str(
            pickField(finalMix, "IR1_FINAL_MIX_BATCH_NO", "ir1FinalMixBatchNo"),
          ),
          ir1FinalMixDate: postCureDateTimeForUi(
            pickField(finalMix, "IR1_FINAL_MIX_DATE", "ir1FinalMixDate"),
          ),
          ir1FinalMixTable: mergeIngredientTakenRows(
            empty.ir1FinalMix.ir1FinalMixTable,
            pickField(finalMix, "IR1_FINAL_MIX_TABLE", "ir1FinalMixTable"),
          ),
        },
        ir1Qualification: {
          qualificationBatchNo: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          qualificationPreparationDate: postCureDateTimeForUi(
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
          qaRemarks: pickLocationQaRemarks(batch),
        },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: appRows.length
            ? appRows
            : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
        },
        dispatchDetails: {
          dispatchDate: postCureDateTimeForUi(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          dispatchStation: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
          qaRemarks: pickLocationQaRemarks(dispatch),
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
          hemcoatPremixDate: postCureDateTimeForUi(
            pickField(prep, "HEMCOAT_PREMIX_DATE", "hemcoatPremixDate"),
          ),
          premixPreparationTable: mergeIngredientTakenRows(
            empty.hemcoat3kPreparation.premixPreparationTable,
            pickField(prep, "PREMIX_PREPARATION_TABLE", "premixPreparationTable"),
          ),
        },
        hemcoat3kFinalMix: {
          hemcoatFinalMixBatchNo: str(
            pickField(finalMix, "HEMCOAT_FINAL_MIX_BATCH_NO", "hemcoatFinalMixBatchNo"),
          ),
          hemcoatFinalMixDate: postCureDateTimeForUi(
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
          qualificationPreparationDate: postCureDateTimeForUi(
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
          qaRemarks: pickLocationQaRemarks(batch),
        },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: appRows.length
            ? appRows
            : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
        },
        dispatchDetails: {
          dispatchDate: postCureDateTimeForUi(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          dispatchStation: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
          qaRemarks: pickLocationQaRemarks(dispatch),
        },
      };
    }
    case "inhibition-others": {
      const empty = createEmptyPostCureMotorData("inhibition-others") as InhibitionOthersMotorData;
      const premix = sectionDataRow(sections, "OTHERS_PREMIX");
      const finalMix = sectionDataRow(sections, "OTHERS_FINAL_MIX");
      const qual = sectionDataRow(sections, "OTHERS_QUALIFICATION");
      const batch = sectionDataRow(sections, "INHIBITION_BATCH_DETAILS");
      const app = sectionDataRow(sections, "INHIBITION_APPLICATION_DETAILS");
      const dispatch = sectionDataRow(sections, "DISPATCH_DETAILS");
      const appRows = parseLocationAppliedRows(
        pickField(app, "INHIBITION_APPLICATION_TABLE", "inhibitionApplicationTable"),
      );
      return {
        variant: "inhibition-others",
        othersPremix: {
          othersPremixBatchNo: str(
            pickField(premix, "OTHERS_PREMIX_BATCH_NO", "othersPremixBatchNo"),
          ),
          othersPremixDate: postCureDateTimeForUi(
            pickField(premix, "OTHERS_PREMIX_DATE", "othersPremixDate"),
          ),
          othersPremixTable: parseFlexibleIngredientTakenRowsFromSaved(
            pickField(premix, "OTHERS_PREMIX_TABLE", "othersPremixTable"),
          ),
        },
        othersFinalMix: {
          othersFinalMixBatchNo: str(
            pickField(finalMix, "OTHERS_FINAL_MIX_BATCH_NO", "othersFinalMixBatchNo"),
          ),
          othersFinalMixDate: postCureDateTimeForUi(
            pickField(finalMix, "OTHERS_FINAL_MIX_DATE", "othersFinalMixDate"),
          ),
          othersFinalMixTable: parseFlexibleIngredientTakenRowsFromSaved(
            pickField(finalMix, "OTHERS_FINAL_MIX_TABLE", "othersFinalMixTable"),
          ),
        },
        othersQualification: {
          qualificationBatchNo: str(
            pickField(qual, "QUALIFICATION_BATCH_NO", "qualificationBatchNo"),
          ),
          qualificationPreparationDate: postCureDateTimeForUi(
            pickField(qual, "QUALIFICATION_PREPARATION_DATE", "qualificationPreparationDate"),
          ),
          qualificationTable: mergeQualificationRows(
            empty.othersQualification.qualificationTable,
            pickField(qual, "QUALIFICATION_TABLE", "qualificationTable"),
          ),
          qualificationQcReport: parseFileRefs(
            pickField(qual, "QUALIFICATION_QC_REPORT", "qualificationQcReport"),
          ),
        },
        inhibitionBatchDetails: {
          inhibitorBatchNo: str(pickField(batch, "INHIBITOR_BATCH_NO", "inhibitorBatchNo")),
          inhibitorBatchSize: str(pickField(batch, "INHIBITOR_BATCH_SIZE", "inhibitorBatchSize")),
          qaRemarks: pickLocationQaRemarks(batch),
        },
        inhibitionApplicationDetails: {
          inhibitionApplicationTable: appRows.length
            ? appRows
            : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
        },
        dispatchDetails: {
          dispatchDate: postCureDateTimeForUi(pickField(dispatch, "DISPATCH_DATE", "dispatchDate")),
          dispatchStation: str(pickField(dispatch, "DISPATCH_STATION", "dispatchStation")),
          qaRemarks: pickLocationQaRemarks(dispatch),
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
    FROM_DATE: apiDateTimeOrUi(row.fromDate),
    TO_DATE: apiDateTimeOrUi(row.toDate),
    OBSERVATIONS: row.observations.trim() || undefined,
    ...(String(row.qaRemarks ?? "").trim() ? { QA_REMARKS: String(row.qaRemarks).trim() } : {}),
  }));

const payloadLocationQtyRows = (rows: LocationQtyRow[]) =>
  rows.map((row) => ({
    LOCATION: row.location,
    FROM_DATE: apiDateTimeOrUi(row.fromDate),
    TO_DATE: apiDateTimeOrUi(row.toDate),
    QTY_FILLED: toApiNumber(row.qtyFilled),
    OBSERVATIONS: row.observations.trim() || undefined,
    ...(String(row.qaRemarks ?? "").trim() ? { QA_REMARKS: String(row.qaRemarks).trim() } : {}),
  }));

const payloadLocationAppliedRows = (rows: LocationAppliedRow[]) =>
  rows.map((row) => ({
    LOCATION: row.location,
    FROM_DATE: apiDateTimeOrUi(row.fromDate),
    TO_DATE: apiDateTimeOrUi(row.toDate),
    QTY_APPLIED: toApiNumber(row.qtyApplied),
    OBSERVATIONS: row.observations.trim() || undefined,
    ...(String(row.qaRemarks ?? "").trim() ? { QA_REMARKS: String(row.qaRemarks).trim() } : {}),
  }));

/** Case Prep style: prefer master code in payload `ingredient` when known. */
const payloadIngredientValue = (row: {
  ingredient?: string;
  materialCode?: string | null;
}): string => {
  const code = str(row.materialCode).trim();
  const name = str(row.ingredient).trim();
  return code || name;
};

const payloadIngredientQuantityRows = (rows: IngredientQuantityRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    INGREDIENT: payloadIngredientValue(row),
    MFG_LOT: row.mfgLot.trim() || undefined,
    PARTS_BY_WEIGHT: row.partsByWeight,
    QUANTITY: toApiNumber(row.quantity),
    ...(String(row.qaRemarks ?? "").trim() ? { QA_REMARKS: String(row.qaRemarks).trim() } : {}),
  }));

const payloadIngredientTakenRows = (rows: IngredientTakenRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    INGREDIENT: payloadIngredientValue(row),
    MFG_LOT: row.mfgLot.trim() || undefined,
    PARTS_BY_WEIGHT: row.partsByWeight,
    QTY_TAKEN: toApiNumber(row.qtyTaken),
    ...(String(row.qaRemarks ?? "").trim() ? { QA_REMARKS: String(row.qaRemarks).trim() } : {}),
  }));

const payloadQualificationRows = (rows: QualificationRow[]) =>
  rows.map((row, index) => ({
    srNo: row.srNo ?? index + 1,
    PARAMETER: row.parameter,
    SPECIFICATION: formatSpecificationLabel(row.specification),
    RESULT: row.result ? String(row.result).trim() : undefined,
    ...(String(row.qaRemarks ?? "").trim() ? { QA_REMARKS: String(row.qaRemarks).trim() } : {}),
  }));

const makeSection = (
  sectionId: string,
  sectionData: Record<string, unknown>,
): LegacySectionSubmission => ({
  sectionId,
  sectionData: [sectionData],
});

const apiDateTimeOrUi = (value: string): string | undefined => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const dateTime = toApiDateTime(raw) ?? raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) return `${dateTime}T00:00:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) return `${dateTime}:00`;
  return dateTime;
};

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
  postCureDateTimeForUi(value) || str(value).trim();

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
    qaRemarks?: string;
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
      specification?: Specification;
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
    qaRemarks?: string;
  }>;
};

export type InhibitionDetailsApi = {
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "OTHERS" | "NOT_APPLICABLE";
  premixDetails?: {
    batchNo?: string;
    preparationDate?: string;
    ingredients?: Array<{
      rowKey?: string | number;
      ingredient?: string;
      materialCode?: string;
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
      materialCode?: string;
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
      specification?: Specification;
      result?: string;
    }>;
    qcReport?: FileIdPayload[] | string;
  };
  inhibitorBatchDetails?: {
    batchNo?: string;
    batchSize?: number;
    qaRemarks?: string;
  };
  applicationDetails?: Array<{
    location?: string;
    fromDate?: string;
    toDate?: string;
    quantityApplied?: number;
    observations?: string;
    qaRemarks?: string;
  }>;
  dispatchDetails?: {
    dispatchDate?: string;
    dispatchStation?: string;
    qaRemarks?: string;
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
      fromDate: apiDateTimeOrUi(row.fromDate),
      toDate: apiDateTimeOrUi(row.toDate),
      observations: row.observations.trim() || undefined,
      qaRemarks: String(row.qaRemarks ?? "").trim() || undefined,
    }),
  );

const mapLocationQtyRowsForApi = (rows: LocationQtyRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.location || undefined,
      fromDate: apiDateTimeOrUi(row.fromDate),
      toDate: apiDateTimeOrUi(row.toDate),
      quantityFilled: toApiNumber(row.qtyFilled),
      observations: row.observations.trim() || undefined,
      qaRemarks: String(row.qaRemarks ?? "").trim() || undefined,
    }),
  );

const mapLocationAppliedRowsForApi = (rows: LocationAppliedRow[]) =>
  rows.map((row) =>
    omitEmpty({
      location: row.location || undefined,
      fromDate: apiDateTimeOrUi(row.fromDate),
      toDate: apiDateTimeOrUi(row.toDate),
      quantityApplied: toApiNumber(row.qtyApplied),
      observations: row.observations.trim() || undefined,
      qaRemarks: String(row.qaRemarks ?? "").trim() || undefined,
    }),
  );

const ingredientRowKey = (srNo: string | number | undefined, index: number): string =>
  String(srNo ?? index + 1);

const mapIngredientQuantityRowsForApi = (rows: IngredientQuantityRow[]) =>
  rows.map((row, index) => {
    const isTotal = isIngredientTotalRow(row.srNo, row.ingredient);
    const base = {
      rowKey: ingredientRowKey(row.srNo, index),
      ingredient: payloadIngredientValue(row),
      quantityTaken: toApiNumber(row.quantity),
    };
    if (isTotal) {
      return omitEmpty(base);
    }
    return omitEmpty({
      ...base,
      mfgLot: row.mfgLot.trim() || undefined,
      partsByWeight: row.partsByWeight,
      qaRemarks: String(row.qaRemarks ?? "").trim() || undefined,
    });
  });

const mapIngredientTakenRowsForApi = (rows: IngredientTakenRow[]) =>
  rows.map((row, index) => {
    const isTotal = isIngredientTotalRow(row.srNo, row.ingredient);
    const name = str(row.ingredient).trim();
    const code = str(row.materialCode).trim();
    const base = {
      rowKey: ingredientRowKey(row.srNo, index),
      // Prefer display name so Others free-text / selected labels survive reload.
      ingredient: name || code,
      quantityTaken: toApiNumber(row.qtyTaken),
    };
    if (isTotal) {
      return omitEmpty(base);
    }
    return omitEmpty({
      ...base,
      materialCode: code || undefined,
      mfgLot: row.mfgLot.trim() || undefined,
      partsByWeight: row.partsByWeight?.trim() ? row.partsByWeight : undefined,
      qaRemarks: String(row.qaRemarks ?? "").trim() || undefined,
    });
  });

const mapQualificationParamsForApi = (rows: QualificationRow[]) =>
  rows.map((row) =>
    omitEmpty({
      srNo: row.srNo,
      parameter: row.parameter?.trim() || undefined,
      specification:
        omitEmpty({
          min: row.specification?.min ?? undefined,
          max: row.specification?.max ?? undefined,
          unit: row.specification?.unit?.trim() || undefined,
        }) || undefined,
      result: row.result.trim() || undefined,
      qaRemarks: String(row.qaRemarks ?? "").trim() || undefined,
    }),
  );

const buildLooseFlapFillingDetailsPayload = (
  data: LooseFlapMotorData,
): LooseFlapFillingDetailsApi => ({
  bellowRemovalDetails: mapLocationDateRowsForApi(data.bellowRemovalDetails.bellowRemovalTable),
  epoxyPreparationIngredients: omitEmpty({
    batchNo: data.looseFlapEpoxyPreparation.epoxyBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.looseFlapEpoxyPreparation.epoxyPreparationDate),
    parameters: mapIngredientQuantityRowsForApi(data.looseFlapEpoxyPreparation.preparationDetails),
  }) as LooseFlapFillingDetailsApi["epoxyPreparationIngredients"],
  qualificationDetails: omitEmpty({
    batchNo: data.qualificationDetails.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.qualificationDetails.qualificationPreparationDate),
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
    preparationDate: apiDateTimeOrUi(data.ir1Premix.ir1PremixDate),
    ingredients: mapIngredientTakenRowsForApi(data.ir1Premix.ir1PremixTable),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.ir1FinalMix.ir1FinalMixBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.ir1FinalMix.ir1FinalMixDate),
    ingredients: mapIngredientTakenRowsForApi(data.ir1FinalMix.ir1FinalMixTable),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.ir1Qualification.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.ir1Qualification.qualificationPreparationDate),
    parameters: mapQualificationParamsForApi(data.ir1Qualification.qualificationTable),
    qcReport: (() => {
      const files = toFileIdListPayload(data.ir1Qualification.qualificationQcReport);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
    batchSize: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchSize),
    qaRemarks: String(data.inhibitionBatchDetails.qaRemarks ?? "").trim() || undefined,
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.inhibitionApplicationDetails.inhibitionApplicationTable,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateTimeOrUi(data.dispatchDetails.dispatchDate),
    dispatchStation: data.dispatchDetails.dispatchStation.trim() || undefined,
    qaRemarks: String(data.dispatchDetails.qaRemarks ?? "").trim() || undefined,
  }) as InhibitionDetailsApi["dispatchDetails"],
});

const buildInhibitionHemcoatDetailsPayload = (
  data: InhibitionHemcoatMotorData,
): InhibitionDetailsApi => ({
  premixDetails: omitEmpty({
    batchNo: data.hemcoat3kPreparation.hemcoatPremixBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.hemcoat3kPreparation.hemcoatPremixDate),
    ingredients: mapIngredientTakenRowsForApi(data.hemcoat3kPreparation.premixPreparationTable),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.hemcoat3kFinalMix.hemcoatFinalMixBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.hemcoat3kFinalMix.hemcoatFinalMixDate),
    ingredients: mapIngredientTakenRowsForApi(data.hemcoat3kFinalMix.finalMixTable),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.hemcoat3kQualification.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.hemcoat3kQualification.qualificationPreparationDate),
    parameters: mapQualificationParamsForApi(data.hemcoat3kQualification.qualificationTable),
    qcReport: (() => {
      const files = toFileIdListPayload(data.hemcoat3kQualification.qualificationQcReport);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
    batchSize: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchSize),
    qaRemarks: String(data.inhibitionBatchDetails.qaRemarks ?? "").trim() || undefined,
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.inhibitionApplicationDetails.inhibitionApplicationTable,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateTimeOrUi(data.dispatchDetails.dispatchDate),
    dispatchStation: data.dispatchDetails.dispatchStation.trim() || undefined,
    qaRemarks: String(data.dispatchDetails.qaRemarks ?? "").trim() || undefined,
  }) as InhibitionDetailsApi["dispatchDetails"],
});

const buildInhibitionOthersDetailsPayload = (
  data: InhibitionOthersMotorData,
): InhibitionDetailsApi => ({
  premixDetails: omitEmpty({
    batchNo: data.othersPremix.othersPremixBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.othersPremix.othersPremixDate),
    ingredients: mapIngredientTakenRowsForApi(data.othersPremix.othersPremixTable),
  }) as InhibitionDetailsApi["premixDetails"],
  finalMixDetails: omitEmpty({
    batchNo: data.othersFinalMix.othersFinalMixBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.othersFinalMix.othersFinalMixDate),
    ingredients: mapIngredientTakenRowsForApi(data.othersFinalMix.othersFinalMixTable),
  }) as InhibitionDetailsApi["finalMixDetails"],
  qualificationDetails: omitEmpty({
    batchNo: data.othersQualification.qualificationBatchNo.trim() || undefined,
    preparationDate: apiDateTimeOrUi(data.othersQualification.qualificationPreparationDate),
    parameters: mapQualificationParamsForApi(data.othersQualification.qualificationTable),
    qcReport: (() => {
      const files = toFileIdListPayload(data.othersQualification.qualificationQcReport);
      return files.length ? files : undefined;
    })(),
  }) as InhibitionDetailsApi["qualificationDetails"],
  inhibitorBatchDetails: omitEmpty({
    batchNo: data.inhibitionBatchDetails.inhibitorBatchNo.trim() || undefined,
    batchSize: toApiNumber(data.inhibitionBatchDetails.inhibitorBatchSize),
    qaRemarks: String(data.inhibitionBatchDetails.qaRemarks ?? "").trim() || undefined,
  }) as InhibitionDetailsApi["inhibitorBatchDetails"],
  applicationDetails: mapLocationAppliedRowsForApi(
    data.inhibitionApplicationDetails.inhibitionApplicationTable,
  ),
  dispatchDetails: omitEmpty({
    dispatchDate: apiDateTimeOrUi(data.dispatchDetails.dispatchDate),
    dispatchStation: data.dispatchDetails.dispatchStation.trim() || undefined,
    qaRemarks: String(data.dispatchDetails.qaRemarks ?? "").trim() || undefined,
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
    case "inhibition-others":
      return { inhibitionDetails: buildInhibitionOthersDetailsPayload(data) };
    case "inhibition-not-applicable":
      return {
        inhibitionDetails: omitEmpty({
          inhibitorType: "NOT_APPLICABLE" as const,
          notApplicableRemarks: str(data.inhibitionNotApplicable?.remarks).trim() || undefined,
        }) as InhibitionDetailsApi,
      };
    default:
      return {};
  }
};

export type DualPostCureMotorPayload = PostCureMotorDetailsPayload & {
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "OTHERS" | "NOT_APPLICABLE";
};

export const buildDualPostCureMotorPayload = (session: {
  inhibitorType: string;
  looseFlapData: LooseFlapMotorData;
  inhibitionData: PostCureMotorData | null;
}): DualPostCureMotorPayload => {
  const payload: DualPostCureMotorPayload = {
    looseFlapFillingDetails: buildLooseFlapFillingDetailsPayload(session.looseFlapData),
  };

  const inhibitor = String(session.inhibitorType ?? "").trim();
  const upper = inhibitor.toUpperCase().replace(/[-\s]/g, "_");
  let apiInhibitor: DualPostCureMotorPayload["inhibitorType"];
  if (inhibitor === "IR1" || upper === "IR1") apiInhibitor = "IR1";
  else if (inhibitor === "Hemcoat-3K" || upper === "HEMCOAT_3K") apiInhibitor = "HEMCOAT_3K";
  else if (inhibitor === "Others" || upper === "OTHERS" || upper === "OTHER")
    apiInhibitor = "OTHERS";
  else if (inhibitor === "not-applicable" || upper === "NOT_APPLICABLE")
    apiInhibitor = "NOT_APPLICABLE";

  if (apiInhibitor) {
    payload.inhibitorType = apiInhibitor;
  }

  if (apiInhibitor && session.inhibitionData) {
    const inhibitionPayload = buildPostCureMotorDetailsPayload(session.inhibitionData);
    if (inhibitionPayload.inhibitionDetails) {
      payload.inhibitionDetails = {
        ...inhibitionPayload.inhibitionDetails,
        inhibitorType: apiInhibitor,
      };
    }
  }

  return payload;
};

const parseQualificationParamsFromApi = (
  preset: QualificationRow[],
  saved: unknown,
): QualificationRow[] =>
  // Same merge as sections hydrate — must round-trip QC qaRemarks from details API.
  mergeQualificationRows(preset, saved);

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
      epoxyPreparationDate: postCureDateTimeForUi(
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
      qualificationPreparationDate: postCureDateTimeForUi(
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
  // Legacy QC wire stored dispatchDate/dispatchStation flat on inhibitionDetails.
  const resolveDispatchDate = () =>
    postCureDateTimeForUi(
      pickField(dispatch, "dispatchDate", "DISPATCH_DATE") ||
        pickField(details, "dispatchDate", "DISPATCH_DATE"),
    );
  const resolveDispatchStation = () =>
    str(
      pickField(dispatch, "dispatchStation", "DISPATCH_STATION") ||
        pickField(details, "dispatchStation", "DISPATCH_STATION"),
    );
  const appRows = parseLocationAppliedRows(details.applicationDetails);

  if (variant === "inhibition-hemcoat-3k") {
    const empty = createEmptyPostCureMotorData(
      "inhibition-hemcoat-3k",
    ) as InhibitionHemcoatMotorData;
    return {
      variant: "inhibition-hemcoat-3k",
      hemcoat3kPreparation: {
        hemcoatPremixBatchNo: str(pickField(premix, "batchNo", "HEMCOAT_PREMIX_BATCH_NO")),
        hemcoatPremixDate: postCureDateTimeForUi(
          pickField(premix, "preparationDate", "HEMCOAT_PREMIX_DATE"),
        ),
        premixPreparationTable: mergeIngredientTakenRows(
          empty.hemcoat3kPreparation.premixPreparationTable,
          premix.ingredients ?? premix.parameters,
        ),
      },
      hemcoat3kFinalMix: {
        hemcoatFinalMixBatchNo: str(pickField(finalMix, "batchNo", "HEMCOAT_FINAL_MIX_BATCH_NO")),
        hemcoatFinalMixDate: postCureDateTimeForUi(
          pickField(finalMix, "preparationDate", "HEMCOAT_FINAL_MIX_DATE"),
        ),
        finalMixTable: mergeIngredientTakenRows(
          empty.hemcoat3kFinalMix.finalMixTable,
          finalMix.ingredients ?? finalMix.parameters,
        ),
      },
      hemcoat3kQualification: {
        qualificationBatchNo: str(pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO")),
        qualificationPreparationDate: postCureDateTimeForUi(
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
        qaRemarks: pickLocationQaRemarks(batch),
      },
      inhibitionApplicationDetails: {
        inhibitionApplicationTable: appRows.length
          ? appRows
          : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
      },
      dispatchDetails: {
        dispatchDate: resolveDispatchDate(),
        dispatchStation: resolveDispatchStation(),
        qaRemarks: pickLocationQaRemarks(dispatch),
      },
    };
  }

  if (variant === "inhibition-others") {
    const empty = createEmptyPostCureMotorData("inhibition-others") as InhibitionOthersMotorData;
    return {
      variant: "inhibition-others",
      othersPremix: {
        othersPremixBatchNo: str(pickField(premix, "batchNo", "OTHERS_PREMIX_BATCH_NO")),
        othersPremixDate: postCureDateTimeForUi(
          pickField(premix, "preparationDate", "OTHERS_PREMIX_DATE"),
        ),
        othersPremixTable: parseFlexibleIngredientTakenRowsFromSaved(
          premix.ingredients ?? premix.parameters,
        ),
      },
      othersFinalMix: {
        othersFinalMixBatchNo: str(pickField(finalMix, "batchNo", "OTHERS_FINAL_MIX_BATCH_NO")),
        othersFinalMixDate: postCureDateTimeForUi(
          pickField(finalMix, "preparationDate", "OTHERS_FINAL_MIX_DATE"),
        ),
        othersFinalMixTable: parseFlexibleIngredientTakenRowsFromSaved(
          finalMix.ingredients ?? finalMix.parameters,
        ),
      },
      othersQualification: {
        qualificationBatchNo: str(pickField(qual, "batchNo", "QUALIFICATION_BATCH_NO")),
        qualificationPreparationDate: postCureDateTimeForUi(
          pickField(qual, "preparationDate", "QUALIFICATION_PREPARATION_DATE"),
        ),
        qualificationTable: parseQualificationParamsFromApi(
          empty.othersQualification.qualificationTable,
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
        qaRemarks: pickLocationQaRemarks(batch),
      },
      inhibitionApplicationDetails: {
        inhibitionApplicationTable: appRows.length
          ? appRows
          : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
      },
      dispatchDetails: {
        dispatchDate: resolveDispatchDate(),
        dispatchStation: resolveDispatchStation(),
        qaRemarks: pickLocationQaRemarks(dispatch),
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
      ir1PremixDate: postCureDateTimeForUi(
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
      ir1FinalMixDate: postCureDateTimeForUi(
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
      qualificationPreparationDate: postCureDateTimeForUi(
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
      qaRemarks: pickLocationQaRemarks(batch),
    },
    inhibitionApplicationDetails: {
      inhibitionApplicationTable: appRows.length
        ? appRows
        : empty.inhibitionApplicationDetails.inhibitionApplicationTable,
    },
    dispatchDetails: {
      dispatchDate: resolveDispatchDate(),
      dispatchStation: resolveDispatchStation(),
      qaRemarks: pickLocationQaRemarks(dispatch),
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
          EPOXY_PREPARATION_DATE: apiDateTimeOrUi(
            data.looseFlapEpoxyPreparation.epoxyPreparationDate,
          ),
          PREPARATION_DETAILS: payloadIngredientQuantityRows(
            data.looseFlapEpoxyPreparation.preparationDetails,
          ),
        }),
        makeSection("QUALIFICATION_DETAILS", {
          QUALIFICATION_BATCH_NO:
            data.qualificationDetails.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateTimeOrUi(
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
          IR1_PREMIX_DATE: apiDateTimeOrUi(data.ir1Premix.ir1PremixDate),
          IR1_PREMIX_TABLE: payloadIngredientTakenRows(data.ir1Premix.ir1PremixTable),
        }),
        makeSection("IR1_FINAL_MIX", {
          IR1_FINAL_MIX_BATCH_NO: data.ir1FinalMix.ir1FinalMixBatchNo.trim() || undefined,
          IR1_FINAL_MIX_DATE: apiDateTimeOrUi(data.ir1FinalMix.ir1FinalMixDate),
          IR1_FINAL_MIX_TABLE: payloadIngredientTakenRows(data.ir1FinalMix.ir1FinalMixTable),
        }),
        makeSection("IR1_QUALIFICATION", {
          QUALIFICATION_BATCH_NO: data.ir1Qualification.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateTimeOrUi(
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
          DISPATCH_DATE: apiDateTimeOrUi(data.dispatchDetails.dispatchDate),
          DISPATCH_STATION: data.dispatchDetails.dispatchStation.trim() || undefined,
        }),
      ];
    case "inhibition-hemcoat-3k":
      return [
        makeSection("HEMCOAT_3K_PREPARATION", {
          HEMCOAT_PREMIX_BATCH_NO:
            data.hemcoat3kPreparation.hemcoatPremixBatchNo.trim() || undefined,
          HEMCOAT_PREMIX_DATE: apiDateTimeOrUi(data.hemcoat3kPreparation.hemcoatPremixDate),
          PREMIX_PREPARATION_TABLE: payloadIngredientTakenRows(
            data.hemcoat3kPreparation.premixPreparationTable,
          ),
        }),
        makeSection("HEMCOAT_3K_FINAL_MIX", {
          HEMCOAT_FINAL_MIX_BATCH_NO:
            data.hemcoat3kFinalMix.hemcoatFinalMixBatchNo.trim() || undefined,
          HEMCOAT_FINAL_MIX_DATE: apiDateTimeOrUi(data.hemcoat3kFinalMix.hemcoatFinalMixDate),
          FINAL_MIX_TABLE: payloadIngredientTakenRows(data.hemcoat3kFinalMix.finalMixTable),
        }),
        makeSection("HEMCOAT_3K_QUALIFICATION", {
          QUALIFICATION_BATCH_NO:
            data.hemcoat3kQualification.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateTimeOrUi(
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
          DISPATCH_DATE: apiDateTimeOrUi(data.dispatchDetails.dispatchDate),
          DISPATCH_STATION: data.dispatchDetails.dispatchStation.trim() || undefined,
        }),
      ];
    case "inhibition-others":
      return [
        makeSection("OTHERS_PREMIX", {
          OTHERS_PREMIX_BATCH_NO: data.othersPremix.othersPremixBatchNo.trim() || undefined,
          OTHERS_PREMIX_DATE: apiDateTimeOrUi(data.othersPremix.othersPremixDate),
          OTHERS_PREMIX_TABLE: payloadIngredientTakenRows(data.othersPremix.othersPremixTable),
        }),
        makeSection("OTHERS_FINAL_MIX", {
          OTHERS_FINAL_MIX_BATCH_NO: data.othersFinalMix.othersFinalMixBatchNo.trim() || undefined,
          OTHERS_FINAL_MIX_DATE: apiDateTimeOrUi(data.othersFinalMix.othersFinalMixDate),
          OTHERS_FINAL_MIX_TABLE: payloadIngredientTakenRows(
            data.othersFinalMix.othersFinalMixTable,
          ),
        }),
        makeSection("OTHERS_QUALIFICATION", {
          QUALIFICATION_BATCH_NO: data.othersQualification.qualificationBatchNo.trim() || undefined,
          QUALIFICATION_PREPARATION_DATE: apiDateTimeOrUi(
            data.othersQualification.qualificationPreparationDate,
          ),
          QUALIFICATION_TABLE: payloadQualificationRows(
            data.othersQualification.qualificationTable,
          ),
          QUALIFICATION_QC_REPORT: (() => {
            const files = toFileIdListPayload(data.othersQualification.qualificationQcReport);
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
          DISPATCH_DATE: apiDateTimeOrUi(data.dispatchDetails.dispatchDate),
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
  if (data.variant === "inhibition-others") {
    return data.othersQualification?.qualificationQcReport ?? [];
  }
  return [];
};

export type PostCureMotorFileSource = {
  looseFlapData?: LooseFlapMotorData | null;
  inhibitionData?: PostCureMotorData | null;
  postCureData?: PostCureMotorData | null;
};

export const collectPostCureFileRefsFromMotorSession = (
  motor: PostCureMotorFileSource | null | undefined,
): FileRef[] => {
  if (!motor) return [];
  const refs: FileRef[] = [];
  if (motor.looseFlapData) {
    refs.push(...collectPostCureFileRefsFromMotorData(motor.looseFlapData));
  }
  if (motor.inhibitionData) {
    refs.push(...collectPostCureFileRefsFromMotorData(motor.inhibitionData));
  }
  if (motor.postCureData) {
    refs.push(...collectPostCureFileRefsFromMotorData(motor.postCureData));
  }
  return refs;
};

export const collectPostCureFileRefsFromForm = (form: {
  motors?: Array<PostCureMotorFileSource | null | undefined>;
}): FileRef[] => {
  const refs: FileRef[] = [];
  for (const motor of form?.motors ?? []) {
    refs.push(...collectPostCureFileRefsFromMotorSession(motor));
  }
  return refs;
};

export const hasIncompletePostCureUploads = (form: {
  motors?: Array<PostCureMotorFileSource | null | undefined>;
}): boolean => collectPostCureFileRefsFromForm(form).some(isFileUploadIncomplete);

export const collectTempFileIdsFromPostCureForm = (form: {
  motors?: Array<PostCureMotorFileSource | null | undefined>;
}): string[] => [
  ...new Set(
    collectPostCureFileRefsFromForm(form)
      .filter((ref) => ref.isTemp !== false)
      .map((ref) => String(ref.fileId ?? "").trim())
      .filter(Boolean),
  ),
];

/** Preset/shell keys — not treated as user-entered content (align with Case Prep). */
const META_KEYS = new Set([
  "type",
  "label",
  "readonly",
  "srNo",
  "SR_NO",
  "_readonly",
  "_rowType",
  "variant",
  "location",
  "parameter",
  "specification",
  "ingredient",
  "materialId",
  "materialCode",
  "materialName",
  "partsByWeight",
  "operation",
  "valueFieldType",
  "mfgLot",
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

export const postCureMotorDataHasUserInput = (
  data: PostCureMotorData | null | undefined,
): boolean => Boolean(data && hasUserContent(data));

/** True when mix-table rows already have editable qty / lot / remarks (not just recipe labels). */
export const postCureIngredientRowsHaveUserInput = (
  rows: unknown[] | null | undefined,
  qtyKey: "quantity" | "qtyTaken" = "quantity",
): boolean => {
  if (!Array.isArray(rows) || !rows.length) return false;
  return rows.some((row) => {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
    if (!rec) return false;
    const qty = String(rec[qtyKey] ?? rec.quantity ?? rec.qtyTaken ?? "").trim();
    const lot = String(rec.mfgLot ?? rec.MFG_LOT ?? "").trim();
    const remarks = String(rec.qaRemarks ?? rec.remarks ?? "").trim();
    return Boolean(qty || lot || remarks);
  });
};

export const resolvePostCureDataVariant = (
  operation: string,
  inhibitorType: string,
): PostCureDataVariant | null => {
  const op = String(operation ?? "")
    .trim()
    .toLowerCase();
  if (op === "loose-flap-filling") return "loose-flap-filling";
  if (op !== "inhibition") return null;
  return resolveInhibitionVariantFromInhibitorType(inhibitorType);
};

export const resolveInhibitionVariantFromInhibitorType = (
  inhibitorType: string,
): PostCureDataVariant | null => {
  const inhibitor = String(inhibitorType ?? "").trim();
  const upper = inhibitor.toUpperCase().replace(/[-\s]/g, "_");
  if (inhibitor === "IR1" || upper === "IR1") return "inhibition-ir1";
  if (inhibitor === "Hemcoat-3K" || upper === "HEMCOAT_3K") return "inhibition-hemcoat-3k";
  if (inhibitor === "Others" || upper === "OTHERS" || upper === "OTHER") return "inhibition-others";
  if (inhibitor === "not-applicable" || upper === "NOT_APPLICABLE")
    return "inhibition-not-applicable";
  return null;
};

export const isPostCureInhibitionDetailsRequired = (inhibitorType: string): boolean => {
  const variant = resolveInhibitionVariantFromInhibitorType(inhibitorType);
  return (
    variant === "inhibition-ir1" ||
    variant === "inhibition-hemcoat-3k" ||
    variant === "inhibition-others"
  );
};

/** True when any inhibition panel should show (IR1, Hemcoat, or Not Applicable remarks). */
export const isPostCureInhibitionPanelVisible = (inhibitorType: string): boolean =>
  resolveInhibitionVariantFromInhibitorType(inhibitorType) != null;

export const parseLooseFlapMotorDataFromApi = (
  motor: Record<string, unknown> | null | undefined,
): LooseFlapMotorData => {
  const parsed = parsePostCureMotorDataFromApi(motor, "loose-flap-filling");
  return parsed.variant === "loose-flap-filling"
    ? parsed
    : (createEmptyPostCureMotorData("loose-flap-filling") as LooseFlapMotorData);
};

/**
 * When API strips / omits inhibitorType, infer UI variant from nested payload shape
 * (premix / qualification / N/A remarks) so reopen still hydrates the Inhibition tab.
 */
export const inferInhibitorTypeFromInhibitionDetails = (
  details: Record<string, unknown> | null | undefined,
): string => {
  const rec = asRecord(details);
  if (!rec || Object.keys(rec).length === 0) return "";

  const nestedType = str(pickField(rec, "inhibitorType", "INHIBITOR_TYPE"));
  if (resolveInhibitionVariantFromInhibitorType(nestedType)) return nestedType;

  const remarks = str(pickField(rec, "notApplicableRemarks", "REMARKS", "remarks"));
  const hasPremix = Boolean(asRecord(rec.premixDetails));
  const hasFinal = Boolean(asRecord(rec.finalMixDetails));
  const hasQual = Boolean(asRecord(rec.qualificationDetails));
  const hasApp = Array.isArray(rec.applicationDetails)
    ? rec.applicationDetails.length > 0
    : Boolean(asRecord(rec.applicationDetails));
  const hasBatch = Boolean(asRecord(rec.inhibitorBatchDetails));
  const hasDispatch = Boolean(
    asRecord(rec.dispatchDetails) ||
    str(pickField(rec, "dispatchDate", "DISPATCH_DATE")) ||
    str(pickField(rec, "dispatchStation", "DISPATCH_STATION")),
  );

  // Remarks-only / N/A shell (no mix/qual/application body).
  if (remarks && !hasPremix && !hasFinal && !hasQual && !hasApp && !hasBatch) {
    return "not-applicable";
  }

  const premix = asRecord(rec.premixDetails) ?? {};
  const finalMix = asRecord(rec.finalMixDetails) ?? {};
  const qual = asRecord(rec.qualificationDetails) ?? {};
  const blob = JSON.stringify({ premix, finalMix, qual }).toUpperCase();
  if (blob.includes("HEMCOAT")) return "Hemcoat-3K";
  if (blob.includes("OTHERS_") || blob.includes('"OTHERS')) return "Others";

  if (hasPremix || hasFinal || hasQual || hasApp || hasBatch || hasDispatch || remarks) {
    return "IR1";
  }
  return "";
};

export const parseInhibitionMotorDataFromApi = (
  motor: Record<string, unknown> | null | undefined,
  inhibitorType: string,
): PostCureMotorData | null => {
  const details = asRecord(motor?.inhibitionDetails) ?? {};
  const resolvedType =
    String(inhibitorType ?? "").trim() ||
    str(pickField(details, "inhibitorType", "INHIBITOR_TYPE")) ||
    str(pickField(asRecord(motor) ?? {}, "inhibitorType", "INHIBITOR_TYPE")) ||
    inferInhibitorTypeFromInhibitionDetails(details);
  const variant = resolveInhibitionVariantFromInhibitorType(resolvedType);
  if (!variant) return null;
  if (variant === "inhibition-not-applicable") {
    return {
      variant: "inhibition-not-applicable",
      inhibitionNotApplicable: {
        remarks: str(pickField(details, "notApplicableRemarks", "REMARKS", "remarks")),
      },
    };
  }
  if (!motor?.inhibitionDetails) return null;
  return parsePostCureMotorDataFromApi(motor, variant);
};

const formatSpecificationLabel = (spec: any): string => {
  if (!spec) return "";
  if (typeof spec === "string") return spec; // Fallback if it's already a string

  const { min, max, unit } = spec;
  let label = "";

  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    label = `${min} - ${max}`;
  } else if (min !== null && min !== undefined) {
    label = `>= ${min}`;
  } else if (max !== null && max !== undefined) {
    label = `<= ${max}`;
  }

  return `${label}${unit ? ` ${unit}` : ""}`.trim();
};
