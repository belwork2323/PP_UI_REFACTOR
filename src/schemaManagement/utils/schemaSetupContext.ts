export type SchemaSetupContext = {
  finalMixCount?: number | string;
  motorId?: string;
  castingType?: string;
  castingStation?: string;
};

const TOKEN_PATTERN = /^\{\{(\w+)\}\}$/;

const readContextValue = (key: string, context?: SchemaSetupContext): unknown => {
  if (!context) return undefined;
  switch (key) {
    case "finalMixCount":
      return context.finalMixCount;
    case "motorId":
      return context.motorId;
    case "castingType":
      return context.castingType;
    case "castingStation":
      return context.castingStation;
    default:
      return (context as Record<string, unknown>)[key];
  }
};

export const resolveSchemaCountToken = (
  value: unknown,
  context?: SchemaSetupContext,
  fallback = 1,
): number => {
  if (value === undefined || value === null || value === "") {
    return fallback > 0 ? fallback : 1;
  }

  const raw = String(value).trim();
  const tokenMatch = raw.match(TOKEN_PATTERN);
  if (tokenMatch) {
    const resolved = Number(readContextValue(tokenMatch[1], context));
    return resolved > 0 ? resolved : fallback > 0 ? fallback : 1;
  }

  const parsed = Number(raw);
  return parsed > 0 ? parsed : fallback > 0 ? fallback : 1;
};

export const buildCastingSetupContext = (setup?: {
  finalMixCount?: string | number;
  castingType?: string;
  castingStation?: string;
}): SchemaSetupContext | undefined => {
  if (!setup) return undefined;
  return {
    finalMixCount: setup.finalMixCount,
    castingType: setup.castingType,
    castingStation: setup.castingStation,
  };
};
