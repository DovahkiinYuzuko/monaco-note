mod file_ops;
mod font_ops;

use tauri::Emitter;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            // 引数が2つ以上ある場合（[0]はプログラム名、[1]が最初の引数）
            if args.len() > 1 {
                let file_path = args[1].clone();
                // ファイルパスと思われるものをフロントエンドに送信
                if !file_path.starts_with('-') {
                    let app_handle = app.handle().clone();
                    tauri::async_runtime::spawn(async move {
                        // フロントエンドの準備を待つために少し遅延させる
                        std::thread::sleep(std::time::Duration::from_millis(1500));
                        let _ = app_handle.emit("open-file", file_path);
                    });
                }
            }
            Ok(())
        })
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
