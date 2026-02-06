// Client-only toast helper — dynamically imports `sonner` at call time
// Keeps `sonner` out of server bundles by avoiding static imports.
type ToastModule = {
  success?: (msg: any, opts?: any) => void;
  error?: (msg: any, opts?: any) => void;
  info?: (msg: any, opts?: any) => void;
  custom?: (...args: any[]) => any;
  loading?: (...args: any[]) => any;
  dismiss?: (...args: any[]) => any;
};

let _toast: ToastModule | null = null;

async function getToast(): Promise<ToastModule | null> {
  if (typeof window === "undefined") return null;
  if (_toast) return _toast;
  try {
    const mod = await import("sonner");
    _toast = (mod as any).toast ?? (mod as any);
    return _toast;
  } catch (e) {
    // fail silently on server or if import fails
    return null;
  }
}

export function toastSuccess(message: any, opts?: any) {
  void getToast().then((t) => t?.success?.(message, opts)).catch(() => {});
}

export function toastError(message: any, opts?: any) {
  void getToast().then((t) => t?.error?.(message, opts)).catch(() => {});
}

export function toastInfo(message: any, opts?: any) {
  void getToast().then((t) => t?.info?.(message, opts)).catch(() => {});
}

export function toastCustom(...args: any[]) {
  void getToast().then((t) => t?.custom?.(...args)).catch(() => {});
}

export function toastLoading(...args: any[]) {
  void getToast().then((t) => t?.loading?.(...args)).catch(() => {});
}

export function toastDismiss(...args: any[]) {
  void getToast().then((t) => t?.dismiss?.(...args)).catch(() => {});
}

export default {
  success: toastSuccess,
  error: toastError,
  info: toastInfo,
  custom: toastCustom,
  loading: toastLoading,
  dismiss: toastDismiss,
};
