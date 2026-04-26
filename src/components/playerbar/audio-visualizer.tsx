/**
 * 音频可视化组件
 * 提供基于Canvas的音频波形可视化效果
 * 支持安全的渲染和错误处理
 */
import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useSettingStore } from "@/lib/store/settingStore";
import { cn } from "@/lib/utils";

export function AudioVisualizer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playbackRef = useRef({ isPlaying: false, currentTime: 0, volume: 0.7 });
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const volume = usePlayerStore((s) => s.volume);
  const enabled = useSettingStore((s) => s.appearance.performance.audioVisualizer);
  const fluidBackground = useSettingStore(
    (s) => s.appearance.performance.fluidBackground,
  );

  useEffect(() => {
    playbackRef.current = { isPlaying, currentTime, volume };
  }, [currentTime, isPlaying, volume]);

  useEffect(() => {
    if (!enabled || !fluidBackground) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frameId = 0;
    const dpr = window.devicePixelRatio || 1;
    
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      // 安全检查：确保画布尺寸有效
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      
      canvas.width = width;
      canvas.height = height;
      context.scale(dpr, dpr);
      
      return rect;
    };

    let rect = updateCanvasSize();

    const render = (time: number) => {
      try {
        // 安全检查：确保画布仍然有效
        if (!canvas || !context) {
          cancelAnimationFrame(frameId);
          return;
        }

        // 重新计算尺寸，以适应窗口变化
        rect = updateCanvasSize();
        
        const width = rect.width;
        const height = rect.height;
        const barCount = 22;
        const gap = 2;
        const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);
        const { isPlaying, currentTime, volume } = playbackRef.current;
        const activity = isPlaying ? Math.max(0.18, volume) : 0.08;

        context.clearRect(0, 0, width, height);

        for (let i = 0; i < barCount; i++) {
          const wave =
            Math.sin(time * 0.004 + currentTime * 0.9 + i * 0.72) * 0.5 + 0.5;
          const secondary = Math.cos(time * 0.002 + i * 1.37) * 0.5 + 0.5;
          const normalized = isPlaying ? wave * 0.72 + secondary * 0.28 : 0.22;
          const barHeight = Math.max(4, normalized * height * activity);
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          context.fillStyle = `rgba(255,255,255,${isPlaying ? 0.72 : 0.28})`;
          roundRect(context, x, y, barWidth, barHeight, barWidth / 2);
          context.fill();
        }

        frameId = requestAnimationFrame(render);
      } catch (error) {
        console.error("音频可视化渲染错误:", error);
        cancelAnimationFrame(frameId);
      }
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [enabled, fluidBackground]);

  if (!enabled || !fluidBackground) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-8 w-20 opacity-70 mix-blend-plus-lighter", className)}
      aria-hidden="true"
    />
  );
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
