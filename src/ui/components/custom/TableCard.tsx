// src/components/custom/TableCard.jsx
import { ReactNode } from 'react';
import { CardContent, Table, SxProps, Theme } from '@mui/material';
import PropTypes from 'prop-types';

import Card from '../common/Card';
import SectionHeader from '../common/SectionHeader';

interface TableCardProps {
  title: ReactNode;
  titleSx?: SxProps<Theme> | object;
  meta?: ReactNode;
  showMore?: boolean;
  onMoreClick?: () => void;
  tableProps?: any;
  children: ReactNode;
  cardSx?: SxProps<Theme> | object;
  contentSx?: SxProps<Theme> | object;
  noPadding?: boolean;
  filterPanel?: ReactNode;
}

function TableCard({
  title,
  titleSx,
  meta,
  showMore = false,
  onMoreClick,
  tableProps,
  children,
  cardSx,
  contentSx,
  noPadding = false,
  filterPanel,
}: TableCardProps) {
  return (
    <Card sx={cardSx} contentSx={contentSx} noContentPadding={noPadding}>
      <CardContent sx={{ p: noPadding ? 0 : '20px !important' }}>
        <SectionHeader
          title={title}
          titleSx={titleSx}
          meta={meta}
          showMore={showMore}
          onMoreClick={onMoreClick}
        />

        {filterPanel}

        <Table size="small" {...tableProps}>
          {children}
        </Table>
      </CardContent>
    </Card>
  );
}

TableCard.propTypes = {
  title: PropTypes.string.isRequired,
  meta: PropTypes.node,
  showMore: PropTypes.bool,
  onMoreClick: PropTypes.func,
  tableProps: PropTypes.object,
  children: PropTypes.node.isRequired,
  cardSx: PropTypes.object,
  contentSx: PropTypes.object,
  noPadding: PropTypes.bool,
  filterPanel: PropTypes.node,
};

TableCard.defaultProps = {
  showMore: false,
  noPadding: false,
};

export default TableCard;