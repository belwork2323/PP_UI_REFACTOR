import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.CASE_PREP;

export const CASE_PREP_TREATMENT_CONFIG: Record<string, { color: string; italic?: boolean }> = {
  cleaning: { color: "#6D4C41" },
  "surface treatment": { color: "#1565C0" },
  "full process": { color: "#4A235A" },
  coating: { color: "#0E6655" },
  "not selected yet": { color: "#616A6B", italic: true },
};

export const getCasePrepTreatmentCfg = (value: string) =>
  CASE_PREP_TREATMENT_CONFIG[String(value ?? "").toLowerCase()] ?? { color: "#555" };

export const CASE_PREP_TREATMENT_OPTIONS = [
  S.TREATMENT_CLEANING,
  S.TREATMENT_SURFACE,
  S.TREATMENT_FULL,
  S.TREATMENT_COATING,
  S.TREATMENT_NOT_SELECTED,
];

export const createCasePreparationData = () => ({
  motorCaseIds: { m1: "", m2: "" },
  motorNos: { m1: "", m2: "" },
  ga: {
    r1: { m1: "", m2: "" },
    r2: { m1: "", m2: "" },
    r3: { m1: "", m2: "" },
    r4a: { m1: "", m2: "" },
    r4b: { m1: "", m2: "" },
    r4c: { m1: "", m2: "" },
    r5: { m1: "", m2: "" },
    r6: { m1: "", m2: "" },
  },
  lco: {
    r1: { m1: "", m2: "" },
    r2: { m1: "", m2: "" },
    r3a: { m1: "", m2: "" },
    r3b: { m1: "", m2: "" },
    r3c: { m1: "", m2: "" },
    r4a: { m1: "", m2: "" },
    r4b: { m1: "", m2: "" },
    r5: { m1: "", m2: "" },
  },
});

export const countFilledFlat = (obj: Record<string, unknown>) =>
  Object.values(obj).filter((v) => (typeof v === "string" ? v.trim() !== "" : false)).length;

const countFilledDeep = (value: unknown): number => {
  if (typeof value === "string") {
    return value.trim() ? 1 : 0;
  }

  if (!value || typeof value !== "object") {
    return 0;
  }

  return Object.values(value as Record<string, unknown>).reduce<number>(
    (acc: number, child) => acc + countFilledDeep(child),
    0
  );
};

export const countFilledNested = (...objs: Array<Record<string, unknown>>) =>
  objs.reduce((acc, obj) => acc + countFilledDeep(obj), 0);
