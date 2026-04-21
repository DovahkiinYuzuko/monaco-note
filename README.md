# モナコノート / Monaco Note

<p align="center">
  <img src="app-icon.png" width="128" height="128" alt="Monaco Note Icon">
</p>

[日本語](#日本語) | [English](#english)

---

<a name="日本語"></a>
## 日本語

### 概要
モナコノートは、VSCode のコアエディタである Monaco Editor を搭載した、エンジニアのためのデスクトップ用 Markdown メモ帳です。
Tauri と React をベースに構築されており、ネイティブアプリの軽快な動作と、モダンな Web 技術による高度な編集体験を両立しています。

### 主な機能
- 本格的な編集体験: Monaco Editor による高度なシンタックスハイライト、コード補完、マルチカーソル編集。
- インテリジェント・スクロール同期: 行番号ベースの線形補間アルゴリズムを採用し、エディタとプレビューをミリ単位で精密に同期。
- 高度な文字コード対応: 日本独自の文字コード（Shift-JIS, EUC-JP）をネイティブレベルでサポート。自動判別機能により、古い資産の閲覧・編集もスムーズです。
- 強力なステート保存: 自動保存機能に加え、未保存のタブ（Untitled）やスクロール位置、分割比率を次回起動時に完全復元。
- コマンドパレット: Ctrl+Shift+Pですべての機能にアクセス可能。マウスを触らずに設定変更やファイル操作が完結します。
- 高いカスタマイズ性: エディタとプレビューそれぞれに独立したフォント設定（OS インストール済みフォント対応）やカスタムスニペットを適用可能。

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

# 開発モードの起動（デバッグ用）
npm run tauri dev

# 本番用パッケージのビルド（exe/msi 等の生成）
npm run tauri build
```

---

<a name="english"></a>
## English

### Overview
Monaco Note is a high-performance desktop Markdown notepad for engineers, powered by Monaco Editor, the core of VSCode.
Built with Tauri and React, it combines the snappiness of a native application with the advanced editing features of modern web technologies.

### Key Features
- Professional Editing: Advanced syntax highlighting, code completion, and multi-cursor support powered by Monaco Editor.
- Intelligent Scroll Sync: Precision bidirectional synchronization using a line-based linear interpolation algorithm.
- Robust Encoding Support: Native support for various encodings including UTF-8, Shift-JIS, and EUC-JP with auto-detection.
- State Preservation: In addition to auto-save, it fully restores unsaved tabs (Untitled), scroll positions, and UI layout across sessions.
- Command Palette: Quick access to all features via Ctrl+Shift+P. Manage settings and files without leaving the keyboard.
- Extensive Customization: Independent font settings (supporting system-installed fonts) and custom snippets for both the editor and preview.

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

# Run in development mode (for debugging)
npm run tauri dev

# Build the production package (generates exe/msi, etc.)
npm run tauri build
```

---

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
