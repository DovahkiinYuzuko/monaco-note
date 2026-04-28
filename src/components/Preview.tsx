import React, { useMemo, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { openUrl } from '@tauri-apps/plugin-opener'; // 外部リンク用
import hljs from 'highlight.js';
import DOMPurify from 'dompurify'; // 【追加】サニタイズ用
import 'github-markdown-css/github-markdown.css'; 
import 'highlight.js/styles/github-dark.css';

// markdown-it の初期化
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // デフォルトのエスケープを使用
  }
});

// 行番号注入プラグイン
function injectLineNumbers(md: MarkdownIt) {
  md.core.ruler.push('inject_line_numbers', (state) => {
    state.tokens.forEach((token) => {
      if (token.map && (token.type.endsWith('_open') || token.type === 'fence' || token.type === 'code_block')) {
        const line = token.map[0] + 1;
        token.attrSet('data-line', String(line));
        token.attrJoin('class', 'source-line');
      }
    });
  });
}

md.use(injectLineNumbers);

// anchor プラグインの使用
md.use(anchor, {
  permalink: false,
  slugify: (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))
});

// コードブロックのカスタムレンダラー（コピーボタン付き）
md.renderer.rules.fence = (tokens, idx, options, _env, _self) => {
  const token = tokens[idx];
  const code = token.content;
  const lang = token.info.trim();
  const language = lang || 'text';
  
  // ハイライト処理
  let highlighted = '';
  if (options.highlight) {
    highlighted = options.highlight(code, lang, '');
  }
  
  if (!highlighted) {
    highlighted = md.utils.escapeHtml(code);
  }

  return `
    <div class="code-block-wrapper" data-lang="${language.toUpperCase()}">
      <button class="copy-btn" data-code="${encodeURIComponent(code.trim())}">Copy</button>
      <pre><code class="hljs language-${language}">${highlighted}</code></pre>
    </div>
  `;
};

interface PreviewProps {
  content: string;
  fontSize?: number;
  fontFamily?: string;
  theme?: 'vs-dark' | 'light';
  openExternalBrowser?: boolean;
  onScroll?: (top: number, total: number) => void;
}

const Preview: React.FC<PreviewProps> = ({
  content, fontSize = 16, fontFamily = 'system-ui', theme = 'vs-dark', openExternalBrowser = true, onScroll
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // スクロールイベントの監視
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onScroll) return;

    const handleScrollEvent = () => {
      // 内部リンクによる自動スクロール中は同期をスキップ！
      if (isAutoScrolling.current) return;

      const top = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      onScroll(top, total);
    };

    el.addEventListener('scroll', handleScrollEvent);
    return () => el.removeEventListener('scroll', handleScrollEvent);
  }, [onScroll]);

  // 独自アンカーライン (__text__) を <u> に変換
  const preprocessedContent = useMemo(() => {
    return content.replace(/__(.+?)__/g, '<u>$1</u>');
  }, [content]);

  const html = useMemo(() => {
    try {
      const rawHtml = md.render(preprocessedContent);
      // XSS対策：DOMPurify でサニタイズ。独自属性は許可する。
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['data-line', 'data-code', 'data-lang']
      });
    } catch (e) {
      return `Parse Error: ${e}`;
    }
  }, [preprocessedContent]);

  useEffect(() => {
    const handleEvents = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1. コピーボタンの処理
      if (target.classList.contains('copy-btn')) {
        const code = decodeURIComponent(target.getAttribute('data-code') || '');
        navigator.clipboard.writeText(code).then(() => {
          const originalText = target.innerText;
          target.innerText = 'Copied!';
          target.classList.add('success');
          setTimeout(() => {
            target.innerText = originalText;
            target.classList.remove('success');
          }, 2000);
        });
        return;
      }

      // 2. リンククリックの処理
      const anchorEl = target.closest('a');
      if (anchorEl) {
        const href = anchorEl.getAttribute('href');
        if (!href) return;

        if (href.startsWith('http')) {
          // 外部リンク
          if (openExternalBrowser) {
            e.preventDefault();
            openUrl(href).catch(() => {
              window.open(href, '_blank');
            });
          }
        } else if (href.startsWith('#')) {
          // 内部アンカーリンク
          e.preventDefault();
          const rawId = href.slice(1);
          const decodedId = decodeURIComponent(rawId);
          
          try {
            const targetEl = document.getElementById(rawId) || 
                             document.getElementById(decodedId) ||
                             containerRef.current?.querySelector(`[id="${CSS.escape(rawId)}"]`) ||
                             containerRef.current?.querySelector(`[id="${CSS.escape(decodedId)}"]`) ||
                             containerRef.current?.querySelector(`a[name="${CSS.escape(rawId)}"]`);

            if (targetEl) {
              isAutoScrolling.current = true;
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => { isAutoScrolling.current = false; }, 800);
            }
          } catch (err) {
            console.error("Internal link navigation failed:", err);
          }
        }
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('click', handleEvents, true);
      return () => el.removeEventListener('click', handleEvents, true);
    }
  }, [openExternalBrowser, html]);

  return (
    <div className="preview-container" data-theme={theme} style={{
      height: '100%', width: '100%', overflow: 'hidden',
      backgroundColor: 'var(--bg-main)'
    }}>
      <style>{`
        .markdown-body {
          color: var(--text-main) !important;
          background-color: transparent !important;
          font-family: "${fontFamily}", system-ui, sans-serif !important;
          line-height: 1.7 !important;
          letter-spacing: 0.04em !important;
          color-scheme: ${theme === 'vs-dark' ? 'dark' : 'light'} !important;
        }

        /* GitHub CSS 変数のテーマ別同期 */
        .preview-container[data-theme="vs-dark"] .markdown-body {
          --color-fg-default: #d4d4d4 !important;
          --color-canvas-default: transparent !important;
          --color-canvas-subtle: #252526 !important;
          --color-border-default: #333333 !important;
          --color-border-muted: #333333 !important;
          --color-neutral-muted: rgba(110,118,129,0.4) !important;
          --color-accent-fg: #58a6ff !important;
          --color-accent-emphasis: #1f6feb !important;
        }

        .preview-container[data-theme="light"] .markdown-body {
          --color-fg-default: #1a1a1c !important;
          --color-canvas-default: #ffffff !important;
          --color-canvas-subtle: #f6f8fa !important;
          --color-border-default: #d0d7de !important;
          --color-border-muted: #d0d7de !important;
          --color-neutral-muted: rgba(175,184,193,0.2) !important;
          --color-accent-fg: #0969da !important;
          --color-accent-emphasis: #0969da !important;
        }

        /* テーブルの背景色修正 */
        .markdown-body table tr {
          background-color: var(--color-canvas-default) !important;
        }
        .markdown-body table tr:nth-child(2n) {
          background-color: var(--color-canvas-subtle) !important;
        }
        .markdown-body table th {
          background-color: var(--color-canvas-subtle) !important;
        }

        /* 文字色と枠線の強制上書き */
        .preview-container[data-theme="light"] .markdown-body,
        .preview-container[data-theme="light"] .markdown-body *:not(pre, code, .hljs, .hljs *) {
          color: var(--text-main) !important;
          border-color: var(--border-main) !important;
        }
        
        .markdown-body strong, .markdown-body b { font-weight: bold !important; color: inherit !important; }
        .markdown-body em, .markdown-body i { font-style: italic !important; display: inline !important; }
        .markdown-body u { text-decoration: underline !important; }

        /* コードブロックの外枠 */
        .code-block-wrapper {
          position: relative;
          margin: 2em 0;
          border-radius: 8px;
          border: 1px solid var(--border-main);
          overflow: visible;
          background-color: ${theme === 'vs-dark' ? '#0d1117' : '#f6f8fa'} !important;
        }

        .code-block-wrapper::before {
          content: attr(data-lang);
          position: absolute;
          top: -12px;
          left: 15px;
          padding: 2px 10px;
          font-size: 10px;
          font-weight: bold;
          color: #fff;
          background: var(--primary);
          border-radius: 4px;
          z-index: 20;
        }

        .copy-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 12px;
          font-size: 11px;
          color: var(--text-muted);
          background: ${theme === 'vs-dark' ? '#21262d' : '#fff'};
          border: 1px solid var(--border-main);
          border-radius: 6px;
          cursor: pointer;
          z-index: 21;
          transition: all 0.2s;
        }
        .copy-btn:hover { color: var(--text-main); background: var(--bg-hover); border-color: var(--primary); }   
        .copy-btn.success { color: #3fb950; border-color: #3fb950; }

        .markdown-body pre {
          background-color: transparent !important;
          border: none !important;
          padding: 24px 20px !important;
          margin: 0 !important;
          overflow-x: auto;
        }

        /* highlight.js のライトモード用簡易上書き */
        .preview-container[data-theme="light"] .hljs {
          color: #24292e !important;
          background: transparent !important;
        }
        .preview-container[data-theme="light"] .hljs-keyword,
        .preview-container[data-theme="light"] .hljs-selector-tag { color: #d73a49 !important; }
        .preview-container[data-theme="light"] .hljs-string,
        .preview-container[data-theme="light"] .hljs-doctag { color: #032f62 !important; }
        .preview-container[data-theme="light"] .hljs-title,
        .preview-container[data-theme="light"] .hljs-section,
        .preview-container[data-theme="light"] .hljs-selector-id { color: #6f42c1 !important; }
        .preview-container[data-theme="light"] .hljs-variable,
        .preview-container[data-theme="light"] .hljs-template-variable { color: #e36209 !important; }
        .preview-container[data-theme="light"] .hljs-comment { color: #6a737d !important; }
        .preview-container[data-theme="light"] .hljs-number { color: #005cc5 !important; }
        .preview-container[data-theme="light"] .hljs-tag,
        .preview-container[data-theme="light"] .hljs-name { color: #22863a !important; }

        .markdown-body pre code {
          color: ${theme === 'vs-dark' ? '#e6edf3' : '#24292e'} !important;
          background-color: transparent !important;
          padding: 0 !important;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace !important;      
        }

        .markdown-body a { color: var(--primary) !important; text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline !important; }
      `}</style>
      <div
        ref={containerRef}
        className="markdown-body"
        data-color-mode={theme === 'vs-dark' ? 'dark' : 'light'}
        style={{
          height: '100%', width: '100%', overflowY: 'auto', padding: '40px 32px',
          fontSize: `${fontSize}px`, boxSizing: 'border-box',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default Preview;
