import Button from "./Button";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";

type LogoutButtonProps = {
  onClick: () => void;
};

const LogoutButton = ({ onClick }: LogoutButtonProps) => (
  <Button
    variant="outlined"
    color="error"
    startIcon={<icons.headerLogout />}
    onClick={onClick}
  >
    {STRINGS.APP_HEADER.LOGOUT_LABEL}
  </Button>
);

export default LogoutButton;
