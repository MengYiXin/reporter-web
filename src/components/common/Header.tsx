import { useAppStore } from '../../store/useAppStore';
import { AI_MODEL_OPTIONS } from '../../constants/models';
import type { AIModel } from '../../types';
import { useMobile } from '../../hooks/useMobile';

export function Header() {
  const isMobile = useMobile();
  const userMode = useAppStore((state) => state.userMode);
  const loginUser = useAppStore((state) => state.loginUser);
  const setUserMode = useAppStore((state) => state.setUserMode);
  const apiKey = useAppStore((state) => state.apiKey);
  const setApiKey = useAppStore((state) => state.setApiKey);
  const aiModel = useAppStore((state) => state.aiModel);
  const setAiModel = useAppStore((state) => state.setAiModel);
  const ghToken = useAppStore((state) => state.ghToken);
  const setGhToken = useAppStore((state) => state.setGhToken);
  const logout = useAppStore((state) => state.logout);

  const isYMode = userMode === 'y';

  return (
    <div className={`flex flex-wrap items-center justify-between mb-6 ${isMobile ? 'gap-3' : 'mb-8'}`}>
      <div className="flex items-center gap-4">
        {/* Logo Mark */}
        <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <rect width="64" height="64" rx="12" fill="url(#logoGradHeader)"/>
          <path d="M18 18h28v4H22v8h20v4H22v16h-4V18z" fill="white"/>
          <path d="M38 18h8v4h-4v24h-4V22h-4v-4h4v4z" fill="white"/>
          <defs>
            <linearGradient id="logoGradHeader" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6"/>
              <stop offset="1" stopColor="#1d4ed8"/>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-semibold text-white tracking-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {isYMode ? '供应链周报助手' : '科技公司周报助手'}
            </h1>
            <button
              onClick={() => setUserMode(null)}
              className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#666666] rounded border border-[#2a2a2a] hover:text-white"
            >
              切换
            </button>
          </div>
          <p className={`text-[#888888] mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isYMode ? '三江集团供应链 · 国企风格' : 'AI 智能报告生成器'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* 用户信息 */}
        <span className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0]">
          {loginUser}
        </span>
        <button
          onClick={logout}
          className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] hover:text-red-400"
        >
          退出
        </button>
        <select
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value as AIModel)}
          className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0]"
        >
          {AI_MODEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
          className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] w-24 sm:w-32"
        />
        <input
          type="password"
          value={ghToken}
          onChange={(e) => setGhToken(e.target.value)}
          placeholder="GH Token"
          className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] w-24 sm:w-32"
        />
      </div>
    </div>
  );
}
