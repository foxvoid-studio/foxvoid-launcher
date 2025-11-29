// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use std::process::Command;

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
async fn start_login_flow(app: AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_new_project(
    name: String,
    path: String,
    template_url: String,
) -> Result<String, String> {
    // 1. Construct the full target path
    let target_path = Path::new(&path).join(&name);

    if target_path.exists() {
        return Err(
            "A folder with this name already exists in the selected directory.".to_string(),
        );
    }

    // 2. Clone the repository using git
    // We use "depth 1" to download only the latest commit (faster)
    let output = Command::new("git")
        .args([
            "clone",
            "--depth",
            "1",
            &template_url,
            target_path.to_str().unwrap(),
        ])
        .output()
        .map_err(|e| format!("Failed to execute git: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Git clone failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // 3. Remove the .git folder to detach from the template history
    let git_dir = target_path.join(".git");
    if let Err(e) = fs::remove_dir_all(&git_dir) {
        return Err(format!("Failed to remove .git directory: {}", e));
    }

    // 4. Update Cargo.toml with the new project name
    let cargo_path = target_path.join("Cargo.toml");
    if cargo_path.exists() {
        match fs::read_to_string(&cargo_path) {
            Ok(content) => {
                // Simple string replacement (naive but effective for templates)
                // Assumes the template has 'name = "template-name"' or similar.
                // For a robust solution, use the `toml_edit` crate.
                let new_content = content.replace(
                    "name = \"fantasy-craft-default-template\"",
                    &format!("name = \"{}\"", name),
                );
                if let Err(e) = fs::write(cargo_path, new_content) {
                    return Err(format!("Failed to update Cargo.toml: {}", e));
                }
            }
            Err(e) => return Err(format!("Failed to read Cargo.toml: {}", e)),
        }
    }

    Ok(format!("Project {} created successfully!", name))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // Initialize the opener plugin
        .plugin(tauri_plugin_opener::init())
        // Initialize the SQL plugin
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Initialize the HTTP plugin
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            start_login_flow,
            create_new_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
