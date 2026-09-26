import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import { formatMotorStageLabel } from "@data/models/admin/MasterData/MixingCycleMasterModel";
import {
  isMixTypeValue,
  MIX_TYPE_OPTIONS,
} from "@data/models/admin/MasterData/mixTypeOptions";
import {
  firstFieldErrorMessage,
  validateReferenceRangeFields,
} from "@data/models/admin/MasterData/masterDataFieldValidators";
import {
  emptyReferenceRange,
  formatMasterDataReferenceRangeLabel,
  parseReferenceRange,
  serializeReferenceRange,
  type MasterDataReferenceRange,
} from "@data/models/admin/MasterData/nestedMasterDataTypes";

export type QualityCheckParamForm = {
  parameterId: string;
  parameterName: string;
  specification: MasterDataReferenceRange;
  noOfSamples: number | "";
  isActive: boolean;
  isExisting?: boolean;
};

export type QualityCheckRecord = MasterDataAuditFields & {
  id: number;
  qualityCheckCode: string;
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
  id: number | null;
  qualityCheckCode: string;
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
  isActive: true,
  isExisting: false,
});

export const createEmptyQualityCheckForm = (): QualityCheckFormState => ({
  id: null,
  qualityCheckCode: "",
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
  isActive: raw?.isActive !== false,
});

export const QualityCheckRecordModel = {
  fromApi: (raw: any): QualityCheckRecord => ({
    ...parseMasterDataAuditFields(raw),
    id: Number(raw?.id),
    qualityCheckCode: String(raw?.qualityCheckCode ?? ""),
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
  qualityCheckCode: record.qualityCheckCode,
  mixType: record.mixType,
  motorStage: record.motorStage,
  isActive: record.isActive,
  qualityChecks: record.qualityChecks.map((p) => ({
    ...p,
    specification: { ...p.specification },
    isExisting: true,
  })),
});

const serializeParam = (p: QualityCheckParamForm) => ({
  parameterId: p.parameterId.trim() || undefined,
  parameterName: p.parameterName.trim(),
  specification: serializeReferenceRange(p.specification),
  noOfSamples: p.noOfSamples === "" ? undefined : Number(p.noOfSamples),
  isActive: p.isActive,
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

export const buildQualityCheckDeletePayload = (id: number) => ({ id });

export type QualityCheckParamFieldErrors = {
  parameterName?: string;
  minValue?: string;
  maxValue?: string;
  unit?: string;
  noOfSamples?: string;
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
  if (!form.mixType.trim()) {
    errors.mixType = "Mix type is required";
  } else if (!isMixTypeValue(form.mixType.trim())) {
    errors.mixType = "Select a valid mix type";
  }
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    errors.motorStage = "Motor stage is required";
  }
  if (!isEdit && !errors.mixType && !errors.motorStage) {
    const mix = form.mixType.trim();
    const stage = Number(form.motorStage);
    const duplicate = existing.some((item) => item.mixType.trim() === mix && item.motorStage === stage);
    if (duplicate) {
      errors.mixType = `Quality check already exists for ${mix} and stage ${stage}`;
    }
  }
  if (!isEdit && form.qualityChecks.length === 0) {
    errors.form = "Add at least one quality check parameter";
    return errors;
  }
  const paramIds = new Set<string>();
  errors.qualityChecks = form.qualityChecks.map((param) => {
    if (isEdit && param.isExisting) {
      const unitMissing =
        param.specification.unitId == null && !String(param.specification.unit ?? "").trim();
      if (!unitMissing) return {};
      const label = param.parameterName.trim() || "parameter";
      return { unit: `Unit is required for "${label}"` };
    }
    const paramErrors: QualityCheckParamFieldErrors = {};
    const name = param.parameterName.trim();
    if (!name) {
      paramErrors.parameterName = "Parameter name is required";
    }
    const label = name || "parameter";
    const rangeErrors = validateReferenceRangeFields(param.specification, label, true);
    if (rangeErrors.minValue) paramErrors.minValue = rangeErrors.minValue;
    if (rangeErrors.maxValue) paramErrors.maxValue = rangeErrors.maxValue;
    const { unitId, unit } = param.specification;
    if (unitId == null && !String(unit ?? "").trim()) {
      paramErrors.unit = `Unit is required for "${label}"`;
    }
    if (
      param.noOfSamples === "" ||
      Number.isNaN(Number(param.noOfSamples)) ||
      Number(param.noOfSamples) < 1
    ) {
      paramErrors.noOfSamples = `No of samples is required for "${label}"`;
    }
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

export {
  emptyMasterDataStats,
  formatMotorStageLabel,
  formatMasterDataReferenceRangeLabel,
  MIX_TYPE_OPTIONS,
};
