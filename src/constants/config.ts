import type { DepartmentConfig } from '../types';

// 部门配置
export const SJC_DEPARTMENTS: DepartmentConfig[] = [
  { id: 'yyg1', name: '运营管理一部', categories: ['考核指标板块（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'] },
  { id: 'yyg2', name: '运营管理二部', categories: ['考核指标板块（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'] },
  { id: 'yyg3', name: '运营管理三部', categories: ['考核指标板块（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'] },
  { id: 'cw', name: '财务融资部', categories: ['财务核算板块', '融资资金板块'] },
  { id: 'fk', name: '风控合规部', categories: ['风控合规管理板块', '法务内部管理板块', '涉诉案件板块'] },
  { id: 'zh', name: '综合管理部', categories: ['党建人事板块', '综合行政板块', '督查督办及后勤保障板块'] },
];

// 默认板块
export const SJC_CATEGORIES = ['考核指标板块\n（营收、毛利）', '回款板块', '业务执行板块', '拓展业务板块', '其他工作'];

// localStorage keys
export const STORAGE_KEYS = {
  AI_API_KEY: 'ai_api_key',
  AI_MODEL: 'ai_model',
  GH_TOKEN: 'gh_token',
  GIST_ID: 'gist_id',
  WEEK_ENTRIES: 'weekEntries',
  SJC_ARCHIVE: 'sjc_archive',
  REPORT_ARCHIVE: 'report_archive',
  REMEMBERED_ACCOUNT: 'remembered_account',
  REMEMBERED_PASSWORD: 'remembered_password',
  REMEMBER_ACCOUNT: 'remember_account',
  REMEMBER_PASSWORD: 'remember_password',
} as const;

// Gist 文件名
export const GIST_FILENAME = 'weekly-reporter-data.json';

// 默认 AI 模型
export const DEFAULT_AI_MODEL = 'kimi';
