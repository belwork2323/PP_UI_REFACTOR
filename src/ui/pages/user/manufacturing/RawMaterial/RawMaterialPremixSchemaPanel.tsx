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
import { cloneValue } from "../../../../../schema-engine/state/formState";
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
  /** Unique premix+material session key — keeps form state isolated across premixes. */
  sessionKey: string;
  premixNo: number;
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
  /** Field path → message from schemaFormValidation (red under fields). */
  validationErrors?: Record<string, string>;
};

const RawMaterialPremixSchemaPanel = ({
  sessionKey,
  premixNo,
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
  validationErrors,
}: RawMaterialPremixSchemaPanelProps) => {
  const appliedSavedSectionsRef = useRef<string | null>(null);
  const initializedSessionRef = useRef<string | null>(null);
  const slotStateRef = useRef(slotState);
  const onSlotChangeRef = useRef(onSlotChange);
  slotStateRef.current = slotState;
  onSlotChangeRef.current = onSlotChange;

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
    initializedSessionRef.current = null;
  }, [sessionKey, materialCode, gradeCode, slot, resolvedMaterialId, savedSectionsSignature]);

  useEffect(() => {
    const currentSlot = slotStateRef.current;
    if (loading) {
      if (!currentSlot.schemaLoading) {
        onSlotChangeRef.current({
          schema: currentSlot.schema,
          schemaLoading: true,
          schemaError: null,
          formValues: cloneValue(currentSlot.formValues ?? {}),
        });
      }
      return;
    }

    if (error || !schema) {
      onSlotChangeRef.current({
        schema: null,
        schemaLoading: false,
        schemaError: error,
        formValues: cloneValue(currentSlot.formValues ?? {}),
      });
      return;
    }

    if (currentSlot.schema !== schema || currentSlot.schemaLoading || currentSlot.schemaError) {
      onSlotChangeRef.current({
        schema,
        schemaLoading: false,
        schemaError: null,
        formValues: cloneValue(currentSlot.formValues ?? {}),
      });
    }
  }, [schema, loading, error, sessionKey]);

  useEffect(() => {
    if (loading || error || !schema) return;

    const currentSlot = slotStateRef.current;

    if (savedSections?.length) {
      const applyKey = `${sessionKey}:${savedSectionsSignature}`;
      if (appliedSavedSectionsRef.current === applyKey) return;

      const normalizedSections = normalizeSavedSectionsForSchema(schema, savedSections, {
        materialId: resolvedMaterialId,
        materialCode,
        materialName: material?.materialName ?? materialCode,
        gradeId: slot === "solid" ? resolvedGradeId : null,
        gradeCode: slot === "solid" ? gradeCode || null : null,
      });

      onSlotChangeRef.current({
        schema,
        schemaLoading: false,
        schemaError: null,
        formValues: cloneValue(hydrateValuesFromProcess(schema, normalizedSections)),
      });
      appliedSavedSectionsRef.current = applyKey;
      initializedSessionRef.current = sessionKey;
      return;
    }

    if (
      Object.keys(currentSlot.formValues ?? {}).length === 0 &&
      initializedSessionRef.current !== sessionKey
    ) {
      onSlotChangeRef.current({
        schema,
        schemaLoading: false,
        schemaError: null,
        formValues: cloneValue(createInitialValues(schema)),
      });
      initializedSessionRef.current = sessionKey;
    }
  }, [
    schema,
    loading,
    error,
    savedSections,
    savedSectionsSignature,
    sessionKey,
    materialCode,
    gradeCode,
    slot,
    resolvedMaterialId,
    resolvedGradeId,
    material?.materialName,
  ]);

  const handleValuesChange = (values: SchemaFormValues) => {
    if (readOnly) return;
    onSlotChangeRef.current({
      schema: error || loading ? null : schema,
      schemaLoading: loading,
      schemaError: error,
      // Always clone so Premix N never shares a mutable object with Premix M.
      formValues: cloneValue(values),
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
        errors={validationErrors}
        apiContext={{
          subDepartmentId: resolvedSubDepartmentId,
          batchId,
          materialCode,
          gradeCode: slot === "solid" ? gradeCode || undefined : undefined,
          materialId: resolvedMaterialId,
          gradeId: resolvedGradeId ?? undefined,
          premixNo,
          sessionKey,
        }}
      />
    </Box>
  );
};

export default RawMaterialPremixSchemaPanel;
