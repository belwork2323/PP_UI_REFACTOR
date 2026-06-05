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
};

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

const base64ToBlobUrl = (base64: string) => {
  const normalizedBase64 = base64.includes(",") ? base64.split(",").pop() ?? "" : base64;
  const binary = window.atob(normalizedBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
};

export const useApproverFormPdf = ({ department, formId, open, subDepartment }: UseApproverFormPdfArgs) => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfData, setPdfData] = useState<ApproverFormPdfData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const selectedSubDepartment = useMemo(() => {
    const deptSlug = DEPARTMENT_SLUGS[department];

    return (
      user?.allSubDepartments.find(
        (item) => item.slugs?.dept === deptSlug && item.slugs?.subDept === subDepartment,
      ) ?? null
    );
  }, [department, subDepartment, user]);

  const revokeBlobUrl = () => {
    if (blobUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    blobUrlRef.current = null;
  };

  useEffect(() => () => {
    revokeBlobUrl();
  }, []);

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

      if (!selectedSubDepartment?.subDepartmentId) {
        showAlert(STRINGS.APPROVER.PDF.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
        return;
      }

      setLoading(true);

      const response = await getApproverFormPdf({
        download: false,
        formId,
        subDepartmentId: selectedSubDepartment.subDepartmentId,
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
  }, [formId, open, selectedSubDepartment?.subDepartmentId, showAlert]);

  const downloadPdf = async () => {
    if (!formId) {
      showAlert(STRINGS.APPROVER.PDF.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!selectedSubDepartment?.subDepartmentId) {
      showAlert(STRINGS.APPROVER.PDF.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    setDownloading(true);
    showAlert(STRINGS.APPROVER.PDF.DOWNLOAD_LOADING, "info", { loading: true });

    const response = await getApproverFormPdf({
      download: true,
      formId,
      subDepartmentId: selectedSubDepartment.subDepartmentId,
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

    showAlert(response.message || STRINGS.APPROVER.PDF.DOWNLOAD_LABEL, "success", { autoCloseMs: 2000 });
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