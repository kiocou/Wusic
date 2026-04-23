import { LyricSheetSongLyric } from "@/components/lyric-sheet/lyric-sheet-songlyric";
import { usePlayerStore } from "@/lib/store/playerStore";
import { GetThumbnail, cn } from "@/lib/utils";
import { AnimatedArtwork } from "@/pages/player/AnimatedArtwork";
import { usePlaybackThemeStore } from "@/store/themeStore";
import {
  PLAYER_LAYOUT_IDS,
  springApple,
  smoothLinear,
  springShared,
} from "@/styles/animations";
import { motion } from "framer-motion";

export function AppleTheme() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setTheme = usePlaybackThemeStore((s) => s.setTheme);
  const isThemeSwitching = usePlaybackThemeStore((s) => s.isThemeSwitching);

  const rawCoverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl || "";
  const coverUrl = rawCoverUrl ? GetThumbnail(rawCoverUrl, 900) : "";
  const artists =
    currentSong?.ar?.map((artist) => artist.name).join("、") ||
    currentSong?.artists?.map((artist) => artist.name).join("、") ||
    "未知艺术家";

  return (
    <section className="relative flex h-full w-full items-center gap-12 px-12 pb-36 pt-10 text-white max-lg:flex-col max-lg:justify-center max-lg:gap-8 max-lg:px-8">
      <div className="flex h-full w-1/2 min-w-0 flex-col justify-center max-lg:h-auto max-lg:w-full max-lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smoothLinear}
          className="mb-8 max-w-[34rem] transform-gpu will-change-transform max-lg:text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.45em] text-white/45">
            Now Playing
          </p>
          <motion.h1
            layoutId={PLAYER_LAYOUT_IDS.title}
            transition={springShared}
            className="line-clamp-2 text-5xl font-semibold tracking-[-0.06em] text-white drop-shadow-2xl max-xl:text-4xl transform-gpu will-change-transform"
          >
            {currentSong?.name || "选择一首歌开始播放"}
          </motion.h1>
          <motion.p
            layoutId={PLAYER_LAYOUT_IDS.artist}
            transition={springShared}
            className="mt-4 line-clamp-1 text-lg text-white/58 transform-gpu will-change-transform"
          >
            {artists}
          </motion.p>
        </motion.div>

        <motion.button
          type="button"
          aria-label="切换到黑胶唱片播放界面"
          title="切换到黑胶唱片播放界面"
          disabled={isThemeSwitching}
          onClick={() => setTheme("vinyl")}
          initial={false}
          whileHover={
            isThemeSwitching
              ? undefined
              : {
                  scale: isPlaying ? 1.025 : 0.872,
                  rotateZ: -0.35,
                }
          }
          whileTap={isThemeSwitching ? undefined : { scale: 0.94 }}
          animate={{
            scale: isPlaying ? 1 : 0.85,
            boxShadow: isPlaying
              ? "0 36px 110px rgba(0,0,0,0.52), 0 0 140px rgba(255,255,255,0.18)"
              : "0 18px 42px rgba(0,0,0,0.24), 0 0 0 rgba(255,255,255,0)",
          }}
          transition={springApple}
          className={cn(
            "relative aspect-square w-full max-w-[min(38vw,34rem)] rounded-[2.25rem] border-0 bg-transparent p-0 text-left cursor-pointer",
            "group transform-gpu will-change-transform max-lg:max-w-[22rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 disabled:pointer-events-none disabled:opacity-80",
          )}
        >
          <AnimatedArtwork
            src={coverUrl}
            alt={`${currentSong?.name || "Album"} cover`}
            layoutId={PLAYER_LAYOUT_IDS.artwork}
            className="h-full w-full rounded-[2.25rem] border border-white/15"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-white/22 via-transparent to-black/30" />
          <div className="pointer-events-none absolute inset-x-8 bottom-8 translate-y-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.32em] text-white/0 opacity-0 backdrop-blur-3xl transition-all duration-300 group-hover:translate-y-0 group-hover:text-white/75 group-hover:opacity-100">
            Vinyl View
          </div>
        </motion.button>
      </div>

      <div className="relative flex h-full w-1/2 min-w-0 items-center max-lg:h-[32rem] max-lg:w-full">
        <LyricScrollEngine />
      </div>
    </section>
  );
}

function LyricScrollEngine() {
  const currentSong = usePlayerStore((s) => s.currentSong);

  if (!currentSong) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={smoothLinear}
        className="flex h-full w-full transform-gpu items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center text-2xl font-semibold tracking-[-0.04em] text-white/45 will-change-transform"
      >
        歌词会在播放后浮现
      </motion.div>
    );
  }

  return (
    <div className="h-full w-full rounded-[2rem] border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur-3xl">
      <LyricSheetSongLyric className="h-full w-full" />
    </div>
  );
}
