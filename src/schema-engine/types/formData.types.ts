/** PP-Schema v2 submission / runtime data shapes. See docs/SCHEMA_SPEC.md */

export type SchemaRepeatInstanceKey = { _key: string };

export type SchemaFieldValue = string | number | boolean | null;

export type SchemaTableRow = Record<string, SchemaFieldValue> & { srNo?: number };

export type SchemaRepeatInstanceData = SchemaRepeatInstanceKey & Record<string, unknown>;

export type SchemaSubmissionPayload = {
  schemaId: string;
  schemaVersion: string;
  batchId?: string;
  motorId?: string;
  data: Record<string, unknown>;
};

export type SchemaFormData = Record<string, unknown>;
