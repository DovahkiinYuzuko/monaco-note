import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Plus, Trash2, FileJson, RefreshCw, Settings as SettingsIcon, Type, Scissors, MoreHorizontal, Globe, Check } from "lucide-react";

import { AppConfig } from '../hooks/useConfig';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onClose: () => void;
  onOpenJson?: () => void;
}

type SettingsSection = 'general' | 'fonts' | 'snippets' | 'others';

const Settings: React.FC<SettingsProps> = ({ config, onSave, onClose, onOpenJson }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [fonts, setFonts] = useState<string[]>(['system-ui']);
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [searchEditor, setSearchEditor] = useState('');
  const [searchPreview, setSearchPreview] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [newSnippetPrefix, setNewSnippetPrefix] = useState('');
  const [newSnippetBody, setNewSnippetBody] = useState('');

  const isJa = localConfig.lang === 'ja';
  const encodings = ['UTF-8', 'Shift-JIS', 'EUC-JP', 'UTF-16LE', 'UTF-16BE'];

  useEffect(() => {
    const initFonts = async () => {
      try {
        const storedFonts = localStorage.getItem('monaco_note_font_cache');
        let initialFonts = ['system-ui'];
        if (storedFonts) {
          initialFonts = Array.from(new Set([...initialFonts, ...JSON.parse(storedFonts)]));
        }

        const cachedFonts: string[] = await invoke('get_os_fonts');
        const mergedFonts = Array.from(new Set([...initialFonts, ...cachedFonts, config.editor_font_family, config.preview_font_family])).sort();
        setFonts(mergedFonts);
        
        if (mergedFonts.length <= 10) {
          handleRefreshFonts(true);
        }
      } catch (e) {
        console.error("Failed to load cached fonts", e);
      }
    };
    initFonts();
  }, [config.editor_font_family, config.preview_font_family]);

  const handleRefreshFonts = useCallback(async (silent = false) => {
    if (!silent) setIsFontLoading(true);
    try {
      if ('queryLocalFonts' in window) {
        const localFonts = await (window as any).queryLocalFonts();
        const fontNames = localFonts.map((f: any) => f.family);
        const uniqueFonts = Array.from(new Set(fontNames) as Set<string>).sort();
        localStorage.setItem('monaco_note_font_cache', JSON.stringify(uniqueFonts));
        const finalFonts = ['system-ui', ...uniqueFonts];
        setFonts(prev => Array.from(new Set([...prev, ...finalFonts])).sort());
        await invoke('refresh_os_fonts').catch(() => {});
      } else {
        const freshFonts: string[] = await invoke('refresh_os_fonts');
        if (freshFonts.length > 0) setFonts(prev => Array.from(new Set([...prev, ...freshFonts])).sort());
      }
    } catch (e) {
      console.warn("Font refresh failed", e);
    } finally {
      if (!silent) setIsFontLoading(false);
    }
  }, []);

  const handleAddSnippet = () => {
    if (!newSnippetPrefix.trim()) return;
    setLocalConfig(prev => ({
      ...prev,
      snippets: { ...prev.snippets, [newSnippetPrefix.trim()]: newSnippetBody }
    }));
    setNewSnippetPrefix('');
    setNewSnippetBody('');
  };

  const handleRemoveSnippet = (prefix: string) => {
    setLocalConfig(prev => {
      const next = { ...prev.snippets };
      delete next[prefix];
      return { ...prev, snippets: next };
    });
  };

  const filteredEditorFonts = useMemo(() => fonts.filter(f => f.toLowerCase().includes(searchEditor.toLowerCase())), [fonts, searchEditor]);
  const filteredPreviewFonts = useMemo(() => fonts.filter(f => f.toLowerCase().includes(searchPreview.toLowerCase())), [fonts, searchPreview]);

  const handleSave = () => {
    setSaveStatus('saving');
    onSave(localConfig);
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      onClose();
    }, 800);
  };

  // 8px グリッドに基づいたスタイル
  const sectionTitleStyle = { color: 'var(--primary)', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
  const labelStyle = { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px', display: 'block', letterSpacing: '0.05em' };
  const inputStyle = { width: '100%', padding: '12px', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '6px', fontSize: '13px' };
  const buttonStyle = { padding: '10px 16px', backgroundColor: 'var(--bg-actionbar)', color: 'var(--text-main)', border: '1px solid var(--border-main)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' };
  
  const navItemStyle = (id: SettingsSection) => ({
    padding: '12px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: activeSection === id ? 'var(--bg-hover)' : 'transparent',
    color: activeSection === id ? 'var(--primary)' : 'var(--text-muted)',
    transition: 'all 0.2s ease',
    marginBottom: '8px'
  });

  // 現在の設定値を表示するチップ
  const ActiveValueDisplay = ({ label, value }: { label: string, value: string }) => (
    <div style={{ backgroundColor: 'var(--bg-input)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
      <span style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '1px' }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, backdropFilter: 'blur(8px)' }}>
      <div style={{ backgroundColor: 'var(--bg-sidebar)', borderRadius: '16px', width: '750px', height: '600px', display: 'flex', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', border: '1px solid var(--border-main)' }}>
        
        {/* 左側：サイドバー */}
        <div style={{ width: '200px', flexShrink: 0, backgroundColor: 'var(--bg-actionbar)', borderRight: '1px solid var(--border-main)', padding: '32px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '0 16px 16px 16px', letterSpacing: '2px' }}>SETTINGS</div>
          <div style={navItemStyle('general')} onClick={() => setActiveSection('general')}><SettingsIcon size={18} /> {isJa ? '基本・文字コード' : 'General'}</div>
          <div style={navItemStyle('fonts')} onClick={() => setActiveSection('fonts')}><Type size={18} /> {isJa ? 'フォント' : 'Fonts'}</div>
          <div style={navItemStyle('snippets')} onClick={() => setActiveSection('snippets')}><Scissors size={18} /> {isJa ? 'スニペット' : 'Snippets'}</div>
          <div style={navItemStyle('others')} onClick={() => setActiveSection('others')}><MoreHorizontal size={18} /> {isJa ? 'その他' : 'Others'}</div>
          
          <div style={{ flexGrow: 1 }} />
          
          {onOpenJson && (
            <button onClick={onOpenJson} style={{ ...buttonStyle, width: '100%', border: 'none', backgroundColor: 'transparent', opacity: 0.6 }} title="Open config.json">
              <FileJson size={16} /> {isJa ? 'JSON設定を開く' : 'Open JSON'}
            </button>
          )}
        </div>

        {/* 右側：メイン */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px', alignItems: 'center', borderBottom: '1px solid var(--border-main)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>
              {activeSection === 'general' && (isJa ? '基本設定' : 'General')}
              {activeSection === 'fonts' && (isJa ? 'フォント設定' : 'Fonts')}
              {activeSection === 'snippets' && (isJa ? 'スニペット' : 'Snippets')}
              {activeSection === 'others' && (isJa ? 'その他' : 'Others')}
            </h3>
            <X onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }} size={20} className="hover-primary" />
          </div>

          <div style={{ flexGrow: 1, padding: '32px', overflowY: 'auto' }}>
            
            {activeSection === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <ActiveValueDisplay label={isJa ? '表示言語' : 'Language'} value={localConfig.lang === 'ja' ? '日本語' : 'English'} />
                  <ActiveValueDisplay label={isJa ? 'テーマ' : 'Theme'} value={localConfig.theme === 'vs-dark' ? 'Dark' : 'Light'} />
                  <ActiveValueDisplay label={isJa ? '文字コード' : 'Encoding'} value={localConfig.default_encoding} />
                </div>

                <div>
                  <div style={sectionTitleStyle}><Globe size={16} /> {isJa ? '言語とテーマ' : 'Language & Theme'}</div>
                  <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>{isJa ? '表示言語' : 'Language'}</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setLocalConfig({ ...localConfig, lang: 'ja' })} style={{ ...buttonStyle, flex: 1, justifyContent: 'center', backgroundColor: localConfig.lang === 'ja' ? 'var(--primary)' : 'transparent', color: localConfig.lang === 'ja' ? '#fff' : 'var(--text-main)' }}>日本語</button>
                        <button onClick={() => setLocalConfig({ ...localConfig, lang: 'en' })} style={{ ...buttonStyle, flex: 1, justifyContent: 'center', backgroundColor: localConfig.lang === 'en' ? 'var(--primary)' : 'transparent', color: localConfig.lang === 'en' ? '#fff' : 'var(--text-main)' }}>English</button>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>{isJa ? 'テーマ' : 'Theme'}</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setLocalConfig({ ...localConfig, theme: 'vs-dark' })} style={{ ...buttonStyle, flex: 1, justifyContent: 'center', backgroundColor: localConfig.theme === 'vs-dark' ? 'var(--primary)' : 'transparent', color: localConfig.theme === 'vs-dark' ? '#fff' : 'var(--text-main)' }}>Dark</button>
                        <button onClick={() => setLocalConfig({ ...localConfig, theme: 'light' })} style={{ ...buttonStyle, flex: 1, justifyContent: 'center', backgroundColor: localConfig.theme === 'light' ? 'var(--primary)' : 'transparent', color: localConfig.theme === 'light' ? '#fff' : 'var(--text-main)' }}>Light</button>
                      </div>
                    </div>
                  </div>

                  <div style={sectionTitleStyle}><Type size={16} /> {isJa ? 'デフォルトの文字コード' : 'Default Encoding'}</div>
                  <select value={localConfig.default_encoding} onChange={(e) => setLocalConfig({ ...localConfig, default_encoding: e.target.value })} style={inputStyle}>
                    {encodings.map(enc => <option key={enc} value={enc}>{enc}</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeSection === 'fonts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <ActiveValueDisplay label="Editor Font" value={localConfig.editor_font_family} />
                  <ActiveValueDisplay label="Preview Font" value={localConfig.preview_font_family} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ ...sectionTitleStyle, marginBottom: 0 }}><Type size={16} /> {isJa ? 'フォントの選択' : 'Typography'}</div>
                    <button onClick={() => handleRefreshFonts(false)} disabled={isFontLoading} style={buttonStyle}>
                      <RefreshCw size={14} className={isFontLoading ? 'spin' : ''} />
                      {isJa ? '更新' : 'Refresh'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>{isJa ? 'エディタ' : 'Editor'}</label>
                      <input type="text" placeholder="Search..." value={searchEditor} onChange={(e) => setSearchEditor(e.target.value)} style={{ ...inputStyle, marginBottom: '8px', padding: '8px 12px' }} />
                      <select 
                        value={localConfig.editor_font_family} 
                        onChange={(e) => setLocalConfig({ ...localConfig, editor_font_family: e.target.value })} 
                        style={{ ...inputStyle, flexGrow: 1, minHeight: '240px', pointerEvents: 'auto' }} 
                        size={10}
                      >
                        {filteredEditorFonts.map(f => <option key={`ed-${f}`} value={f}>{f === localConfig.editor_font_family ? `✓ ${f}` : f}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <label style={labelStyle}>{isJa ? 'プレビュー' : 'Preview'}</label>
                      <input type="text" placeholder="Search..." value={searchPreview} onChange={(e) => setSearchPreview(e.target.value)} style={{ ...inputStyle, marginBottom: '8px', padding: '8px 12px' }} />
                      <select 
                        value={localConfig.preview_font_family} 
                        onChange={(e) => setLocalConfig({ ...localConfig, preview_font_family: e.target.value })} 
                        style={{ ...inputStyle, flexGrow: 1, minHeight: '240px', pointerEvents: 'auto' }} 
                        size={10}
                      >
                        {filteredPreviewFonts.map(f => <option key={`pr-${f}`} value={f}>{f === localConfig.preview_font_family ? `✓ ${f}` : f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'snippets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={sectionTitleStyle}><Scissors size={16} /> {isJa ? 'カスタムスニペット' : 'Custom Snippets'}</div>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Prefix</label>
                      <input type="text" placeholder="e.g. date" value={newSnippetPrefix} onChange={e => setNewSnippetPrefix(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={labelStyle}>Body</label>
                      <input type="text" placeholder="e.g. ${currentDate}" value={newSnippetBody} onChange={e => setNewSnippetBody(e.target.value)} style={inputStyle} />
                    </div>
                    <button onClick={handleAddSnippet} style={{ alignSelf: 'flex-end', height: '44px', padding: '0 20px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Plus size={20} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(localConfig.snippets).map(([prefix, body]) => (
                    <div key={prefix} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-main)' }}>
                      <code style={{ color: 'var(--primary)', fontWeight: 'bold', minWidth: '80px', fontSize: '12px' }}>{prefix}</code>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{body}</span>
                      <Trash2 size={16} onClick={() => handleRemoveSnippet(prefix)} style={{ cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5 }} className="hover-danger" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'others' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={sectionTitleStyle}><MoreHorizontal size={16} /> {isJa ? 'アプリ設定' : 'Preferences'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-input)' }} onClick={() => setLocalConfig({ ...localConfig, save_tabs: !localConfig.save_tabs })}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: localConfig.save_tabs ? 'var(--primary)' : 'transparent' }}>
                      {localConfig.save_tabs && <Check size={14} color="#fff" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{isJa ? '起動時にタブを復元する' : 'Restore tabs on startup'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{isJa ? '前回作業していたファイルを自動的に開きます。' : 'Automatically reopen files from your last session.'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-input)' }} onClick={() => setLocalConfig({ ...localConfig, open_external_browser: !localConfig.open_external_browser })}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: localConfig.open_external_browser ? 'var(--primary)' : 'transparent' }}>
                      {localConfig.open_external_browser && <Check size={14} color="#fff" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{isJa ? 'URLを外部ブラウザで開く' : 'Open URLs in external browser'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{isJa ? 'リンクをクリックした際に規定のブラウザを起動します。' : 'Open web links in your system default browser.'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-main)', display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: 'var(--bg-actionbar)' }}>
            <button onClick={onClose} style={{ ...buttonStyle, padding: '12px 24px', border: 'none', backgroundColor: 'transparent', fontWeight: 'bold' }}>{isJa ? 'キャンセル' : 'Cancel'}</button>
            <button 
              onClick={handleSave} 
              disabled={saveStatus !== 'idle'}
              style={{ 
                padding: '12px 40px', 
                backgroundColor: saveStatus === 'saved' ? '#52c41a' : 'var(--primary)', 
                color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', 
                cursor: saveStatus === 'idle' ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: saveStatus === 'saved' ? '0 0 20px rgba(82, 196, 26, 0.4)' : '0 4px 12px rgba(0, 102, 255, 0.3)'
              }}
            >
              {saveStatus === 'idle' && (isJa ? '設定を保存' : 'Save Changes')}
              {saveStatus === 'saving' && (isJa ? '保存中...' : 'Saving...')}
              {saveStatus === 'saved' && (isJa ? '保存完了！' : 'Saved!')}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .hover-primary:hover { color: var(--primary) !important; }
        .hover-danger:hover { color: #ff4d4f !important; opacity: 1 !important; }
        select option { padding: 8px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border-main); borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default Settings;
