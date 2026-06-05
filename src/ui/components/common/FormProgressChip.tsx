import { Chip, alpha } from "@mui/material";
import { icons } from "../../../app/theme/icons";

const { checkCircleOutline: CheckCircleOutlineRoundedIcon } =
  icons.user.manufacturing.rawMaterial.solidPreparation;

type Props = {
  filledCount: number;
  totalCount: number;
  accentColor: string;
  warnColor: string;
  completeLabel?: string;
  suffixLabel?: string;
};

const FormProgressChip = ({
  filledCount,
  totalCount,
  accentColor,
  warnColor,
  completeLabel = "All filled",
  suffixLabel = "filled",
}: Props) => {
  const isComplete = filledCount === totalCount;

  return (
    <Chip
      icon={
        isComplete ? (
          <CheckCircleOutlineRoundedIcon
            sx={{ fontSize: "13px !important", color: `${accentColor} !important` }}
          />
        ) : undefined
      }
      label={isComplete ? completeLabel : `${filledCount} / ${totalCount} ${suffixLabel}`}
      size="small"
      sx={{
        height: 22,
        fontSize: "0.65rem",
        fontWeight: 700,
        background: isComplete ? alpha(accentColor, 0.1) : alpha(warnColor, 0.1),
        color: isComplete ? accentColor : "#7D6608",
        border: `1px solid ${isComplete ? alpha(accentColor, 0.25) : alpha(warnColor, 0.3)}`,
      }}
    />
  );
};

export default FormProgressChip;
