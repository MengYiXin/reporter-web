import type { AIModel, ReportType } from '../types';
import { MODEL_CONFIGS } from '../constants';
import { getErrorMessage, NetworkError } from '../utils/error';

interface AIRequestOptions {
  apiKey: string;
  model: AIModel;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  timeoutMs?: number;
}

interface AIResponse {
  content: string;
  error?: string;
}

export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const { apiKey, model, systemPrompt, userPrompt, maxTokens = 2048, timeoutMs = 30000 } = options;

  if (!apiKey.trim()) {
    return { content: '', error: '请先设置 API Key' };
  }

  const config = MODEL_CONFIGS[model];
  let retries = 2;

  while (retries >= 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.error) {
        return { content: '', error: `API 错误：${data.error.message}` };
      }

      const text = data.choices?.[0]?.message?.content ||
                   data.result?.choices?.[0]?.message?.content || '';

      if (!text) {
        return { content: '', error: '生成失败：无法解析响应' };
      }

      return { content: text };

    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          if (retries === 0) {
            return { content: '', error: '请求超时，请检查网络后重试' };
          }
          retries--;
          continue;
        }
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return { content: '', error: new NetworkError().message };
        }
      }

      if (retries === 0) {
        return { content: '', error: `生成失败：${getErrorMessage(error)}` };
      }
      retries--;
    }
  }

  return { content: '', error: '生成失败：未知错误' };
}

// 科技公司日报/周报 prompt
export function buildTechReportPrompt(
  type: ReportType,
  targetDate: string,
  content: string
): { systemPrompt: string; userPrompt: string } {
  const period = type === 'daily' ? '日报' : type === 'weekly' ? '周报' : '月报';

  const systemPrompt = `你是科技公司高管助理，擅长撰写简洁专业的工作汇报。

【输出风格】
- 语言简洁精炼，避免废话
- 使用主动句式，动作主体明确
- 量化成果（如：效率提升40%、交付3个模块）
- 语气专业自信，不卑不亢

【格式规范】
- 标题：【姓名${period}】
- 日期：YYYY-MM-DD
- 一、今日/本周完成工作总结（分点列举，每点一行）
- 二、明日/下周工作计划（分点列举，每点一行）
- 三、总结（一句话概括）

【注意事项】
- 只输出内容，不做任何说明
- 内容从执行者视角撰写
- 工作内容按重要性排序`;

  const userPrompt = `请根据以下工作内容，生成标准的${period}：

日期：${targetDate}
工作内容：
${content}`;

  return { systemPrompt, userPrompt };
}

// 三江周报 prompt
export function buildSJCReportPrompt(
  weekRange: string,
  department: string,
  content: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `你是三江供应链公司办公室秘书，擅长撰写国企风格的正式工作汇报。

【输出风格】
- 语言正式严谨，符合国企公文规范
- 体现政治站位和责任担当
- 工作表述客观准确，忌夸大邀功
- 善于用"持续推进"、"扎实开展"、"有效落实"等国企常用表达

【格式规范】
严格按以下结构输出：

【三江供应链公司重点工作推进情况表】
日期范围：${weekRange}
部门：${department}

一、本周完成工作情况
（按板块分类，每板块用小标题，列出具体工作及完成情况）

二、下周工作计划
（按板块分类，每板块列出下周计划）

三、存在问题
（如实反映，简洁扼要）

四、需协调解决事项
（如有需上级领导协调的问题，列明具体事项）

【注意事项】
- 只输出内容，不做任何说明解释
- 内容真实准确，不弄虚作假
- 问题部分不回避，实事求是`;

  const userPrompt = `请根据以下工作记录，生成周报：

日期范围：${weekRange}
部门：${department}

工作记录：
${content}`;

  return { systemPrompt, userPrompt };
}

// AI 单元格填充 prompt
export function buildCellExpandPrompt(
  categoryName: string,
  field: 'thisWeek' | 'cumulative' | 'nextWeek' | 'issues' | 'coordination',
  context: {
    thisWeek?: string;
    cumulative?: string;
    lastCumulative?: string;
    nextWeekPlan?: string;
    issues?: string;
    status?: string;
  }
): string {
  switch (field) {
    case 'thisWeek':
      return `请根据以下工作板块的名称，生成该板块的本周工作描述。

板块名称：${categoryName}
已有内容：${context.thisWeek || '无'}

请扩写成一段流畅的工作描述，包含具体做了什么、进展如何、取得了什么成果。

只需输出一段文字，不要加标题。`;

    case 'cumulative':
      return `请根据以下信息，生成累计完成情况描述。

板块：${categoryName}
本周完成：${context.thisWeek}
上周累计：${context.lastCumulative || '无'}
工作状态：${context.status || '进行中'}

请描述截至目前的工作完成进度（包括历史累计和本周进展）。

只需输出一段文字。`;

    case 'nextWeek':
      return `请根据以下信息，生成下周工作计划。

板块：${categoryName}
本周完成：${context.thisWeek}
累计完成：${context.cumulative || '无'}
存在问题：${context.issues || '无'}

请基于本周进展和遗留问题，列出下周的工作计划。

只需输出一段文字。`;

    case 'issues':
      return `请根据本周工作内容，分析可能存在的问题和困难。

板块：${categoryName}
本周完成：${context.thisWeek}
累计完成：${context.cumulative || '无'}

请列出可能存在的问题（资金、审批、外部依赖等）。

只需输出一段文字。`;

    case 'coordination':
      return `请根据本周工作内容，列出需协调解决的事项。

板块：${categoryName}
本周完成：${context.thisWeek}
存在问题：${context.issues || '无'}

请列出需领导或跨部门协调解决的事项。

只需输出一段文字。`;

    default:
      return '';
  }
}
