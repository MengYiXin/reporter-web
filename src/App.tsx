import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useSjcAutoSave, useWeekEntriesAutoSave } from './hooks/useAutoSave';
import { useMobile } from './hooks/useMobile';
import { Header, LoadingOverlay } from './components/common';
import { UserSelectScreen, LoginScreen } from './components/user-select';
import { MModeCalendar, MModeArchive, MModeResult } from './components/m-mode';
import { YModeWorkRecord, YModeResult } from './components/y-mode';
import { getWeeks, formatWeekLabel, getLastWeekStart } from './utils/date';
import { callAI, buildTechReportPrompt, buildSJCReportPrompt, buildCellExpandPrompt } from './services/ai';
import { GIST_FILENAME } from './constants';
import { STORAGE_KEYS } from './constants/config';
import type { ReportType } from './types';

function App() {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const userMode = useAppStore((state) => state.userMode);
  const loading = useAppStore((state) => state.loading);
  const setLoading = useAppStore((state) => state.setLoading);
  const setGeneratedReport = useAppStore((state) => state.setGeneratedReport);
  const apiKey = useAppStore((state) => state.apiKey);
  const aiModel = useAppStore((state) => state.aiModel);
  const allData = useAppStore((state) => state.allData);
  const selectedDay = useAppStore((state) => state.selectedDay);
  const currentWeekStart = useAppStore((state) => state.currentWeekStart);
  const mView = useAppStore((state) => state.mView);
  const setMView = useAppStore((state) => state.setMView);
  const sjcArchive = useAppStore((state) => state.sjcArchive);
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const ghToken = useAppStore((state) => state.ghToken);
  const gistId = useAppStore((state) => state.gistId);
  const setGistId = useAppStore((state) => state.setGistId);
  const setSyncStatus = useAppStore((state) => state.setSyncStatus);
  const saveReportToArchive = useAppStore((state) => state.saveReportToArchive);
  const updateOptimizedContent = useAppStore((state) => state.updateOptimizedContent);
  const updateSJCCell = useAppStore((state) => state.updateSJCCell);

  const isMobile = useMobile();

  // Auto-save hooks
  useSjcAutoSave();
  useWeekEntriesAutoSave();

  // 初始化本周数据
  useEffect(() => {
    if (!userMode) return;
    const saved = localStorage.getItem(STORAGE_KEYS.WEEK_ENTRIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weekEntries) {
          useAppStore.setState({ allData: parsed.weekEntries });
        } else if (parsed.days && parsed.weekStart) {
          useAppStore.setState({ allData: { [parsed.weekStart]: parsed.days } });
        }
      } catch {
        console.error('Failed to load week entries');
      }
    }
  }, [userMode]);

  // ============ AI 生成 ============

  const handleGenerateMReport = async (type: ReportType) => {
    setLoading(true);
    setGeneratedReport('');

    try {
      let content = '';
      let targetDate = '';
      const weeks = getWeeks();
      const currentWeekData = allData[currentWeekStart] || weeks[1].days;

      if (type === 'daily') {
        if (!selectedDay) {
          setGeneratedReport('请选择一个日期');
          setLoading(false);
          return;
        }
        const dayEntry = Object.values(allData).flat().find((d) => d.date === selectedDay);
        // 日报优先使用优化后的内容
        content = dayEntry?.optimizedContent || dayEntry?.content || '';
        targetDate = selectedDay;
      } else {
        // 周报使用所有天的优化后内容
        const filledDays = Object.values(allData).flat().filter((d) => d.optimizedContent.trim() || d.content.trim());
        if (filledDays.length === 0) {
          setGeneratedReport('请至少填写或优化一天的工作内容');
          setLoading(false);
          return;
        }
        content = filledDays.map((d) => {
          const text = d.optimizedContent || d.content;
          return `${d.dayName} (${d.date}):\n${text}`;
        }).join('\n\n');
        targetDate = `${currentWeekData[0]?.date || ''} 至 ${currentWeekData[4]?.date || ''}`;
      }

      if (!content.trim()) {
        setGeneratedReport(type === 'daily' ? '请输入工作内容' : '请至少填写或优化一天的工作内容');
        setLoading(false);
        return;
      }

      const { systemPrompt, userPrompt } = buildTechReportPrompt(type, targetDate, content);
      const result = await callAI({ apiKey, model: aiModel, systemPrompt, userPrompt });

      if (result.error) {
        setGeneratedReport(result.error);
        setLoading(false);
        return;
      }

      setGeneratedReport(result.content);
      if (type === 'daily' || type === 'weekly') {
        saveReportToArchive(type, result.content);
      }
      // 把AI优化后的内容保存到优化内容字段
      if (type === 'daily' && selectedDay) {
        updateOptimizedContent(selectedDay, result.content);
      }
      setMView('result');
    } catch (error: unknown) {
      setGeneratedReport(`生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSJCReport = async () => {
    const weekData = sjcArchive[currentWeekStart];
    if (!weekData) return;

    setLoading(true);
    setGeneratedReport('');

    try {
      if (!apiKey.trim()) {
        setGeneratedReport('请先设置 API Key');
        return;
      }

      const hasContent = weekData.categories.some(
        (c) => c.entry.thisWeek.trim() || c.entry.cumulative.trim()
      );
      if (!hasContent) {
        setGeneratedReport('请至少填写本周完成情况');
        return;
      }

      const weekRange = formatWeekLabel(weekData.weekStart);
      const content = weekData.categories
        .map(
          (c) =>
            `【${c.name}】\n本周完成情况：${c.entry.thisWeek || '无'}\n累计完成情况：${c.entry.cumulative || '无'}\n下一步工作计划：${c.entry.nextWeek || '无'}\n存在问题：${c.entry.issues || '无'}\n需协调解决事项：${c.entry.coordination || '无'}\n分管领导：${c.entry.leader || '无'}\n责任人：${c.entry.owner || '无'}`
        )
        .join('\n\n');

      const { systemPrompt, userPrompt } = buildSJCReportPrompt(weekRange, weekData.department, content);
      const result = await callAI({ apiKey, model: aiModel, systemPrompt, userPrompt });

      if (result.error) {
        setGeneratedReport(result.error);
        return;
      }

      setGeneratedReport(result.content);
      setViewMode('result');
    } catch (error: unknown) {
      setGeneratedReport(`生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandSJCCell = async (categoryIndex: number, field: string) => {
    const weekData = sjcArchive[currentWeekStart];
    if (!weekData) return;

    const category = weekData.categories[categoryIndex];
    const entry = category.entry;

    if (!entry.thisWeek.trim() && field === 'thisWeek') {
      alert('请先填写本周工作内容');
      return;
    }
    if (!apiKey.trim()) {
      alert('请先设置 API Key');
      return;
    }

    setLoading(true);

    const lastWeekStart = getLastWeekStart(currentWeekStart);
    const lastWeekData = lastWeekStart ? sjcArchive[lastWeekStart] : null;
    const lastCategory = lastWeekData?.categories.find((c) => c.name === category.name);

    const context = {
      thisWeek: entry.thisWeek,
      cumulative: entry.cumulative,
      lastCumulative: lastCategory?.entry.cumulative,
      nextWeekPlan: entry.nextWeek,
      issues: entry.issues,
      status: entry.status === 'done' ? '已完成' : entry.status === 'undone' ? '未完成' : '进行中',
    };

    const userPrompt = buildCellExpandPrompt(category.name, field as 'thisWeek' | 'cumulative' | 'nextWeek' | 'issues' | 'coordination', context);

    try {
      const result = await callAI({
        apiKey,
        model: aiModel,
        systemPrompt: '你是国企周报助手。请用正式简洁的语言输出。',
        userPrompt,
        maxTokens: 512,
        timeoutMs: 30000,
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.content) {
        updateSJCCell(categoryIndex, field, result.content);
      }
    } catch (error: unknown) {
      alert(`生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // ============ GitHub 同步 ============

  const uploadToGithub = async () => {
    if (!ghToken) {
      alert('请先输入 GitHub Token');
      return;
    }
    setSyncStatus('syncing');

    try {
      const storedData = {
        apiKey,
        aiModel,
        userMode,
        weekEntries: allData,
        sjcArchive: userMode === 'y' ? sjcArchive : undefined,
      };
      const content = JSON.stringify(storedData, null, 2);

      if (gistId) {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } }),
        });
        if (!response.ok) throw new Error('Upload failed');
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
            files: { [GIST_FILENAME]: { content } },
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Upload failed');
        setGistId(data.id);
        localStorage.setItem(STORAGE_KEYS.GIST_ID, data.id);
      }

      setSyncStatus('success');
      alert('上传成功！');
    } catch {
      setSyncStatus('error');
      alert('上传失败，请检查网络后重试');
    }

    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const downloadFromGithub = async () => {
    if (!ghToken || !gistId) {
      alert('请先确保已上传过数据');
      return;
    }
    setSyncStatus('syncing');

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `Bearer ${ghToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.files[GIST_FILENAME]?.content;

        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.weekEntries) useAppStore.setState({ allData: parsed.weekEntries });
          if (parsed.sjcArchive) useAppStore.setState({ sjcArchive: parsed.sjcArchive });
          if (parsed.apiKey) {
            useAppStore.setState({ apiKey: parsed.apiKey });
            localStorage.setItem(STORAGE_KEYS.AI_API_KEY, parsed.apiKey);
          }
          setSyncStatus('success');
          alert('下载成功！');
        }
      }
    } catch {
      setSyncStatus('error');
      alert('下载失败！');
    }

    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  // ============ 渲染 ============

  // 登录页面
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // 用户选择页面（未选择模式时）
  if (!userMode) {
    return <UserSelectScreen />;
  }

  const isYMode = userMode === 'y';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {loading && <LoadingOverlay message="AI 处理中..." />}
      <div className={`max-w-6xl mx-auto px-4 py-6 ${isMobile ? 'px-3' : 'px-6 py-8'}`}>
        {/* Header */}
        <Header />

        {/* 同步按钮 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={uploadToGithub}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] disabled:opacity-50"
          >
            上传
          </button>
          <button
            onClick={downloadFromGithub}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50"
          >
            下载
          </button>
          <span className="text-xs text-[#666666] self-center ml-2">
            {gistId ? '已绑定' : '未绑定'}
          </span>
        </div>

        {/* 导航标签 */}
        <div className="flex gap-1 mb-4 bg-[#141414] p-1 rounded-xl border border-[#1f1f1f]">
          {isYMode ? (
            <button
              onClick={() => setViewMode('sjc')}
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                viewMode === 'sjc'
                  ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]'
                  : 'text-[#666666] hover:text-[#b0b0b0]'
              }`}
            >
              工作记录
            </button>
          ) : (
            <>
              <button
                onClick={() => setMView('calendar')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  mView === 'calendar'
                    ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]'
                    : 'text-[#666666] hover:text-[#b0b0b0]'
                }`}
              >
                日历
              </button>
              <button
                onClick={() => setMView('archive')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  mView === 'archive'
                    ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]'
                    : 'text-[#666666] hover:text-[#b0b0b0]'
                }`}
              >
                存档
              </button>
              <button
                onClick={() => setMView('result')}
                className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  mView === 'result'
                    ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a]'
                    : 'text-[#666666] hover:text-[#b0b0b0]'
                }`}
              >
                结果
              </button>
            </>
          )}
        </div>

        {/* M 模式视图 */}
        {!isYMode && mView === 'calendar' && (
          <MModeCalendar onGenerate={handleGenerateMReport} />
        )}
        {!isYMode && mView === 'archive' && <MModeArchive />}
        {!isYMode && mView === 'result' && <MModeResult />}

        {/* Y 模式视图 */}
        {isYMode && viewMode === 'sjc' && (
          <YModeWorkRecord
            onGenerateReport={handleGenerateSJCReport}
            onExpandCell={handleExpandSJCCell}
          />
        )}

        {/* 结果视图 */}
        {viewMode === 'result' && isYMode && (
          <YModeResult onBack={() => setViewMode('sjc')} />
        )}
        {viewMode === 'result' && !isYMode && (
          <MModeResult />
        )}

        <div className="mt-4 sm:mt-6 text-center text-xs text-[#444444]">
          {isYMode ? '三江供应链格式 · 国企风格' : '数据保存在本地 · 上传 GitHub 可多设备同步'}
        </div>
      </div>
    </div>
  );
}

export default App;
