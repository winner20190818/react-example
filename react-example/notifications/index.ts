type Level = "success" | "error" | "info" | "warn";

type ToastOptions = {
  level?: Level;
  content?: string;
  keepSecond?: number;
};

interface Toast {
  (title: string, options?: ToastOptions): Promise<void>;
}

let toastInstance: Toast | undefined;

export function toast(title: string, options?: ToastOptions) {
  if (toastInstance) {
    return toastInstance(title, options);
  }
  console.error("Toast instance does not exist");
}

export const init = {
  toast(t: Toast) {
    toastInstance = t;
  },
};
