import { useEffect, useMemo, useRef, useState } from "react";

import { STRINGS } from "../../app/config/strings";
import { useAlertStore } from "../../app/store/alertStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverFormPdf } from "../../controllers/approver/approverController";

type ApproverFormPdfData = {
  formId?: string;
  subDepartmentId?: number;
  fileName?: string;
  fileUrl?: string;
  base64?: string;
  fileSizeBytes?: number;
  pageCount?: number;
  generatedAt?: string;
};

type UseApproverFormPdfArgs = {
  department: ApproverDepartmentKey;
  formId?: string | null;
  open: boolean;
  subDepartment: string;
  /** Explicit ID (e.g. from form details). Preferred when the logged-in user is Admin/not assigned to the sub-dept. */
  subDepartmentId?: number | null;
};

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

/**
 * Known sub-department IDs when the logged-in user (Admin / Centre Head / SM)
 * is not assigned to that sub-dept and `allSubDepartments` cannot resolve it.
 * Must stay aligned with backend BatchFormResolver / stage IDs.
 */
const FALLBACK_SUB_DEPARTMENT_IDS: Record<string, number> = {
  "raw-material": 1,
  "rocket-motor": 2,
  "raw-material-prep": 3,
  "case-preparation": 4,
  mixing: 5,
  "casting-and-curing": 6,
  "post-cure-operations": 7,
  subscale: 8,
  trimming: 9,
  ndt: 10,
  "qc-division": 11,
  "static-test-facility": 12,
  dispatch: 13,
};

const base64ToBlobUrl = (base64: string) => {
  const normalizedBase64 = base64.includes(",") ? (base64.split(",").pop() ?? "") : base64;
  const binary = window.atob(normalizedBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
};

export const useApproverFormPdf = ({
  department,
  formId,
  open,
  subDepartment,
  subDepartmentId: subDepartmentIdOverride,
}: UseApproverFormPdfArgs) => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfData, setPdfData] = useState<ApproverFormPdfData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const resolvedSubDepartmentId = useMemo(() => {
    const override = Number(subDepartmentIdOverride);
    if (Number.isFinite(override) && override > 0) {
      return override;
    }

    const deptSlug = DEPARTMENT_SLUGS[department];
    const list = user?.allSubDepartments ?? [];

    const exact = list.find(
      (item) => item.slugs?.dept === deptSlug && item.slugs?.subDept === subDepartment,
    );
    if (exact?.subDepartmentId) {
      return Number(exact.subDepartmentId);
    }

    // Admin / cross-role: match by sub-dept slug alone
    const bySubDept = list.find((item) => item.slugs?.subDept === subDepartment);
    if (bySubDept?.subDepartmentId) {
      return Number(bySubDept.subDepartmentId);
    }

    const fallback = FALLBACK_SUB_DEPARTMENT_IDS[subDepartment];
    if (fallback) return fallback;

    return null;
  }, [department, subDepartment, subDepartmentIdOverride, user]);

  const revokeBlobUrl = () => {
    if (blobUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    blobUrlRef.current = null;
  };

  useEffect(
    () => () => {
      revokeBlobUrl();
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      if (!open) {
        revokeBlobUrl();
        setPdfData(null);
        setPdfUrl(null);
        setLoading(false);
        return;
      }
      if (!formId) {
        showAlert(STRINGS.APPROVER.PDF.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
        return;
      }

      if (!resolvedSubDepartmentId) {
        showAlert(STRINGS.APPROVER.PDF.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
        return;
      }

      setLoading(true);

      const response = await getApproverFormPdf({
        download: false,
        formId,
        subDepartmentId: resolvedSubDepartmentId,
      });

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (!response.success || !response.data) {
        setPdfData(null);
        revokeBlobUrl();
        setPdfUrl(null);
        showAlert(response.message || STRINGS.APPROVER.PDF.FAILED, "error", { autoCloseMs: 3500 });
        return;
      }

      const data = response.data as ApproverFormPdfData;
      setPdfData(data);

      revokeBlobUrl();

      if (data.base64) {
        const nextBlobUrl = base64ToBlobUrl(data.base64);
        blobUrlRef.current = nextBlobUrl;
        setPdfUrl(nextBlobUrl);
        return;
      }

      if (data.fileUrl) {
        setPdfUrl(data.fileUrl);
        return;
      }

      setPdfUrl(null);
      showAlert(STRINGS.APPROVER.PDF.FAILED, "error", { autoCloseMs: 3500 });
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [formId, open, resolvedSubDepartmentId, showAlert]);

  const downloadPdf = async () => {
    if (!formId) {
      showAlert(STRINGS.APPROVER.PDF.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!resolvedSubDepartmentId) {
      showAlert(STRINGS.APPROVER.PDF.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    setDownloading(true);
    showAlert(STRINGS.APPROVER.PDF.DOWNLOAD_LOADING, "info", { loading: true });

    const response = await getApproverFormPdf({
      download: true,
      formId,
      subDepartmentId: resolvedSubDepartmentId,
    });

    setDownloading(false);

    if (!response.success || !response.data) {
      showAlert(response.message || STRINGS.APPROVER.PDF.FAILED, "error", { autoCloseMs: 3500 });
      return;
    }

    const data = response.data as ApproverFormPdfData;
    const href = data.base64 ? base64ToBlobUrl(data.base64) : data.fileUrl;

    if (!href) {
      showAlert(STRINGS.APPROVER.PDF.FAILED, "error", { autoCloseMs: 3500 });
      return;
    }

    const link = document.createElement("a");
    link.href = href;
    link.download = data.fileName || `${formId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (data.base64) {
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    }

    showAlert(response.message || STRINGS.APPROVER.PDF.DOWNLOAD_LABEL, "success", {
      autoCloseMs: 2000,
    });
  };

  return {
    downloadPdf,
    downloading,
    loading,
    pdfData,
    pdfUrl,
  };
};

export default useApproverFormPdf;
