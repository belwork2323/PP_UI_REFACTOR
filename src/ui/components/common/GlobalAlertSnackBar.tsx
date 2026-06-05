// src/components/common/GlobalAlert.jsx
import React from 'react';
import { Snackbar, Alert, Box, Slide } from '@mui/material';

const GlobalAlert = ({ open, message, severity, onClose, customPosition = false }) => {
  const alertContent = (
    <Alert 
      onClose={onClose} 
      severity={severity} 
      variant="filled" 
      elevation={6}
      sx={{ width: '100%', minWidth: '300px' }}
    >
      {message}
    </Alert>
  );

  // If customPosition is true, we don't use the Snackbar's fixed positioning
  // This allows it to "sit" on top of the Login Card
  if (customPosition) {
    return (
      <Box sx={{ 
        position: 'absolute', 
        top: -60, // Adjust based on your design
        left: 0, 
        right: 0, 
        zIndex: 10,
        display: open ? 'block' : 'none' 
      }}>
        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
          {alertContent}
        </Slide>
      </Box>
    );
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {alertContent}
    </Snackbar>
  );
};

export default GlobalAlert;