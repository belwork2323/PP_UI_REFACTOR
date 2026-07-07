// components/AppFooter.jsx
import React from "react";
import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import getAppFooterTheme from "../../../app/theme/custom_themes/common/appFooter_theme";
import { useThemeStore } from "../../../app/store/themeStore";
import { STRINGS }       from "../../../app/config/strings";

const S = STRINGS.APP_FOOTER; // shorthand

// ─────────────────────────────────────────────────────────────────────────────
// AppFooter
//
// Fixed bottom bar that mirrors AppHeader's glass-gradient aesthetic.
// Layout:
//   [left: empty / future use]  [center: copyright + credits]  [right: BEL logo]
// ─────────────────────────────────────────────────────────────────────────────

const AppFooter = () => {
  const mode = useThemeStore((s) => s.mode);
  const t    = getAppFooterTheme(mode); // ← all style tokens from theme

  return (
    <>
      {/* Spacer pushes page content above the fixed footer */}
      <Toolbar sx={t.spacer} />

      <AppBar position="fixed" elevation={3} sx={t.appBar}>
        <Toolbar sx={t.toolbar}>

          {/* ── Center: Copyright + Credits ── */}
          <Box sx={t.centerBlock.wrapper}>
            <Typography sx={t.centerBlock.copyright}>
              {S.COPYRIGHT}
            </Typography>
            <Typography sx={t.centerBlock.maintenance}>
              {S.CREDITS}
            </Typography>
          </Box>

          {/* ── Right: BEL Logo ── */}
          <Box sx={t.belLogo.wrapper}>
            <img
              src={
                mode === "dark"
                  ? "/src/assets/images/bel_logo_dark.png"
                  : "/src/assets/images/bel_logo_dark.png"
              }
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