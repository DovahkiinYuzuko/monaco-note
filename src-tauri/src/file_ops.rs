use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;
use encoding_rs::{UTF_8, SHIFT_JIS, EUC_JP};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FileData {
    pub content: String,
    pub encoding: String,
}

// パスの安全性をチェックするためのユーティリティ関数
fn is_path_safe(path: &str) -> bool {
    // 1. 相対パスでの遡り ("..") をチェックして、不適切なファイルアクセスを防ぐ
    if path.contains("..") {
        return false;
    }
    // 2. 将来的には特定のディレクトリ制限などを追加可能だが、現在は自由なアクセスを許容
    true
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<FileData, String> {
    if !is_path_safe(&path) {
        return Err("安全ではないパスが指定されました。".to_string());
    }

    let mut file = File::open(&path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    // 文字エンコーディングの判定ロジック。まずはUTF-8で試行。
    let (res, _encoding, _has_errors) = UTF_8.decode(&buffer);
    if !_has_errors {
        return Ok(FileData {
            content: res.into_owned(),
            encoding: "UTF-8".to_string(),
        });
    }

    // UTF-8でエラーが出た場合はShift-JISで試行。
    let (res, _, _has_errors) = SHIFT_JIS.decode(&buffer);
    if !_has_errors {
        return Ok(FileData {
            content: res.into_owned(),
            encoding: "Shift-JIS".to_string(),
        });
    }

    // それでもダメな場合はEUC-JPとして扱う（フォールバック）。
    let (res, _, _) = EUC_JP.decode(&buffer);
    Ok(FileData {
        content: res.into_owned(),
        encoding: "EUC-JP".to_string(),
    })
}

#[tauri::command]
pub fn write_text_file(path: String, content: String, encoding: String) -> Result<(), String> {
    if !is_path_safe(&path) {
        return Err("安全ではないパスが指定されました。".to_string());
    }

    let mut file = File::create(&path).map_err(|e| e.to_string())?;

    let bytes = match encoding.as_str() {
        "Shift-JIS" => {
            let (res, _, _) = SHIFT_JIS.encode(&content);
            res.into_owned()
        },
        "EUC-JP" => {
            let (res, _, _) = EUC_JP.encode(&content);
            res.into_owned()
        },
        _ => content.into_bytes(), // デフォルトは UTF-8
    };

    file.write_all(&bytes).map_err(|e| e.to_string())?;
    Ok(())
}
