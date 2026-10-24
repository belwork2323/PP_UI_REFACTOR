import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  buildStfMotorStaticTestingDetails,
  createEmptyStfMotorData,
  parseStfMotorDataFromApi,
  type StfMotorData,
  type StfMotorDataVariant,
} from "@/data/models/user/StfMotorDataModel";
import {
  collectStfFileRefsFromForm,
  collectTempFileIdsFromStfForm,
  hasIncompleteStfUploads,
} from "@/data/models/user/StfMotorDataModel";

export const QC_STF_DATA_KEY = "STF_MOTOR";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeVariant = (value: unknown): StfMotorDataVariant => {
  const upper = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return upper === "MAIN_MOTOR" ? "MAIN_MOTOR" : "BEM";
};

export const createInitialStfValues = (
  variant: StfMotorDataVariant = "BEM",
): SchemaFormValues => ({
  [QC_STF_DATA_KEY]: createEmptyStfMotorData(variant),
  subType: variant,
});

export const getStfMotorDataFromValues = (
  values: SchemaFormValues | null | undefined,
): StfMotorData => {
  const raw = values?.[QC_STF_DATA_KEY];
  if (raw && typeof raw === "object") {
    return raw as StfMotorData;
  }
  const variant = normalizeVariant(values?.subType);
  return createEmptyStfMotorData(variant);
};

export const setStfMotorDataInValues = (
  values: SchemaFormValues | null | undefined,
  data: StfMotorData,
): SchemaFormValues => ({
  ...(values ?? {}),
  [QC_STF_DATA_KEY]: data,
  subType: data.variant,
});

const collectStfMotorCandidates = (payload: unknown): Record<string, unknown>[] => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const out: Record<string, unknown>[] = [];
  const pushMotors = (list: unknown) => {
    for (const entry of asArray(list)) {
      const rec = asRecord(entry);
      if (rec) out.push(rec);
    }
  };
  pushMotors(data.motors);
  pushMotors(data.motorDetails);
  pushMotors(root.motors);
  pushMotors(root.motorDetails);
  // QC division details root: motors live under divisionDetails[].data.motors
  for (const detail of asArray(root.divisionDetails ?? data.divisionDetails)) {
    const detailRec = asRecord(detail);
    if (!detailRec) continue;
    const division = String(detailRec.division ?? detailRec.divisionName ?? "")
      .trim()
      .toUpperCase();
    if (division && division !== "STATIC_TEST_FACILITY") continue;
    const detailData = asRecord(detailRec.data) ?? detailRec;
    pushMotors(detailData.motors);
    pushMotors(detailData.motorDetails);
  }
  return out;
};

/** True when STF form values contain any saved field (not just empty shell). */
export const stfFormValuesHaveUserData = (
  values: SchemaFormValues | null | undefined,
): boolean => {
  if (!values) return false;
  if (String(values.stfTestNo ?? "").trim() || String(values.bemNo ?? "").trim()) return true;
  const stfData = getStfMotorDataFromValues(values);
  const walk = (node: unknown): boolean => {
    if (node == null) return false;
    if (typeof node === "string") return Boolean(node.trim());
    if (typeof node === "number") return Number.isFinite(node);
    if (Array.isArray(node)) return node.some(walk);
    if (typeof node === "object") {
      return Object.entries(node as Record<string, unknown>).some(([key, value]) => {
        if (key === "variant") return false;
        return walk(value);
      });
    }
    return false;
  };
  return walk(stfData);
};

export const buildInitialStfValuesForMotor = (
  payload: unknown,
  motorId: string,
): SchemaFormValues => {
  const targetId = String(motorId ?? "").trim();
  if (!targetId) return createInitialStfValues();

  for (const rec of collectStfMotorCandidates(payload)) {
    const id = String(rec.motorId ?? "").trim();
    if (id !== targetId) continue;
    const variant = normalizeVariant(rec.subType ?? rec.sub_type);
    const stfData = parseStfMotorDataFromApi(rec, variant);
    return {
      [QC_STF_DATA_KEY]: stfData,
      subType: variant,
      stfTestNo: String(rec.stfTestNo ?? "").trim(),
      bemNo: String(rec.bemNo ?? "").trim(),
      motorId: id,
    };
  }

  return createInitialStfValues();
};

export const buildStfMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: "DRAFT" | "SUBMIT" = "DRAFT",
): Record<string, unknown> => {
  const stfData = getStfMotorDataFromValues(values);
  const variant = stfData.variant;
  return {
    motorId: String(motorId ?? "").trim(),
    subType: variant,
    motorSubmissionType,
    stfTestNo: String(values?.stfTestNo ?? "").trim() || undefined,
    bemNo: String(values?.bemNo ?? "").trim() || undefined,
    staticTestingDetails: buildStfMotorStaticTestingDetails(stfData),
  };
};

export const hasIncompleteQcStfUploads = (
  values: SchemaFormValues | null | undefined,
): boolean =>
  hasIncompleteStfUploads({
    motors: [{ stfData: getStfMotorDataFromValues(values) }],
  });

export const collectTempFileIdsFromQcStfValues = (
  values: SchemaFormValues | null | undefined,
): string[] =>
  collectTempFileIdsFromStfForm({
    motors: [{ stfData: getStfMotorDataFromValues(values) }],
  });

export const collectStfFileRefsFromQcValues = (
  values: SchemaFormValues | null | undefined,
) =>
  collectStfFileRefsFromForm({
    motors: [{ stfData: getStfMotorDataFromValues(values) }],
  });
