import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import { mapSubscaleBatchType } from "@/data/models/user/subscaleBatchType";

export const HARDWARE_SECTION_ID = "HARDWARE_PREPARATION_DETAILS";
export const ARTICLE_TYPE_TABLE_ID = "ARTICLE_TYPE_TABLE";
export const HARDWARE_ARTICLE_SELECTIONS_ID = "HARDWARE_ARTICLE_SELECTIONS";

/** @deprecated Legacy hardcoded count fields — kept for old form hydration only. */
export const HARDWARE_COUNT_FIELDS = [
  { id: "NO_OF_40KG_BEMS", label: "No. of 40 kg BEMs" },
  { id: "NO_OF_10KG_BEMS", label: "Number of 10 kg BEMs" },
  { id: "NO_OF_2KG_BEMS", label: "Number of 2 kg BEMs" },
  { id: "NO_OF_WHEEL_PEEL", label: "No. of Wheel Peel" },
  { id: "NO_OF_SBS_TBS", label: "No. of SBS/TBS" },
  { id: "NO_OF_CARTOONS", label: "No of Cartoons" },
] as const;

export const LINER_TYPE_FIELD = {
  id: "LINER_TYPE",
  label: "Liner Type",
} as const;

export const LINER_BATCH_NO_FIELD = {
  id: "LINER_BATCH_NO",
  label: "Batch No.",
} as const;

export const LINER_BATCH_DATE_FIELD = {
  id: "LINER_BATCH_DATE",
  label: "Batch Date",
} as const;

export const LINER_TYPE_OPTIONS = [
  { label: "HEMCOAT - 3L", value: "HEMCOAT - 3L" },
  { label: "PEDCOAT", value: "PEDCOAT" },
  { label: "HEMCOAT - 3M", value: "HEMCOAT - 3M" },
  { label: "QE based", value: "QE based" },
];

/** @deprecated Legacy count→type mapping for old records. */
export const ARTICLE_TYPE_SPECS = [
  { countField: "NO_OF_40KG_BEMS", articleType: "40 kg BEM" },
  { countField: "NO_OF_10KG_BEMS", articleType: "10 kg BEM" },
  { countField: "NO_OF_2KG_BEMS", articleType: "2 kg BEM" },
  { countField: "NO_OF_WHEEL_PEEL", articleType: "Wheel Peel" },
  { countField: "NO_OF_SBS_TBS", articleType: "SBS/TBS" },
  { countField: "NO_OF_CARTOONS", articleType: "Cartoons" },
] as const;

export const RUBBER_MATERIAL_OPTIONS = ["EPDM", "NBR"] as const;

export type HardwareArticleSelection = {
  subscaleArticleId: number;
  subscaleArticleCode: string;
  subscaleArticleName: string;
  noOfArticles: number;
  noOfParts: number;
};

export type HardwareArticleOption = {
  subscaleArticleId: number;
  subscaleArticleCode: string;
  subscaleArticleName: string;
};

export type ArticleTypeRow = {
  SR_NO: number;
  ARTICLE_TYPE: string;
  RUBBER_MATERIAL: string;
  SLEEVE_NO: string;
  MOULD_NO: string;
  SIZE_MM: string;
  THICKNESS_MM: string;
  LINER_APPLIED: string;
  OBSERVATIONS: string;
  _articleKey?: string;
  _articleIndex?: number;
};

const emptyArticleRow = (
  articleType: string,
  articleKey: string,
  articleIndex: number,
  srNo: number,
  existing?: Partial<ArticleTypeRow>,
): ArticleTypeRow => ({
  SR_NO: srNo,
  ARTICLE_TYPE: articleType,
  RUBBER_MATERIAL: existing?.RUBBER_MATERIAL ?? "",
  SLEEVE_NO: existing?.SLEEVE_NO ?? "",
  MOULD_NO: existing?.MOULD_NO ?? "",
  SIZE_MM: existing?.SIZE_MM ?? "",
  THICKNESS_MM: existing?.THICKNESS_MM ?? "",
  LINER_APPLIED: existing?.LINER_APPLIED ?? "",
  OBSERVATIONS: existing?.OBSERVATIONS ?? "",
  _articleKey: articleKey,
  _articleIndex: articleIndex,
});

export const parseCount = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

const isTextFieldFilled = (value: unknown) => String(value ?? "").trim().length > 0;

export const getHardwareArticleSelections = (
  values: SchemaFormValues,
): HardwareArticleSelection[] => {
  const raw = values[HARDWARE_ARTICLE_SELECTIONS_ID];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = (item ?? {}) as Partial<HardwareArticleSelection>;
      return {
        subscaleArticleId: Number(row.subscaleArticleId ?? 0),
        subscaleArticleCode: String(row.subscaleArticleCode ?? "").trim(),
        subscaleArticleName: String(row.subscaleArticleName ?? "").trim(),
        noOfArticles: parseCount(row.noOfArticles),
        noOfParts: parseCount(row.noOfParts),
      };
    })
    .filter((row) => row.subscaleArticleName && row.noOfArticles > 0);
};

/** Hardware prep is complete when ≥1 article selection and liner fields are filled. */
export const isHardwarePreparationComplete = (values: SchemaFormValues) =>
  getHardwareArticleSelections(values).length > 0 &&
  isTextFieldFilled(values[LINER_TYPE_FIELD.id]) &&
  isTextFieldFilled(values[LINER_BATCH_NO_FIELD.id]) &&
  isTextFieldFilled(values[LINER_BATCH_DATE_FIELD.id]);

export const isMainScaleSubscaleBatch = (batchType?: string | null) =>
  mapSubscaleBatchType(batchType) === "MAIN_SCALE";

export const isSubscaleProcessingBatch = (batchType?: string | null) =>
  mapSubscaleBatchType(batchType) === "SUBSCALE";

export const getSubscaleProcessingLabel = (batchType?: string | null) =>
  isMainScaleSubscaleBatch(batchType) ? "Main Scale Processing" : "Subscale Processing";

/** Expand selections into process-table article type labels (1 label per noOfArticles). */
export const getArticleTypesFromSelections = (values: SchemaFormValues): string[] => {
  const types: string[] = [];
  getHardwareArticleSelections(values).forEach((selection) => {
    for (let i = 0; i < selection.noOfArticles; i += 1) {
      types.push(selection.subscaleArticleName);
    }
  });
  return types;
};

export type TrimmingTableRow = {
  SR_NO: number;
  ARTICLE_TYPE: string;
  BEM_NO: string;
  HE_OD: string;
  HE_PORT_INNER: string;
  HE_PORT_OUTER: string;
  HE_BEFORE_INHIBITION_INNER: string;
  HE_BEFORE_INHIBITION_OUTER: string;
  NE_OD: string;
  NE_PORT_INNER: string;
  NE_PORT_OUTER: string;
  NE_WEB_INNER: string;
  NE_WEB_OUTER: string;
  LENGTH_BEFORE_INHIBITION: string;
};

/** Resolve No. of Parts for a casting article type from hardware selections. */
const getNoOfPartsForArticleType = (values: SchemaFormValues, articleType: string): number => {
  const name = String(articleType ?? "").trim();
  if (!name) return 0;
  const selection = getHardwareArticleSelections(values).find(
    (row) => row.subscaleArticleName === name,
  );
  return selection?.noOfParts ?? 0;
};

/**
 * Build trimming rows from casting BEM Nos + hardware No. of Parts:
 * - parts <= 0 / missing → one row: `{castingBemNo}`
 * - parts === 1 → one row: `{castingBemNo}/P1`
 * - parts > 1 → n rows: `{castingBemNo}/P1` … `/Pn`
 * Existing measurement cells are preserved when BEM_NO matches.
 */
export const buildTrimmingRowsFromCasting = (
  values: SchemaFormValues,
  existingTrimmingRows?: Partial<TrimmingTableRow>[],
): TrimmingTableRow[] => {
  const castingRows = Array.isArray(values.CASTING_TABLE)
    ? (values.CASTING_TABLE as Record<string, unknown>[])
    : [];
  const existingByBemNo = new Map<string, Partial<TrimmingTableRow>>();
  (existingTrimmingRows ?? []).forEach((row) => {
    const bemNo = String(row?.BEM_NO ?? "").trim();
    if (bemNo) existingByBemNo.set(bemNo, row);
  });

  const rows: TrimmingTableRow[] = [];
  let srNo = 1;

  castingRows.forEach((casting) => {
    const baseBemNo = String(casting?.BEM_NO ?? "").trim();
    if (!baseBemNo) return;

    const articleType = String(casting?.ARTICLE_TYPE ?? "");
    const parts = getNoOfPartsForArticleType(values, articleType);

    const bemNos: string[] =
      parts <= 0
        ? [baseBemNo]
        : Array.from({ length: parts }, (_, i) => `${baseBemNo}/P${i + 1}`);

    bemNos.forEach((bemNo) => {
      const existing = existingByBemNo.get(bemNo);
      rows.push({
        SR_NO: srNo,
        ARTICLE_TYPE: articleType,
        BEM_NO: bemNo,
        HE_OD: String(existing?.HE_OD ?? ""),
        HE_PORT_INNER: String(existing?.HE_PORT_INNER ?? ""),
        HE_PORT_OUTER: String(existing?.HE_PORT_OUTER ?? ""),
        HE_BEFORE_INHIBITION_INNER: String(existing?.HE_BEFORE_INHIBITION_INNER ?? ""),
        HE_BEFORE_INHIBITION_OUTER: String(existing?.HE_BEFORE_INHIBITION_OUTER ?? ""),
        NE_OD: String(existing?.NE_OD ?? ""),
        NE_PORT_INNER: String(existing?.NE_PORT_INNER ?? ""),
        NE_PORT_OUTER: String(existing?.NE_PORT_OUTER ?? ""),
        NE_WEB_INNER: String(existing?.NE_WEB_INNER ?? ""),
        NE_WEB_OUTER: String(existing?.NE_WEB_OUTER ?? ""),
        LENGTH_BEFORE_INHIBITION: String(existing?.LENGTH_BEFORE_INHIBITION ?? ""),
      });
      srNo += 1;
    });
  });

  return rows;
};

/** Aligns with backend BemArticleTypeUtil — BEM sizes / names containing BEM. */
const ELIGIBLE_BEM_ARTICLE_TYPES = new Set([
  "40KGBEM",
  "20KGBEM",
  "10KGBEM",
  "2KGBEM",
  "BEM40KG",
  "BEM20KG",
  "BEM10KG",
  "BEM2KG",
]);

export const isEligibleBemArticleType = (articleType: unknown): boolean => {
  const raw = String(articleType ?? "").trim();
  if (!raw) return false;
  const normalized = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (ELIGIBLE_BEM_ARTICLE_TYPES.has(normalized)) return true;
  return normalized.includes("BEM") || normalized.includes("BALLISTICEVALUATIONMOTOR");
};

export type StaticTestingTableRow = {
  SR_NO: number;
  ARTICLE_TYPE: string;
  BEM_NO: string;
  PROPELLANT_MASS: string;
  DT: string;
  WEB_THICKNESS: string;
  N_VALUE: string;
  PRESSURE_AVG: string;
  THRUST_AVG: string;
  BURN_RATE: string;
  GRAPH_UPLOAD: File | null | unknown;
};

/**
 * Build Static Testing Of BEM rows from Trimming part IDs for BEM article types only.
 * Existing measurement/graph cells are preserved when BEM_NO matches.
 */
export const buildStaticTestingRowsFromTrimming = (
  values: SchemaFormValues,
  existingStaticRows?: Partial<StaticTestingTableRow>[],
): StaticTestingTableRow[] => {
  const trimmingRows = Array.isArray(values.TRIMMING_TABLE)
    ? (values.TRIMMING_TABLE as Record<string, unknown>[])
    : [];
  const existingByBemNo = new Map<string, Partial<StaticTestingTableRow>>();
  (existingStaticRows ?? []).forEach((row) => {
    const bemNo = String(row?.BEM_NO ?? "").trim();
    if (bemNo) existingByBemNo.set(bemNo, row);
  });

  const rows: StaticTestingTableRow[] = [];
  let srNo = 1;

  trimmingRows.forEach((trim) => {
    const articleType = String(trim?.ARTICLE_TYPE ?? "");
    if (!isEligibleBemArticleType(articleType)) return;

    const bemNo = String(trim?.BEM_NO ?? "").trim();
    if (!bemNo) return;

    const existing = existingByBemNo.get(bemNo);
    rows.push({
      SR_NO: srNo,
      ARTICLE_TYPE: articleType,
      BEM_NO: bemNo,
      PROPELLANT_MASS: String(existing?.PROPELLANT_MASS ?? ""),
      DT: String(existing?.DT ?? ""),
      WEB_THICKNESS: String(existing?.WEB_THICKNESS ?? ""),
      N_VALUE: String(existing?.N_VALUE ?? ""),
      PRESSURE_AVG: String(existing?.PRESSURE_AVG ?? ""),
      THRUST_AVG: String(existing?.THRUST_AVG ?? ""),
      BURN_RATE: String(existing?.BURN_RATE ?? ""),
      GRAPH_UPLOAD: existing?.GRAPH_UPLOAD ?? null,
    });
    srNo += 1;
  });

  return rows;
};

export const buildArticleTypeRows = (
  values: SchemaFormValues,
  existingRows?: ArticleTypeRow[],
): ArticleTypeRow[] => {
  const rows: ArticleTypeRow[] = [];
  let srNo = 1;

  getHardwareArticleSelections(values).forEach((selection) => {
    const articleKey = selection.subscaleArticleCode || selection.subscaleArticleName;
    for (let index = 0; index < selection.noOfArticles; index += 1) {
      const existing = existingRows?.find(
        (row) => row._articleKey === articleKey && row._articleIndex === index,
      );
      rows.push(
        emptyArticleRow(selection.subscaleArticleName, articleKey, index, srNo, existing),
      );
      srNo += 1;
    }
  });

  // Legacy fallback: old forms with hardcoded count fields and no selections
  if (rows.length === 0) {
    ARTICLE_TYPE_SPECS.forEach(({ countField, articleType }) => {
      const count = parseCount(values[countField]);
      for (let index = 0; index < count; index += 1) {
        const existing = existingRows?.find(
          (row) => row._articleKey === countField && row._articleIndex === index,
        );
        rows.push(emptyArticleRow(articleType, countField, index, srNo, existing));
        srNo += 1;
      }
    });
  }

  return rows;
};

export const syncHardwareArticleTable = (values: SchemaFormValues): SchemaFormValues => {
  if (!isHardwarePreparationComplete(values) && getHardwareArticleSelections(values).length === 0) {
    // Still allow legacy count-only completion during hydration
    const hasLegacyCounts = ARTICLE_TYPE_SPECS.some(
      ({ countField }) => parseCount(values[countField]) > 0,
    );
    if (!hasLegacyCounts) {
      return { ...values, [ARTICLE_TYPE_TABLE_ID]: [] };
    }
  }

  if (
    getHardwareArticleSelections(values).length === 0 &&
    !ARTICLE_TYPE_SPECS.some(({ countField }) => parseCount(values[countField]) > 0)
  ) {
    return { ...values, [ARTICLE_TYPE_TABLE_ID]: [] };
  }

  if (
    getHardwareArticleSelections(values).length > 0 &&
    (!isTextFieldFilled(values[LINER_TYPE_FIELD.id]) ||
      !isTextFieldFilled(values[LINER_BATCH_NO_FIELD.id]) ||
      !isTextFieldFilled(values[LINER_BATCH_DATE_FIELD.id]))
  ) {
    return { ...values, [ARTICLE_TYPE_TABLE_ID]: [] };
  }

  const existingRows = Array.isArray(values[ARTICLE_TYPE_TABLE_ID])
    ? (values[ARTICLE_TYPE_TABLE_ID] as ArticleTypeRow[])
    : undefined;

  return {
    ...values,
    [ARTICLE_TYPE_TABLE_ID]: buildArticleTypeRows(values, existingRows),
  };
};

export const createDefaultHardwareValues = (): SchemaFormValues => ({
  [LINER_TYPE_FIELD.id]: "",
  [HARDWARE_ARTICLE_SELECTIONS_ID]: [],
  [ARTICLE_TYPE_TABLE_ID]: [],
});

export const mergeHardwareFormValues = (values: SchemaFormValues): SchemaFormValues => {
  const merged = {
    ...createDefaultHardwareValues(),
    ...values,
  };
  if (!Array.isArray(merged[HARDWARE_ARTICLE_SELECTIONS_ID])) {
    merged[HARDWARE_ARTICLE_SELECTIONS_ID] = [];
  }
  if (merged.IS_PROCESS_FORM_LOADED) {
    return merged;
  }
  return syncHardwareArticleTable(merged);
};

export const schemaHasHardwareSection = (
  schema: { data?: { sections?: { id: string }[] } } | null,
) => Boolean(schema?.data?.sections?.some((section) => section.id === HARDWARE_SECTION_ID));

/** Build synthetic selections from legacy hardcoded count fields (old saved forms). */
export const synthesizeSelectionsFromLegacyCounts = (
  values: SchemaFormValues,
): HardwareArticleSelection[] => {
  if (getHardwareArticleSelections(values).length > 0) {
    return getHardwareArticleSelections(values);
  }
  const selections: HardwareArticleSelection[] = [];
  ARTICLE_TYPE_SPECS.forEach(({ countField, articleType }, index) => {
    const count = parseCount(values[countField]);
    if (count <= 0) return;
    selections.push({
      subscaleArticleId: -(index + 1),
      subscaleArticleCode: countField,
      subscaleArticleName: articleType,
      noOfArticles: count,
      noOfParts: 0,
    });
  });
  return selections;
};
