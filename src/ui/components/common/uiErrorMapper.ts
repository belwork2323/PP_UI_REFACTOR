import { HTTP_STATUS } from "../../../app/config/constants";
import { STRINGS } from "../../../app/config/strings";

export function mapUiError(error) {
  switch (error.status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return STRINGS.SYSTEM.SESSION_EXPIRED;

    case HTTP_STATUS.FORBIDDEN:
      return STRINGS.SYSTEM.ACCESS_DENIED;

    case HTTP_STATUS.NOT_FOUND:
      return STRINGS.SYSTEM.RESOURCE_NOT_FOUND;

    default:
      return error.message || STRINGS.SYSTEM.UNKNOWN_ERROR;
  }
}
