import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface Tab {
  id: string;
  name: string;
  path: string | null;
  content: string;
  encoding: string;
  isModified: boolean;
  isCustomName?: boolean;
  language?: string; // 言語設定
  cacheId?: string;  // キャッシュ用ID
}

// 拡張子と言語のマップ
const extToLang: { [key: string]: string } = {
  'js': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'jsx': 'javascript',
  'py': 'python',
  'rs': 'rust',
  'html': 'html',
  'css': 'css',
  'json': 'json',
  'md': 'markdown',
  'txt': 'plaintext',
  'sql': 'sql',
  'yaml': 'yaml',
  'yml': 'yaml',
  'sh': 'shell',
  'bat': 'powershell',
  'ps1': 'powershell',
};

export const useTabs = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'initial', name: 'Untitled', path: null, content: '', encoding: 'UTF-8', isModified: false, isCustomName: false, language: 'markdown', cacheId: 'initial' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('initial');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const getLanguageFromPath = (pathOrName: string) => {
    const fileName = pathOrName.split(/[\\/]/).pop() || pathOrName;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return (ext && extToLang[ext]) || 'plaintext';
  };

  const updateTabContent = useCallback((id: string, content: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id === id) {
        let newName = t.name;
        // 【修正】ユーザーが名前を付けてない (isCustomName: false) かつ、現在の名前が空か Untitled の時だけ自動ネーミング！
        if (!t.isCustomName && (t.name === 'Untitled' || t.name === '')) {
          const firstContentLine = content.split('\n').find(line => line.trim().length > 0);  
          if (firstContentLine) {
            newName = firstContentLine.trim().substring(0, 20);
          }
        }

        return { ...t, content, name: newName, isModified: true };
        }
        return t;
        }));
        }, []);

  const addTab = useCallback((name: string, content: string = '', path: string | null = null, encoding: string = 'UTF-8', isCustomName: boolean = false) => {
    const id = crypto.randomUUID();
    const cacheId = crypto.randomUUID();
    const language = getLanguageFromPath(name);
    // 最初から名前がある場合はカスタム名として扱う
    const finalIsCustomName = isCustomName || (name !== 'Untitled' && name !== '');
    const newTab: Tab = { id, name: name || 'Untitled', path, content, encoding, isModified: false, isCustomName: finalIsCustomName, language, cacheId };
    
    // 新規タブ作成時もキャッシュ保存
    invoke('save_tab_cache', { cacheId, content }).catch(console.error);
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
    return id;
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length === 1) return prev; 
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const openFile = async (path: string) => {
    try {
      const data: { content: string, encoding: string } = await invoke('read_text_file', { path });
      const name = path.split(/[\\/]/).pop() || 'Untitled';
      const existingTab = tabs.find(t => t.path === path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }
      addTab(name, data.content, path, data.encoding, true);
    } catch (e) {
      console.error(e);
      alert('ファイルを開けなかったよ😭\n' + e);
    }
  };

  const saveFile = async (id: string, customPath?: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    const targetPath = customPath || tab.path;
    if (!targetPath) return;

    try {
      await invoke('write_text_file', { path: targetPath, content: tab.content, encoding: tab.encoding });
      const name = targetPath.split(/[\\/]/).pop() || tab.name;
      const language = getLanguageFromPath(name);
      // 保存したらカスタム名確定！
      setTabs(prev => prev.map(t => t.id === id ? { ...t, path: targetPath, name, isModified: false, isCustomName: true, language } : t));
    } catch (e) {
      console.error(e);
      alert('保存に失敗しちゃった😭\n' + e);
    }
  };

  const setAllTabs = useCallback((newTabs: Tab[]) => {
    setTabs(newTabs);
    if (newTabs.length > 0) setActiveTabId(newTabs[0].id);
  }, []);

  const renameTab = useCallback((id: string, newName: string) => {
    const language = getLanguageFromPath(newName);
    // 手動リネームはカスタム名確定！
    setTabs(prev => prev.map(t => t.id === id ? { ...t, name: newName, isCustomName: true, language } : t));
  }, []);

  const updateTabEncoding = useCallback((id: string, encoding: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, encoding, isModified: true } : t));
  }, []);

  return {
    tabs, activeTabId, activeTab, setActiveTabId, updateTabContent, addTab, closeTab, openFile, saveFile, setTabs, setAllTabs, renameTab, updateTabEncoding
  };
};
