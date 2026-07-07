import Alert from "@mui/material/Alert";
import { mapUiError } from "./uiErrorMapper";

export default function ErrorMessage({ error }) {
  if (!error) return null;

  return <Alert severity="error">{mapUiError(error)}</Alert>;
}
