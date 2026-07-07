import type { SchemaFormValues } from "../../../schema-engine";
import { mapSubscaleBatchType } from "../../../schema-engine/adapters/subscale.adapter";

export const HARDWARE_SECTION_ID = "HARDWARE_PREPARATION_DETAILS";
export const ARTICLE_TYPE_TABLE_ID = "ARTICLE_TYPE_TABLE";

export const HARDWARE_COUNT_FIELDS = [
  { id: "NO_OF_40KG_BEMS", label: "No. of 40 kg BEMs" },
  { id: "NO_OF_10KG_BEMS", label: "Number of 10 kg BEMs" },
  { id: "NO_OF_2KG_BEMS", label: "Number of 2 kg BEMs" },
  { id: "NO_OF_WHEEL_PEEL", label: "No. of Wheel Peel" },
  { id: "NO_OF_SBS_TBS", label: "No. of SBS/TBS" },
] as const;

export const LINER_TYPE_FIELD = {
  id: "LINER_TYPE_AND_BATCH",
  label: "Liner Type and Batch",
} as const;

export const ARTICLE_TYPE_SPECS = [
  { countField: "NO_OF_40KG_BEMS", articleType: "40 kg BEM" },
  { countField: "NO_OF_10KG_BEMS", articleType: "10 kg BEM" },
  { countField: "NO_OF_2KG_BEMS", articleType: "2 kg BEM" },
  { countField: "NO_OF_WHEEL_PEEL", articleType: "Wheel Peel" },
  { countField: "NO_OF_SBS_TBS", articleType: "SBS/TBS" },
] as const;

export const ARTICLE_TYPE_EXTRA_OPTIONS = [
  "Ballistic Evaluation motor",
  "Wheel peels",
  "Cartons",
  "Control grains",
] as const;

export const ARTICLE_TYPE_DROPDOWN_OPTIONS = [
  ...ARTICLE_TYPE_SPECS.map((spec) => spec.articleType),
  ...ARTICLE_TYPE_EXTRA_OPTIONS,
];

export const RUBBER_MATERIAL_OPTIONS = ["EPDM", "NBR"] as const;

export type ArticleTypeRow = {
  SR_NO: number;
  ARTICLE_TYPE: string;
  RUBBER_MATERIAL: string;
  SLEEVE_NO: string;
  MOULD_NO: string;
  LENGTH_MM: string;
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
  LENGTH_MM: existing?.LENGTH_MM ?? "",
  THICKNESS_MM: existing?.THICKNESS_MM ?? "",
  LINER_APPLIED: existing?.LINER_APPLIED ?? "",
  OBSERVATIONS: existing?.OBSERVATIONS ?? "",
  _articleKey: articleKey,
  _articleIndex: articleIndex,
});

const parseCount = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

const isCountFieldFilled = (value: unknown) => {
  if (value === null || value === undefined || value === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

const isTextFieldFilled = (value: unknown) => String(value ?? "").trim().length > 0;

export const isHardwarePreparationComplete = (values: SchemaFormValues) =>
  HARDWARE_COUNT_FIELDS.every((field) => isCountFieldFilled(values[field.id])) &&
  isTextFieldFilled(values[LINER_TYPE_FIELD.id]);

export const isMainScaleSubscaleBatch = (batchType?: string | null) =>
  mapSubscaleBatchType(batchType) === "MAIN_SCALE";

export const isSubscaleProcessingBatch = (batchType?: string | null) =>
  mapSubscaleBatchType(batchType) === "SUBSCALE";

export const getSubscaleProcessingLabel = (batchType?: string | null) =>
  isMainScaleSubscaleBatch(batchType) ? "Main Scale Processing" : "Subscale Processing";

export const buildArticleTypeRows = (
  values: SchemaFormValues,
  existingRows?: ArticleTypeRow[],
): ArticleTypeRow[] => {
  const rows: ArticleTypeRow[] = [];
  let srNo = 1;

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

  return rows;
};

export const syncHardwareArticleTable = (values: SchemaFormValues): SchemaFormValues => {
  if (!isHardwarePreparationComplete(values)) {
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

export const createDefaultHardwareValues = (): SchemaFormValues => {
  const defaults: SchemaFormValues = {
    [LINER_TYPE_FIELD.id]: "",
  };

  HARDWARE_COUNT_FIELDS.forEach((field) => {
    defaults[field.id] = "";
  });
  defaults[ARTICLE_TYPE_TABLE_ID] = [];

  return defaults;
};

export const mergeHardwareFormValues = (values: SchemaFormValues): SchemaFormValues =>
  syncHardwareArticleTable({
    ...createDefaultHardwareValues(),
    ...values,
  });

export const schemaHasHardwareSection = (schema: { data?: { sections?: { id: string }[] } } | null) =>
  Boolean(schema?.data?.sections?.some((section) => section.id === HARDWARE_SECTION_ID));
