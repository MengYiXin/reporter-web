import { useState, useEffect } from 'react';

type ReportType = 'daily' | 'weekly' | 'monthly';
type ReportStyle = 'standard' | 'simple';
type ViewMode = 'calendar' | 'input' | 'result' | 'templates';
type AIModel = 'kimi' | 'deepseek' | 'zhipu' | 'qwen' | 'ernie';

interface DayEntry {
  date: string;
  dayName: string;
  content: string;
}

interface ModelConfig {
  name: string;
  endpoint: string;
  model: string;
  keyPlaceholder: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  type: 'daily' | 'weekly' | 'monthly';
}

const TEMPLATES: Template[] = [
  {
    id: 'standard-daily',
    name: '标准日报',
    description: '通用标准格式，适合大部分企业',
    type: 'daily',
    content: `【姓名日报】
日期：2024-01-15

一、今日完成工作总结
1. 完成了项目A的核心功能开发
2. 参加了团队周例会，讨论了Q2季度计划
3. 修复了用户反馈的3个bug
4. 编写了技术文档

二、明日工作计划
1. 继续项目A的功能测试
2. 与产品经理对接需求变更
3. Code Review

三、总结
今日工作整体顺利，核心功能开发完成度90%。`
  },
  {
    id: 'simple-daily',
    name: '简洁日报',
    description: '简短精炼，适合快速汇报',
    type: 'daily',
    content: `# 日报 - 2024-01-15

## 完成事项
- 项目A核心功能开发
- 团队周例会
- Bug修复 x3

## 明日计划
- 功能测试
- 需求对接
- Code Review

## 备注/问题
无阻塞项`
  },
  {
    id: 'tech-daily',
    name: '技术日报',
    description: '技术团队专用，突出技术工作',
    type: 'daily',
    content: `# 技术日报 | 2024-01-15

## 一、今日工作

### 1. 开发工作
- [x] 项目A核心模块开发（完成度90%）
- [x] 代码重构优化，移除冗余逻辑

### 2. 技术研究
- 调研了React Server Components适用场景
- 评估了新版本TypeScript 5.3新特性

### 3. 问题修复
- 修复了登录模块的并发问题
- 解决了预发布环境内存泄漏

## 二、明日计划
- [ ] 项目A功能测试
- [ ] 技术方案设计评审
- [ ] 参与招聘面试

## 三、学习/沉淀
- 整理了《微服务架构设计要点》文档大纲`
  },
  {
    id: 'standard-weekly',
    name: '标准周报',
    description: '通用周报格式',
    type: 'weekly',
    content: `【姓名周报】
日期：2024-01-15 至 2024-01-19

一、本周完成工作总结
1. 项目A核心功能开发（5个模块）
2. 项目B需求分析文档编写
3. 技术分享会准备与分享
4. 代码Review 8次
5. Bug修复12个

二、下周工作计划
1. 项目A功能测试与优化
2. 项目C启动与需求对接
3. 技术文档编写
4. 团队代码Review

三、总结
本周整体节奏良好，完成了预期目标。下周重点关注项目A的质量把控和项目C的启动。`
  },
  {
    id: 'simple-weekly',
    name: '简洁周报',
    description: '简洁周报，适合快速汇报',
    type: 'weekly',
    content: `# 周报汇总 | 2024-01-15~2024-01-19

## 本周完成
- 项目A核心模块开发
- 项目B需求分析
- 技术分享
- Code Review x8
- Bug修复 x12

## 下周计划
- 功能测试
- 项目C启动
- 文档编写

## 重点关注
- 项目A的质量
- 项目C的需求确认`
  },
  {
    id: 'pm-weekly',
    name: '项目管理周报',
    description: '适合PM/项目经理，突出项目进度',
    type: 'weekly',
    content: `# 项目管理周报 | 2024-01-15~2024-01-19

## 一、项目概览

| 项目 | 状态 | 进度 | 风险 |
|------|------|------|------|
| 项目A | 进行中 | 65% | 低 |
| 项目B | 需求中 | 20% | 中 |
| 项目C | 启动中 | 10% | 低 |

## 二、本周完成

### 项目A
- 核心功能开发完成
- 测试用例编写80%
- 发现并修复P0级bug 2个

### 项目B
- 需求调研完成
- PRD初稿完成，待评审

### 项目C
- 立项审批通过
- 团队组建完成

## 三、风险与问题
- 项目B：第三方接口文档不完整，可能影响进度
- 项目C：核心开发人员请假一周，需调整计划

## 四、下周计划
- 项目A进入测试阶段
- 项目B需求评审
- 项目C详细设计

## 五、资源需求
- 需要增加1名测试人员介入项目A`
  },
  {
    id: 'standard-monthly',
    name: '标准月报',
    description: '月度总结报告',
    type: 'monthly',
    content: `【姓名月报】
日期：2024年1月

一、本月完成工作总结
1. 核心业务开发
   - 项目A核心模块上线
   - 项目B第一阶段交付

2. 技术优化
   - 系统性能优化，响应时间降低40%
   - 自动化测试覆盖率提升至85%

3. 团队协作
   - 新人培训与Code Review
   - 技术分享2次

4. 其他
   - 参加行业技术峰会
   - 完成内部技术文档5篇

二、下月工作计划
1. 项目A上线准备
2. 项目C启动
3. 技术栈升级评估
4. Q2季度OKR制定

三、总结
本月整体目标达成较好，技术优化效果明显。下月重点关注项目A的上线质量和项目C的启动工作。`
  },
  {
    id: 'executive-monthly',
    name: '高管月报',
    description: '适合管理层，突出战略价值',
    type: 'monthly',
    content: `# 月度工作汇报 | 2024年1月

## 执行摘要
本月团队整体表现良好，核心项目推进顺利，重要指标达成率95%。

## 一、关键成果

### 业务成果
- 项目A提前5天完成核心功能，预计提前2周上线
- 项目B节省预算15%，效率提升20%

### 团队建设
- 团队规模从8人扩展到10人
- 核心成员留存率100%
- 2人获得晋升

### 技术突破
- 架构优化带动性能提升40%
- 技术债偿还比例达到60%

## 二、团队状态
| 维度 | 评分 | 变化 |
|------|------|------|
| 产出 | A | ↑ |
| 质量 | A- | → |
| 效率 | B+ | ↑ |
| 士气 | A | → |

## 三、风险与挑战
- 关键人才被竞争对手关注，需关注留存
- 某核心模块技术难度超预期，需增加资源

## 四、下月重点
1. 确保项目A高质量上线
2. 完成项目C的立项
3. 人才梯队建设

## 五、资源需求
- 申请追加预算用于人才激励
- 需要市场部配合项目A上线宣传`
  }
];

const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  kimi: {
    name: 'Kimi (Moonshot)',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    keyPlaceholder: 'sk-... (Kimi)',
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    keyPlaceholder: 'sk-... (DeepSeek)',
  },
  zhipu: {
    name: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    keyPlaceholder: 'sk-... (智谱)',
  },
  qwen: {
    name: '阿里 Qwen',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-turbo',
    keyPlaceholder: 'sk-... (阿里)',
  },
  ernie: {
    name: '百度文心',
    endpoint: 'https://qianfan.baidutop.com/v2/chat/completions',
    model: 'ernie-4.0-8k-lark',
    keyPlaceholder: 'sk-... (百度)',
  },
};

function getWeekDays(baseDate: Date = new Date()): DayEntry[] {
  const days: DayEntry[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const date = new Date(baseDate);
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + mondayOffset);

  for (let i = 0; i < 5; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      dayName: dayNames[d.getDay()],
      content: '',
    });
  }
  return days;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [reportStyle, setReportStyle] = useState<ReportStyle>('standard');
  const [weekDays, setWeekDays] = useState<DayEntry[]>(getWeekDays());
  const [selectedDay, setSelectedDay] = useState<string>(weekDays[0]?.date || '');
  const [generatedReport, setGeneratedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(weekDays[0]?.date || '');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('ai_api_key') || '');
  const [aiModel, setAiModel] = useState<AIModel>((localStorage.getItem('ai_model') as AIModel) || 'kimi');

  useEffect(() => {
    const saved = localStorage.getItem('weekEntries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weekStart === currentWeekStart) {
          setWeekDays(parsed.days);
        }
      } catch (e) {
        console.error('Failed to load saved entries');
      }
    }
  }, [currentWeekStart]);

  useEffect(() => {
    localStorage.setItem('weekEntries', JSON.stringify({ weekStart: currentWeekStart, days: weekDays }));
  }, [weekDays, currentWeekStart]);

  const goToPrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    const newWeekStart = d.toISOString().split('T')[0];
    setCurrentWeekStart(newWeekStart);
    setWeekDays(getWeekDays(d));
    setSelectedDay(getWeekDays(d)[0]?.date || '');
  };

  const goToNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    const newWeekStart = d.toISOString().split('T')[0];
    setCurrentWeekStart(newWeekStart);
    setWeekDays(getWeekDays(d));
    setSelectedDay(getWeekDays(d)[0]?.date || '');
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(today.toISOString().split('T')[0]);
    setWeekDays(getWeekDays(today));
    setSelectedDay(getWeekDays(today)[0]?.date || '');
  };

  const updateDayContent = (date: string, content: string) => {
    setWeekDays(weekDays.map(d => (d.date === date ? { ...d, content } : d)));
  };

  const getReportPrompt = (rt: string, rs: string, date: string, content: string): string => {
    const period = rt === 'daily' ? '日报' : rt === 'weekly' ? '周报' : '月报';

    if (rs === 'standard') {
      if (rt === 'daily') {
        return `请根据以下工作内容，生成标准的${period}。

日期：${date}

工作内容：
${content}

格式要求：
请严格按以下格式输出，不要添加任何其他内容：

【姓名日报】
日期：${date}

一、今日完成工作总结
1. （按优先级列出今日完成的工作）

二、明日工作计划
1. （列出明日计划做的工作）

三、总结
（简要总结今日工作心得或需要说明的事项）

请直接输出${period}内容，不需要其他说明。`;
      } else if (rt === 'weekly') {
        return `请根据以下周报内容，生成标准的周报。

日期范围：${date}

工作内容：
${content}

格式要求：
请严格按以下格式输出，不要添加任何其他内容：

【姓名周报】
日期：${date}

一、本周完成工作总结
1. （按优先级列出本周完成的工作）

二、下周工作计划
1. （列出下周计划做的工作）

三、总结
（简要总结本周工作心得或需要说明的事项）

请直接输出${period}内容，不需要其他说明。`;
      } else {
        return `请根据以下月报内容，生成标准的月报。

日期范围：${date}

工作内容：
${content}

格式要求：
请严格按以下格式输出，不要添加任何其他内容：

【姓名月报】
日期：${date}

一、本月完成工作总结
1. （按优先级列出本月完成的工作）

二、下月工作计划
1. （列出下月计划做的工作）

三、总结
（简要总结本月工作心得或需要说明的事项）

请直接输出${period}内容，不需要其他说明。`;
      }
    } else {
      if (rt === 'daily') {
        return `请将以下工作内容整理成一份简洁的${period}。

日期：${date}

工作内容：
${content}

格式要求：
- 语言简洁，直接陈述
- 以清单形式呈现关键事项
- 用 bullet point 列表

格式示例：
# ${period}
- 完成事项1
- 完成事项2
- 遇到的问题/挑战

请直接输出${period}内容，不需要其他说明。`;
      } else if (rt === 'weekly') {
        return `请将以下周报内容整理成一份简洁的周报。

日期范围：${date}

工作内容：
${content}

格式要求：
- 语言简洁，直接陈述
- 按日期分别列出工作
- 以清单形式呈现关键事项

格式示例：
# 周报汇总
## 周一
- 完成事项

## 周二
- 完成事项

请直接输出${period}内容，不需要其他说明。`;
      } else {
        return `请将以下月报内容整理成一份简洁的月报。

日期范围：${date}

工作内容：
${content}

格式要求：
- 语言简洁，直接陈述
- 按周分别列出工作
- 以清单形式呈现关键事项

格式示例：
# 月报汇总
## 第一周
- 完成事项

## 第二周
- 完成事项

请直接输出${period}内容，不需要其他说明。`;
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedReport('');

    try {
      if (!apiKey.trim()) {
        setGeneratedReport('Please set API Key first');
        return;
      }

      let content = '';
      let targetDate = '';

      if (reportType === 'daily') {
        const day = weekDays.find(d => d.date === selectedDay);
        if (!day) {
          setGeneratedReport('Please select a date');
          return;
        }
        content = day.content;
        targetDate = selectedDay;
      } else {
        const filledDays = weekDays.filter(d => d.content.trim());
        if (filledDays.length === 0) {
          setGeneratedReport('Please fill in at least one day');
          return;
        }
        content = filledDays.map(d => `${d.dayName} (${d.date}):\n${d.content}`).join('\n\n');
        targetDate = `${weekDays[0].date} to ${weekDays[4].date}`;
      }

      if (!content.trim()) {
        setGeneratedReport(reportType === 'daily' ? 'Please input work content' : 'Please fill in at least one day');
        return;
      }

      const prompt = getReportPrompt(reportType, reportStyle, targetDate, content);
      const config = MODEL_CONFIGS[aiModel];

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setGeneratedReport(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        return;
      }

      let text = '';
      if (aiModel === 'kimi' || aiModel === 'deepseek' || aiModel === 'qwen') {
        text = data.choices?.[0]?.message?.content;
      } else if (aiModel === 'zhipu') {
        text = data.choices?.[0]?.message?.content;
      } else if (aiModel === 'ernie') {
        text = data.result?.choices?.[0]?.message?.content;
      }

      if (text) {
        setGeneratedReport(text);
        setViewMode('result');
      } else {
        setGeneratedReport('Failed to parse response\n' + JSON.stringify(data).substring(0, 200));
      }
    } catch (e) {
      setGeneratedReport(`Failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([generatedReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${selectedDay}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport);
    alert('Copied to clipboard');
  };

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    alert(`"${template.name}" copied to clipboard`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">Weekly Reporter</h1>
            <p className="text-sm text-[#6b7280] mt-1">AI-powered report generator</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={aiModel}
              onChange={e => {
                setAiModel(e.target.value as AIModel);
                localStorage.setItem('ai_model', e.target.value);
              }}
              className="px-3 py-2 text-sm bg-white border border-[#e5e7eb] rounded-lg text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1a1a2e] focus:ring-offset-1"
            >
              <option value="kimi">Kimi</option>
              <option value="deepseek">DeepSeek</option>
              <option value="zhipu">智谱 GLM</option>
              <option value="qwen">Qwen</option>
              <option value="ernie">文心</option>
            </select>
            <input
              type="password"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                localStorage.setItem('ai_api_key', e.target.value);
              }}
              placeholder={MODEL_CONFIGS[aiModel].keyPlaceholder}
              className="px-3 py-2 text-sm bg-white border border-[#e5e7eb] rounded-lg text-[#374151] w-40 focus:outline-none focus:ring-2 focus:ring-[#1a1a2e] focus:ring-offset-1"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl shadow-sm border border-[#e5e7eb]">
          {(['calendar', 'input', 'templates', 'result'] as ViewMode[]).map(tab => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
                viewMode === tab
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'text-[#6b7280] hover:text-[#1a1a2e] hover:bg-[#f3f4f6]'
              }`}
            >
              {tab === 'calendar' ? 'Calendar' : tab === 'input' ? 'Input' : tab === 'templates' ? 'Templates' : 'Result'}
            </button>
          ))}
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <button onClick={goToPrevWeek} className="p-2 hover:bg-[#f3f4f6] rounded-lg transition">
                  <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={goToToday} className="px-4 py-2 text-sm text-[#6b7280] hover:bg-[#f3f4f6] rounded-lg transition">Today</button>
                <button onClick={goToNextWeek} className="p-2 hover:bg-[#f3f4f6] rounded-lg transition">
                  <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <span className="text-sm text-[#374151] font-medium">{currentWeekStart}</span>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {weekDays.map(day => (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day.date)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedDay === day.date
                      ? 'bg-[#1a1a2e] text-white shadow-lg ring-2 ring-[#1a1a2e] ring-offset-2'
                      : day.content.trim()
                      ? 'bg-[#f0fdf4] text-[#166534] border-2 border-[#22c55e]'
                      : 'bg-[#fafafa] text-[#6b7280] hover:bg-[#f3f4f6] border border-[#e5e7eb]'
                  }`}
                >
                  <div className="text-xs font-medium opacity-70">{day.dayName}</div>
                  <div className="text-lg font-semibold mt-1">{formatDateDisplay(day.date)}</div>
                  <div className="mt-3 text-xs h-10 overflow-hidden opacity-80">
                    {day.content ? (day.content.length > 40 ? day.content.substring(0, 40) + '...' : day.content) : 'Click to fill'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => { setReportType('daily'); handleGenerate(); }}
                disabled={loading}
                className="px-6 py-3 bg-[#22c55e] text-white text-sm font-medium rounded-xl hover:bg-[#16a34a] transition disabled:opacity-50 shadow-sm"
              >
                Generate Daily Report
              </button>
              <button
                onClick={() => { setReportType('weekly'); handleGenerate(); }}
                disabled={loading}
                className="px-6 py-3 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition disabled:opacity-50 shadow-sm"
              >
                Generate Weekly Report
              </button>
            </div>
          </div>
        )}

        {/* Input View */}
        {viewMode === 'input' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
            <div className="flex items-center gap-4 mb-6">
              <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="px-4 py-2.5 text-sm bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]">
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
              <select value={reportStyle} onChange={e => setReportStyle(e.target.value as ReportStyle)} className="px-4 py-2.5 text-sm bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]">
                <option value="standard">Standard Format</option>
                <option value="simple">Simple Format</option>
              </select>
              {reportType === 'daily' && (
                <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="px-4 py-2.5 text-sm bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]" />
              )}
            </div>

            <textarea
              placeholder={reportType === 'daily' ? 'Enter today\'s work content...' : reportType === 'weekly' ? 'Enter weekly work summary...\n\nOr click "Calendar" to view auto-filled daily entries' : 'Enter monthly work summary...'}
              value={reportType === 'daily' ? weekDays.find(d => d.date === selectedDay)?.content || '' : weekDays.filter(d => d.content.trim()).map(d => `[${d.dayName}] ${d.content}`).join('\n\n')}
              onChange={e => { if (reportType === 'daily') updateDayContent(selectedDay, e.target.value); }}
              className="w-full h-64 px-4 py-3 text-sm bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-[#374151] resize-none focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
            />

            <button onClick={handleGenerate} disabled={loading} className="w-full mt-4 py-3.5 bg-[#1a1a2e] text-white text-sm font-medium rounded-xl hover:bg-[#2d2d4a] transition disabled:opacity-50">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        )}

        {/* Templates View */}
        {viewMode === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a2e]">Report Templates</h2>
                <p className="text-sm text-[#6b7280] mt-1">Click to copy template to clipboard</p>
              </div>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value as ReportType)}
                className="px-4 py-2.5 text-sm bg-white border border-[#e5e7eb] rounded-xl text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.filter(t => t.type === reportType).map(template => (
                <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-[#1a1a2e]">{template.name}</h3>
                      <p className="text-xs text-[#6b7280] mt-1">{template.description}</p>
                    </div>
                    <button
                      onClick={() => copyTemplate(template)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#f3f4f6] text-[#374151] rounded-lg hover:bg-[#e5e7eb] transition"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs text-[#6b7280] whitespace-pre-wrap bg-[#fafafa] p-3 rounded-lg max-h-40 overflow-auto">{template.content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result View */}
        {viewMode === 'result' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">
                {reportType === 'daily' ? 'Daily' : reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report
              </h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-4 py-2 text-sm bg-[#f3f4f6] text-[#374151] rounded-lg hover:bg-[#e5e7eb] transition font-medium">
                  Copy
                </button>
                <button onClick={handleExport} className="px-4 py-2 text-sm bg-[#f3f4f6] text-[#374151] rounded-lg hover:bg-[#e5e7eb] transition font-medium">
                  Export
                </button>
                <button onClick={() => setViewMode('calendar')} className="px-4 py-2 text-sm bg-[#1a1a2e] text-white rounded-lg hover:bg-[#2d2d4a] transition font-medium">
                  Back
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-[#374151] bg-[#fafafa] p-5 rounded-xl overflow-auto max-h-[500px] leading-relaxed">{generatedReport}</pre>
          </div>
        )}

        {/* Footer */}
        {viewMode === 'calendar' && (
          <div className="mt-6 text-center text-xs text-[#9ca3af]">
            Data auto-saved to browser local storage
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
