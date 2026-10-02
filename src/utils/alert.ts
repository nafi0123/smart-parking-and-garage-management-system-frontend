import Swal from 'sweetalert2';

export const Alert = {
  // Confirmation Dialog
  confirm: async ({
    title = 'Are you sure?',
    text = 'Do you want to proceed with this action?',
    confirmButtonText = 'Yes, Proceed',
    cancelButtonText = 'Cancel',
    icon = 'warning',
    isDestructive = false,
  }: {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    isDestructive?: boolean;
  }): Promise<boolean> => {
    const isDark =
      typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
      background: isDark ? '#121b2e' : '#ffffff',
      color: isDark ? '#eaf0fb' : '#101828',
      confirmButtonColor: isDestructive ? '#ef4444' : '#1e40af',
      cancelButtonColor: isDark ? '#334155' : '#94a3b8',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl',
        title: 'text-lg font-bold',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-xs shadow-md',
        cancelButton: 'rounded-xl px-5 py-2.5 font-bold text-xs',
      },
    });

    return result.isConfirmed;
  },

  // Success Notification / Toast
  success: (title: string, text?: string) => {
    const isDark =
      typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    return Swal.fire({
      title,
      text,
      icon: 'success',
      timer: 2200,
      showConfirmButton: false,
      background: isDark ? '#121b2e' : '#ffffff',
      color: isDark ? '#eaf0fb' : '#101828',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold',
      },
    });
  },

  // Error Alert
  error: (title: string, text?: string) => {
    const isDark =
      typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#1e40af',
      background: isDark ? '#121b2e' : '#ffffff',
      color: isDark ? '#eaf0fb' : '#101828',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-xs',
      },
    });
  },

  // Info Alert
  info: (title: string, text?: string) => {
    const isDark =
      typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    return Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#1e40af',
      background: isDark ? '#121b2e' : '#ffffff',
      color: isDark ? '#eaf0fb' : '#101828',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl',
        title: 'text-base font-bold',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-xs',
      },
    });
  },

  // Toast Notification
  toast: (title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const isDark =
      typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      background: isDark ? '#121b2e' : '#ffffff',
      color: isDark ? '#eaf0fb' : '#101828',
    });

    return Toast.fire({
      icon,
      title,
    });
  },

  // Quick Toast Helpers
  toastSuccess: (title: string) => {
    return Alert.toast(title, 'success');
  },

  toastError: (title: string) => {
    return Alert.toast(title, 'error');
  },
};

export default Alert;
