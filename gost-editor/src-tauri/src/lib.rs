use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub name: String,
    pub path: String,
    pub files: Vec<FileEntry>,
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries = Vec::new();
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
        });
    }
    entries.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then(a.name.cmp(&b.name)));
    Ok(entries)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_workspace(path: String) -> Result<WorkspaceInfo, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let name = dir
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let files = list_dir(path.clone())?;

    Ok(WorkspaceInfo { name, path, files })
}

#[tauri::command]
fn get_git_branch(path: String) -> Result<String, String> {
    let head_path = Path::new(&path).join(".git").join("HEAD");
    let content = fs::read_to_string(&head_path).map_err(|_| "Not a git repository".to_string())?;
    if let Some(ref_line) = content.lines().next() {
        if let Some(branch) = ref_line.strip_prefix("ref: refs/heads/") {
            return Ok(branch.to_string());
        }
    }
    Err("Could not determine branch".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_dir,
            read_file,
            write_file,
            open_workspace,
            get_git_branch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}