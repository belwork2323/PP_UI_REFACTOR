import { useMemo } from "react";
import { Box, Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { icons } from "@app/theme/icons";
import { useAuthStore } from "@app/store/authStore";
import type { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import {
  resolveLotCertificateDisplayFileName,
  type LotCertificate,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import DocumentAttachmentList from "@ui/components/custom/DocumentAttachmentList";
import { toLotCertificateAttachments } from "./lotCertificateAttachments";

const BL = STRINGS.SOURCING.BATCH_LIST;
const SF = STRINGS.SOURCING.SPECIFICATION_FORM;
const { insertDriveFile: InsertDriveFileOutlinedIcon } = icons.user.sourcing.rawMaterialBatchList;

type LotDetailsCertificatesSectionProps = {
  certificates?: LotCertificate[];
  theme: ReturnType<typeof getRawMaterialSourcingPageTheme>;
  openFile: (fileId: string, subDepartmentId: number, fileName?: string) => unknown;
};

const LotDetailsCertificatesSection = ({
  certificates,
  theme,
  openFile,
}: LotDetailsCertificatesSectionProps) => {
  const rmTheme = theme.sourcing.rawMaterial.lotDetails;
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId,
  );

  const attachments = useMemo(
    () =>
      toLotCertificateAttachments(certificates ?? [], {
        subDepartmentId,
        openFile,
        resolveFileName: resolveLotCertificateDisplayFileName,
      }),
    [certificates, subDepartmentId, openFile],
  );

  return (
    <Box sx={{ ...rmTheme.section, mb: 0 }}>
      <Typography sx={rmTheme.sectionTitle}>
        <InsertDriveFileOutlinedIcon sx={rmTheme.sectionTitleIcon} />
        {BL.LOT_DETAILS_CERTIFICATES_SECTION}
      </Typography>
      {attachments.length ? (
        <DocumentAttachmentList
          items={attachments}
          palette={theme.palette}
          typeLabel={SF.CERT_TYPE}
          viewLabel={SF.OPEN_CERT_LINK}
          rowSx={rmTheme.certRow}
          linkSx={rmTheme.certLink}
        />
      ) : (
        <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_NO_CERTIFICATES}</Typography>
      )}
    </Box>
  );
};

export default LotDetailsCertificatesSection;
