import { get, post } from "../../data/api/httpClient";
import { USER_OPERATIONS_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaApiContext, SchemaFieldDataSource } from "../models/schema.types";

export const resolveSchemaApiEndpoint = (api: string): string => {
  const raw = String(api ?? "").trim();
  if (!raw) return "";

  if (raw.includes("casting-station")) {
    return USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST;
  }

  if (raw.includes("material-lots")) {
    return USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS;
  }

  if (raw.startsWith("/api/v1")) return raw;
  if (raw.startsWith("api/v1")) return `/${raw}`;
  if (raw.startsWith("/user/")) return `/api/v1${raw}`;
  if (raw.startsWith("user/")) return `/api/v1/${raw}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const TEMPLATE_PATTERN = /\{\{(\w+)\}\}/g;

const isUnsetParam = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  value === 0 ||
  (typeof value === "string" && value.includes("{{"));

const resolveSchemaTemplateValue = (
  value: unknown,
  apiContext?: SchemaApiContext
): unknown => {
  if (typeof value !== "string" || !value.includes("{{")) return value;

  return value.replace(TEMPLATE_PATTERN, (match, token: string) => {
    const ctxValue = apiContext?.[token as keyof SchemaApiContext];
    return ctxValue != null && ctxValue !== "" ? String(ctxValue) : match;
  });
};

const mergeApiContextIntoParams = (
  requestBody: Record<string, unknown>,
  apiContext?: SchemaApiContext
): Record<string, unknown> => {
  const params = Object.fromEntries(
    Object.entries(requestBody).map(([key, value]) => [
      key,
      resolveSchemaTemplateValue(value, apiContext),
    ])
  );

  const subDeptId = apiContext?.subDepartmentId;
  if (subDeptId) {
    if ("subdepartmentId" in requestBody && isUnsetParam(params.subdepartmentId)) {
      params.subdepartmentId = subDeptId;
    }
    if ("subDepartmentId" in requestBody && isUnsetParam(params.subDepartmentId)) {
      params.subDepartmentId = subDeptId;
    }
  }

  const batchId = apiContext?.batchId?.trim();
  if (batchId && "batchId" in requestBody && isUnsetParam(params.batchId)) {
    params.batchId = batchId;
  }

  return params;
};

const resolveHttpMethod = (dataSource: SchemaFieldDataSource): "GET" | "POST" => {
  const method = String(dataSource.method ?? "POST").trim().toUpperCase();
  return method === "GET" ? "GET" : "POST";
};

const NESTED_LIST_KEYS = [
  "materials",
  "items",
  "list",
  "records",
  "lots",
  "options",
  "results",
] as const;

const resolveResponsePath = (root: Record<string, unknown>, path: string): unknown => {
  return path
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
      return (current as Record<string, unknown>)[segment];
    }, root);
};

export const extractSchemaApiOptionsList = (
  response: unknown,
  responsePath?: string,
): Record<string, unknown>[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response as Record<string, unknown>[];
  }

  if (typeof response !== "object") return [];

  const root = response as Record<string, unknown>;

  if (responsePath?.trim()) {
    const resolved = resolveResponsePath(root, responsePath.trim());
    return Array.isArray(resolved) ? (resolved as Record<string, unknown>[]) : [];
  }

  const payload = root.data ?? root;
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (payload && typeof payload === "object") {
    const payloadRecord = payload as Record<string, unknown>;
    for (const key of NESTED_LIST_KEYS) {
      const candidate = payloadRecord[key];
      if (Array.isArray(candidate)) {
        return candidate as Record<string, unknown>[];
      }
    }
  }

  for (const key of NESTED_LIST_KEYS) {
    const candidate = root[key];
    if (Array.isArray(candidate)) {
      return candidate as Record<string, unknown>[];
    }
  }

  return [];
};

export const fetchSchemaApiOptions = async (
  dataSource: SchemaFieldDataSource,
  apiContext?: SchemaApiContext
): Promise<{ options: Record<string, unknown>[]; error: string | null }> => {
  const endpoint = resolveSchemaApiEndpoint(dataSource.api ?? "");
  if (!endpoint) {
    return { options: [], error: "API endpoint is not configured." };
  }

  const isCastingStation = endpoint.includes("casting-station");
  const payload = isCastingStation
    ? {}
    : mergeApiContextIntoParams(dataSource.requestBody ?? {}, apiContext);
  const method = resolveHttpMethod(dataSource);

  try {
    const response =
      method === "GET"
        ? await get(endpoint, isCastingStation ? undefined : payload)
        : await post(endpoint, payload);

    const root = response as Record<string, unknown>;
    if (root?.success === false) {
      return {
        options: [],
        error: String(root.message ?? "Unable to load options."),
      };
    }

    const list = extractSchemaApiOptionsList(response, dataSource.responsePath);
    return { options: list, error: null };
  } catch {
    return { options: [], error: "Unable to load options." };
  }
};

export const resolveSchemaOptionKeys = (
  fieldDisplayKey: string | undefined,
  fieldValueKey: string | undefined,
  options: Record<string, unknown>[]
): { displayKey: string; valueKey: string } => {
  if (fieldDisplayKey && fieldValueKey) {
    return { displayKey: fieldDisplayKey, valueKey: fieldValueKey };
  }

  const sample = options[0];
  if (sample && "stationName" in sample) {
    return {
      displayKey: fieldDisplayKey ?? "stationName",
      valueKey: fieldValueKey ?? ("stationCode" in sample ? "stationCode" : "stationId"),
    };
  }

  if (sample && "lotId" in sample) {
    return {
      displayKey: fieldDisplayKey ?? "lotId",
      valueKey: fieldValueKey ?? "lotId",
    };
  }

  if (sample && "materialCode" in sample && "materialName" in sample) {
    return {
      displayKey: fieldDisplayKey ?? "materialName",
      valueKey: fieldValueKey ?? "materialCode",
    };
  }

  return {
    displayKey: fieldDisplayKey ?? "label",
    valueKey: fieldValueKey ?? "value",
  };
};
