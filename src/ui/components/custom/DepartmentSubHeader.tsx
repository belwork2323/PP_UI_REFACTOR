import { Box, Typography } from "@mui/material";
import { colors, spacing, fonts } from "../../../app/theme";

const DepartmentSubHeader = ({ icon: Icon, title, description }) => {
  return (
    <Box
      sx={{
        mb: spacing.md,
        p: spacing.md,
        borderRadius: 2.5,
        backgroundColor: colors.paper,
        borderLeft: `6px solid ${colors.primary.main}`,
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        {/* Icon */}
        {Icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary.light,
              color: colors.primary.main,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            <Icon fontSize="inherit" />
          </Box>
        )}

        {/* Text */}
        <Box>
          <Typography
            sx={{
              fontFamily: fonts.family.primary,
              fontSize: fonts.size.lg,
              fontWeight: fonts.weight.semibold,
              color: colors.text.primary,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>

          {description && (
            <Typography
              sx={{
                mt: spacing.xs,
                fontSize: fonts.size.sm,
                color: colors.text.secondary,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DepartmentSubHeader;
