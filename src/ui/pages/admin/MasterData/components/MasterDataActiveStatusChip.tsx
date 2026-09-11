import { Chip } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import { masterDataActiveStatusChipSx } from "./masterDataStatusStyles";

const S = STRINGS.MASTER_DATA;

type Props = {
  isActive: boolean;
};

const MasterDataActiveStatusChip = ({ isActive }: Props) => (
  <Chip
    size="small"
    label={isActive ? S.TABLE.YES : S.TABLE.NO}
    sx={masterDataActiveStatusChipSx(isActive)}
  />
);

export default MasterDataActiveStatusChip;
