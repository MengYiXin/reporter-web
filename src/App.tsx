import { useState, useEffect } from 'react';

type ReportType = 'daily' | 'weekly' | 'monthly';
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
  // 展开编辑的板块索引
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  // M模式相关状态
  const [expandedDay, setExpandedDay] = useState<string | null>(null); // 展开编辑的日期
  const [mView, setMView] = useState<'calendar' | 'archive' | 'result'>('calendar'); // M模式视图

  // M模式存档 - 生成的报告历史
  interface ReportRecord {
    date: string;
    type: 'daily' | 'weekly';
    content: string;
    generatedAt: string;
  }
  const [reportArchive, setReportArchive] = useState<ReportRecord[]>([]);

  // 加载报告存档
  useEffect(() => {
    const saved = localStorage.getItem('report_archive');
    if (saved) {
      try { setReportArchive(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // 保存报告存档
  const saveToArchive = (type: 'daily' | 'weekly', content: string) => {
    const record: ReportRecord = {
      date: type === 'daily' ? selectedDay : currentWeekStart,
      type,
      content,
      generatedAt: new Date().toISOString()
    };
    setReportArchive(prev => {
      const updated = [record, ...prev].slice(0, 50); // 保留最近50条
      localStorage.setItem('report_archive', JSON.stringify(updated));
      return updated;
    });
  };

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
      if (text) {
        setGeneratedReport(text);
        if (reportType === 'daily' || reportType === 'weekly') {
          saveToArchive(reportType, text);
        }
        if (userMode === 'm') setMView('result');
        else setViewMode('result');
      }
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
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="12" fill="url(#logoGrad)"/>
                <path d="M18 18h28v4H22v8h20v4H22v16h-4V18z" fill="white"/>
                <path d="M38 18h8v4h-4v24h-4V22h-4v-4h4v4z" fill="white"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6"/>
                    <stop offset="1" stopColor="#1d4ed8"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22c55e] rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">AI</span>
              </div>
            </div>
          </div>
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
            {/* Logo Mark */}
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <rect width="64" height="64" rx="12" fill="url(#logoGradHeader)"/>
              <path d="M18 18h28v4H22v8h20v4H22v16h-4V18z" fill="white"/>
              <path d="M38 18h8v4h-4v24h-4V22h-4v-4h4v4z" fill="white"/>
              <defs>
                <linearGradient id="logoGradHeader" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#1d4ed8"/>
                </linearGradient>
              </defs>
            </svg>
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
          {isYMode ? (
            // Y模式导航
            <button onClick={() => setViewMode('sjc')}
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${viewMode === 'sjc' ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]' : 'text-[#666666] hover:text-[#b0b0b0]'}`}>
              工作记录
            </button>
          ) : (
            // M模式导航
            <>
              <button onClick={() => setMView('calendar')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${mView === 'calendar' ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]' : 'text-[#666666] hover:text-[#b0b0b0]'}`}>
                日历
              </button>
              <button onClick={() => setMView('archive')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${mView === 'archive' ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]' : 'text-[#666666] hover:text-[#b0b0b0]'}`}>
                存档
              </button>
              <button onClick={() => setMView('result')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${mView === 'result' ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]' : 'text-[#666666] hover:text-[#b0b0b0]'}`}>
                结果
              </button>
            </>
          )}
        </div>

        {/* 小蒙模式 - Calendar */}
        {!isYMode && mView === 'calendar' && (
          <div className="space-y-4">
            {/* 顶部操作栏 */}
            <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMView('archive')}
                    className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white"
                  >
                    📋 历史存档
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setReportType('daily'); handleGenerate(); }} disabled={loading} className="px-4 py-2 bg-[#22c55e] text-white text-xs font-medium rounded-lg hover:bg-[#16a34a] disabled:opacity-50">生成日报</button>
                  <button onClick={() => { setReportType('weekly'); handleGenerate(); }} disabled={loading} className="px-4 py-2 bg-[#3b82f6] text-white text-xs font-medium rounded-lg hover:bg-[#2563eb] disabled:opacity-50">生成周报</button>
                </div>
              </div>
            </div>

            {/* 日历网格 */}
            <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
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
                          <div key={day.date} onClick={() => { setSelectedDay(day.date); setCurrentWeekStart(week.weekStart); setExpandedDay(day.date); }}
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
            </div>

            {/* 本周填写统计 */}
            <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f] text-center">
              <span className="text-sm text-[#888]">本周已填写 </span>
              <span className="text-[#22c55e] font-medium">{Object.values(allData).flat().filter(d => d.content.trim()).length}</span>
              <span className="text-sm text-[#888]"> 天</span>
            </div>
          </div>
        )}

        {/* 小蒙模式 - Archive */}
        {!isYMode && mView === 'archive' && (
          <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">📋 生成历史</h3>
              <button onClick={() => setMView('calendar')} className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#888] rounded-lg">返回日历</button>
            </div>
            {reportArchive.length === 0 ? (
              <div className="text-center py-8 text-[#666]">暂无历史报告</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-auto">
                {reportArchive.map((record, idx) => (
                  <div key={idx} className="bg-[#161616] rounded-xl p-3 border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${record.type === 'daily' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'}`}>
                          {record.type === 'daily' ? '日报' : '周报'}
                        </span>
                        <span className="text-xs text-[#888]">{record.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { navigator.clipboard.writeText(record.content); alert('已复制'); }}
                          className="px-2 py-1 text-xs bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
                        >复制</button>
                        <button
                          onClick={() => { setGeneratedReport(record.content); setMView('result'); }}
                          className="px-2 py-1 text-xs bg-[#1c1c1c] text-[#888] rounded hover:text-white"
                        >查看</button>
                      </div>
                    </div>
                    <pre className="text-xs text-[#888] whitespace-pre-wrap line-clamp-3">{record.content.substring(0, 200)}...</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 小蒙模式 - 结果 */}
        {!isYMode && mView === 'result' && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 border border-[#1f1f1f]">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">生成结果</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-1.5 text-xs bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a]">📋 复制全文</button>
                <button onClick={() => setMView('calendar')} className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#b0b0b0] rounded-lg border border-[#2a2a2a] hover:text-white">返回</button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs sm:text-sm text-[#c0c0c0] bg-[#0d0d0d] p-3 sm:p-5 rounded-xl overflow-auto max-h-[500px] leading-relaxed border border-[#1a1a1a]">{generatedReport}</pre>
          </div>
        )}

        {/* M模式 - 日期编辑弹窗 */}
        {expandedDay && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpandedDay(null)}>
            <div className="bg-[#111111] rounded-2xl border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] p-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {formatDateDisplay(expandedDay)}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setExpandedDay(null)} className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#888] rounded-lg">关闭</button>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={Object.values(allData).flat().find(d => d.date === expandedDay)?.content || ''}
                  onChange={e => updateDayContent(expandedDay, e.target.value)}
                  placeholder="输入今日工作内容..."
                  className="w-full h-64 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-4 resize-none text-sm"
                  autoFocus
                />
                <div className="mt-4 flex gap-2 justify-end">
                  <button onClick={() => setExpandedDay(null)} className="px-4 py-2 text-sm bg-[#1c1c1c] text-[#888] rounded-lg hover:text-white">取消</button>
                  <button onClick={() => { setExpandedDay(null); setReportType('daily'); handleGenerate(); }} disabled={loading} className="px-4 py-2 text-sm bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] disabled:opacity-50">生成日报</button>
                </div>
              </div>
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
                          <tr
                            key={catIdx}
                            onClick={() => setExpandedCat(expandedCat === catIdx ? null : catIdx)}
                            className={`cursor-pointer transition-all ${catIdx % 2 === 0 ? 'bg-[#141414]' : 'bg-[#111111]'} hover:bg-[#1a1a1a] ${expandedCat === catIdx ? 'bg-[#1a2616]' : ''}`}
                          >
                            <td className="px-2 py-3 text-center text-[#666666] border border-[#2a2a2a]">{catIdx + 1}</td>
                            <td className="px-2 py-3 text-left text-[#22c55e] border border-[#2a2a2a] text-sm font-medium">
                              {category.name}
                              {category.carriedFromLastWeek && <span className="ml-1 text-[8px] text-[#f59e0b]">📌</span>}
                            </td>
                            <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[200px] truncate">
                              {category.entry.thisWeek || '点击填写...'}
                            </td>
                            <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[200px] truncate">
                              {category.entry.cumulative || '-'}
                            </td>
                            <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[200px] truncate">
                              {category.entry.nextWeek || '-'}
                            </td>
                            <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[150px] truncate">
                              {category.entry.issues || '-'}
                            </td>
                            <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs max-w-[150px] truncate">
                              {category.entry.coordination || '-'}
                            </td>
                            <td className="px-2 py-3 text-[#888] border border-[#2a2a2a] text-xs">
                              {category.entry.leader || '-'}
                            </td>
                            <td className="px-1 py-3 border border-[#2a2a2a] text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); copyCategoryText(catIdx); }}
                                className="px-2 py-1 text-xs bg-[#3b82f6]/20 text-[#3b82f6] rounded hover:bg-[#3b82f6]/30"
                              >📋</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 展开的编辑面板 - 点击任意行后显示 */}
                {expandedCat !== null && getCurrentSJCData() && (() => {
                  const category = getCurrentSJCData()!.categories[expandedCat];
                  return (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpandedCat(null)}>
                      <div className="bg-[#111111] rounded-2xl border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-[#111111] border-b border-[#2a2a2a] p-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-white">{category.name}</h3>
                            {category.carriedFromLastWeek && <span className="text-xs text-[#f59e0b]">📌 从上周延续</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => copyCategoryText(expandedCat)} className="px-3 py-1.5 text-xs bg-[#3b82f6] text-white rounded-lg">📋 复制</button>
                            <button onClick={() => setExpandedCat(null)} className="px-3 py-1.5 text-xs bg-[#1c1c1c] text-[#888] rounded-lg">关闭</button>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <label className="text-sm text-[#888] block mb-2">本周完成情况</label>
                            <div className="flex gap-2">
                              <textarea
                                value={category.entry.thisWeek}
                                onChange={e => updateSJCCell(expandedCat, 'thisWeek', e.target.value)}
                                placeholder="填写本周完成的工作..."
                                className="flex-1 h-32 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
                              />
                              <button
                                onClick={() => expandSJCCell(expandedCat, 'thisWeek')}
                                disabled={loading}
                                className="px-3 py-2 text-sm bg-[#22c55e] text-white rounded-xl shrink-0"
                              >AI</button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-[#888] block mb-2">累计完成情况</label>
                            <div className="flex gap-2">
                              <textarea
                                value={category.entry.cumulative}
                                onChange={e => updateSJCCell(expandedCat, 'cumulative', e.target.value)}
                                placeholder="填写累计完成情况..."
                                className="flex-1 h-24 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
                              />
                              <button
                                onClick={() => expandSJCCell(expandedCat, 'cumulative')}
                                disabled={loading}
                                className="px-3 py-2 text-sm bg-[#22c55e] text-white rounded-xl shrink-0"
                              >AI</button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-[#888] block mb-2">下一步工作计划</label>
                            <div className="flex gap-2">
                              <textarea
                                value={category.entry.nextWeek}
                                onChange={e => updateSJCCell(expandedCat, 'nextWeek', e.target.value)}
                                placeholder="填写下周计划..."
                                className="flex-1 h-24 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
                              />
                              <button
                                onClick={() => expandSJCCell(expandedCat, 'nextWeek')}
                                disabled={loading}
                                className="px-3 py-2 text-sm bg-[#22c55e] text-white rounded-xl shrink-0"
                              >AI</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-[#888] block mb-2">存在问题</label>
                              <textarea
                                value={category.entry.issues}
                                onChange={e => updateSJCCell(expandedCat, 'issues', e.target.value)}
                                placeholder="填写问题（如无则填'无'）..."
                                className="w-full h-20 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-[#888] block mb-2">需协调解决事项</label>
                              <textarea
                                value={category.entry.coordination}
                                onChange={e => updateSJCCell(expandedCat, 'coordination', e.target.value)}
                                placeholder="填写需协调事项（如无则填'无'）..."
                                className="w-full h-20 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3 resize-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-[#888] block mb-2">分管领导</label>
                              <input
                                value={category.entry.leader}
                                onChange={e => updateSJCCell(expandedCat, 'leader', e.target.value)}
                                placeholder="填写分管领导姓名..."
                                className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-[#888] block mb-2">责任人</label>
                              <input
                                value={category.entry.owner}
                                onChange={e => updateSJCCell(expandedCat, 'owner', e.target.value)}
                                placeholder="填写责任人姓名..."
                                className="w-full h-10 bg-[#161616] border border-[#2a2a2a] rounded-xl text-[#e0e0e0] p-3"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => expandRowContextAware(expandedCat)}
                            disabled={loading}
                            className="w-full py-3 text-sm bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-xl"
                          >✨ AI一键填充（上下文感知）</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
