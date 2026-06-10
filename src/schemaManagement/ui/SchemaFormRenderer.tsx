import { Box, Stack, Typography, alpha } from "@mui/material";
import type { SchemaApiContext, SchemaDocument, SchemaFormValues, SchemaThemeTokens } from "../models/schema.types";
import SchemaSectionRenderer from "./SchemaSectionRenderer";

type SchemaFormRendererProps = {
  schema: SchemaDocument;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const SchemaFormRenderer = ({
  schema,
  values,
  onChange,
  readOnly = false,
  theme,
  apiContext,
}: SchemaFormRendererProps) => {
  const isMockTrial = schema.schemaType === "MOCK_TRIAL";
  const isCasePreparation = schema.schemaType === "CASE_PREPARATION";
  const showFormDetails = isMockTrial || isCasePreparation;

  return (
    <Stack spacing={2}>
      {!showFormDetails ? (
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
      ) : schema.formDetails?.title || schema.formDetails?.description ? (
        <Box sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.border, 0.7)}`, p: 1.5 }}>
          {schema.formDetails?.title ? (
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{schema.formDetails.title}</Typography>
          ) : null}
          {schema.formDetails?.description ? (
            <Typography sx={{ fontSize: "0.72rem", color: theme.textSub, mt: 0.35 }}>
              {schema.formDetails.description}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {schema.sections.map((section) => (
        <Box
          key={section.sectionId}
          sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.border, 0.7)}`, p: 1.5 }}
        >
          <SchemaSectionRenderer
            section={section}
            values={values}
            onChange={onChange}
            readOnly={readOnly}
            theme={theme}
            apiContext={apiContext}
          />
        </Box>
      ))}
    </Stack>
  );
};

export default SchemaFormRenderer;
