import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  firstFieldErrorMessage,
  validateMasterDataNameField,
  validateReferenceRangeFields,
} from "@data/models/admin/MasterData/masterDataFieldValidators";
import {
  emptyReferenceRange,
  parseReferenceRange,
  serializeReferenceRange,
  type MasterDataReferenceRange,
} from "@data/models/admin/MasterData/nestedMasterDataTypes";

export type InsulationTypeValue = "ROCASIN" | "EPDM" | string;

export type InsulationParameterForm = {
  specificationCode: string;
  specificationName: string;
  referenceRange: MasterDataReferenceRange;
  isActive: boolean;
  /** Present only in UI state for rows loaded from the server. */
  isExisting?: boolean;
};

export type InsulationCategoryForm = {
  category: string;
  parameters: InsulationParameterForm[];
  isActive: boolean;
  /** Present only in UI state for rows loaded from the server. */
  isExisting?: boolean;
};

export type InsulationSpecRecord = MasterDataAuditFields & {
  insulationSpecId: number;
  code: string;
  insulationType: InsulationTypeValue;
  isActive: boolean;
  specifications: InsulationCategoryForm[];
};

export type InsulationSpecListPayload = {
  items: InsulationSpecRecord[];
  stats: MasterDataStats;
};

export type InsulationSpecFormState = {
  insulationSpecId: number | null;
  code: string;
  insulationType: InsulationTypeValue;
  isActive: boolean;
  specifications: InsulationCategoryForm[];
};

export const emptyInsulationParameter = (): InsulationParameterForm => ({
  specificationCode: "",
  specificationName: "",
  referenceRange: emptyReferenceRange(),
  isActive: true,
  isExisting: false,
});

export const emptyInsulationCategory = (): InsulationCategoryForm => ({
  category: "",
  parameters: [],
  isActive: true,
  isExisting: false,
});

export const createEmptyInsulationForm = (): InsulationSpecFormState => ({
  insulationSpecId: null,
  code: "",
  insulationType: "",
  isActive: true,
  specifications: [],
});

const mapParameter = (raw: any): InsulationParameterForm => ({
  specificationCode: String(raw?.specificationCode ?? ""),
  specificationName: String(raw?.specificationName ?? ""),
  referenceRange: parseReferenceRange(raw?.referenceRange),
  isActive: raw?.isActive !== false,
});

const mapCategory = (raw: any): InsulationCategoryForm => ({
  category: String(raw?.category ?? ""),
  parameters: Array.isArray(raw?.parameters) ? raw.parameters.map(mapParameter) : [],
  isActive: raw?.isActive !== false,
});

export const InsulationSpecRecordModel = {
  fromApi: (raw: any): InsulationSpecRecord => ({
    ...parseMasterDataAuditFields(raw),
    insulationSpecId: Number(raw?.insulationSpecId ?? 0),
    code: String(raw?.code ?? ""),
    insulationType: String(raw?.insulationType ?? ""),
    isActive: raw?.isActive !== false,
    specifications: Array.isArray(raw?.specifications) ? raw.specifications.map(mapCategory) : [],
  }),
};

export const InsulationSpecListModel = {
  fromApi: (res: any): InsulationSpecListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(InsulationSpecRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapInsulationRecordToForm = (record: InsulationSpecRecord): InsulationSpecFormState => ({
  insulationSpecId: record.insulationSpecId,
  code: record.code,
  insulationType: record.insulationType,
  isActive: record.isActive,
  specifications: record.specifications.map((c) => ({
    category: c.category,
    isActive: c.isActive,
    isExisting: true,
    parameters: c.parameters.map((p) => ({
      ...p,
      referenceRange: { ...p.referenceRange },
      isActive: p.isActive,
      isExisting: true,
    })),
  })),
});

const serializeParameter = (p: InsulationParameterForm) => {
  const payload: Record<string, unknown> = {
    specificationName: p.specificationName.trim(),
    referenceRange: serializeReferenceRange(p.referenceRange),
    isActive: p.isActive,
  };
  const code = p.specificationCode.trim();
  if (code) {
    payload.specificationCode = code;
  }
  return payload;
};

const serializeCategory = (c: InsulationCategoryForm) => ({
  category: c.category.trim(),
  isActive: c.isActive,
  parameters: (c.parameters ?? []).map(serializeParameter),
});

export const buildInsulationCreatePayload = (form: InsulationSpecFormState) => ({
  insulationType: form.insulationType,
  isActive: form.isActive,
  specifications: form.specifications.map(serializeCategory),
});

export const buildInsulationUpdatePayload = (form: InsulationSpecFormState) => ({
  insulationSpecId: form.insulationSpecId,
  insulationType: form.insulationType,
  isActive: form.isActive,
  specifications: form.specifications.map(serializeCategory),
});

export const buildInsulationDeletePayload = (insulationSpecId: number) => ({
  insulationSpecId,
});

export type InsulationParameterFieldErrors = {
  specificationName?: string;
  minValue?: string;
  maxValue?: string;
  unit?: string;
};

export type InsulationCategoryFieldErrors = {
  category?: string;
  parameters?: InsulationParameterFieldErrors[];
};

export type InsulationFormFieldErrors = {
  insulationType?: string;
  form?: string;
  specifications?: InsulationCategoryFieldErrors[];
};

const validateInsulationType = (raw: string): string | null =>
  validateMasterDataNameField(raw, "Insulation type", true, 64);

const ensureCategoryErrors = (
  errors: InsulationFormFieldErrors,
  index: number,
): InsulationCategoryFieldErrors => {
  if (!errors.specifications) errors.specifications = [];
  while (errors.specifications.length <= index) {
    errors.specifications.push({});
  }
  return errors.specifications[index];
};

const ensureParameterErrors = (
  categoryErrors: InsulationCategoryFieldErrors,
  index: number,
): InsulationParameterFieldErrors => {
  if (!categoryErrors.parameters) categoryErrors.parameters = [];
  while (categoryErrors.parameters.length <= index) {
    categoryErrors.parameters.push({});
  }
  return categoryErrors.parameters[index];
};

export const getInsulationFormFieldErrors = (
  form: InsulationSpecFormState,
  isEdit: boolean,
  existingTypes: string[] = [],
): InsulationFormFieldErrors => {
  const errors: InsulationFormFieldErrors = {};

  const typeError = validateInsulationType(String(form.insulationType ?? ""));
  if (typeError) {
    errors.insulationType = typeError;
  } else if (!isEdit) {
    const type = String(form.insulationType ?? "").trim();
    const duplicate = existingTypes.some(
      (existing) => existing.trim().toLowerCase() === type.toLowerCase(),
    );
    if (duplicate) {
      errors.insulationType = `Insulation specification already exists for type: ${type}`;
    }
  }

  if (form.specifications.length === 0) {
    errors.form = "Add at least one category";
    return errors;
  }

  const categoryNames = new Set<string>();
  form.specifications.forEach((categoryForm, categoryIndex) => {
    const categoryErrors = ensureCategoryErrors(errors, categoryIndex);
    const locked = isEdit && Boolean(categoryForm.isExisting);
    const category = categoryForm.category.trim();

    if (!locked) {
      const categoryNameError = validateMasterDataNameField(categoryForm.category, "Category", true, 255);
      if (categoryNameError) {
        categoryErrors.category = categoryNameError;
      } else if (category) {
        const categoryKey = category.toLowerCase();
        if (categoryNames.has(categoryKey)) {
          categoryErrors.category = `Duplicate category: ${category}`;
        }
        categoryNames.add(categoryKey);
      }
    }

    if (category && categoryForm.parameters.length === 0) {
      categoryErrors.category =
        categoryErrors.category ?? `Category "${category}" needs at least one parameter`;
    }

    categoryForm.parameters.forEach((parameter, parameterIndex) => {
      if (isEdit && parameter.isExisting) return;

      const parameterErrors = ensureParameterErrors(categoryErrors, parameterIndex);
      const nameError = validateMasterDataNameField(
        parameter.specificationName,
        "Parameter name",
        true,
        255,
      );
      if (nameError) parameterErrors.specificationName = nameError;

      const label = parameter.specificationName.trim() || "parameter";
      const rangeErrors = validateReferenceRangeFields(parameter.referenceRange, label, true);
      if (rangeErrors.minValue) parameterErrors.minValue = rangeErrors.minValue;
      if (rangeErrors.maxValue) parameterErrors.maxValue = rangeErrors.maxValue;
      if (rangeErrors.unit) parameterErrors.unit = rangeErrors.unit;
    });
  });

  return errors;
};

export const getInsulationFormValidationMessage = (
  errors: InsulationFormFieldErrors,
): string | null => firstFieldErrorMessage(errors);

export const validateInsulationForm = (
  form: InsulationSpecFormState,
  isEdit: boolean,
  existingTypes: string[] = [],
): string | null =>
  getInsulationFormValidationMessage(getInsulationFormFieldErrors(form, isEdit, existingTypes));

export { emptyMasterDataStats };
