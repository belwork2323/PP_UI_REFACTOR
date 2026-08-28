import { useState, type ElementType, type ReactNode, type SyntheticEvent } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { SUBSCALE_BRAND } from "../../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import { sectionCardSx, sectionHeaderSx } from "../utils/subscaleHardwareTableStyles";

type SubscaleProcessSectionProps = {
  id: string;
  title: string;
  icon: ElementType;
  defaultExpanded?: boolean;
  /** When true, table content mounts only after the section is expanded once. */
  lazyMount?: boolean;
  children: ReactNode;
};

const SubscaleProcessSection = ({
  id,
  title,
  icon: Icon,
  defaultExpanded = false,
  lazyMount = true,
  children,
}: SubscaleProcessSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hasMounted, setHasMounted] = useState(!lazyMount || defaultExpanded);

  const handleChange = (_event: SyntheticEvent, nextExpanded: boolean) => {
    setExpanded(nextExpanded);
    if (nextExpanded && !hasMounted) setHasMounted(true);
  };

  return (
    <Box sx={sectionCardSx}>
      <Accordion
        expanded={expanded}
        onChange={handleChange}
        disableGutters
        elevation={0}
        square
        sx={{
          background: "transparent",
          "&::before": { display: "none" },
          border: "none",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#fff" }} />}
          aria-controls={`${id}-content`}
          id={`${id}-header`}
          sx={{
            ...sectionHeaderSx,
            minHeight: 48,
            "&.Mui-expanded": { minHeight: 48 },
            "& .MuiAccordionSummary-content": { my: 0 },
            "& .MuiAccordionSummary-content.Mui-expanded": { my: 0 },
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.01em" }}>
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, borderTop: `1px solid ${SUBSCALE_BRAND.border}` }}>
          {hasMounted ? <Box sx={{ p: 2 }}>{children}</Box> : null}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default SubscaleProcessSection;
