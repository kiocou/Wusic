import { AppleTheme } from "@/pages/player/AppleTheme";
import { DynamicMeshBackground } from "@/pages/player/DynamicMeshBackground";
import { PlaybackControls } from "@/pages/player/PlaybackControls";
import { VinylTheme } from "@/pages/player/VinylTheme";
import { usePlaybackThemeStore } from "@/store/themeStore";
import { playbackThemeVariants, themeMorphSpring } from "@/styles/animations";
import { AnimatePresence, motion } from "framer-motion";

export default function PlayerPage() {
  const currentTheme = usePlaybackThemeStore((s) => s.currentTheme);
  const transitionDirection = usePlaybackThemeStore(
    (s) => s.transitionDirection,
  );
  const completeThemeSwitch = usePlaybackThemeStore(
    (s) => s.completeThemeSwitch,
  );

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#090909] text-white">
      <DynamicMeshBackground />

      <AnimatePresence mode="popLayout" custom={transitionDirection}>
        <motion.div
          key={currentTheme}
          custom={transitionDirection}
          variants={playbackThemeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={themeMorphSpring}
          onAnimationComplete={completeThemeSwitch}
          className="relative z-10 h-full w-full transform-gpu will-change-transform"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {currentTheme === "apple" ? <AppleTheme /> : <VinylTheme />}
        </motion.div>
      </AnimatePresence>

      <PlaybackControls />
    </div>
  );
}
