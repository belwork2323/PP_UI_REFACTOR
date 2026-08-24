export const mapTrimmingMotorStage = (motorStage?: unknown): string => {
  const raw = String(motorStage ?? "0").trim().toUpperCase();
  if (/^S\d+$/.test(raw)) return raw;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return `S${numeric}`;
  return `S${raw}`;
};

export const resolveTrimmingMotorStage = (
  batch?: { motorStage?: unknown; motorType?: unknown } | null,
) => mapTrimmingMotorStage(batch?.motorStage ?? batch?.motorType);

/** Numeric motor stage from label (e.g. S0 → 0). */
export const resolveTrimmingMotorStageNumber = (
  batch?: { motorStage?: unknown; motorType?: unknown } | null,
): number => {
  const label = mapTrimmingMotorStage(batch?.motorStage ?? batch?.motorType);
  const match = /^S(\d+)$/.exec(label);
  return match ? Number(match[1]) : 0;
};

export const resolveTrimmingMotorStageForApi = (motorStage?: unknown): number =>
  resolveTrimmingMotorStageNumber({ motorStage });
