import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast, ToastType } from "@/components/toast";

interface ToastData {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (data: ToastData) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState<ToastData>({
    type: "info",
    title: "",
  });

  const showToast = useCallback((data: ToastData) => {
    setToastData(data);
    setVisible(true);
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: "success", title, message, duration: 3000 });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: "error", title, message, duration: 4000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: "warning", title, message, duration: 3500 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: "info", title, message, duration: 3000 });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Toast
        visible={visible}
        type={toastData.type}
        title={toastData.title}
        message={toastData.message}
        duration={toastData.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
