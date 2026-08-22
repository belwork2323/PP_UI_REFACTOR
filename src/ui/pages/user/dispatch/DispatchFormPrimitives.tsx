export {
  castingCuringFieldSx as dispatchFieldSx,
  castingCuringPlaceholderSx as dispatchPlaceholderSx,
  castingCuringTableCellSx as dispatchTableCellSx,
  castingCuringTableContainerSx as dispatchTableContainerSx,
  castingCuringTableHeaderCellSx as dispatchTableHeaderCellSx,
  castingCuringTableInputSx as dispatchTableInputSx,
  castingCuringTableRowSx as dispatchTableRowSx,
  FieldGrid,
  FieldLabel,
  ParameterTable,
  ReadOnlyField,
  SubsectionHeading,
  TableSelectInput,
  TableTextInput,
} from "../manufacturing/CastingAndCuring/CastingCuringFormPrimitives";

import type { ReactNode } from "react";
import { Box, Typography, alpha } from "@mui/material";
import { CASTING_CURING_BRAND } from "../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";

type SectionCardProps = {
  title: string;
  children: ReactNode;
  theme?: any;
  mb?: number;
};

export const SectionCard = ({ title, children, theme, mb = 3 }: SectionCardProps) => {
  const details = theme?.dispatch?.details;
  const BRAND = CASTING_CURING_BRAND;
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
          }
        }
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};
