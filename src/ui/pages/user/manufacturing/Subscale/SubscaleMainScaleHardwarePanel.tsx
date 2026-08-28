import type { SchemaFormValues } from "../../../../../schema-engine";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleMainScaleHardwarePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchType?: string | null;
  canManageProcessTables?: boolean;
};

const SubscaleMainScaleHardwarePanel = ({
  values,
  onChange,
  batchType = "MAIN_SCALE",
  canManageProcessTables = true,
}: SubscaleMainScaleHardwarePanelProps) => (
  <SubscaleHardwareArticlePanel
    values={values}
    onChange={onChange}
    batchType={batchType}
    canManageProcessTables={canManageProcessTables}
  />
);

export default SubscaleMainScaleHardwarePanel;
