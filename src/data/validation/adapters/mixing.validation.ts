import { runValidation } from "../runValidation";
import mixingValidationConfig from "../configs/mixing.validation.config";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

export function validateMixing(data: unknown, tier: ValidationTier): ValidationErrors {
  // data expected shape: { premixes?: [], finalMixes?: [] }
  return runValidation(data as any, tier, mixingValidationConfig);
}

export type MixingValidationFocusTarget = {
  fieldPath: string;
  stageType: "PREMIX" | "FINAL_MIX";
  cardIndex: number;
};

const trimStr = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Prefer header → bowl/trial → process → quality section → observed values. */
const MIXING_FOCUS_PATH_PRIORITY = (path: string): number => {
  if (/\.mixerType$/.test(path)) return 10;
  if (/\.bldgNo$/.test(path)) return 20;
  if (/\.premixDate$/.test(path)) return 30;
  if (/\.premixQuantity$/.test(path)) return 40;
  if (/\.mixingCycleCode$/.test(path)) return 50;
  if (/\.bowlId$/.test(path)) return 60;
  if (/\.bowlTrialDate$/.test(path)) return 70;
  if (/\.bowlTrialObservations$/.test(path)) return 80;
  if (/\.processParticulars\.root$/.test(path)) return 85;
  if (/\.processParticulars\.\d+\.operation$/.test(path)) return 90;
  if (/\.processParticulars\.\d+\.rpm$/.test(path)) return 100;
  if (/\.processParticulars\.\d+\.time$/.test(path)) return 110;
  if (/\.processParticulars\.\d+\.temp$/.test(path)) return 120;
  if (/\.processParticulars\.\d+\.vacuum$/.test(path)) return 130;
  if (/\.qualityChecks\.root$/.test(path)) return 135;
  if (/\.qualityChecks\.\d+\.observedValues\.\d+$/.test(path)) return 140;
  if (/^(premixes|finalMixes)\.\d+$/.test(path)) return 150;
  return 200;
};

export function resolveFirstMixingValidationFocus(
  errors: ValidationErrors,
): MixingValidationFocusTarget | null {
  const paths = Object.keys(errors).filter((key) => trimStr(errors[key]));
  if (!paths.length) return null;
  paths.sort((a, b) => {
    const pa = MIXING_FOCUS_PATH_PRIORITY(a);
    const pb = MIXING_FOCUS_PATH_PRIORITY(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  const fieldPath = paths[0];
  const premixMatch = fieldPath.match(/^premixes\.(\d+)/);
  if (premixMatch) {
    return {
      fieldPath,
      stageType: "PREMIX",
      cardIndex: Number(premixMatch[1]),
    };
  }
  const finalMatch = fieldPath.match(/^finalMixes\.(\d+)/);
  if (finalMatch) {
    return {
      fieldPath,
      stageType: "FINAL_MIX",
      cardIndex: Number(finalMatch[1]),
    };
  }
  return { fieldPath, stageType: "PREMIX", cardIndex: 0 };
}

/** Scroll + focus the control tagged with `data-mix-field`. */
export function focusMixField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("mix-field", fieldPath, root);
}

export default validateMixing;
