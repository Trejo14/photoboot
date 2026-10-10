use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

mod print;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = app.emit("admin-unlock", ());
                    }
                })
                .build(),
        )
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(win) = app_handle.get_webview_window("main") {
                            let _ = win.emit("show-exit-confirm", ());
                        }
                    }
                });
            }

            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyQ);
            app.global_shortcut().register(shortcut)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            get_autostart,
            set_autostart,
            list_printers,
            print_thermal,
            print_default_silent,
            print_with_native_dialog,
            emit_admin_unlock,
            get_device_id,
            save_photo_to_downloads,
            open_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn get_autostart(app: tauri::AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        app.autolaunch().enable().map_err(|e| e.to_string())
    } else {
        app.autolaunch().disable().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn list_printers() -> Result<Vec<print::PrinterInfo>, String> {
    print::list_printers()
}

#[tauri::command]
fn print_thermal(
    printer: Option<String>,
    png_base64: String,
    copies: Option<u32>,
) -> Result<(), String> {
    print::print_thermal(printer, &png_base64, copies)
}

#[tauri::command]
fn print_default_silent(
    printer: Option<String>,
    png_base64: String,
    copies: Option<u32>,
    orientation: Option<String>,
    width_mm: Option<f64>,
    height_mm: Option<f64>,
) -> Result<(), String> {
    print::print_default_silent(printer, &png_base64, copies, orientation, width_mm, height_mm)
}

#[tauri::command]
fn print_with_native_dialog(
    png_base64: String,
    preferred_printer: Option<String>,
    orientation: Option<String>,
    width_mm: Option<f64>,
    height_mm: Option<f64>,
) -> Result<print::PrintDialogOutcome, String> {
    print::print_with_native_dialog(&png_base64, preferred_printer, orientation, width_mm, height_mm)
}

#[tauri::command]
fn emit_admin_unlock(app: tauri::AppHandle) -> Result<(), String> {
    app.emit("admin-unlock", ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_device_id(app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let id_file = app_dir.join(".device-id");

    if id_file.exists() {
        if let Ok(id) = fs::read_to_string(&id_file) {
            let trimmed = id.trim().to_string();
            if !trimmed.is_empty() {
                return Ok(trimmed);
            }
        }
    }

    let new_id = uuid::Uuid::new_v4().to_string();
    let _ = fs::create_dir_all(&app_dir);
    let _ = fs::write(&id_file, &new_id);
    Ok(new_id)
}

// Guarda la foto final en Descargas\Birdcam y devuelve la ruta completa.
#[tauri::command]
fn save_photo_to_downloads(
    app: tauri::AppHandle,
    jpeg_base64: String,
    file_name: String,
) -> Result<String, String> {
    use base64::Engine;
    use std::fs;

    // El nombre llega del frontend: solo se aceptan caracteres seguros para
    // que nunca pueda salirse de la carpeta de destino.
    let safe_name: String = file_name
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
        .collect();
    if safe_name.is_empty() || safe_name.starts_with('.') {
        return Err("Nombre de archivo inválido".into());
    }

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&jpeg_base64)
        .map_err(|e| format!("Imagen base64 inválida: {e}"))?;

    let dir = app
        .path()
        .download_dir()
        .map_err(|e| e.to_string())?
        .join("Birdcam");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(safe_name);
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}