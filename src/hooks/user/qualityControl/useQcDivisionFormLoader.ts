import { useCallback } from "react";
import { loadQcDivisionContext } from "./qcDivisionLoadPipeline";
import type { QcDivisionCatalogItem } from "./qcFlowConfig";

export const useQcDivisionFormLoader = (params: {
  subDepartmentId?: number | null;
  divisionCatalog: QcDivisionCatalogItem[];
}) => {
  const loadDivisionContext = useCallback(
    async (options: {
      batchId: string;
      listRow?: Record<string, unknown> | null;
      formId?: string | null;
      flowKey: string;
      rawMaterialType?: string | null;
      fetchManufacturingSeed?: () => Promise<Record<string, unknown> | null>;
      hasSetup?: boolean;
      setupLoaded?: boolean;
      hasQcSavedData?: boolean;
    }) =>
      loadQcDivisionContext({
        batchId: options.batchId,
        listRow: options.listRow,
        catalog: params.divisionCatalog,
        formId: options.formId,
        subDepartmentId: params.subDepartmentId,
        flowKey: options.flowKey,
        rawMaterialType: options.rawMaterialType,
        fetchManufacturingSeed: options.fetchManufacturingSeed,
        hasSetup: options.hasSetup,
        setupLoaded: options.setupLoaded,
        hasQcSavedData: options.hasQcSavedData,
      }),
    [params.divisionCatalog, params.subDepartmentId],
  );

  return { loadDivisionContext };
};
