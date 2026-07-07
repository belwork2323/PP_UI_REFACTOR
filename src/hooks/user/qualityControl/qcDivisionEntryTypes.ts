import type { QcApiDivision, QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaFormValues } from "../../../schema-engine";

export type QcDivisionEntryKind =
  | "SIMPLE"
  | "STF"
  | "REVALIDATION"
  | "SOLID_PREMIX"
  | "LIQUID_PREMIX"
  | "BOTH_PREMIX"
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

export type QcDivisionEntry = {
  entryId: string;
  flowKey: string;
  label: string;
  kind: QcDivisionEntryKind;
  apiDivision: QcApiDivision;
  subType: QcApiSubType;
  premixNo?: number;
  motorId?: string;
  motorCount?: number;
  motorReceivedDate?: string;
  inhibitorType?: string;
  weighscaleNo?: string;
  calibrationDueDate?: string;
};

export type QcDivisionEntryValues = {
  schemaValues: SchemaFormValues;
  liquidSchemaValues?: SchemaFormValues;
};
