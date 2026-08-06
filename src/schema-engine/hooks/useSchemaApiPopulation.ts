import { useEffect, useRef } from "react";
import type { SchemaDocumentV2 } from "../types";
import type { SchemaFormValues } from "../state/formState";
import type { SchemaApiContext } from "../rules/apiDependency";
import {
  populateSchemaValuesFromApi,
  schemaHasPopulateFromApi,
} from "../rules/populateFromApi";

export const useSchemaApiPopulation = (
  schema: SchemaDocumentV2 | null | undefined,
  values: SchemaFormValues,
  onChange: (values: SchemaFormValues) => void,
  apiContext?: SchemaApiContext,
  readOnly = false,
) => {
  const populatedKeyRef = useRef<string | null>(null);
  const valuesRef = useRef(values);
  const onChangeRef = useRef(onChange);
  const apiContextRef = useRef(apiContext);
  valuesRef.current = values;
  onChangeRef.current = onChange;
  apiContextRef.current = apiContext;

  const batchId = String(apiContext?.batchId ?? "").trim();
  const motorId = String(apiContext?.motorId ?? "").trim();
  const populationKey =
    schema && batchId
      ? `${schema.schemaType}:${schema.schemaVersion}:${batchId}:${motorId}`
      : null;

  useEffect(() => {
    populatedKeyRef.current = null;
  }, [schema?.schemaVersion, schema?.schemaType, batchId, motorId]);

  useEffect(() => {
    if (readOnly || !schema || !populationKey || !schemaHasPopulateFromApi(schema)) return;
    if (populatedKeyRef.current === populationKey) return;

    let cancelled = false;

    void populateSchemaValuesFromApi(schema, valuesRef.current, {
      ...apiContextRef.current,
      batchId,
      motorId: motorId || undefined,
    }).then((nextValues) => {
      if (cancelled) return;
      populatedKeyRef.current = populationKey;
      if (nextValues === valuesRef.current) return;
      onChangeRef.current(nextValues);
    });

    return () => {
      cancelled = true;
    };
  }, [schema, populationKey, batchId, motorId, readOnly]);
};

export default useSchemaApiPopulation;
