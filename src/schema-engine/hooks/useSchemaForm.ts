import { useCallback, useEffect, useState } from "react";
import type { SchemaDocumentV2 } from "../types";
import type { SchemaFormValues } from "../state/formState";
import { buildInitialFormValues } from "../state/formState";

export const useSchemaForm = (
  schema: SchemaDocumentV2 | null,
  initialValues?: SchemaFormValues,
) => {
  const [values, setValues] = useState<SchemaFormValues>(initialValues ?? {});

  useEffect(() => {
    if (!schema) return;
    setValues(initialValues ?? buildInitialFormValues(schema));
  }, [schema?.schemaVersion, schema?.schemaType]);

  const reset = useCallback(() => {
    if (schema) setValues(buildInitialFormValues(schema));
  }, [schema]);

  return { values, setValues, onChange: setValues, reset };
};

export default useSchemaForm;
