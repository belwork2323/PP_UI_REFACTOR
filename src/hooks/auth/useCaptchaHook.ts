import { useCallback, useEffect, useRef, useState } from "react";
import { STRINGS } from "../../app/config/strings";
import { fetchCaptchaController } from "../../controllers/auth/captchaController";

type CaptchaData = {
  captchaId: string;
  imageUrl: string;
  expiresIn: string | null;
};

type UseCaptchaHookParams = {
  onChange?: (value: string, isValid: boolean) => void;
  onCaptchaId?: (captchaId: string) => void;
  reloadKey?: number;
  error?: boolean;
  helperText?: string;
};

const S = STRINGS.CAPTCHA;

export const useCaptchaHook = ({
  onChange,
  onCaptchaId,
  reloadKey = 0,
  error = false,
  helperText = "",
}: UseCaptchaHookParams) => {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const onCaptchaIdRef = useRef(onCaptchaId);
  const onChangeRef = useRef(onChange);
  /** Ignore stale generate-captcha responses (StrictMode double-mount / fast reload). */
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    onCaptchaIdRef.current = onCaptchaId;
  }, [onCaptchaId]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setFetchErr(null);
    setValue("");
    setTouched(false);
    // Keep parent captchaId until the new one arrives; clear value/validity now.
    onChangeRef.current?.("", false);

    const response = await fetchCaptchaController();

    // A newer load() started — drop this result.
    if (generation !== loadGenerationRef.current) {
      return;
    }

    if (response.success && response.data) {
      setCaptcha(response.data);
      onCaptchaIdRef.current?.(response.data.captchaId);
      onChangeRef.current?.("", false);
    } else {
      console.error(S.CONSOLE_ERR, response.message);
      setFetchErr(S.FAILED_TO_LOAD);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const handleInputChange = useCallback((nextValue: string) => {
    setValue(nextValue);
    setTouched(true);

    const isValid = nextValue.trim().length === 6;
    onChangeRef.current?.(nextValue, isValid);
  }, []);

  const markTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const internalShowSuccess = touched && value.trim().length === 6;
  const resolvedError = error;

  const resolvedHelperText =
    error && helperText
      ? helperText
      : internalShowSuccess
        ? S.HELPER_ENTERED
        : touched && !value
          ? S.HELPER_EMPTY
          : S.HELPER_PLACEHOLDER;

  const resolvedHelperColor = resolvedError
    ? "error.main"
    : internalShowSuccess
      ? "success.main"
      : "text.secondary";

  const focusBorderColor = resolvedError
    ? "error.main"
    : internalShowSuccess
      ? "success.main"
      : "primary.main";

  return {
    captcha,
    loading,
    fetchErr,
    value,
    internalShowSuccess,
    resolvedError,
    resolvedHelperText,
    resolvedHelperColor,
    focusBorderColor,
    load,
    handleInputChange,
    markTouched,
  };
};
