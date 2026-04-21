import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { STORAGE_KEYS } from '../../constants/config';

const VALID_USERS = ['M', 'Y'];
const CORRECT_HASH = 'e10adc3949ba59abbe56e057f20f883e';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// ==================== 电路板背景 ====================
function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // 电路节点
    const nodes: Array<{ x: number; y: number; connections: number[]; active: boolean; pulsePhase: number }> = [];
    const nodeCount = Math.floor((canvas.width * canvas.height) / 25000);

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        connections: [],
        active: Math.random() > 0.7,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 建立连接
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (dist < 150) {
          nodes[i].connections.push(j);
          nodes[j].connections.push(i);
        }
      }
    }

    // 绘制电路
    const draw = () => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.02;

      // 绘制连接线
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (const connIdx of node.connections) {
          const other = nodes[connIdx];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);

          // 折线效果
          const midX = (node.x + other.x) / 2;
          const midY = (node.y + other.y) / 2;
          const offset = (Math.random() - 0.5) * 20;

          if (Math.abs(node.x - other.x) > Math.abs(node.y - other.y)) {
            ctx.lineTo(midX + offset, midY);
            ctx.lineTo(midX + offset, other.y);
          } else {
            ctx.lineTo(midX, midY + offset);
            ctx.lineTo(other.x, midY + offset);
          }
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      // 绘制节点
      for (const node of nodes) {
        const isPulsing = Math.sin(time + node.pulsePhase) > 0.5;
        const size = node.active ? (isPulsing ? 6 : 4) : 3;

        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = node.active ? '#3b82f6' : '#94a3b8';
        if (node.active && isPulsing) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#3b82f6';
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }

      // 脉冲动画
      if (Math.random() > 0.95) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        randomNode.active = !randomNode.active;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0" style={{ zIndex: 0 }} />;
}

// ==================== 装饰性代码块 ====================
function CodeDecoration() {
  const lines = [
    'function generateReport() {',
    '  const data = collectWorkData();',
    '  return AI.optimize(data);',
    '}',
    '',
    'class WeeklyReporter {',
    '  constructor(user) {',
    '    this.user = user;',
    '  }',
    '}',
  ];

  return (
    <div
      className="fixed bottom-8 left-8 hidden lg:block"
      style={{ zIndex: 1 }}
    >
      <div
        className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg"
        style={{ border: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
          </div>
          <span className="text-xs text-slate-500 ml-2">reporter.js</span>
        </div>
        <pre className="text-xs text-slate-700 font-mono">
          {lines.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {i >= 1 && i <= 3 ? (
                <span className="text-blue-600">{line}</span>
              ) : i === 0 || i === 5 ? (
                <span className="text-purple-600">{line}</span>
              ) : i === 4 ? (
                <span style={{ color: '#64748b' }}>{line}</span>
              ) : (
                <span style={{ color: '#64748b' }}>{line}</span>
              )}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ==================== 数学公式装饰 ====================
function MathDecoration() {
  return (
    <div
      className="fixed top-12 right-8 hidden lg:block"
      style={{ zIndex: 1 }}
    >
      <div className="text-right">
        <div className="text-2xl font-serif text-slate-300 mb-2">f(x) = Σ AI(xᵢ)</div>
        <div className="text-lg font-serif text-slate-400">∫₀^∞ report(x)dx</div>
        <div className="text-sm text-slate-500 mt-2 font-mono">∀ week ∈ year</div>
      </div>
    </div>
  );
}

// ==================== Logo ====================
function Logo() {
  return (
    <div className="relative inline-block">
      {/* 外圈 */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
          border: '3px solid #3b82f6',
        }}
      >
        {/* 内部图案 - 学术徽章风格 */}
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          {/* 盾牌 */}
          <path
            d="M22 4L38 12V24C38 32 30 40 22 42C14 40 6 32 6 24V12L22 4Z"
            fill="#1e3a5f"
            stroke="#60a5fa"
            strokeWidth="1.5"
          />
          {/* 书籍 */}
          <path
            d="M14 16H30V30H14V16Z"
            fill="#3b82f6"
            opacity="0.3"
          />
          <path
            d="M16 14V30M28 14V30"
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14 18H30M14 22H30M14 26H26"
            stroke="#93c5fd"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* 星星 */}
          <circle cx="22" cy="10" r="2" fill="#fbbf24" />
        </svg>
      </div>

      {/* 装饰线 */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
        }}
      />
    </div>
  );
}

// ==================== 输入框组件 ====================
function StyledInput({
  type,
  value,
  onChange,
  onKeyDown,
  placeholder,
  icon,
  autoFocus,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder: string;
  icon: React.ReactNode;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="relative"
      style={{
        borderBottom: `2px solid ${focused ? '#3b82f6' : '#e2e8f0'}`,
        transition: 'border-color 0.3s ease',
      }}
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2"
        style={{
          color: focused ? '#3b82f6' : '#94a3b8',
          transition: 'color 0.3s ease',
        }}
      >
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-4 py-4 bg-transparent text-slate-800 text-lg placeholder-slate-400 focus:outline-none"
        style={{ caretColor: '#3b82f6' }}
      />
    </div>
  );
}

// ==================== 主组件 ====================
export function LoginScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [rememberAccount, setRememberAccount] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
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
    if (simpleHash(password) !== CORRECT_HASH) {
      setError('密码错误');
      return;
    }

    setIsLoading(true);

    // 模拟验证
    await new Promise((r) => setTimeout(r, 800));

    if (rememberAccount) {
      localStorage.setItem(STORAGE_KEYS.REMEMBERED_ACCOUNT, account);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ACCOUNT, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBERED_ACCOUNT);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ACCOUNT);
    }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#f1f5f9' }}>
      {/* 背景 */}
      <CircuitBackground />

      {/* 装饰 */}
      <MathDecoration />
      <CodeDecoration />

      {/* 主内容 */}
      <div
        className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12"
      >
        <div
          className="w-full max-w-md"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Logo */}
          <div className="pt-10 pb-6 text-center">
            <div className="mb-4">
              <Logo />
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: '#1e3a5f',
                letterSpacing: '0.05em',
              }}
            >
              周报助手
            </h1>
            <p
              className="text-sm tracking-widest"
              style={{
                color: '#64748b',
                fontFamily: "'Segoe UI', sans-serif",
              }}
            >
              WEEKLY REPORT SYSTEM
            </p>

            {/* 分隔线 */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div
                className="h-px w-16"
                style={{ background: 'linear-gradient(90deg, transparent, #94a3b8)' }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#3b82f6' }}
              />
              <div
                className="h-px w-16"
                style={{ background: 'linear-gradient(90deg, #94a3b8, transparent)' }}
              />
            </div>
          </div>

          {/* 表单 */}
          <div className="px-10 pb-10">
            {!showForgot ? (
              <>
                <div className="space-y-6">
                  {/* 账号 */}
                  <StyledInput
                    type="text"
                    value={account}
                    onChange={setAccount}
                    onKeyDown={handleKeyDown}
                    placeholder="账号 (M 或 Y)"
                    autoFocus
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  />

                  {/* 密码 */}
                  <div className="relative">
                    <StyledInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                      onKeyDown={handleKeyDown}
                      placeholder="密码"
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* 记住选项 */}
                <div className="flex items-center justify-between mt-6">
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setRememberAccount(!rememberAccount)}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{
                        border: `2px solid ${rememberAccount ? '#3b82f6' : '#cbd5e1'}`,
                        background: rememberAccount ? '#3b82f6' : 'transparent',
                      }}
                    >
                      {rememberAccount && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-slate-600">记住账号</span>
                  </label>
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setRememberPassword(!rememberPassword)}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{
                        border: `2px solid ${rememberPassword ? '#3b82f6' : '#cbd5e1'}`,
                        background: rememberPassword ? '#3b82f6' : 'transparent',
                      }}
                    >
                      {rememberPassword && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-slate-600">记住密码</span>
                  </label>
                </div>

                {/* 错误 */}
                {error && (
                  <div
                    className="mt-6 py-3 px-4 rounded-lg text-center text-sm"
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full mt-6 py-4 rounded-xl font-semibold text-white text-lg transition-all disabled:opacity-70 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      验证中...
                    </span>
                  ) : (
                    '登 录'
                  )}
                </button>

                {/* 忘记密码 */}
                <button
                  onClick={() => setShowForgot(true)}
                  className="w-full mt-4 text-slate-500 text-sm hover:text-slate-700 transition-colors py-2"
                >
                  忘记密码？
                </button>
              </>
            ) : (
              <>
                <div className="text-center py-6">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">密码找回</h3>
                  <p className="text-slate-500 text-sm mb-6">请联系管理员重置密码</p>
                  {resetMessage && (
                    <p className="text-emerald-600 text-sm mb-4 font-medium">{resetMessage}</p>
                  )}
                  <button
                    onClick={() => {
                      setResetMessage('请联系管理员重置密码');
                      setTimeout(() => setShowForgot(false), 2000);
                    }}
                    className="w-full py-3 px-6 rounded-xl font-medium text-white transition-all mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    }}
                  >
                    确认重置
                  </button>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="w-full py-3 px-6 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all"
                  >
                    返回
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 底部 */}
          <div
            className="px-10 py-4 text-center rounded-b-xl"
            style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <p className="text-xs text-slate-400 tracking-wide">
              DATA ENCRYPTED · LOCAL STORAGE · GITHUB SYNC
            </p>
          </div>
        </div>
      </div>

      {/* 页脚信息 */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center z-10"
      >
        <p className="text-xs text-slate-400">
          Powered by AI · Built with Precision
        </p>
      </div>
    </div>
  );
}
