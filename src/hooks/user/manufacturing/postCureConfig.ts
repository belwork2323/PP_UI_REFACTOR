import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.POST_CURE;

export const POST_CURE_OP_TYPE_CONFIG: Record<string, { color: string; italic?: boolean }> = {
  demoulding: { color: "#6D4C41" },
  "x-ray inspection": { color: "#1565C0" },
  "dimensional check": { color: "#4A235A" },
  "weight measurement": { color: "#0E6655" },
  "full process": { color: "#1B4F72" },
  "not selected yet": { color: "#616A6B", italic: true },
};

export const getOpTypeCfg = (value: string) =>
  POST_CURE_OP_TYPE_CONFIG[String(value ?? "").toLowerCase()] ?? { color: "#555" };

export const POST_CURE_OP_TYPE_OPTIONS = [
  "Demoulding",
  "X-Ray Inspection",
  "Dimensional Check",
  "Weight Measurement",
  "Full Process",
  "Not Selected Yet",
];

export const POST_CURE_OPERATION_LOOSE_FLAP = "loose-flap-filling";
export const POST_CURE_OPERATION_INHIBITION = "inhibition";

export const POST_CURE_OPERATION_OPTIONS = [
  { value: POST_CURE_OPERATION_LOOSE_FLAP, label: S.OPERATION_LOOSE_FLAP_FILLING },
  { value: POST_CURE_OPERATION_INHIBITION, label: S.OPERATION_INHIBITION },
];

export const POST_CURE_INHIBITOR_TYPE_OPTIONS = [
  { value: "IR1", label: "IR1" },
  { value: "Hemcoat-3K", label: "Hemcoat-3K" },
  { value: "not-applicable", label: S.INHIBITOR_TYPE_NOT_APPLICABLE },
];

export type PostCureMotorOption = {
  value: string;
  label: string;
};

export const resolvePostCureMotorOptions = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
} | null): PostCureMotorOption[] => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) {
    return ids.map((id) => ({ value: id, label: id }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  return singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({ value: id, label: id }));
};

export const isPostCureInhibitionOperation = (operation: string) =>
  String(operation ?? "").toLowerCase() === POST_CURE_OPERATION_INHIBITION;

export const formatPostCureMotorOperationLabel = (operation: string, inhibitorType: string) => {
  const operationLabel =
    POST_CURE_OPERATION_OPTIONS.find((option) => option.value === operation)?.label ?? operation;
  if (!isPostCureInhibitionOperation(operation)) return operationLabel || "—";
  const inhibitorLabel =
    POST_CURE_INHIBITOR_TYPE_OPTIONS.find((option) => option.value === inhibitorType)?.label ??
    inhibitorType;
  return inhibitorLabel ? `${operationLabel} · ${inhibitorLabel}` : operationLabel || "—";
};

export const mapPostCureOperationToApi = (operation: string): "LOOSE_FLAP_FILLING" | "INHIBITION" | null => {
  const normalized = String(operation ?? "").trim().toLowerCase();
  if (normalized === POST_CURE_OPERATION_LOOSE_FLAP) return "LOOSE_FLAP_FILLING";
  if (normalized === POST_CURE_OPERATION_INHIBITION) return "INHIBITION";
  return null;
};

export const mapPostCureInhibitorTypeToApi = (
  inhibitorType: string,
): "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE" | null => {
  const normalized = String(inhibitorType ?? "").trim();
  if (normalized === "IR1") return "IR1";
  if (normalized === "Hemcoat-3K") return "HEMCOAT_3K";
  if (normalized === "not-applicable") return "NOT_APPLICABLE";
  return null;
};

export const createPostCureData = () => ({
  schemaFormLoaded: false,
  motors: [] as import("../../../data/models/user/PostCureFormModel").PostCureMotorSession[],
});
