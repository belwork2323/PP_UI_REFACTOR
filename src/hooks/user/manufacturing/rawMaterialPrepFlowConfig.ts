import {
  normalizeMaterialsListResponse,
  type MaterialsListGrade,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";

export const PREMIX_COUNT = 15;

export const PREMIX_OPTIONS = Array.from({ length: PREMIX_COUNT }, (_, i) => i + 1);

export type RawMaterialPrepProcessKey = "solid" | "liquid";

export type RawMaterialPrepSelectedProcesses = Record<RawMaterialPrepProcessKey, boolean>;

export const DEFAULT_SELECTED_PROCESSES: RawMaterialPrepSelectedProcesses = {
  solid: false,
  liquid: false,
};

export type RawMaterialPrepMaterialGrade = MaterialsListGrade;

export type RawMaterialPrepMaterialOption = MaterialsListItem;

export const normalizeMaterialsList = normalizeMaterialsListResponse;

export const findPrepMaterialByCode = (
  materials: RawMaterialPrepMaterialOption[],
  materialCode: string
) =>
  materials.find((m) => m.materialCode.toUpperCase() === String(materialCode ?? "").toUpperCase());

export const getPrepMaterialGrades = (
  materials: RawMaterialPrepMaterialOption[],
  materialCode: string
) => findPrepMaterialByCode(materials, materialCode)?.grades ?? [];

export const materialRequiresGradeSelection = (
  materials: RawMaterialPrepMaterialOption[],
  materialCode: string
) => getPrepMaterialGrades(materials, materialCode).length > 0;

export const RAW_MATERIAL_PREP_PROCESSES = [
  { value: "solid" as const, label: "Solid ingredients processing" },
  { value: "liquid" as const, label: "Liquid ingredients processing" },
];

export const getPremixLabel = (n: number) => `Premix - ${n}`;

export const normalizeBatchScale = (batchType?: string) => {
  const normalized = String(batchType ?? "").toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("sub")) return "subscale" as const;
  if (normalized.includes("main")) return "mainscale" as const;
  return null;
};

export const getBatchScaleLabel = (batchType?: string) => {
  const scale = normalizeBatchScale(batchType);
  if (scale === "mainscale") return "Main Scale";
  if (scale === "subscale") return "Sub Scale";
  return batchType || "—";
};
