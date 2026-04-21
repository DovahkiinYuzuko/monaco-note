use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct SavedTab {
    pub name: String,
    pub path: Option<String>,
    pub cache_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub editor_font_family: String,
    pub editor_font_size: u32,
    pub preview_font_family: String,
    pub preview_font_size: u32,
    pub theme: String,
    pub last_split_ratio: f32,
    pub save_tabs: bool,
    pub saved_tabs: Vec<SavedTab>,
    pub snippets: HashMap<String, String>,
    pub open_external_browser: bool,
    pub default_encoding: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        let mut snippets = HashMap::new();
        snippets.insert("date".to_string(), "${currentDate}".to_string());
        
        Self {
            editor_font_family: "system-ui".to_string(),
            editor_font_size: 16,
            preview_font_family: "system-ui".to_string(),
            preview_font_size: 16,
            theme: "vs-dark".to_string(),
            last_split_ratio: 50.0,
            save_tabs: true,
            saved_tabs: Vec::new(),
            snippets,
            open_external_browser: true,
            default_encoding: "UTF-8".to_string(),
        }
    }
}

// フォントリストを実際にスキャンする内部関数
fn scan_os_fonts() -> Vec<String> {
    let mut fonts = Vec::new();
    let font_dir = PathBuf::from("C:\\Windows\\Fonts");
    
    fn scan_dir(dir: PathBuf, fonts: &mut Vec<String>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    scan_dir(path, fonts);
                } else if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "ttf" || ext_str == "otf" || ext_str == "ttc" {
                        if let Some(name) = path.file_stem() {
                            let clean_name = name.to_string_lossy().to_string();
                            let family_name = clean_name.split('-').next().unwrap_or(&clean_name);
                            fonts.push(family_name.to_string());
                        }
                    }
                }
            }
        }
    }

    scan_dir(font_dir, &mut fonts);
    fonts.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    fonts.dedup();
    fonts
}

#[tauri::command]
pub fn get_os_fonts(app_handle: tauri::AppHandle) -> Vec<String> {
    let config_dir = app_handle.path().app_config_dir().unwrap_or_default();
    let cache_path = config_dir.join("fonts_cache.json");

    // キャッシュがあればそれを返す
    if let Ok(content) = fs::read_to_string(&cache_path) {
        if let Ok(fonts) = serde_json::from_str::<Vec<String>>(&content) {
            return fonts;
        }
    }

    // キャッシュがなければスキャンして保存
    let fonts = scan_os_fonts();
    if let Ok(content) = serde_json::to_string(&fonts) {
        let _ = fs::create_dir_all(&config_dir);
        let _ = fs::write(cache_path, content);
    }
    fonts
}

#[tauri::command]
pub fn refresh_os_fonts(app_handle: tauri::AppHandle) -> Vec<String> {
    let config_dir = app_handle.path().app_config_dir().unwrap_or_default();
    let cache_path = config_dir.join("fonts_cache.json");

    // 強制的に再スキャンしてキャッシュを更新
    let fonts = scan_os_fonts();
    if let Ok(content) = serde_json::to_string(&fonts) {
        let _ = fs::create_dir_all(&config_dir);
        let _ = fs::write(cache_path, content);
    }
    fonts
}

#[tauri::command]
pub fn load_config(app_handle: tauri::AppHandle) -> AppConfig {
    let config_dir = app_handle.path().app_config_dir().unwrap_or_default();
    let config_path = config_dir.join("config.json");
    if let Ok(content) = fs::read_to_string(config_path) {
        if let Ok(config) = serde_json::from_str(&content) {
            return config;
        }
    }
    AppConfig::default()
}

#[tauri::command]
pub fn get_config_path(app_handle: tauri::AppHandle) -> String {
    let config_dir = app_handle.path().app_config_dir().unwrap_or_default();
    config_dir.join("config.json").to_string_lossy().to_string()
}

#[tauri::command]
pub fn save_config(app_handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let config_dir = app_handle.path().app_config_dir().unwrap_or_default();
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    let config_path = config_dir.join("config.json");
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

// cache_id のサニタイズ（英数字とハイフンのみ許可）
fn sanitize_cache_id(id: &str) -> String {
    id.chars().filter(|c| c.is_alphanumeric() || *c == '-').collect()
}

#[tauri::command]
pub fn save_tab_cache(app_handle: tauri::AppHandle, cache_id: String, content: String) -> Result<(), String> {
    let safe_id = sanitize_cache_id(&cache_id);
    let cache_dir = app_handle.path().app_cache_dir().unwrap_or_default().join("tab_cache");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    let cache_path = cache_dir.join(format!("{}.txt", safe_id));
    fs::write(cache_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn load_tab_cache(app_handle: tauri::AppHandle, cache_id: String) -> Result<String, String> {
    let safe_id = sanitize_cache_id(&cache_id);
    let cache_path = app_handle.path().app_cache_dir().unwrap_or_default().join("tab_cache").join(format!("{}.txt", safe_id));
    fs::read_to_string(cache_path).map_err(|e| e.to_string())
}
