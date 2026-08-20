export type WorkflowPersistedIds = {
  lotId?: string | null;
  formId?: string | null;
  /** Module-specific persisted id, e.g. motorCasingId */
  recordId?: string | null;
};

/** Create mode when none of lotId, formId, or recordId are present. */
export function isWorkflowCreateMode(ctx: WorkflowPersistedIds): boolean {
  const lotId = String(ctx.lotId ?? "").trim();
  const formId = String(ctx.formId ?? "").trim();
  const recordId = String(ctx.recordId ?? "").trim();
  return !lotId && !formId && !recordId;
}
