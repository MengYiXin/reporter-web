import { COLORS } from '../../constants/theme';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'calendar' | 'table';
  rows?: number;
}

export function SkeletonLoader({ type = 'card', rows = 3 }: SkeletonLoaderProps) {
  const baseClass = 'animate-pulse rounded';

  if (type === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-4`}
            style={{
              width: `${Math.random() * 40 + 60}%`,
              backgroundColor: COLORS.primary,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'calendar') {
    return (
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-24`}
            style={{ backgroundColor: COLORS.card }}
          />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-12`}
            style={{ backgroundColor: COLORS.card }}
          />
        ))}
      </div>
    );
  }

  // Default card
  return (
    <div
      className={`${baseClass} h-48`}
      style={{ backgroundColor: COLORS.card }}
    />
  );
}

export function LoadingOverlay({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#111111] rounded-2xl p-8 border border-[#2a2a2a] text-center">
        <div className="animate-spin w-10 h-10 border-4 border-[#3b82f6] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[#888] text-sm">{message}</p>
      </div>
    </div>
  );
}
