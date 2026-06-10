import { useEffect, useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
import {
  SchemaUI,
  buildRawMaterialSchemaRequest,
  buildRawMaterialSchemaRequestFromCodes,
  createInitialValues,
  hydrateValuesFromProcess,
  rawMaterialPrepSchemaFetchConfig,
  useSchemaFetch,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schemaManagement";
import {
  findGradeInMaterial,
  findMaterialInList,
} from "../../../../../schemaManagement/adapters/rawMaterialPreparation.adapter";
import type { MaterialsListItem } from "../../../../../data/models/user/MaterialsListModel";
import type { RawMaterialPrepMaterialSchemaSlot } from "../../../../../data/models/user/RawMaterialPreparationModel";
import { SOLID_PREP_BRAND, LIQUID_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";

type RawMaterialPremixSchemaPanelProps = {
  slot: "solid" | "liquid";
  materialCode: string;
  materialId?: number;
  gradeCode?: string;
  gradeId?: number;
  materials: MaterialsListItem[];
  subDepartmentId: number;
  slotState: RawMaterialPrepMaterialSchemaSlot;
  savedSections?: SchemaSectionSubmission[];
  onSlotChange: (next: RawMaterialPrepMaterialSchemaSlot) => void;
};

const RawMaterialPremixSchemaPanel = ({
  slot,
  materialCode,
  materialId,
  gradeCode = "",
  gradeId,
  materials,
  subDepartmentId,
  slotState,
  savedSections,
  onSlotChange,
}: RawMaterialPremixSchemaPanelProps) => {
  const hydratedRef = useRef(false);
  const material = findMaterialInList(materials, materialCode);
  const grade = findGradeInMaterial(material, gradeCode);
  const resolvedMaterialId = material?.materialId ?? materialId ?? 0;
  const resolvedGradeId = grade?.gradeId ?? gradeId ?? null;

  const requestBody = useMemo(() => {
    if (!materialCode || !subDepartmentId || !resolvedMaterialId) return null;

    if (material) {
      return buildRawMaterialSchemaRequest({
        subDepartmentId,
        material,
        grade: slot === "solid" ? grade ?? null : null,
      });
    }

    return buildRawMaterialSchemaRequestFromCodes({
      subDepartmentId,
      materialId: resolvedMaterialId,
      materialCode,
      gradeId: slot === "solid" ? resolvedGradeId : null,
      gradeCode: slot === "solid" ? gradeCode || null : null,
    });
  }, [
    material,
    grade,
    materialCode,
    resolvedMaterialId,
    resolvedGradeId,
    gradeCode,
    subDepartmentId,
    slot,
  ]);

  const canFetchSchema = Boolean(materialCode && subDepartmentId && resolvedMaterialId);

  const { schema, loading, error } = useSchemaFetch(
    rawMaterialPrepSchemaFetchConfig,
    requestBody,
    canFetchSchema
  );

  useEffect(() => {
    hydratedRef.current = false;
  }, [materialCode, gradeCode, slot, savedSections]);

  useEffect(() => {
    if (!schema) return;

    let nextValues: SchemaFormValues = slotState.formValues;
    if (!hydratedRef.current) {
      if (savedSections?.length) {
        nextValues = hydrateValuesFromProcess(schema, savedSections);
      } else if (Object.keys(slotState.formValues).length === 0) {
        nextValues = createInitialValues(schema);
      }
      hydratedRef.current = true;
    }

    onSlotChange({
      schema,
      schemaLoading: loading,
      schemaError: error,
      formValues: nextValues,
    });
  }, [schema, loading, error, savedSections]);

  const handleValuesChange = (values: SchemaFormValues) => {
    onSlotChange({
      schema: schema ?? slotState.schema,
      schemaLoading: loading,
      schemaError: error,
      formValues: values,
    });
  };

  const themeTokens = slot === "solid" ? SOLID_PREP_BRAND : LIQUID_PREP_BRAND;
  const activeSchema = slotState.schema ?? schema;

  if (!materialCode) {
    return (
      <Typography sx={{ fontSize: "0.78rem", color: themeTokens.textSub }}>
        No material selected for this process.
      </Typography>
    );
  }

  if (!resolvedMaterialId) {
    return (
      <Typography sx={{ fontSize: "0.78rem", color: themeTokens.warn }}>
        Material {materialCode} is not available in the loaded materials list.
      </Typography>
    );
  }

  return (
    <Box>
      <SchemaUI
        schema={activeSchema}
        value={slotState.formValues}
        onChange={handleValuesChange}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId }}
      />
    </Box>
  );
};

export default RawMaterialPremixSchemaPanel;
