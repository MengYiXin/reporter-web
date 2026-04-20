import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function UserSelectScreen() {
  const [selectedMode, setSelectedMode] = useState<'m' | 'y' | null>(null);
  const setUserMode = useAppStore((state) => state.setUserMode);
  const initializeForUserMode = useAppStore((state) => state.initializeForUserMode);

  const handleSelectMode = (mode: 'm' | 'y') => {
    setSelectedMode(mode);
    setUserMode(mode);
    initializeForUserMode();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="bg-[#111111] rounded-2xl p-8 border border-[#1f1f1f] max-w-lg w-full mx-4">
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

        {/* M/Y 选择按钮 - 更醒目 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleSelectMode('m')}
            className={`relative py-6 px-6 rounded-2xl font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${
              selectedMode === 'm'
                ? 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                : 'bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35] text-[#3b82f6] border-2 border-[#3b82f6]/30 hover:border-[#3b82f6] hover:shadow-lg hover:shadow-blue-500/20'
            }`}
          >
            <span className="block text-3xl mb-1">M</span>
            <span className="text-xs font-normal opacity-70">科技公司</span>
            {selectedMode === 'm' && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          <button
            onClick={() => handleSelectMode('y')}
            className={`relative py-6 px-6 rounded-2xl font-bold text-2xl transition-all duration-200 transform hover:scale-105 ${
              selectedMode === 'y'
                ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-green-500/30 ring-2 ring-green-400'
                : 'bg-gradient-to-br from-[#1a3d1a] to-[#0f2a0f] text-[#22c55e] border-2 border-[#22c55e]/30 hover:border-[#22c55e] hover:shadow-lg hover:shadow-green-500/20'
            }`}
          >
            <span className="block text-3xl mb-1">Y</span>
            <span className="text-xs font-normal opacity-70">供应链</span>
            {selectedMode === 'y' && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        <p className="text-xs text-[#444444] text-center">数据保存在本地 · 上传 GitHub 可多设备同步</p>
      </div>
    </div>
  );
}
