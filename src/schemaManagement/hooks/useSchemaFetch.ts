import { useEffect, useState } from "react";
import schemaManagementController, {
  type SchemaFetchConfig,
} from "../controllers/schemaManagementController";
import type { SchemaDocument } from "../models/schema.types";

export const useSchemaFetch = (
  config: SchemaFetchConfig | null,
  requestBody: Record<string, unknown> | null,
  enabled = true
) => {
  const [schema, setSchema] = useState<SchemaDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestKey = requestBody ? JSON.stringify(requestBody) : "";

  useEffect(() => {
    if (!enabled || !config?.endpoint || !requestBody) {
      setSchema(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const response = await schemaManagementController.fetchSchema(config, requestBody);

      if (cancelled) return;

      if (response?.success && response.data?.sections?.length) {
        setSchema(response.data);
        setLoading(false);
        return;
      }

      setSchema(null);
      setError(response?.message || "Unable to load schema.");
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [config?.endpoint, requestKey, enabled]);

  return { schema, loading, error, refetchKey: requestKey };
};

export default useSchemaFetch;
