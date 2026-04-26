import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal20Regular,
  Next24Filled,
  Pause24Filled,
  Play24Filled,
  Previous24Filled,
  SlideSize24Regular,
} from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";
import { GetThumbnail, cn } from "@/lib/utils";

import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { Spinner } from "@/components/ui/spinner";
import { PlaylistSheet } from "./playlist-sheet";
import { MusicLevelPopover } from "../music-level-popover";
import { LyricSheet } from "../lyric-sheet/lyric-sheet";
import { Link } from "react-router-dom";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import {
  sfBrandItunesNote,
  sfHeartSlashFill,
  sfInfinity,
  sfRepeat1,
} from "@bradleyhodges/sfsymbols";
import { YeeButton } from "../yee-button";
import { PlayerBarVolumePopover } from "./player-bar-volume-popover";
import { PlayerBarSlider } from "./playerbar-slider";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { useSongLogic } from "@/hooks/use-song-logic";
import { AnimatedArtwork } from "@/pages/player/AnimatedArtwork";
import { PLAYER_LAYOUT_IDS, springShared } from "@/styles/animations";
import { motion } from "framer-motion";

export function PlayerBar() {
  return (
    <div
      className="w-full h-20 grid grid-cols-3 relative border-t transition-[background,border-color,box-shadow,backdrop-filter] duration-300"
      style={{
        background: "var(--playerbar-bg)",
        borderTopColor: "var(--playerbar-border)",
        boxShadow: "var(--playerbar-shadow)",
        backdropFilter: "var(--playerbar-blur)",
        WebkitBackdropFilter: "var(--playerbar-blur)",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <LeftButtonRegion />

      <CenterButtonRegion />

      <RightButtonRegion />

      <PlayerBarSlider />
    </div>
  );
}

function LeftButtonRegion() {
  const { checkIsLiked, handleLike } = useSongLogic();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const currentArtists = currentSong?.ar ?? currentSong?.artists ?? [];

  const isLike = checkIsLiked("song", currentSong);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;

  return (
    <div className="gap-4 min-w-0 flex items-center pl-4 overflow-hidden">
      {currentSong ? (
        <>
          <LyricSheet>
            <motion.div
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={springShared}
              className="shrink-0 relative group cursor-pointer transform-gpu will-change-transform"
            >
              <AnimatedArtwork
                src={GetThumbnail(
                  currentSong.al?.picUrl || currentSong.album?.picUrl || "",
                )}
                alt="Album cover"
                layoutId={PLAYER_LAYOUT_IDS.artwork}
                className="w-12 h-12 rounded-sm border shadow-sm"
                imageClassName="group-hover:brightness-50 transition-all duration-300 ease-in-out"
              />
              <SlideSize24Regular className="opacity-0 group-hover:opacity-100 size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white  transform transition-all duration-300 ease-in-out" />
            </motion.div>
          </LyricSheet>

          <div className="min-w-0">
            <motion.span
              layoutId={PLAYER_LAYOUT_IDS.title}
              transition={springShared}
              className="text-sm line-clamp-1 font-semibold transform-gpu will-change-transform"
            >
              {currentSong?.name || ""}
            </motion.span>

            <motion.div
              layoutId={PLAYER_LAYOUT_IDS.artist}
              transition={springShared}
              className="line-clamp-1 transform-gpu will-change-transform"
            >
              {currentArtists.map((ar, idx) => (
                <Link
                  to={`/detail/artist?id=${ar.id}`}
                  key={`${ar.id}-${idx}`}
                  className="text-sm text-foreground/60 hover:text-foreground/80"
                >
                  {ar.name}
                  {idx < currentArtists.length - 1 && "、"}
                </Link>
              ))}
            </motion.div>
          </div>

          <div>
            <YeeButton
              variant="ghost"
              onClick={() => handleLike("song", currentSong)}
              icon={
                <LikeIcon className={cn("size-4", isLike && "text-red-500")} />
              }
            />
          </div>
        </>
      ) : (
        <div className="w-12 h-12 rounded-sm overflow-hidden border shadow-sm flex justify-center items-center">
          <SFIcon icon={sfBrandItunesNote} className="size-5 text-foreground/40" />
        </div>
      )}
    </div>
  );
}

function CenterButtonRegion() {
  const { togglePlay, next, prev, toggleShuffleMode, toggleRepeatMode } =
    usePlayerStore();

  const isLoadingMusic = usePlayerStore((s) => s.isLoadingMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playlistLength = usePlayerStore((s) => s.playlist.length);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const fmRepeatMode = usePlayerStore((s) => s.fmRepeatMode);
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);
  const toggleFmRepeatMode = usePlayerStore((s) => s.toggleFmRepeatMode);

  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;
  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const shuffleConfig = SHUFFLE_CONFIG[isShuffle ? "on" : "off"];

  const canShuffle = repeatModeConfig.canShuffle && playlistLength > 1;
  const canUsePlaybackControls = Boolean(currentSong);

  return (
    <div className=" flex items-center justify-center gap-4 shrink-0">
      <YeeButton
        variant="ghost"
        disabled={!canShuffle || isFmMode}
        onClick={toggleShuffleMode}
        icon={<shuffleConfig.icon className="size-4" />}
        aria-label={isShuffle ? "关闭随机播放" : "开启随机播放"}
        title={isShuffle ? "关闭随机播放" : "开启随机播放"}
      />

      {isFmMode ? (
        <YeeButton
          variant="ghost"
          onClick={trashFmSong}
          disabled={!canUsePlaybackControls}
          icon={<SFIcon icon={sfHeartSlashFill} className="size-5" />}
          aria-label="不喜欢这首私人漫游"
          title="不喜欢"
        />
      ) : (
          <YeeButton
            variant="ghost"
            onClick={prev}
            disabled={!canUsePlaybackControls}
            icon={<Previous24Filled className="size-5" />}
          aria-label="上一首"
          title="上一首"
        />
      )}

      {isLoadingMusic ? (
        <div className="w-12 h-12 flex items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : (
        <motion.div
          layoutId={PLAYER_LAYOUT_IDS.playToggle}
          transition={springShared}
          className="transform-gpu will-change-transform"
        >
          <YeeButton
            variant="ghost"
            onClick={() => togglePlay()}
            disabled={!canUsePlaybackControls}
            icon={<PlayIcon className="size-5" />}
            aria-label={isPlaying ? "暂停" : "播放"}
            title={isPlaying ? "暂停" : "播放"}
          />
        </motion.div>
      )}

      <YeeButton
        variant="ghost"
        onClick={next}
        disabled={!canUsePlaybackControls}
        icon={<Next24Filled className="size-5" />}
        aria-label="下一首"
        title="下一首"
      />

      {isFmMode ? (
        <YeeButton
          variant="ghost"
          onClick={toggleFmRepeatMode}
          icon={
            <SFIcon
              icon={fmRepeatMode ? sfRepeat1 : sfInfinity}
              className="size-4 text-foreground/80"
            />
          }
          aria-label={fmRepeatMode ? "关闭私人漫游单曲循环" : "开启私人漫游单曲循环"}
          title={fmRepeatMode ? "关闭单曲循环" : "开启单曲循环"}
        />
      ) : (
        <YeeButton
          variant="ghost"
          onClick={toggleRepeatMode}
          disabled={!canUsePlaybackControls}
          icon={<repeatModeConfig.icon className="size-4" />}
          aria-label={`切换循环模式：${repeatModeConfig.desc}`}
          title={repeatModeConfig.desc}
        />
      )}
    </div>
  );
}

function RightButtonRegion() {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const currentSong = usePlayerStore((s) => s.currentSong);

  const isFmMode = usePlayerStore((s) => s.isFmMode);

  return (
    <div className="flex items-center justify-end gap-4 shrink-0 pr-4">
      <MusicLevelPopover />

      {!isFmMode && <PlaylistSheet />}

      <PlayerBarVolumePopover />

      <YeeButton
        variant="ghost"
        disabled={!currentSong}
        onClick={(e) => {
          if (!currentSong) return;
          e.preventDefault();
          openMenu(e.clientX, e.clientY, "song", currentSong);
        }}
        icon={<MoreHorizontal20Regular className="size-5" />}
        aria-label="更多操作"
        title="更多"
      />
    </div>
  );
}
