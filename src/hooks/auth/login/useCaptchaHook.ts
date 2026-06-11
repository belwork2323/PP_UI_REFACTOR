import { useState, useEffect, useCallback } from "react";
import { authLoginController } from "@controllers/auth/login/loginController";
import { STRINGS } from "@app/config/strings";
import type { CaptchaModel } from "@data/models/auth/login/CaptchaModel";

const S = STRINGS.CAPTCHA;

export type CaptchaValidationResult = {
  valid: boolean;
  error: string;
};

export function useCaptchaHook() {
  const [captcha, setCaptcha] = useState<CaptchaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [valid, setValid] = useState(false);
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    setValue("");
    setTouched(false);
    setValid(false);
    setCaptchaId(null);

    const response = await authLoginController.fetchCaptcha();
    if (response.success && response.data) {
      setCaptcha(response.data);
      setCaptchaId(response.data.captchaId);
    } else {
      console.error(S.CONSOLE_ERR, response.message);
      setFetchErr(S.FAILED_TO_LOAD);
      setCaptcha(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload, reloadTrigger]);

  const handleInputChange = useCallback((nextValue: string) => {
    setValue(nextValue);
    setTouched(true);
    setValid(nextValue.trim().length > 0);
  }, []);

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const resetOnFailure = useCallback(() => {
    setValue("");
    setValid(false);
    setCaptchaId(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  const validate = useCallback((): CaptchaValidationResult => {
    const V = STRINGS.AUTH.VALIDATION;
    if (!value.trim()) {
      return { valid: false, error: V.CAPTCHA_REQUIRED };
    }
    if (!captchaId || String(captchaId).trim().length === 0) {
      return { valid: false, error: V.CAPTCHA_INVALID };
    }
    if (!valid) {
      return { valid: false, error: V.CAPTCHA_INVALID };
    }
    return { valid: true, error: "" };
  }, [value, captchaId, valid]);

  const idValid = captchaId != null && String(captchaId).trim().length > 0;
  const filled = value.trim().length > 0;
  const ready = idValid && filled;

  return {
    captcha,
    loading,
    fetchErr,
    value,
    valid,
    captchaId,
    touched,
    idValid,
    filled,
    ready,
    reload,
    handleInputChange,
    handleBlur,
    resetOnFailure,
    validate,
  };
}
