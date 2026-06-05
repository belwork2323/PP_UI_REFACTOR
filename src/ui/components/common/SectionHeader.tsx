// src/components/common/SectionHeader.jsx
import { ReactNode } from 'react';
import { Stack, Typography, IconButton, SxProps, Theme } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';

interface SectionHeaderProps {
  title: ReactNode;
  titleSx?: SxProps<Theme> | object;
  meta?: ReactNode;
  showMore?: boolean;
  onMoreClick?: () => void;
  sx?: SxProps<Theme> | object;
}

function SectionHeader({
  title,
  titleSx,
  meta,
  showMore = false,
  onMoreClick,
  sx = {},
}: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems={meta ? 'flex-start' : 'center'}
      sx={{ mb: meta ? 1 : 1.5, ...sx }}
    >
      <div>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={titleSx}>
          {title}
        </Typography>
        {meta}
      </div>

      {showMore && (
        <IconButton size="small" onClick={onMoreClick}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  meta: PropTypes.node,
  showMore: PropTypes.bool,
  onMoreClick: PropTypes.func,
  sx: PropTypes.object,
};

SectionHeader.defaultProps = {
  showMore: false,
};

export default SectionHeader;