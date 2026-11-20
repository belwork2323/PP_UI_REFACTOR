import colors from "../../colors";
import general from "../common/common_css_theme";
import { createAuthFormTheme } from "./auth_form_theme";
import { createAuthShellTheme } from "./auth_shell_theme";
import type { ThemeMode } from "../../../store/themeStore";

const getLoginTheme = (mode: ThemeMode = "light") => {
  const m = colors.modes[mode] ?? colors.modes.light;
  const shell = createAuthShellTheme(m);
  const form = createAuthFormTheme(m);

  return {
    ...shell,
    ...form,
    resetForm: {
      ...form.resetForm,
      heading: {
        ...general.flex1,
        ...shell.cardHeading.wrapper,
        mb: 0,
        ...general.textLeft,
      },
    },
    changePassword: {
      ...form.changePassword,
      heading: {
        ...shell.cardHeading.wrapper,
        ...general.textLeft,
        mb: 2,
      },
    },
  };
};

export type LoginTheme = ReturnType<typeof getLoginTheme>;

export default getLoginTheme;
