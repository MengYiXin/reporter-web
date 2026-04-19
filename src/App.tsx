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

interface StoredData {
  apiKey: string;
  aiModel: string;
  weekEntries: {
    [weekStart: string]: {
      date: string;
      dayName: string;
      content: string;
    }[];
  };
}

const GIST_FILENAME = 'weekly-reporter-data.json';
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
    name: 'Kimi (月之暗面)',
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
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

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
  return `${d.getMonth() + 1}月${d.getDate()}日`;
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
  const [ghToken, setGhToken] = useState<string>(localStorage.getItem('gh_token') || '');
  const [gistId, setGistId] = useState<string>(localStorage.getItem('gist_id') || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const uploadToGithub = async () => {
    if (!ghToken) {
      alert('请先输入 GitHub Token');
      return;
    }
    setSyncStatus('syncing');
    try {
      const storedData: StoredData = {
        apiKey,
        aiModel,
        weekEntries: {
          [currentWeekStart]: weekDays
        }
      };
      const content = JSON.stringify(storedData, null, 2);

      if (gistId) {
        await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: {
              [GIST_FILENAME]: { content }
            }
          })
        });
      } else {
        const response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: 'Weekly Reporter Data',
            public: false,
            files: {
              [GIST_FILENAME]: { content }
            }
          })
        });
        const data = await response.json();
        if (data.id) {
          setGistId(data.id);
          localStorage.setItem('gist_id', data.id);
        }
      }
      setSyncStatus('success');
      alert('上传成功！');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e) {
      console.error('Failed to upload:', e);
      setSyncStatus('error');
      alert('上传失败！');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const downloadFromGithub = async () => {
    if (!ghToken || !gistId) {
      alert('请先确保已上传过数据，并且 GitHub Token 和 Gist ID 都已设置');
      return;
    }
    setSyncStatus('syncing');
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `Bearer ${ghToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.files[GIST_FILENAME]?.content;
        if (content) {
          const parsed: StoredData = JSON.parse(content);
          if (parsed.apiKey) {
            setApiKey(parsed.apiKey);
            localStorage.setItem('ai_api_key', parsed.apiKey);
          }
          if (parsed.aiModel) {
            setAiModel(parsed.aiModel as AIModel);
            localStorage.setItem('ai_model', parsed.aiModel);
          }
          if (parsed.weekEntries && parsed.weekEntries[currentWeekStart]) {
            setWeekDays(parsed.weekEntries[currentWeekStart]);
          }
          setSyncStatus('success');
          alert('下载成功！');
        } else {
          alert('Gist 中没有找到数据文件');
          setSyncStatus('error');
        }
      } else {
        alert('下载失败，请检查 Token 和 Gist ID 是否正确');
        setSyncStatus('error');
      }
    } catch (e) {
      console.error('Failed to download:', e);
      setSyncStatus('error');
      alert('下载失败！');
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const getReportPrompt = (rt: string, rs: string, date: string, content: string): string => {
    const period = rt === 'daily' ? '日报' : rt === 'weekly' ? '周报' : '月报';
    if (rs === 'standard') {
      if (rt === 'daily') {
        return `请根据以下工作内容，生成标准的${period}。日期：${date}。工作内容：${content}。格式要求：【姓名日报】日期：${date}。一、今日完成工作总结1. （按优先级列出今日完成的工作）。二、明日工作计划1. （列出明日计划做的工作）。三、总结。请直接输出${period}内容。`;
      } else if (rt === 'weekly') {
        return `请根据以下周报内容，生成标准的周报。日期范围：${date}。工作内容：${content}。格式要求：【姓名周报】日期：${date}。一、本周完成工作总结1. （按优先级列出本周完成的工作）。二、下周工作计划1. （列出下周计划做的工作）。三、总结。请直接输出${period}内容。`;
      } else {
        return `请根据以下月报内容，生成标准的月报。日期范围：${date}。工作内容：${content}。格式要求：【姓名月报】日期：${date}。一、本月完成工作总结1. （按优先级列出本月完成的工作）。二、下月工作计划1. （列出下月计划做的工作）。三、总结。请直接输出${period}内容。`;
      }
    } else {
      return `请将以下${period}内容整理成简洁格式。工作内容：${content}。格式要求：语言简洁，bullet point列表。请直接输出${period}内容。`;
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedReport('');

    try {
      if (!apiKey.trim()) {
        setGeneratedReport('请先设置 API Key');
        return;
      }

      let content = '';
      let targetDate = '';

      if (reportType === 'daily') {
        const day = weekDays.find(d => d.date === selectedDay);
        if (!day) {
          setGeneratedReport('请选择一个日期');
          return;
        }
        content = day.content;
        targetDate = selectedDay;
      } else {
        const filledDays = weekDays.filter(d => d.content.trim());
        if (filledDays.length === 0) {
          setGeneratedReport('请至少填写一天的工作内容');
          return;
        }
        content = filledDays.map(d => `${d.dayName} (${d.date}):\n${d.content}`).join('\n\n');
        targetDate = `${weekDays[0].date} 至 ${weekDays[4].date}`;
      }

      if (!content.trim()) {
        setGeneratedReport(reportType === 'daily' ? '请输入工作内容' : '请至少填写一天的工作内容');
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
        setGeneratedReport(`API 错误：${data.error.message || JSON.stringify(data.error)}`);
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
        setGeneratedReport('生成失败：无法解析响应');
      }
    } catch (e) {
      setGeneratedReport(`生成失败：${e}`);
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
    alert('已复制到剪贴板');
  };

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    alert(`"${template.name}" 已复制到剪贴板`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className={`max-w-6xl mx-auto px-4 py-6 ${isMobile ? 'px-3' : 'px-6 py-8'}`}>
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between mb-6 ${isMobile ? 'gap-3' : 'mb-8'}`}>
          <div>
            <h1 className={`font-semibold text-white tracking-tight ${isMobile ? 'text-xl' : 'text-2xl'}`}>周报助手</h1>
            <p className={`text-[#888888] mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>AI 智能报告生成器</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={aiModel}
              onChange={e => {
                setAiModel(e.target.value as AIModel);
                localStorage.setItem('ai_model', e.target.value);
              }}
              className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
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
              placeholder="API Key"
              className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] w-24 sm:w-32 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            />
            <input
              type="password"
              value={ghToken}
              onChange={e => {
                setGhToken(e.target.value);
                localStorage.setItem('gh_token', e.target.value);
              }}
              placeholder="GH Token"
              className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] w-24 sm:w-32 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            />
          </div>
        </div>

        {/* Sync Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={uploadToGithub}
            disabled={syncStatus === 'syncing'}
            className="px-3 py-1.5 text-xs bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition disabled:opacity-50"
          >
            {syncStatus === 'syncing' ? '上传中...' : '上传到 GitHub'}
          </button>
          <button
            onClick={downloadFromGithub}
            disabled={syncStatus === 'syncing'}
            className="px-3 py-1.5 text-xs bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition disabled:opacity-50"
          >
            {syncStatus === 'syncing' ? '下载中...' : '从 GitHub 下载'}
          </button>
          <span className="text-xs text-[#666666] self-center ml-2">
            {gistId ? `已绑定 Gist: ${gistId.substring(0, 10)}...` : '未绑定 Gist'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-4 bg-[#141414] p-1 rounded-xl border border-[#1f1f1f]">
          {(['calendar', 'input', 'templates', 'result'] as ViewMode[]).map(tab => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                viewMode === tab
                  ? 'bg-[#1c1c1c] text-white shadow-sm border border-[#2a2a2a]'
                  : 'text-[#666666] hover:text-[#b0b0b0] hover:bg-[#1a1a1a]'
              }`}
            >
              {tab === 'calendar' ? '日历' : tab === 'input' ? '输入' : tab === 'templates' ? '模板' : '结果'}
            </button>
          ))}
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button onClick={goToPrevWeek} className="p-2 hover:bg-[#1c1c1c] rounded-lg transition border border-transparent hover:border-[#2a2a2a]">
                  <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={goToToday} className="px-3 py-1.5 text-xs text-[#888888] hover:bg-[#1c1c1c] rounded-lg transition hover:text-[#b0b0b0] border border-transparent hover:border-[#2a2a2a]">今天</button>
                <button onClick={goToNextWeek} className="p-2 hover:bg-[#1c1c1c] rounded-lg transition border border-transparent hover:border-[#2a2a2a]">
                  <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <span className="text-xs text-[#666666] font-medium">{currentWeekStart}</span>
            </div>

            <div className={`grid gap-2 sm:gap-4 ${isMobile ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-5'}`}>
              {weekDays.map(day => (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day.date)}
                  className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all text-xs sm:text-sm ${
                    selectedDay === day.date
                      ? 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111111]'
                      : day.content.trim()
                      ? 'bg-[#1a2618] text-[#4ade80] border border-[#22c55e]/30'
                      : 'bg-[#161616] text-[#666666] hover:bg-[#1c1c1c] border border-[#252525]'
                  }`}
                >
                  <div className="text-xs font-medium opacity-60">{day.dayName}</div>
                  <div className={`font-semibold mt-1 text-inherit ${isMobile ? 'text-sm' : 'text-base'}`}>{formatDateDisplay(day.date)}</div>
                  <div className="mt-2 sm:mt-3 h-8 sm:h-10 overflow-hidden opacity-70">
                    {day.content ? (day.content.length > 30 ? day.content.substring(0, 30) + '...' : day.content) : '点击填写'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => { setReportType('daily'); handleGenerate(); }}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#22c55e] text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-[#16a34a] transition disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                生成日报
              </button>
              <button
                onClick={() => { setReportType('weekly'); handleGenerate(); }}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#3b82f6] text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-[#2563eb] transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                生成周报
              </button>
            </div>
          </div>
        )}

        {/* Input View */}
        {viewMode === 'input' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
                <option value="daily">日报</option>
                <option value="weekly">周报</option>
                <option value="monthly">月报</option>
              </select>
              <select value={reportStyle} onChange={e => setReportStyle(e.target.value as ReportStyle)} className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]">
                <option value="standard">标准格式</option>
                <option value="simple">简洁格式</option>
              </select>
              {reportType === 'daily' && (
                <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]" />
              )}
            </div>

            <textarea
              placeholder={reportType === 'daily' ? '输入今日工作内容...' : reportType === 'weekly' ? '输入本周工作内容汇总...' : '输入本月工作内容汇总...'}
              value={reportType === 'daily' ? weekDays.find(d => d.date === selectedDay)?.content || '' : weekDays.filter(d => d.content.trim()).map(d => `[${d.dayName}] ${d.content}`).join('\n\n')}
              onChange={e => { if (reportType === 'daily') updateDayContent(selectedDay, e.target.value); }}
              className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] resize-none focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            />

            <button onClick={handleGenerate} disabled={loading} className="w-full mt-4 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white text-sm font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-blue-500/20">
              {loading ? '生成中...' : '生成报告'}
            </button>
          </div>
        )}

        {/* Templates View */}
        {viewMode === 'templates' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">报告模板</h2>
                <p className="text-xs text-[#666666] mt-1">点击即可复制模板到剪贴板</p>
              </div>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value as ReportType)}
                className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              >
                <option value="daily">日报</option>
                <option value="weekly">周报</option>
                <option value="monthly">月报</option>
              </select>
            </div>

            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
              {TEMPLATES.filter(t => t.type === reportType).map(template => (
                <div key={template.id} className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f] hover:border-[#2a2a2a] transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white text-sm">{template.name}</h3>
                      <p className="text-xs text-[#666666] mt-0.5">{template.description}</p>
                    </div>
                    <button
                      onClick={() => copyTemplate(template)}
                      className="px-2 py-1 text-xs font-medium bg-[#1c1c1c] text-[#b0b0b0] rounded-lg hover:bg-[#252525] hover:text-white transition border border-[#2a2a2a]"
                    >
                      复制
                    </button>
                  </div>
                  <pre className="text-xs text-[#888888] whitespace-pre-wrap bg-[#0d0d0d] p-2 sm:p-3 rounded-lg max-h-28 sm:max-h-40 overflow-auto border border-[#1a1a1a]">{template.content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result View */}
        {viewMode === 'result' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                {reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'}结果
              </h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 text-xs sm:text-sm bg-[#1c1c1c] text-[#b0b0b0] rounded-lg hover:bg-[#252525] hover:text-white transition font-medium border border-[#2a2a2a]">
                  复制
                </button>
                <button onClick={handleExport} className="px-3 py-1.5 text-xs sm:text-sm bg-[#1c1c1c] text-[#b0b0b0] rounded-lg hover:bg-[#252525] hover:text-white transition font-medium border border-[#2a2a2a]">
                  导出
                </button>
                <button onClick={() => setViewMode('calendar')} className="px-3 py-1.5 text-xs sm:text-sm bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg shadow-blue-500/20">
                  返回
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#c0c0c0] bg-[#0d0d0d] p-3 sm:p-5 rounded-xl overflow-auto max-h-[400px] sm:max-h-[500px] leading-relaxed border border-[#1a1a1a]">{generatedReport}</pre>
          </div>
        )}

        {/* Footer */}
        {viewMode === 'calendar' && (
          <div className="mt-4 sm:mt-6 text-center text-xs text-[#444444]">
            数据默认保存在本地浏览器 · 点击按钮可同步到 GitHub
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
