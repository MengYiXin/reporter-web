import { useState, useEffect } from 'react';

type ReportType = 'daily' | 'weekly' | 'monthly';
type ReportStyle = 'standard' | 'simple';
type ViewMode = 'calendar' | 'input' | 'result';

interface DayEntry {
  date: string;
  dayName: string;
  content: string;
}

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
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('claude_api_key') || '');

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
        setGeneratedReport('请先设置 API Key（点击右上角设置按钮）');
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

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251101',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setGeneratedReport(`API 错误：${data.error.message}`);
        return;
      }

      const text = data.content?.[0]?.text;
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

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-center text-accent">周报助手</h1>
          <div className="flex gap-2 items-center">
            <span className="text-muted text-sm">API Key:</span>
            <input
              type="password"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                localStorage.setItem('claude_api_key', e.target.value);
              }}
              placeholder="sk-ant-..."
              className="px-3 py-1 text-sm rounded bg-card text-text border border-muted w-48"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition ${viewMode === 'calendar' ? 'bg-accent text-white' : 'bg-card text-muted hover:bg-primary'}`}
            >
              📅 日历
            </button>
            <button
              onClick={() => setViewMode('input')}
              className={`px-4 py-2 rounded-lg transition ${viewMode === 'input' ? 'bg-accent text-white' : 'bg-card text-muted hover:bg-primary'}`}
            >
              ✏️ 输入
            </button>
            <button
              onClick={() => setViewMode('result')}
              disabled={!generatedReport}
              className={`px-4 py-2 rounded-lg transition ${viewMode === 'result' ? 'bg-accent text-white' : 'bg-card text-muted hover:bg-primary'} disabled:opacity-50`}
            >
              📄 结果
            </button>
          </div>

          {viewMode === 'calendar' && (
            <div className="flex gap-2">
              <button onClick={goToPrevWeek} className="px-3 py-2 bg-card text-text rounded hover:bg-primary">← 上周</button>
              <button onClick={goToToday} className="px-3 py-2 bg-card text-text rounded hover:bg-primary">今天</button>
              <button onClick={goToNextWeek} className="px-3 py-2 bg-card text-text rounded hover:bg-primary">下周 →</button>
            </div>
          )}
        </div>

        {viewMode === 'calendar' && (
          <div className="bg-card rounded-xl p-4">
            <div className="grid grid-cols-5 gap-3">
              {weekDays.map(day => (
                <div
                  key={day.date}
                  onClick={() => setSelectedDay(day.date)}
                  className={`p-3 rounded-lg cursor-pointer transition ${selectedDay === day.date ? 'bg-accent text-white' : day.content.trim() ? 'bg-primary text-text border-2 border-green-500' : 'bg-bg text-muted hover:bg-primary'}`}
                >
                  <div className="text-sm font-bold">{day.dayName}</div>
                  <div className="text-xs opacity-75">{formatDateDisplay(day.date)}</div>
                  <div className="mt-2 text-xs h-12 overflow-hidden">
                    {day.content ? day.content.substring(0, 50) + (day.content.length > 50 ? '...' : '') : '点击填写'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={() => { setReportType('daily'); handleGenerate(); }}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                📝 生成今日日报
              </button>
              <button
                onClick={() => { setReportType('weekly'); handleGenerate(); }}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                📊 生成本周周报
              </button>
            </div>
          </div>
        )}

        {viewMode === 'input' && (
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="px-4 py-2 rounded bg-bg text-text border border-muted">
                  <option value="daily">日报</option>
                  <option value="weekly">周报</option>
                  <option value="monthly">月报</option>
                </select>
                <select value={reportStyle} onChange={e => setReportStyle(e.target.value as ReportStyle)} className="px-4 py-2 rounded bg-bg text-text border border-muted">
                  <option value="standard">标准格式</option>
                  <option value="simple">简洁清晰</option>
                </select>
                {reportType === 'daily' && (
                  <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="px-4 py-2 rounded bg-bg text-text border border-muted" />
                )}
              </div>
            </div>

            <textarea
              placeholder={reportType === 'daily' ? '输入今日工作内容...' : reportType === 'weekly' ? '输入本周工作内容汇总...\n\n也可以点击左侧"日历"按钮，查看每日填写的内容自动汇总' : '输入本月工作内容汇总...'}
              value={reportType === 'daily' ? weekDays.find(d => d.date === selectedDay)?.content || '' : weekDays.filter(d => d.content.trim()).map(d => `[${d.dayName}] ${d.content}`).join('\n\n')}
              onChange={e => { if (reportType === 'daily') updateDayContent(selectedDay, e.target.value); }}
              className="w-full h-64 px-4 py-3 rounded bg-bg text-text border border-muted resize-none"
            />

            <button onClick={handleGenerate} disabled={loading} className="w-full mt-4 py-3 bg-accent text-white rounded-lg text-lg font-bold hover:bg-red-600 transition disabled:opacity-50">
              {loading ? '生成中...' : '生成报告'}
            </button>
          </div>
        )}

        {viewMode === 'result' && (
          <div className="bg-card rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-accent">{reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'}结果</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-4 py-2 bg-primary text-text rounded hover:bg-accent transition">复制</button>
                <button onClick={handleExport} className="px-4 py-2 bg-primary text-text rounded hover:bg-accent transition">导出</button>
                <button onClick={() => setViewMode('calendar')} className="px-4 py-2 bg-primary text-text rounded hover:bg-accent transition">返回</button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-text bg-bg p-4 rounded-lg overflow-auto max-h-96">{generatedReport}</pre>
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="mt-4 text-center text-muted text-sm">点击日期框可快速切换 · 数据自动保存到本地</div>
        )}
      </div>
    </div>
  );
}

export default App;
