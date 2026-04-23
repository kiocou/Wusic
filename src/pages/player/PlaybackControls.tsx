import { MusicLevelPopover } from "@/components/music-level-popover";
import { PlaylistSheet } from "@/components/playerbar/playlist-sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useMicroInteraction } from "@/hooks/use-micro-interaction";
import { useSongLogic } from "@/hooks/use-song-logic";
import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { cn, formatDuration } from "@/lib/utils";
import { PLAYER_LAYOUT_IDS, springApple, springShared } from "@/styles/animations";
import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal20Regular,
  Next24Filled,
  Pause24Filled,
  Play24Filled,
  Previous24Filled,
  SoundSource20Regular,
  Speaker116Regular,
  Speaker216Regular,
  SpeakerMute16Regular,
  TextBulletList20Regular,
} from "@fluentui/react-icons";
import { motion, type HTMLMotionProps } from "framer-motion";
import {
  forwardRef,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

const PANEL_CLASS =
  "absolute bottom-8 left-1/2 z-40 w-[min(56rem,calc(100%-3rem))] -translate-x-1/2 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.52)] backdrop-blur-2xl backdrop-saturate-150";

const POPUP_SURFACE_CLASS =
  "border-white/10 bg-white/5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.52)] backdrop-blur-2xl backdrop-saturate-150";

export function PlaybackControls() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoadingMusic = usePlayerStore((s) => s.isLoadingMusic);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const progress = usePlayerStore((s) => s.progress);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const prev = usePlayerStore((s) => s.prev);
  const next = usePlayerStore((s) => s.next);
  const seek = usePlayerStore((s) => s.seek);
  const toggleRepeatMode = usePlayerStore((s) => s.toggleRepeatMode);
  const toggleShuffleMode = usePlayerStore((s) => s.toggleShuffleMode);

  const canControl = Boolean(currentSong);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springApple}
      className={PANEL_CLASS}
    >
      <ProgressScrubber
        canControl={canControl}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        seek={seek}
      />

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <ModeControls
          canControl={canControl}
          currentSong={currentSong}
          isFmMode={isFmMode}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          toggleRepeatMode={toggleRepeatMode}
          toggleShuffleMode={toggleShuffleMode}
        />

        <TransportControls
          canControl={canControl}
          isLoadingMusic={isLoadingMusic}
          isPlaying={isPlaying}
          next={next}
          prev={prev}
          togglePlay={togglePlay}
        />

        <UtilityControls canControl={canControl} isFmMode={isFmMode} />
      </div>
    </motion.div>
  );
}

function ProgressScrubber({
  canControl,
  currentTime,
  duration,
  progress,
  seek,
}: {
  canControl: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  seek: (percentage: number) => void;
}) {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draftProgress, setDraftProgress] = useState(safeProgress);

  useEffect(() => {
    if (!isDragging) setDraftProgress(safeProgress);
  }, [isDragging, safeProgress]);

  const handleSeekInput = (event: FormEvent<HTMLInputElement>) => {
    setDraftProgress(Number(event.currentTarget.value));
  };

  const commitSeek = (value = draftProgress) => {
    seek(value);
    setIsDragging(false);
  };

  const visualProgress = isDragging ? draftProgress : safeProgress;
  const visualTime = duration * (visualProgress / 100);
  const isExpanded = isHovering || isDragging;

  return (
    <div className="mb-4 grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-3 text-[0.7rem] font-semibold tabular-nums tracking-[0.18em] text-white/50">
      <motion.span
        animate={{ opacity: isDragging ? 1 : 0.55, y: isDragging ? -1 : 0 }}
        transition={springShared}
        className="transform-gpu will-change-transform"
      >
        {formatDuration(isDragging ? visualTime : currentTime)}
      </motion.span>
      <motion.div
        animate={{ height: isExpanded ? 14 : 6 }}
        transition={springShared}
        className="relative flex items-center rounded-full"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={visualProgress}
          disabled={!canControl}
          aria-label="播放进度"
          data-allow-pointer
          onInput={handleSeekInput}
          onChange={(event) => commitSeek(Number(event.currentTarget.value))}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => commitSeek()}
          onBlur={() => {
            if (isDragging) commitSeek();
          }}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-full bg-white/16 accent-white disabled:cursor-not-allowed disabled:opacity-40 transition-[height] duration-300",
            isExpanded ? "h-2.5" : "h-1.5",
            "[&::-webkit-slider-runnable-track]:rounded-full",
            isExpanded
              ? "[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:scale-100 [&::-webkit-slider-thumb]:mt-[-3px]"
              : "[&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:scale-75 [&::-webkit-slider-thumb]:mt-[-5px]",
            "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_24px_rgba(255,255,255,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:border-none [&::-webkit-slider-thumb]:outline-none",
          )}
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0.95) ${visualProgress}%, rgba(255,255,255,0.16) ${visualProgress}%)`,
          }}
        />
      </motion.div>
      <span className="text-right">{formatDuration(duration)}</span>
    </div>
  );
}

function ModeControls({
  canControl,
  currentSong,
  isFmMode,
  isShuffle,
  repeatMode,
  toggleRepeatMode,
  toggleShuffleMode,
}: {
  canControl: boolean;
  currentSong: ReturnType<typeof usePlayerStore.getState>["currentSong"];
  isFmMode: boolean;
  isShuffle: boolean;
  repeatMode: ReturnType<typeof usePlayerStore.getState>["repeatMode"];
  toggleRepeatMode: () => void;
  toggleShuffleMode: () => void;
}) {
  const { checkIsLiked, handleLike } = useSongLogic();
  const isLiked = checkIsLiked("song", currentSong);
  const LikeIcon = isLiked ? Heart24Filled : Heart24Regular;
  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const RepeatIcon = repeatModeConfig.icon;
  const shuffleConfig = SHUFFLE_CONFIG[isShuffle ? "on" : "off"];
  const ShuffleIcon = shuffleConfig.icon;

  return (
    <div className="flex min-w-0 items-center justify-start gap-2">
      <ControlButton
        ariaLabel={shuffleConfig.desc}
        disabled={!canControl || !repeatModeConfig.canShuffle || isFmMode}
        onClick={toggleShuffleMode}
        active={isShuffle}
      >
        <ShuffleIcon className="size-5" />
      </ControlButton>

      <ControlButton
        ariaLabel={isLiked ? "取消收藏" : "收藏音乐"}
        disabled={!canControl}
        onClick={() => handleLike("song", currentSong)}
        active={isLiked}
        className={isLiked ? "text-red-400" : undefined}
      >
        <LikeIcon className="size-5" />
      </ControlButton>

      <ControlButton
        ariaLabel={repeatModeConfig.desc}
        disabled={!canControl}
        onClick={toggleRepeatMode}
        active={repeatMode !== "order"}
      >
        <RepeatIcon className="size-5" />
      </ControlButton>
    </div>
  );
}

function TransportControls({
  canControl,
  isLoadingMusic,
  isPlaying,
  next,
  prev,
  togglePlay,
}: {
  canControl: boolean;
  isLoadingMusic: boolean;
  isPlaying: boolean;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
}) {
  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;

  return (
    <div className="flex items-center justify-center gap-4">
      <ControlButton ariaLabel="上一首" disabled={!canControl} onClick={prev}>
        <Previous24Filled className="size-6" />
      </ControlButton>

      <ControlButton
        ariaLabel={isPlaying ? "暂停" : "播放"}
        disabled={!canControl || isLoadingMusic}
        onClick={togglePlay}
        layoutId={PLAYER_LAYOUT_IDS.playToggle}
        size="primary"
      >
        {isLoadingMusic ? (
          <Spinner className="size-6" />
        ) : (
          <PlayIcon className="size-8" />
        )}
      </ControlButton>

      <ControlButton ariaLabel="下一首" disabled={!canControl} onClick={next}>
        <Next24Filled className="size-6" />
      </ControlButton>
    </div>
  );
}

function UtilityControls({
  canControl,
  isFmMode,
}: {
  canControl: boolean;
  isFmMode: boolean;
}) {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playlistPortal =
    typeof document === "undefined" ? null : document.body;

  function handleMoreClick(event: MouseEvent<HTMLButtonElement>) {
    openMenu(event.clientX, event.clientY - 12, "song", currentSong);
  }

  return (
    <div className="flex min-w-0 items-center justify-end gap-2">
      <MusicLevelPopover
        side="top"
        sideOffset={16}
        contentClassName={POPUP_SURFACE_CLASS}
      >
        <ControlButton ariaLabel="切换音质" disabled={!canControl}>
          <SoundSource20Regular className="size-5" />
        </ControlButton>
      </MusicLevelPopover>

      <VolumePopover disabled={!canControl} />

      {!isFmMode && (
        <PlaylistSheet
          side="right"
          container={playlistPortal}
          contentClassName="!right-8 !top-24 !bottom-28 !h-auto !w-[min(30rem,calc(100vw-3rem))] !transform-gpu !rounded-[2rem] !border !border-white/10 !bg-black/65 !text-white !shadow-[0_28px_90px_rgba(0,0,0,0.58)] !backdrop-blur-2xl !will-change-transform"
        >
          <ControlButton ariaLabel="播放列表" disabled={!canControl}>
            <TextBulletList20Regular className="size-5" />
          </ControlButton>
        </PlaylistSheet>
      )}

      <ControlButton
        ariaLabel="更多操作"
        disabled={!canControl}
        onClick={handleMoreClick}
      >
        <MoreHorizontal20Regular className="size-5" />
      </ControlButton>
    </div>
  );
}

function VolumePopover({ disabled }: { disabled: boolean }) {
  const volume = usePlayerStore((s) => s.volume);
  const updateVolume = usePlayerStore((s) => s.updateVolume);
  const [isHovering, setIsHovering] = useState(false);
  const volumeProgress = Math.round(volume * 100);

  const VolumeIcon =
    volume === 0
      ? SpeakerMute16Regular
      : volume < 0.5
        ? Speaker116Regular
        : Speaker216Regular;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ControlButton ariaLabel="调节音量" disabled={disabled}>
          <VolumeIcon className="size-5" />
        </ControlButton>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={16}
        className={cn("w-64 p-4", POPUP_SURFACE_CLASS)}
      >
        <div className="flex items-center gap-3 text-white">
          <VolumeIcon className="size-5 shrink-0 text-white/75" />
          <motion.div
            animate={{ height: isHovering ? 14 : 6 }}
            transition={springShared}
            className="relative flex flex-1 items-center rounded-full"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volumeProgress}
              aria-label="音量"
              data-allow-pointer
              onInput={(event) =>
                updateVolume(Number(event.currentTarget.value) / 100)
              }
              onChange={(event) =>
                updateVolume(Number(event.currentTarget.value) / 100)
              }
              className={cn(
                "w-full cursor-pointer appearance-none rounded-full bg-white/16 accent-white transition-[height] duration-300",
                isHovering ? "h-2.5" : "h-1.5",
                "[&::-webkit-slider-runnable-track]:rounded-full",
                isHovering
                  ? "[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:scale-100 [&::-webkit-slider-thumb]:mt-[-3px]"
                  : "[&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:scale-75 [&::-webkit-slider-thumb]:mt-[-5px]",
                "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_24px_rgba(255,255,255,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:border-none [&::-webkit-slider-thumb]:outline-none",
              )}
              style={{
                background: `linear-gradient(90deg, rgba(255,255,255,0.95) ${volumeProgress}%, rgba(255,255,255,0.16) ${volumeProgress}%)`,
              }}
            />
          </motion.div>
          <span className="w-8 text-right text-xs font-semibold tabular-nums text-white/60">
            {volumeProgress}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ControlButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  ariaLabel: string;
  children: ReactNode;
  active?: boolean;
  size?: "default" | "primary";
}

const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  function ControlButton(
    { ariaLabel, children, className, active, size = "default", disabled, ...props },
    ref,
  ) {
    const micro = useMicroInteraction(Boolean(disabled));

    return (
      <motion.button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        {...micro}
        transition={springShared}
        className={cn(
          "flex transform-gpu items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-xl shadow-black/20 transition duration-300 will-change-transform hover:-translate-y-0.5 hover:bg-white/18 disabled:pointer-events-none disabled:opacity-35",
          size === "default" && "size-10",
          size === "primary" && "size-16 bg-white text-black hover:bg-white/90",
          active && "border-white/35 bg-white text-black hover:bg-white/90",
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
