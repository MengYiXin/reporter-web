import { useToastStore } from '../../store/useToastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-all animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-[#22c55e] text-white'
              : toast.type === 'error'
              ? 'bg-[#ef4444] text-white'
              : 'bg-[#3b82f6] text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
