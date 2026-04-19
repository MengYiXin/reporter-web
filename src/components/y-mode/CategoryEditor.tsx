import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import type { SJCCategory } from '../../types';

interface CategoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  categoryIndex: number;
  category: SJCCategory;
  onExpandCell: (categoryIndex: number, field: string) => void;
}

export function CategoryEditor({
  isOpen,
  onClose,
  categoryIndex,
  category,
  onExpandCell,
}: CategoryEditorProps) {
  const loading = useAppStore((state) => state.loading);
  const updateSJCCell = useAppStore((state) => state.updateSJCCell);

  const entry = category.entry;

  // refs for native DOM event handling (enterprise WeChat compatibility)
  const thisWeekRef = useRef<HTMLTextAreaElement>(null);
  const cumulativeRef = useRef<HTMLTextAreaElement>(null);
  const nextWeekRef = useRef<HTMLTextAreaElement>(null);
  const issuesRef = useRef<HTMLTextAreaElement>(null);
  const coordinationRef = useRef<HTMLTextAreaElement>(null);
  const leaderRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);

  // 使用原生事件处理输入（兼容企业微信浏览器）
  useEffect(() => {
    if (!isOpen) return;

    const setupNativeInput = (el: HTMLElement | null, field: string) => {
      if (!el) return;
      const handler = () => {
        updateSJCCell(categoryIndex, field, (el as HTMLInputElement | HTMLTextAreaElement).value);
      };
      el.addEventListener('input', handler);
      el.addEventListener('blur', handler);
      return () => {
        el.removeEventListener('input', handler);
        el.removeEventListener('blur', handler);
      };
    };

    const cleanups = [
      setupNativeInput(thisWeekRef.current, 'thisWeek'),
      setupNativeInput(cumulativeRef.current, 'cumulative'),
      setupNativeInput(nextWeekRef.current, 'nextWeek'),
      setupNativeInput(issuesRef.current, 'issues'),
      setupNativeInput(coordinationRef.current, 'coordination'),
      setupNativeInput(leaderRef.current, 'leader'),
      setupNativeInput(ownerRef.current, 'owner'),
    ];

    return () => cleanups.forEach((fn) => fn?.());
  }, [isOpen, categoryIndex, updateSJCCell]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category.name}>
      <div className="space-y-4">
        {/* 本周完成情况 */}
        <div>
          <label className="text-sm text-[#888] block mb-2">本周完成情况</label>
          <div className="flex gap-2">
            <textarea
              ref={thisWeekRef}
              defaultValue={entry.thisWeek}
              placeholder="填写本周完成的工作..."
              className="flex-1 h-32 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              onClick={() => onExpandCell(categoryIndex, 'thisWeek')}
              disabled={loading}
              className="px-3 py-2 text-sm bg-[#22c55e] text-white rounded-xl shrink-0"
            >
              AI
            </button>
          </div>
        </div>

        {/* 累计完成情况 */}
        <div>
          <label className="text-sm text-[#888] block mb-2">累计完成情况</label>
          <div className="flex gap-2">
            <textarea
              ref={cumulativeRef}
              defaultValue={entry.cumulative}
              placeholder="填写累计完成情况..."
              className="flex-1 h-24 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              onClick={() => onExpandCell(categoryIndex, 'cumulative')}
              disabled={loading}
              className="px-3 py-2 text-sm bg-[#22c55e] text-white rounded-xl shrink-0"
            >
              AI
            </button>
          </div>
        </div>

        {/* 下一步工作计划 */}
        <div>
          <label className="text-sm text-[#888] block mb-2">下一步工作计划</label>
          <div className="flex gap-2">
            <textarea
              ref={nextWeekRef}
              defaultValue={entry.nextWeek}
              placeholder="填写下周计划..."
              className="flex-1 h-24 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              onClick={() => onExpandCell(categoryIndex, 'nextWeek')}
              disabled={loading}
              className="px-3 py-2 text-sm bg-[#22c55e] text-white rounded-xl shrink-0"
            >
              AI
            </button>
          </div>
        </div>

        {/* 问题与协调 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#888] block mb-2">存在问题</label>
            <textarea
              ref={issuesRef}
              defaultValue={entry.issues}
              placeholder="填写问题（如无则填'无'）..."
              className="w-full h-20 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-sm text-[#888] block mb-2">需协调解决事项</label>
            <textarea
              ref={coordinationRef}
              defaultValue={entry.coordination}
              placeholder="填写需协调事项（如无则填'无'）..."
              className="w-full h-20 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 分管领导与责任人 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#888] block mb-2">分管领导</label>
            <input
              ref={leaderRef}
              defaultValue={entry.leader}
              placeholder="填写分管领导姓名..."
              className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-sm text-[#888] block mb-2">责任人</label>
            <input
              ref={ownerRef}
              defaultValue={entry.owner}
              placeholder="填写责任人姓名..."
              className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
