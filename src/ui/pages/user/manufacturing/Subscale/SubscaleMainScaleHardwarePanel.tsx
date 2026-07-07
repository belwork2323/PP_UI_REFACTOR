import type { SchemaFormValues } from "../../../../../schema-engine";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleMainScaleHardwarePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
};

const SubscaleMainScaleHardwarePanel = ({ values, onChange }: SubscaleMainScaleHardwarePanelProps) => (
  <SubscaleHardwareArticlePanel values={values} onChange={onChange} />
);

export default SubscaleMainScaleHardwarePanel;
