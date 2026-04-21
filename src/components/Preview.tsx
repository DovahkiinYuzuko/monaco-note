import React, { useMemo, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { openUrl } from '@tauri-apps/plugin-opener'; // 外部リンク用
import hljs from 'highlight.js';
import DOMPurify from 'dompurify'; // 【追加】サニタイズ用
import 'github-markdown-css/github-markdown.css'; // ダーク/ライト両対応に変更
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
            // IDまたはname属性で要素を検索
            // 1. 生のID（エンコードされたまま）
            // 2. デコードされたID
            // 3. name属性（エンコード）
            const targetEl = document.getElementById(rawId) || 
                             document.getElementById(decodedId) ||
                             containerRef.current?.querySelector(`[id="${CSS.escape(rawId)}"]`) ||
                             containerRef.current?.querySelector(`[id="${CSS.escape(decodedId)}"]`) ||
                             containerRef.current?.querySelector(`a[name="${CSS.escape(rawId)}"]`);

            if (targetEl) {
              isAutoScrolling.current = true;
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // アニメーションが終わる頃にロックを解除
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
      backgroundColor: theme === 'vs-dark' ? '#1e1e1e' : '#faf9f6'
    }}>
      <style>{`
        .markdown-body {
          color: var(--text-main) !important;
          background-color: transparent !important;
          font-family: ${fontFamily}, system-ui, sans-serif !important;
          line-height: 1.7 !important;
          letter-spacing: 0.04em !important;
          color-scheme: ${theme === 'vs-dark' ? 'dark' : 'light'} !important;
          
          /* GitHub CSS 変数の強制同期 */
          --color-fg-default: var(--text-main) !important;
          --color-canvas-default: transparent !important;
          --color-canvas-subtle: rgba(128,128,128,0.1) !important;
          --color-border-default: var(--border-main) !important;
        }

        /* 【重要】ライトモード時の強力な上書き設定 */
        .preview-container[data-theme="light"] .markdown-body,
        .preview-container[data-theme="light"] .markdown-body *:not(pre, code, .hljs, .hljs *) {
          color: var(--text-main) !important;
        }
        
        .preview-container[data-theme="light"] .markdown-body border-color {
          border-color: var(--border-main) !important;
        }

        .markdown-body strong, .markdown-body b { font-weight: bold !important; color: inherit !important; }
        .markdown-body em, .markdown-body i { font-style: italic !important; display: inline !important; }
        .markdown-body u { text-decoration: underline !important; }

        .code-block-wrapper {
          position: relative;
          margin: 2em 0;
          border-radius: 8px;
          background-color: #0d1117 !important;
          border: 1px solid var(--border-main);
          overflow: visible;
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
          color: #8b949e;
          background: #21262d;
          border: 1px solid rgba(240,246,252,0.1);
          border-radius: 6px;
          cursor: pointer;
          z-index: 21;
          transition: all 0.2s;
        }
        .copy-btn:hover { color: #c9d1d9; background: #30363d; border-color: #8b949e; }   
        .copy-btn.success { color: #3fb950; border-color: #3fb950; }

        .markdown-body pre {
          background-color: transparent !important;
          border: none !important;
          padding: 24px 20px !important;
          margin: 0 !important;
          overflow-x: auto;
        }

        .markdown-body pre code {
          color: #e6edf3 !important;
          background-color: transparent !important;
          padding: 0 !important;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace !important;      
        }

        .markdown-body a:hover { text-decoration: underline !important; color: var(--primary) !important; }
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
