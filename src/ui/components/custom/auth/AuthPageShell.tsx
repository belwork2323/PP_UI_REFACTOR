import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { Box, CardContent, IconButton, Typography } from "@mui/material";
import Card from "../../common/Card";
import FullPageLoader from "../../common/FullPageLoader";
import GlobalAlert from "../../common/GlobalAlertSnackBar";
import { images } from "@app/assets/images";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useThemeStore } from "@app/store/themeStore";
import { icons } from "@app/theme/icons";
import getLoginTheme, { type LoginTheme } from "@app/theme/custom_themes/auth/login_theme";
import LoginFooter from "./LoginFooter";

type AuthPageShellProps = {
  loaderOpen: boolean;
  loaderMessage: string;
  showFeatures?: boolean;
  children: (theme: LoginTheme) => ReactNode;
};

const AuthPageShell = ({
  loaderOpen,
  loaderMessage,
  showFeatures = false,
  children,
}: AuthPageShellProps) => {
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const theme = useMemo(() => getLoginTheme(mode), [mode]);
  const { open, message, severity, hideAlert } = useAlertStore();
  const strings = STRINGS.AUTH;
  const details = STRINGS.LOGIN_DETAILS;

  return (
    <Box sx={theme.page}>
      <FullPageLoader open={loaderOpen} message={loaderMessage} />

      <Box sx={theme.toggleButton.wrapper}>
        <IconButton onClick={toggleMode} sx={theme.toggleButton.root}>
          {mode === "dark" ? (
            <icons.lightModeToggleIcon sx={theme.toggleButton.icon} />
          ) : (
            <icons.darkModeToggleIcon sx={theme.toggleButton.icon} />
          )}
        </IconButton>
      </Box>

      <Box sx={theme.belLogo.wrapper}>
        <img
          src={images.belLogoDark}
          alt={strings.BEL_LOGO_ALT}
          style={theme.belLogo.img as CSSProperties}
        />
      </Box>

      <Box sx={theme.leftPanel.wrapper}>
        <Box sx={theme.leftPanel.inner}>
          <Box sx={theme.drdoLogo.wrapper}>
            <Box sx={theme.drdoLogo.badge}>
              <img
                src={images.drdoLogo}
                alt={strings.DRDO_LOGO_ALT}
                style={theme.drdoLogo.img as CSSProperties}
              />
            </Box>
          </Box>
          <Typography sx={theme.intro_details}>{details.CLIENT_DETAILS.DEPARTMENT_NAME}</Typography>
          <Typography sx={theme.intro_details}>{details.CLIENT_DETAILS.RESEARCH_DETAILS}</Typography>
          <Typography sx={theme.intro_details}>{details.CLIENT_DETAILS.ORG_NAME}</Typography>
          <Typography sx={theme.title}>{details.TITLE}</Typography>
          <Typography sx={theme.subtitle}>{details.SUBTITLE}</Typography>
          {showFeatures && (
            <Box>
              {strings.FEATURES.map((feature, index) => (
                <Box key={index} sx={theme.featureCard.card}>
                  <Typography sx={theme.featureCard.title}>{feature.title}</Typography>
                  <Typography sx={theme.featureCard.description}>{feature.description}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={theme.rightPanel.wrapper}>
        <Box sx={theme.alertAnchor}>
          <GlobalAlert
            open={open}
            message={message}
            severity={severity}
            onClose={hideAlert}
            customPosition={true}
          />
          <Card elevation={20} sx={theme.loginCard.card} disableContent>
            <CardContent sx={theme.loginCard.cardContent}>{children(theme)}</CardContent>
          </Card>
        </Box>
      </Box>

      <LoginFooter theme={theme.footer} />
    </Box>
  );
};

export default AuthPageShell;
