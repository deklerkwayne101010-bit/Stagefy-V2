// Toast notifications system
// Simple toast implementation without external dependencies

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

let toastContainer: HTMLDivElement | null = null;
let toasts: Toast[] = [];
let listeners: (() => void)[] = [];

function createContainer() {
  if (typeof window === 'undefined') return;

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
      width: 100%;
    `;
    document.body.appendChild(toastContainer);
  }
}

function render() {
  if (!toastContainer) return;

  const container = toastContainer;
  container.innerHTML = '';

  toasts.forEach(toast => {
    const el = document.createElement('div');
    const colors = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white',
      warning: 'bg-yellow-500 text-white',
    };

    el.className = `px-4 py-3 rounded-lg shadow-lg ${colors[toast.type]} flex items-center justify-between gap-3`;
    el.innerHTML = `
      <span>${toast.message}</span>
      <button onclick="window.removeToast(${toast.id})" class="text-white hover:text-gray-200">
        ✕
      </button>
    `;

    container.appendChild(el);
  });
}

function addToast(type: ToastType, message: string, duration = 5000) {
  const id = Date.now();
  toasts.push({ id, type, message, duration });

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }

  createContainer();
  render();
  listeners.forEach(l => l());
}

function removeToast(id: number) {
  toasts = toasts.filter(t => t.id !== id);
  render();
  listeners.forEach(l => l());
}

// Expose to window for inline onclick handlers
if (typeof window !== 'undefined') {
  (window as any).removeToast = removeToast;
}

// Export utility functions
export const showToast = {
  success: (message: string, duration?: number) =>
    addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    addToast('error', message, duration),
  info: (message: string, duration?: number) =>
    addToast('info', message, duration),
  warning: (message: string, duration?: number) =>
    addToast('warning', message, duration),
};

export { showToast };
