// 报告类型
export type ReportType = 'daily' | 'weekly' | 'monthly';
export type ReportStyle = 'standard' | 'simple';

// 视图模式
export type ViewMode = 'calendar' | 'input' | 'result' | 'templates' | 'sjc';
export type MView = 'calendar' | 'archive' | 'result';
export type SJCView = 'edit' | 'archive';

// 用户模式
export type UserMode = 'm' | 'y' | null;

// AI 模型
export type AIModel = 'kimi' | 'deepseek' | 'zhipu' | 'qwen' | 'ernie';

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type SaveStatus = 'saved' | 'saving' | 'error';

// 日志条目
export interface DayEntry {
  date: string;
  dayName: string;
  content: string;         // 原始内容
  optimizedContent: string; // AI优化后的内容
}

// AI 模型配置
export interface ModelConfig {
  name: string;
  endpoint: string;
  model: string;
  keyPlaceholder: string;
}

// 三江周报单行数据
export interface SJCDailyEntry {
  thisWeek: string;
  cumulative: string;
  nextWeek: string;
  issues: string;
  coordination: string;
  leader: string;
  owner: string;
  status: 'done' | 'undone' | '';
}

// 三江板块
export interface SJCCategory {
  name: string;
  entry: SJCDailyEntry;
  carriedFromLastWeek: boolean;
}

// 三江周数据
export interface SJCWeekData {
  weekStart: string;
  department: string;
  categories: SJCCategory[];
  carriedFromWeek: string | null;
}

// 三江存档库
export interface SJCArchive {
  [weekStart: string]: SJCWeekData;
}

// 部门配置
export interface DepartmentConfig {
  id: string;
  name: string;
  categories: string[];
}

// 周数据
export interface WeekData {
  weekStart: string;
  days: DayEntry[];
  label: string;
}

// 报告记录
export interface ReportRecord {
  date: string;
  type: ReportType;
  content: string;
  generatedAt: string;
}

// 错误处理
export interface AppError {
  message: string;
  code?: string;
}

// localStorage 数据结构
export interface StoredData {
  apiKey?: string;
  aiModel?: AIModel;
  userMode?: UserMode;
  weekEntries?: Record<string, DayEntry[]>;
  sjcArchive?: SJCArchive;
}
