import type { AIModel, ModelConfig } from '../types';

export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  kimi: { name: 'Kimi', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k', keyPlaceholder: 'sk-...' },
  deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat', keyPlaceholder: 'sk-...' },
  zhipu: { name: '智谱 GLM', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash', keyPlaceholder: 'sk-...' },
  qwen: { name: '阿里 Qwen', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', model: 'qwen-turbo', keyPlaceholder: 'sk-...' },
  ernie: { name: '百度文心', endpoint: 'https://qianfan.baidutop.com/v2/chat/completions', model: 'ernie-4.0-8k-lark', keyPlaceholder: 'sk-...' },
};

// AI 模型列表（用于下拉选择）
export const AI_MODEL_OPTIONS: { value: AIModel; label: string }[] = [
  { value: 'kimi', label: 'Kimi' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'zhipu', label: '智谱 GLM' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'ernie', label: '文心' },
];
