import { useMemo } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import {
  getDocumentAttachmentListTheme,
  type DocumentAttachmentListPalette,
} from "@app/theme/custom_themes/shared/documentAttachmentList_theme";

type SxObject = Record<string, unknown>;

export type DocumentAttachment = {
  key: string;
  fileName: string;
  typeValue: string;
  isVideo: boolean;
  /** Opens a stored file (preview / download); takes precedence over `url`. */
  onOpen?: () => void;
  url?: string;
};

type DocumentAttachmentListProps = {
  items: DocumentAttachment[];
  palette: DocumentAttachmentListPalette;
  typeLabel: string;
  viewLabel?: string;
  downloadLabel?: string;
  rowSx?: SxObject;
  linkSx?: SxObject;
};

/** Read-only list of attached documents with view / download links. */
const DocumentAttachmentList = ({
  items,
  palette,
  typeLabel,
  viewLabel = "View",
  downloadLabel = "Download",
  rowSx,
  linkSx,
}: DocumentAttachmentListProps) => {
  const styles = useMemo(() => getDocumentAttachmentListTheme(palette), [palette]);
  const resolvedLinkSx = linkSx ?? styles.link;

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Box key={item.key} sx={rowSx ?? styles.row}>
          <InsertDriveFileOutlinedIcon sx={styles.fileIcon} />
          <Box flex={1} minWidth={0}>
            <Typography sx={styles.fileName} title={item.fileName}>
              {item.fileName}
            </Typography>
            <Typography sx={styles.typeLine}>
              <Box component="span" sx={styles.typeLabel}>
                {typeLabel}:
              </Box>{" "}
              {item.typeValue}
            </Typography>
          </Box>
          {item.onOpen ? (
            <Link component="button" type="button" onClick={item.onOpen} sx={resolvedLinkSx}>
              {item.isVideo ? downloadLabel : viewLabel}
              <OpenInNewRoundedIcon sx={styles.linkIcon} />
            </Link>
          ) : item.url ? (
            <Link href={item.url} target="_blank" rel="noopener noreferrer" sx={resolvedLinkSx}>
              {viewLabel}
              <OpenInNewRoundedIcon sx={styles.linkIcon} />
            </Link>
          ) : null}
        </Box>
      ))}
    </Stack>
  );
};

export default DocumentAttachmentList;
