import type { QcApiDivision, QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";

export type QcDivisionEntryKind =
  | "SIMPLE"
  | "STF"
  | "REVALIDATION"
  | "SOLID_PREMIX"
  | "LIQUID_PREMIX"
  | "BOTH_PREMIX"
  | "PROCESSING_MATERIAL"
  | "MIXING_PREMIX"
  | "MIXING_FINAL_MIX"
  | "HARDWARE_PROCESS"
  | "CASTING_MOTOR"
  | "CURING_MOTOR"
  | "TRIMMING_MOTOR"
  | "DE_CORING_MOTOR"
  | "POST_CURE_MOTOR"
  | "NDT_MOTOR"
  | "PROPELLANT_PROCESS"
  | "WEIGHTMENT_MOTOR";

export type QcProcessingProcessSlot = "solid" | "liquid";

export type QcDivisionEntry = {
  entryId: string;
  flowKey: string;
  label: string;
  kind: QcDivisionEntryKind;
  apiDivision: QcApiDivision;
  subType: QcApiSubType;
  premixNo?: number;
  premixDate?: string;
  motorId?: string;
  motorCount?: number;
  motorReceivedDate?: string;
  inhibitorType?: string;
  weighscaleNo?: string;
  calibrationDueDate?: string;
  /** Raw Material Processing material schema identity. */
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  gradeId?: number | null;
  gradeCode?: string | null;
  processSlot?: QcProcessingProcessSlot;
  /** Cache key for RAW_MATERIALS schema in schemasByKey. */
  schemaCacheKey?: string;
  /** Sections from the details API grouped into this entry (used for hydration). */
  savedSections?: SchemaSectionSubmission[];
};

export type QcDivisionEntryValues = {
  schemaValues: SchemaFormValues;
  liquidSchemaValues?: SchemaFormValues;
};
