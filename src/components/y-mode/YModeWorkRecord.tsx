import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SJC_DEPARTMENTS } from '../../constants/config';
import { WeekSelector } from './WeekSelector';
import { CategoryEditor } from './CategoryEditor';
import { formatWeekLabel } from '../../utils/date';
import { useMobile } from '../../hooks/useMobile';
import type { SJCCategory } from '../../types';

interface YModeWorkRecordProps {
  onGenerateReport: () => void;
  onExpandCell: (categoryIndex: number, field: string) => void;
}

export function YModeWorkRecord({ onGenerateReport, onExpandCell }: YModeWorkRecordProps) {
  const isMobile = useMobile();
  const loading = useAppStore((state) => state.loading);
  const saveStatus = useAppStore((state) => state.saveStatus);
  const lastSaved = useAppStore((state) => state.lastSaved);
  const sjcView = useAppStore((state) => state.sjcView);
  const setSjcView = useAppStore((state) => state.setSjcView);
  const currentDepartment = useAppStore((state) => state.currentDepartment);
  const setCurrentDepartment = useAppStore((state) => state.setCurrentDepartment);
  const expandedCat = useAppStore((state) => state.expandedCat);
  const setExpandedCat = useAppStore((state) => state.setExpandedCat);
  const sjcArchive = useAppStore((state) => state.sjcArchive);
  const currentWeekStart = useAppStore((state) => state.currentWeekStart);
  const hasUnfinishedFromLastWeek = useAppStore((state) => state.hasUnfinishedFromLastWeek);
  const carryOverUnfinished = useAppStore((state) => state.carryOverUnfinished);
  const getArchivedWeeks = useAppStore((state) => state.getArchivedWeeks);
  const selectWeek = useAppStore((state) => state.selectWeek);

  const [editorCategory, setEditorCategory] = useState<SJCCategory | null>(null);

  const currentWeekData = sjcArchive[currentWeekStart];
  const archivedWeeks = getArchivedWeeks();

  const handleCopyCategory = (catIdx: number) => {
    const cat = currentWeekData?.categories[catIdx];
    if (!cat) return;
    const text = `【${cat.name}】
本周完成：${cat.entry.thisWeek || '无'}
累计完成：${cat.entry.cumulative || '无'}
下周计划：${cat.entry.nextWeek || '无'}
存在问题：${cat.entry.issues || '无'}
需协调：${cat.entry.coordination || '无'}
分管领导：${cat.entry.leader || '无'}
责任人：${cat.entry.owner || '无'}`;
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const handleCopyWeekReport = () => {
    if (!currentWeekData) return;
    const lines = [
      `【${currentWeekData.department}周报】`,
      `日期：${formatWeekLabel(currentWeekData.weekStart)}`,
      '',
    ];
    currentWeekData.categories.forEach((cat) => {
      if (cat.entry.thisWeek.trim() || cat.entry.cumulative.trim()) {
        lines.push(`【${cat.name}】`);
        lines.push(`本周：${cat.entry.thisWeek || '无'}`);
        lines.push(`累计：${cat.entry.cumulative || '无'}`);
        lines.push(`计划：${cat.entry.nextWeek || '无'}`);
        lines.push('');
      }
    });
    navigator.clipboard.writeText(lines.join('\n'));
    alert('已复制到剪贴板');
  };

  const handleOpenCategory = (idx: number, cat: SJCCategory) => {
    setExpandedCat(idx);
    setEditorCategory(cat);
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSjcView(sjcView === 'edit' ? 'archive' : 'edit')}
              className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
            >
              {sjcView === 'edit' ? '📋 历史存档' : '✏️ 返回编辑'}
            </button>
            <button
              onClick={handleCopyWeekReport}
              className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
            >
              📋 复制报告
            </button>
          </div>
          <div className="text-xs">
            {saveStatus === 'saving' && <span className="text-[#f59e0b]">保存中...</span>}
            {saveStatus === 'saved' && <span className="text-[#22c55e]">已保存 {lastSaved}</span>}
            {saveStatus === 'error' && <span className="text-red-500">保存失败</span>}
          </div>
        </div>

        {sjcView === 'edit' && (
          <>
            {/* 周选择器 */}
            <div className="flex items-center justify-between mb-3">
              <WeekSelector />
              <select
                value={currentDepartment}
                onChange={(e) => setCurrentDepartment(e.target.value)}
                className="px-2 py-1 text-xs bg-[#161616] border border-[#2a2a2a] rounded text-[#e0e0e0]"
              >
                {SJC_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 延续提示 */}
            {hasUnfinishedFromLastWeek() && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                <span className="text-xs text-[#f59e0b]">📌 上周有未完成的工作项</span>
                <button
                  onClick={carryOverUnfinished}
                  className="px-2 py-1 text-xs bg-[#f59e0b] text-white rounded hover:bg-[#d97706]"
                >
                  带入本周
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 历史存档视图 */}
      {sjcView === 'archive' && (
        <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
          <h3 className="text-sm font-medium text-white mb-3">📋 历史存档</h3>
          <div className="space-y-2">
            {archivedWeeks.map((week) => (
              <div
                key={week.weekStart}
                onClick={() => {
                  selectWeek(week.weekStart);
                  setSjcView('edit');
                }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[#1c1c1c] ${
                  week.weekStart === currentWeekStart
                    ? 'bg-[#1c1c1c] border border-[#3b82f6]'
                    : 'bg-[#161616]'
                }`}
              >
                <span className="text-sm text-[#e0e0e0]">{week.label}</span>
                <span className="text-xs text-[#666666]">{week.weekStart}</span>
              </div>
            ))}
            {archivedWeeks.length === 0 && (
              <div className="text-center text-[#666666] py-4">暂无历史数据</div>
            )}
          </div>
        </div>
      )}

      {/* 编辑视图 */}
      {sjcView === 'edit' && currentWeekData && (
        <>
          {/* PC端表格 */}
          {!isMobile && (
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-[#888888]">
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-10">序号</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">重点工作事项</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-40">本周完成情况</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-40">累计完成情况</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-36">下一步工作计划</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">存在问题</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">需协调事项</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-16">分管</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-12">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWeekData.categories.map((category, catIdx) => (
                    <tr
                      key={catIdx}
                      onClick={() => handleOpenCategory(catIdx, category)}
                      className={`cursor-pointer transition-all ${
                        catIdx % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111111]'
                      } hover:bg-[#1a1a1a] ${expandedCat === catIdx ? 'bg-[#1a2616]' : ''}`}
                    >
                      <td className="px-2 py-3 text-center text-[#666666] border border-[#2a2a2a]">{catIdx + 1}</td>
                      <td className="px-2 py-3 text-left text-[#22c55e] border border-[#2a2a2a] text-sm font-medium">
                        {category.name}
                        {category.carriedFromLastWeek && <span className="ml-1 text-[8px] text-[#f59e0b]">📌</span>}
                      </td>
                      <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[200px] truncate">
                        {category.entry.thisWeek || '点击填写...'}
                      </td>
                      <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[200px] truncate">
                        {category.entry.cumulative || '-'}
                      </td>
                      <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[200px] truncate">
                        {category.entry.nextWeek || '-'}
                      </td>
                      <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[150px] truncate">
                        {category.entry.issues || '-'}
                      </td>
                      <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[150px] truncate">
                        {category.entry.coordination || '-'}
                      </td>
                      <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs">
                        {category.entry.leader || '-'}
                      </td>
                      <td className="px-1 py-3 border border-[#2a2a2a] text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCategory(catIdx);
                          }}
                          className="px-2 py-1 text-xs bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
                        >
                          📋
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 板块编辑弹窗 */}
          {expandedCat !== null && editorCategory && (
            <CategoryEditor
              isOpen={expandedCat !== null}
              onClose={() => {
                setExpandedCat(null);
                setEditorCategory(null);
              }}
              categoryIndex={expandedCat}
              category={editorCategory}
              onExpandCell={onExpandCell}
            />
          )}

          <button
            onClick={onGenerateReport}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg"
          >
            {loading ? '生成中...' : '生成周报'}
          </button>
        </>
      )}
    </div>
  );
}
