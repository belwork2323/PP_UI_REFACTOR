import React from "react";
import { Button } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";

const LogoutButton = ({ onClick }) => {
  return (
    <Button variant="outlined" color="error" startIcon={<LoginIcon />} onClick={onClick}>
      Logout
    </Button>
  );
};

export default LogoutButton;
