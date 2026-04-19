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

  const handleFieldChange = (field: string, value: string) => {
    updateSJCCell(categoryIndex, field, value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category.name}>
      <div className="space-y-4">
        {/* 本周完成情况 */}
        <div>
          <label className="text-sm text-[#888] block mb-2">本周完成情况</label>
          <div className="flex gap-2">
            <textarea
              value={entry.thisWeek}
              onChange={(e) => handleFieldChange('thisWeek', e.target.value)}
              placeholder="填写本周完成的工作..."
              className="flex-1 h-32 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
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
              value={entry.cumulative}
              onChange={(e) => handleFieldChange('cumulative', e.target.value)}
              placeholder="填写累计完成情况..."
              className="flex-1 h-24 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
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
              value={entry.nextWeek}
              onChange={(e) => handleFieldChange('nextWeek', e.target.value)}
              placeholder="填写下周计划..."
              className="flex-1 h-24 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
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
              value={entry.issues}
              onChange={(e) => handleFieldChange('issues', e.target.value)}
              placeholder="填写问题（如无则填'无'）..."
              className="w-full h-20 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
            />
          </div>
          <div>
            <label className="text-sm text-[#888] block mb-2">需协调解决事项</label>
            <textarea
              value={entry.coordination}
              onChange={(e) => handleFieldChange('coordination', e.target.value)}
              placeholder="填写需协调事项（如无则填'无'）..."
              className="w-full h-20 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
            />
          </div>
        </div>

        {/* 分管领导与责任人 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#888] block mb-2">分管领导</label>
            <input
              value={entry.leader}
              onChange={(e) => handleFieldChange('leader', e.target.value)}
              placeholder="填写分管领导姓名..."
              className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3"
            />
          </div>
          <div>
            <label className="text-sm text-[#888] block mb-2">责任人</label>
            <input
              value={entry.owner}
              onChange={(e) => handleFieldChange('owner', e.target.value)}
              placeholder="填写责任人姓名..."
              className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
