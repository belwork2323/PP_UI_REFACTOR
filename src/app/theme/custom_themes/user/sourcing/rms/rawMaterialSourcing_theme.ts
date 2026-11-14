import { alpha } from "@mui/material";
import { getSourcingTheme } from "../sourcing_theme";
import { createRawMaterialSourcingDetailsTheme } from "./rawMaterialSourcing_details_theme";
import { createRawMaterialSourcingFormTheme } from "./rawMaterialSourcing_form_theme";
import {
  createRawMaterialSourcingHeaderTheme,
  createRawMaterialSourcingListTheme,
} from "./rawMaterialSourcing_list_theme";

export const getRawMaterialSourcingTheme = (baseTheme: any, mode: string = "light") => {
  const palette = baseTheme?.palette ?? {};
  const isDark = mode === "dark";
  const warnBase = palette.warn ?? "#D4AC0D";
  /** Stronger amber chips — ref range & partial-fill counts (default warn tint was too pale) */
  const amberChipSx = {
    background: alpha(warnBase, isDark ? 0.2 : 0.24),
    color: isDark ? warnBase : "#7D6608",
    border: `1px solid ${alpha(warnBase, isDark ? 0.45 : 0.5)}`,
  };

  const details = createRawMaterialSourcingDetailsTheme(palette, amberChipSx, mode);

  return {
    header: createRawMaterialSourcingHeaderTheme(palette),
    specificationForm: createRawMaterialSourcingFormTheme(palette, amberChipSx, mode),
    specification: {
      panelBorder: alpha(palette.primaryLight ?? "#2E86C1", 0.28),
    },
    lotList: createRawMaterialSourcingListTheme(palette, baseTheme),
    details,
    /** @deprecated Prefer `details` — kept for existing `lotDetails` accessors. */
    lotDetails: details,
  };
};

/** Sourcing department theme plus the RMS-only `sourcing.rawMaterial` tokens. */
export const getRawMaterialSourcingPageTheme = (mode = "light") => {
  const base = getSourcingTheme(mode);
  return {
    ...base,
    sourcing: {
      ...base.sourcing,
      rawMaterial: getRawMaterialSourcingTheme(base, mode),
    },
  };
};

export default getRawMaterialSourcingTheme;
