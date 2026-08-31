import {
  divisionHasQcSetup,
  getQcDivisionSetupDefinition,
  resolveQcDivisionSetupKey,
} from "./qcDivisionSetupConfig";

export type QcDivisionSetupRegistryEntry = {
  setupKey: string;
  hasSetup: boolean;
  requiresExplicitLoad: boolean;
};

export const getQcDivisionSetupRegistryEntry = (
  flowKey: string,
  rawMaterialType?: string | null,
): QcDivisionSetupRegistryEntry => {
  const setupKey = resolveQcDivisionSetupKey(flowKey, rawMaterialType);
  const definition = getQcDivisionSetupDefinition(flowKey, rawMaterialType);
  const motorOnly = ["DE_CORING", "QC", "WEIGHTMENT"].includes(setupKey);

  return {
    setupKey,
    hasSetup: divisionHasQcSetup(flowKey, rawMaterialType),
    requiresExplicitLoad: Boolean(definition && !motorOnly),
  };
};

export const canLoadQcDivisionFormAfterSetup = (params: {
  flowKey: string;
  rawMaterialType?: string | null;
  setupLoaded: boolean;
  hasManufacturingData: boolean;
  hasQcSavedData: boolean;
}): boolean => {
  if (params.hasQcSavedData || params.hasManufacturingData) return true;
  const entry = getQcDivisionSetupRegistryEntry(params.flowKey, params.rawMaterialType);
  if (!entry.hasSetup) return true;
  return params.setupLoaded;
};

export { divisionHasQcSetup, getQcDivisionSetupDefinition };
