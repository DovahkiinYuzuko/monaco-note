mod file_ops;
mod font_ops;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            file_ops::read_text_file,
            file_ops::write_text_file,
            font_ops::get_os_fonts,
            font_ops::refresh_os_fonts,
            font_ops::load_config,
            font_ops::save_config,
            font_ops::get_config_path,
            font_ops::save_tab_cache,
            font_ops::load_tab_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
