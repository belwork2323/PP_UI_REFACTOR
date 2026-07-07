import { get, post } from "../../data/api/httpClient";
import { USER_OPERATIONS_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaApiDataSource, SchemaDataSource } from "../types";

export type SchemaApiContext = {
  subDepartmentId?: number;
  batchId?: string;
  projectId?: string;
  motorId?: string;
  [key: string]: unknown;
};

const ENDPOINT_ALIASES: Record<string, string> = {
  "casting-station": USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST,
  "motors-stage-list": USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST,
  MOTORS_STAGE_LIST: USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST,
  "approved-motors-list": USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST,
  APPROVED_MOTORS_LIST: USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST,
  "material-lots": USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS,
  MATERIAL_LOTS: USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS,
  RAW_MATERIAL_LOTS: USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS,
  "raw-material-procurement-lot-list": USER_OPERATIONS_ENDPOINTS.LOT_LIST,
  RAW_MATERIAL_PROCUREMENT_LOT_LIST: USER_OPERATIONS_ENDPOINTS.LOT_LIST,
  "lot-list": USER_OPERATIONS_ENDPOINTS.LOT_LIST,
  LOT_LIST: USER_OPERATIONS_ENDPOINTS.LOT_LIST,
  "materials-list": USER_OPERATIONS_ENDPOINTS.MATERIALS_LIST,
  MATERIALS_LIST: USER_OPERATIONS_ENDPOINTS.MATERIALS_LIST,
  "specification-list": USER_OPERATIONS_ENDPOINTS.MATERIAL_SPECIFICATION_LIST,
  MATERIAL_SPECIFICATION_LIST: USER_OPERATIONS_ENDPOINTS.MATERIAL_SPECIFICATION_LIST,
  CASTING_STATION_LIST: USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST,
  STATION_MASTER: USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST,
};

export const resolveSchemaApiEndpoint = (endpoint: string): string => {
  const raw = String(endpoint ?? "").trim();
  if (!raw) return "";

  const alias = ENDPOINT_ALIASES[raw];
  if (alias) return alias;

  if (raw.includes("casting-station")) return USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST;
  if (raw.includes("motors-stage-list")) return USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST;
  if (raw.includes("approved-motors-list")) return USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST;
  if (raw.includes("material-lots")) return USER_OPERATIONS_ENDPOINTS.MATERIAL_LOTS;
  if (raw.includes("raw-material-procurement/form/lot-list")) return USER_OPERATIONS_ENDPOINTS.LOT_LIST;
  if (raw.includes("materials/specification-list")) return USER_OPERATIONS_ENDPOINTS.MATERIAL_SPECIFICATION_LIST;
  if (raw.includes("materials-list")) return USER_OPERATIONS_ENDPOINTS.MATERIALS_LIST;

  if (raw.startsWith("/api/v1")) return raw;
  if (raw.startsWith("api/v1")) return `/${raw}`;
  if (raw.startsWith("/user/")) return `/api/v1${raw}`;
  if (raw.startsWith("user/")) return `/api/v1/${raw}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const TEMPLATE_PATTERN = /\{\{(\w+)\}\}|\$\{(\w+)\}/g;

const resolveTemplateValue = (value: unknown, apiContext?: SchemaApiContext): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValue(item, apiContext));
  }
  if (typeof value !== "string" || (!value.includes("{{") && !value.includes("${"))) return value;
  return value.replace(TEMPLATE_PATTERN, (match, braceToken: string, dollarToken: string) => {
    const token = braceToken ?? dollarToken;
    const ctx = apiContext?.[token];
    return ctx != null && ctx !== "" ? String(ctx) : match;
  });
};

const isContextTemplate = (value: unknown, token: string): boolean => {
  if (typeof value !== "string") return false;
  return value.includes(`{{${token}}}`) || value.includes(`\${${token}}`);
};

const hasTemplateToken = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasTemplateToken);
  return typeof value === "string" && (value.includes("{{") || value.includes("${"));
};

const mergeApiContext = (
  requestBody: Record<string, unknown>,
  apiContext?: SchemaApiContext,
): Record<string, unknown> => {
  const params = Object.fromEntries(
    Object.entries(requestBody).map(([key, value]) => [key, resolveTemplateValue(value, apiContext)]),
  );

  const subDeptId = apiContext?.subDepartmentId;
  if (subDeptId) {
    if ("subdepartmentId" in requestBody && isContextTemplate(requestBody.subdepartmentId, "subDepartmentId")) {
      params.subdepartmentId = subDeptId;
    }
    if ("subDepartmentId" in requestBody && isContextTemplate(requestBody.subDepartmentId, "subDepartmentId")) {
      params.subDepartmentId = subDeptId;
    }
  }

  const materialCode = apiContext?.materialCode;
  if (materialCode != null && String(materialCode).trim()) {
    if ("materialCode" in requestBody && hasTemplateToken(requestBody.materialCode)) {
      params.materialCode = [String(materialCode).trim()];
    }
  }

  const batchId = apiContext?.batchId?.trim();
  if (batchId && "batchId" in requestBody) params.batchId = batchId;

  const projectId = apiContext?.projectId?.trim();
  if (projectId && "projectId" in requestBody) params.projectId = projectId;

  return params;
};

/** Normalize flat or string `dataSource.api` shapes from backend schemas. */
export const resolveDataSourceApi = (
  dataSource: SchemaDataSource & Record<string, unknown>,
): SchemaApiDataSource | null => {
  if (dataSource.type !== "api") return null;

  const flatMethod = dataSource.method as SchemaApiDataSource["method"] | undefined;
  const flatRequestField =
    typeof dataSource.requestField === "string" ? dataSource.requestField.trim() : undefined;
  const flatRequestBody = dataSource.requestBody as Record<string, unknown> | undefined;
  const flatResponsePath = typeof dataSource.responsePath === "string" ? dataSource.responsePath : undefined;
  const flatDisplayKey = typeof dataSource.displayKey === "string" ? dataSource.displayKey : undefined;
  const flatValueKey = typeof dataSource.valueKey === "string" ? dataSource.valueKey : undefined;

  const raw = dataSource.api;
  if (typeof raw === "string") {
    return {
      endpoint: raw,
      method: flatMethod,
      requestField: flatRequestField,
      requestBody: flatRequestBody,
      responsePath: flatResponsePath,
      displayKey: flatDisplayKey,
      valueKey: flatValueKey,
    };
  }

  if (!raw || typeof raw !== "object") {
    const flatEndpoint = String(dataSource.endpoint ?? "").trim();
    if (!flatEndpoint) return null;
    return {
      endpoint: flatEndpoint,
      method: flatMethod,
      requestField: flatRequestField,
      requestBody: flatRequestBody,
      responsePath: flatResponsePath,
      displayKey: flatDisplayKey,
      valueKey: flatValueKey,
    };
  }

  const api = raw as SchemaApiDataSource & Record<string, unknown>;
  return {
    endpoint: String(api.endpoint ?? api.url ?? dataSource.endpoint ?? ""),
    method: (api.method as SchemaApiDataSource["method"] | undefined) ?? flatMethod,
    requestField:
      typeof api.requestField === "string"
        ? api.requestField.trim()
        : flatRequestField,
    requestBody: (api.requestBody as Record<string, unknown> | undefined) ?? flatRequestBody,
    responsePath: typeof api.responsePath === "string" ? api.responsePath : flatResponsePath,
    displayKey: typeof api.displayKey === "string" ? api.displayKey : flatDisplayKey,
    valueKey: typeof api.valueKey === "string" ? api.valueKey : flatValueKey,
    nestedOptionsKey:
      typeof api.nestedOptionsKey === "string" ? api.nestedOptionsKey : undefined,
    parentMatchField:
      typeof api.parentMatchField === "string" ? api.parentMatchField : undefined,
    parentMatchContextKey:
      typeof api.parentMatchContextKey === "string" ? api.parentMatchContextKey : undefined,
  };
};

const buildSchemaApiPayload = (
  api: SchemaApiDataSource,
  apiContext?: SchemaApiContext,
): Record<string, unknown> => {
  const payload = mergeApiContext({ ...(api.requestBody ?? {}) }, apiContext);

  const requestField = String(api.requestField ?? "").trim();
  if (requestField && apiContext) {
    const value = apiContext[requestField];
    if (value != null && String(value).trim() !== "") {
      payload[requestField] = value;
    }
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => !hasUnresolvedTemplateTokens(value)),
  );
};

const NESTED_LIST_KEYS = [
  "materials",
  "specifications",
  "items",
  "list",
  "records",
  "lots",
  "options",
  "results",
  "data",
] as const;

export const buildRowApiContext = (
  apiContext: SchemaApiContext | undefined,
  row: Record<string, unknown>,
): SchemaApiContext => ({
  ...apiContext,
  ...row,
});

const hasUnresolvedTemplateTokens = (value: unknown): boolean => {
  if (typeof value === "string") return /\{\{|\$\{/.test(value);
  if (Array.isArray(value)) return value.some(hasUnresolvedTemplateTokens);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasUnresolvedTemplateTokens);
  }
  return false;
};

export const getDependentColumnIds = (
  columns: Array<{ id: string; dataSource?: SchemaDataSource }>,
  parentColumnId: string,
): string[] => {
  const pattern = new RegExp(`(?:\\$\\{|\\{\\{)${parentColumnId}(?:\\}|\\}\\})`);
  return columns
    .filter((column) => {
      if (column.dataSource?.type !== "api") return false;
      const api = resolveDataSourceApi(column.dataSource as SchemaDataSource & Record<string, unknown>);
      if (!api) return false;
      const serialized = JSON.stringify({
        requestBody: api.requestBody ?? {},
        requestField: api.requestField ?? "",
      });
      if (pattern.test(serialized)) return true;
      return api.parentMatchContextKey === parentColumnId;
    })
    .map((column) => column.id);
};

const resolveResponsePath = (root: Record<string, unknown>, path: string): unknown =>
  path
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
      return (current as Record<string, unknown>)[segment];
    }, root);

const extractNestedListFromPayload = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (!payload || typeof payload !== "object") return [];

  for (const key of NESTED_LIST_KEYS) {
    const candidate = (payload as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }

  return [];
};

export const extractSchemaApiOptionsList = (
  response: unknown,
  responsePath?: string,
): Record<string, unknown>[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response as Record<string, unknown>[];
  if (typeof response !== "object") return [];

  const root = response as Record<string, unknown>;
  if (responsePath?.trim()) {
    const resolved = resolveResponsePath(root, responsePath.trim());
    return extractNestedListFromPayload(resolved);
  }

  const payload = root.data ?? root;
  return extractNestedListFromPayload(payload);
};

const normalizeMatchValue = (value: unknown) => String(value ?? "").trim().toLowerCase();

const extractNestedOptionsList = (
  options: Record<string, unknown>[],
  api: SchemaApiDataSource,
  apiContext?: SchemaApiContext,
): Record<string, unknown>[] => {
  const nestedKey = api.nestedOptionsKey?.trim();
  const parentMatchField = api.parentMatchField?.trim() || "materialCode";
  const contextKey = api.parentMatchContextKey?.trim();
  if (!nestedKey || !contextKey) return options;

  const selected = String(apiContext?.[contextKey] ?? "").trim();
  if (!selected) return [];

  const selectedKey = normalizeMatchValue(selected);
  const parent = options.find(
    (item) => normalizeMatchValue(item[parentMatchField]) === selectedKey,
  );
  if (!parent) return [];

  const nested = parent[nestedKey];
  return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
};

const schemaApiListCache = new Map<string, Promise<Record<string, unknown>[]>>();

const buildSchemaApiCacheKey = (
  endpoint: string,
  method: string,
  payload: Record<string, unknown>,
): string => `${method}:${endpoint}:${JSON.stringify(payload)}`;

const fetchSchemaApiOptionsList = async (
  api: SchemaApiDataSource,
  apiContext?: SchemaApiContext,
): Promise<{ list: Record<string, unknown>[]; error: string | null }> => {
  const endpoint = resolveSchemaApiEndpoint(api.endpoint ?? "");
  if (!endpoint) return { list: [], error: "API endpoint is not configured." };

  const isCastingStation = endpoint.includes("casting-station");
  const payload = isCastingStation ? {} : buildSchemaApiPayload(api, apiContext);
  const requestField = String(api.requestField ?? "").trim();
  if (
    !isCastingStation &&
    requestField &&
    (payload[requestField] == null || String(payload[requestField]).trim() === "")
  ) {
    return { list: [], error: null };
  }
  if (!isCastingStation && hasUnresolvedTemplateTokens(payload)) {
    return { list: [], error: null };
  }
  const method = String(api.method ?? "POST").trim().toUpperCase() === "GET" ? "GET" : "POST";
  const cacheKey = buildSchemaApiCacheKey(endpoint, method, payload);

  let listPromise = schemaApiListCache.get(cacheKey);
  if (!listPromise) {
    listPromise = (async () => {
      const response =
        method === "GET"
          ? await get(endpoint, isCastingStation ? undefined : payload)
          : await post(endpoint, payload);

      const root = response as Record<string, unknown>;
      if (root?.success === false) {
        throw new Error(String(root.message ?? "Unable to load options."));
      }

      const list = extractSchemaApiOptionsList(response, api.responsePath);
      if (list.length === 0) {
        schemaApiListCache.delete(cacheKey);
      }
      return list;
    })();

    schemaApiListCache.set(cacheKey, listPromise);
    listPromise.catch(() => {
      schemaApiListCache.delete(cacheKey);
    });
  }

  try {
    return { list: await listPromise, error: null };
  } catch (error) {
    return {
      list: [],
      error: error instanceof Error ? error.message : "Unable to load options.",
    };
  }
};

export const fetchSchemaApiOptions = async (
  api: SchemaApiDataSource,
  apiContext?: SchemaApiContext,
): Promise<{ options: Record<string, unknown>[]; error: string | null }> => {
  const nestedKey = api.nestedOptionsKey?.trim();
  const contextKey = api.parentMatchContextKey?.trim();
  if (nestedKey && contextKey) {
    const selected = String(apiContext?.[contextKey] ?? "").trim();
    if (!selected) return { options: [], error: null };
  }

  const { list, error } = await fetchSchemaApiOptionsList(api, apiContext);
  if (error) return { options: [], error };

  return { options: extractNestedOptionsList(list, api, apiContext), error: null };
};

export const fetchSchemaDataSourceOptions = async (
  dataSource: SchemaDataSource,
  apiContext?: SchemaApiContext,
) => {
  if (dataSource.type !== "api") return { options: [], error: null };
  const api = resolveDataSourceApi(dataSource as SchemaDataSource & Record<string, unknown>);
  if (!api?.endpoint) return { options: [], error: "API endpoint is not configured." };
  return fetchSchemaApiOptions(api, apiContext);
};

export const resolveSchemaOptionKeys = (
  displayKey: string | undefined,
  valueKey: string | undefined,
  options: Record<string, unknown>[],
): { displayKey: string; valueKey: string } => {
  if (displayKey && valueKey) return { displayKey, valueKey };

  const sample = options[0];
  if (sample && "stationName" in sample) {
    return { displayKey: displayKey ?? "stationName", valueKey: valueKey ?? "stationCode" in sample ? "stationCode" : "stationId" };
  }
  if (sample && "lotId" in sample) return { displayKey: displayKey ?? "lotId", valueKey: valueKey ?? "lotId" };
  if (sample && "motorStage" in sample) return { displayKey: displayKey ?? "motorStage", valueKey: valueKey ?? "motorStage" };
  if (sample && "motorId" in sample) return { displayKey: displayKey ?? "motorId", valueKey: valueKey ?? "motorId" };
  if (sample && "buildingName" in sample) return { displayKey: displayKey ?? "buildingName", valueKey: valueKey ?? "buildingId" };
  if (sample && "specificationName" in sample) {
    return {
      displayKey: displayKey ?? "specificationName",
      valueKey: valueKey ?? ("specificationCode" in sample ? "specificationCode" : "specificationName"),
    };
  }
  if (sample && "gradeName" in sample) {
    return {
      displayKey: displayKey ?? "gradeName",
      valueKey: valueKey ?? ("gradeCode" in sample ? "gradeCode" : "gradeName"),
    };
  }
  if (sample && "materialName" in sample) {
    return {
      displayKey: displayKey ?? "materialName",
      valueKey: valueKey ?? ("materialCode" in sample ? "materialCode" : "materialName"),
    };
  }

  return { displayKey: displayKey ?? "label", valueKey: valueKey ?? "value" };
};

export const staticDataSourceOptions = (dataSource: SchemaDataSource) => {
  if (dataSource.type !== "static") return [];
  return dataSource.options.map((opt) => {
    if (typeof opt === "string") return { label: opt, value: opt };
    return opt;
  });
};
