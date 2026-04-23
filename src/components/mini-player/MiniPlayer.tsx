import { GetThumbnail, cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useMiniModeStore } from "@/hooks/useMiniMode";
import { springApple, microSpring } from "@/styles/animations";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Play24Regular,
  Pause24Regular,
  Next24Regular,
  Previous24Regular,
  Dismiss24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";

export function MiniPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const exitMiniMode = useMiniModeStore((s) => s.exitMiniMode);

  const [isHovered, setIsHovered] = useState(false);

  const coverUrl = currentSong
    ? GetThumbnail(currentSong.al?.picUrl || currentSong.album?.picUrl || "", 200)
    : "";

  const artists =
    currentSong?.ar?.map((a) => a.name).join("、") ||
    currentSong?.artists?.map((a) => a.name).join("、") ||
    "";

  const handleExpand = async () => {
    await exitMiniMode();
  };

  return (
    <div
      className="relative h-full w-full cursor-default overflow-hidden rounded-2xl bg-black/30 backdrop-blur-3xl border border-white/10 shadow-2xl"
      data-tauri-drag-region
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 进度条背景 */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
        <motion.div
          className="h-full bg-white/60"
          style={{ width: `${progress}%` }}
          layoutId="mini-progress"
        />
      </div>

      {/* 主内容 */}
      <div className="flex h-full items-center gap-3 px-3 py-2" data-tauri-drag-region>
        {/* 封面 */}
        <motion.div
          layoutId="mini-cover"
          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-lg"
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={currentSong?.name || "Album"}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-white/40">
              ♪
            </div>
          )}

          {/* 呼吸动效 */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-white/20"
            animate={{
              borderColor: isPlaying
                ? ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]
                : "rgba(255,255,255,0.15)",
            }}
            transition={{
              duration: isPlaying ? 2.5 : 0,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* 歌曲信息 */}
        <div className="flex min-w-0 flex-1 flex-col justify-center" data-tauri-drag-region>
          <p
            className="truncate text-sm font-semibold text-white/90"
            data-tauri-drag-region
          >
            {currentSong?.name || "未播放"}
          </p>
          <p
            className="truncate text-xs text-white/50"
            data-tauri-drag-region
          >
            {artists || "选择一首歌"}
          </p>
        </div>

        {/* 控制按钮 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={microSpring}
              className="flex items-center gap-1"
              data-tauri-drag-region
            >
              {/* 上一首 */}
              <MiniControlButton
                onClick={prev}
                disabled={!currentSong}
                aria-label="上一首"
              >
                <Previous24Regular className="h-4 w-4" />
              </MiniControlButton>

              {/* 播放/暂停 */}
              <MiniControlButton
                onClick={togglePlay}
                disabled={!currentSong}
                isPrimary
                aria-label={isPlaying ? "暂停" : "播放"}
              >
                {isPlaying ? (
                  <Pause24Regular className="h-4 w-4" />
                ) : (
                  <Play24Regular className="h-4 w-4" />
                )}
              </MiniControlButton>

              {/* 下一首 */}
              <MiniControlButton
                onClick={next}
                disabled={!currentSong}
                aria-label="下一首"
              >
                <Next24Regular className="h-4 w-4" />
              </MiniControlButton>

              {/* 分隔线 */}
              <div className="mx-1 h-5 w-px bg-white/20" data-tauri-drag-region />

              {/* 退出 Mini 模式 */}
              <MiniControlButton
                onClick={handleExpand}
                aria-label="退出迷你播放器"
              >
                <ChevronRight24Regular className="h-4 w-4" />
              </MiniControlButton>

              {/* 关闭按钮 */}
              <MiniControlButton
                onClick={handleExpand}
                aria-label="关闭"
              >
                <Dismiss24Regular className="h-4 w-4" />
              </MiniControlButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Mini 控制按钮组件
function MiniControlButton({
  onClick,
  children,
  disabled = false,
  isPrimary = false,
  className,
  ...props
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  isPrimary?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={springApple}
      className={cn(
        "flex items-center justify-center rounded-full p-1.5 transition-colors",
        "text-white/70 hover:text-white",
        "disabled:pointer-events-none disabled:opacity-30",
        isPrimary && "bg-white/15 hover:bg-white/25",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
