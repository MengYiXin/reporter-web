import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { STORAGE_KEYS } from '../constants';

export function useAutoSave(data: unknown, key: string, delay = 500) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const setSaveStatus = useAppStore((state) => state.setSaveStatus);
  const setLastSaved = useAppStore((state) => state.setLastSaved);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        setSaveStatus('saved');
        setLastSaved(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      } catch {
        setSaveStatus('error');
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay, setSaveStatus, setLastSaved]);
}

// Hook for SJC archive auto-save
export function useSjcAutoSave() {
  const sjcArchive = useAppStore((state) => state.sjcArchive);
  useAutoSave(sjcArchive, STORAGE_KEYS.SJC_ARCHIVE);
}

// Hook for week entries auto-save
export function useWeekEntriesAutoSave() {
  const allData = useAppStore((state) => state.allData);
  useAutoSave(allData, STORAGE_KEYS.WEEK_ENTRIES);
}
