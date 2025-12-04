// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use std::process::Command; // Utilisé pour git ET pour ouvrir l'éditeur

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use which::which;

// --- STRUCTURES ---

#[derive(serde::Serialize, Clone)]
pub struct EditorInfo {
    name: String,
    slug: String,
    path: String
}

// --- COMMANDES ---

#[tauri::command]
async fn detect_editors() -> Result<Vec<EditorInfo>, String> {
    let mut editors = Vec::new();

    // Liste des éditeurs à chercher
    let candidates = vec![
        ("code", "Visual Studio Code", "vscode"),
        ("code-oss", "VS Code (OSS)", "vscode-oss"),
        ("vscodium", "VSCodium", "vscodium"),
        ("subl", "Sublime Text", "sublime"),
        ("cursor", "Cursor", "cursor"),
        ("nvim", "NeoVim", "neovim"),
        // Flatpak IDs
        ("com.visualstudio.code", "VS Code (Flatpak)", "vscode-flatpak"),
    ];

    // Liste des dossiers où chercher physiquement si 'which' échoue
    let search_paths = vec![
        "/usr/bin",        // <--- C'est ici que se trouve ton 'code'
        "/usr/local/bin",
        "/snap/bin",
        "/var/lib/flatpak/exports/bin",
    ];

    for (bin, name, slug) in candidates {
        let mut found_path: Option<String> = None;

        // 1. Essai via le PATH (which)
        if let Ok(path) = which(bin) {
            found_path = Some(path.to_string_lossy().to_string());
        } 
        
        // 2. Si pas trouvé, recherche brute dans les dossiers systèmes
        if found_path.is_none() {
             #[cfg(target_os = "linux")]
             for dir in &search_paths {
                let p = Path::new(dir).join(bin);
                if p.exists() {
                    found_path = Some(p.to_string_lossy().to_string());
                    break;
                }
             }
        }

        // Si on a trouvé quelque chose, on l'ajoute
        if let Some(path) = found_path {
            editors.push(EditorInfo {
                name: name.to_string(),
                slug: slug.to_string(),
                path
            });
        }
    }

    Ok(editors)
}

// NOUVELLE COMMANDE : OUVRIR LE PROJET
#[tauri::command]
async fn open_project_in_editor(project_path: String, editor_path: String) -> Result<(), String> {
    // Lance l'éditeur en mode "détaché" (spawn)
    // Cela évite que fermer le launcher ne ferme aussi l'éditeur
    Command::new(editor_path)
        .arg(project_path)
        .spawn()
        .map_err(|e| format!("Failed to open editor: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn start_login_flow(app: AppHandle, url: String) -> Result<(), String> {
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_new_project(name: String, path: String, template_url: String) -> Result<String, String> {
    let target_path = Path::new(&path).join(&name);

    if target_path.exists() {
        return Err("A folder with this name already exists.".to_string());
    }

    // Git Clone
    let output = Command::new("git")
        .args(["clone", "--depth", "1", &template_url, target_path.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Failed to execute git: {}", e))?;

    if !output.status.success() {
        return Err(format!("Git clone failed: {}", String::from_utf8_lossy(&output.stderr)));
    }

    // Remove .git
    let git_dir = target_path.join(".git");
    let _ = fs::remove_dir_all(&git_dir); // On ignore l'erreur si .git n'existe pas

    // Update Cargo.toml
    let cargo_path = target_path.join("Cargo.toml");
    if cargo_path.exists() {
        if let Ok(content) = fs::read_to_string(&cargo_path) {
            let new_content = content.replace(
                "name = \"fantasy-craft-default-template\"",
                &format!("name = \"{}\"", name),
            );
            let _ = fs::write(cargo_path, new_content);
        }
    }

    Ok(format!("Project {} created successfully!", name))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            start_login_flow,
            create_new_project,
            detect_editors,
            open_project_in_editor // <--- AJOUTÉ ICI
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
