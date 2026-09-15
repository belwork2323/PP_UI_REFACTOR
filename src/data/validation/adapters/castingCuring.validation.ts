import {
  createEmptyCastingMotorData,
  parseCastingMotorDataFromApi,
  type CastingMotorData,
} from "@/data/models/user/CastingMotorDataModel";
import {
  createEmptyCuringMotorData,
  parseCuringMotorDataFromApi,
  type CuringMotorData,
} from "@/data/models/user/CuringMotorDataModel";
import { runValidation } from "../runValidation";
import {
  castingMotorValidationConfig,
  curingMotorValidationConfig,
} from "../configs/castingCuring.validation.config";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";

const normalizeCastingValidationData = (data: unknown): CastingMotorData => {
  if (!data || typeof data !== "object") {
    return createEmptyCastingMotorData();
  }

  const record = data as Record<string, unknown>;
  if (record.CASTING_PROCESS && typeof record.CASTING_PROCESS === "object") {
    return data as CastingMotorData;
  }

  if (
    record.castingProcess ||
    record.castingSections ||
    record.finalAssemblyDetails ||
    record.FINAL_ASSEMBLY_DETAILS
  ) {
    return parseCastingMotorDataFromApi(data);
  }

  return data as CastingMotorData;
};

const normalizeCuringValidationData = (data: unknown): CuringMotorData => {
  if (!data || typeof data !== "object") {
    return createEmptyCuringMotorData();
  }

  const record = data as Record<string, unknown>;
  if (record.CURING_CYCLES && typeof record.CURING_CYCLES === "object") {
    return data as CuringMotorData;
  }

  if (
    record.curingCycles ||
    record.curingSections ||
    record.postCuringDetails ||
    record.POST_CURING_DETAILS
  ) {
    return parseCuringMotorDataFromApi(data);
  }

  return data as CuringMotorData;
};

export function validateCastingMotor(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(
    normalizeCastingValidationData(data),
    tier,
    castingMotorValidationConfig,
  );
}

export function validateCuringMotor(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(normalizeCuringValidationData(data), tier, curingMotorValidationConfig);
}

/** Validates casting + curing payloads together (legacy). Prefer scoped validators on submit. */
export function validateCastingCuring(data: unknown, tier: ValidationTier): ValidationErrors {
  return {
    ...validateCastingMotor(data, tier),
    ...validateCuringMotor(data, tier),
  };
}

export default validateCastingCuring;
