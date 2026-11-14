import type { ElementType, ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import WorkflowDetailsSection from "./WorkflowDetailsSection";

export type WorkflowDetailsMetaField = {
  label: string;
  value: ReactNode;
};

type MetaTheme = {
  section?: object;
  sectionTitle?: object;
  sectionTitleIcon?: object;
  metaGrid?: object;
  metaItem?: object;
  metaLabel?: object;
  metaValue?: object;
};

type WorkflowDetailsMetaSectionProps = {
  dt: MetaTheme;
  title: string;
  icon?: ElementType;
  fields: WorkflowDetailsMetaField[];
  sx?: object;
};

/** Details meta grid section (procurement / batch identification). */
const WorkflowDetailsMetaSection = ({
  dt,
  title,
  icon,
  fields,
  sx,
}: WorkflowDetailsMetaSectionProps) => (
  <WorkflowDetailsSection dt={dt} title={title} icon={icon} sx={sx}>
    <Box sx={dt.metaGrid}>
      {fields.map((field) => (
        <Box key={field.label} sx={dt.metaItem}>
          <Typography sx={dt.metaLabel}>{field.label}</Typography>
          <Typography sx={dt.metaValue}>{field.value}</Typography>
        </Box>
      ))}
    </Box>
  </WorkflowDetailsSection>
);

export default WorkflowDetailsMetaSection;
