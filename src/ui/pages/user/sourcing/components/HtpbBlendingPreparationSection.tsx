import { STRINGS } from "@app/config/strings";
import type {
  HtpbBlendingPreparationDetails,
  PreparationLotDropdownOption,
} from "@data/models/user/RawMaterialProcurementModel";
import type { ValidationErrors } from "@/data/validation/submissionIntent";
import type { ValidationAttemptFlags } from "@/ui/components/validation/useValidationDisplay";
import BlendingStylePreparationSection from "./BlendingStylePreparationSection";

const L = STRINGS.SOURCING.SPECIFICATION_FORM.HTPB_BLENDING_PREPARATION;

type Props = {
  details: HtpbBlendingPreparationDetails;
  blockIndex: number;
  mfgLotOptions: PreparationLotDropdownOption[];
  loadingLots?: boolean;
  onChange: (next: HtpbBlendingPreparationDetails) => void;
  errors: ValidationErrors;
  validationAttempt: ValidationAttemptFlags;
  theme: any;
  disabled?: boolean;
};

const HtpbBlendingPreparationSection = (props: Props) => (
  <BlendingStylePreparationSection
    {...props}
    preparationKey="htpbBlendingPreparation"
    labels={L}
  />
);

export default HtpbBlendingPreparationSection;
