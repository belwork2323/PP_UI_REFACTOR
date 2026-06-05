import React from "react";
import { Avatar, Tooltip } from "@mui/material";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const stringToColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#1565c0", "#7c3aed", "#0369a1", "#b45309", "#047857"];
  return colors[Math.abs(hash) % colors.length];
};

const UserAvatar = ({ name, size = 34, tooltip = true, ...props }) => {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  const avatar = (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: `${size * 0.4}px`,
        bgcolor: bgColor,
        fontWeight: 600,
        ...props.sx,
      }}
      {...props}
    >
      {initials}
    </Avatar>
  );

  return tooltip ? <Tooltip title={name}>{avatar}</Tooltip> : avatar;
};

export default UserAvatar;