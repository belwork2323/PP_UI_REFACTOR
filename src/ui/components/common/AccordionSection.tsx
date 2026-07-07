import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";

type AccordionSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onChange?: (expanded: boolean) => void;
  sx?: Record<string, unknown>;
  detailsSx?: SxProps<Theme>;
};

const AccordionSection = ({
  id,
  title,
  children,
  expanded,
  defaultExpanded = true,
  onChange,
  sx,
  detailsSx,
}: AccordionSectionProps) => {
  const handleChange = (_event: SyntheticEvent, isExpanded: boolean) => {
    onChange?.(isExpanded);
  };

  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={expanded}
      defaultExpanded={defaultExpanded}
      onChange={handleChange}
      sx={{ "&::before": { display: "none" }, ...sx }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          pt: 0.5,
          px: 1.5,
          pb: 0.5,
          ...detailsSx,
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default AccordionSection;
