import { Switch, Tooltip } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import { masterDataActiveSwitchSx } from "./masterDataStatusStyles";

const S = STRINGS.MASTER_DATA;

export { masterDataActiveSwitchSx } from "./masterDataStatusStyles";

type Props = {
  isActive: boolean;
  disabled?: boolean;
  onToggle: (nextActive: boolean) => void;
};

const MasterDataActiveSwitch = ({ isActive, disabled = false, onToggle }: Props) => (
  <Tooltip title={isActive ? S.TABLE.DISABLE : S.TABLE.ENABLE}>
    <Switch
      size="small"
      checked={isActive}
      disabled={disabled}
      onChange={(e) => onToggle(e.target.checked)}
      sx={masterDataActiveSwitchSx(isActive)}
    />
  </Tooltip>
);

export default MasterDataActiveSwitch;
