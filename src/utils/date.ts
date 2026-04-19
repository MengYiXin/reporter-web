import type { DayEntry } from '../types';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getWeekDays(baseDate: Date = new Date()): DayEntry[] {
  const days: DayEntry[] = [];
  const date = new Date(baseDate);
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + mondayOffset);

  for (let i = 0; i < 5; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      dayName: DAY_NAMES[d.getDay()],
      content: '',
      optimizedContent: '',
    });
  }
  return days;
}

export function getWeeks(): { weekStart: string; days: DayEntry[]; label: string }[] {
  const weeks: { weekStart: string; days: DayEntry[]; label: string }[] = [];
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
      days.push({
        date: d.toISOString().split('T')[0],
        dayName: DAY_NAMES[d.getDay()],
        content: '',
        optimizedContent: '',
      });
    }
    weeks.push({ weekStart: weekStartStr, days, label });
  }
  return weeks;
}

export function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const endDay = new Date(d);
  endDay.setDate(endDay.getDate() + 4);
  return `${d.getMonth() + 1}/${d.getDate()} - ${endDay.getMonth() + 1}/${endDay.getDate()}`;
}

export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function getLastWeekStart(weekStart: string): string | null {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

export function getTodayWeekStart(): string {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  return monday.toISOString().split('T')[0];
}
