import { useEffect, useMemo, useRef, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Box } from "@mui/material";
import { createSubscaleInitialValues, hydrateSubscaleValuesFromSections } from "@/data/models/user/subscaleBatchType";
import type {
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "@/data/models/shared/sectionFormTypes";
import { applySubscaleHardwareRowGeneration } from "../../../../../data/models/user/subscaleApiPayloadMapper";
import { mergeSubscaleBatchFormValues } from "../../../../../hooks/user/manufacturing/subscaleBatchConfig";
import { canSubscaleManageProcessTables } from "../../../../../hooks/operationStatus";
import {
  HARDWARE_SECTION_ID,
  isMainScaleSubscaleBatch,
  isSubscaleProcessingBatch,
  mergeHardwareFormValues,
} from "../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import SubscaleMainScaleHardwarePanel from "./SubscaleMainScaleHardwarePanel";
import SubscaleSubscaleBatchPanel from "./SubscaleSubscaleBatchPanel";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  batchType?: string | null;
  batchStatus?: string | null;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
  batchDetails;
  errors?: Record<string, string>;
  clearFieldError?: (path: string) => void; // <-- Add this
};

const mergeFormValuesForBatchType = (
  values: SchemaFormValues,
  batchType?: string | null,
): SchemaFormValues => {
  if (isMainScaleSubscaleBatch(batchType)) return mergeHardwareFormValues(values);
  if (isSubscaleProcessingBatch(batchType)) return mergeSubscaleBatchFormValues(values);
  return values;
};

const SubscaleSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  batchType,
  batchStatus,
  onChange,
  batchDetails,
  errors = null,
  clearFieldError,
}: SubscaleSchemaPanelProps) => {
  const hydratedRef = useRef(false);
  const showMainScaleSetup = isMainScaleSubscaleBatch(batchType);
  const showSubscaleBatchSetup = isSubscaleProcessingBatch(batchType);
  const canManageProcessTables = canSubscaleManageProcessTables(batchStatus);
  const form = useFormContext();

  const processingSchema = useMemo(() => {
    if (!schema || (!showMainScaleSetup && !showSubscaleBatchSetup)) return schema;
    return {
      ...schema,
      data: {
        ...schema.data,
        sections: schema.data.sections.filter((section) => section.id !== HARDWARE_SECTION_ID),
      },
    };
  }, [schema, showMainScaleSetup, showSubscaleBatchSetup]);

  // SchemaRenderer already runs row-generation sync on processingSchema; do not re-sync here.
  const emitChange = useCallback(
    (next: SchemaFormValues) => {
      // Update external state and keep react-hook-form in sync
      if (form && typeof form.setValue === "function") {
        form.setValue("schemaFormValues", next, { shouldDirty: true, shouldValidate: true });
        if (next.IS_PROCESS_FORM_LOADED) {
          form.setValue("schemaFormLoaded", true, { shouldDirty: true });
        }
      }
      onChange(next);
    },
    [onChange, form],
  );

  const handleHardwareChange = useCallback(
    (next: SchemaFormValues) => {
      if (next.IS_PROCESS_FORM_LOADED) {
        emitChange(next);
        return;
      }
      const merged = mergeHardwareFormValues(next);
      emitChange(applySubscaleHardwareRowGeneration(schema, merged));
    },
    [emitChange, schema],
  );

  const handleBatchSetupChange = useCallback(
    (next: SchemaFormValues) => {
      if (next.IS_PROCESS_FORM_LOADED) {
        emitChange(next);
        return;
      }
      emitChange(mergeSubscaleBatchFormValues(next));
    },
    [emitChange],
  );

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion, batchType]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (Object.keys(formValues ?? {}).length > 0) {
      hydratedRef.current = true;
      return;
    }

    if (savedSections?.length) {
      const hydrated = hydrateSubscaleValuesFromSections(schema, savedSections);
      emitChange(hydrated);
    } else {
      const initial = createSubscaleInitialValues(schema);
      emitChange(initial);
    }
    hydratedRef.current = true;
  }, [schema, savedSections, batchType, emitChange]);

  return (
    <Box>
      {showMainScaleSetup ? (
        <Box sx={{ mb: 3 }}>
          <SubscaleMainScaleHardwarePanel
            values={formValues}
            onChange={handleHardwareChange}
            batchType={batchType}
            canManageProcessTables={canManageProcessTables}
            clearFieldError={clearFieldError}
          />
        </Box>
      ) : null}

      {showSubscaleBatchSetup ? (
        <>
          <SubscaleSubscaleBatchPanel
            values={formValues}
            onChange={handleBatchSetupChange}
            batchDetails={batchDetails}
            errors={errors}
            clearFieldError={clearFieldError}
          />
          <SubscaleHardwareArticlePanel
            values={formValues}
            onChange={handleBatchSetupChange}
            batchType={batchType}
            canManageProcessTables={canManageProcessTables}
            errors={errors}
            clearFieldError={clearFieldError}
          />
        </>
      ) : null}
    </Box>
  );
};

export default SubscaleSchemaPanel;
