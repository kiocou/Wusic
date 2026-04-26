use serde::Serialize;
use std::{
    collections::hash_map::DefaultHasher,
    fs,
    hash::{Hash, Hasher},
    path::{Path, PathBuf},
};

const SUPPORTED_EXTENSIONS: [&str; 5] = ["mp3", "flac", "wav", "m4a", "ogg"];

#[derive(Debug, Serialize)]
pub struct LocalTrack {
    pub id: i64,
    pub path: String,
    pub file_name: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_ms: Option<u64>,
    pub extension: String,
    pub size: u64,
}

#[tauri::command]
pub fn scan_local_music_dir(path: String) -> Result<Vec<LocalTrack>, String> {
    let root = PathBuf::from(path);
    if !root.is_dir() {
        return Err("请选择有效的本地音乐目录".to_string());
    }

    let mut tracks = Vec::new();
    visit_dir(&root, &mut tracks)?;
    tracks.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));

    Ok(tracks)
}

fn visit_dir(dir: &Path, tracks: &mut Vec<LocalTrack>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|err| format!("读取目录失败: {err}"))?;

    for entry in entries {
        let entry = entry.map_err(|err| format!("读取文件失败: {err}"))?;
        let path = entry.path();

        if path.is_dir() {
            visit_dir(&path, tracks)?;
            continue;
        }

        if !is_supported_audio_file(&path) {
            continue;
        }

        let metadata = entry
            .metadata()
            .map_err(|err| format!("读取文件信息失败: {err}"))?;
        let extension = path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or_default()
            .to_lowercase();
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default()
            .to_string();
        let title = path
            .file_stem()
            .and_then(|name| name.to_str())
            .unwrap_or(&file_name)
            .to_string();

        tracks.push(LocalTrack {
            id: stable_negative_id(&path),
            path: path.to_string_lossy().to_string(),
            file_name,
            title,
            artist: None,
            album: None,
            duration_ms: None,
            extension,
            size: metadata.len(),
        });
    }

    Ok(())
}

fn is_supported_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let ext = ext.to_lowercase();
            SUPPORTED_EXTENSIONS.contains(&ext.as_str())
        })
        .unwrap_or(false)
}

fn stable_negative_id(path: &Path) -> i64 {
    let mut hasher = DefaultHasher::new();
    path.to_string_lossy().hash(&mut hasher);
    -((hasher.finish() % 2_000_000_000) as i64) - 1
}
