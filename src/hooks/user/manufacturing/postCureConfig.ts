import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.POST_CURE;

export const POST_CURE_OP_TYPE_CONFIG: Record<string, { color: string; italic?: boolean }> = {
  demoulding:           { color: "#6D4C41" },
  "x-ray inspection":   { color: "#1565C0" },
  "dimensional check":  { color: "#4A235A" },
  "weight measurement": { color: "#0E6655" },
  "full process":       { color: "#1B4F72" },
  "not selected yet":   { color: "#616A6B", italic: true },
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

export const createPostCureData = () => ({
  motorId: "",
  r1:   "",      // De-coring load
  r2:   "",      // Trimming dimension
  r3a:  "",      // LF — inspection
  r3b1: "",      // LF — weight HE side + date
  r3b2: "",      // LF — weight NE side + date
  r3b3: "",      // LF — total
  r4a:  "",      // IR — type
  r4b1: "",      // IR — weight HE side + date
  r4b2: "",      // IR — weight NE side + date
  r4b3: "",      // IR — total
});

const DATA_FIELDS = ["r1", "r2", "r3a", "r3b1", "r3b2", "r3b3", "r4a", "r4b1", "r4b2", "r4b3"] as const;

export const countPostCureFilled = (data: Record<string, string>) =>
  DATA_FIELDS.filter((key) => String(data[key] ?? "").trim() !== "").length;

export const countPostCureTotal = () => DATA_FIELDS.length;
