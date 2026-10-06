import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleMainScaleHardwarePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchType?: string | null;
  canManageProcessTables?: boolean;
  errors?: Record<string, string> | null;
  clearFieldError?: (path: string) => void;
};

const SubscaleMainScaleHardwarePanel = ({
  values,
  onChange,
  batchType = "MAIN_SCALE",
  canManageProcessTables = true,
  errors,
  clearFieldError,
}: SubscaleMainScaleHardwarePanelProps) => (
  <SubscaleHardwareArticlePanel
    values={values}
    onChange={onChange}
    batchType={batchType}
    canManageProcessTables={canManageProcessTables}
    errors={errors}
    clearFieldError={clearFieldError}
  />
);

export default SubscaleMainScaleHardwarePanel;
