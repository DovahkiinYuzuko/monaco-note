import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  fontSize?: number;
  fontFamily?: string;
  theme?: 'vs-dark' | 'light';
  language?: string;
  onMount?: (editor: any) => void;
  onScroll?: (top: number, total: number, startLine?: number) => void;
  snippets?: Record<string, string>;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value, onChange, fontSize = 16, fontFamily = 'system-ui', theme = 'vs-dark', language = 'markdown', onMount, onScroll, snippets = {},
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const providerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onScrollRef = useRef(onScroll);

  // onScroll が更新されたら Ref も更新する
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidScrollChange((e: any) => {
      // Ref 経由で常に最新の関数を呼ぶ！
      if (onScrollRef.current && e.scrollTopChanged) {
        const totalHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
        // 可視範囲の先頭行を取得して渡す
        const ranges = editor.getVisibleRanges();
        const startLine = ranges.length > 0 ? ranges[0].startLineNumber : 1;
        onScrollRef.current(e.scrollTop, totalHeight, startLine);
      }
    });
    if (onMount) onMount(editor);
  };

  // スニペットプロバイダーの設定
  useEffect(() => {
    if (monacoRef.current && language) {
      if (providerRef.current) {
        providerRef.current.dispose();
      }

      providerRef.current = monacoRef.current.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: () => {
          const suggestions = Object.entries(snippets).map(([prefix, body]) => {
            let processedBody = body;
            if (processedBody.includes('${currentDate}')) {
              processedBody = processedBody.replace(/\${currentDate}/g, new Date().toLocaleDateString());
            }

            return {
              label: prefix,
              kind: monacoRef.current.languages.CompletionItemKind.Snippet,
              insertText: processedBody,
              insertTextRules: monacoRef.current.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: body,
              range: null as any
            };
          });
          return { suggestions };
        }
      });
    }

    return () => {
      if (providerRef.current) {
        providerRef.current.dispose();
      }
    };
  }, [snippets, language]);

  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => editorRef.current.layout(), 100);
    }
  }, [fontSize, fontFamily, theme, language]);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', boxSizing: 'border-box', position: 'relative' }} className="monaco-wrapper">
      <Editor
        height="100%"
        language={language}
        theme={theme === 'vs-dark' ? 'vs-dark' : 'vs'}
        defaultValue={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          fontFamily,
          minimap: { enabled: false },
          automaticLayout: true,
          lineHeight: 1.7 * fontSize,
          letterSpacing: 0.04 * fontSize,
          wordWrap: 'on',
          links: true,
          scrollBeyondLastLine: false,
          
          lineNumbers: 'on',
          lineNumbersMinChars: 5,
          lineDecorationsWidth: 10,
          glyphMargin: false,
          folding: false,
          
          padding: { top: 16, bottom: 16 },
          
          renderLineHighlight: 'none',
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          renderLineHighlightOnlyWhenFocus: false,
          matchBrackets: 'never',
          hover: { enabled: false },
          lightbulb: { enabled: 'off' as any },
          colorDecorators: false,
          
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true
          },
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: false },
          
          guides: {
            indentation: true
          },
          
          scrollbar: { 
            vertical: 'visible', 
            horizontal: 'hidden', 
            useShadows: false,
            verticalScrollbarSize: 10
          },
          
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'on',
          fixedOverflowWidgets: false, 
        }}
      />
      <style>{`
        /* 検索ウィジェットのボタンや入力を殺さないように CSS を調整！ */
        .monaco-editor-background { outline: none !important; }
        .monaco-editor .inputarea.focus { outline: none !important; }
        
        .line-numbers { 
          font-size: 11px !important; 
          opacity: 0.4; 
          padding-right: 15px !important;
        }

        /* 検索ウィジェット自体の Z-index を確保 */
        .monaco-editor .find-widget {
          z-index: 2000 !important;
          box-shadow: var(--shadow-subtle) !important;
          border: 1px solid var(--border-main) !important;
          pointer-events: all !important;
        }
        .monaco-editor .find-widget .button {
          pointer-events: all !important;
        }
      `}</style>
    </div>
  );
};

export default MonacoEditor;
