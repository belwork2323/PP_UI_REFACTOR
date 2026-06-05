import { IconButton, Tooltip, alpha } from "@mui/material";
import { icons } from "../../../app/theme/icons";

const { delete: DeleteOutlineRoundedIcon } =
  icons.user.manufacturing.rawMaterial.solidPreparation;

type Props = {
  onClick: () => void;
  dangerColor: string;
  tooltip: string;
};

const RemoveProcessButton = ({ onClick, dangerColor, tooltip }: Props) => {
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{ color: dangerColor, "&:hover": { background: alpha(dangerColor, 0.08) } }}
      >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 20, color: "inherit" }} />
      </IconButton>
    </Tooltip>
  );
};

export default RemoveProcessButton;
