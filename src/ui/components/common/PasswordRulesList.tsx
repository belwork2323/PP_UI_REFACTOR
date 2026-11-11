import { Box, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import type { PasswordRuleCheck } from "../../../utils/passwordPolicy";
import { STRINGS } from "../../../app/config/strings";

type Props = {
  rules: PasswordRuleCheck[];
};

const PasswordRulesList = ({ rules }: Props) => (
  <Box>
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 800,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "text.secondary",
        mb: 1,
      }}
    >
      {STRINGS.AUTH.PASSWORD_RULES_HEADING}
    </Typography>
    <Stack spacing={0.75}>
      {rules.map((rule) => (
        <Box key={rule.key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {rule.ok ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "success.main" }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          )}
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: rule.ok ? "success.main" : "text.secondary",
              fontWeight: rule.ok ? 600 : 400,
            }}
          >
            {rule.label}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

export default PasswordRulesList;
