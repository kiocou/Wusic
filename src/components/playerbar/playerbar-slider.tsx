import { usePlayerStore } from "@/lib/store/playerStore";
import { YeeSlider } from "../yee-slider";
import { formatDuration } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Vibrant } from "node-vibrant/browser";
import { useSettingStore } from "@/lib/store/settingStore";

// 颜色缓存：避免重复提取相同封面的颜色
const colorCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

export function PlayerBarSlider() {
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;
  const [coverColor, setCoverColor] = useState("");

  const theme = useSettingStore((s) => s.appearance.theme);
  const effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  useEffect(() => {
    let cancelled = false;

    if (!coverUrl) {
      setCoverColor("");
      return;
    }

    const cacheKey = `${effectiveTheme}:${coverUrl}`;

    // 检查缓存
    if (colorCache.has(cacheKey)) {
      setCoverColor(colorCache.get(cacheKey)!);
      return;
    }

    const v = new Vibrant(coverUrl);
    v.getPalette().then((palette) => {
      if (cancelled) return;
      const vibrant =
        effectiveTheme === "dark" ? palette.Vibrant?.hex : palette.DarkVibrant?.hex;
      const color = vibrant || "var(--primary)";
      setCoverColor(color);
      
      // 添加到缓存，限制缓存大小
      if (colorCache.size >= MAX_CACHE_SIZE) {
        const firstKey = colorCache.keys().next().value;
        if (firstKey) colorCache.delete(firstKey);
      }
      colorCache.set(cacheKey, color);
    }).catch(() => {
      if (cancelled) return;
      setCoverColor("var(--primary)");
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, effectiveTheme]);

  return (
    <div
      className="absolute w-full top-0"
      style={
        {
          "--dynamic-cover-color": coverColor || "var(--primary)",
        } as React.CSSProperties
      }
    >
      <YeeSlider
        value={[progress]}
        onValueChange={seek}
        max={100}
        step={0.1}
        disabled={duration <= 0}
        tooltip={`${formatDuration(currentTime)} / ${formatDuration(duration)}`}
        tooltipFormatter={(value) => {
          const safeValue = Math.min(Math.max(value, 0), 100);
          const previewTime = duration * (safeValue / 100);
          return `${formatDuration(previewTime)} / ${formatDuration(duration)}`;
        }}
        trackClassName="bg-foreground/10 rounded-none"
        rangeClassName="bg-[var(--dynamic-cover-color)] rounded-r-full rounded-l-none"
      />
    </div>
  );
}
