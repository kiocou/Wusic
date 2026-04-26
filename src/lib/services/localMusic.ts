import type { LocalTrack, Song } from "@/lib/types";
import { isTauriRuntime } from "@/lib/tauri";

export async function chooseLocalMusicDirectory() {
  if (!isTauriRuntime()) {
    throw new Error("浏览器预览环境不支持选择本地音乐目录，请在桌面端使用。");
  }

  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    directory: true,
    multiple: false,
    title: "选择本地音乐目录",
  });

  if (!selected || Array.isArray(selected)) return null;
  return selected;
}

export async function scanLocalMusicDir(path: string) {
  if (!isTauriRuntime()) {
    throw new Error("浏览器预览环境不支持扫描本地音乐目录，请在桌面端使用。");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<LocalTrack[]>("scan_local_music_dir", { path });
}

export function localTrackToSong(track: LocalTrack): Song {
  const artistName = track.artist || "本地文件";
  const albumName = track.album || "本地音乐";

  return {
    id: track.id,
    name: track.title,
    al: {
      id: track.id,
      name: albumName,
      picUrl: "",
    },
    album: {
      id: track.id,
      name: albumName,
      picUrl: "",
    },
    dt: track.duration_ms ?? 0,
    duration: track.duration_ms ?? 0,
    ar: [{ id: track.id, name: artistName }],
    artists: [{ id: track.id, name: artistName }],
    djId: 0,
    fee: 0,
    source: "local",
    localPath: track.path,
    localFileName: track.file_name,
    localFileSize: track.size,
    localExtension: track.extension,
  };
}
