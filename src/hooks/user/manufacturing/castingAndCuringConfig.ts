import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.CASTING_CURING;

export const STAGE_CONFIG: Record<string, { label: string; color: string; italic?: boolean }> = {
  casting: { label: "Casting", color: "#6D4C41" },
  curing: { label: "Curing", color: "#1565C0" },
  "casting & curing": { label: "Casting & Curing", color: "#4A235A" },
  "casting-curing": { label: "Casting & Curing", color: "#4A235A" },
  "not selected yet": { label: "Not Selected Yet", color: "#616A6B", italic: true },
};

export const getStageCfg = (value: string) =>
  STAGE_CONFIG[String(value ?? "").toLowerCase()] ?? { label: value ?? "—", color: "#555" };

const mkFixed = (label: string) => ({
  label,
  m1: "",
  m2: "",
});

const newBowlRow = (n?: number) => ({
  id: Math.random(),
  bowlNo: n != null ? String(n) : "",
  propellantQty: "",
  viscosity: "",
  viscosityTemp: "",
  arrivalTime: "",
  slurry1: "",
  slurry2: "",
});

const nextTLabel = (rows: any[]) => {
  const nums = rows.map((r) => {
    const m = r.label?.match(/T0\s*\+\s*(\d+)/);
    return m ? parseInt(m[1]) : 0;
  });
  return `T0 + ${Math.max(...nums, 0) + 30}`;
};

export const createCastingAndCuringData = () => ({
  bowl: {
    motorIds: { m1: "", m2: "" },
    rows: [newBowlRow(1), newBowlRow(2), newBowlRow(3)],
  },
  curingDetails: {
    motorIds: { m1: "", m2: "" },
    r1: { m1: "", m2: "" },
    r2: { m1: "", m2: "" },
    r3: [{ id: "t0", label: "T0", m1: "", m2: "" }],
    r4: { param: "", m1: "", m2: "" },
    r5a: { m1: "", m2: "" },
    r5b: { m1: "", m2: "" },
    r6: { param: "", m1: "", m2: "" },
  },
  curingDetails2: {
    motorIds: { m1: "", m2: "" },
    r1: { m1: "", m2: "" },
    r2: { m1: "", m2: "" },
    r3: { m1: "", m2: "" },
    r4: { m1: "", m2: "" },
  },
});

export const countBowlFieldsFilled = (row: Record<string, unknown>) =>
  ["propellantQty", "viscosity", "viscosityTemp", "arrivalTime", "slurry1", "slurry2"].filter(
    (key) => String(row[key] ?? "").trim() !== ""
  ).length;

export const countCuringFieldsFilled = (row: Record<string, unknown>) =>
  ["m1", "m2"].filter((key) => String(row[key] ?? "").trim() !== "").length;

export const countRowsWithData = (rows: any[], fieldCounter: (row: any) => number) =>
  rows.filter((row) => fieldCounter(row) > 0).length;

export { mkFixed, newBowlRow, nextTLabel };
