import { useState, useEffect, useRef } from 'react';
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

  const [inputText, setInputText] = useState(content);
  const inputRef = useRef<HTMLDivElement>(null);

  // 每次打开弹窗时同步最新内容
  useEffect(() => {
    if (isOpen) {
      setInputText(dayEntry?.content || '');
    }
  }, [isOpen, selectedDay, dayEntry?.content]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newText = inputText + text;
      setInputText(newText);
      updateDayContent(selectedDay, newText);
      alert('粘贴成功');
    } catch (err) {
      alert('粘贴失败，请尝试长按输入框粘贴');
    }
  };

  // 处理输入变化
  const handleInput = () => {
    const text = inputRef.current?.innerText || '';
    setInputText(text);
    updateDayContent(selectedDay, text);
  };

  // 失去焦点时保存
  const handleBlur = () => {
    const text = inputRef.current?.innerText || '';
    setInputText(text);
    updateDayContent(selectedDay, text);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formatDateDisplay(selectedDay)}>
      <div className="space-y-4">
        {/* 原始内容 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#888]">原始内容</label>
            <div className="flex gap-2">
              <button
                onClick={handlePaste}
                className="text-xs px-2 py-1 bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
              >
                📋 粘贴
              </button>
              <button
                onClick={() => handleCopy(inputText)}
                className="text-xs text-[#3b82f6] hover:text-[#2563eb]"
              >
                复制
              </button>
            </div>
          </div>
          {/* 使用 contentEditable div 替代 textarea */}
          <div
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleBlur}
            suppressContentEditableWarning
            className="w-full min-h-[120px] h-auto bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 text-sm overflow-auto outline-none focus:border-[#3b82f6]"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {inputText}
          </div>
          <div className="mt-1 text-xs text-[#666]">
            点击输入框直接打字，或点击上方粘贴按钮
          </div>
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
            disabled={loading || !inputText.trim()}
            className="px-4 py-2 text-sm bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成/优化日报'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
