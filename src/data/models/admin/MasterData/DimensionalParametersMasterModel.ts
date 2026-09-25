import {
  emptyMasterDataStats,
  parseMasterDataAuditFields,
  type MasterDataAuditFields,
  type MasterDataRecord,
  type MasterDataStats,
} from "@data/models/admin/MasterData/MasterDataModel";
import {
  validateMasterDataNameField,
  validateReferenceRangeFields,
} from "@data/models/admin/MasterData/masterDataFieldValidators";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export type DimensionalParametersMasterRecord = MasterDataAuditFields & {
  parameterId: number;
  paramId: string;
  paramName: string;
  projectId: string;
  motorType: number;
  minValue: number | null;
  maxValue: number | null;
  unit: string;
  isActive: boolean;
};

export type DimensionalParametersMasterListPayload = {
  items: DimensionalParametersMasterRecord[];
  stats: MasterDataStats;
};

export type DimensionalParameterRowForm = {
  parameterId: number | null;
  paramId: string;
  paramName: string;
  minValue: number | null;
  maxValue: number | null;
  unitId: string;
  unit: string;
  isActive: boolean;
  isExisting?: boolean;
};

export type DimensionalParametersCreateFormState = {
  projectId: string;
  motorType: number | "";
  parameters: DimensionalParameterRowForm[];
};

export type DimensionalParametersStageEditFormState = {
  projectId: string;
  motorType: number;
  parameters: DimensionalParameterRowForm[];
};

export type DimensionalParameterRowFieldErrors = {
  paramName?: string;
  minValue?: string;
  maxValue?: string;
  unit?: string;
};

export const emptyDimensionalParameterRow = (): DimensionalParameterRowForm => ({
  parameterId: null,
  paramId: "",
  paramName: "",
  minValue: null,
  maxValue: null,
  unitId: "",
  unit: "",
  isActive: true,
  isExisting: false,
});

export const createEmptyDimensionalParametersCreateForm =
  (): DimensionalParametersCreateFormState => ({
    projectId: "",
    motorType: "",
    parameters: [],
  });

export const mapRecordToParameterRow = (
  record: DimensionalParametersMasterRecord,
  unitOptions: AppDropdownOption[],
): DimensionalParameterRowForm => {
  const unitMatch = unitOptions.find(
    (option) => String(option.label ?? "").trim() === record.unit.trim(),
  );
  return {
    parameterId: record.parameterId,
    paramId: record.paramId,
    paramName: record.paramName,
    minValue: record.minValue,
    maxValue: record.maxValue,
    unitId: unitMatch?.value ?? "",
    unit: record.unit,
    isActive: record.isActive,
    isExisting: true,
  };
};

export const buildStageEditFormForProjectAndMotorType = (
  projectId: string,
  motorType: number,
  records: DimensionalParametersMasterRecord[],
  unitOptions: AppDropdownOption[],
): DimensionalParametersStageEditFormState => ({
  projectId,
  motorType,
  parameters: records
    .filter(
      (record) =>
        record.projectId === projectId && record.motorType === motorType,
    )
    .sort((left, right) => left.paramName.localeCompare(right.paramName))
    .map((record) => mapRecordToParameterRow(record, unitOptions)),
});

/** @deprecated Prefer buildStageEditFormForProjectAndMotorType */
export const buildStageEditFormForMotorType = (
  motorType: number,
  records: DimensionalParametersMasterRecord[],
  unitOptions: AppDropdownOption[],
): DimensionalParametersStageEditFormState =>
  buildStageEditFormForProjectAndMotorType("", motorType, records, unitOptions);

export const formatMotorStageLabel = (
  motorType: number | null | undefined,
  stageOptions: AppDropdownOption[],
): string => {
  const key = String(motorType ?? "");
  const match = stageOptions.find((option) => option.value === key);
  if (match?.label) return String(match.label);
  if (motorType == null || Number.isNaN(motorType)) return "—";
  return `Stage ${motorType}`;
};

export const formatDimensionalRangeLabel = (
  minValue: number | null,
  maxValue: number | null,
  unit: string,
): string => {
  const unitSuffix = unit ? ` ${unit}` : "";
  if (minValue != null && maxValue != null) {
    return `${minValue} - ${maxValue}${unitSuffix}`;
  }
  if (minValue != null) return `>= ${minValue}${unitSuffix}`;
  if (maxValue != null) return `<= ${maxValue}${unitSuffix}`;
  return unitSuffix.trim() || "—";
};

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const mapDimensionalRecordFromMasterData = (
  raw: MasterDataRecord,
): DimensionalParametersMasterRecord => ({
  ...parseMasterDataAuditFields(raw),
  parameterId: Number(raw.id),
  paramId: String(raw.code ?? raw.attributes?.paramId ?? "").trim(),
  paramName: String(raw.name ?? "").trim(),
  projectId: String(raw.attributes?.projectId ?? "").trim(),
  motorType: Number(raw.attributes?.motorType ?? 0),
  minValue: parseNumber(raw.attributes?.minValue),
  maxValue: parseNumber(raw.attributes?.maxValue),
  unit: String(raw.attributes?.unit ?? "").trim(),
  isActive: raw.isActive !== false,
});

export const DimensionalParametersMasterListModel = {
  fromApi: (res: any): DimensionalParametersMasterListPayload => {
    const data = res?.data ?? {};
    const items = Array.isArray(data?.items)
      ? data.items.map((item: MasterDataRecord) => mapDimensionalRecordFromMasterData(item))
      : [];
    return {
      items,
      stats: {
        total: Number(data?.stats?.total ?? items.length),
        active: Number(data?.stats?.active ?? items.filter((item) => item.isActive).length),
        inactive: Number(
          data?.stats?.inactive ?? items.filter((item) => !item.isActive).length,
        ),
      },
    };
  },
};

const resolveUnitSymbol = (
  unitId: string,
  unit: string,
  unitOptions: AppDropdownOption[],
): string => {
  const trimmed = unit.trim();
  if (trimmed) return trimmed;
  const match = unitOptions.find((option) => option.value === unitId);
  return match ? String(match.label ?? "").trim() : "";
};

export const buildDimensionalParameterCreatePayload = (
  projectId: string,
  motorType: number,
  row: DimensionalParameterRowForm,
  unitOptions: AppDropdownOption[],
) => {
  const unit = resolveUnitSymbol(row.unitId, row.unit, unitOptions);
  const attributes: Record<string, unknown> = {
    projectId,
    motorType,
    minValue: row.minValue,
    maxValue: row.maxValue,
  };
  if (unit) {
    attributes.unit = unit;
  }
  return {
    name: row.paramName.trim(),
    isActive: row.isActive,
    attributes,
  };
};

export const buildDimensionalParameterActiveUpdatePayload = (
  projectId: string,
  motorType: number,
  row: DimensionalParameterRowForm,
  isActive: boolean,
) => ({
  id: row.parameterId!,
  code: row.paramId,
  name: row.paramName.trim(),
  isActive,
  attributes: {
    projectId,
    motorType,
    paramId: row.paramId,
    minValue: row.minValue,
    maxValue: row.maxValue,
    unit: row.unit,
  },
});

export const buildDimensionalParameterEnablePayload = (
  record: DimensionalParametersMasterRecord,
) => ({
  id: record.parameterId,
  code: record.paramId,
  name: record.paramName,
  isActive: true,
  attributes: {
    projectId: record.projectId,
    motorType: record.motorType,
    paramId: record.paramId,
    minValue: record.minValue,
    maxValue: record.maxValue,
    unit: record.unit,
  },
});

const validateParameterRow = (
  row: DimensionalParameterRowForm,
): DimensionalParameterRowFieldErrors => {
  const errors: DimensionalParameterRowFieldErrors = {};
  const nameError = validateMasterDataNameField(row.paramName);
  if (nameError) errors.paramName = nameError;

  const rangeErrors = validateReferenceRangeFields(
    {
      minValue: row.minValue,
      maxValue: row.maxValue,
      unitId: null,
      unit: row.unit,
    },
    row.paramName.trim() || "parameter",
    false,
  );
  if (rangeErrors.minValue) errors.minValue = rangeErrors.minValue;
  if (rangeErrors.maxValue) errors.maxValue = rangeErrors.maxValue;

  return errors;
};

export const getDimensionalCreateFormFieldErrors = (
  form: DimensionalParametersCreateFormState,
): {
  projectId?: string;
  motorType?: string;
  parameters: DimensionalParameterRowFieldErrors[];
} => ({
  projectId: !form.projectId.trim() ? "Project is required" : undefined,
  motorType: form.motorType === "" ? "Motor stage is required" : undefined,
  parameters: form.parameters.map((row) => validateParameterRow(row)),
});

export const getDimensionalStageEditFormFieldErrors = (
  form: DimensionalParametersStageEditFormState,
) => ({
  parameters: form.parameters.map((row) =>
    row.isExisting ? {} : validateParameterRow(row),
  ),
});

export const validateDimensionalCreateForm = (
  form: DimensionalParametersCreateFormState,
): string | null => {
  if (!form.projectId.trim()) return "Project is required";
  if (form.motorType === "") return "Motor stage is required";
  if (!form.parameters.length) return "Add at least one parameter";
  const errors = getDimensionalCreateFormFieldErrors(form);
  if (errors.projectId) return errors.projectId;
  if (errors.motorType) return errors.motorType;
  for (const rowErrors of errors.parameters) {
    if (rowErrors.paramName) return rowErrors.paramName;
    if (rowErrors.minValue) return rowErrors.minValue;
    if (rowErrors.maxValue) return rowErrors.maxValue;
  }
  return null;
};

export const validateDimensionalStageEditForm = (
  form: DimensionalParametersStageEditFormState,
): string | null => {
  const fieldErrors = getDimensionalStageEditFormFieldErrors(form);
  for (const rowErrors of fieldErrors.parameters) {
    if (rowErrors.paramName) return rowErrors.paramName;
    if (rowErrors.minValue) return rowErrors.minValue;
    if (rowErrors.maxValue) return rowErrors.maxValue;
  }

  const hasNewRows = form.parameters.some((row) => !row.isExisting);
  if (!hasNewRows) {
    return "Add a new parameter to save. Enable/disable changes apply immediately.";
  }
  return null;
};

export const dimensionalParametersRecordMatchesSearch = (
  record: DimensionalParametersMasterRecord,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    record.paramName,
    record.paramId,
    record.unit,
    record.projectId,
    String(record.motorType),
  ];
  return parts.some((part) => String(part).toLowerCase().includes(q));
};

export { emptyMasterDataStats };
