import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
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
  const addToast = useToastStore((state) => state.addToast);

  const dayEntry = Object.values(allData).flat().find((d) => d.date === selectedDay);
  const content = dayEntry?.content || '';
  const optimizedContent = dayEntry?.optimizedContent || '';

  const [inputText, setInputText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 每次打开弹窗时同步最新内容
  useEffect(() => {
    if (isOpen) {
      const latestContent = dayEntry?.content || '';
      setInputText(latestContent);
      // 直接设置DOM值
      if (textareaRef.current) {
        textareaRef.current.value = latestContent;
      }
    }
  }, [isOpen, selectedDay, dayEntry?.content]);

  // 使用原生事件处理输入
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isOpen) return;

    console.log('[DEBUG] Setting up native event listeners, textarea:', textarea ? 'exists' : 'null');

    // 监听原生输入事件
    const handleNativeInput = () => {
      const newValue = textarea.value;
      console.log('[DEBUG] Native input detected, value length:', newValue.length);
      setInputText(newValue);
      // 实时读取当前selectedDay确保用最新值
      const currentDay = useAppStore.getState().selectedDay;
      updateDayContent(currentDay, newValue);
    };

    // 添加多个事件监听以确保捕获所有输入
    textarea.addEventListener('input', handleNativeInput);
    textarea.addEventListener('change', handleNativeInput);
    textarea.addEventListener('keyup', handleNativeInput);
    textarea.addEventListener('blur', handleNativeInput);

    return () => {
      textarea.removeEventListener('input', handleNativeInput);
      textarea.removeEventListener('change', handleNativeInput);
      textarea.removeEventListener('keyup', handleNativeInput);
      textarea.removeEventListener('blur', handleNativeInput);
    };
  }, [isOpen, updateDayContent]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('已复制到剪贴板', 'success');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newText = inputText + text;
      setInputText(newText);
      if (textareaRef.current) {
        textareaRef.current.value = newText;
      }
      // 实时读取当前selectedDay确保用最新值
      const currentDay = useAppStore.getState().selectedDay;
      updateDayContent(currentDay, newText);
      addToast('粘贴成功', 'success');
    } catch {
      addToast('粘贴失败，请尝试长按输入框粘贴', 'error');
    }
  };

  const handleGenerate = () => {
    // 实时读取当前selectedDay和textarea值，不用闭包捕获的旧值
    const currentDay = useAppStore.getState().selectedDay;
    const currentContent = textareaRef.current?.value || '';
    updateDayContent(currentDay, currentContent);
    onClose();
    onGenerate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formatDateDisplay(selectedDay)}>
      <div className="space-y-4" ref={containerRef}>
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
                onClick={() => handleCopy(textareaRef.current?.value || '')}
                className="text-xs text-[#3b82f6] hover:text-[#2563eb]"
              >
                复制
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            defaultValue={inputText}
            placeholder="输入今日工作内容，或点击粘贴按钮"
            className="w-full h-40 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none text-sm"
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <div className="mt-1 text-xs text-[#666]">
            直接输入内容，自动保存
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
            onClick={handleGenerate}
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
