# フォント設定反映の確実化 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** フォント名にスペースが含まれる場合のパースエラーを修正し、かつ日本語名と英語名の両方を取得できるようにすることで、フォント設定の反映を確実にする。

**Architecture:** 
- バックエンド (Rust) で `fontdb` から取得するファミリー名を多言語対応（全名称取得）に拡張する。
- フロントエンド (React) で、エディタおよびプレビューにフォント名を適用する際にダブルクオートで囲む処理を追加する。

**Tech Stack:** Rust, fontdb, React, TypeScript

---

### Task 1: バックエンドの多言語名取得への拡張

**Files:**
- Modify: `src-tauri/src/font_ops.rs`

- [ ] **Step 1: scan_os_fonts 関数を修正し、すべてのファミリー名を取得するようにする**

```rust
// scan_os_fonts のロジックを修正
fn scan_os_fonts() -> Vec<String> {
    let mut db = fontdb::Database::new();
    db.load_system_fonts();

    let mut fonts = Vec::new();
    for face in db.faces() {
        for (name, _) in &face.families {
            fonts.push(name.clone());
        }
    }

    fonts.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    fonts.dedup();
    fonts
}
```

- [ ] **Step 2: コンパイル確認**

Run: `cd src-tauri; cargo check`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src-tauri/src/font_ops.rs
git commit -m "feat: フォントファミリー名を多言語（全名称）取得するように拡張"
```

---

### Task 2: フロントエンドのクオート処理追加 (Editor)

**Files:**
- Modify: `src/components/Editor.tsx`

- [ ] **Step 1: Monaco Editor の fontFamily オプションをクオートで囲む**

```typescript
// fontFamily を渡す箇所を修正
options={{
  fontSize,
  fontFamily: `"${fontFamily}"`, // ダブルクオートで囲む
  // ... rest of options
}}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/Editor.tsx
git commit -m "fix: エディタの fontFamily をダブルクオートで囲むように修正"
```

---

### Task 3: フロントエンドのクオート処理追加 (Preview)

**Files:**
- Modify: `src/components/Preview.tsx`

- [ ] **Step 1: Markdown プレビューのインラインスタイルをクオートで囲む**

```typescript
<style>{`
  .markdown-body {
    color: var(--text-main) !important;
    background-color: transparent !important;
    font-family: "${fontFamily}", system-ui, sans-serif !important; // ダブルクオートで囲む
    line-height: 1.7 !important;
    // ...
  }
`}</style>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/Preview.tsx
git commit -m "fix: プレビューの font-family をダブルクオートで囲むように修正"
```

---

### Task 4: 動作確認

- [ ] **Step 1: アプリを起動してスペース入りのフォントが反映されるか確認**

Run: `npm run tauri dev`
Expected: "Cascadia Code" や "ＭＳ ゴシック" などを選択した際、エディタとプレビューの両方で正しくフォントが切り替わること。
