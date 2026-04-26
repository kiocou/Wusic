import { usePlayerStore } from "@/lib/store/playerStore";
import { useSettingStore } from "@/lib/store/settingStore";
import { GetThumbnail } from "@/lib/utils";
import { smoothLinear } from "@/styles/animations";
import { MeshGradient } from "@paper-design/shaders-react";
import { extractColors } from "extract-colors";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_COLORS = ["#161012", "#35201d", "#7d4a3f", "#c9916a"];

export function DynamicMeshBackground() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  
  // 从设置中心获取实时配置
  const meshSettings = useSettingStore((s) => s.appearance.meshGradient);
  const perfSettings = useSettingStore((s) => s.appearance.performance);
  
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl || "";
  const coverThumb = coverUrl ? GetThumbnail(coverUrl, 800) : "";
  const [colors, setColors] = useState(FALLBACK_COLORS);

  useEffect(() => {
    let cancelled = false;

    async function pullPalette() {
      if (!coverUrl) {
        setColors(FALLBACK_COLORS);
        return;
      }

      try {
        const palette = await extractColors(coverUrl, {
          pixels: 64000,
          distance: 0.22,
          saturationDistance: 0.18,
          lightnessDistance: 0.18,
          hueDistance: 0.0833,
          colorValidator: (_r, _g, _b, alpha) => alpha > 250,
        });

        if (cancelled) return;

        const dominant = palette
          .filter((color) => color.saturation > 0.12)
          .filter((color) => color.lightness > 0.16 && color.lightness < 0.92)
          .sort((a, b) => b.area - a.area)
          .map((color) => color.hex)
          .slice(0, 4);

        setColors(
          dominant.length >= 3
            ? [dominant[0], dominant[1], dominant[2], dominant[3] || dominant[0]]
            : FALLBACK_COLORS,
        );
      } catch {
        if (!cancelled) setColors(FALLBACK_COLORS);
      }
    }

    void pullPalette();

    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  const meshColors = useMemo(
    () => (colors.length >= 4 ? colors : FALLBACK_COLORS),
    [colors],
  );

  // 如果关闭了流体背景，则只显示纯色背景以节省性能
  if (!perfSettings.fluidBackground) {
    return <div className="absolute inset-0 bg-[#090909]" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#090909]">
      <AnimatePresence mode="wait">
        {coverThumb && (
          <motion.img
            key={coverThumb}
            src={coverThumb}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 0.28, scale: 1.16 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={smoothLinear}
            className="absolute inset-[-18%] h-[136%] w-[136%] object-cover blur-[100px] saturate-150 transform-gpu will-change-transform"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: perfSettings.fluidBackgroundIntensity }}
        transition={smoothLinear}
        className="absolute inset-0 transform-gpu will-change-transform"
      >
        <MeshGradient
          colors={meshColors}
          distortion={meshSettings.distortion}
          swirl={meshSettings.swirl}
          grainMixer={meshSettings.grainMixer}
          grainOverlay={meshSettings.grainOverlay}
          speed={isPlaying ? meshSettings.speed : meshSettings.speed * 0.25}
          className="h-full w-full"
        />
      </motion.div>

      <motion.div
        aria-hidden="true"
        animate={
          isPlaying
            ? { scale: [1, 1.06, 1], opacity: [0.56, 0.72, 0.56] }
            : { scale: 1, opacity: 0.5 }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_84%_72%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(120deg,rgba(0,0,0,0.08),rgba(0,0,0,0.78)_72%)] transform-gpu will-change-transform"
      />
      <div className="absolute inset-0 bg-black/18" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] bg-[size:56px_56px] opacity-18" />
    </div>
  );
}

