import { useMemo, useState, type SyntheticEvent } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import type {
  SchemaApiContext,
  SchemaDocumentLayout,
  SchemaFormValues,
  SchemaNodeStyleRef,
  SchemaSection,
  SchemaThemeTokens,
} from "../models/schema.types";
import type { SchemaDesignSystem } from "../models/schema.v1.types";
import type { SchemaSetupContext } from "../utils/schemaSetupContext";
import {
  groupSectionsForAccordion,
  resolveSchemaAccordionConfig,
  resolveSchemaLayoutType,
} from "../utils/schemaLayout";
import {
  resolvePageStackSpacing,
  resolveRadiusPx,
  resolveSectionBorderRadiusToken,
  resolveSectionCardSx,
} from "../utils/schemaStyle";
import { isSchemaSectionVisible } from "../utils/schemaVisibility";
import SchemaSectionRenderer from "./SchemaSectionRenderer";

type SchemaSectionsLayoutProps = {
  sections: SchemaSection[];
  layout?: SchemaDocumentLayout;
  designSystem?: SchemaDesignSystem;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  visibilityContext: Record<string, unknown>;
};

const resolvePanelCardStyle = (sections: SchemaSection[]): SchemaNodeStyleRef | undefined => {
  const first = sections[0];
  if (!first) return undefined;
  return first.accordionGroupStyle ?? first.style;
};

const SchemaFlatSections = ({
  sections,
  layout,
  designSystem,
  values,
  onChange,
  readOnly,
  theme,
  apiContext,
  setupContext,
  visibilityContext,
}: SchemaSectionsLayoutProps) => (
  <>
    {sections.map((section) =>
      isSchemaSectionVisible(section, visibilityContext) ? (
        <Box
          key={section.sectionId}
          sx={resolveSectionCardSx(
            section.style,
            section.layout ?? layout,
            theme,
            designSystem,
          )}
        >
          <SchemaSectionRenderer
            section={section}
            values={values}
            onChange={onChange}
            readOnly={readOnly}
            theme={theme}
            apiContext={apiContext}
            setupContext={setupContext}
          />
        </Box>
      ) : null,
    )}
  </>
);

const SchemaAccordionSections = ({
  sections,
  layout,
  designSystem,
  values,
  onChange,
  readOnly,
  theme,
  apiContext,
  setupContext,
  visibilityContext,
  stackSpacing,
}: SchemaSectionsLayoutProps & { stackSpacing: number }) => {
  const accordionConfig = resolveSchemaAccordionConfig(layout);
  const panels = useMemo(
    () =>
      groupSectionsForAccordion(sections).filter((panel) =>
        panel.sections.some((section) => isSchemaSectionVisible(section, visibilityContext)),
      ),
    [sections, visibilityContext],
  );

  const [expandedPanels, setExpandedPanels] = useState<string[]>(() =>
    accordionConfig.defaultExpanded ? panels.map((panel) => panel.panelId) : [],
  );

  const handlePanelChange =
    (panelId: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      if (accordionConfig.allowMultipleExpanded) {
        setExpandedPanels((prev) =>
          isExpanded ? [...prev, panelId] : prev.filter((id) => id !== panelId),
        );
        return;
      }

      setExpandedPanels(isExpanded ? [panelId] : []);
    };

  const isPanelExpanded = (panelId: string) =>
    accordionConfig.allowMultipleExpanded
      ? expandedPanels.includes(panelId)
      : expandedPanels[0] === panelId;

  return (
    <Stack spacing={stackSpacing}>
      {panels.map((panel) => {
        const visibleSections = panel.sections.filter((section) =>
          isSchemaSectionVisible(section, visibilityContext),
        );
        if (!visibleSections.length) return null;

        const isGroupedPanel = visibleSections.some((section) => section.accordionGroupId);
        const panelCardStyle = resolvePanelCardStyle(visibleSections);

        return (
          <Accordion
            key={panel.panelId}
            expanded={isPanelExpanded(panel.panelId)}
            onChange={handlePanelChange(panel.panelId)}
            disableGutters
            elevation={0}
            sx={{
              ...resolveSectionCardSx(panelCardStyle, layout, theme, designSystem),
              overflow: "visible",
              "&::before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    color: theme.textSub,
                    fontSize: "1.35rem",
                  }}
                />
              }
              sx={{
                minHeight: 48,
                px: 0.5,
                "& .MuiAccordionSummary-content": {
                  my: 1,
                  minWidth: 0,
                },
                "& .MuiAccordionSummary-expandIconWrapper": {
                  color: theme.textSub,
                  flexShrink: 0,
                  transform: "rotate(0deg)",
                  transition: "transform 0.2s ease",
                },
                "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                  transform: "rotate(180deg)",
                },
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.text }}>
                {panel.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Stack spacing={stackSpacing}>
                {visibleSections.map((section) => (
                  <Box
                    key={section.sectionId}
                    sx={
                      isGroupedPanel
                        ? {
                            borderRadius:
                              resolveRadiusPx(
                                resolveSectionBorderRadiusToken(
                                  section.style ?? panelCardStyle,
                                  layout,
                                ),
                                designSystem,
                              ) ?? 6,
                            border: `1px solid ${alpha(theme.border, 0.65)}`,
                            p: 1.25,
                            background: alpha(theme.surface, 0.65),
                          }
                        : undefined
                    }
                  >
                    <SchemaSectionRenderer
                      section={section}
                      values={values}
                      onChange={onChange}
                      readOnly={readOnly}
                      theme={theme}
                      apiContext={apiContext}
                      setupContext={setupContext}
                      showTitle={isGroupedPanel}
                    />
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
};

const SchemaSectionsLayout = (props: SchemaSectionsLayoutProps) => {
  const layoutType = resolveSchemaLayoutType(props.layout);
  const stackSpacing = resolvePageStackSpacing(props.layout, props.designSystem) / 8;
  const accordionConfig = resolveSchemaAccordionConfig(props.layout);
  const accordionMountKey = useMemo(
    () =>
      [
        accordionConfig.defaultExpanded ? "1" : "0",
        accordionConfig.allowMultipleExpanded ? "1" : "0",
        props.sections.map((section) => section.sectionId).join("\0"),
      ].join("|"),
    [accordionConfig.defaultExpanded, accordionConfig.allowMultipleExpanded, props.sections],
  );

  if (layoutType === "accordion") {
    return (
      <SchemaAccordionSections key={accordionMountKey} {...props} stackSpacing={stackSpacing} />
    );
  }

  return (
    <Stack spacing={stackSpacing}>
      <SchemaFlatSections {...props} />
    </Stack>
  );
};

export default SchemaSectionsLayout;
