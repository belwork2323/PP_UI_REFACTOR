// utils/caseConverter.ts

export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v));
  } else if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
      // Avoid destroying existing camelCase keys like 'srNo'
      const camelKey =
        key.includes("_") || key === key.toUpperCase()
          ? key.toLowerCase().replace(/(_[a-z])/g, (g) => g.toUpperCase().replace("_", ""))
          : key;

      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toSnakeCase(v));
  } else if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
      // Preserve uppercase totals if needed, otherwise convert camelCase or PascalCase to snake_case
      const snakeKey = key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase();

      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

export const toUpperSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => toUpperSnakeCase(v));
  } else if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
      const upperSnakeKey = key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toUpperCase();

      acc[upperSnakeKey] = toUpperSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};
