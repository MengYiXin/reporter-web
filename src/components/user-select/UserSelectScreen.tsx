import { useAppStore } from '../../store/useAppStore';

export function UserSelectScreen() {
  const setUserMode = useAppStore((state) => state.setUserMode);
  const initializeForUserMode = useAppStore((state) => state.initializeForUserMode);

  const handleSelectMode = (mode: 'm' | 'y') => {
    setUserMode(mode);
    initializeForUserMode();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="bg-[#111111] rounded-2xl p-8 border border-[#1f1f1f] max-w-md w-full mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="12" fill="url(#logoGrad)"/>
              <path d="M18 18h28v4H22v8h20v4H22v16h-4V18z" fill="white"/>
              <path d="M38 18h8v4h-4v24h-4V22h-4v-4h4v4z" fill="white"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#1d4ed8"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22c55e] rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">AI</span>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white text-center mb-2">周报助手</h1>
        <p className="text-[#888888] text-center mb-8">AI 智能报告生成器</p>
        <p className="text-[#666666] text-center mb-6 text-sm">请选择您的身份</p>
        <div className="space-y-4">
          <button
            onClick={() => handleSelectMode('m')}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
          >
            M
            <span className="block text-sm opacity-70 font-normal mt-1">科技公司</span>
          </button>
          <button
            onClick={() => handleSelectMode('y')}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
          >
            Y
            <span className="block text-sm opacity-70 font-normal mt-1">供应链</span>
          </button>
        </div>
        <p className="text-xs text-[#444444] text-center mt-6">数据保存在本地 · 上传 GitHub 可多设备同步</p>
      </div>
    </div>
  );
}
