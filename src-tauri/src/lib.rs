mod download;
mod local_music;
mod smtc;
mod thumbbar;

use font_kit::source::SystemSource;
use std::collections::HashSet;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 获取系统安装的所有字体名称
#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    let source = SystemSource::new();
    match source.all_families() {
        Ok(families) => {
            // 使用 HashSet 去重并排序
            let mut unique_families: HashSet<String> = families.into_iter().collect();
            let mut result: Vec<String> = unique_families.drain().collect();
            result.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
            result
        }
        Err(e) => {
            eprintln!("Failed to get system fonts: {:?}", e);
            // 返回一些常见字体作为后备
            vec![
                "Microsoft YaHei".to_string(),
                "PingFang SC".to_string(),
                "SimSun".to_string(),
                "SimHei".to_string(),
                "Arial".to_string(),
                "Helvetica".to_string(),
                "Segoe UI".to_string(),
            ]
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--disable-features=HardwareMediaKeyHandling",
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("app-foreground", ());
            }
        }))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }

            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Wusic")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("app-foreground", ());
                        }
                    }
                    _ => {}
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            smtc::init_smtc(app.handle());

            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window");
            let hwnd = {
                use raw_window_handle::HasWindowHandle;
                let raw = window.window_handle().expect("Failed to get window handle");
                match raw.as_raw() {
                    raw_window_handle::RawWindowHandle::Win32(h) => {
                        windows::Win32::Foundation::HWND(h.hwnd.get() as isize)
                    }
                    _ => panic!("Not a Win32 window"),
                }
            };
            thumbbar::setup(hwnd, app.handle().clone());

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.emit("app-background", ());

                std::thread::spawn({
                    let window = window.clone();
                    move || {
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        let _ = window.hide();
                    }
                });
            }
            _ => {}
        })
        .manage(download::new_registry())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_fonts,
            smtc::smtc_update_metadata,
            smtc::smtc_update_playback,
            download::get_default_download_dir,
            download::ensure_dir_exists,
            download::download_song,
            download::pause_download,
            local_music::scan_local_music_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
