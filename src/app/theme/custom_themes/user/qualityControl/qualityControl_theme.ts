import { getOperationsTheme } from "../../shared/operations_theme";
import { QUALITY_CONTROL_BRANDS } from "./tokens";

export const getQualityControlTheme = (mode = "light") => {
  const baseTheme = getOperationsTheme(mode);

  return {
    ...baseTheme,
    qualityControl: {
      dashboard: {
        departmentName: "Quality Control Department",
      },
      brands: QUALITY_CONTROL_BRANDS,
    },
  };
};

export default getQualityControlTheme;
