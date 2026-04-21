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
  const bgColor = isDark ? '#007acc' : '#005fb8';

  const itemStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '0 4px',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    transition: 'background-color 0.2s'
  };

  const hoverStyle = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  };

  const leaveStyle = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
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
      fontSize: '11px',
      fontFamily: 'system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
      zIndex: 1001
    }}>
      <div style={{ display: 'flex', gap: '15px', height: '100%' }}>
        <span style={{ ...itemStyle, cursor: 'default' }}>Font: {fontFamily}</span>
      </div>
      <div style={{ display: 'flex', gap: '15px', height: '100%' }}>
        <span 
          style={itemStyle} 
          onClick={onEncodingClick} 
          onMouseEnter={hoverStyle}
          onMouseLeave={leaveStyle}
          title="Click to change encoding"
        >
          {encoding}
        </span>
        <span 
          style={itemStyle} 
          onClick={onLanguageClick}
          onMouseEnter={hoverStyle}
          onMouseLeave={leaveStyle}
          title="Click to change language"
        >
          {language}
        </span>
        <span style={{ ...itemStyle, cursor: 'default' }}>{charCount} chars</span>
      </div>
    </div>
  );
};

export default StatusBar;
