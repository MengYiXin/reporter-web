import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { formatDateDisplay } from '../../utils/date';

interface DayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

export function DayEditorModal({ isOpen, onClose, onGenerate }: DayEditorModalProps) {
  const selectedDay = useAppStore((state) => state.selectedDay);
  const allData = useAppStore((state) => state.allData);
  const updateDayContent = useAppStore((state) => state.updateDayContent);
  const loading = useAppStore((state) => state.loading);

  const dayEntry = Object.values(allData).flat().find((d) => d.date === selectedDay);
  const content = dayEntry?.content || '';
  const optimizedContent = dayEntry?.optimizedContent || '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formatDateDisplay(selectedDay)}>
      <div className="space-y-4">
        {/* 原始内容 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#888]">原始内容</label>
            <button
              onClick={() => handleCopy(content)}
              className="text-xs text-[#3b82f6] hover:text-[#2563eb]"
            >
              复制
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => updateDayContent(selectedDay, e.target.value)}
            placeholder="输入今日工作内容..."
            className="w-full h-32 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none text-sm"
          />
        </div>

        {/* 优化后内容 */}
        {optimizedContent && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#22c55e]">AI优化内容</label>
              <button
                onClick={() => handleCopy(optimizedContent)}
                className="text-xs text-[#22c55e] hover:text-[#16a34a]"
              >
                复制
              </button>
            </div>
            <div className="w-full h-48 bg-[#0d1a0d] border border-[#22c55e]/30 rounded-xl text-[#c0c0c0] p-3 text-sm overflow-auto whitespace-pre-wrap">
              {optimizedContent}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[#1c1c1c] text-[#888] rounded-lg hover:text-white"
          >
            关闭
          </button>
          <button
            onClick={() => {
              onClose();
              onGenerate();
            }}
            disabled={loading || !content.trim()}
            className="px-4 py-2 text-sm bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成/优化日报'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
