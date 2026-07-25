import { useEffect, useMemo, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
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
} from "../../../../../schema-engine";
import {
  findGradeInMaterial,
  findMaterialInList,
} from "../../../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import type { MaterialsListItem } from "../../../../../data/models/user/MaterialsListModel";
import type { RawMaterialPrepMaterialSchemaSlot } from "../../../../../data/models/user/RawMaterialPreparationModel";
import { normalizeProcessSubmissionFromApi } from "../../../../../data/models/user/rawMaterialPreparationApiMapper";
import {
  SOLID_PREP_BRAND,
  LIQUID_PREP_BRAND,
} from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";

const normalizeSavedSectionsForSchema = (
  schema: NonNullable<RawMaterialPrepMaterialSchemaSlot["schema"]>,
  sections: SchemaSectionSubmission[],
  context: {
    materialId: number;
    materialCode: string;
    materialName: string;
    gradeId: number | null;
    gradeCode: string | null;
  },
): SchemaSectionSubmission[] =>
  normalizeProcessSubmissionFromApi(
    {
      materialId: context.materialId,
      materialCode: context.materialCode,
      materialName: context.materialName,
      gradeId: context.gradeId,
      gradeCode: context.gradeCode,
      schemaVersion: schema.schemaVersion,
      schemaType: schema.schemaType,
      sections,
    },
    schema,
  ).sections;

type RawMaterialPremixSchemaPanelProps = {
  slot: "solid" | "liquid";
  materialCode: string;
  materialId?: number;
  gradeCode?: string;
  gradeId?: number;
  materials: MaterialsListItem[];
  subDepartmentId?: number | null;
  batchId?: string;
  slotState: RawMaterialPrepMaterialSchemaSlot;
  savedSections?: SchemaSectionSubmission[];
  onSlotChange: (next: RawMaterialPrepMaterialSchemaSlot) => void;
  readOnly?: boolean;
};

const RawMaterialPremixSchemaPanel = ({
  slot,
  materialCode,
  materialId,
  gradeCode = "",
  gradeId,
  materials,
  subDepartmentId,
  batchId,
  slotState,
  savedSections,
  onSlotChange,
  readOnly = false,
}: RawMaterialPremixSchemaPanelProps) => {
  const appliedSavedSectionsRef = useRef<string | null>(null);
  const material = findMaterialInList(materials, materialCode);
  const grade = findGradeInMaterial(material, gradeCode);
  const resolvedSubDepartmentId = Number(subDepartmentId ?? 0);
  const resolvedMaterialId = Number(material?.materialId ?? materialId ?? 0);
  const resolvedGradeId = grade?.gradeId ?? gradeId ?? null;

  const savedSectionsSignature = useMemo(
    () =>
      savedSections?.length
        ? savedSections
            .map((section) => `${section.sectionId}:${JSON.stringify(section.sectionData)}`)
            .join("|")
        : "",
    [savedSections],
  );

  const requestBody = useMemo(() => {
    if (!materialCode || resolvedSubDepartmentId <= 0 || resolvedMaterialId <= 0) return null;

    if (material) {
      return buildRawMaterialSchemaRequest({
        subDepartmentId: resolvedSubDepartmentId,
        material,
        grade: slot === "solid" ? (grade ?? null) : null,
      });
    }

    return buildRawMaterialSchemaRequestFromCodes({
      subDepartmentId: resolvedSubDepartmentId,
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
    resolvedSubDepartmentId,
    slot,
  ]);

  const canFetchSchema =
    Boolean(materialCode) && resolvedSubDepartmentId > 0 && resolvedMaterialId > 0;

  const { schema, loading, error } = useSchemaFetch(
    rawMaterialPrepSchemaFetchConfig,
    requestBody,
    canFetchSchema,
  );

  useEffect(() => {
    appliedSavedSectionsRef.current = null;
  }, [materialCode, gradeCode, slot, resolvedMaterialId, savedSectionsSignature]);

  useEffect(() => {
    if (loading) {
      if (!slotState.schemaLoading) {
        onSlotChange({
          schema: slotState.schema,
          schemaLoading: true,
          schemaError: null,
          formValues: slotState.formValues,
        });
      }
      return;
    }

    if (error || !schema) {
      onSlotChange({
        schema: null,
        schemaLoading: false,
        schemaError: error,
        formValues: slotState.formValues,
      });
      return;
    }

    if (slotState.schema !== schema || slotState.schemaLoading || slotState.schemaError) {
      onSlotChange({
        schema,
        schemaLoading: false,
        schemaError: null,
        formValues: slotState.formValues,
      });
    }
  }, [schema, loading, error]);

  useEffect(() => {
    if (loading || error || !schema) return;

    if (savedSections?.length) {
      if (appliedSavedSectionsRef.current === savedSectionsSignature) return;

      const normalizedSections = normalizeSavedSectionsForSchema(schema, savedSections, {
        materialId: resolvedMaterialId,
        materialCode,
        materialName: material?.materialName ?? materialCode,
        gradeId: slot === "solid" ? resolvedGradeId : null,
        gradeCode: slot === "solid" ? gradeCode || null : null,
      });

      onSlotChange({
        schema,
        schemaLoading: false,
        schemaError: null,
        formValues: hydrateValuesFromProcess(schema, normalizedSections),
      });
      appliedSavedSectionsRef.current = savedSectionsSignature;
      return;
    }

    if (Object.keys(slotState.formValues).length === 0) {
      onSlotChange({
        schema,
        schemaLoading: false,
        schemaError: null,
        formValues: createInitialValues(schema),
      });
    }
  }, [
    schema,
    loading,
    error,
    savedSections,
    savedSectionsSignature,
    materialCode,
    gradeCode,
    slot,
    resolvedMaterialId,
    resolvedGradeId,
    material?.materialName,
  ]);

  const handleValuesChange = (values: SchemaFormValues) => {
    if (readOnly) return;
    onSlotChange({
      schema: error || loading ? null : schema,
      schemaLoading: loading,
      schemaError: error,
      formValues: values,
    });
  };

  const themeTokens = slot === "solid" ? SOLID_PREP_BRAND : LIQUID_PREP_BRAND;

  if (!materialCode) {
    return (
      <Typography sx={{ fontSize: "0.78rem", color: themeTokens.textSub }}>
        No material selected for this process.
      </Typography>
    );
  }

  if (resolvedSubDepartmentId <= 0) {
    return (
      <Typography sx={{ fontSize: "0.78rem", color: themeTokens.warn }}>
        Sub-department context is missing. Unable to load the preparation schema.
      </Typography>
    );
  }

  if (resolvedMaterialId <= 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
        <CircularProgress size={16} />
        <Typography sx={{ fontSize: "0.78rem", color: themeTokens.textSub }}>
          Resolving material details for {materialCode}…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={slotState.formValues}
        onChange={handleValuesChange}
        loading={loading}
        error={error}
        readOnly={readOnly}
        themeTokens={themeTokens}
        apiContext={{
          subDepartmentId: resolvedSubDepartmentId,
          batchId,
          materialCode,
          gradeCode: slot === "solid" ? gradeCode || undefined : undefined,
          materialId: resolvedMaterialId,
          gradeId: resolvedGradeId ?? undefined,
        }}
      />
    </Box>
  );
};

export default RawMaterialPremixSchemaPanel;
