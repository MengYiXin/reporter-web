import { useAppStore } from '../../store/useAppStore';
import { getWeeks, formatDateDisplay, formatWeekLabel } from '../../utils/date';
import { useMobile } from '../../hooks/useMobile';

interface WeekCalendarProps {
  onDayClick?: () => void;
}

export function WeekCalendar({ onDayClick }: WeekCalendarProps) {
  const isMobile = useMobile();
  const weeks = getWeeks();
  const allData = useAppStore((state) => state.allData);
  const selectedDay = useAppStore((state) => state.selectedDay);
  const setSelectedDay = useAppStore((state) => state.setSelectedDay);
  const setCurrentWeekStart = useAppStore((state) => state.setCurrentWeekStart);

  const handleDayClick = (date: string, weekStart: string) => {
    setSelectedDay(date);
    setCurrentWeekStart(weekStart);
    onDayClick?.();
  };

  return (
    <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
      <div className="space-y-4">
        {weeks.map((week, weekIdx) => {
          const isCurrentWeek = weekIdx === 1;
          const weekData = allData[week.weekStart] || week.days;
          return (
            <div key={week.weekStart}>
              <div className={`text-xs font-medium mb-2 ${isCurrentWeek ? 'text-[#3b82f6]' : 'text-[#666666]'}`}>
                {week.label} · {formatWeekLabel(week.weekStart)}
              </div>
              <div className={`grid gap-2 sm:gap-3 ${isMobile ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-5'}`}>
                {weekData.map((day) => (
                  <div
                    key={day.date}
                    onClick={() => handleDayClick(day.date, week.weekStart)}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer text-xs ${
                      selectedDay === day.date
                        ? 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111111]'
                        : day.optimizedContent.trim()
                        ? 'bg-[#0d2a1a] text-[#22c55e] border-2 border-[#22c55e]'
                        : day.content.trim()
                        ? 'bg-[#1a2618] text-[#4ade80] border border-[#22c55e]/30'
                        : 'bg-[#161616] text-[#666666] hover:bg-[#1c1c1c]'
                    }`}
                  >
                    <div className="text-xs font-medium opacity-60">{day.dayName}</div>
                    <div className={`font-semibold mt-0.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {formatDateDisplay(day.date)}
                    </div>
                    <div className="mt-1 h-6 sm:h-8 overflow-hidden opacity-70 text-[10px]">
                      {day.optimizedContent
                        ? day.optimizedContent.length > 20
                          ? day.optimizedContent.substring(0, 20) + '...'
                          : day.optimizedContent
                        : day.content
                        ? day.content.length > 20
                          ? day.content.substring(0, 20) + '...'
                          : day.content
                        : '-'}
                      {day.optimizedContent && (
                        <span className="ml-1 text-[#22c55e]">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
