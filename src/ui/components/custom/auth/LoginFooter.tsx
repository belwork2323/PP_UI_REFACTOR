import { Box, Typography } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import type { LoginTheme } from "@app/theme/custom_themes/auth/login_theme";

type LoginFooterProps = {
  theme: LoginTheme["footer"];
};

const LoginFooter = ({ theme }: LoginFooterProps) => (
  <Box sx={theme.wrapper}>
    <Box sx={theme.copyrightContainer}>
      <Typography sx={theme.copyrightText}>{STRINGS.AUTH.FOOTER_TEXT}</Typography>
    </Box>
  </Box>
);

export default LoginFooter;
