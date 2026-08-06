import type { SchemaFormValues } from "../../../../../schema-engine";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";

type SubscaleMainScaleHardwarePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchType?: string | null;
  actionLoading?: boolean;
  isEditMode?: boolean;
  onRequestSaveDraft?: () => void;
  onRequestSubmit?: () => void;
};

const SubscaleMainScaleHardwarePanel = ({
  values,
  onChange,
  batchType = "MAIN_SCALE",
  actionLoading,
  isEditMode,
  onRequestSaveDraft,
  onRequestSubmit,
}: SubscaleMainScaleHardwarePanelProps) => (
  <SubscaleHardwareArticlePanel
    values={values}
    onChange={onChange}
    batchType={batchType}
    actionLoading={actionLoading}
    isEditMode={isEditMode}
    onRequestSaveDraft={onRequestSaveDraft}
    onRequestSubmit={onRequestSubmit}
  />
);

export default SubscaleMainScaleHardwarePanel;
