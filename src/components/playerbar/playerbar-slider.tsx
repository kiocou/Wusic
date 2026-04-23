import { usePlayerStore } from "@/lib/store/playerStore";
import { YeeSlider } from "../yee-slider";
import { formatDuration } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { Vibrant } from "node-vibrant/browser";
import { useSettingStore } from "@/lib/store/settingStore";

// 颜色缓存：避免重复提取相同封面的颜色
const colorCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

export function PlayerBarSlider() {
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const currentTime = usePlayerStore((s) => s.currentTime);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;
  const [coverColor, setCoverColor] = useState("");
  
  // 使用 ref 追踪上一次的颜色提取，避免重复
  const lastCoverUrlRef = useRef<string | null>(null);

  const theme = useSettingStore((s) => s.appearance.theme);

  useEffect(() => {
    if (!coverUrl) return;
    
    // 如果封面 URL 没变，跳过提取
    if (coverUrl === lastCoverUrlRef.current) return;
    lastCoverUrlRef.current = coverUrl;

    // 检查缓存
    if (colorCache.has(coverUrl)) {
      setCoverColor(colorCache.get(coverUrl)!);
      return;
    }

    const v = new Vibrant(coverUrl);
    v.getPalette().then((palette) => {
      const vibrant =
        theme === "dark" ? palette.Vibrant?.hex : palette.DarkVibrant?.hex;
      const color = vibrant || "rgba(0, 0, 0, 0)";
      setCoverColor(color);
      
      // 添加到缓存，限制缓存大小
      if (colorCache.size >= MAX_CACHE_SIZE) {
        const firstKey = colorCache.keys().next().value;
        if (firstKey) colorCache.delete(firstKey);
      }
      colorCache.set(coverUrl, color);
    }).catch(() => {
      setCoverColor("rgba(0, 0, 0, 0)");
    });
  }, [coverUrl]);

  return (
    <div
      className="absolute w-full top-0"
      style={
        {
          "--dynamic-cover-color": coverColor || "black",
        } as React.CSSProperties
      }
    >
      <YeeSlider
        value={[progress]}
        onValueChange={seek}
        max={100}
        step={0.1}
        tooltip={formatDuration(currentTime)}
        trackClassName="bg-foreground/10 rounded-none"
        rangeClassName="bg-[var(--dynamic-cover-color)] rounded-r-full rounded-l-none"
      />
    </div>
  );
}
