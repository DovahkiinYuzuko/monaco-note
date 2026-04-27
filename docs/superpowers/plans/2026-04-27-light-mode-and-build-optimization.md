# ライトモード最適化、ビルド環境構築、およびファイル起動サポートの実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ライトモードの視認性向上、マルチプラットフォーム向けのインストーラー作成機能、および外部ファイルからのアプリ起動（中身の自動読み込み）を実現する。

**Architecture:**
1.  **スタイル**: CSS変数 (`--shadow-main` 等) を導入し、GitHub Markdown CSS と highlight.js の配色を React 側で動的に制御する。
2.  **ビルド**: Tauri の `bundle` 設定を拡張し、Windows 用 NSIS オプションと macOS 用ターゲットを追加する。
3.  **統合**: Rust の `main.rs` で引数を処理し、Tauri の `emit` でフロントエンドにファイルパスを通知、フロントエンドの `useTabs` でファイルを開く。

**Tech Stack:** React 19, Tauri v2, TypeScript, Lucide React, CSS.

---

### Task 1: グローバルスタイルと依存関係の修正

**Files:**
- Modify: `src/App.css`
- Modify: `src/App.tsx`
- Modify: `src/components/CommandPalette.tsx`
- Modify: `src/components/Settings.tsx`
- Modify: `src/components/TabBar.tsx`

- [ ] **Step 1: App.css にシャドウ変数を追加し、ライトモードの色味を微調整**
```css
/* src/App.css の [data-theme="vs-dark"] に追加 */
--shadow-main: 0 8px 32px rgba(0,0,0,0.5);
--shadow-subtle: 0 4px 12px rgba(0,0,0,0.5);

/* src/App.css の [data-theme="light"] に追加 */
--shadow-main: 0 8px 32px rgba(0,0,0,0.15);
--shadow-subtle: 0 4px 12px rgba(0,0,0,0.1);
```

- [ ] **Step 2: lucide-react のインポート方式を一括修正**
型エラーを解消するため、`import Icon from "lucide-react/dist/esm/icons/icon"` を `import { Icon } from "lucide-react"` に書き換える（全5ファイル）。

- [ ] **Step 3: TabBar.tsx の型エラー修正**
`onClick={(e) => ...}` を `onClick={(e: React.MouseEvent) => ...}` に修正。

---

### Task 2: プレビュー画面のライトモード最適化

**Files:**
- Modify: `src/components/Preview.tsx`

- [ ] **Step 1: GitHub Markdown CSS 変数の動的制御**
`.markdown-body` 内で `--color-canvas-subtle` 等をライト/ダークそれぞれ明示的に上書きする。

- [ ] **Step 2: コードブロックとハイライトの配色修正**
ライトモード時、`.code-block-wrapper` の背景を `#f6f8fa` にし、`highlight.js` の各クラス (`.hljs-keyword` 等) の色をライト用に上書きする。

---

### Task 3: UIコンポーネントのテーマ対応強化

**Files:**
- Modify: `src/components/StatusBar.tsx`
- Modify: `src/components/CommandPalette.tsx`
- Modify: `src/components/Editor.tsx`

- [ ] **Step 1: StatusBar の配色統一**
背景色を `var(--primary)` に変更。

- [ ] **Step 2: CommandPalette の全面変数化**
直書きの `#1e1e1e` や `rgba(0,0,0,0.3)` を `var(--bg-main)`, `var(--shadow-main)` 等に置き換える。

- [ ] **Step 3: Monaco Editor 検索ウィジェットの影を調整**
`.find-widget` の `box-shadow` を `var(--shadow-subtle)` に変更。

---

### Task 4: ビルド設定の最適化

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: ターゲットと NSIS オプションの設定**
`targets` を `["nsis", "app", "dmg"]` にし、`nsis` ブロックに `oneClick: false`, `createDesktopShortcut: "always"` 等を追加。

---

### Task 5: ファイル起動サポート (Rust & Frontend)

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src/App.tsx`

- [ ] **Step 1: Rust 側でコマンドライン引数をパースし、イベントを発火**
`tauri::Builder` の `.setup` 内で引数を取得し、`window.emit("open-file", path)` を実行。

- [ ] **Step 2: フロントエンド側でイベントを listen**
`App.tsx` の `useEffect` で `listen("open-file", ...)` し、ファイルパスを受け取ったら `openFile(path)` を呼ぶ。

---

### Task 6: 最終確認と仕様書更新

- [ ] **Step 1: 全ファイルのビルド確認**
`npm run build` を実行してエラーが出ないことを確認。

- [ ] **Step 2: 変数関数仕様書.md の更新**
新しく追加した CSS 変数や Rust 側のイベント処理について追記。
