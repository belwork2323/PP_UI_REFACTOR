import { Box, Typography, Stack } from "@mui/material";
import { icons, fonts, spacing, margins, colors } from "../../../app/theme";
import { STRINGS } from "../../../app/config/strings";

const DashboardHeader = () => {
  const RocketIcon = icons.rocket;

  return (
    <Box
      sx={{
        bgcolor: colors.primary.dark,
        color: "common.white",
        p: {
          xs: spacing.sm,
          sm: spacing.md,
          md: spacing.lg,
        },
        borderRadius: 2,
        mb: {
          xs: spacing.md,
          sm: spacing.lg,
        },
        boxShadow: 3,
      }}
    >
      <Stack spacing={spacing.xs}>
        <Typography
          sx={{
            fontFamily: fonts.family.primary,
            fontWeight: fonts.weight.bold,
            fontSize: {
              xs: fonts.size.md,
              sm: fonts.size.lg,
              md: fonts.size.xl,
            },
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          <RocketIcon />
          {STRINGS.DASHBOARD.TITLE}
        </Typography>

        <Typography
          sx={{
            fontSize: fonts.size.sm,
            opacity: 0.85,
          }}
        >
          {STRINGS.DASHBOARD.SUBTITLE}
        </Typography>
      </Stack>
    </Box>
  );
};

export default DashboardHeader;
