# フォントシステム刷新 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ブラウザの Local Font Access API への依存を排除し、Rust (`fontdb`) による安定したフォントファミリー名取得システムに移行する。

**Architecture:** 
- バックエンド (Rust) で `fontdb` ライブラリを使用してシステムフォントをスキャンし、正確なファミリー名をリスト化してフロントエンドに提供する。
- フロントエンド (React) はブラウザ API の呼び出しを停止し、Rust からのデータのみを使用するように統合する。

**Tech Stack:** Rust, fontdb, Tauri, React, TypeScript

---

### Task 1: Rust 依存関係の追加

**Files:**
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: fontdb を Cargo.toml に追加する**

```toml
[dependencies]
# ... existing dependencies
fontdb = "0.23"
```

- [ ] **Step 2: コンパイルが通るか確認する**

Run: `cd src-tauri; cargo check`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src-tauri/Cargo.toml
git commit -m "feat: fontdb を依存関係に追加"
```

---

### Task 2: バックエンドのスキャンロジック刷新

**Files:**
- Modify: `src-tauri/src/font_ops.rs`

- [ ] **Step 1: fontdb を使用してフォントファミリー名を取得するように関数を書き換える**

```rust
use fontdb;

// ... (既存のコードを整理しつつ、scan_os_fonts を刷新)
fn scan_os_fonts() -> Vec<String> {
    let mut db = fontdb::Database::new();
    db.load_system_fonts();
    
    let mut fonts: Vec<String> = db.faces()
        .map(|face| face.family.clone())
        .collect();
    
    fonts.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    fonts.dedup();
    fonts
}
```

- [ ] **Step 2: キャッシュクリアを伴うリフレッシュ機能の確認**

`refresh_os_fonts` コマンドが新しい `scan_os_fonts` を呼び出すことを確認する。

- [ ] **Step 3: コミット**

```bash
git add src-tauri/src/font_ops.rs
git commit -m "feat: fontdb を使用したフォントスキャンロジックの実装"
```

---

### Task 3: フロントエンドの API 呼び出し削除と統合

**Files:**
- Modify: `src/components/Settings.tsx`

- [ ] **Step 1: Local Font Access API 関連のコードを削除し、Rust への呼び出しに統一する**

```typescript
// queryLocalFonts 関連のロジックを削除し、handleRefreshFonts を簡略化
const handleRefreshFonts = useCallback(async (silent = false) => {
  if (!silent) setIsFontLoading(true);
  try {
    // Rust 側の refresh_os_fonts だけを呼ぶように変更
    const freshFonts: string[] = await invoke('refresh_os_fonts');
    if (freshFonts.length > 0) {
      setFonts(prev => Array.from(new Set([...prev, 'system-ui', ...freshFonts])).sort());
      // ローカルストレージのキャッシュも更新
      localStorage.setItem('monaco_note_font_cache', JSON.stringify(freshFonts));
    }
  } catch (e) {
    console.warn("Font refresh failed", e);
  } finally {
    if (!silent) setIsFontLoading(false);
  }
}, []);
```

- [ ] **Step 2: 初期化時のロジックも整理する**

`useEffect` 内での初期フォント読み込みも `get_os_fonts` だけを使うように調整。

- [ ] **Step 3: コミット**

```bash
git add src/components/Settings.tsx
git commit -m "refactor: Local Font Access API を廃止し Rust 経由の取得に一本化"
```

---

### Task 4: 動作確認と最終調整

**Files:**
- Modify: `README.md` (必要に応じて)
- Modify: `変数関数仕様書.md`

- [ ] **Step 1: アプリを起動して設定画面を確認する**

Run: `npm run tauri dev`
Expected: 設定画面のフォントリストに「ＭＳ ゴシック」等の正しい名前が表示され、選択して保存できること。

- [ ] **Step 2: 仕様書の更新**

`変数関数仕様書.md` に今回の変更を反映する。

- [ ] **Step 3: コミット**

```bash
git add 変数関数仕様書.md
git commit -m "docs: フォント取得仕様の変更を反映"
```
