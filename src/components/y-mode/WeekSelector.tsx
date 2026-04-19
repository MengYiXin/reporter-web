import { useAppStore } from '../../store/useAppStore';
import { formatWeekLabel } from '../../utils/date';

export function WeekSelector() {
  const currentWeekStart = useAppStore((state) => state.currentWeekStart);
  const selectWeek = useAppStore((state) => state.selectWeek);

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    selectWeek(prevWeek.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    selectWeek(nextWeek.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrevWeek}
        className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#888] rounded hover:text-white"
      >
        ◀
      </button>
      <span className="text-sm text-white font-medium">{formatWeekLabel(currentWeekStart)}</span>
      <button
        onClick={handleNextWeek}
        className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#888] rounded hover:text-white"
      >
        ▶
      </button>
    </div>
  );
}
