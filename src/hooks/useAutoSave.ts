import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tab } from './useTabs';

/**
 * 自動保存とタブキャッシュの保存を統合したフック。
 * タイピングが止まったタイミングでまとめて保存することで、パフォーマンスを向上させ、
 * ReactのState更新とMonacoの競合を回避します。
 */
export const useAutoSave = (activeTab: Tab, onSave: (id: string) => Promise<void>) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 古いタイマーをクリア
    if (timerRef.current) clearTimeout(timerRef.current);

    // タイピング中（中身が空でない場合）はデバウンスして保存
    timerRef.current = setTimeout(async () => {
      try {
        // 1. キャッシュ保存（常に実行）
        if (activeTab.cacheId && activeTab.content !== undefined) {
          await invoke('save_tab_cache', { cacheId: activeTab.cacheId, content: activeTab.content });
        }

        // 2. 自動保存（ファイルパスがあり、変更がある場合のみ）
        if (activeTab.path && activeTab.isModified) {
          await onSave(activeTab.id);
        }
      } catch (e) {
        console.error('AutoSave failed:', e);
      }
    }, 1500); // 1.5秒入力が止まったら保存

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeTab.content, activeTab.path, activeTab.isModified, activeTab.id, activeTab.cacheId, onSave]);
};
