# モナコノート / Monaco Note

<p align="center">
  <img src="app-icon.png" width="128" height="128" alt="Monaco Note Icon">
</p>

[日本語](#日本語) | [English](#english)

---

<a name="日本語"></a>
## 日本語

### 概要
モナコノートは、VSCode のコアエディタである Monaco Editor を内包したシンプルなデスクトップ用メモ帳です。
Tauri と React をベースに構築されており、ネイティブアプリの軽快な動作と、Monaco Editor による快適なテキスト編集体験を提供します。

### 主な機能
- テキスト編集: Monaco Editor による高度な編集機能（マルチカーソル、検索・置換等）。
- 多文字コード対応: UTF-8 に加え、Shift-JIS や EUC-JP の読み書きをサポート。
- 自動保存・復元: タイピングを止めると自動保存。未保存のタブやアプリの状態を次回起動時に完全復元。
- コマンドパレット: Ctrl+Shift+Pですべての機能にアクセス可能。
- カスタマイズ: エディタとプレビューそれぞれのフォント設定やカスタムスニペットを適用可能。
- Markdownプレビュー（付随機能）: Markdown 形式のテキストをリアルタイムでプレビューする機能も備えています。

### 技術スタック
- Frontend: React 19, TypeScript, Vite
- Backend: Tauri v2, Rust
- Editor: Monaco Editor (@monaco-editor/react)
- Styling: GitHub Markdown CSS, Lucide React, CSS Modules

### 開発者向けセットアップ

ビルドには以下の環境が必要です：
- Node.js (v18以上推奨)
- Rust (最新の stable バージョン)
- WebView2 (Windows の場合)

```bash
# 依存関係のインストール
npm install
```
```bash
# 開発モードの起動（デバッグ用）
npm run tauri dev
```
```bash
# 本番用パッケージのビルド（exe/msi 等の生成）
npm run tauri build
```

---

<a name="english"></a>
## English

### Overview
Monaco Note is a simple desktop notepad that integrates Monaco Editor, the core of VSCode.
Built with Tauri and React, it combines the snappiness of a native application with the smooth text editing experience of Monaco Editor.

### Key Features
- Text Editing: Advanced editing capabilities (multi-cursor, find/replace, etc.) powered by Monaco Editor.
- Multi-Encoding Support: Seamlessly read and write various encodings including UTF-8, Shift-JIS, and EUC-JP.
- State Preservation: Automatically saves work and restores unsaved tabs, scroll positions, and layout across sessions.
- Command Palette: Quick access to all features via Ctrl+Shift+P.
- Extensive Customization: Independent font settings and custom snippets.
- Markdown Preview (Extra): Includes an optional real-time Markdown previewing capability.

### Tech Stack
- Frontend: React 19, TypeScript, Vite
- Backend: Tauri v2, Rust
- Editor: Monaco Editor (@monaco-editor/react)
- Styling: GitHub Markdown CSS, Lucide React, CSS Modules

### Setup for Developers

The following environments are required for building:
- Node.js (v18 or higher recommended)
- Rust (latest stable version)
- WebView2 (For Windows)

```bash
# Install dependencies
npm install
```
```bash
# Run in development mode (for debugging)
npm run tauri dev
```
```bash
# Build the production package (generates exe/msi, etc.)
npm run tauri build
```

---

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
