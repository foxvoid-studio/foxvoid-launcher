// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
async fn start_login_flow(app: AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        // Initialize the opener plugin
        .plugin(tauri_plugin_opener::init())
        // Initialize the SQL plugin
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Initialize the HTTP plugin
        .plugin(tauri_plugin_http::init()) 
        .invoke_handler(tauri::generate_handler![start_login_flow])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
