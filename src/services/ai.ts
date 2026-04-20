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
序号.项目名称：具体工作内容（分号分隔多项工作）
示例：
1.远东铜杆：专题会研判项目可行性；合同条款戳商。
2.重庆钢材：约时间座谈；协商具体合作项目及模式。
3.川商投业务：持续跟进；对接业务需求。
4.森蓝光学镜片：持续跟进；对接业务需求及设备情况。

三、存在问题
（如实反映，简洁扼要）

四、需协调解决事项
（如有需上级领导协调的问题，列明具体事项）

【特别注意】输入内容包含两个板块：业务执行板块、拓展业务板块。输出时请严格按以下格式：

【业务执行板块】（重要项目用⭐标记）：
⭐1.项目名称：工作内容1；工作内容2；工作内容3。
2.项目名称：工作内容1；工作内容2。
3.项目名称：工作内容1。

【拓展业务板块】：
1.项目名称：工作内容1；工作内容2。
2.项目名称：工作内容1。

【关键要求】
- 每条工作占一行，格式为：序号.项目名称：工作内容1；工作内容2；工作内容3。
- 分号用于分隔同一项目的多项工作
- 不要把多条工作连在一起写，每条工作的多项内容用分号分隔
- 重要项目用⭐标记
- 序号使用1.2.3.4等阿拉伯数字

【注意事项】
- 只输出内容，不做任何说明解释
- 内容真实准确，不弄虚作假
- 问题部分不回避，实事求是

示例完整输出：
业务执行板块：
⭐1.普什案件：前往厦门了解业务交易信息；与相关人员座谈。
2.棉纱业务：完成合同催收；组织财务风控商讨。
3.鸡蛋业务：与律师沟通；建议签订补充协议。
拓展业务板块：
1.磷矿：完成项目进展情况报告。
2.重庆钢材：无进展；待座谈协商。
3.远东铜杆：完成座谈；达成合作意向；合同条款讨论。
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

要求：
- 输出格式为：序号.项目名称：工作内容1；工作内容2；工作内容3。
- 每条工作单独一行，不要连贯描述
- 分号用于分隔同一项目的多项工作
- 重要项目用⭐标记
- 不要写"本周...工作进展顺利"、"综上所述"等连贯段落

只需输出格式化内容，不要加标题。`;

    case 'cumulative':
      return `请根据以下信息，生成累计完成情况描述。

板块：${categoryName}
本周完成：${context.thisWeek}
上周累计：${context.lastCumulative || '无'}
工作状态：${context.status || '进行中'}

要求：
- 输出格式为：序号.项目名称：累计内容1；累计内容2。
- 每条单独一行，分号分隔多项
- 不要写连贯段落描述

只需输出格式化内容。`;

    case 'nextWeek':
      return `请根据以下信息，生成下周工作计划。

板块：${categoryName}
本周完成：${context.thisWeek}
累计完成：${context.cumulative || '无'}
存在问题：${context.issues || '无'}

要求：
- 输出格式为：序号.项目名称：计划内容1；计划内容2。
- 每条单独一行，分号分隔多项
- 不要写连贯段落

只需输出格式化内容。`;

    case 'issues':
      return `请根据本周工作内容，分析可能存在的问题。

板块：${categoryName}
本周完成：${context.thisWeek}
累计完成：${context.cumulative || '无'}

要求：
- 输出格式为：序号.问题描述。
- 每条单独一行
- 不要写连贯段落

只需输出格式化内容。`;

    case 'coordination':
      return `请根据本周工作内容，列出需协调解决的事项。

板块：${categoryName}
本周完成：${context.thisWeek}
存在问题：${context.issues || '无'}

要求：
- 输出格式为：序号.协调事项。
- 每条单独一行
- 不要写连贯段落

只需输出格式化内容。`;

    default:
      return '';
  }
}
