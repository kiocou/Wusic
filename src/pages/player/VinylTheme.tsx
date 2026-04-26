import { usePlayerStore } from "@/lib/store/playerStore";
import { GetThumbnail } from "@/lib/utils";
import { AnimatedArtwork } from "@/pages/player/AnimatedArtwork";
import { usePlaybackThemeStore } from "@/store/themeStore";
import { PLAYER_LAYOUT_IDS, springApple, springShared } from "@/styles/animations";
import { motion } from "framer-motion";

export function VinylTheme() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setTheme = usePlaybackThemeStore((s) => s.setTheme);
  const isThemeSwitching = usePlaybackThemeStore((s) => s.isThemeSwitching);

  const rawCoverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl || "";
  const coverUrl = rawCoverUrl ? GetThumbnail(rawCoverUrl, 700) : "";
  const artists =
    currentSong?.ar?.map((artist) => artist.name).join("、") ||
    currentSong?.artists?.map((artist) => artist.name).join("、") ||
    "未知艺术家";

  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden px-12 pb-36 pt-10 text-white">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div className="absolute left-12 top-12 max-w-[32rem]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.55em] text-amber-100/45">
          Classic Turntable
        </p>
        <motion.h1
          layoutId={PLAYER_LAYOUT_IDS.title}
          transition={springShared}
          className="line-clamp-2 text-5xl font-black tracking-[-0.07em] text-amber-50 drop-shadow-2xl max-xl:text-4xl transform-gpu will-change-transform"
        >
          {currentSong?.name || "等待唱片落盘"}
        </motion.h1>
        <motion.p
          layoutId={PLAYER_LAYOUT_IDS.artist}
          transition={springShared}
          className="mt-4 line-clamp-1 text-lg text-amber-100/58 transform-gpu will-change-transform"
        >
          {artists}
        </motion.p>
      </div>

      <motion.button
        type="button"
        aria-label="切换到 Apple Music 播放界面"
        title="切换到 Apple Music 播放界面"
        disabled={isThemeSwitching}
        onClick={() => setTheme("apple")}
        whileHover={
          isThemeSwitching
            ? undefined
            : {
                scale: 1.01,
                rotateZ: 0.15,
              }
        }
        whileTap={isThemeSwitching ? undefined : { scale: 0.985 }}
        transition={springApple}
        className="group relative mt-16 aspect-square w-[min(62vh,38rem)] cursor-pointer border-0 bg-transparent p-0 text-left transform-gpu will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100/55 disabled:pointer-events-none disabled:opacity-80"
      >
        <div className="absolute inset-[-7%] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.20),transparent_62%)] blur-3xl" />

        <div
          className="absolute inset-0 transform-gpu overflow-hidden rounded-full border border-white/12 bg-zinc-950 shadow-[0_48px_130px_rgba(0,0,0,0.72)] will-change-transform"
          style={{
            animation: "spin 20s linear infinite",
            animationPlayState: isPlaying && !isThemeSwitching ? "running" : "paused",
          }}
        >
          <div className="absolute inset-[4%] rounded-full border border-white/8 bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.13)_0_1px,transparent_1px_9px)] opacity-55" />
          <div className="absolute inset-[15%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_58%)]" />

          <div className="absolute left-1/2 top-1/2 aspect-square w-[48%] -translate-x-1/2 -translate-y-1/2 transform-gpu will-change-transform">
            <AnimatedArtwork
              src={coverUrl}
              alt={`${currentSong?.name || "Album"} cover`}
              layoutId={PLAYER_LAYOUT_IDS.artworkVinyl}
              className="h-full w-full rounded-full border-[10px] border-zinc-950 bg-stone-900 shadow-inner"
            />
          </div>

          <div className="absolute left-1/2 top-1/2 size-[8%] -translate-x-1/2 -translate-y-1/2 transform-gpu rounded-full border border-white/20 bg-zinc-950 shadow-[inset_0_0_18px_rgba(255,255,255,0.2)] will-change-transform" />
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.18)_18%,transparent_38%,transparent_58%,rgba(255,255,255,0.12)_72%,transparent_100%)] mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_70%_75%,rgba(255,255,255,0.10),transparent_30%)]" />
        </div>

        <div className="absolute -right-20 -top-24 h-80 w-64">
          <motion.div
            initial={false}
            animate={{ rotate: isPlaying ? 35 : 0 }}
            transition={springApple}
            className="origin-top-left transform-gpu will-change-transform"
          >
            <div className="relative h-72 w-10">
              <div className="absolute left-1 top-1 size-12 rounded-full border border-white/20 bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(120,113,108,0.35)_38%,rgba(15,15,15,0.92)_70%)] shadow-2xl" />
              <div className="absolute left-6 top-8 h-56 w-3 rounded-full bg-gradient-to-b from-stone-100 via-stone-400 to-stone-900 shadow-[0_20px_60px_rgba(0,0,0,0.65)]" />
              <div className="absolute left-1 top-[15.6rem] h-11 w-14 rotate-[24deg] rounded-sm bg-gradient-to-br from-stone-200 to-stone-700 shadow-xl" />
              <div className="absolute left-0 top-[18rem] h-10 w-1 rotate-[24deg] rounded-full bg-amber-200" />
            </div>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-[calc(100%+1.25rem)] -translate-x-1/2 translate-y-2 rounded-full border border-amber-100/10 bg-black/25 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-amber-50/0 opacity-0 backdrop-blur-3xl transition-all duration-300 group-hover:translate-y-0 group-hover:text-amber-50/75 group-hover:opacity-100">
          Apple View
        </div>
      </motion.button>

      <div className="absolute bottom-10 right-12 rounded-full border border-amber-100/10 bg-black/20 px-5 py-2 text-xs uppercase tracking-[0.45em] text-amber-100/45 backdrop-blur-xl">
        20s / Rotation
      </div>
    </section>
  );
}
