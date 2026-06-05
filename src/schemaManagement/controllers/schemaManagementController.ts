import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import { fetchSchemaApi } from "../api/schemaApi";
import { normalizeSchemaDocument } from "../models/normalizeSchema";
import type { SchemaDocument } from "../models/schema.types";

export type SchemaFetchConfig = {
  endpoint: string;
};

export const schemaManagementController = {
  fetchSchema: async (config: SchemaFetchConfig, body: Record<string, unknown>) => {
    try {
      const response = await fetchSchemaApi(config.endpoint, body);
      return new ApiResponseModel<SchemaDocument | null>(response, (res) => normalizeSchemaDocument(res));
    } catch (error) {
      console.error("Failed to fetch schema:", error);
      return new ApiResponseModel<SchemaDocument | null>(error);
    }
  },
};

export default schemaManagementController;
