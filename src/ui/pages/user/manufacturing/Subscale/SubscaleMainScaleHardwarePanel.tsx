import type { SchemaFormValues } from "../../../../../schema-engine";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleMainScaleHardwarePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchType?: string | null;
  canManageProcessTables?: boolean;
  clearFieldError?: (path: string) => void; // <-- Add this
};

const SubscaleMainScaleHardwarePanel = ({
  values,
  onChange,
  batchType = "MAIN_SCALE",
  canManageProcessTables = true,
  clearFieldError,
}: SubscaleMainScaleHardwarePanelProps) => (
  <SubscaleHardwareArticlePanel
    values={values}
    onChange={onChange}
    batchType={batchType}
    canManageProcessTables={canManageProcessTables}
    clearFieldError={clearFieldError}
  />
);

export default SubscaleMainScaleHardwarePanel;
