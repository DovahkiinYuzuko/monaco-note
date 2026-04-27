import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import "./App.css";
import MonacoEditor from "./components/Editor";
import TabBar from "./components/TabBar";
import Preview from "./components/Preview";
import Settings from "./components/Settings";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";
import { useConfig } from "./hooks/useConfig";
import { 
  Eye, Edit3, Columns, Settings as SettingsIcon, FilePlus, FolderOpen, Save, Search, 
  Repeat, Undo2, Redo2, Link as LinkIcon, Link2Off 
} from "lucide-react";

import { useTabs, Tab } from "./hooks/useTabs";
import { useAutoSave } from "./hooks/useAutoSave";
import { useCommandPalette, Command } from "./hooks/useCommandPalette";

type ViewMode = "editor" | "preview" | "split";
const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const translations = {
  ja: { new: "新規", open: "開く", save: "保存", undo: "元に戻す", redo: "やり直し", search: "検索", replace: "置換", loading: "読み込み中...", openSettings: "設定を開く", syncOn: "スクロール同期: ON", syncOff: "スクロール同期: OFF" },
  en: { new: "New", open: "Open", save: "Save", undo: "Undo", redo: "Redo", search: "Search", replace: "Replace", loading: "Loading...", openSettings: "Open Settings", syncOn: "Scroll Sync: ON", syncOff: "Scroll Sync: OFF" }
};

function App() {
  // 1. 全ての Hooks は一番最初、かつ無条件に呼ぶ
  const { config, setConfig, isLoaded: isConfigLoaded } = useConfig();
  const { tabs, activeTabId, activeTab, setActiveTabId, updateTabContent, addTab, closeTab, openFile, saveFile, setAllTabs, renameTab, updateTabEncoding, setTabs } = useTabs();
  const { isOpen: isCommandPaletteOpen, initialSearch, closePalette, togglePalette } = useCommandPalette();
  
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [syncScroll, setSyncScroll] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [splitRatio, setSplitRatio] = useState(50);
  const [resizingType, setResizingType] = useState<"sidebar" | "split" | null>(null);
  
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  
  const t = translations[config?.lang || 'ja'];

  // 2. コールバック群の定義
  const handleOpenFile = useCallback(async () => { 
    try { 
      const selected = await open({ multiple: false }); 
      if (selected && typeof selected === 'string') openFile(selected); 
    } catch (e) {} 
  }, [openFile]);
  
  const handleSaveAs = useCallback(async () => { 
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    try { 
      const selected = await save({ defaultPath: tab.name }); 
      if (selected) await saveFile(activeTabId, selected); 
    } catch (e) {
      console.error("Save As failed", e);
    } 
  }, [tabs, activeTabId, saveFile]);

  const handleSave = useCallback(async () => { 
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab || tab.id === 'initial') return;
    
    if (tab.path) {
      await saveFile(activeTabId); 
    } else {
      await handleSaveAs(); 
    }
  }, [tabs, activeTabId, saveFile, handleSaveAs]);

  const handleOpenConfigJson = useCallback(async () => {
    try {
      const configPath = await invoke<string>('get_config_path');
      await openFile(configPath);
      setShowSettings(false);
    } catch (e) {
      console.error("Failed to open config JSON", e);
    }
  }, [openFile]);

  const appCommands = useMemo<Command[]>(() => {
    if (!config) return [];
    return [
      { id: 'new-file', name: t.new, category: 'File', shortcut: 'Ctrl+N', action: () => addTab('Untitled', '', null, config.default_encoding) },
      { id: 'open-file', name: t.open, category: 'File', shortcut: 'Ctrl+O', action: handleOpenFile },
      { id: 'save-file', name: t.save, category: 'File', shortcut: 'Ctrl+S', action: handleSave },
      { id: 'open-settings', name: t.openSettings, category: 'App', shortcut: 'Ctrl+,', action: () => setShowSettings(true) },
      { id: 'open-settings-json', name: 'Settings: Open JSON', category: 'App', action: handleOpenConfigJson },
      { id: 'view-editor', name: '表示: エディタのみ', category: 'View', action: () => setViewMode('editor') },
      { id: 'view-split', name: '表示: 分割画面', category: 'View', action: () => setViewMode('split') },
      { id: 'view-preview', name: '表示: プレビューのみ', category: 'View', action: () => setViewMode('preview') },
      { id: 'toggle-sync', name: 'Scroll Sync: ' + (syncScroll ? 'ON' : 'OFF'), category: 'View', action: () => setSyncScroll(!syncScroll) },
      { id: 'enc-utf8', name: 'Encoding: UTF-8', category: 'Encoding', action: () => activeTabId && updateTabEncoding(activeTabId, 'UTF-8') },
      { id: 'enc-sjis', name: 'Encoding: Shift-JIS', category: 'Encoding', action: () => activeTabId && updateTabEncoding(activeTabId, 'Shift-JIS') },
      { id: 'enc-eucjp', name: 'Encoding: EUC-JP', category: 'Encoding', action: () => activeTabId && updateTabEncoding(activeTabId, 'EUC-JP') },
      { id: 'lang-md', name: 'Language: Markdown', category: 'Language', action: () => activeTabId && setTabs((prev: Tab[]) => prev.map(t => t.id === activeTabId ? { ...t, language: 'markdown' } : t)) },
      { id: 'lang-js', name: 'Language: JavaScript', category: 'Language', action: () => activeTabId && setTabs((prev: Tab[]) => prev.map(t => t.id === activeTabId ? { ...t, language: 'javascript' } : t)) },
      { id: 'lang-ts', name: 'Language: TypeScript', category: 'Language', action: () => activeTabId && setTabs((prev: Tab[]) => prev.map(t => t.id === activeTabId ? { ...t, language: 'typescript' } : t)) },
      { id: 'lang-rust', name: 'Language: Rust', category: 'Language', action: () => activeTabId && setTabs((prev: Tab[]) => prev.map(t => t.id === activeTabId ? { ...t, language: 'rust' } : t)) },
      { id: 'lang-json', name: 'Language: JSON', category: 'Language', action: () => activeTabId && setTabs((prev: Tab[]) => prev.map(t => t.id === activeTabId ? { ...t, language: 'json' } : t)) },
    ];
  }, [config, t, addTab, handleOpenFile, handleSave, handleOpenConfigJson, activeTabId, updateTabEncoding, syncScroll, setTabs]);

  // 3. 画面初期化の Effect
  useEffect(() => {
    if (!isConfigLoaded || !config || isAppInitialized) return;
    
    const initTabs = async () => {
      if (config.save_tabs && config.saved_tabs && config.saved_tabs.length > 0) {
        const restoredTabs: Tab[] = [];
        for (const st of config.saved_tabs) {
          if (!st) continue;
          try {
            let content = '';
            let encoding = 'UTF-8';
            if (st.cache_id) content = await invoke<string>('load_tab_cache', { cacheId: st.cache_id }).catch(() => '');
            if (!content && st.path) {
              const data: any = await invoke('read_text_file', { path: st.path }).catch(() => null);
              if (data) { content = data.content; encoding = data.encoding; }
            }
            restoredTabs.push({
              id: generateId(), name: st.name || 'Untitled', path: st.path || null, content: content || '', encoding, 
              isModified: false, isCustomName: !!st.path, cacheId: st.cache_id || generateId(),
              language: st.path ? (st.name.split('.').pop() || 'markdown') : 'markdown'
            });
          } catch (e) {}
        }
        if (restoredTabs.length > 0) setAllTabs(restoredTabs);
      }
      setIsAppInitialized(true);
    };
    initTabs();
  }, [config, isConfigLoaded, isAppInitialized, setAllTabs]);

  // 4. 設定の保存 Effect
  useEffect(() => {
    if (!isAppInitialized || !config) return;
    const saved_tabs = config.save_tabs ? tabs.map(t => ({ name: t.name, path: t.path, cache_id: t.cacheId || null })) : [];
    
    if (JSON.stringify(saved_tabs) !== JSON.stringify(config.saved_tabs) || splitRatio !== config.last_split_ratio) {
      setConfig({ saved_tabs, last_split_ratio: splitRatio });
    }
  }, [tabs, splitRatio, config, isAppInitialized, setConfig]);

  // 5. キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault(); e.stopPropagation(); togglePalette();
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault(); addTab('Untitled', '', null, config.default_encoding);
      } else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault(); handleOpenFile();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault(); handleSave();
      } else if (e.ctrlKey && e.key === ',') {
        e.preventDefault(); setShowSettings(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [togglePalette, addTab, handleOpenFile, handleSave, config?.default_encoding]);

  // 外部からのファイルオープン要求を処理
  useEffect(() => {
    const unlisten = listen<string>("open-file", (event) => {
      const filePath = event.payload;
      if (filePath) {
        openFile(filePath);
      }
    });
    return () => {
      unlisten.then(f => f());
    };
  }, [openFile]);

  // 6. 自動保存 Hook
  useAutoSave(activeTab || tabs[0] || { id: 'initial', path: null, isModified: false, content: '', cacheId: 'initial' }, saveFile);

  // 7. レイアウト調整
  useEffect(() => { if (editorRef.current) editorRef.current.layout(); }, [sidebarWidth, splitRatio, viewMode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingType) return;
    if (resizingType === "sidebar") {
      if (e.clientX > 50 && e.clientX < 600) setSidebarWidth(e.clientX);
    } else if (resizingType === "split") {
      const container = document.getElementById('editor-preview-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
        if (newRatio > 5 && newRatio < 95) setSplitRatio(newRatio);
      }
    }
  }, [resizingType]);
  
  useEffect(() => {
    const handleMouseUp = () => setResizingType(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove]);

  // 8. スクロール同期のハンドラ (handleScroll ではなく明確な名前に統一)
  const handleEditorScroll = useCallback((top: number, total: number, startLine?: number) => {
    if (!syncScroll || isSyncing.current || viewMode !== "split") return;
    
    if (previewRef.current) {
      const previewEl = previewRef.current.querySelector('.markdown-body') as HTMLElement;
      if (previewEl) {
        // 0. 最下部への到達を検知して強制同期
        if (total > 0 && top >= total - 5) {
          isSyncing.current = true;
          const previewTotal = previewEl.scrollHeight - previewEl.clientHeight;
          previewEl.scrollTop = previewTotal;
          setTimeout(() => { isSyncing.current = false; }, 50);
          return;
        }

        isSyncing.current = true;
        // 1. 行番号ベースの同期（線形補間付き）
        if (startLine !== undefined) {
          const elements = Array.from(previewEl.querySelectorAll('[data-line]'));
          
          if (elements.length > 0) {
            let prevEl: HTMLElement | null = null;
            let nextEl: HTMLElement | null = null;
            
            for (const el of elements) {
              const line = parseInt((el as HTMLElement).dataset.line || "0");
              if (line <= startLine) {
                prevEl = el as HTMLElement;
              } else {
                nextEl = el as HTMLElement;
                break;
              }
            }

            if (prevEl) {
              const prevLine = parseInt(prevEl.dataset.line || "0");
              const prevTop = prevEl.offsetTop - previewEl.offsetTop;
              
              if (nextEl) {
                const nextLine = parseInt(nextEl.dataset.line || "0");
                const nextTop = nextEl.offsetTop - previewEl.offsetTop;
                
                // 行数に応じた割合を計算（線形補間）
                const ratio = (startLine - prevLine) / (nextLine - prevLine);
                previewEl.scrollTop = prevTop + (nextTop - prevTop) * ratio - 20;
              } else {
                previewEl.scrollTop = prevTop - 20;
              }
              
              setTimeout(() => { isSyncing.current = false; }, 50);
              return;
            }
          }
        }

        // 2. フォールバック: パーセントベースの同期
        const previewTotal = previewEl.scrollHeight - previewEl.clientHeight;
        previewEl.scrollTop = previewTotal * (total > 0 ? top / total : 0);
      }
    }
    setTimeout(() => { isSyncing.current = false; }, 50);
  }, [viewMode, syncScroll]);

  const handlePreviewScroll = useCallback((top: number, total: number) => {
    if (!syncScroll || isSyncing.current || viewMode !== "split") return;
    
    if (editorRef.current && previewRef.current) {
      const previewEl = previewRef.current.querySelector('.markdown-body') as HTMLElement;
      if (previewEl) {
        // 0. 最下部への到達を検知
        if (total > 0 && top >= total - 5) {
          isSyncing.current = true;
          const editorTotal = editorRef.current.getScrollHeight() - editorRef.current.getLayoutInfo().height;
          editorRef.current.setScrollTop(editorTotal);
          setTimeout(() => { isSyncing.current = false; }, 50);
          return;
        }

        isSyncing.current = true;
        // 1. 逆・行番号ベースの同期（プレビュー位置から行番号を逆算）
        const elements = Array.from(previewEl.querySelectorAll('[data-line]'));
        
        if (elements.length > 0) {
          let prevEl: HTMLElement | null = null;
          let nextEl: HTMLElement | null = null;
          
          // 現在のスクロール位置（top）に近い要素を探す
          for (const el of elements) {
            const elTop = (el as HTMLElement).offsetTop - previewEl.offsetTop;
            if (elTop <= top + 30) { // 少し余裕を持たせる
              prevEl = el as HTMLElement;
            } else {
              nextEl = el as HTMLElement;
              break;
            }
          }

          if (prevEl) {
            const prevLine = parseInt(prevEl.dataset.line || "1");
            const prevTop = prevEl.offsetTop - previewEl.offsetTop;
            let targetLine = prevLine;
            
            if (nextEl) {
              const nextLine = parseInt(nextEl.dataset.line || String(prevLine + 1));
              const nextTop = nextEl.offsetTop - previewEl.offsetTop;
              const ratio = (top + 30 - prevTop) / (nextTop - prevTop);
              targetLine = prevLine + (nextLine - prevLine) * Math.max(0, Math.min(1, ratio));
            }
            
            // Monacoのエディタの該当行のピクセル位置へスクロール
            editorRef.current.setScrollTop(editorRef.current.getTopForLineNumber(Math.floor(targetLine)));
            setTimeout(() => { isSyncing.current = false; }, 50);
            return;
          }
        }

        // 2. フォールバック: パーセントベースの同期
        const editorTotal = editorRef.current.getScrollHeight() - editorRef.current.getLayoutInfo().height;
        editorRef.current.setScrollTop(editorTotal * (total > 0 ? top / total : 0));
      }
    }
    setTimeout(() => { isSyncing.current = false; }, 50);
  }, [viewMode, syncScroll]);

  // テーマを body に反映させる（Rules of Hooks により早期リターンの前に書く！）
  useEffect(() => {
    if (config?.theme) {
      document.body.setAttribute('data-theme', config.theme);
    }
  }, [config?.theme]);

  // 9. レンダリング前の最終チェック
  if (!isConfigLoaded || !config) return <div style={{ backgroundColor: '#1e1e1e', color: '#666', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{translations.ja.loading}</div>;
  const currentTab = activeTab || tabs[0] || { id: 'temp', name: 'Untitled', content: '', language: 'plaintext', encoding: 'UTF-8' };
  const charCount = currentTab.content.length;

  return (
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="container" style={{ 
        flexGrow: 1, display: "flex", backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', 
        cursor: resizingType ? 'col-resize' : 'default', userSelect: resizingType ? 'none' : 'auto', overflow: 'hidden'
      }}>
        <div style={{ width: `${sidebarWidth}px`, flexShrink: 0, height: '100%', minWidth: '50px', display: 'flex' }}>
          <TabBar tabs={tabs} activeTabId={activeTabId} onTabClick={setActiveTabId} onTabClose={closeTab} onNewTab={() => addTab('Untitled', '', null, config.default_encoding)} onRenameTab={renameTab} />
          <div onMouseDown={(e) => { setResizingType("sidebar"); e.preventDefault(); }} style={{ width: '4px', height: '100%', backgroundColor: resizingType === "sidebar" ? 'var(--primary)' : 'var(--border-main)', cursor: 'col-resize' }} />
        </div>

        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-actionbar)', padding: '4px 10px', borderBottom: '1px solid var(--border-main)', fontSize: '12px', zIndex: 1000, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '15px', marginRight: '20px' }}>
              <div onClick={() => addTab('Untitled', '', null, config.default_encoding)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><FilePlus size={14} /> {t.new}</div>
              <div onClick={handleOpenFile} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><FolderOpen size={14} /> {t.open}</div>
              <div onClick={handleSave} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Save size={14} /> {t.save}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => editorRef.current?.trigger('menubar', 'undo', null)} style={{ background: 'none', border: 'none', color: "var(--text-muted)", cursor: 'pointer', padding: 2 }} title={t.undo}><Undo2 size={18} /></button>
              <button onClick={() => editorRef.current?.trigger('menubar', 'redo', null)} style={{ background: 'none', border: 'none', color: "var(--text-muted)", cursor: 'pointer', padding: 2 }} title={t.redo}><Redo2 size={18} /></button>
            </div>
            <div style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => { editorRef.current?.focus(); editorRef.current?.trigger('menubar', 'actions.find', null); }} style={{ background: 'none', border: 'none', color: "var(--text-muted)", cursor: 'pointer', padding: 4 }} title={t.search}><Search size={18} /></button>
              <button onClick={() => { editorRef.current?.focus(); editorRef.current?.trigger('menubar', 'editor.action.startFindReplaceAction', null); }} style={{ background: 'none', border: 'none', color: "var(--text-muted)", cursor: 'pointer', padding: 4 }} title={t.replace}><Repeat size={18} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-main)', margin: '0 4px' }} />
              
              <button onClick={() => setSyncScroll(!syncScroll)} style={{ background: 'none', border: 'none', color: syncScroll ? "var(--primary)" : "var(--text-muted)", cursor: 'pointer', padding: 4 }} title={syncScroll ? "Sync Scroll: ON" : "Sync Scroll: OFF"}>
                {syncScroll ? <LinkIcon size={18} /> : <Link2Off size={18} />}
              </button>

              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-main)', margin: '0 4px' }} />
              <button onClick={() => setViewMode("editor")} style={{ background: 'none', border: 'none', color: viewMode === "editor" ? "var(--primary)" : "var(--text-muted)", cursor: 'pointer', padding: 4 }}><Edit3 size={18} /></button>
              <button onClick={() => setViewMode("split")} style={{ background: 'none', border: 'none', color: viewMode === "split" ? "var(--primary)" : "var(--text-muted)", cursor: 'pointer', padding: 4 }}><Columns size={18} /></button>
              <button onClick={() => setViewMode("preview")} style={{ background: 'none', border: 'none', color: viewMode === "preview" ? "var(--primary)" : "var(--text-muted)", cursor: 'pointer', padding: 4 }}><Eye size={18} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-main)', margin: '0 4px' }} />
              <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: "var(--text-muted)", cursor: 'pointer', padding: 4 }}><SettingsIcon size={18} /></button>
            </div>
          </div>

          <div id="editor-preview-container" style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {(viewMode === "editor" || viewMode === "split") && (
              <div style={{ width: viewMode === "split" ? `${splitRatio}%` : '100%', height: '100%', flexShrink: 0, minWidth: 0 }}>
                <MonacoEditor key={activeTabId} value={currentTab.content} onChange={(v) => updateTabContent(activeTabId, v || "")} fontFamily={config.editor_font_family} fontSize={config.editor_font_size} theme={config.theme} language={currentTab.language} onMount={(editor) => { editorRef.current = editor; }} onScroll={handleEditorScroll} snippets={config.snippets} />
              </div>
            )}
            {viewMode === "split" && (
              <div onMouseDown={(e) => { setResizingType("split"); e.preventDefault(); }} style={{ width: '4px', height: '100%', backgroundColor: resizingType === "split" ? 'var(--primary)' : 'var(--border-main)', cursor: 'col-resize', zIndex: 10, flexShrink: 0 }} />
            )}
            {(viewMode === "preview" || viewMode === "split") && (
              <div ref={previewRef} style={{ flexGrow: 1, height: '100%', overflow: 'hidden', minWidth: 0 }}>
                <Preview content={currentTab.content} fontFamily={config.preview_font_family} fontSize={config.preview_font_size} theme={config.theme} openExternalBrowser={config.open_external_browser} onScroll={handlePreviewScroll} />
              </div>
            )}
          </div>
        </div>
      </div>
      {showSettings && <Settings config={config} onSave={(newCfg) => setConfig(newCfg)} onClose={() => setShowSettings(false)} onOpenJson={handleOpenConfigJson} />}
      <StatusBar 
        charCount={charCount} 
        language={currentTab.language || 'plaintext'} 
        encoding={currentTab.encoding || 'UTF-8'} 
        theme={config.theme} 
        onEncodingClick={() => togglePalette('Encoding: ')}
        onLanguageClick={() => togglePalette('Language: ')}
      />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        initialSearch={initialSearch}
        commands={appCommands} 
        onExecute={(cmd) => { cmd.action(); closePalette(); }} 
        onClose={closePalette} 
        theme={config.theme} 
      />
    </div>
  );
}

export default App;
