import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { STORAGE_KEYS } from '../../constants/config';

const VALID_USERS = ['M', 'Y'];
const VALID_PASSWORD = 'Dos70001';

export function LoginScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [rememberAccount, setRememberAccount] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const setLoggedIn = useAppStore((state) => state.setLoggedIn);
  const setUserMode = useAppStore((state) => state.setUserMode);
  const initializeForUserMode = useAppStore((state) => state.initializeForUserMode);

  // 加载记住的账号密码
  useEffect(() => {
    const savedAccount = localStorage.getItem(STORAGE_KEYS.REMEMBERED_ACCOUNT);
    const savedPassword = localStorage.getItem(STORAGE_KEYS.REMEMBERED_PASSWORD);
    const savedRememberAccount = localStorage.getItem(STORAGE_KEYS.REMEMBER_ACCOUNT) === 'true';
    const savedRememberPassword = localStorage.getItem(STORAGE_KEYS.REMEMBER_PASSWORD) === 'true';

    if (savedAccount) setAccount(savedAccount);
    if (savedPassword) setPassword(savedPassword);
    setRememberAccount(savedRememberAccount);
    setRememberPassword(savedRememberPassword);
  }, []);

  const handleLogin = () => {
    setError('');

    if (!account.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    const upperAccount = account.toUpperCase();
    if (!VALID_USERS.includes(upperAccount)) {
      setError('账号必须是 M 或 Y');
      return;
    }
    if (password !== VALID_PASSWORD) {
      setError('密码错误');
      return;
    }

    // 处理记住账号
    if (rememberAccount) {
      localStorage.setItem(STORAGE_KEYS.REMEMBERED_ACCOUNT, account);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ACCOUNT, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBERED_ACCOUNT);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ACCOUNT);
    }

    // 处理记住密码
    if (rememberPassword) {
      localStorage.setItem(STORAGE_KEYS.REMEMBERED_PASSWORD, password);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_PASSWORD, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBERED_PASSWORD);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_PASSWORD);
    }

    setLoggedIn(true, upperAccount);
    setUserMode(upperAccount.toLowerCase() as 'm' | 'y');
    initializeForUserMode();
  };

  const handleForgotPassword = () => {
    setShowForgot(true);
    setResetMessage('');
  };

  const handleResetPassword = () => {
    // 模拟密码找回流程
    setResetMessage('请联系管理员重置密码');
    setTimeout(() => {
      setShowForgot(false);
      setResetMessage('');
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
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

        {!showForgot ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-[#888888] text-sm mb-2">账号</label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="请输入 M 或 Y"
                  className="w-full px-4 py-3 bg-[#0d0d0d] text-white rounded-xl border border-[#1f1f1f] focus:border-[#3b82f6] focus:outline-none placeholder-[#444444]"
                />
              </div>
              <div>
                <label className="block text-[#888888] text-sm mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 bg-[#0d0d0d] text-white rounded-xl border border-[#1f1f1f] focus:border-[#3b82f6] focus:outline-none placeholder-[#444444]"
                />
              </div>
            </div>

            {/* 记住账号密码 */}
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberAccount}
                  onChange={(e) => setRememberAccount(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333333] bg-[#0d0d0d] text-[#3b82f6] focus:ring-[#3b82f6] focus:ring-offset-0"
                />
                <span className="ml-2 text-[#666666] text-sm">记住账号</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333333] bg-[#0d0d0d] text-[#3b82f6] focus:ring-[#3b82f6] focus:ring-offset-0"
                />
                <span className="ml-2 text-[#666666] text-sm">记住密码</span>
              </label>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mt-4 text-red-500 text-sm text-center">{error}</div>
            )}

            {/* 登录按钮 */}
            <button
              onClick={handleLogin}
              className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
            >
              登录
            </button>

            {/* 忘记密码 */}
            <button
              onClick={handleForgotPassword}
              className="w-full mt-4 text-[#666666] text-sm hover:text-[#888888] transition"
            >
              忘记密码？
            </button>
          </>
        ) : (
          <>
            <div className="text-center">
              <p className="text-[#888888] mb-4">密码找回</p>
              <p className="text-[#c0c0c0] text-sm mb-6">
                请联系管理员重置密码
              </p>
              {resetMessage && (
                <p className="text-[#22c55e] text-sm mb-4">{resetMessage}</p>
              )}
              <button
                onClick={handleResetPassword}
                className="w-full py-3 px-6 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#2563eb] transition mb-3"
              >
                确认重置
              </button>
              <button
                onClick={() => setShowForgot(false)}
                className="w-full py-3 px-6 bg-[#1c1c1c] text-[#b0b0b0] rounded-xl font-medium hover:text-white hover:bg-[#2a2a2a] transition"
              >
                返回
              </button>
            </div>
          </>
        )}

        <p className="text-xs text-[#444444] text-center mt-8">数据保存在本地 · 上传 GitHub 可多设备同步</p>
      </div>
    </div>
  );
}
