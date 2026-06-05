export const RAW_MATERIAL_REVALIDATION_BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

export const QC_DIVISION_BRAND = {
  ...RAW_MATERIAL_REVALIDATION_BRAND,
};

export const NDT_BRAND = {
  ...RAW_MATERIAL_REVALIDATION_BRAND,
};

export const STATIC_TEST_FACILITY_BRAND = {
  ...RAW_MATERIAL_REVALIDATION_BRAND,
};

export const QUALITY_CONTROL_BRANDS = {
  rawMaterialRevalidation: RAW_MATERIAL_REVALIDATION_BRAND,
  qcDivision: QC_DIVISION_BRAND,
  ndt: NDT_BRAND,
  staticTestFacility: STATIC_TEST_FACILITY_BRAND,
};
