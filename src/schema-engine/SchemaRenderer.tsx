import { useCallback, useMemo, useState, type SyntheticEvent } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { SchemaDocumentV2, SchemaSection } from "./types";
import type { SchemaChangeMeta, SchemaFormValues } from "./state/formState";
import { scopedFormKey } from "./state/formState";
import type { SchemaApiContext } from "./rules/apiDependency";
import type { SchemaThemeTokens } from "./utils/schemaUtils";
import {
  buildFlatVisibilityContext,
  collectVisibilityTriggerFields,
  isSectionVisible,
  pruneHiddenFormValues,
} from "./rules/visibility";
import type { SchemaSetupContext } from "./utils/setupContext";
import {
  getRowGenerationCountTriggerFields,
  getRowGenerationParentSourceIds,
  getRowGenerationTableIds,
  schemaHasRowGenerationTables,
  syncRowGenerationTables,
} from "./utils/rowGenerationSync";
import { useSchemaApiPopulation } from "./hooks/useSchemaApiPopulation";
import BlockRenderer from "./BlockRenderer";
import AccordionSection from "../ui/components/common/AccordionSection";
import GridFields from "../ui/components/common/GridFields";
import { resolveGridGap, resolveSectionDetailsPadding, resolveSpacingToken } from "./utils/blockLayout";

type SchemaRendererProps = {
  schema: SchemaDocumentV2;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  lockStructure?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
  hideRepeatInstanceLabels?: boolean;
};

const shouldSyncRowGeneration = (
  schema: SchemaDocumentV2,
  meta?: SchemaChangeMeta,
): boolean => {
  if (!schemaHasRowGenerationTables(schema)) return false;
  if (!meta?.changedBlockId) return true;

  const rowGenTableIds = getRowGenerationTableIds(schema);
  const parentSourceIds = getRowGenerationParentSourceIds(schema);
  const countTriggerFields = getRowGenerationCountTriggerFields(schema);
  const scopedId = meta.changedScope
    ? scopedFormKey(meta.changedScope, meta.changedBlockId)
    : meta.changedBlockId;

  return (
    rowGenTableIds.has(meta.changedBlockId) ||
    parentSourceIds.has(meta.changedBlockId) ||
    countTriggerFields.has(meta.changedBlockId) ||
    rowGenTableIds.has(scopedId) ||
    parentSourceIds.has(scopedId) ||
    countTriggerFields.has(scopedId)
  );
};

const shouldPruneHiddenValues = (
  sections: SchemaSection[],
  meta?: SchemaChangeMeta,
): boolean => {
  const triggerFields = collectVisibilityTriggerFields(sections);
  if (!triggerFields.size) return false;
  if (!meta?.changedBlockId) return true;

  const scopedId = meta.changedScope
    ? scopedFormKey(meta.changedScope, meta.changedBlockId)
    : meta.changedBlockId;

  return triggerFields.has(meta.changedBlockId) || triggerFields.has(scopedId);
};

const SectionContent = ({
  section,
  ctx,
}: {
  section: SchemaSection;
  ctx: Parameters<typeof BlockRenderer>[0]["ctx"];
}) => (
  <GridFields
    direction={section.ui?.direction ?? "column"}
    wrap={section.ui?.wrap ?? true}
    gap={resolveGridGap(section.ui?.gap)}
  >
    {section.children.map((block, index) => (
      <BlockRenderer
        key={`${block.type}-${block.id || index}`}
        block={block}
        ctx={{ ...ctx, valueScope: section.id }}
      />
    ))}
  </GridFields>
);

const SchemaRenderer = ({
  schema,
  values,
  onChange,
  readOnly = false,
  lockStructure = false,
  theme,
  apiContext,
  setupContext,
  batch,
  motorId,
  hideRepeatInstanceLabels,
}: SchemaRendererProps) => {
  const visibilityContext = useMemo(() => buildFlatVisibilityContext(values), [values]);
  const layout = schema.data.ui?.layout ?? "flat";
  const sections = schema.data.sections ?? [];

  const handleChange = useCallback(
    (next: SchemaFormValues, meta?: SchemaChangeMeta) => {
      let result = next;
      if (shouldSyncRowGeneration(schema, meta)) {
        result = syncRowGenerationTables(schema, result);
      }
      if (shouldPruneHiddenValues(sections, meta)) {
        result = pruneHiddenFormValues(sections, result);
      }
      onChange(result);
    },
    [onChange, schema, sections],
  );

  useSchemaApiPopulation(schema, values, handleChange, apiContext, readOnly);

  const ctx = useMemo(
    () => ({
      values,
      onChange: handleChange,
      readOnly,
      lockStructure,
      theme,
      apiContext,
      setupContext,
      visibilityContext,
      batch,
      motorId,
      hideRepeatInstanceLabels,
    }),
    [
      values,
      handleChange,
      readOnly,
      lockStructure,
      theme,
      apiContext,
      setupContext,
      visibilityContext,
      batch,
      motorId,
      hideRepeatInstanceLabels,
    ],
  );

  const [expandedPanels, setExpandedPanels] = useState<string[]>(() =>
    schema.data.ui?.accordion?.defaultExpanded !== false ? sections.map((s) => s.id) : [],
  );

  const handlePanelChange = (sectionId: string) => (_: SyntheticEvent, isExpanded: boolean) => {
    const allowMultiple = schema.data.ui?.accordion?.allowMultipleExpanded !== false;
    setExpandedPanels((prev) => {
      if (allowMultiple) {
        return isExpanded ? [...prev, sectionId] : prev.filter((id) => id !== sectionId);
      }
      return isExpanded ? [sectionId] : [];
    });
  };

  if (layout === "accordion") {
    return (
      <Stack spacing={1.5}>
        {sections.map((section) =>
          isSectionVisible(section, visibilityContext) ? (
            <AccordionSection
              key={section.id}
              id={section.id}
              title={section.title}
              expanded={expandedPanels.includes(section.id)}
              onChange={() => undefined}
              sx={{
                border: `1px solid ${theme?.border ?? "#D5D8DC"}`,
                borderRadius: 2,
                "&:before": { display: "none" },
              }}
              detailsSx={resolveSectionDetailsPadding(section.ui)}
            >
              <SectionContent section={section} ctx={ctx} />
            </AccordionSection>
          ) : null,
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {sections.map((section) =>
        isSectionVisible(section, visibilityContext) ? (
          <Box
            key={section.id}
            sx={{
              border: section.ui?.variant === "plain" ? "none" : `1px solid ${theme?.border ?? "#D5D8DC"}`,
              borderRadius: 2,
              p: resolveSpacingToken(section.ui?.padding, 1.5),
              background: theme?.surface,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme?.text, mb: 1.5 }}>
              {section.title}
            </Typography>
            <SectionContent section={section} ctx={ctx} />
          </Box>
        ) : null,
      )}
    </Stack>
  );
};

export default SchemaRenderer;
