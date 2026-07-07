import { useCallback, useEffect, useState } from "react";
import schemaEngineController, { type SchemaFetchConfig } from "../controller/schemaEngineController";
import type { SchemaDocumentV2 } from "../types";
import {
  isSchemaDocumentReady,
  SCHEMA_LOAD_FAILED_MESSAGE,
} from "../utils/schemaMessages";

export { SCHEMA_LOAD_FAILED_MESSAGE } from "../utils/schemaMessages";

export const useSchemaFetch = (
  config: SchemaFetchConfig | null,
  requestBody: Record<string, unknown> | null,
  enabled = true,
) => {
  const [schema, setSchema] = useState<SchemaDocumentV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!config?.endpoint || !requestBody) {
      setSchema(null);
      setError(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    setSchema(null);

    const response = await schemaEngineController.fetchSchema(config, requestBody);
    setLoading(false);

    if (!response.success || !isSchemaDocumentReady(response.data)) {
      setError(response.message ?? SCHEMA_LOAD_FAILED_MESSAGE);
      setSchema(null);
      return null;
    }

    setSchema(response.data);
    return response.data;
  }, [config, requestBody]);

  useEffect(() => {
    if (!enabled) {
      setSchema(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchSchema();
  }, [enabled, fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
};

export default useSchemaFetch;
