import React from "react";
import { Button } from "@mui/material";
import { icons } from "../../../app/theme"; // Optional if you want to use an icon
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

const TrackerButton = ({ onClick }) => {
  return (
    <Button variant="contained" color="primary" startIcon={<RocketLaunchIcon />} onClick={onClick}>
      Tracker
    </Button>
  );
};

export default TrackerButton;
