import type { ReactNode } from "react";
import { Box, Typography, alpha } from "@mui/material";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";

export {
  FieldGrid,
  FieldLabel,
  ParameterTable,
  ReadOnlyField,
  SubsectionHeading,
  TableSelectInput,
  TableTextInput,
  postCureTableCellSx,
  postCureTableContainerSx,
  postCureTableHeaderCellSx,
  postCureTableInputSx,
  postCureTableRowSx,
} from "./postCureFormPrimitivesShared";

type SectionCardProps = {
  title: string;
  children: ReactNode;
  theme?: any;
  mb?: number;
};

export const SectionCard = ({ title, children, theme, mb = 3 }: SectionCardProps) => {
  const details = theme?.manufacturing?.postCure?.details;
  const BRAND = POST_CURE_BRAND;
  return (
    <Box
      sx={{
        ...(details?.section ?? {
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(BRAND.border, 0.65)}`,
          background: "#fff",
        }),
        mb,
      }}
    >
      <Typography
        sx={
          details?.sectionTitle ?? {
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: BRAND.primaryLight,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }
        }
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};
