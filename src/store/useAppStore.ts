import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserMode,
  AIModel,
  DayEntry,
  SJCArchive,
  ReportRecord,
  ReportType,
  MView,
  SJCView,
  SyncStatus,
  SaveStatus,
  SJCWeekData,
  SJCCategory,
  ViewMode,
} from '../types';
import { DEFAULT_AI_MODEL, SJC_DEPARTMENTS, SJC_CATEGORIES } from '../constants';

// ============ Helper Functions ============

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
      optimizedContent: '',
    });
  }
  return days;
}

function getLastWeekStart(weekStart: string): string | null {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

// ============ Store Interface ============

interface AppState {
  // 用户状态
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;

  // AI 配置
  apiKey: string;
  aiModel: AIModel;
  ghToken: string;
  gistId: string;
  setApiKey: (key: string) => void;
  setAiModel: (model: AIModel) => void;
  setGhToken: (token: string) => void;
  setGistId: (id: string) => void;

  // 同步状态
  syncStatus: SyncStatus;

  // M 模式数据
  allData: Record<string, DayEntry[]>;
  selectedDay: string;
  currentWeekStart: string;
  mView: MView;
  reportArchive: ReportRecord[];
  generatedReport: string;

  // Y 模式数据
  sjcArchive: SJCArchive;
  currentDepartment: string;
  sjcView: SJCView;
  expandedCat: number | null;
  viewMode: ViewMode;

  // 报告类型
  reportType: ReportType;

  // UI 状态
  loading: boolean;
  saveStatus: SaveStatus;
  lastSaved: string;
  isMobile: boolean;

  // M 模式 Actions
  setSelectedDay: (date: string) => void;
  setCurrentWeekStart: (weekStart: string) => void;
  setMView: (view: MView) => void;
  updateDayContent: (date: string, content: string) => void;
  updateOptimizedContent: (date: string, content: string) => void;
  initializeWeek: (weekStart: string, days: DayEntry[]) => void;
  setReportType: (type: ReportType) => void;
  setGeneratedReport: (report: string) => void;
  setLoading: (loading: boolean) => void;
  saveReportToArchive: (type: ReportType, content: string) => void;

  // Y 模式 Actions
  setViewMode: (view: ViewMode) => void;
  setSjcView: (view: SJCView) => void;
  setExpandedCat: (index: number | null) => void;
  setCurrentDepartment: (dept: string) => void;
  selectWeek: (weekStart: string) => void;
  updateSJCCell: (categoryIndex: number, field: string, value: string) => void;
  createWeekData: (weekStart: string, department: string, carriedFromWeek: string | null) => SJCWeekData;
  carryOverUnfinished: () => void;
  getCurrentSJCData: () => SJCWeekData | null;
  hasUnfinishedFromLastWeek: () => boolean;
  getArchivedWeeks: () => { weekStart: string; label: string }[];

  // 工具
  setSyncStatus: (status: SyncStatus) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSaved: (time: string) => void;
  setIsMobile: (mobile: boolean) => void;

  // 初始化
  initializeForUserMode: () => void;
}

// ============ Store Implementation ============

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      userMode: null,
      apiKey: '',
      aiModel: DEFAULT_AI_MODEL,
      ghToken: '',
      gistId: '',
      syncStatus: 'idle',
      allData: {},
      selectedDay: '',
      currentWeekStart: '',
      mView: 'calendar',
      reportArchive: [],
      generatedReport: '',
      sjcArchive: {},
      currentDepartment: '运营管理二部',
      sjcView: 'edit',
      expandedCat: null,
      viewMode: 'sjc',
      reportType: 'daily',
      loading: false,
      saveStatus: 'saved',
      lastSaved: '',
      isMobile: false,

      // Setters
      setUserMode: (mode) => set({ userMode: mode }),
      setApiKey: (key) => set({ apiKey: key }),
      setAiModel: (model) => set({ aiModel: model }),
      setGhToken: (token) => set({ ghToken: token }),
      setGistId: (id) => set({ gistId: id }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      setSaveStatus: (status) => set({ saveStatus: status }),
      setLastSaved: (time) => set({ lastSaved: time }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setSelectedDay: (date) => set({ selectedDay: date }),
      setCurrentWeekStart: (weekStart) => set({ currentWeekStart: weekStart }),
      setMView: (view) => set({ mView: view }),
      setReportType: (type) => set({ reportType: type }),
      setGeneratedReport: (report) => set({ generatedReport: report }),
      setLoading: (loading) => set({ loading }),
      setViewMode: (view) => set({ viewMode: view }),
      setSjcView: (view) => set({ sjcView: view }),
      setExpandedCat: (index) => set({ expandedCat: index }),
      setCurrentDepartment: (dept) => set({ currentDepartment: dept }),

      // M 模式 Actions
      updateDayContent: (date, content) => {
        set((state) => {
          const updated = { ...state.allData };
          Object.keys(updated).forEach((weekStart) => {
            updated[weekStart] = updated[weekStart].map((d) =>
              d.date === date ? { ...d, content } : d
            );
          });
          return { allData: updated };
        });
      },

      updateOptimizedContent: (date, content) => {
        set((state) => {
          const updated = { ...state.allData };
          Object.keys(updated).forEach((weekStart) => {
            updated[weekStart] = updated[weekStart].map((d) =>
              d.date === date ? { ...d, optimizedContent: content } : d
            );
          });
          return { allData: updated };
        });
      },

      initializeWeek: (weekStart, days) => {
        set((state) => ({
          allData: { ...state.allData, [weekStart]: days },
        }));
      },

      saveReportToArchive: (type, content) => {
        const state = get();
        const record: ReportRecord = {
          date: type === 'daily' ? state.selectedDay : state.currentWeekStart,
          type,
          content,
          generatedAt: new Date().toISOString(),
        };
        set((state) => ({
          reportArchive: [record, ...state.reportArchive].slice(0, 50),
        }));
      },

      // Y 模式 Actions
      createWeekData: (weekStart, department, carriedFromWeek = null) => {
        const state = get();
        let carriedCategories: SJCCategory[] = [];

        if (carriedFromWeek && state.sjcArchive[carriedFromWeek]) {
          const lastWeek = state.sjcArchive[carriedFromWeek];
          carriedCategories = lastWeek.categories
            .filter((c) => c.entry.status === 'undone' || c.entry.cumulative.trim())
            .map((c) => ({
              name: c.name,
              entry: {
                thisWeek: '',
                cumulative: c.entry.cumulative,
                nextWeek: '',
                issues: '',
                coordination: '',
                leader: c.entry.leader,
                owner: c.entry.owner,
                status: '' as const,
              },
              carriedFromLastWeek: true,
            }));
        }

        const dept = SJC_DEPARTMENTS.find((d) => d.name === department);
        const categories = dept ? dept.categories : SJC_CATEGORIES;

        const allCategories: SJCCategory[] = [...carriedCategories];
        categories.forEach((catName) => {
          if (!allCategories.some((c) => c.name === catName)) {
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
                status: '',
              },
              carriedFromLastWeek: false,
            });
          }
        });

        return {
          weekStart,
          department,
          categories: allCategories,
          carriedFromWeek,
        };
      },

      selectWeek: (weekStart) => {
        const state = get();
        set({ currentWeekStart: weekStart });

        if (!state.sjcArchive[weekStart]) {
          const lastWeekStart = getLastWeekStart(weekStart);
          const newWeekData = state.createWeekData(
            weekStart,
            state.currentDepartment,
            state.hasUnfinishedFromLastWeek() ? lastWeekStart : null
          );
          set((s) => ({
            sjcArchive: { ...s.sjcArchive, [weekStart]: newWeekData },
          }));
        }
      },

      updateSJCCell: (categoryIndex, field, value) => {
        set((state) => {
          const updated = { ...state.sjcArchive };
          const weekData = updated[state.currentWeekStart];
          if (!weekData) return state;

          const newCategories = [...weekData.categories];
          newCategories[categoryIndex] = {
            ...newCategories[categoryIndex],
            entry: { ...newCategories[categoryIndex].entry, [field]: value },
          };

          updated[state.currentWeekStart] = { ...weekData, categories: newCategories };
          return { sjcArchive: updated };
        });
      },

      carryOverUnfinished: () => {
        const state = get();
        const lastWeekStart = getLastWeekStart(state.currentWeekStart);
        if (!lastWeekStart) return;

        const newWeekData = state.createWeekData(
          state.currentWeekStart,
          state.currentDepartment,
          lastWeekStart
        );

        set((s) => ({
          sjcArchive: { ...s.sjcArchive, [state.currentWeekStart]: newWeekData },
          saveStatus: 'saving',
        }));
      },

      getCurrentSJCData: () => {
        const state = get();
        return state.sjcArchive[state.currentWeekStart] || null;
      },

      hasUnfinishedFromLastWeek: () => {
        const state = get();
        const lastWeekStart = getLastWeekStart(state.currentWeekStart);
        if (!lastWeekStart || !state.sjcArchive[lastWeekStart]) return false;
        return state.sjcArchive[lastWeekStart].categories.some(
          (c) => c.entry.status === 'undone'
        );
      },

      getArchivedWeeks: () => {
        const state = get();
        return Object.keys(state.sjcArchive)
          .sort((a, b) => b.localeCompare(a))
          .map((ws) => {
            const d = new Date(ws);
            const endDay = new Date(d);
            endDay.setDate(endDay.getDate() + 4);
            return {
              weekStart: ws,
              label: `${d.getMonth() + 1}/${d.getDate()} - ${endDay.getMonth() + 1}/${endDay.getDate()}`,
            };
          });
      },

      // 初始化
      initializeForUserMode: () => {
        const state = get();
        if (state.userMode === 'y') {
          const today = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - today.getDay() + 1);
          const weekStart = monday.toISOString().split('T')[0];

          if (Object.keys(state.sjcArchive).length === 0) {
            const weekData = state.createWeekData(weekStart, state.currentDepartment, null);
            set({
              currentWeekStart: weekStart,
              sjcArchive: { [weekStart]: weekData },
              viewMode: 'sjc',
            });
          } else {
            const weeks = Object.keys(state.sjcArchive).sort((a, b) => b.localeCompare(a));
            set({ currentWeekStart: weeks[0], viewMode: 'sjc' });
          }
        } else if (state.userMode === 'm') {
          const weekDays = getWeekDays();
          const weekStart = weekDays[0]?.date || '';
          if (!state.allData[weekStart]) {
            state.initializeWeek(weekStart, weekDays);
          }
          set({ currentWeekStart: weekStart, selectedDay: weekDays[0]?.date || '' });
        }
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        aiModel: state.aiModel,
        ghToken: state.ghToken,
        gistId: state.gistId,
        userMode: state.userMode,
        allData: state.allData,
        sjcArchive: state.sjcArchive,
        reportArchive: state.reportArchive,
        currentDepartment: state.currentDepartment,
      }),
    }
  )
);
