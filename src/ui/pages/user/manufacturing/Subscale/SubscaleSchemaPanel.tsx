import { useEffect, useMemo, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createSubscaleInitialValues,
  hydrateSubscaleValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { applySubscaleHardwareRowGeneration } from "../../../../../data/models/user/subscaleApiPayloadMapper";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import { mergeSubscaleBatchFormValues } from "../../../../../hooks/user/manufacturing/subscaleBatchConfig";
import {
  HARDWARE_SECTION_ID,
  isMainScaleSubscaleBatch,
  isSubscaleProcessingBatch,
  mergeHardwareFormValues,
} from "../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import SubscaleMainScaleHardwarePanel from "./SubscaleMainScaleHardwarePanel";
import SubscaleSubscaleBatchPanel from "./SubscaleSubscaleBatchPanel";

type SubscaleSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  batchType?: string | null;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
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
  subDepartmentId,
  batchId,
  batchType,
  onChange,
  loading = false,
  error = null,
}: SubscaleSchemaPanelProps) => {
  const hydratedRef = useRef(false);
  const showMainScaleSetup = isMainScaleSubscaleBatch(batchType);
  const showSubscaleBatchSetup = isSubscaleProcessingBatch(batchType);

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
      onChange(next);
    },
    [onChange],
  );

  const handleHardwareChange = useCallback(
    (next: SchemaFormValues) => {
      const merged = mergeHardwareFormValues(next);
      onChange(applySubscaleHardwareRowGeneration(schema, merged));
    },
    [onChange, schema],
  );

  const handleBatchSetupChange = useCallback(
    (next: SchemaFormValues) => {
      onChange(mergeSubscaleBatchFormValues(next));
    },
    [onChange],
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
  }, [schema, savedSections, batchType, showMainScaleSetup, showSubscaleBatchSetup, emitChange, formValues]);

  const themeTokens = useMemo(
    () => ({
      primary: SUBSCALE_BRAND.ss,
      primaryLight: SUBSCALE_BRAND.ssLight,
      accent: SUBSCALE_BRAND.accent,
      text: SUBSCALE_BRAND.text,
      textSub: SUBSCALE_BRAND.textSub,
      border: SUBSCALE_BRAND.border,
      surface: SUBSCALE_BRAND.surface,
      warn: SUBSCALE_BRAND.warn,
    }),
    [],
  );

  return (
    <Box>
      {showMainScaleSetup ? (
        <Box sx={{ mb: 3 }}>
          <SubscaleMainScaleHardwarePanel values={formValues} onChange={handleHardwareChange} />
        </Box>
      ) : null}

      {showSubscaleBatchSetup ? (
        <SubscaleSubscaleBatchPanel values={formValues} onChange={handleBatchSetupChange} />
      ) : null}

      <SchemaUI
        schema={processingSchema}
        value={formValues}
        onChange={emitChange}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId, batchId }}
      />
    </Box>
  );
};

export default SubscaleSchemaPanel;
