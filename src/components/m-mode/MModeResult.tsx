import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';

export function MModeResult() {
  const generatedReport = useAppStore((state) => state.generatedReport);
  const setMView = useAppStore((state) => state.setMView);
  const addToast = useToastStore((state) => state.addToast);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport);
    addToast('已复制到剪贴板', 'success');
  };

  return (
    <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-white">生成结果</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a]"
          >
            📋 复制全文
          </button>
          <button
            onClick={() => setMView('calendar')}
            className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
          >
            返回
          </button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#c0c0c0] bg-[#0d0d0d] p-3 sm:p-5 rounded-xl overflow-auto max-h-[500px] leading-relaxed border border-[#1a1a1a]">
        {generatedReport}
      </pre>
    </div>
  );
}
