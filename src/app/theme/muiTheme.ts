import { createTheme } from "@mui/material/styles";

// 🔴 IMPORTANT: import tokens directly (NOT from index.js barrel)
import fonts from "./fonts";
import colors from "./colors";

const muiTheme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
  },

  typography: {
    fontFamily: fonts.family.primary,

    fontWeightLight: fonts.weight.light,
    fontWeightRegular: fonts.weight.regular,
    fontWeightMedium: fonts.weight.medium,
    fontWeightBold: fonts.weight.bold,

    h1: { fontSize: fonts.size["5xl"], lineHeight: fonts.lineHeight.tight },
    h2: { fontSize: fonts.size["4xl"], lineHeight: fonts.lineHeight.tight },
    h3: { fontSize: fonts.size["3xl"], lineHeight: fonts.lineHeight.tight },
    h4: { fontSize: fonts.size["2xl"], lineHeight: fonts.lineHeight.tight },
    body1: { fontSize: fonts.size.md, lineHeight: fonts.lineHeight.normal },
    body2: { fontSize: fonts.size.sm, lineHeight: fonts.lineHeight.normal },
  },
});

export default muiTheme;