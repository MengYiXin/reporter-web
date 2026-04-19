import { useState, useEffect } from 'react';

type ReportType = 'daily' | 'weekly' | 'monthly';
type ReportStyle = 'standard' | 'simple';
type ViewMode = 'calendar' | 'input' | 'result' | 'templates' | 'sjc';
type AIModel = 'kimi' | 'deepseek' | 'zhipu' | 'qwen' | 'ernie';
type UserMode = 'm' | 'y' | null;

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

// 三江周报表格数据结构
interface SJCCellRow {
  thisWeek: string;
  cumulative: string;
  nextWeek: string;
  issues: string;
  coordination: string;
  leader: string;
  owner: string;
}

interface SJCCategory {
  name: string;
  rows: SJCCellRow;
}

interface SJCWeekData {
  weekStart: string;
  department: string;
  categories: SJCCategory[];
}

const SJC_CATEGORIES = ['考核指标板块', '回款板块', '业务执行板块', '拓展业务板块', '其他工作板块'];

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
  kimi: { name: 'Kimi', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k', keyPlaceholder: 'sk-...' },
  deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat', keyPlaceholder: 'sk-...' },
  zhipu: { name: '智谱 GLM', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash', keyPlaceholder: 'sk-...' },
  qwen: { name: '阿里 Qwen', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', model: 'qwen-turbo', keyPlaceholder: 'sk-...' },
  ernie: { name: '百度文心', endpoint: 'https://qianfan.baidutop.com/v2/chat/completions', model: 'ernie-4.0-8k-lark', keyPlaceholder: 'sk-...' },
};

function getWeeks(): { weekStart: string; days: DayEntry[]; label: string }[] {
  const weeks: { weekStart: string; days: DayEntry[]; label: string }[] = [];
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const currentMonday = new Date(currentDate);
  currentMonday.setDate(currentDate.getDate() + mondayOffset);

  for (let weekOffset = -1; weekOffset <= 1; weekOffset++) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() + weekOffset * 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const label = weekOffset === -1 ? '上周' : weekOffset === 0 ? '本周' : '下周';
    const days: DayEntry[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d.toISOString().split('T')[0], dayName: dayNames[d.getDay()], content: '' });
    }
    weeks.push({ weekStart: weekStartStr, days, label });
  }
  return weeks;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const endDay = new Date(d);
  endDay.setDate(endDay.getDate() + 4);
  return `${d.getMonth() + 1}/${d.getDate()} - ${endDay.getMonth() + 1}/${endDay.getDate()}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getWeekRange(date: Date = new Date()): string {
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return `${monday.getMonth() + 1}月${monday.getDate()}日-${friday.getMonth() + 1}月${friday.getDate()}日`;
}

function App() {
  const [userMode, setUserMode] = useState<UserMode>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [reportStyle, setReportStyle] = useState<ReportStyle>('standard');
  const [allData, setAllData] = useState<Record<string, DayEntry[]>>({});
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('ai_api_key') || '');
  const [aiModel, setAiModel] = useState<AIModel>((localStorage.getItem('ai_model') as AIModel) || 'kimi');
  const [ghToken, setGhToken] = useState<string>(localStorage.getItem('gh_token') || '');
  const [gistId, setGistId] = useState<string>(localStorage.getItem('gist_id') || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isMobile, setIsMobile] = useState(false);

  // 三江相关状态
  const [sjcData, setSjcData] = useState<SJCWeekData | null>(null);

  // 初始化三江周报数据
  const initSJCData = (): SJCWeekData => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];

    return {
      weekStart,
      department: '运营管理二部',
      categories: SJC_CATEGORIES.map(name => ({
        name,
        rows: {
          thisWeek: '',
          cumulative: '',
          nextWeek: '',
          issues: '',
          coordination: '',
          leader: '',
          owner: ''
        }
      }))
    };
  };

  // 更新三江表格单元格
  const updateSJCCell = (categoryIndex: number, field: keyof SJCCellRow, value: string) => {
    setSjcData(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.categories = [...prev.categories];
      updated.categories[categoryIndex] = { ...prev.categories[categoryIndex] };
      updated.categories[categoryIndex].rows = { ...prev.categories[categoryIndex].rows, [field]: value };
      return updated;
    });
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!userMode) return;
    const saved = localStorage.getItem('weekEntries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weekEntries) setAllData(parsed.weekEntries);
        else if (parsed.days && parsed.weekStart) setAllData({ [parsed.weekStart]: parsed.days });
      } catch (e) { console.error('Failed to load'); }
    }
  }, [userMode]);

  useEffect(() => {
    if (!userMode || userMode === 'y') {
      const savedSjc = localStorage.getItem('sjc_data');
      if (savedSjc) {
        try { setSjcData(JSON.parse(savedSjc)); } catch (e) {}
      } else {
        setSjcData(initSJCData());
      }
    }
  }, [userMode]);

  useEffect(() => {
    if (userMode === 'y' && sjcData) {
      localStorage.setItem('sjc_data', JSON.stringify(sjcData));
    }
  }, [sjcData, userMode]);

  const updateDayContent = (date: string, content: string) => {
    setAllData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(weekStart => {
        updated[weekStart] = updated[weekStart].map(d => d.date === date ? { ...d, content } : d);
      });
      return updated;
    });
  };

  const uploadToGithub = async () => {
    if (!ghToken) { alert('请先输入 GitHub Token'); return; }
    setSyncStatus('syncing');
    try {
      const storedData = {
        apiKey, aiModel, userMode,
        weekEntries: allData,
        sjcData: userMode === 'y' ? sjcData : undefined
      };
      const content = JSON.stringify(storedData, null, 2);
      if (gistId) {
        await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } })
        });
      } else {
        const response = await fetch('https://api.github.com/gists', {
          method: 'POST', headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Weekly Reporter Data', public: false, files: { [GIST_FILENAME]: { content } } })
        });
        const data = await response.json();
        if (data.id) { setGistId(data.id); localStorage.setItem('gist_id', data.id); }
      }
      setSyncStatus('success');
      alert('上传成功！');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e) {
      setSyncStatus('error');
      alert('上传失败！');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const downloadFromGithub = async () => {
    if (!ghToken || !gistId) { alert('请先确保已上传过数据'); return; }
    setSyncStatus('syncing');
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `Bearer ${ghToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.files[GIST_FILENAME]?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.weekEntries) setAllData(parsed.weekEntries);
          if (parsed.sjcData) setSjcData(parsed.sjcData);
          if (parsed.apiKey) { setApiKey(parsed.apiKey); localStorage.setItem('ai_api_key', parsed.apiKey); }
          setSyncStatus('success');
          alert('下载成功！');
        }
      }
    } catch (e) { setSyncStatus('error'); alert('下载失败！'); }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedReport('');
    try {
      if (!apiKey.trim()) { setGeneratedReport('请先设置 API Key'); return; }
      let content = '', targetDate = '';
      const weeks = getWeeks();
      const currentWeekData = allData[currentWeekStart] || weeks[1].days;

      if (reportType === 'daily') {
        if (!selectedDay) { setGeneratedReport('请选择一个日期'); return; }
        const dayEntry = Object.values(allData).flat().find(d => d.date === selectedDay);
        content = dayEntry?.content || '';
        targetDate = selectedDay;
      } else {
        const filledDays = Object.values(allData).flat().filter(d => d.content.trim());
        if (filledDays.length === 0) { setGeneratedReport('请至少填写一天的工作内容'); return; }
        content = filledDays.map(d => `${d.dayName} (${d.date}):\n${d.content}`).join('\n\n');
        targetDate = `${currentWeekData[0]?.date || ''} 至 ${currentWeekData[4]?.date || ''}`;
      }
      if (!content.trim()) { setGeneratedReport('请输入工作内容'); return; }

      const period = reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报';
      const prompt = `请根据以下工作内容，生成标准的${period}。日期：${targetDate}。工作内容：${content}。格式要求：【姓名${period}】日期：${targetDate}。一、今日/本周完成工作总结1. （按优先级列出）。二、明日/下周工作计划1. （列出）。三、总结。请直接输出${period}内容。`;

      const config = MODEL_CONFIGS[aiModel];
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
      });
      const data = await response.json();
      if (data.error) { setGeneratedReport(`API 错误：${data.error.message}`); return; }
      const text = data.choices?.[0]?.message?.content || data.result?.choices?.[0]?.message?.content || '';
      if (text) { setGeneratedReport(text); setViewMode('result'); }
      else { setGeneratedReport('生成失败：无法解析响应'); }
    } catch (e) { setGeneratedReport(`生成失败：${e}`); }
    finally { setLoading(false); }
  };

  // 生成三江周报
  const generateSJCReport = async () => {
    if (!sjcData) return;
    setLoading(true);
    setGeneratedReport('');
    try {
      if (!apiKey.trim()) { setGeneratedReport('请先设置 API Key'); return; }

      const hasContent = sjcData.categories.some(c => c.rows.thisWeek.trim() || c.rows.cumulative.trim());
      if (!hasContent) { setGeneratedReport('请至少填写本周完成情况'); return; }

      const weekRange = getWeekRange();
      const content = sjcData.categories.map(c =>
        `【${c.name}】\n本周完成情况：${c.rows.thisWeek || '无'}\n累计完成情况：${c.rows.cumulative || '无'}\n下一步工作计划：${c.rows.nextWeek || '无'}\n存在问题：${c.rows.issues || '无'}\n需协调解决事项：${c.rows.coordination || '无'}\n分管领导：${c.rows.leader || '无'}\n责任人：${c.rows.owner || '无'}`
      ).join('\n\n');

      const prompt = `请根据以下三江供应链公司周报内容，生成标准的周报。

日期范围：${weekRange}
部门：${sjcData.department}

工作记录：
${content}

请按以下格式生成周报：

【三江供应链公司重点工作推进情况表】
日期范围：${weekRange}
部门：${sjcData.department}

一、本周完成工作情况
（按板块分类列出各项工作的完成情况）

二、下周工作计划
（列出各项工作的下周计划）

三、存在问题
（如有）

四、需协调解决事项
（如有需领导协调解决的问题）

请直接输出周报内容，不需要其他说明。`;

      const config = MODEL_CONFIGS[aiModel];
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
      });
      const data = await response.json();
      if (data.error) { setGeneratedReport(`API 错误：${data.error.message}`); return; }
      const text = data.choices?.[0]?.message?.content || '';
      if (text) { setGeneratedReport(text); setViewMode('result'); }
      else { setGeneratedReport('生成失败：无法解析响应'); }
    } catch (e) { setGeneratedReport(`生成失败：${e}`); }
    finally { setLoading(false); }
  };

  // AI填充单元格
  const expandSJCCell = async (categoryIndex: number, field: keyof SJCCellRow) => {
    if (!sjcData) return;
    const category = sjcData.categories[categoryIndex];
    if (!category.rows.thisWeek.trim() && field === 'thisWeek') { alert('请先填写本周工作内容'); return; }
    if (!apiKey.trim()) { alert('请先设置 API Key'); return; }

    setLoading(true);
    try {
      let prompt = '';
      if (field === 'thisWeek') {
        prompt = `请根据以下工作板块的名称，生成该板块的本周工作描述。

板块名称：${category.name}
当前内容：${category.rows.thisWeek || '无'}

请扩写成一段流畅的工作描述，包含具体做了什么、进展如何、取得了什么成果。

只需输出一段文字，不要加标题。`;
      } else if (field === 'cumulative') {
        prompt = `请根据本周工作内容，生成累计完成情况描述。

板块：${category.name}
本周完成：${category.rows.thisWeek}

请描述截至目前的工作完成进度。

只需输出一段文字。`;
      } else if (field === 'nextWeek') {
        prompt = `请根据本周工作内容，生成下周工作计划。

板块：${category.name}
本周完成：${category.rows.thisWeek}

请列出下周的工作计划。

只需输出一段文字。`;
      } else if (field === 'issues') {
        prompt = `请根据本周工作内容，分析可能存在的问题。

板块：${category.name}
本周完成：${category.rows.thisWeek}

请列出可能存在的问题。

只需输出一段文字。`;
      } else if (field === 'coordination') {
        prompt = `请根据本周工作内容，列出需协调解决的事项。

板块：${category.name}
本周完成：${category.rows.thisWeek}

请列出需领导或跨部门协调解决的事项。

只需输出一段文字。`;
      }

      if (!prompt) return;

      const config = MODEL_CONFIGS[aiModel];
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], max_tokens: 512 }),
      });
      const data = await response.json();
      if (data.error) { alert(`API 错误：${data.error.message}`); return; }
      const text = data.choices?.[0]?.message?.content || '';
      if (text) {
        updateSJCCell(categoryIndex, field, text);
      } else { alert('生成失败'); }
    } catch (e) { alert(`生成失败：${e}`); }
    finally { setLoading(false); }
  };

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    alert(`"${template.name}" 已复制到剪贴板`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReport);
    alert('已复制到剪贴板');
  };

  const handleExport = () => {
    const blob = new Blob([generatedReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `周报_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // User Selection Screen
  if (!userMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="bg-[#111111] rounded-2xl p-8 border border-[#1f1f1f] max-w-md w-full mx-4">
          <h1 className="text-2xl font-semibold text-white text-center mb-2">周报助手</h1>
          <p className="text-[#888888] text-center mb-8">AI 智能报告生成器</p>
          <p className="text-[#666666] text-center mb-6 text-sm">请选择您的身份</p>
          <div className="space-y-4">
            <button
              onClick={() => setUserMode('m')}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
            >
              M
              <span className="block text-sm opacity-70 font-normal mt-1">科技公司</span>
            </button>
            <button
              onClick={() => setUserMode('y')}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
            >
              Y
              <span className="block text-sm opacity-70 font-normal mt-1">供应链</span>
            </button>
          </div>
          <p className="text-xs text-[#444444] text-center mt-6">数据保存在本地 · 上传 GitHub 可多设备同步</p>
        </div>
      </div>
    );
  }

  const isYMode = userMode === 'y';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className={`max-w-6xl mx-auto px-4 py-6 ${isMobile ? 'px-3' : 'px-6 py-8'}`}>
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between mb-6 ${isMobile ? 'gap-3' : 'mb-8'}`}>
          <div className="flex items-center gap-4">
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
            <select
              value={aiModel}
              onChange={e => { setAiModel(e.target.value as AIModel); localStorage.setItem('ai_model', e.target.value); }}
              className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0]"
            >
              <option value="kimi">Kimi</option>
              <option value="deepseek">DeepSeek</option>
              <option value="zhipu">智谱 GLM</option>
              <option value="qwen">Qwen</option>
              <option value="ernie">文心</option>
            </select>
            <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); localStorage.setItem('ai_api_key', e.target.value); }} placeholder="API Key" className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] w-24 sm:w-32" />
            <input type="password" value={ghToken} onChange={e => { setGhToken(e.target.value); localStorage.setItem('gh_token', e.target.value); }} placeholder="GH Token" className="px-2 py-1.5 text-xs bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg text-[#e0e0e0] w-24 sm:w-32" />
          </div>
        </div>

        {/* Sync Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={uploadToGithub} disabled={syncStatus === 'syncing'} className="px-3 py-1.5 text-xs bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] disabled:opacity-50">
            {syncStatus === 'syncing' ? '上传中...' : '上传'}
          </button>
          <button onClick={downloadFromGithub} disabled={syncStatus === 'syncing'} className="px-3 py-1.5 text-xs bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50">
            {syncStatus === 'syncing' ? '下载中...' : '下载'}
          </button>
          <span className="text-xs text-[#666666] self-center ml-2">{gistId ? `已绑定` : '未绑定'}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-4 bg-[#141414] p-1 rounded-xl border border-[#1f1f1f]">
          {(isYMode ? ['sjc', 'result'] : ['calendar', 'input', 'templates', 'result'] as ViewMode[]).map(tab => (
            <button key={tab} onClick={() => setViewMode(tab as ViewMode)}
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${viewMode === tab ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]' : 'text-[#666666] hover:text-[#b0b0b0]'}`}>
              {tab === 'sjc' ? '工作记录' : tab === 'calendar' ? '日历' : tab === 'input' ? '输入' : tab === 'templates' ? '模板' : '结果'}
            </button>
          ))}
        </div>

        {/* 小蒙模式 - Calendar */}
        {!isYMode && viewMode === 'calendar' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-[#3b82f6] font-medium">{formatWeekLabel(currentWeekStart)}</span>
            </div>
            <div className="space-y-4">
              {getWeeks().map((week, weekIdx) => {
                const isCurrentWeek = weekIdx === 1;
                const weekData = allData[week.weekStart] || week.days;
                return (
                  <div key={week.weekStart}>
                    <div className={`text-xs font-medium mb-2 ${isCurrentWeek ? 'text-[#3b82f6]' : 'text-[#666666]'}`}>
                      {week.label} · {formatWeekLabel(week.weekStart)}
                    </div>
                    <div className={`grid gap-2 sm:gap-3 ${isMobile ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-5'}`}>
                      {weekData.map(day => (
                        <div key={day.date} onClick={() => { setSelectedDay(day.date); setCurrentWeekStart(week.weekStart); setViewMode('input'); }}
                          className={`p-2 sm:p-3 rounded-lg cursor-pointer text-xs ${selectedDay === day.date ? 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111111]' : day.content.trim() ? 'bg-[#1a2618] text-[#4ade80] border border-[#22c55e]/30' : 'bg-[#161616] text-[#666666] hover:bg-[#1c1c1c]'}`}>
                          <div className="text-xs font-medium opacity-60">{day.dayName}</div>
                          <div className={`font-semibold mt-0.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>{formatDateDisplay(day.date)}</div>
                          <div className="mt-1 h-6 sm:h-8 overflow-hidden opacity-70 text-[10px]">{day.content ? (day.content.length > 20 ? day.content.substring(0, 20) + '...' : day.content) : '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={() => { setReportType('daily'); handleGenerate(); }} disabled={loading} className="px-6 py-3 bg-[#22c55e] text-white text-sm font-medium rounded-xl hover:bg-[#16a34a] disabled:opacity-50 shadow-lg shadow-green-500/20">生成日报</button>
              <button onClick={() => { setReportType('weekly'); handleGenerate(); }} disabled={loading} className="px-6 py-3 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] disabled:opacity-50 shadow-lg shadow-blue-500/20">生成周报</button>
            </div>
          </div>
        )}

        {/* 小蒙模式 - Input */}
        {!isYMode && viewMode === 'input' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
              <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0]">
                <option value="daily">日报</option>
                <option value="weekly">周报</option>
              </select>
              <select value={reportStyle} onChange={e => setReportStyle(e.target.value as ReportStyle)} className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0]">
                <option value="standard">标准格式</option>
                <option value="simple">简洁格式</option>
              </select>
            </div>
            {reportType === 'daily' ? (
              <>
                <div className="mb-2 text-xs text-[#888888]">当前选择：{selectedDay ? formatDateDisplay(selectedDay) : '请在日历中选择日期'}</div>
                <textarea placeholder="输入今日工作内容..." value={Object.values(allData).flat().find(d => d.date === selectedDay)?.content || ''} onChange={e => updateDayContent(selectedDay, e.target.value)} className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] resize-none" />
              </>
            ) : (
              <div className="mb-2 text-xs text-[#888888]">本周已填写 {Object.values(allData).flat().filter(d => d.content.trim()).length} 天</div>
            )}
            <button onClick={handleGenerate} disabled={loading} className="w-full mt-4 py-3 bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50"> {loading ? '生成中...' : '生成报告'} </button>
          </div>
        )}

        {/* 小蒙模式 - Templates */}
        {!isYMode && viewMode === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-white">报告模板</h2>
              <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="px-3 py-2 text-xs sm:text-sm bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0]">
                <option value="daily">日报</option>
                <option value="weekly">周报</option>
                <option value="monthly">月报</option>
              </select>
            </div>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
              {TEMPLATES.filter(t => t.type === reportType).map(template => (
                <div key={template.id} className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white text-sm">{template.name}</h3>
                      <p className="text-xs text-[#666666] mt-0.5">{template.description}</p>
                    </div>
                    <button onClick={() => copyTemplate(template)} className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white">复制</button>
                  </div>
                  <pre className="text-xs text-[#888888] whitespace-pre-wrap bg-[#0d0d0d] p-2 sm:p-3 rounded-lg max-h-28 overflow-auto border border-[#1a1a1a]">{template.content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 圆圆模式 - 工作记录 */}
        {isYMode && viewMode === 'sjc' && sjcData && (
          <div className="space-y-4">
            <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">重点工作推进情况表</h2>
                <span className="text-xs text-[#888888]">{getWeekRange()}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-[#888888]">部门：</label>
                <input
                  value={sjcData.department}
                  onChange={e => setSjcData(prev => prev ? { ...prev, department: e.target.value } : prev)}
                  className="px-2 py-1 text-xs bg-[#161616] border border-[#2a2a2a] rounded text-[#e0e0e0]"
                />
              </div>
            </div>

            {/* 表格 */}
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-[#888888]">
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-10">序号</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">部门</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">重点工作事项</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-44">本周完成情况</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-44">累计完成情况</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-44">下一步工作计划</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-36">存在问题</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-36">需协调解决事项</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-20">分管领导</th>
                    <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-16">责任人</th>
                  </tr>
                </thead>
                <tbody>
                  {sjcData.categories.map((category, catIdx) => (
                    <tr key={catIdx} className={catIdx % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111111]'}>
                      <td className="px-2 py-1 text-center text-[#666666] border border-[#2a2a2a]">{catIdx + 1}</td>
                      <td className="px-2 py-1 text-center text-[#e0e0e0] border border-[#2a2a2a]" rowSpan={5}>
                        <input
                          value={catIdx === 0 ? sjcData.department : ''}
                          onChange={e => { if (catIdx === 0) setSjcData(prev => prev ? { ...prev, department: e.target.value } : prev); }}
                          className="w-full bg-transparent text-center text-[#e0e0e0] outline-none"
                          readOnly={catIdx !== 0}
                        />
                      </td>
                      <td className="px-2 py-1 text-left text-[#22c55e] border border-[#2a2a2a] font-medium">
                        {category.name}
                      </td>
                      {(['thisWeek', 'cumulative', 'nextWeek', 'issues', 'coordination', 'leader', 'owner'] as const).map((field) => (
                        <td key={field} className="px-1 py-1 border border-[#2a2a2a]">
                          <div className="flex gap-1">
                            {field === 'thisWeek' || field === 'cumulative' || field === 'nextWeek' ? (
                              <button
                                onClick={() => expandSJCCell(catIdx, field)}
                                disabled={loading}
                                className="px-1 py-0.5 text-[8px] bg-[#22c55e]/20 text-[#22c55e] rounded hover:bg-[#22c55e]/30 shrink-0"
                              >AI</button>
                            ) : null}
                            <textarea
                              value={category.rows[field]}
                              onChange={e => updateSJCCell(catIdx, field, e.target.value)}
                              placeholder="..."
                              className="w-full h-10 bg-transparent text-[#c0c0c0] resize-none outline-none text-[10px]"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={generateSJCReport} disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg">
              {loading ? '生成中...' : '生成周报'}
            </button>
          </div>
        )}

        {/* Result View */}
        {viewMode === 'result' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">生成结果</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white">复制</button>
                <button onClick={handleExport} className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white">导出</button>
                <button onClick={() => setViewMode(isYMode ? 'sjc' : 'calendar')} className="px-3 py-1.5 text-xs bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white rounded-lg shadow-lg">返回</button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#c0c0c0] bg-[#0d0d0d] p-3 sm:p-5 rounded-xl overflow-auto max-h-[400px] sm:max-h-[500px] leading-relaxed border border-[#1a1a1a]">{generatedReport}</pre>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-center text-xs text-[#444444]">
          {isYMode ? '三江供应链格式 · 国企风格' : '数据保存在本地 · 上传 GitHub 可多设备同步'}
        </div>
      </div>
    </div>
  );
}

export default App;
