// src/hooks/user/manufacturing/useManufacturingWorkflow.ts
//
// Shared base hook for standard manufacturing sub-department pages.
// Manages view toggling (list ↔ form), active batch, edit mode, and form data tracking.
// Each sub-department hook re-exports this with its own mock data.

import { useCallback, useState } from "react";

export type WorkflowView = "list" | "form";

export interface ManufacturingBatch {
  id: number;
  batchId: string;
  motorId: string;
  motorType?: string;
  batchType?: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  draftData?: any[];
  rejectionReason?: string | null;
  [key: string]: any;
}

export const useManufacturingWorkflow = (mockBatches: ManufacturingBatch[]) => {
  const [batches] = useState<ManufacturingBatch[]>(mockBatches);
  const [loading] = useState(false);
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<ManufacturingBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formHasData, setFormHasData] = useState(false);

  const openForm = useCallback((batch: ManufacturingBatch, editMode: boolean) => {
    setActiveBatch(batch);
    setIsEditMode(editMode);
    setView("form");
    setFormHasData(editMode && (batch.draftData ?? []).length > 0);
  }, []);

  const handleFillForm = useCallback(
    (batch: ManufacturingBatch) => openForm(batch, false),
    [openForm]
  );

  const handleEditForm = useCallback(
    (batch: ManufacturingBatch) => openForm(batch, true),
    [openForm]
  );

  const handleBack = useCallback(() => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormHasData(false);
  }, []);

  const handleFormBlocksChange = useCallback(
    (blocks: any[]) => setFormHasData(blocks.length > 0),
    []
  );

  return {
    batches,
    loading,
    view,
    activeBatch,
    isEditMode,
    formHasData,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleFormBlocksChange,
  };
};
