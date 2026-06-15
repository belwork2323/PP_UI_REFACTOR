import { Box, Stack, Typography, alpha } from "@mui/material";
import type { SchemaApiContext, SchemaDocument, SchemaFormValues, SchemaThemeTokens } from "../models/schema.types";
import {
  buildFlatVisibilityContext,
  pruneHiddenSchemaValues,
} from "../utils/schemaVisibility";
import {
  mergeSchemaTheme,
} from "../utils/schemaStyle";
import SchemaSectionsLayout from "./SchemaSectionsLayout";

type SchemaFormRendererProps = {
  schema: SchemaDocument;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: import("../utils/schemaSetupContext").SchemaSetupContext;
};

const SchemaFormRenderer = ({
  schema,
  values,
  onChange,
  readOnly = false,
  theme: baseTheme,
  apiContext,
  setupContext,
}: SchemaFormRendererProps) => {
  const theme = mergeSchemaTheme(baseTheme, schema.designSystem);
  const isMockTrial = schema.schemaType === "MOCK_TRIAL";
  const isCasePreparation = schema.schemaType === "CASE_PREPARATION";
  const isCastingCuring =
    schema.schemaType === "CASTING" || schema.schemaType === "CURING";
  const meta = schema.meta ?? schema.formDetails;
  const showMetaBanner =
    (isMockTrial || isCasePreparation || isCastingCuring) &&
    Boolean(meta?.title || meta?.description);
  const visibilityContext = buildFlatVisibilityContext(values);

  const handleChange = (next: SchemaFormValues) => {
    onChange(pruneHiddenSchemaValues(schema.sections, next));
  };

  return (
    <Stack spacing={2}>
      {!showMetaBanner && !isMockTrial && !isCasePreparation ? (
        <Box sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.border, 0.7)}`, p: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 0.5 }}>
            {schema.rawMaterialDetails.materialName} ({schema.rawMaterialDetails.materialCode})
          </Typography>
          {schema.rawMaterialDetails.grade?.gradeName ? (
            <Typography sx={{ fontSize: "0.72rem", color: theme.textSub }}>
              Grade: {schema.rawMaterialDetails.grade.gradeName}
            </Typography>
          ) : null}
        </Box>
      ) : showMetaBanner ? (
        <Box sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.border, 0.7)}`, p: 1.5 }}>
          {meta?.title ? (
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{meta.title}</Typography>
          ) : null}
          {meta?.description ? (
            <Typography sx={{ fontSize: "0.72rem", color: theme.textSub, mt: 0.35 }}>
              {meta.description}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <SchemaSectionsLayout
        sections={schema.sections}
        layout={schema.layout}
        designSystem={schema.designSystem}
        values={values}
        onChange={handleChange}
        readOnly={readOnly}
        theme={theme}
        apiContext={apiContext}
        setupContext={setupContext}
        visibilityContext={visibilityContext}
      />
    </Stack>
  );
};

export default SchemaFormRenderer;
