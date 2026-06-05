import { Box, Typography } from "@mui/material";
import { STRINGS } from "../../../app/config/strings";
import getLoginTheme from "../../../app/theme/custom_themes/auth/login_theme";
import { useThemeStore } from "../../../app/store/themeStore";

const LoginFooter = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getLoginTheme(mode);

  return (
    <Box sx={t.footer.wrapper}>

      {/* ── Left: DRDO Logo ── */}
      {/* <Box sx={t.footer.drdoSlot}>
        <Box
          component="img"
          src="src/assets/images/DRDO-logo.png"
          alt="DRDO Logo"
          sx={t.footer.drdoImg}
        />
      </Box> */}

      {/* ── Center: Copyright Text ── */}

      <Box sx={t.footer.copyrightContainer}>
        <Typography sx={t.footer.copyrightText}>
          {STRINGS.AUTH.FOOTER_TEXT}
        </Typography>
      </Box>
      
      

      {/* ── Right: BEL Logo ── */}
      {/* <Box sx={t.footer.belSlot}>
        <Box
          component="img"
          src={
            mode === "dark"
              ? "/src/assets/images/bel_logo_dark.png"
              : "/src/assets/images/bel_logo_light.png"
          }
          alt="BEL Logo"
          sx={t.footer.belImg}
        />
      </Box> */}

    </Box>
  );
};

export default LoginFooter;