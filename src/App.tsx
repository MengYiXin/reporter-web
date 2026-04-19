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

// 三江周报单行数据
interface SJCDailyEntry {
  thisWeek: string;
  cumulative: string;
  nextWeek: string;
  issues: string;
  coordination: string;
  leader: string;
  owner: string;
  status: 'done' | 'undone' | '';
}

interface SJCCategory {
  name: string;
  entry: SJCDailyEntry;
  carriedFromLastWeek: boolean; // 是否从上周延续
}

interface SJCWeekData {
  weekStart: string;
  department: string;
  categories: SJCCategory[];
  carriedFromWeek: string | null; // 从哪个周延续
}

// 存档库 - 按周存储所有历史数据
interface SJCArchive {
  [weekStart: string]: SJCWeekData;
}

// 部门配置
const SJC_DEPARTMENTS = [
  { id: 'yyg1', name: '运营管理一部', categories: ['考核指标板块（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'] },
  { id: 'yyg2', name: '运营管理二部', categories: ['考核指标板块（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'] },
  { id: 'yyg3', name: '运营管理三部', categories: ['考核指标板块（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'] },
  { id: 'cw', name: '财务融资部', categories: ['财务核算板块', '融资资金板块'] },
  { id: 'fk', name: '风控合规部', categories: ['风控合规管理板块', '法务内部管理板块', '涉诉案件板块'] },
  { id: 'zh', name: '综合管理部', categories: ['党建人事板块', '综合行政板块', '督查督办及后勤保障板块'] },
];

const SJC_CATEGORIES = ['考核指标板块\n（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'];

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
  const [sjcArchive, setSjcArchive] = useState<SJCArchive>({});
  const [currentDepartment, setCurrentDepartment] = useState<string>('运营管理二部');
  const [sjcView, setSjcView] = useState<'edit' | 'archive'>('edit');
  // 聚焦模式：哪个单元格正在编辑（展开）
  const [focusedCell, setFocusedCell] = useState<{ catIdx: number; field: string } | null>(null);

  // 获取当前周数据
  const getCurrentSJCData = (): SJCWeekData | null => {
    return sjcArchive[currentWeekStart] || null;
  };

  // 初始化单周数据
  const createWeekData = (weekStart: string, department: string, carriedFromWeek: string | null = null): SJCWeekData => {
    // 如果有延续，获取上周未完成的项目
    let carriedCategories: SJCCategory[] = [];
    if (carriedFromWeek && sjcArchive[carriedFromWeek]) {
      const lastWeek = sjcArchive[carriedFromWeek];
      carriedCategories = lastWeek.categories
        .filter(c => c.entry.status === 'undone' || c.entry.cumulative.trim())
        .map(c => ({
          name: c.name,
          entry: {
            thisWeek: '', // 本周清空
            cumulative: c.entry.cumulative, // 累计保留
            nextWeek: '',
            issues: '',
            coordination: '',
            leader: c.entry.leader,
            owner: c.entry.owner,
            status: '' as const
          },
          carriedFromLastWeek: true
        }));
    }

    // 获取部门的板块列表
    const dept = SJC_DEPARTMENTS.find(d => d.name === department);
    const categories = dept ? dept.categories : SJC_CATEGORIES;

    // 合并：延续的项目 + 部门默认板块
    const allCategories = [...carriedCategories];
    categories.forEach(catName => {
      if (!allCategories.some(c => c.name === catName)) {
        allCategories.push({
          name: catName,
          entry: {
            thisWeek: '',
            cumulative: '',
            nextWeek: '',
            issues: '',
            coordination: '',
            leader: '',
            owner: '',
            status: ''
          },
          carriedFromLastWeek: false
        });
      }
    });

    return {
      weekStart,
      department,
      categories: allCategories,
      carriedFromWeek
    };
  };

  // 获取上周的weekStart
  const getLastWeekStart = (weekStart: string): string | null => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  // 检查是否有未完成的延续项目
  const hasUnfinishedFromLastWeek = (): boolean => {
    const lastWeekStart = getLastWeekStart(currentWeekStart);
    if (!lastWeekStart || !sjcArchive[lastWeekStart]) return false;
    return sjcArchive[lastWeekStart].categories.some(c => c.entry.status === 'undone');
  };

  // 执行延续
  const carryOverUnfinished = () => {
    const lastWeekStart = getLastWeekStart(currentWeekStart);
    if (!lastWeekStart) return;

    setSjcArchive(prev => {
      const updated = { ...prev };
      const currentWeek = createWeekData(currentWeekStart, currentDepartment, lastWeekStart);
      updated[currentWeekStart] = currentWeek;
      return updated;
    });
    setSaveStatus('saving');
  };

  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<string>('');

  // 更新三江表格单元格
  const updateSJCCell = (categoryIndex: number, field: keyof SJCDailyEntry, value: string) => {
    setSaveStatus('saving');
    setSjcArchive(prev => {
      const updated = { ...prev };
      const weekData = updated[currentWeekStart];
      if (!weekData) return prev;
      weekData.categories = [...weekData.categories];
      weekData.categories[categoryIndex] = {
        ...weekData.categories[categoryIndex],
        entry: { ...weekData.categories[categoryIndex].entry, [field]: value }
      };
      return updated;
    });
  };

  // 复制单个板块内容
  const copyCategoryText = (categoryIndex: number) => {
    const weekData = getCurrentSJCData();
    if (!weekData) return;
    const cat = weekData.categories[categoryIndex];
    const text = `【${cat.name}】
本周完成：${cat.entry.thisWeek || '无'}
累计完成：${cat.entry.cumulative || '无'}
下周计划：${cat.entry.nextWeek || '无'}
存在问题：${cat.entry.issues || '无'}
需协调：${cat.entry.coordination || '无'}
分管领导：${cat.entry.leader || '无'}
责任人：${cat.entry.owner || '无'}`;
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  // 复制整周报告
  const copyWeekReport = () => {
    const weekData = getCurrentSJCData();
    if (!weekData) return;
    const lines = [`【${weekData.department}周报】`, `日期：${formatWeekLabel(weekData.weekStart)}`, ''];
    weekData.categories.forEach(cat => {
      if (cat.entry.thisWeek.trim() || cat.entry.cumulative.trim()) {
        lines.push(`【${cat.name}】`);
        lines.push(`本周：${cat.entry.thisWeek || '无'}`);
        lines.push(`累计：${cat.entry.cumulative || '无'}`);
        lines.push(`计划：${cat.entry.nextWeek || '无'}`);
        lines.push('');
      }
    });
    navigator.clipboard.writeText(lines.join('\n'));
    alert('已复制到剪贴板');
  };

  // 选择周
  const selectWeek = (weekStart: string) => {
    setCurrentWeekStart(weekStart);
    if (!sjcArchive[weekStart]) {
      // 如果没有数据，创建新周数据
      const lastWeekStart = getLastWeekStart(weekStart);
      setSjcArchive(prev => {
        const updated = { ...prev };
        updated[weekStart] = createWeekData(weekStart, currentDepartment, hasUnfinishedFromLastWeek() ? lastWeekStart : null);
        return updated;
      });
    }
  };

  // 获取所有有数据的周（用于存档列表）
  const getArchivedWeeks = (): { weekStart: string; label: string }[] => {
    return Object.keys(sjcArchive)
      .sort((a, b) => b.localeCompare(a)) // 最新的在前面
      .map(ws => ({ weekStart: ws, label: formatWeekLabel(ws) }));
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

  // 初始化本周
  useEffect(() => {
    if (!userMode || userMode !== 'y') return;
    const savedSjc = localStorage.getItem('sjc_archive');
    if (savedSjc) {
      try {
        const parsed = JSON.parse(savedSjc);
        setSjcArchive(parsed);
        // 设置当前周为最新的周
        const weeks = Object.keys(parsed).sort((a, b) => b.localeCompare(a));
        if (weeks.length > 0) {
          setCurrentWeekStart(weeks[0]);
        } else {
          // 创建新周
          const today = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - today.getDay() + 1);
          const weekStart = monday.toISOString().split('T')[0];
          setCurrentWeekStart(weekStart);
          setSjcArchive({ [weekStart]: createWeekData(weekStart, currentDepartment) });
        }
      } catch (e) { console.error('Failed to load SJC archive'); }
    } else {
      // 创建新周
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const weekStart = monday.toISOString().split('T')[0];
      setCurrentWeekStart(weekStart);
      setSjcArchive({ [weekStart]: createWeekData(weekStart, currentDepartment) });
    }
  }, [userMode]);

  // 自动保存到 localStorage（防抖）
  useEffect(() => {
    if (userMode !== 'y' || !currentWeekStart || !sjcArchive[currentWeekStart]) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('sjc_archive', JSON.stringify(sjcArchive));
        setSaveStatus('saved');
        setLastSaved(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        setSaveStatus('error');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sjcArchive, currentWeekStart, userMode]);

  // 同步到 GitHub Gist（带重试）
  const uploadToGithub = async () => {
    if (!ghToken) { alert('请先输入 GitHub Token'); return; }
    setSyncStatus('syncing');
    setSaveStatus('saving');
    let retries = 2;
    while (retries >= 0) {
      try {
        const storedData = {
          apiKey, aiModel, userMode,
          weekEntries: allData,
          sjcArchive: userMode === 'y' ? sjcArchive : undefined
        };
        const content = JSON.stringify(storedData, null, 2);
        if (gistId) {
          const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } })
          });
          if (!response.ok) throw new Error('Upload failed');
        } else {
          const response = await fetch('https://api.github.com/gists', {
            method: 'POST', headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: 'Weekly Reporter Data', public: false, files: { [GIST_FILENAME]: { content } } })
          });
          const data = await response.json();
          if (!response.ok) throw new Error('Upload failed');
          setGistId(data.id);
          localStorage.setItem('gist_id', data.id);
        }
        setSyncStatus('success');
        setSaveStatus('saved');
        alert('上传成功！');
        break;
      } catch (e) {
        retries--;
        if (retries < 0) {
          setSyncStatus('error');
          setSaveStatus('error');
          alert('上传失败，请检查网络后重试');
        }
      }
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const updateDayContent = (date: string, content: string) => {
    setAllData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(weekStart => {
        updated[weekStart] = updated[weekStart].map(d => d.date === date ? { ...d, content } : d);
      });
      return updated;
    });
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
          if (parsed.sjcArchive) {
            setSjcArchive(parsed.sjcArchive);
            // 设置当前周为最新的周
            const weeks = Object.keys(parsed.sjcArchive).sort((a, b) => b.localeCompare(a));
            if (weeks.length > 0) setCurrentWeekStart(weeks[0]);
          }
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
    const weekData = getCurrentSJCData();
    if (!weekData) return;
    setLoading(true);
    setGeneratedReport('');
    try {
      if (!apiKey.trim()) { setGeneratedReport('请先设置 API Key'); return; }

      const hasContent = weekData.categories.some(c => c.entry.thisWeek.trim() || c.entry.cumulative.trim());
      if (!hasContent) { setGeneratedReport('请至少填写本周完成情况'); return; }

      const weekRange = formatWeekLabel(weekData.weekStart);
      const content = weekData.categories.map(c =>
        `【${c.name}】\n本周完成情况：${c.entry.thisWeek || '无'}\n累计完成情况：${c.entry.cumulative || '无'}\n下一步工作计划：${c.entry.nextWeek || '无'}\n存在问题：${c.entry.issues || '无'}\n需协调解决事项：${c.entry.coordination || '无'}\n分管领导：${c.entry.leader || '无'}\n责任人：${c.entry.owner || '无'}`
      ).join('\n\n');

      const prompt = `请根据以下三江供应链公司周报内容，生成标准的周报。

日期范围：${weekRange}
部门：${weekData.department}

工作记录：
${content}

请按以下格式生成周报：

【三江供应链公司重点工作推进情况表】
日期范围：${weekRange}
部门：${weekData.department}

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

  // AI填充单元格（上下文感知 + 错误容忍）
  const expandSJCCell = async (categoryIndex: number, field: keyof SJCDailyEntry) => {
    const weekData = getCurrentSJCData();
    if (!weekData) return;
    const category = weekData.categories[categoryIndex];
    const entry = category.entry;

    if (!entry.thisWeek.trim() && field === 'thisWeek') { alert('请先填写本周工作内容'); return; }
    if (!apiKey.trim()) { alert('请先设置 API Key'); return; }

    setLoading(true);
    let retries = 2;
    const timeoutMs = 30000; // 30秒超时

    while (retries >= 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let prompt = '';
        if (field === 'thisWeek') {
          prompt = `请根据以下工作板块的名称，生成该板块的本周工作描述。

板块名称：${category.name}
已有内容：${entry.thisWeek || '无'}

请扩写成一段流畅的工作描述，包含具体做了什么、进展如何、取得了什么成果。

只需输出一段文字，不要加标题。`;
        } else if (field === 'cumulative') {
          // 上下文感知：参考累计完成情况、本周完成、状态
          const lastWeekStart = getLastWeekStart(currentWeekStart);
          const lastWeekData = lastWeekStart ? sjcArchive[lastWeekStart] : null;
          const lastCategory = lastWeekData?.categories.find(c => c.name === category.name);
          prompt = `请根据以下信息，生成累计完成情况描述。

板块：${category.name}
本周完成：${entry.thisWeek}
上周累计：${lastCategory?.entry.cumulative || '无'}
工作状态：${entry.status === 'done' ? '已完成' : entry.status === 'undone' ? '未完成' : '进行中'}

请描述截至目前的工作完成进度（包括历史累计和本周进展）。

只需输出一段文字。`;
        } else if (field === 'nextWeek') {
          // 上下文感知：参考本周完成、累计完成、存在问题
          prompt = `请根据以下信息，生成下周工作计划。

板块：${category.name}
本周完成：${entry.thisWeek}
累计完成：${entry.cumulative || '无'}
存在问题：${entry.issues || '无'}

请基于本周进展和遗留问题，列出下周的工作计划。

只需输出一段文字。`;
        } else if (field === 'issues') {
          prompt = `请根据本周工作内容，分析可能存在的问题和困难。

板块：${category.name}
本周完成：${entry.thisWeek}
累计完成：${entry.cumulative || '无'}

请列出可能存在的问题（资金、审批、外部依赖等）。

只需输出一段文字。`;
        } else if (field === 'coordination') {
          prompt = `请根据本周工作内容，列出需协调解决的事项。

板块：${category.name}
本周完成：${entry.thisWeek}
存在问题：${entry.issues || '无'}

请列出需领导或跨部门协调解决的事项。

只需输出一段文字。`;
        }

        if (!prompt) { setLoading(false); return; }

        const config = MODEL_CONFIGS[aiModel];
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], max_tokens: 512 }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.error) { alert(`API 错误：${data.error.message}`); break; }
        const text = data.choices?.[0]?.message?.content || '';
        if (text) {
          updateSJCCell(categoryIndex, field, text);
        } else { alert('生成失败，请重试'); }
        break; // 成功或业务错误都退出重试循环
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          if (retries === 0) { alert('请求超时，请检查网络后重试'); break; }
          retries--;
          continue; // 超时重试
        }
        if (retries === 0) { alert(`生成失败：${e instanceof Error ? e.message : '网络错误'}`); break; }
        retries--;
      }
    }
    setLoading(false);
  };

  // 一键AI批量填充（上下文感知）
  const expandRowContextAware = async (categoryIndex: number) => {
    const weekData = getCurrentSJCData();
    if (!weekData) return;
    const category = weekData.categories[categoryIndex];

    if (!category.entry.thisWeek.trim()) { alert('请先填写本周完成情况'); return; }
    if (!apiKey.trim()) { alert('请先设置 API Key'); return; }

    setLoading(true);
    let retries = 2;
    const timeoutMs = 60000; // 60秒超时

    while (retries >= 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // 获取上下文：上周数据
        const lastWeekStart = getLastWeekStart(currentWeekStart);
        const lastWeekData = lastWeekStart ? sjcArchive[lastWeekStart] : null;
        const lastCategory = lastWeekData?.categories.find(c => c.name === category.name);

        const prompt = `你是一个国企周报助手。请根据以下信息，为"${category.name}"板块生成完整的周报内容。

【本周工作】
${category.entry.thisWeek}

【历史累计】(如有)
${lastCategory?.entry.cumulative || '无'}

【上周工作计划】(如有)
${lastCategory?.entry.nextWeek || '无'}

请生成以下内容，每项一段话：
1. 累计完成情况（结合历史累计 + 本周完成）
2. 下一步工作计划（基于本周进展）
3. 存在问题（如有）
4. 需协调解决事项（如有）

格式：按顺序输出，每项用"【累计完成】"、"【下一步】"、"【问题】"、"【协调】"开头，只输出内容不要其他说明。如果某项没有内容则写"无"。`;

        const config = MODEL_CONFIGS[aiModel];
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.error) { alert(`API 错误：${data.error.message}`); break; }

        const text = data.choices?.[0]?.message?.content || '';
        if (text) {
          // 解析AI返回的内容
          const cumulativeMatch = text.match(/【累计完成】\s*([\s\S]*?)(?=【下一步】|$)/);
          const nextMatch = text.match(/【下一步】\s*([\s\S]*?)(?=【问题】|$)/);
          const issuesMatch = text.match(/【问题】\s*([\s\S]*?)(?=【协调】|$)/);
          const coordMatch = text.match(/【协调】\s*([\s\S]*?)$/);

          if (cumulativeMatch) updateSJCCell(categoryIndex, 'cumulative', cumulativeMatch[1].trim());
          if (nextMatch) updateSJCCell(categoryIndex, 'nextWeek', nextMatch[1].trim());
          if (issuesMatch) updateSJCCell(categoryIndex, 'issues', issuesMatch[1].trim());
          if (coordMatch) updateSJCCell(categoryIndex, 'coordination', coordMatch[1].trim());

          alert('AI批量填充完成！');
        } else { alert('生成失败，请重试'); }
        break;
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          if (retries === 0) { alert('请求超时，请检查网络后重试'); break; }
          retries--;
          continue;
        }
        if (retries === 0) { alert(`生成失败：${e instanceof Error ? e.message : '网络错误'}`); break; }
        retries--;
      }
    }
    setLoading(false);
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
        {isYMode && viewMode === 'sjc' && (
          <div className="space-y-4">
            {/* 顶部操作栏 */}
            <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSjcView(sjcView === 'edit' ? 'archive' : 'edit')}
                    className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
                  >
                    {sjcView === 'edit' ? '📋 历史存档' : '✏️ 返回编辑'}
                  </button>
                  <button
                    onClick={copyWeekReport}
                    className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
                  >
                    📋 复制报告
                  </button>
                </div>
                <div className="text-xs">
                  {saveStatus === 'saving' && <span className="text-[#f59e0b]">保存中...</span>}
                  {saveStatus === 'saved' && <span className="text-[#22c55e]">已保存 {lastSaved}</span>}
                  {saveStatus === 'error' && <span className="text-red-500">保存失败</span>}
                </div>
              </div>

              {sjcView === 'edit' && (
                <>
                  {/* 周选择器 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const prevWeek = new Date(currentWeekStart);
                          prevWeek.setDate(prevWeek.getDate() - 7);
                          selectWeek(prevWeek.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#888] rounded hover:text-white"
                      >◀</button>
                      <span className="text-sm text-white font-medium">{formatWeekLabel(currentWeekStart)}</span>
                      <button
                        onClick={() => {
                          const nextWeek = new Date(currentWeekStart);
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          selectWeek(nextWeek.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#888] rounded hover:text-white"
                      >▶</button>
                    </div>
                    {/* 部门选择器 */}
                    <select
                      value={currentDepartment}
                      onChange={e => {
                        setCurrentDepartment(e.target.value);
                        // 更新当前周数据的部门
                        setSjcArchive(prev => {
                          const updated = { ...prev };
                          if (updated[currentWeekStart]) {
                            updated[currentWeekStart] = { ...updated[currentWeekStart], department: e.target.value };
                          }
                          return updated;
                        });
                      }}
                      className="px-2 py-1 text-xs bg-[#161616] border border-[#2a2a2a] rounded text-[#e0e0e0]"
                    >
                      {SJC_DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 延续提示 */}
                  {hasUnfinishedFromLastWeek() && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                      <span className="text-xs text-[#f59e0b]">📌 上周有未完成的工作项</span>
                      <button
                        onClick={carryOverUnfinished}
                        className="px-2 py-1 text-xs bg-[#f59e0b] text-white rounded hover:bg-[#d97706]"
                      >
                        带入本周
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 历史存档视图 */}
            {sjcView === 'archive' && (
              <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
                <h3 className="text-sm font-medium text-white mb-3">📋 历史存档</h3>
                <div className="space-y-2">
                  {getArchivedWeeks().map(week => (
                    <div
                      key={week.weekStart}
                      onClick={() => { selectWeek(week.weekStart); setSjcView('edit'); }}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[#1c1c1c] ${week.weekStart === currentWeekStart ? 'bg-[#1c1c1c] border border-[#3b82f6]' : 'bg-[#161616]'}`}
                    >
                      <span className="text-sm text-[#e0e0e0]">{week.label}</span>
                      <span className="text-xs text-[#666666]">{week.weekStart}</span>
                    </div>
                  ))}
                  {getArchivedWeeks().length === 0 && (
                    <div className="text-center text-[#666666] py-4">暂无历史数据</div>
                  )}
                </div>
              </div>
            )}

            {/* 编辑视图 */}
            {sjcView === 'edit' && getCurrentSJCData() && (
              <>
                {/* PC端表格 */}
                {!isMobile && (
                  <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-x-auto">
                    <table className="w-full text-xs min-w-[900px]">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-[#888888]">
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-10">序号</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">重点工作事项</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-40">本周完成情况</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-40">累计完成情况</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-36">下一步工作计划</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">存在问题</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-28">需协调事项</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-16">分管</th>
                          <th className="px-2 py-2 text-center font-medium border border-[#2a2a2a] w-12">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentSJCData()!.categories.map((category, catIdx) => (
                          <tr key={catIdx} className={catIdx % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111111]'}>
                            <td className="px-2 py-1 text-center text-[#666666] border border-[#2a2a2a]">{catIdx + 1}</td>
                            <td className="px-2 py-1 text-left text-[#22c55e] border border-[#2a2a2a] text-xs font-medium bg-[#1a2616]">
                              {category.name}
                              {category.carriedFromLastWeek && <span className="ml-1 text-[8px] text-[#f59e0b]">📌延续</span>}
                            </td>
                            {(['thisWeek', 'cumulative', 'nextWeek', 'issues', 'coordination'] as const).map((field) => (
                              <td key={field} className={`px-1 py-1 border border-[#2a2a2a] ${focusedCell?.catIdx === catIdx && focusedCell?.field === field ? 'bg-[#1a2616] z-10' : ''}`}>
                                <div className="flex gap-1 items-start">
                                  <button
                                    onClick={() => expandSJCCell(catIdx, field)}
                                    disabled={loading}
                                    className="px-1 py-0.5 text-[8px] bg-[#22c55e]/20 text-[#22c55e] rounded hover:bg-[#22c55e]/30 shrink-0"
                                  >AI</button>
                                  <textarea
                                    value={category.entry[field]}
                                    onChange={e => updateSJCCell(catIdx, field, e.target.value)}
                                    onFocus={() => setFocusedCell({ catIdx, field })}
                                    onBlur={() => setTimeout(() => setFocusedCell(null), 200)}
                                    onKeyDown={e => { if (e.key === 'Escape') setFocusedCell(null); }}
                                    placeholder="..."
                                    className={`w-full bg-transparent text-[#c0c0c0] resize-none outline-none text-[10px] transition-all duration-200 ${focusedCell?.catIdx === catIdx && focusedCell?.field === field ? 'h-32 min-h-[80px] text-xs' : 'h-10'}`}
                                  />
                                </div>
                              </td>
                            ))}
                            <td className="px-1 py-1 border border-[#2a2a2a]">
                              <input
                                value={category.entry.leader}
                                onChange={e => updateSJCCell(catIdx, 'leader', e.target.value)}
                                onFocus={() => setFocusedCell({ catIdx, field: 'leader' })}
                                onBlur={() => setTimeout(() => setFocusedCell(null), 200)}
                                className={`w-full bg-transparent text-[#c0c0c0] text-xs outline-none transition-all ${focusedCell?.catIdx === catIdx && focusedCell?.field === 'leader' ? 'h-8 bg-[#1a2616]' : 'h-6'}`}
                              />
                            </td>
                            <td className="px-1 py-1 border border-[#2a2a2a] text-center">
                              <button
                                onClick={() => copyCategoryText(catIdx)}
                                className="px-1 py-0.5 text-[8px] bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
                              >📋</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 移动端卡片 */}
                {isMobile && (
                  <div className="space-y-3">
                    {getCurrentSJCData()!.categories.map((category, catIdx) => (
                      <div key={catIdx} className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#22c55e]">
                            {category.name}
                            {category.carriedFromLastWeek && <span className="ml-1 text-[10px] text-[#f59e0b]">📌</span>}
                          </span>
                          <button
                            onClick={() => copyCategoryText(catIdx)}
                            className="px-2 py-1 text-xs bg-[#3b82f6]/20 text-[#3b82f6] rounded"
                          >📋 复制</button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-[#888888] block mb-1">本周完成</label>
                            <div className="flex gap-1">
                              <textarea
                                value={category.entry.thisWeek}
                                onChange={e => updateSJCCell(catIdx, 'thisWeek', e.target.value)}
                                onFocus={() => setFocusedCell({ catIdx, field: 'thisWeek' })}
                                onBlur={() => setTimeout(() => setFocusedCell(null), 200)}
                                placeholder="..."
                                className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1 resize-none transition-all duration-200 focus:min-h-[80px]"
                              />
                              <button
                                onClick={() => expandSJCCell(catIdx, 'thisWeek')}
                                disabled={loading}
                                className="px-2 text-xs bg-[#22c55e] text-white rounded shrink-0"
                              >AI</button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-[#888888] block mb-1">累计完成</label>
                            <div className="flex gap-1">
                              <textarea
                                value={category.entry.cumulative}
                                onChange={e => updateSJCCell(catIdx, 'cumulative', e.target.value)}
                                onFocus={() => setFocusedCell({ catIdx, field: 'cumulative' })}
                                onBlur={() => setTimeout(() => setFocusedCell(null), 200)}
                                placeholder="..."
                                className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1 resize-none transition-all duration-200 focus:min-h-[80px]"
                              />
                              <button
                                onClick={() => expandSJCCell(catIdx, 'cumulative')}
                                disabled={loading}
                                className="px-2 text-xs bg-[#22c55e] text-white rounded shrink-0"
                              >AI</button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-[#888888] block mb-1">下一步计划</label>
                            <div className="flex gap-1">
                              <textarea
                                value={category.entry.nextWeek}
                                onChange={e => updateSJCCell(catIdx, 'nextWeek', e.target.value)}
                                onFocus={() => setFocusedCell({ catIdx, field: 'nextWeek' })}
                                onBlur={() => setTimeout(() => setFocusedCell(null), 200)}
                                placeholder="..."
                                className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1 resize-none transition-all duration-200 focus:min-h-[80px]"
                              />
                              <button
                                onClick={() => expandSJCCell(catIdx, 'nextWeek')}
                                disabled={loading}
                                className="px-2 text-xs bg-[#22c55e] text-white rounded shrink-0"
                              >AI</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-[#888888] block mb-1">问题</label>
                              <textarea
                                value={category.entry.issues}
                                onChange={e => updateSJCCell(catIdx, 'issues', e.target.value)}
                                placeholder="..."
                                className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1 resize-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#888888] block mb-1">协调</label>
                              <textarea
                                value={category.entry.coordination}
                                onChange={e => updateSJCCell(catIdx, 'coordination', e.target.value)}
                                placeholder="..."
                                className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1 resize-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-[#888888] block mb-1">分管领导</label>
                              <input
                                value={category.entry.leader}
                                onChange={e => updateSJCCell(catIdx, 'leader', e.target.value)}
                                className="w-full h-8 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#888888] block mb-1">责任人</label>
                              <input
                                value={category.entry.owner}
                                onChange={e => updateSJCCell(catIdx, 'owner', e.target.value)}
                                className="w-full h-8 bg-[#161616] border border-[#2a2a2a] rounded text-[#c0c0c0] text-xs p-1"
                              />
                            </div>
                          </div>
                          {/* 批量AI */}
                          <button
                            onClick={() => expandRowContextAware(catIdx)}
                            disabled={loading}
                            className="w-full py-2 text-xs bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-lg"
                          >✨ AI批量填充（上下文感知）</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* PC端批量AI按钮 */}
                {!isMobile && (
                  <div className="flex gap-2 flex-wrap">
                    {getCurrentSJCData()!.categories.map((category, catIdx) => (
                      <button
                        key={catIdx}
                        onClick={() => expandRowContextAware(catIdx)}
                        disabled={loading}
                        className="px-3 py-2 text-xs bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-lg"
                      >
                        ✨ {category.name} AI填充
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={generateSJCReport} disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg">
                  {loading ? '生成中...' : '生成周报'}
                </button>
              </>
            )}
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
