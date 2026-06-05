import { get, post } from "../../data/api/httpClient";
import { USER_OPERATIONS_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaApiContext, SchemaFieldDataSource } from "../models/schema.types";

export const resolveSchemaApiEndpoint = (api: string): string => {
  const raw = String(api ?? "").trim();
  if (!raw) return "";

  if (raw.includes("casting-station")) {
    return USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST;
  }

  if (raw.startsWith("/api/v1")) return raw;
  if (raw.startsWith("api/v1")) return `/${raw}`;
  if (raw.startsWith("/user/")) return `/api/v1${raw}`;
  if (raw.startsWith("user/")) return `/api/v1/${raw}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const mergeApiContextIntoParams = (
  requestBody: Record<string, unknown>,
  apiContext?: SchemaApiContext
): Record<string, unknown> => {
  const params = { ...requestBody };
  const subDeptId = apiContext?.subDepartmentId;
  if (!subDeptId) return params;

  const needsSubDept =
    params.subdepartmentId === undefined ||
    params.subdepartmentId === null ||
    params.subdepartmentId === 0 ||
    params.subdepartmentId === "";
  const needsSubDeptCamel =
    params.subDepartmentId === undefined ||
    params.subDepartmentId === null ||
    params.subDepartmentId === 0 ||
    params.subDepartmentId === "";

  if (needsSubDept) params.subdepartmentId = subDeptId;
  if (needsSubDeptCamel) params.subDepartmentId = subDeptId;

  return params;
};

const resolveHttpMethod = (dataSource: SchemaFieldDataSource): "GET" | "POST" => {
  const method = String(dataSource.method ?? "POST").trim().toUpperCase();
  return method === "GET" ? "GET" : "POST";
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

    const list = Array.isArray(root?.data) ? root.data : Array.isArray(response) ? response : [];
    return { options: list as Record<string, unknown>[], error: null };
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
  return {
    displayKey: fieldDisplayKey ?? "label",
    valueKey: fieldValueKey ?? "value",
  };
};
