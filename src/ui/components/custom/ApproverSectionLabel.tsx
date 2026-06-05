import { Box, Stack, Typography } from "@mui/material";

import {
  approverTypography,
  getApproverBrand,
  type ApproverDepartmentKey,
} from "../../../app/theme/approver";

type ApproverSectionLabelProps = {
  department: ApproverDepartmentKey;
  label: string;
};

const ApproverSectionLabel = ({
  department,
  label,
}: ApproverSectionLabelProps) => {
  const brand = getApproverBrand(department);

  return (
    <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          ...approverTypography.overline,
          color: brand.textSub,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 1, background: brand.border }} />
    </Stack>
  );
};

export default ApproverSectionLabel;
