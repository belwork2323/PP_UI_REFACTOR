import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleMainScaleHardwarePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchType?: string | null;
  batchDetails?: {
    subBatchType?: string | null;
    articles?: Array<{
      subscaleArticleId?: number;
      subscaleArticleCode?: string;
      subscaleArticleName?: string;
      isActive?: boolean;
    }> | null;
  } | null;
  canManageProcessTables?: boolean;
  errors?: Record<string, string> | null;
  clearFieldError?: (path: string) => void;
  validationFocusPath?: string | null;
};

const SubscaleMainScaleHardwarePanel = ({
  values,
  onChange,
  batchType = "MAIN_SCALE",
  batchDetails = null,
  canManageProcessTables = true,
  errors,
  clearFieldError,
  validationFocusPath = null,
}: SubscaleMainScaleHardwarePanelProps) => (
  <SubscaleHardwareArticlePanel
    values={values}
    onChange={onChange}
    batchType={batchType}
    batchDetails={batchDetails}
    canManageProcessTables={canManageProcessTables}
    errors={errors}
    clearFieldError={clearFieldError}
    validationFocusPath={validationFocusPath}
  />
);

export default SubscaleMainScaleHardwarePanel;
