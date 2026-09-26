import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  emptyReferenceRange,
  parseReferenceRange,
  serializeReferenceRange,
  type MasterDataReferenceRange,
} from "@data/models/admin/MasterData/nestedMasterDataTypes";
import {
  firstFieldErrorMessage,
  validateMasterDataCodeField,
  validateMasterDataNameField,
  validateReferenceRangeFields,
  type ReferenceRangeFieldErrors,
} from "@data/models/admin/MasterData/masterDataFieldValidators";

export type MaterialTypeValue = "SOLID" | "LIQUID";

export type RawMaterialTypeValue = "NORMAL" | "ACEM";

export type PreparationTypeValue =
  | "ADDUCT"
  | "HTPB Blending"
  | "AP Fine"
  | "AP ultrafine";

export const RAW_MATERIAL_TYPE_OPTIONS: { value: RawMaterialTypeValue; label: string }[] = [
  { value: "NORMAL", label: "Non ACEM" },
  { value: "ACEM", label: "ACEM materials" },
];

export const getRawMaterialCategoryLabel = (type: RawMaterialTypeValue): string =>
  type === "ACEM" ? "ACEM materials" : "Non ACEM";

export const PREPARATION_TYPE_OPTIONS: { value: PreparationTypeValue; label: string }[] = [
  { value: "ADDUCT", label: "ADDUCT" },
  { value: "HTPB Blending", label: "HTPB Blending" },
];

const LEGACY_PREPARATION_TYPE_VALUES = new Set<string>(["AP Fine", "AP ultrafine"]);

const PREPARATION_TYPE_VALUES = new Set<string>([
  ...PREPARATION_TYPE_OPTIONS.map((o) => o.value),
  ...LEGACY_PREPARATION_TYPE_VALUES,
]);

export const parseRawMaterialType = (raw: unknown): RawMaterialTypeValue => {
  const value = String(raw ?? "NORMAL").trim().toUpperCase();
  return value === "ACEM" ? "ACEM" : "NORMAL";
};

export const parsePreparationType = (raw: unknown): PreparationTypeValue | "" => {
  const value = String(raw ?? "").trim();
  if (PREPARATION_TYPE_VALUES.has(value)) return value as PreparationTypeValue;
  return "";
};

export type MaterialSpecForm = {
  specificationCode: string;
  specificationName: string;
  referenceRange: MasterDataReferenceRange;
  isActive: boolean;
  isExisting?: boolean;
};

export type MaterialGradeForm = {
  gradeId: string;
  gradeCode: string;
  gradeName: string;
  specifications: MaterialSpecForm[];
  isActive: boolean;
  /** Present only in UI state for rows loaded from the server. */
  isExisting?: boolean;
};

export type MaterialsMasterRecord = MasterDataAuditFields & {
  materialId: number;
  materialCode: string;
  materialName: string;
  materialType: MaterialTypeValue;
  rawMaterialType: RawMaterialTypeValue;
  preparationType: PreparationTypeValue | "";
  isActive: boolean;
  grades: MaterialGradeForm[];
  specifications: MaterialSpecForm[];
};

export type MaterialsMasterListPayload = {
  items: MaterialsMasterRecord[];
  stats: MasterDataStats;
};

export type MaterialsMasterFormState = {
  materialId: number | null;
  materialCode: string;
  materialName: string;
  materialType: MaterialTypeValue;
  rawMaterialType: RawMaterialTypeValue | "";
  preparationType: PreparationTypeValue | "";
  isActive: boolean;
  grades: MaterialGradeForm[];
  specifications: MaterialSpecForm[];
};

export const emptyMaterialSpec = (): MaterialSpecForm => ({
  specificationCode: "",
  specificationName: "",
  referenceRange: emptyReferenceRange(),
  isActive: true,
  isExisting: false,
});

/** Next SPEC-N code for a new row, based on codes already present in the same list. */
export const resolveNextSpecificationCode = (specs: MaterialSpecForm[]): string => {
  const maxNum = specs.reduce((max, spec) => {
    const match = spec.specificationCode.trim().match(/^SPEC-(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
  return `SPEC-${maxNum + 1}`;
};

export const createMaterialSpecForAdd = (existingSpecs: MaterialSpecForm[] = []): MaterialSpecForm => ({
  ...emptyMaterialSpec(),
  specificationCode: resolveNextSpecificationCode(existingSpecs),
});

export const emptyMaterialGrade = (): MaterialGradeForm => ({
  gradeId: "",
  gradeCode: "",
  gradeName: "",
  specifications: [],
  isActive: true,
  isExisting: false,
});

export const createEmptyMaterialsForm = (): MaterialsMasterFormState => ({
  materialId: null,
  materialCode: "",
  materialName: "",
  materialType: "SOLID",
  rawMaterialType: "",
  preparationType: "",
  isActive: true,
  grades: [],
  specifications: [],
});

const mapSpec = (raw: any): MaterialSpecForm => ({
  specificationCode: String(raw?.specificationCode ?? ""),
  specificationName: String(raw?.specificationName ?? ""),
  referenceRange: parseReferenceRange(raw?.referenceRange),
  isActive: raw?.isActive !== false,
});

const mapGrade = (raw: any): MaterialGradeForm => ({
  gradeId: String(raw?.gradeId ?? ""),
  gradeCode: String(raw?.gradeCode ?? ""),
  gradeName: String(raw?.gradeName ?? ""),
  specifications: Array.isArray(raw?.specifications) ? raw.specifications.map(mapSpec) : [],
  isActive: raw?.isActive !== false,
});

export const MaterialsMasterRecordModel = {
  fromApi: (raw: any): MaterialsMasterRecord => ({
    ...parseMasterDataAuditFields(raw),
    materialId: Number(raw?.materialId),
    materialCode: String(raw?.materialCode ?? ""),
    materialName: String(raw?.materialName ?? ""),
    materialType: String(raw?.materialType ?? "SOLID").toUpperCase() === "LIQUID" ? "LIQUID" : "SOLID",
    rawMaterialType: parseRawMaterialType(raw?.rawMaterialType),
    preparationType: parsePreparationType(raw?.preparationType),
    isActive: raw?.isActive !== false,
    grades: Array.isArray(raw?.grades) ? raw.grades.map(mapGrade) : [],
    specifications: Array.isArray(raw?.specifications) ? raw.specifications.map(mapSpec) : [],
  }),
};

export const MaterialsMasterListModel = {
  fromApi: (res: any): MaterialsMasterListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(MaterialsMasterRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapMaterialRecordToForm = (record: MaterialsMasterRecord): MaterialsMasterFormState => ({
  materialId: record.materialId,
  materialCode: record.materialCode,
  materialName: record.materialName,
  materialType: record.materialType,
  rawMaterialType: record.rawMaterialType,
  preparationType: record.preparationType,
  isActive: record.isActive,
  grades: record.grades.map((g) => ({
    ...g,
    isActive: g.isActive,
    isExisting: true,
    specifications: g.specifications.map((s) => ({
      ...s,
      referenceRange: { ...s.referenceRange },
      isActive: s.isActive,
      isExisting: true,
    })),
  })),
  specifications: record.specifications.map((s) => ({
    ...s,
    referenceRange: { ...s.referenceRange },
    isActive: s.isActive,
    isExisting: true,
  })),
});

export type MaterialSpecFieldErrors = ReferenceRangeFieldErrors & {
  specificationCode?: string;
  specificationName?: string;
};

export type MaterialGradeFieldErrors = {
  gradeCode?: string;
  gradeName?: string;
  specifications?: MaterialSpecFieldErrors[];
};

export type MaterialsFormFieldErrors = {
  materialCode?: string;
  materialName?: string;
  rawMaterialType?: string;
  preparationType?: string;
  materialType?: string;
  form?: string;
  grades?: MaterialGradeFieldErrors[];
  specifications?: MaterialSpecFieldErrors[];
};

const mapSpecFieldErrors = (
  spec: MaterialSpecForm,
  isEdit: boolean,
): MaterialSpecFieldErrors => {
  if (isEdit && spec.isExisting) {
    const errors: MaterialSpecFieldErrors = {};
    if (!spec.specificationCode.trim()) {
      errors.specificationCode =
        "Specification code is missing for an existing record. Refresh the list or fix the data in the database.";
    }
    return errors;
  }
  const errors: MaterialSpecFieldErrors = {};
  const nameError = validateMasterDataNameField(spec.specificationName, "Specification name");
  if (nameError) errors.specificationName = nameError;
  const label = spec.specificationName.trim() || "specification";
  const rangeErrors = validateReferenceRangeFields(spec.referenceRange, label, false);
  return { ...errors, ...rangeErrors };
};

const serializeSpec = (s: MaterialSpecForm) => {
  const code = s.specificationCode.trim();
  if (s.isExisting) {
    // Existing specs are readonly except isActive; omit name/range so the backend
    // does not reject updates when display labels differ from stored values.
    return {
      specificationCode: code,
      isActive: s.isActive,
    };
  }
  const payload: Record<string, unknown> = {
    specificationName: s.specificationName.trim(),
    referenceRange: serializeReferenceRange(s.referenceRange),
    isActive: s.isActive,
  };
  if (code) {
    payload.specificationCode = code;
  }
  return payload;
};

const serializeGrade = (g: MaterialGradeForm) => ({
  gradeId: g.gradeId.trim() || undefined,
  gradeCode: g.gradeCode.trim(),
  gradeName: g.gradeName.trim(),
  isActive: g.isActive,
  specifications: (g.specifications ?? []).map(serializeSpec),
});

const buildMaterialsPayloadBody = (form: MaterialsMasterFormState) => {
  const rawMaterialType = form.rawMaterialType === "ACEM" ? "ACEM" : "NORMAL";
  const body: Record<string, unknown> = {
    materialCode: form.materialCode.trim(),
    materialName: form.materialName.trim(),
    materialType: form.materialType,
    rawMaterialType,
    isActive: form.isActive,
    grades: form.grades.map(serializeGrade),
    specifications: form.specifications.map(serializeSpec),
  };
  if (rawMaterialType === "ACEM") {
    body.preparationType = form.preparationType;
  }
  return body;
};

export const buildMaterialsCreatePayload = (form: MaterialsMasterFormState) =>
  buildMaterialsPayloadBody(form);

export const buildMaterialsUpdatePayload = (form: MaterialsMasterFormState) => ({
  materialId: form.materialId,
  ...buildMaterialsPayloadBody(form),
});

export const buildMaterialsDeletePayload = (materialId: number) => ({ materialId });

export const getMaterialsFormFieldErrors = (
  form: MaterialsMasterFormState,
  isEdit: boolean,
  existingCodes: string[] = [],
): MaterialsFormFieldErrors => {
  const errors: MaterialsFormFieldErrors = {};
  if (form.rawMaterialType !== "NORMAL" && form.rawMaterialType !== "ACEM") {
    errors.rawMaterialType = "Category is required";
  }
  if (form.rawMaterialType === "ACEM") {
    if (!form.preparationType || !PREPARATION_TYPE_VALUES.has(form.preparationType)) {
      errors.preparationType = "Preparation type is required for ACEM raw materials";
    }
  }

  const showMaterialFields =
    isEdit ||
    form.rawMaterialType === "NORMAL" ||
    (form.rawMaterialType === "ACEM" && Boolean(form.preparationType));
  if (!showMaterialFields) return errors;

  if (!isEdit) {
    const codeError = validateMasterDataCodeField(form.materialCode, "Material code");
    if (codeError) {
      errors.materialCode = codeError;
    } else {
      const code = form.materialCode.trim().toLowerCase();
      if (existingCodes.some((existing) => existing.trim().toLowerCase() === code)) {
        errors.materialCode = `Material code already exists: ${form.materialCode.trim()}`;
      }
    }
  }

  const nameError = validateMasterDataNameField(form.materialName, "Material name");
  if (nameError) errors.materialName = nameError;
  if (form.materialType !== "SOLID" && form.materialType !== "LIQUID") {
    errors.materialType = "Material type must be SOLID or LIQUID";
  }
  if (form.grades.length === 0 && form.specifications.length === 0) {
    errors.form = "Add at least one grade or top-level specification";
    return errors;
  }
  if (form.grades.length > 0 && form.specifications.length > 0) {
    errors.form = "Use either grades or top-level specifications, not both";
    return errors;
  }

  const gradeCodes = new Set<string>();
  errors.grades = form.grades.map((grade) => {
    const gradeErrors: MaterialGradeFieldErrors = {};
    const locked = isEdit && Boolean(grade.isExisting);
    if (!locked) {
      const gradeCodeError = validateMasterDataCodeField(grade.gradeCode, "Grade code");
      if (gradeCodeError) {
        gradeErrors.gradeCode = gradeCodeError;
      } else {
        const key = grade.gradeCode.trim().toLowerCase();
        if (gradeCodes.has(key)) {
          gradeErrors.gradeCode = `Duplicate grade code: ${grade.gradeCode.trim()}`;
        }
        gradeCodes.add(key);
      }
      const gradeNameError = validateMasterDataNameField(grade.gradeName, "Grade name");
      if (gradeNameError) gradeErrors.gradeName = gradeNameError;
    }
    gradeErrors.specifications = grade.specifications.map((spec) => mapSpecFieldErrors(spec, isEdit));
    return gradeErrors;
  });
  errors.specifications = form.specifications.map((spec) => mapSpecFieldErrors(spec, isEdit));
  return errors;
};

export const getMaterialsFormValidationMessage = (errors: MaterialsFormFieldErrors): string | null =>
  firstFieldErrorMessage(errors);

export const validateMaterialsForm = (
  form: MaterialsMasterFormState,
  isEdit: boolean,
  existingCodes: string[] = [],
): string | null =>
  getMaterialsFormValidationMessage(getMaterialsFormFieldErrors(form, isEdit, existingCodes));

export { emptyMasterDataStats };
