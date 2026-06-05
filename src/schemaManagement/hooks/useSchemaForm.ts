import { useCallback, useEffect, useState } from "react";
import { createInitialValues, hydrateValuesFromProcess } from "../adapters/rawMaterialPreparation.adapter";
import type { SchemaDocument, SchemaFormValues, SchemaSectionSubmission } from "../models/schema.types";
import { valuesMatchSections } from "../models/schemaFormState";

export const useSchemaForm = (
  schema: SchemaDocument | null,
  initialSections?: SchemaSectionSubmission[]
) => {
  const [values, setValues] = useState<SchemaFormValues>({});

  useEffect(() => {
    if (!schema) {
      setValues({});
      return;
    }

    if (initialSections?.length) {
      setValues(hydrateValuesFromProcess(schema, initialSections));
      return;
    }

    setValues(createInitialValues(schema));
  }, [schema?.rawMaterialDetails.materialCode, schema?.sections.length, initialSections]);

  const handleChange = useCallback(
    (next: SchemaFormValues) => {
      if (!schema) {
        setValues(next);
        return;
      }
      setValues(valuesMatchSections(schema.sections, next));
    },
    [schema]
  );

  return { values, setValues, handleChange };
};

export default useSchemaForm;
