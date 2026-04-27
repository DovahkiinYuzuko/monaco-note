import React from 'react';

interface StatusBarProps {
  charCount: number;
  language: string;
  encoding: string;
  theme: string;
  fontFamily: string;
  onLanguageClick?: () => void;
  onEncodingClick?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ charCount, language, encoding, theme, fontFamily, onLanguageClick, onEncodingClick }) => {
  const isDark = theme === 'vs-dark';
  const bgColor = isDark ? '#007acc' : 'var(--primary)';

  const itemStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    transition: 'background 0.2s',
  };

  const hoverStyle = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
  };

  const leaveStyle = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = 'transparent';
  };

  return (
    <div style={{
      height: '22px',
      backgroundColor: bgColor,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      fontSize: '12px',
      fontFamily: 'system-ui, sans-serif',
      zIndex: 1000,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
        <span 
          style={itemStyle} 
          onMouseEnter={hoverStyle} 
          onMouseLeave={leaveStyle}
          onClick={onLanguageClick}
          title="Click to change language"
        >
          {language}
        </span>
        <span 
          style={itemStyle} 
          onMouseEnter={hoverStyle} 
          onMouseLeave={leaveStyle}
          onClick={onEncodingClick}
          title="Click to change encoding"
        >
          {encoding}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
        <span 
          style={itemStyle} 
          onMouseEnter={hoverStyle} 
          onMouseLeave={leaveStyle}
          title="Click to change theme"
          onClick={() => {}}
        >
          {theme === 'vs-dark' ? 'Dark' : 'Light'}
        </span>
        <span style={{ ...itemStyle, cursor: 'default' }}>{charCount} chars</span>
      </div>
    </div>
  );
};

export default StatusBar;
