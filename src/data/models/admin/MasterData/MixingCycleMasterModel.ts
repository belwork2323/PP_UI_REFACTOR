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
  emptyQualityCheckParam,
  type QualityCheckParamFieldErrors,
  type QualityCheckParamForm,
} from "@data/models/admin/MasterData/QualityCheckMasterModel";
import {
  emptyReferenceRange,
  parseReferenceRange,
  serializeReferenceRange,
} from "@data/models/admin/MasterData/nestedMasterDataTypes";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export type MixingOperationForm = {
  operationId: number | null;
  sequenceNo: number | null;
  operationName: string;
  isActive: boolean;
  isExisting?: boolean;
};

export type MixingCycleGroupForm = {
  premixOperations: MixingOperationForm[];
  finalMixOperations: MixingOperationForm[];
  premixQualityChecks: QualityCheckParamForm[];
  finalMixQualityChecks: QualityCheckParamForm[];
};

export type MixingCycleRecord = MasterDataAuditFields & {
  id: number;
  mixingCycleCode: string;
  mixingCycleName: string;
  description: string;
  projectId: string;
  motorStage: number;
  motorStageName: string;
  isActive: boolean;
  cycles: MixingCycleGroupForm;
};

export type MixingCycleListPayload = {
  items: MixingCycleRecord[];
  stats: MasterDataStats;
};

export type MixingCycleFormState = {
  id: number | null;
  mixingCycleCode: string;
  mixingCycleName: string;
  description: string;
  projectId: string;
  motorStage: number | "";
  motorStageName: string;
  isActive: boolean;
  cycles: MixingCycleGroupForm;
};

export const emptyMixingOperation = (): MixingOperationForm => ({
  operationId: null,
  sequenceNo: null,
  operationName: "",
  isActive: true,
  isExisting: false,
});

export { emptyQualityCheckParam };

export const createEmptyMixingCycleForm = (): MixingCycleFormState => ({
  id: null,
  mixingCycleCode: "",
  mixingCycleName: "",
  description: "",
  projectId: "",
  motorStage: "",
  motorStageName: "",
  isActive: true,
  cycles: {
    premixOperations: [],
    finalMixOperations: [],
    premixQualityChecks: [],
    finalMixQualityChecks: [],
  },
});

const mapOp = (raw: any): MixingOperationForm => ({
  operationId: raw?.operationId != null ? Number(raw.operationId) : null,
  sequenceNo: raw?.sequenceNo != null ? Number(raw.sequenceNo) : null,
  operationName: String(raw?.operationName ?? ""),
  isActive: raw?.isActive !== false,
});

const mapParam = (raw: any): QualityCheckParamForm => ({
  parameterId: String(raw?.parameterId ?? ""),
  parameterName: String(raw?.parameterName ?? ""),
  specification: parseReferenceRange(raw?.specification),
  noOfSamples: raw?.noOfSamples != null ? Number(raw.noOfSamples) : "",
  isActive: raw?.isActive !== false,
});

const mapCycles = (raw: any): MixingCycleGroupForm => ({
  premixOperations: Array.isArray(raw?.premixOperations) ? raw.premixOperations.map(mapOp) : [],
  finalMixOperations: Array.isArray(raw?.finalMixOperations)
    ? raw.finalMixOperations.map(mapOp)
    : [],
  premixQualityChecks: Array.isArray(raw?.premixQualityChecks)
    ? raw.premixQualityChecks.map(mapParam)
    : [],
  finalMixQualityChecks: Array.isArray(raw?.finalMixQualityChecks)
    ? raw.finalMixQualityChecks.map(mapParam)
    : [],
});

export const MixingCycleRecordModel = {
  fromApi: (raw: any): MixingCycleRecord => ({
    ...parseMasterDataAuditFields(raw),
    id: Number(raw?.id),
    mixingCycleCode: String(raw?.mixingCycleCode ?? ""),
    mixingCycleName: String(raw?.mixingCycleName ?? ""),
    description: String(raw?.description ?? ""),
    projectId: String(raw?.projectId ?? ""),
    motorStage: Number(raw?.motorStage ?? 0),
    motorStageName: String(raw?.motorStageName ?? ""),
    isActive: raw?.isActive !== false,
    cycles: mapCycles(raw?.cycles),
  }),
};

export const MixingCycleListModel = {
  fromApi: (res: any): MixingCycleListPayload => {
    const data = res?.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items.map(MixingCycleRecordModel.fromApi) : [],
      stats: {
        total: Number(data?.stats?.total ?? 0),
        active: Number(data?.stats?.active ?? 0),
        inactive: Number(data?.stats?.inactive ?? 0),
      },
    };
  },
};

export const mapMixingRecordToForm = (record: MixingCycleRecord): MixingCycleFormState => ({
  id: record.id,
  mixingCycleCode: record.mixingCycleCode,
  mixingCycleName: record.mixingCycleName,
  description: record.description,
  projectId: record.projectId,
  motorStage: record.motorStage,
  motorStageName: record.motorStageName,
  isActive: record.isActive,
  cycles: {
    premixOperations: record.cycles.premixOperations.map((o) => ({ ...o, isExisting: true })),
    finalMixOperations: record.cycles.finalMixOperations.map((o) => ({ ...o, isExisting: true })),
    premixQualityChecks: record.cycles.premixQualityChecks.map((p) => ({
      ...p,
      specification: { ...p.specification },
      isExisting: true,
    })),
    finalMixQualityChecks: record.cycles.finalMixQualityChecks.map((p) => ({
      ...p,
      specification: { ...p.specification },
      isExisting: true,
    })),
  },
});

const serializeOp = (o: MixingOperationForm) => ({
  operationId: o.operationId ?? undefined,
  sequenceNo: o.sequenceNo ?? undefined,
  operationName: o.operationName.trim(),
  isActive: o.isActive,
});

const serializeParam = (p: QualityCheckParamForm) => ({
  parameterId: p.parameterId.trim() || undefined,
  parameterName: p.parameterName.trim(),
  specification: serializeReferenceRange(p.specification),
  noOfSamples: p.noOfSamples === "" ? undefined : Number(p.noOfSamples),
  isActive: p.isActive,
});

export const buildMixingCycleCreatePayload = (form: MixingCycleFormState) => ({
  projectId: form.projectId.trim(),
  motorStage: Number(form.motorStage),
  motorStageName: form.motorStageName.trim() || undefined,
  mixingCycleName: form.mixingCycleName.trim(),
  description: form.description.trim() || undefined,
  isActive: form.isActive,
  cycles: {
    premixOperations: form.cycles.premixOperations.map(serializeOp),
    finalMixOperations: form.cycles.finalMixOperations.map(serializeOp),
    premixQualityChecks: form.cycles.premixQualityChecks.map(serializeParam),
    finalMixQualityChecks: form.cycles.finalMixQualityChecks.map(serializeParam),
  },
});

export const buildMixingCycleUpdatePayload = (form: MixingCycleFormState) => ({
  id: form.id,
  mixingCycleCode: form.mixingCycleCode,
  projectId: form.projectId.trim(),
  motorStage: Number(form.motorStage),
  motorStageName: form.motorStageName.trim() || undefined,
  mixingCycleName: form.mixingCycleName.trim(),
  description: form.description.trim() || undefined,
  isActive: form.isActive,
  cycles: {
    premixOperations: form.cycles.premixOperations.map(serializeOp),
    finalMixOperations: form.cycles.finalMixOperations.map(serializeOp),
    premixQualityChecks: form.cycles.premixQualityChecks.map(serializeParam),
    finalMixQualityChecks: form.cycles.finalMixQualityChecks.map(serializeParam),
  },
});

export const buildMixingCycleDeletePayload = (id: number) => ({ id });

export type MixingOperationFieldErrors = { operationName?: string };

export type MixingCycleFieldErrors = {
  projectId?: string;
  motorStage?: string;
  mixingCycleName?: string;
  premixOperations?: MixingOperationFieldErrors[];
  finalMixOperations?: MixingOperationFieldErrors[];
  premixQualityChecks?: QualityCheckParamFieldErrors[];
  finalMixQualityChecks?: QualityCheckParamFieldErrors[];
  form?: string;
};

const mapOperationErrors = (
  ops: MixingOperationForm[],
  isEdit: boolean,
): MixingOperationFieldErrors[] =>
  ops.map((op) => {
    if (isEdit && op.isExisting) return {};
    const err = validateMasterDataNameField(op.operationName, "Operation name");
    return err ? { operationName: err } : {};
  });

const mapParamErrors = (
  params: QualityCheckParamForm[],
  isEdit: boolean,
): QualityCheckParamFieldErrors[] => {
  const paramIds = new Set<string>();
  return params.map((param) => {
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
};

export const getMixingCycleFieldErrors = (
  form: MixingCycleFormState,
  isEdit = false,
  existingRecords: MixingCycleRecord[] = [],
): MixingCycleFieldErrors => {
  const errors: MixingCycleFieldErrors = {};
  if (!isEdit && !form.projectId.trim()) {
    errors.projectId = "Project is required";
  }
  if (!isEdit && (form.motorStage === "" || Number.isNaN(Number(form.motorStage)))) {
    errors.motorStage = "Motor stage is required";
  }
  const nameError = validateMasterDataNameField(form.mixingCycleName, "Mixing cycle name");
  if (nameError) errors.mixingCycleName = nameError;

  if (
    !isEdit &&
    form.isActive &&
    form.projectId.trim() &&
    form.motorStage !== "" &&
    !errors.motorStage &&
    !errors.projectId
  ) {
    const stage = Number(form.motorStage);
    const projectId = form.projectId.trim();
    const conflict = existingRecords.some(
      (item) =>
        item.isActive &&
        item.projectId === projectId &&
        item.motorStage === stage,
    );
    if (conflict) {
      errors.motorStage = `Mixing cycle already exists and is active for this project and motor stage ${stage}`;
    }
  }

  if (!isEdit && form.cycles.premixOperations.length === 0) {
    errors.form = "Add at least one premix operation";
    return errors;
  }
  if (!isEdit && form.cycles.finalMixOperations.length === 0) {
    errors.form = "Add at least one final mix operation";
    return errors;
  }
  errors.premixOperations = mapOperationErrors(form.cycles.premixOperations, isEdit);
  errors.finalMixOperations = mapOperationErrors(form.cycles.finalMixOperations, isEdit);
  errors.premixQualityChecks = mapParamErrors(form.cycles.premixQualityChecks, isEdit);
  errors.finalMixQualityChecks = mapParamErrors(form.cycles.finalMixQualityChecks, isEdit);
  return errors;
};

export const getMixingCycleValidationMessage = (errors: MixingCycleFieldErrors): string | null =>
  firstFieldErrorMessage(errors);

export const validateMixingCycleForm = (
  form: MixingCycleFormState,
  isEdit = false,
  existingRecords: MixingCycleRecord[] = [],
): string | null =>
  getMixingCycleValidationMessage(getMixingCycleFieldErrors(form, isEdit, existingRecords));

export { emptyMasterDataStats, emptyReferenceRange };
export const formatMotorStageLabel = (
  motorStage: number | string | null | undefined,
  options: AppDropdownOption[] = [],
): string => {
  const value = motorStage == null || motorStage === "" ? "" : String(motorStage);
  if (!value) return "—";
  const match = options.find((option) => option.value === value);
  return match?.label ?? `Stage ${value}`;
};
