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

export type QualityCheckParamForm = {
  parameterId: string;
  parameterName: string;
  specification: MasterDataReferenceRange;
  noOfSamples: number | "";
};

export type QualityCheckRecord = MasterDataAuditFields & {
  id: string;
  mixType: string;
  motorStage: number;
  isActive: boolean;
  qualityChecks: QualityCheckParamForm[];
};

export type QualityCheckListPayload = {
  items: QualityCheckRecord[];
  stats: MasterDataStats;
};

export type QualityCheckFormState = {
  id: string | null;
  mixType: string;
  motorStage: number | "";
  isActive: boolean;
  qualityChecks: QualityCheckParamForm[];
};

export const emptyQualityCheckParam = (): QualityCheckParamForm => ({
  parameterId: "",
  parameterName: "",
  specification: emptyReferenceRange(),
  noOfSamples: "",
});

export const createEmptyQualityCheckForm = (): QualityCheckFormState => ({
  id: null,
  mixType: "",
  motorStage: "",
  isActive: true,
  qualityChecks: [],
});

const mapParam = (raw: any): QualityCheckParamForm => ({
  parameterId: String(raw?.parameterId ?? ""),
  parameterName: String(raw?.parameterName ?? ""),
  specification: parseReferenceRange(raw?.specification),
  noOfSamples: raw?.noOfSamples != null ? Number(raw.noOfSamples) : "",
});

export const QualityCheckRecordModel = {
  fromApi: (raw: any): QualityCheckRecord => ({
    ...parseMasterDataAuditFields(raw),
    id: String(raw?.id ?? ""),
    mixType: String(raw?.mixType ?? ""),
    motorStage: Number(raw?.motorStage ?? 0),
    isActive: raw?.isActive !== false,
    qualityChecks: Array.isArray(raw?.qualityChecks) ? raw.qualityChecks.map(mapParam) : [],
  }),
};

export const QualityCheckListModel = {
  fromApi: (res: any): QualityCheckListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(QualityCheckRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapQualityCheckRecordToForm = (record: QualityCheckRecord): QualityCheckFormState => ({
  id: record.id,
  mixType: record.mixType,
  motorStage: record.motorStage,
  isActive: record.isActive,
  qualityChecks: record.qualityChecks.map((p) => ({
    ...p,
    specification: { ...p.specification },
  })),
});

const serializeParam = (p: QualityCheckParamForm) => ({
  parameterId: p.parameterId.trim() || undefined,
  parameterName: p.parameterName.trim(),
  specification: serializeReferenceRange(p.specification),
  noOfSamples: p.noOfSamples === "" ? undefined : Number(p.noOfSamples),
});

export const buildQualityCheckCreatePayload = (form: QualityCheckFormState) => ({
  mixType: form.mixType.trim(),
  motorStage: Number(form.motorStage),
  isActive: form.isActive,
  qualityChecks: form.qualityChecks.map(serializeParam),
});

export const buildQualityCheckUpdatePayload = (form: QualityCheckFormState) => ({
  id: form.id,
  mixType: form.mixType.trim(),
  motorStage: Number(form.motorStage),
  isActive: form.isActive,
  qualityChecks: form.qualityChecks.map(serializeParam),
});

export const buildQualityCheckDeletePayload = (id: string) => ({ id });

export type QualityCheckParamFieldErrors = {
  parameterName?: string;
  minValue?: string;
  maxValue?: string;
  unit?: string;
};

export type QualityCheckFieldErrors = {
  mixType?: string;
  motorStage?: string;
  form?: string;
  qualityChecks?: QualityCheckParamFieldErrors[];
};

export const getQualityCheckFieldErrors = (
  form: QualityCheckFormState,
  isEdit: boolean,
  existing: QualityCheckRecord[] = [],
): QualityCheckFieldErrors => {
  const errors: QualityCheckFieldErrors = {};
  const mixTypeError = validateMasterDataNameField(form.mixType, "Mix type");
  if (mixTypeError) errors.mixType = mixTypeError;
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    errors.motorStage = "Motor stage is required";
  }
  if (!isEdit && !errors.mixType && !errors.motorStage) {
    const mix = form.mixType.trim().toLowerCase();
    const stage = Number(form.motorStage);
    const duplicate = existing.some(
      (item) => item.mixType.trim().toLowerCase() === mix && item.motorStage === stage,
    );
    if (duplicate) {
      errors.mixType = `Quality check already exists for mix type ${form.mixType.trim()} and stage ${stage}`;
    }
  }
  if (form.qualityChecks.length === 0) {
    errors.form = "Add at least one quality check parameter";
    return errors;
  }
  const paramIds = new Set<string>();
  errors.qualityChecks = form.qualityChecks.map((param) => {
    const paramErrors: QualityCheckParamFieldErrors = {};
    const nameError = validateMasterDataNameField(param.parameterName, "Parameter name");
    if (nameError) paramErrors.parameterName = nameError;
    const label = param.parameterName.trim() || "parameter";
    const rangeErrors = validateReferenceRangeFields(param.specification, label, false);
    if (rangeErrors.minValue) paramErrors.minValue = rangeErrors.minValue;
    if (rangeErrors.maxValue) paramErrors.maxValue = rangeErrors.maxValue;
    if (rangeErrors.unit) paramErrors.unit = rangeErrors.unit;
    const paramId = param.parameterId.trim().toLowerCase();
    if (paramId) {
      if (paramIds.has(paramId)) {
        paramErrors.parameterName =
          paramErrors.parameterName ?? `Duplicate parameter ID: ${param.parameterId.trim()}`;
      }
      paramIds.add(paramId);
    }
    return paramErrors;
  });
  return errors;
};

export const getQualityCheckValidationMessage = (errors: QualityCheckFieldErrors): string | null =>
  firstFieldErrorMessage(errors);

export const validateQualityCheckForm = (
  form: QualityCheckFormState,
  isEdit: boolean,
  existing: QualityCheckRecord[] = [],
): string | null =>
  getQualityCheckValidationMessage(getQualityCheckFieldErrors(form, isEdit, existing));

export { emptyMasterDataStats };
