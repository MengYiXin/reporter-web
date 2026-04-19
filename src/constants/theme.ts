// 暗色主题颜色
export const COLORS = {
  bg: '#0a0a0a',
  card: '#111111',
  primary: '#1c1c1c',
  accent: '#3b82f6',
  text: '#e0e0e0',
  muted: '#888888',
  border: '#2a2a2a',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

// 按钮样式
export const BUTTON_STYLES = {
  primary: 'bg-[#22c55e] text-white hover:bg-[#16a34a]',
  secondary: 'bg-[#1c1c1c] text-[#b0b0b0] hover:text-white border border-[#2a2a2a]',
  accent: 'bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white',
  disabled: 'opacity-50 cursor-not-allowed',
} as const;

// 渐变样式
export const GRADIENTS = {
  primary: 'from-[#3b82f6] to-[#1d4ed8]',
  success: 'from-[#22c55e] to-[#16a34a]',
} as const;

// 阴影
export const SHADOWS = {
  card: 'shadow-lg',
  modal: 'bg-black/80',
} as const;
