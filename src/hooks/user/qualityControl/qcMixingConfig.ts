import { STRINGS } from "../../../app/config/strings";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import { createQcInitialValues } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2 } from "../../../schema-engine";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID = "FINAL_MIX_DETAILS";
export const QC_MIXING_VISCOSITY_SECTION_ID = "VISCOSITY_BUILD_UP";

export type QcMixingFinalMixSchemaSlice = "details" | "viscosity";

export const QC_MIXING_STAGE_OPTIONS = [
  { value: "PREMIX", label: S.MIXING_STAGE_PREMIX },
  { value: "FINAL_MIX", label: S.MIXING_STAGE_FINAL_MIX },
] as const;

export type QcMixingStage = (typeof QC_MIXING_STAGE_OPTIONS)[number]["value"];

export const QC_MIXING_PREMIX_COUNT = 15;

export const QC_MIXING_NUMBER_OPTIONS = Array.from(
  { length: QC_MIXING_PREMIX_COUNT },
  (_, index) => index + 1,
);

export const isQcMixingStage = (value: string): value is QcMixingStage =>
  value === "PREMIX" || value === "FINAL_MIX";

export const mapQcMixingStageToSubType = (stage: QcMixingStage): QcApiSubType =>
  stage === "FINAL_MIX" ? "FINAL_MIX" : "PREMIX";

export const getQcMixingNumberLabel = (stage: QcMixingStage, number: number) => {
  if (stage === "FINAL_MIX") {
    return S.MIXING_FINAL_MIX_NUMBER_LABEL.replace("{number}", String(number));
  }
  return S.MIXING_PREMIX_NUMBER_LABEL.replace("{number}", String(number));
};

export const getQcMixingStageLabel = (stage: QcMixingStage) =>
  QC_MIXING_STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;

export const getMixingFinalMixEntries = (entries: QcDivisionEntry[] = []) =>
  entries.filter((entry) => entry.kind === "MIXING_FINAL_MIX");

export const hasMixingFinalMixEntries = (entries: QcDivisionEntry[] = []) =>
  getMixingFinalMixEntries(entries).length > 0;

export type QcDivisionNavTab =
  | { kind: "final-mix-details" }
  | { kind: "entry"; entry: QcDivisionEntry };

export const getDivisionNavTabLabel = (tab: QcDivisionNavTab) =>
  tab.kind === "final-mix-details" ? S.MIXING_FINAL_MIX_SHARED_DETAILS_TITLE : tab.entry.label;

export const getDivisionNavTabKey = (tab: QcDivisionNavTab, index: number) =>
  tab.kind === "final-mix-details" ? `final-mix-details-${index}` : tab.entry.entryId;

export const sliceMixingFinalMixSchema = (
  schema: SchemaDocumentV2,
  slice: QcMixingFinalMixSchemaSlice,
): SchemaDocumentV2 | null => {
  const sectionId =
    slice === "details" ? QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID : QC_MIXING_VISCOSITY_SECTION_ID;
  const sections = schema.data?.sections?.filter((section) => section.id === sectionId) ?? [];
  if (!sections.length) return null;

  return {
    ...schema,
    data: {
      ...schema.data,
      sections,
    },
  };
};

export const createMixingFinalMixViscosityValues = (schema: SchemaDocumentV2) => {
  const viscositySchema = sliceMixingFinalMixSchema(schema, "viscosity");
  return viscositySchema ? createQcInitialValues(viscositySchema) : {};
};

export const createMixingFinalMixDetailsValues = (schema: SchemaDocumentV2) => {
  const detailsSchema = sliceMixingFinalMixSchema(schema, "details");
  return detailsSchema ? createQcInitialValues(detailsSchema) : {};
};
