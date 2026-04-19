import { useAppStore } from '../../store/useAppStore';

export function MModeArchive() {
  const reportArchive = useAppStore((state) => state.reportArchive);
  const setMView = useAppStore((state) => state.setMView);
  const setGeneratedReport = useAppStore((state) => state.setGeneratedReport);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('已复制');
  };

  const handleView = (content: string) => {
    setGeneratedReport(content);
    setMView('result');
  };

  return (
    <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">📋 生成历史</h3>
        <button
          onClick={() => setMView('calendar')}
          className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#888] rounded-lg"
        >
          返回日历
        </button>
      </div>

      {reportArchive.length === 0 ? (
        <div className="text-center py-8 text-[#666]">暂无历史报告</div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {reportArchive.map((record, idx) => (
            <div key={idx} className="bg-[#161616] rounded-xl p-3 border border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      record.type === 'daily'
                        ? 'bg-[#22c55e]/20 text-[#22c55e]'
                        : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                    }`}
                  >
                    {record.type === 'daily' ? '日报' : '周报'}
                  </span>
                  <span className="text-xs text-[#888]">{record.date}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(record.content)}
                    className="px-2 py-1 text-xs bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
                  >
                    复制
                  </button>
                  <button
                    onClick={() => handleView(record.content)}
                    className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#888] rounded hover:text-white"
                  >
                    查看
                  </button>
                </div>
              </div>
              <pre className="text-xs text-[#888] whitespace-pre-wrap line-clamp-3">
                {record.content.substring(0, 200)}...
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
