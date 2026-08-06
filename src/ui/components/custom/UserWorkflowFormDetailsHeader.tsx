import type { ElementType, ReactNode } from "react";
import { Box, Stack, Typography, alpha } from "@mui/material";

type UserWorkflowFormDetailsHeaderProps = {
  title: string;
  subtitle?: string;
  icon: ElementType;
  theme: {
    palette?: {
      primary?: string;
      primaryLight?: string;
      text?: string;
      textSub?: string;
    };
  };
  endAction?: ReactNode;
};

/** Icon + title block below the workflow form header (e.g. Motor Casing Receipt). */
const UserWorkflowFormDetailsHeader = ({
  title,
  subtitle,
  icon: Icon,
  theme,
  endAction,
}: UserWorkflowFormDetailsHeaderProps) => {
  const palette = theme?.palette ?? {};
  const primary = palette.primary ?? "#1B4F72";
  const primaryLight = palette.primaryLight ?? "#2E86C1";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        mb: 0.5,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 10px ${alpha(primary, 0.28)}`,
          }}
        >
          <Icon sx={{ color: "#fff", fontSize: 17 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: palette.text ?? "#1C2833" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ fontSize: "0.75rem", color: palette.textSub ?? "#5D6D7E", mt: 0.3 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {endAction ? <Box sx={{ flexShrink: 0 }}>{endAction}</Box> : null}
    </Box>
  );
};

export default UserWorkflowFormDetailsHeader;
