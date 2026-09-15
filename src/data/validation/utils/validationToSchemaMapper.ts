import type { SchemaFormValues } from "@/schema-engine";
import type { ValidationTier } from "../submissionIntent";
import {
  qcRawMaterialValidationConfig,
  type QcRawMaterialValidationTarget,
} from "../configs/qcRawMaterial.validation.config";
import {
  qcMixingValidationConfig,
  type QcMixingValidationTarget,
} from "../configs/qcMixing.validation.config";
import {
  qcHardwareValidationConfig,
  type QcHardwareValidationTarget,
} from "../configs/qcHardware.validation.config";
import {
  qcCastingValidationConfig,
  type QcCastingValidationTarget,
} from "../configs/qcCasting.validation.config";
import {
  qcCuringValidationConfig,
  type QcCuringValidationTarget,
} from "../configs/qcCuring.validation.config";
import {
  qcDeCoringValidationConfig,
  type QcDeCoringValidationTarget,
} from "../configs/qcDeCoring.validation.config";
import {
  qcTrimmingValidationConfig,
  type QcTrimmingValidationTarget,
} from "../configs/qcTrimming.validation.config";
import {
  qcPostCureValidationConfig,
  type QcPostCureValidationTarget,
} from "../configs/qcPostCure.validation.config";
import {
  qcNdtDivisionValidationConfig,
  type QcNdtDivisionValidationTarget,
} from "../configs/qcNdtDivision.validation.config";
import {
  qcPropellantValidationConfig,
  type QcPropellantValidationTarget,
} from "../configs/qcPropellant.validation.config";
import {
  qcWeighmentValidationConfig,
  type QcWeighmentValidationTarget,
} from "../configs/qcWeighment.validation.config";
import { isRequiredForTier } from "../submissionIntent";
import type { QcDivisionEntry } from "@/hooks/user/qualityControl/qcDivisionEntryTypes";
import type { SchemaDocumentV2 } from "@/schema-engine/types";

/**
 * Maps validation configs to determine which fields are required for a given entry kind and tier
 * Returns a map of field paths to boolean indicating if the field is required
 */
export function getRequiredFieldsForEntry(
  entry: QcDivisionEntry,
  tier: ValidationTier
): Record<string, boolean> {
  const requiredFields: Record<string, boolean> = {};

  switch (entry.kind) {
    case "REVALIDATION": {
      const config = qcRawMaterialValidationConfig;
      const target = {
        entryId: entry.entryId,
        values: {} as SchemaFormValues, // We only need the structure, not actual values
      } as QcRawMaterialValidationTarget;

      Object.entries(config.fields).forEach(([ruleKey, rule]) => {
        if (isRequiredForTier(rule.requiredIn, tier)) {
          // For raw material, we need to resolve the actual field paths
          // This is simplified - in practice we'd use the config's resolveFieldPaths function
          // But for now we'll map common field names to their paths
          const pathMap: Record<string, string> = {
            lotBatchNumber: "rows.0.LOT_BATCH_NUMBER",
            parameter: "rows.0.PARAMETER",
            specification: "rows.0.SPECIFICATION",
            result: "rows.0.RESULT",
            acemQcResult: "rows.0.ACEM_QC_RESULT",
            validity: "rows.0.VALIDITY",
            remarks: "rows.0.REMARKS",
            qcCertificate: "rows.0.QC_CERTIFICATE",
          };

          const path = pathMap[ruleKey];
          if (path) {
            requiredFields[path] = true;
          }
        }
      });
      break;
    }

    case "MIXING_PREMIX":
    case "MIXING_FINAL_MIX": {
      const config = qcMixingValidationConfig;
      const target = {
        variant: entry.kind === "MIXING_PREMIX" ? "premix" : "finalMix",
        entryId: entry.entryId,
        values: {} as SchemaFormValues,
      } as QcMixingValidationTarget;

      Object.entries(config.fields).forEach(([ruleKey, rule]) => {
        if (isRequiredForTier(rule.requiredIn, tier)) {
          // Simplified mapping - in practice we'd use resolveFieldPaths
          const pathMap: Record<string, string> = {
            bowlNo: "details.0.BOWL_NO",
            dateOfPremix: "details.0.DATE_OF_PREMIX",
            dateOfFinalMix: "details.0.DATE_OF_FINAL_MIX",
            mixerBldgNo: "details.0.MIXER_BLDG_NO",
            batchSize: "details.0.PREMIX_QTY",
            specification: "details.0.SPECIFICATION",
            value: "details.0.VALUE", // Simplified - there could be multiple value fields
            remarks: "details.0.REMARKS",
            viscosityTime: "viscosityRows.0.TIME",
            viscosityValue: "viscosityRows.0.VISCOSITY_VALUE",
          };

          const path = pathMap[ruleKey];
          if (path) {
            requiredFields[path] = true;
          }
        }
      });
      break;
    }

    case "HARDWARE_PROCESS": {
      const config = qcHardwareValidationConfig;
      const target = {
        entryId: entry.entryId,
        subType: String(entry.subType ?? ""),
        values: {} as SchemaFormValues,
      } as QcHardwareValidationTarget;

      Object.entries(config.fields).forEach(([ruleKey, rule]) => {
        if (isRequiredForTier(rule.requiredIn, tier)) {
          // Hardware validation uses a different structure
          const pathMap: Record<string, string> = {
            optionSelected: "hardwareValues.OPTION_SELECTED",
            otherOption: "hardwareValues.OTHER_OPTION",
            serialNumber: "hardwareValues.SERIAL_NUMBER",
          };

          const path = pathMap[ruleKey];
          if (path) {
            requiredFields[path] = true;
          }
        }
      });
      break;
    }

    // Add cases for other entry types as needed...
    default:
      // For schema-driven entries, we'll rely on the schema itself having the required property set
      // This function returns empty for schema-driven types since they get required from schema
      break;
  }

  return requiredFields;
}

/**
 * Merges validation requirements into a schema by setting the validation.required property
 * on field blocks that are marked as required in the validation config
 * @param schema The schema to modify
 * @param entry The QC division entry to get validation requirements for
 * @param tier The validation tier to check (typically SUBMIT for form submission)
 * @returns The modified schema with validation requirements applied
 */
export function mergeValidationRequirementsIntoSchema(
  schema: SchemaDocumentV2 | null | undefined,
  entry: QcDivisionEntry,
  tier: ValidationTier = "SUBMIT"
): SchemaDocumentV2 | null | undefined {
  if (!schema) return schema;

  // Get required fields for this entry and tier
  const requiredFields = getRequiredFieldsForEntry(entry, tier);

  // If no required fields, return schema as-is
  if (Object.keys(requiredFields).length === 0) {
    return schema;
  }

  // Create a deep copy of the schema to avoid mutating the original
  const schemaCopy = JSON.parse(JSON.stringify(schema)) as SchemaDocumentV2;

  // Walk through the schema sections and blocks to find fields
  const sections = schemaCopy.data?.sections ?? [];

  sections.forEach(section => {
    const children = section.children ?? [];

    children.forEach(block => {
      // Process field blocks
      if (block.type === "field" && block.id) {
        const fieldPath = block.id;
        if (requiredFields[fieldPath]) {
          // Ensure validation object exists
          if (!block.validation) {
            block.validation = {};
          }
          // Set the required property
          block.validation.required = true;
        }
      }
      // Process repeat sections (tables, groups)
      else if (block.type === "section" && block.repeat && block.children) {
        block.children.forEach(child => {
          if (child.type === "field" && child.id) {
            // For repeat sections, we need to construct the path like "rows.0.FIELD_ID"
            // This is a simplified approach - in reality, the path construction
            // would depend on the specific repeat section structure
            const fieldPath = `${block.id}.0.${child.id}`;
            if (requiredFields[fieldPath]) {
              if (!child.validation) {
                child.validation = {};
              }
              child.validation.required = true;
            }
          }
        });
      }
    });
  });

  return schemaCopy;
}