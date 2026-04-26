/**
 * 本地音乐页面组件
 * 提供本地音乐文件的扫描、展示和播放功能
 * 支持安全的目录选择和扫描结果处理
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise24Regular,
  Folder24Regular,
  MusicNote224Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { YeeButton } from "@/components/yee-button";
import { formatDuration, formatFileSize } from "@/lib/utils";
import {
  chooseLocalMusicDirectory,
  localTrackToSong,
  scanLocalMusicDir,
} from "@/lib/services/localMusic";
import { LocalTrack } from "@/lib/types";
import { usePlayerStore } from "@/lib/store/playerStore";

const LOCAL_DIR_STORAGE_KEY = "wusic-local-music-dir";

export default function LocalPage() {
  const [directory, setDirectory] = useState(
    () => localStorage.getItem(LOCAL_DIR_STORAGE_KEY) ?? "",
  );
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const playSong = usePlayerStore((s) => s.playSong);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const songs = useMemo(() => tracks.map(localTrackToSong), [tracks]);

  const scanDirectory = useCallback(
    async (targetDirectory = directory) => {
      if (!targetDirectory) return;

      setLoading(true);
      setError("");
      try {
        const result = await scanLocalMusicDir(targetDirectory);
        // 安全检查：确保返回的数据是数组
        if (Array.isArray(result)) {
          setTracks(result);
          setDirectory(targetDirectory);
          localStorage.setItem(LOCAL_DIR_STORAGE_KEY, targetDirectory);
        } else {
          setError("扫描结果格式错误");
          setTracks([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "扫描本地音乐失败");
        setTracks([]);
      } finally {
        setLoading(false);
      }
    },
    [directory],
  );

  useEffect(() => {
    if (directory) void scanDirectory(directory);
  }, []);

  async function handleChooseDirectory() {
    try {
      const selected = await chooseLocalMusicDirectory();
      if (selected) await scanDirectory(selected);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "无法打开目录选择器");
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 px-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">本地音乐</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            扫描本地目录中的 mp3 / flac / wav / m4a / ogg 文件，支持加入播放队列。
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleChooseDirectory}>
            <Folder24Regular className="mr-2 size-4" />
            选择目录
          </Button>
          <Button
            variant="outline"
            disabled={!directory || loading}
            onClick={() => scanDirectory()}
          >
            <ArrowClockwise24Regular className="mr-2 size-4" />
            重新扫描
          </Button>
          <Button disabled={songs.length === 0} onClick={() => playQueue(songs)}>
            <Play24Filled className="mr-2 size-4" />
            播放全部
          </Button>
        </div>
      </div>

      {directory && (
        <div className="rounded-md border bg-[var(--glass-panel)] px-4 py-3 text-xs text-muted-foreground backdrop-blur-xl">
          当前目录：<span className="text-foreground/80">{directory}</span>
        </div>
      )}

      {error ? (
        <LocalState
          icon={<Folder24Regular className="size-10 opacity-40" />}
          title="扫描失败"
          desc={error}
          action={
            directory ? (
              <Button variant="outline" onClick={() => scanDirectory()}>
                重试
              </Button>
            ) : undefined
          }
        />
      ) : loading ? (
        <LocalState
          icon={<ArrowClockwise24Regular className="size-10 animate-spin opacity-40" />}
          title="正在扫描本地音乐"
          desc="首次扫描大目录可能需要一点时间。"
        />
      ) : tracks.length === 0 ? (
        <LocalState
          icon={<MusicNote224Regular className="size-10 opacity-40" />}
          title={directory ? "没有找到可播放文件" : "还没有选择本地音乐目录"}
          desc={
            directory
              ? "当前目录下没有发现支持的音频格式。"
              : "选择一个音乐目录后，Wusic 会递归扫描支持的音频文件。"
          }
          action={
            <Button variant="outline" onClick={handleChooseDirectory}>
              选择目录
            </Button>
          }
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-[var(--glass-panel)] backdrop-blur-xl">
          <div className="grid grid-cols-[48px_minmax(0,1fr)_120px_96px] border-b px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>#</span>
            <span>歌曲</span>
            <span>格式</span>
            <span className="text-right">大小</span>
          </div>
          <div className="h-full overflow-y-auto pb-14">
            {tracks.map((track, index) => {
              const song = songs[index];
              return (
                <div
                  key={track.path}
                  role="button"
                  tabIndex={0}
                  className="group grid w-full grid-cols-[48px_minmax(0,1fr)_120px_96px] items-center px-4 py-3 text-left text-sm transition-colors hover:bg-foreground/6"
                  onDoubleClick={() => playSong(song)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") playSong(song);
                  }}
                >
                  <span className="text-muted-foreground">{index + 1}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-foreground/5 text-muted-foreground">
                      <MusicNote224Regular className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {track.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {track.artist || track.file_name}
                      </span>
                    </span>
                    <YeeButton
                      variant="ghost"
                      className="ml-auto opacity-0 group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        playSong(song);
                      }}
                      icon={<Play24Filled className="size-4" />}
                      aria-label={`播放 ${track.title}`}
                      title="播放"
                    />
                  </span>
                  <span className="text-xs uppercase text-muted-foreground">
                    {track.extension || "audio"}
                    {track.duration_ms
                      ? ` · ${formatDuration(track.duration_ms / 1000)}`
                      : ""}
                  </span>
                  <span className="text-right text-xs text-muted-foreground">
                    {formatFileSize(track.size)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LocalState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-96 flex-1 flex-col items-center justify-center gap-3 rounded-md border bg-[var(--glass-panel)] p-8 text-center backdrop-blur-xl">
      <div className="text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
      </div>
      {action}
    </div>
  );
}
