// src/components/common/ProgressBar.jsx
import { LinearProgress, Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

function ProgressBar({
  value,
  color,
  trackColor,
  valueColor,       // ← explicit colour for the "72%" text, passed from theme
  height    = 6,
  showValue = true,
  sx = {},
}) {
  return (
    <Box sx={sx}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height,
          borderRadius: height / 2,
          bgcolor: trackColor || 'action.hover',
          '& .MuiLinearProgress-bar': {
            bgcolor:      color || 'primary.main',
            borderRadius: height / 2,
          },
        }}
      />
      {showValue && (
        <Typography
          variant="caption"
          sx={{
            mt:      0.5,
            display: 'block',
            // Use explicit valueColor from theme when provided;
            // fall back to the MUI theme-aware token.
            color: valueColor || 'text.secondary',
          }}
        >
          {value}%
        </Typography>
      )}
    </Box>
  );
}

ProgressBar.propTypes = {
  value:      PropTypes.number.isRequired,
  color:      PropTypes.string,
  trackColor: PropTypes.string,
  valueColor: PropTypes.string,
  height:     PropTypes.number,
  showValue:  PropTypes.bool,
  sx:         PropTypes.object,
};

ProgressBar.defaultProps = { height: 6, showValue: true };

export default ProgressBar;