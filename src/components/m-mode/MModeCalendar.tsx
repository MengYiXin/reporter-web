import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WeekCalendar } from './WeekCalendar';
import { DayEditorModal } from './DayEditorModal';
import type { ReportType } from '../../types';

interface MModeCalendarProps {
  onGenerate: (type: ReportType) => void;
}

export function MModeCalendar({ onGenerate }: MModeCalendarProps) {
  const loading = useAppStore((state) => state.loading);
  const setReportType = useAppStore((state) => state.setReportType);
  const allData = useAppStore((state) => state.allData);
  const [editorOpen, setEditorOpen] = useState(false);

  const filledDaysCount = Object.values(allData).flat().filter((d) => d.content.trim()).length;

  const handleGenerateDaily = () => {
    setReportType('daily');
    onGenerate('daily');
  };

  const handleGenerateWeekly = () => {
    setReportType('weekly');
    onGenerate('weekly');
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setEditorOpen(true)}
              className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
            >
              📋 历史存档
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateDaily}
              disabled={loading}
              className="px-4 py-2 bg-[#22c55e] text-white text-xs font-medium rounded-lg hover:bg-[#16a34a] disabled:opacity-50"
            >
              生成日报
            </button>
            <button
              onClick={handleGenerateWeekly}
              disabled={loading}
              className="px-4 py-2 bg-[#3b82f6] text-white text-xs font-medium rounded-lg hover:bg-[#2563eb] disabled:opacity-50"
            >
              生成周报
            </button>
          </div>
        </div>
      </div>

      {/* 日历网格 */}
      <WeekCalendar onDayClick={() => setEditorOpen(true)} />

      {/* 本周填写统计 */}
      <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f] text-center">
        <span className="text-sm text-[#888]">本周已填写 </span>
        <span className="text-[#22c55e] font-medium">{filledDaysCount}</span>
        <span className="text-sm text-[#888]"> 天</span>
      </div>

      {/* 日期编辑弹窗 */}
      <DayEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onGenerate={handleGenerateDaily}
      />
    </div>
  );
}
