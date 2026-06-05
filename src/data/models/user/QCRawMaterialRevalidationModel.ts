export type RawMaterialRevalidationRow = {
  specificationCode: string;
  parameter: string;
  result: string;
  validity: string;
};

export type RawMaterialRevalidationBlock = {
  ingredient: string;
  lotNo: string;
  rows: RawMaterialRevalidationRow[];
};

export const INGREDIENT_SPECS: Record<string, Array<{ specificationCode: string; parameter: string }>> = {
  HTPB: [
    { specificationCode: "SPEC-HTPB-001", parameter: "OH value (mgKOH/g)" },
    { specificationCode: "SPEC-HTPB-002", parameter: "Moisture %" },
    { specificationCode: "SPEC-HTPB-003", parameter: "Acid value" },
    { specificationCode: "SPEC-HTPB-004", parameter: "Viscosity at 30°C (cP)" },
  ],
  DOA: [
    { specificationCode: "SPEC-DOA-001", parameter: "Saponification value (mgKOH/g)" },
    { specificationCode: "SPEC-DOA-002", parameter: "Acid value" },
    { specificationCode: "SPEC-DOA-003", parameter: "Moisture %" },
    { specificationCode: "SPEC-DOA-004", parameter: "Refractive Index at 30°C" },
  ],
  TDI: [
    { specificationCode: "SPEC-TDI-001", parameter: "Moisture %" },
    { specificationCode: "SPEC-TDI-002", parameter: "Sp. Gr. at 30°C" },
    { specificationCode: "SPEC-TDI-003", parameter: "Assay %" },
    { specificationCode: "SPEC-TDI-004", parameter: "Refractive Index at 30°C" },
  ],
  TMP: [
    { specificationCode: "SPEC-TMP-001", parameter: "Moisture %" },
    { specificationCode: "SPEC-TMP-002", parameter: "OH value" },
    { specificationCode: "SPEC-TMP-003", parameter: "Acid value" },
  ],
  nBD: [
    { specificationCode: "SPEC-NBD-001", parameter: "Moisture %" },
    { specificationCode: "SPEC-NBD-002", parameter: "OH value" },
    { specificationCode: "SPEC-NBD-003", parameter: "R.I at 25°C" },
  ],
  AP: [
    { specificationCode: "SPEC-AP-001", parameter: "Purity %" },
    { specificationCode: "SPEC-AP-002", parameter: "Moisture %" },
    { specificationCode: "SPEC-AP-003", parameter: "Particle Size D50 (µm)" },
    { specificationCode: "SPEC-AP-004", parameter: "pH" },
  ],
  Aluminium: [
    { specificationCode: "SPEC-ALUMINIUM-001", parameter: "Purity %" },
    { specificationCode: "SPEC-ALUMINIUM-002", parameter: "Moisture %" },
    { specificationCode: "SPEC-ALUMINIUM-003", parameter: "Particle Size D50 (µm)" },
    { specificationCode: "SPEC-ALUMINIUM-004", parameter: "Bulk Density (g/cc)" },
  ],
};

export const ALL_RAW_MATERIAL_INGREDIENTS = Object.keys(INGREDIENT_SPECS);

export const createRawMaterialRevalidationBlock = (
  ingredient: string
): RawMaterialRevalidationBlock => ({
  ingredient,
  lotNo: "",
  rows: (INGREDIENT_SPECS[ingredient] ?? []).map((spec) => ({
    specificationCode: spec.specificationCode,
    parameter: spec.parameter,
    result: "",
    validity: "",
  })),
});

export const createDefaultRawMaterialRevalidationState = () => [] as RawMaterialRevalidationBlock[];

export const hasAnyRawMaterialRevalidationValue = (
  blocks: RawMaterialRevalidationBlock[]
) => blocks.some((block) => block.rows.some((row) => row.result.trim().length > 0));

export const hasMinimumRawMaterialRevalidationData = hasAnyRawMaterialRevalidationValue;
