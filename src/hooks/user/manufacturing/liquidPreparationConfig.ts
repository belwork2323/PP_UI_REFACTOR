import { alpha } from "@mui/material";

export const LIQUID_PREP_TEXT = {
  SECTION_TITLE: "Liquid Preparation",
  SECTION_SUBTITLE: "Record blending parameters and weightment data for liquid raw materials",
  PART_A_TITLE: "HTPB Blending",
  PART_A_SUBTITLE: "Fixed blending parameters - enter values as observed",
  PART_B_TITLE: "Weightment",
  PART_B_SUBTITLE: "Record weight and lot details for each raw material transferred",
  PART_A_TAG: "Part A",
  PART_B_TAG: "Part B",
  ALL_FILLED: "All filled",
  FILLED_SUFFIX: "filled",
  MATERIAL_COUNT_LABEL: (count: number) => `${count} material${count > 1 ? "s" : ""}`,
  ADD_MATERIAL: "Add Material",
  ADD_ROW: "Add Row",
  SELECT_MATERIAL_PLACEHOLDER: "- Choose material -",
  MATERIAL_HINT: "Select a material and click Add Row - the same material can be added multiple times",
  EMPTY_ROWS_TITLE: "No materials added yet",
  EMPTY_ROWS_SUBTITLE: "Choose a material above and click Add Row to begin recording weightment data",
  REMOVE_ROW_TOOLTIP: "Remove row",
  OPTIONAL_REMARKS: "Optional remarks...",
} as const;

export const PART_A_INITIAL = {
  jacketTemp: "",
  rpm: "",
  time: "",
};

export const WEIGHTMENT_MATERIALS = ["HTPB", "DOA", "Adduct", "TDI"];

const MATERIAL_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  HTPB: { color: "#1565C0", bg: alpha("#1565C0", 0.08), border: alpha("#1565C0", 0.22) },
  DOA: { color: "#2E7D32", bg: alpha("#2E7D32", 0.08), border: alpha("#2E7D32", 0.22) },
  Adduct: { color: "#6A1B9A", bg: alpha("#6A1B9A", 0.08), border: alpha("#6A1B9A", 0.22) },
  TDI: { color: "#BF360C", bg: alpha("#BF360C", 0.08), border: alpha("#BF360C", 0.22) },
};

export const getWeightmentMaterialColor = (material: string, fallbackPrimary: string) =>
  MATERIAL_COLORS[material] ?? {
    color: fallbackPrimary,
    bg: alpha(fallbackPrimary, 0.08),
    border: alpha(fallbackPrimary, 0.2),
  };
