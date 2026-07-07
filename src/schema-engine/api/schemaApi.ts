import { post } from "../../data/api/httpClient";

export const fetchSchemaApi = async (endpoint: string, payload: Record<string, unknown>) =>
  post(endpoint, payload);
