import { STRINGS } from "../../../app/config/strings";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import { createQcInitialValues, hydrateQcValuesFromSections } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID = "FINAL_MIX_DETAILS";
export const QC_MIXING_PREMIX_SECTION_ID = "PREMIX_DETAILS";
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

export const resolveMixingSchemaSubType = (
  section: SchemaSectionSubmission,
  detailSubType: QcApiSubType,
): QcApiSubType => {
  const sectionSubType = section.subType as QcApiSubType | undefined;
  if (sectionSubType === "PREMIX" || sectionSubType === "FINAL_MIX") return sectionSubType;
  if (
    section.sectionId === QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID ||
    section.sectionId === QC_MIXING_VISCOSITY_SECTION_ID
  ) {
    return "FINAL_MIX";
  }
  if (section.sectionId === QC_MIXING_PREMIX_SECTION_ID) return "PREMIX";
  return detailSubType;
};

export const isMixingSharedFinalMixDetailsSection = (sectionId: string) =>
  sectionId === QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID;

export type MixingDivisionRestoreResult = {
  finalMixDetailSections: SchemaSectionSubmission[];
  premixEntries: Array<{ premixNo: number; sections: SchemaSectionSubmission[] }>;
  finalMixEntries: Array<{ premixNo: number; sections: SchemaSectionSubmission[] }>;
  schemaSubTypes: QcApiSubType[];
};

export const groupMixingDetailSections = (
  sections: SchemaSectionSubmission[],
  detailSubType: QcApiSubType,
): MixingDivisionRestoreResult => {
  const result: MixingDivisionRestoreResult = {
    finalMixDetailSections: [],
    premixEntries: [],
    finalMixEntries: [],
    schemaSubTypes: [],
  };
  const premixByNo = new Map<number, SchemaSectionSubmission[]>();
  const finalMixByNo = new Map<number, SchemaSectionSubmission[]>();
  const subTypes = new Set<QcApiSubType>();

  sections.forEach((section) => {
    const subType = resolveMixingSchemaSubType(section, detailSubType);
    if (subType) subTypes.add(subType);

    if (isMixingSharedFinalMixDetailsSection(section.sectionId)) {
      result.finalMixDetailSections.push(section);
      return;
    }

    if (section.sectionId === QC_MIXING_VISCOSITY_SECTION_ID && section.premixNo != null) {
      const list = finalMixByNo.get(section.premixNo) ?? [];
      list.push(section);
      finalMixByNo.set(section.premixNo, list);
      return;
    }

    if (section.sectionId === QC_MIXING_PREMIX_SECTION_ID && section.premixNo != null) {
      const list = premixByNo.get(section.premixNo) ?? [];
      list.push(section);
      premixByNo.set(section.premixNo, list);
    }
  });

  result.premixEntries = Array.from(premixByNo.entries())
    .sort(([a], [b]) => a - b)
    .map(([premixNo, sectionList]) => ({ premixNo, sections: sectionList }));
  result.finalMixEntries = Array.from(finalMixByNo.entries())
    .sort(([a], [b]) => a - b)
    .map(([premixNo, sectionList]) => ({ premixNo, sections: sectionList }));
  result.schemaSubTypes = Array.from(subTypes);

  return result;
};

export const hydrateMixingFinalMixDetailsValues = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues | undefined => {
  const detailsSchema = sliceMixingFinalMixSchema(schema, "details");
  if (!detailsSchema || !sections.length) return undefined;
  return hydrateQcValuesFromSections(detailsSchema, sections);
};
