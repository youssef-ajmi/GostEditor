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
fn create_file(parent_path: String, name: String) -> Result<String, String> {
    let new_path = Path::new(&parent_path).join(&name);
    if new_path.exists() {
        return Err(format!("File already exists: {}", new_path.display()));
    }
    fs::write(&new_path, "").map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn create_folder(parent_path: String, name: String) -> Result<String, String> {
    let new_path = Path::new(&parent_path).join(&name);
    if new_path.exists() {
        return Err(format!("Folder already exists: {}", new_path.display()));
    }
    fs::create_dir(&new_path).map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn rename_item(old_path: String, new_name: String) -> Result<String, String> {
    let old = Path::new(&old_path);
    let parent = old.parent().ok_or("Cannot determine parent directory")?;
    let new_path = parent.join(&new_name);
    if new_path.exists() {
        return Err(format!("Already exists: {}", new_path.display()));
    }
    fs::rename(&old, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn delete_item(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err(format!("Not found: {}", path));
    }
    if target.is_dir() {
        fs::remove_dir(&target).map_err(|e| format!("Failed to remove directory (must be empty): {}", e))?;
    } else {
        fs::remove_file(&target).map_err(|e| e.to_string())?;
    }
    Ok(())
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

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchMatch {
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub text: String,
}

fn search_recursive(dir: &Path, query: &str, results: &mut Vec<SearchMatch>, depth: usize) -> Result<(), String> {
    if depth > 20 {
        return Ok(());
    }
    let ignored = [".git", "node_modules", "target", "dist", ".vscode", ".idea", "__pycache__", ".opencode"];
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if ignored.contains(&name.as_str()) { continue; }
        let path = entry.path();
        if path.is_dir() {
            search_recursive(&path, query, results, depth + 1)?;
        } else if path.is_file() {
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            if metadata.len() > 1_000_000 { continue; }
            if let Ok(content) = fs::read_to_string(&path) {
                for (i, line) in content.lines().enumerate() {
                    if let Some(col) = line.to_lowercase().find(&query.to_lowercase()) {
                        results.push(SearchMatch {
                            file: path.to_string_lossy().to_string(),
                            line: i + 1,
                            column: col + 1,
                            text: line.trim().to_string(),
                        });
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn search_files(path: String, query: String) -> Result<Vec<SearchMatch>, String> {
    let mut results = Vec::new();
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Not a directory".to_string());
    }
    search_recursive(dir, &query, &mut results, 0)?;
    Ok(results)
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
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_dir,
            read_file,
            write_file,
            open_workspace,
            get_git_branch,
            create_file,
            create_folder,
            rename_item,
            delete_item,
            search_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}