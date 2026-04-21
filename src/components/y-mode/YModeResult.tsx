import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';

interface YModeResultProps {
  onBack: () => void;
}

export function YModeResult({ onBack }: YModeResultProps) {
  const generatedReport = useAppStore((state) => state.generatedReport);
  const sjcArchive = useAppStore((state) => state.sjcArchive);
  const currentWeekStart = useAppStore((state) => state.currentWeekStart);
  const loading = useAppStore((state) => state.loading);
  const addToast = useToastStore((state) => state.addToast);

  const currentWeekData = sjcArchive[currentWeekStart];

  const getOriginalContent = () => {
    if (!currentWeekData) return '';
    const lines: string[] = [];
    currentWeekData.categories.forEach((cat) => {
      if (cat.entry.thisWeek.trim()) {
        lines.push(`【${cat.name}】`);
        lines.push(`本周完成：${cat.entry.thisWeek}`);
        if (cat.entry.nextWeek) lines.push(`下周计划：${cat.entry.nextWeek}`);
        if (cat.entry.issues) lines.push(`存在问题：${cat.entry.issues}`);
        lines.push('');
      }
    });
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport);
    addToast('已复制到剪贴板', 'success');
  };

  const handleExport = () => {
    const blob = new Blob([generatedReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `周报_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {loading && (
        <div className="bg-[#111111] rounded-2xl p-8 border border-[#1f1f1f] text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#888888]">AI 正在生成周报...</p>
        </div>
      )}

      {!loading && (
        <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#888888]">📝 原始工作记录</h3>
          </div>
          <pre className="whitespace-pre-wrap text-xs text-[#666666] bg-[#0d0d0d] p-3 rounded-xl max-h-[200px] overflow-auto leading-relaxed">
            {getOriginalContent() || '暂无原始内容'}
          </pre>
        </div>
      )}

      {!loading && (
        <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
          <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
            <h3 className="text-sm font-medium text-[#22c55e]">✨ AI优化周报</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
              >
                📋 复制
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
              >
                📥 导出
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#c0c0c0] bg-[#0d0d0d] p-3 sm:p-5 rounded-xl overflow-auto max-h-[500px] leading-relaxed border border-[#1a1a1a]">
            {generatedReport || '暂无生成结果'}
          </pre>
        </div>
      )}

      {!loading && (
        <button
          onClick={onBack}
          className="w-full py-3 bg-[#1c1c1c] text-[#b0b0b0] text-sm font-medium rounded-xl border border-[#2a2a2a] hover:text-white hover:bg-[#2a2a2a]"
        >
          ← 返回编辑
        </button>
      )}
    </div>
  );
}
