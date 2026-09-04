import { STRINGS } from "@/app/config/strings";
import {
  DIM_READING_KEYS,
  isLooseFlapDimensionalParam,
  isUploadedCasingFileReady,
  type RocketMotorCasingFormData,
} from "@/data/models/user/RocketMotorCasingFormModel";
import { ALPHA_NUM, validateFieldState } from "../fieldValidators";
import type { SubDeptValidationConfig } from "../runValidation";
import { isRequiredForTier, type ValidationErrors, type ValidationTier } from "../submissionIntent";

const M = STRINGS.SOURCING.CASING_FORM.VALIDATION;

export const rocketMotorCasingFieldRules = {
  projectName: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.projectName.required, invalid: M.projectName.invalid },
  },
  motorStageApi: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.motorStageApi.required, invalid: M.motorStageApi.invalid },
  },
  motorId: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.motorId.required, invalid: M.motorId.invalid },
  },
  casingType: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.casingType.required, invalid: M.casingType.invalid },
  },
  receivingDate: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.receivingDate.required, invalid: M.receivingDate.invalid },
  },
  itemsDimension: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.itemsDimension.required, invalid: M.itemsDimension.invalid },
  },
  itemsUnit: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.itemsUnit.required, invalid: M.itemsUnit.invalid },
  },
  itemsObservations: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.itemsObservations.required, invalid: M.itemsObservations.invalid },
  },
  greenCardNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.greenCardNo.required, invalid: M.greenCardNo.invalid },
  },
  clearanceDate: {
    valueType: "date" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.clearanceDate.required, invalid: M.clearanceDate.invalid },
  },
  clearanceAuthority: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.clearanceAuthority.required, invalid: M.clearanceAuthority.invalid },
  },
  clearanceDetails: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.clearanceDetails.required, invalid: M.clearanceDetails.invalid },
  },
  insulationCuringDate: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.insulationCuringDate.required, invalid: M.insulationCuringDate.invalid },
  },
  insulationType: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.insulationType.required, invalid: M.insulationType.invalid },
  },
  insulationReportNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.insulationReportNo.required, invalid: M.insulationReportNo.invalid },
  },
  ndtObservations: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.ndtObservations.required, invalid: M.ndtObservations.invalid },
  },
  acemNdtObservations: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.acemNdtObservations.required, invalid: M.acemNdtObservations.invalid },
  },
  projectRubberSurfaceObservations: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: {
      required: M.projectRubberSurfaceObservations.required,
      invalid: M.projectRubberSurfaceObservations.invalid,
    },
  },
  otherDetails: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.otherDetails.required, invalid: M.otherDetails.invalid },
  },
  postPptUtDate: {
    valueType: "date" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.postPptUtDate.required, invalid: M.postPptUtDate.invalid },
  },
  ndtDate: {
    valueType: "date" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.ndtDate.required, invalid: M.ndtDate.invalid },
  },
  radiographyPlanName: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.radiographyPlanName.required, invalid: M.radiographyPlanName.invalid },
  },
  weightWithoutHarness: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.weightWithoutHarness.required, invalid: M.weightWithoutHarness.invalid },
  },
  weightWithHarness: {
    valueType: "number" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.weightWithHarness.required, invalid: M.weightWithHarness.invalid },
  },
  weighscaleEquipment: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.weighscaleEquipment.required, invalid: M.weighscaleEquipment.invalid },
  },
  calibrationDueDate: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.calibrationDueDate.required, invalid: M.calibrationDueDate.invalid },
  },
  mockTrialCastingStation: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.mockTrialCastingStation.required, invalid: M.mockTrialCastingStation.invalid },
  },
  mockTrialMandrelId: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.mockTrialMandrelId.required, invalid: M.mockTrialMandrelId.invalid },
  },
  mockTrialBottomCupId: {
    valueType: "number" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.mockTrialBottomCupId.required, invalid: M.mockTrialBottomCupId.invalid },
  },
  visualInspectionReport: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.visualInspectionReport.required, invalid: M.visualInspectionReport.invalid },
  },
  dimensionalInspectionReport: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: {
      required: M.dimensionalInspectionReport.required,
      invalid: M.dimensionalInspectionReport.invalid,
    },
  },
  mockTrialReport: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.mockTrialReport.required, invalid: M.mockTrialReport.invalid },
  },
};

const isFiniteNumber = (value: unknown): boolean => {
  const text = String(value ?? "").trim();
  return Boolean(text) && Number.isFinite(Number(text));
};

const isWithinRange = (value: number, min: number | null, max: number | null): boolean => {
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
};

const hasReadyReport = (files: { fileId?: string | null; fileUrl?: string }[] | undefined): boolean =>
  (files ?? []).some(isUploadedCasingFileReady);

function resolveCasingFieldPaths(form: RocketMotorCasingFormData) {
  return [
    { path: "projectName", value: form.projectName, ruleKey: "projectName" },
    { path: "motorStageApi", value: form.motorStageApi, ruleKey: "motorStageApi" },
    { path: "motorId", value: form.motorId, ruleKey: "motorId" },
    { path: "casingType", value: form.casingType, ruleKey: "casingType" },
    { path: "receivingDate", value: form.receivingDate, ruleKey: "receivingDate" },
    { path: "itemsDimension", value: form.itemsDimension, ruleKey: "itemsDimension" },
    { path: "itemsUnit", value: form.itemsUnit, ruleKey: "itemsUnit" },
    { path: "itemsObservations", value: form.itemsObservations, ruleKey: "itemsObservations" },
    { path: "greenCardNo", value: form.greenCardNo, ruleKey: "greenCardNo" },
    { path: "clearanceDate", value: form.clearanceDate, ruleKey: "clearanceDate" },
    { path: "clearanceAuthority", value: form.clearanceAuthority, ruleKey: "clearanceAuthority" },
    { path: "clearanceDetails", value: form.clearanceDetails, ruleKey: "clearanceDetails" },
    { path: "insulationCuringDate", value: form.insulationCuringDate, ruleKey: "insulationCuringDate" },
    { path: "insulationType", value: form.insulationType, ruleKey: "insulationType" },
    { path: "insulationReportNo", value: form.insulationReportNo, ruleKey: "insulationReportNo" },
    { path: "postPptUtDate", value: form.postPptUtDate, ruleKey: "postPptUtDate" },
    { path: "ndtDate", value: form.ndtDate, ruleKey: "ndtDate" },
    { path: "ndtObservations", value: form.ndtObservations, ruleKey: "ndtObservations" },
    { path: "acemNdtObservations", value: form.acemNdtObservations, ruleKey: "acemNdtObservations" },
    {
      path: "projectRubberSurfaceObservations",
      value: form.projectRubberSurfaceObservations,
      ruleKey: "projectRubberSurfaceObservations",
    },
    { path: "otherDetails", value: form.otherDetails, ruleKey: "otherDetails" },
    { path: "radiographyPlanName", value: form.radiographyPlanName, ruleKey: "radiographyPlanName" },
    { path: "weightWithoutHarness", value: form.weightWithoutHarness, ruleKey: "weightWithoutHarness" },
    { path: "weightWithHarness", value: form.weightWithHarness, ruleKey: "weightWithHarness" },
    { path: "weighscaleEquipment", value: form.weighscaleEquipment, ruleKey: "weighscaleEquipment" },
    { path: "calibrationDueDate", value: form.calibrationDueDate, ruleKey: "calibrationDueDate" },
    {
      path: "mockTrial.castingStation",
      value: form.mockTrial.castingStation,
      ruleKey: "mockTrialCastingStation",
    },
    { path: "mockTrial.mandrelId", value: form.mockTrial.mandrelId, ruleKey: "mockTrialMandrelId" },
    { path: "mockTrial.bottomCupId", value: form.mockTrial.bottomCupId, ruleKey: "mockTrialBottomCupId" },
    {
      path: "visualInspectionReport",
      value: form.visualInspectionReportExisting,
      ruleKey: "visualInspectionReport",
    },
    {
      path: "dimensionalInspectionReport",
      value: form.dimensionalInspectionReportExisting,
      ruleKey: "dimensionalInspectionReport",
    },
    { path: "mockTrialReport", value: form.mockTrialReportExisting, ruleKey: "mockTrialReport" },
  ];
}

function applyCasingNestedRules(
  form: RocketMotorCasingFormData,
  tier: ValidationTier,
  errors: ValidationErrors,
) {
  const submitRequired = isRequiredForTier(["SUBMIT"], tier);

  const mechParams =
    form.insulationSpecifications?.specifications.flatMap((category) => category.parameters) ?? [];

  mechParams.forEach((param) => {
    const code = param.specificationCode;
    const category = String(
      form.insulationSpecifications?.specifications.find((c) =>
        c.parameters.some((p) => p.specificationCode === code),
      )?.category ?? "",
    ).toLowerCase();
    const isMechanical = category.includes("mechanical");
    const isThermal = category.includes("thermal");
    const row = isMechanical
      ? form.mechanicalProperties[code]
      : isThermal
        ? form.thermalProperties[code]
        : form.mechanicalProperties[code] ?? form.thermalProperties[code];

    if (isMechanical) {
      const reportedPath = `mechanicalProperties.${code}.reported`;
      const acemPath = `mechanicalProperties.${code}.acemSpec`;
      if (String(row?.reported ?? "").trim() && !isFiniteNumber(row?.reported)) {
        errors[reportedPath] = M.mechanicalReported.invalid;
      }
      if (submitRequired) {
        if (!isFiniteNumber(row?.acemSpec)) {
          errors[acemPath] = M.mechanicalAcemSpec.required;
        } else if (
          !isWithinRange(
            Number(row?.acemSpec),
            param.referenceRange.minValue,
            param.referenceRange.maxValue,
          )
        ) {
          errors[acemPath] = M.mechanicalAcemSpec.outOfRange;
        }
      }
      return;
    }

    if (isThermal) {
      const reportedPath = `thermalProperties.${code}.reported`;
      const acemPath = `thermalProperties.${code}.acemSpec`;
      if (String(row?.reported ?? "").trim() && !isFiniteNumber(row?.reported)) {
        errors[reportedPath] = M.thermalReported.invalid;
      }
      if (String(row?.acemSpec ?? "").trim()) {
        if (!isFiniteNumber(row?.acemSpec)) {
          errors[acemPath] = M.thermalAcemSpec.invalid;
        } else if (
          submitRequired &&
          !isWithinRange(
            Number(row?.acemSpec),
            param.referenceRange.minValue,
            param.referenceRange.maxValue,
          )
        ) {
          errors[acemPath] = M.thermalAcemSpec.outOfRange;
        }
      }
    }
  });

  (form.radiographyPlanRows ?? []).forEach((row, index) => {
    (["sections", "orientations", "sfd", "normalExposures", "tangentialExposures"] as const).forEach(
      (field) => {
        const text = String(row[field] ?? "").trim();
        if (text && !isFiniteNumber(text)) {
          errors[`radiographyPlanRows.${index}.${field}`] = M.radiographyPlanRow.invalid;
        }
      },
    );
  });

  const planId = String(form.radiographyPlanId ?? "").trim();
  if (planId && !/^[A-Za-z0-9_-]+$/.test(planId)) {
    errors.radiographyPlanId = M.radiographyPlanId.invalid;
  }

  (form.visualInspection ?? []).forEach((row, index) => {
    const obsPath = `visualInspection.${index}.observations`;
    const remarkPath = `visualInspection.${index}.remark`;
    if (submitRequired && !String(row.observations ?? "").trim()) {
      errors[obsPath] = M.visualObservation.required;
    } else if (String(row.observations ?? "").trim() && !ALPHA_NUM.test(String(row.observations).trim())) {
      errors[obsPath] = M.visualObservation.invalid;
    }
    if (String(row.remark ?? "").trim() && !ALPHA_NUM.test(String(row.remark).trim())) {
      errors[remarkPath] = M.visualRemark.invalid;
    }
    (row.subItems ?? []).forEach((sub, subIndex) => {
      const subObsPath = `visualInspection.${index}.subItems.${subIndex}.observations`;
      const subRemarkPath = `visualInspection.${index}.subItems.${subIndex}.remark`;
      if (submitRequired && !String(sub.observations ?? "").trim()) {
        errors[subObsPath] = M.visualObservation.required;
      } else if (
        String(sub.observations ?? "").trim() &&
        !ALPHA_NUM.test(String(sub.observations).trim())
      ) {
        errors[subObsPath] = M.visualObservation.invalid;
      }
      if (String(sub.remark ?? "").trim() && !ALPHA_NUM.test(String(sub.remark).trim())) {
        errors[subRemarkPath] = M.visualRemark.invalid;
      }
    });
  });

  (form.dimensionalData ?? []).forEach((row, rowIndex) => {
    if (isLooseFlapDimensionalParam(row)) {
      const arcPath = `dimensionalData.${rowIndex}.looseFlap.arcLength`;
      const axialPath = `dimensionalData.${rowIndex}.looseFlap.axialLength`;
      if (submitRequired && !isFiniteNumber(row.looseFlap?.arcLength)) {
        errors[arcPath] = M.dimensionalReading.required;
      }
      if (submitRequired && !isFiniteNumber(row.looseFlap?.axialLength)) {
        errors[axialPath] = M.dimensionalReading.required;
      }
      if (
        submitRequired &&
        isFiniteNumber(row.looseFlap?.arcLength) &&
        !isWithinRange(
          Number(row.looseFlap?.arcLength),
          row.referenceRange.minValue,
          row.referenceRange.maxValue,
        )
      ) {
        errors[arcPath] = M.dimensionalReading.outOfRange;
      }
      if (
        submitRequired &&
        isFiniteNumber(row.looseFlap?.axialLength) &&
        !isWithinRange(
          Number(row.looseFlap?.axialLength),
          row.referenceRange.minValue,
          row.referenceRange.maxValue,
        )
      ) {
        errors[axialPath] = M.dimensionalReading.outOfRange;
      }
      return;
    }
    DIM_READING_KEYS.forEach((key) => {
      const path = `dimensionalData.${rowIndex}.readings.${key}`;
      const value = row.readings?.[key];
      if (submitRequired && !isFiniteNumber(value)) {
        errors[path] = M.dimensionalReading.required;
      } else if (
        submitRequired &&
        isFiniteNumber(value) &&
        !isWithinRange(Number(value), row.referenceRange.minValue, row.referenceRange.maxValue)
      ) {
        errors[path] = M.dimensionalReading.outOfRange;
      }
    });
  });

  if (submitRequired && !(form.dimensionalData ?? []).length) {
    errors.dimensionalData = M.dimensionalData.required;
  }

  if (submitRequired && !(form.mockTrial.motorDimensions ?? []).length) {
    errors["mockTrial.motorDimensions"] = M.mockTrialMeasurements.required;
  }
  if (submitRequired && !(form.mockTrial.mandrelAssemblyMeasurements ?? []).length) {
    errors["mockTrial.mandrelAssemblyMeasurements"] = M.mockTrialMeasurements.required;
  }

  (form.mockTrial.motorDimensions ?? []).forEach((row, index) => {
    (
      [
        ["lfRubberThicknessHe", false],
        ["heBossWidthWithoutLfRubber", true],
        ["heDiaId", true],
        ["heOuterToNeOuter", false],
        ["heInnerToNeInner", false],
        ["neOuterToHeInner", false],
      ] as const
    ).forEach(([key, mandatory]) => {
      const path = `mockTrial.motorDimensions.${index}.${key}`;
      const value = row[key];
      if (submitRequired && mandatory && !isFiniteNumber(value)) {
        errors[path] = M.mockTrialNumber.required;
      } else if (String(value ?? "").trim() && !isFiniteNumber(value)) {
        errors[path] = M.mockTrialNumber.invalid;
      }
    });
  });

  (form.mockTrial.mandrelAssemblyMeasurements ?? []).forEach((row, index) => {
    (["mandrelRestOnDomeA", "mandrelRestOnBottomCupB", "bellowThicknessD"] as const).forEach(
      (key) => {
        const path = `mockTrial.mandrelAssemblyMeasurements.${index}.${key}`;
        const value = row[key];
        if (submitRequired && !isFiniteNumber(value)) {
          errors[path] = M.mockTrialNumber.required;
        } else if (String(value ?? "").trim() && !isFiniteNumber(value)) {
          errors[path] = M.mockTrialNumber.invalid;
        }
      },
    );
  });

  if (submitRequired) {
    if (!hasReadyReport(form.visualInspectionReportExisting)) {
      errors.visualInspectionReport = M.visualInspectionReport.required;
    }
    if (!hasReadyReport(form.dimensionalInspectionReportExisting)) {
      errors.dimensionalInspectionReport = M.dimensionalInspectionReport.required;
    }
    if (!hasReadyReport(form.mockTrialReportExisting)) {
      errors.mockTrialReport = M.mockTrialReport.required;
    }
  }
}

export const isCasingUnitComplete = (form: RocketMotorCasingFormData): boolean => {
  const fields = rocketMotorCasingFieldRules;
  return (
    validateFieldState(form.projectName, {
      valueType: fields.projectName.valueType,
      required: true,
    }) === "valid" &&
    validateFieldState(form.motorStageApi, {
      valueType: fields.motorStageApi.valueType,
      required: true,
    }) === "valid" &&
    validateFieldState(form.motorId, {
      valueType: fields.motorId.valueType,
      required: true,
      pattern: fields.motorId.pattern,
    }) === "valid" &&
    Boolean(form.projectId.trim())
  );
};

export const rocketMotorCasingValidationConfig: SubDeptValidationConfig<RocketMotorCasingFormData> =
  {
    id: "rocket-motor-casing",
    fields: rocketMotorCasingFieldRules,
    resolveFieldPaths: resolveCasingFieldPaths,
    customRules: [applyCasingNestedRules],
    isUnitComplete: isCasingUnitComplete,
  };

export const isCasingSubmitComplete = (form: RocketMotorCasingFormData): boolean => {
  const errors: ValidationErrors = {};
  for (const { path, value, ruleKey } of resolveCasingFieldPaths(form)) {
    const rule = rocketMotorCasingFieldRules[ruleKey as keyof typeof rocketMotorCasingFieldRules];
    if (!rule) continue;
    const required = isRequiredForTier(rule.requiredIn, "SUBMIT");
    const state = validateFieldState(value, {
      valueType: rule.valueType,
      required,
      pattern: rule.pattern,
    });
    if (state !== "valid") return false;
  }
  applyCasingNestedRules(form, "SUBMIT", errors);
  return Object.keys(errors).length === 0;
};

export const isCasingIdentificationComplete = (form: RocketMotorCasingFormData): boolean =>
  isCasingUnitComplete(form);
