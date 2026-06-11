import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import getAppFooterTheme from "@app/theme/custom_themes/common/appFooter_theme";
import { useThemeStore } from "@app/store/themeStore";
import { STRINGS } from "@app/config/strings";
import { getBelLogo } from "@app/assets/images";

const S = STRINGS.APP_FOOTER;

const AppFooter = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getAppFooterTheme(mode);

  return (
    <>
      <Toolbar sx={t.spacer} />

      <AppBar position="fixed" elevation={3} sx={t.appBar}>
        <Toolbar sx={t.toolbar}>
          <Box sx={t.centerBlock.wrapper}>
            <Typography sx={t.centerBlock.copyright}>{S.COPYRIGHT}</Typography>
            <Typography sx={t.centerBlock.maintenance}>{S.CREDITS}</Typography>
          </Box>

          <Box sx={t.belLogo.wrapper}>
            <img
              src={getBelLogo(mode)}
              alt={S.BEL_ALT}
              style={t.belLogo.img as React.CSSProperties}
            />
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default AppFooter;
