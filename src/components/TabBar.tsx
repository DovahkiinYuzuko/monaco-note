import React, { useState } from 'react';
import { X, Plus, FileText } from "lucide-react";

import { Tab } from '../hooks/useTabs';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onRenameTab: (id: string, newName: string) => void;
  theme?: string;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick, onTabClose, onNewTab, onRenameTab }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const submitRename = (id: string) => {
    if (editName.trim()) {
      onRenameTab(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      scrollbarWidth: 'none',
    }}>
      <div style={{ padding: '12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid var(--border-main)', marginBottom: '5px', letterSpacing: '0.1em' }}>
        <span>OPEN FILES</span>
        <Plus size={14} onClick={onNewTab} style={{ cursor: 'pointer' }} />
      </div>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className="tab-item"
          onClick={() => onTabClick(tab.id)}
          onDoubleClick={() => startEditing(tab.id, tab.name)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px',
            backgroundColor: tab.id === activeTabId ? 'var(--bg-tab-active)' : 'transparent',
            color: tab.id === activeTabId ? 'var(--text-tab-active)' : 'var(--text-tab)',
            cursor: 'pointer',
            fontSize: '13px',
            userSelect: 'none',
            borderLeft: tab.id === activeTabId ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <FileText size={14} style={{ marginRight: '8px', minWidth: '14px', color: tab.id === activeTabId ? 'var(--primary)' : 'var(--text-muted)' }} />
          {editingId === tab.id ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => submitRename(tab.id)}
              onKeyDown={(e) => e.key === 'Enter' && submitRename(tab.id)}
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                border: '1px solid var(--primary)',
                fontSize: '12px',
                width: '100%',
                outline: 'none',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            />
          ) : (
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              flexGrow: 1,
            }}>
              {tab.name}{tab.isModified ? '*' : ''}
            </span>
          )}
          <X
            className="close-icon"
            size={14}
            style={{ marginLeft: '8px', opacity: tab.id === activeTabId ? 1 : 0, color: 'var(--text-muted)' }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          />
        </div>
      ))}
      <style>{`
        .tab-item:hover > .close-icon { opacity: 1 !important; }
        .tab-item:hover { background-color: var(--bg-hover) !important; }
      `}</style>
    </div>
  );
};

export default TabBar;
