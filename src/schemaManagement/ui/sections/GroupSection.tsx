import { Box, Stack, Typography, alpha } from "@mui/material";
import type { SchemaApiContext, SchemaFormValues, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import { buildFlatVisibilityContext, isSchemaSectionVisible } from "../../utils/schemaVisibility";
import SchemaSectionRenderer from "../SchemaSectionRenderer";

type GroupSectionProps = {
  section: SchemaSection;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const GroupSection = ({
  section,
  values,
  onChange,
  readOnly = false,
  theme,
  apiContext,
}: GroupSectionProps) => {
  const children = section.sections ?? [];
  const visibilityContext = buildFlatVisibilityContext(values);

  return (
    <Stack spacing={1.5}>
      {section.fields?.length ? (
        <SchemaSectionRenderer
          section={toFormLeaf(section, `${section.sectionId}__config`)}
          values={values}
          onChange={onChange}
          readOnly={readOnly}
          theme={theme}
          apiContext={apiContext}
          showTitle={false}
        />
      ) : null}

      {children.map((child) =>
        isSchemaSectionVisible(child, visibilityContext) ? (
          <Box
            key={child.sectionId}
            sx={{
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.border, 0.55)}`,
              p: 1.25,
              background: alpha(theme.surface, 0.35),
            }}
          >
            {child.title ? (
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", mb: 1 }}>
                {child.title}
              </Typography>
            ) : null}
            <SchemaSectionRenderer
              section={child}
              values={values}
              onChange={onChange}
              readOnly={readOnly}
              theme={theme}
              apiContext={apiContext}
              showTitle={false}
            />
          </Box>
        ) : null
      )}
    </Stack>
  );
};

const toFormLeaf = (section: SchemaSection, sectionId: string): SchemaSection => ({
  ...section,
  sectionId,
  type: "form",
  columns: undefined,
  defaultRows: undefined,
  sections: undefined,
  table: undefined,
});

export default GroupSection;
