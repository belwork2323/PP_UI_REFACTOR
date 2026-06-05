import { ReactNode } from 'react';
import { Card as MuiCard, CardContent, SxProps, Theme } from '@mui/material';
import PropTypes from 'prop-types';

interface CardProps {
  children: ReactNode;
  sx?: SxProps<Theme> | object;
  contentSx?: SxProps<Theme> | object;
  noContentPadding?: boolean;
  disableContent?: boolean;
  [key: string]: any;
}

function Card({
  children,
  sx = {},
  contentSx = {},
  noContentPadding = false,
  disableContent = false,
  ...rest
}: CardProps) {
  return (
    <MuiCard
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        ...sx,
      }}
      {...rest}
    >
      {disableContent ? (
        children
      ) : (
        <CardContent
          sx={{
            p: noContentPadding ? 0 : '20px !important',
            ...contentSx,
          }}
        >
          {children}
        </CardContent>
      )}
    </MuiCard>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
  contentSx: PropTypes.object,
  noContentPadding: PropTypes.bool,
  disableContent: PropTypes.bool,
};

export default Card;