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

  const systemPrompt = `你是国资控股市场化运行的科技公司商务/交付工程师，擅长撰写简洁务实的工作汇报。

【输出格式】
日期标题单独一行，例如：4月8日工作汇报:
然后用简洁条目式列出工作内容，每条一行，格式如：
1、项目名称 + 具体工作内容
2、项目名称 + 具体工作内容
...

【数量规则】
- 工作条目数量根据实际内容决定，不要固定条数
- 事情多则多写（5-8条），事情少则少写（3-4条）
- 每条内容要完整，不要拆分过碎
- 工作内容按重要性排序

【风格要求】
- 语言简洁务实，不要假大空
- 体现市场化运行的务实风格，不要过度修饰
- 工作表述客观准确，如实反映情况
- 语气平稳，不卑不亢

【示例格式】
4月8日工作汇报:
1、富顺天网项目商务测算
2、重庆东元项目清单输出
3、内江大模型项目参数清单输出
4、宜宾智算设备产品选型参数输出
5、乐山政务云推理设备商务测算
6、成都市局借测设备盖章流程推进
7、省公安厅8卡设备方案输出

【注意事项】
- 只输出内容，不做任何说明
- 内容从执行者视角撰写
- 条目数量根据实际工作量自动调整`;

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
（按板块分类，每板块列出下周计划，格式如下：）
序号.项目名称：具体工作内容（每条工作单独一行，分号结尾）
示例：
1.远东铜杆：专题会研判项目可行性；
2.合同条款戳商；
3.重庆钢材：约时间座谈；
4.协商具体合作项目及模式；
5.川商投业务：持续跟进；
6.对接业务需求；
7.森蓝光学镜片：持续跟进；
8.对接业务需求及设备情况；

三、存在问题
（如实反映，简洁扼要）

四、需协调解决事项
（如有需上级领导协调的问题，列明具体事项）

【特别注意】输入内容包含两个板块：业务执行板块、拓展业务板块。输出时请按以下格式：
每条工作单独一行，行末用分号结尾，不要把多句话连在一起写。

【业务执行板块格式】（重要项目用⭐标记）：
⭐1.项目名称：具体工作；
具体工作；
具体工作；
2.项目名称：具体工作；
具体工作；

【拓展业务板块格式】：
1.项目名称：具体工作；
具体工作；
2.项目名称：具体工作；
具体工作；

【关键要求】
- 每条工作单独一行，不要多句话连在一起
- 分号用于分隔同一项目的多项工作
- 每行都要有明确的序号
- 重要项目用⭐标记

【注意事项】
- 只输出内容，不做任何说明解释
- 内容真实准确，不弄虚作假
- 问题部分不回避，实事求是

示例完整输出：
业务执行板块：
⭐1.普什案件：前往厦门了解业务交易信息；
与相关人员座谈；
2.棉纱业务：完成合同催收；
组织财务风控商讨；
3.鸡蛋业务：与律师沟通；
建议签订补充协议；
拓展业务板块：
1.磷矿：完成项目进展情况报告；
2.重庆钢材：无进展；
待座谈协商；`;

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
