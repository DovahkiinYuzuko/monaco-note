import React, { useState, useEffect, useRef } from 'react';
import { Command } from '../hooks/useCommandPalette';
import Search from "lucide-react/dist/esm/icons/search";

interface Props {
  isOpen: boolean;
  initialSearch?: string;
  commands: Command[];
  onExecute: (command: Command) => void;
  onClose: () => void;
  theme: 'vs-dark' | 'light';
}

const CommandPalette: React.FC<Props> = ({ isOpen, initialSearch = '', commands, onExecute, onClose, theme }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    (cmd.category && cmd.category.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      setSearch(initialSearch);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen, initialSearch]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      if (filteredCommands[selectedIndex]) {
        onExecute(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isDark = theme === 'vs-dark';

  return (
    <div 
      className="command-palette-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '10vh'
      }}
      onClick={onClose}
    >
      <div 
        className="command-palette-container"
        style={{
          width: '600px',
          maxHeight: '400px',
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          color: isDark ? '#cccccc' : '#333333',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${isDark ? '#333333' : '#dddddd'}`
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#333333' : '#eeeeee'}` }}>
          <Search size={18} style={{ marginRight: '12px', color: isDark ? '#888' : '#999' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="実行したいコマンドを入力..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flexGrow: 1,
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '16px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <div 
          ref={listRef}
          style={{ overflowY: 'auto', padding: '4px 0' }}
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => onExecute(cmd)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: index === selectedIndex ? (isDark ? '#0066ff' : '#e6f0ff') : 'transparent',
                  color: index === selectedIndex ? (isDark ? '#ffffff' : '#0066ff') : 'inherit'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: index === selectedIndex ? 'bold' : 'normal' }}>{cmd.name}</span>
                  {cmd.category && <span style={{ fontSize: '11px', opacity: 0.7 }}>{cmd.category}</span>}
                </div>
                {cmd.shortcut && (
                  <span style={{ 
                    fontSize: '12px', 
                    opacity: 0.6, 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '14px', opacity: 0.5 }}>
              コマンドが見つからないよ...😭
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
