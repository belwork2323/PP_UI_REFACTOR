// src/components/common/FullPageLoader.jsx
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

const FullPageLoader = ({ open, message = "Processing..." }) => (
  <Backdrop
    sx={{ 
      color: '#fff', 
      zIndex: (theme) => theme.zIndex.drawer + 999, // Above everything
      flexDirection: 'column',
      backdropFilter: 'blur(4px)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)'
    }}
    open={open}
  >
    <CircularProgress color="inherit" size={60} thickness={4} />
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 500 }}>{message}</Typography>
    </Box>
  </Backdrop>
);

export default FullPageLoader;