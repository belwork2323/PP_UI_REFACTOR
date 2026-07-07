import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import { fetchSchemaApi } from "../api/schemaApi";
import {
  isSchemaDocumentReady,
  SCHEMA_LOAD_FAILED_MESSAGE,
  SCHEMA_MISSING_SECTIONS_MESSAGE,
} from "../utils/schemaMessages";
import { parseSchemaDocument } from "../utils/schemaUtils";
import type { SchemaDocumentV2 } from "../types";

export type SchemaFetchConfig = {
  endpoint: string;
};

export const schemaEngineController = {
  fetchSchema: async (config: SchemaFetchConfig, body: Record<string, unknown>) => {
    try {
      const response = await fetchSchemaApi(config.endpoint, body);
      const result = new ApiResponseModel<SchemaDocumentV2 | null>(response, (res) =>
        parseSchemaDocument(res),
      );

      if (result.success && !isSchemaDocumentReady(result.data)) {
        return new ApiResponseModel<SchemaDocumentV2 | null>({
          success: false,
          statusCode: 422,
          message: SCHEMA_MISSING_SECTIONS_MESSAGE,
        });
      }

      return result;
    } catch (error) {
      console.error("Failed to fetch schema:", error);
      const failure =
        error instanceof Error
          ? error
          : new Error(
              typeof error === "object" && error && "message" in error
                ? String((error as { message: unknown }).message)
                : SCHEMA_LOAD_FAILED_MESSAGE,
            );
      return new ApiResponseModel<SchemaDocumentV2 | null>(failure);
    }
  },
};

export default schemaEngineController;
