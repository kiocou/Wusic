import { usePlayerStore } from "@/lib/store/playerStore";
import { cn } from "@/lib/utils";
import {
  LyricLine,
  LyricWord,
  ParseLyric,
  ParseVerbatimLyric,
} from "@/lib/utils/lyric-parser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  motion,
  MotionValue,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { smoothLinear, springShared } from "@/styles/animations";

const LYRIC_CROLL_DELAY = 0.04;
const LYRIC_FOCUS_RATIO = 0.42;

const MASK_IMAGE =
  "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)";

export function LyricSheetSongLyric({ className }: { className?: string }) {
  const [showTrans, setShowTrans] = useState(false);
  const [showRoma, setShowRoma] = useState(false);

  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLargeJump, setIsLargeJump] = useState(false);
  const [isLayoutChanging, setIsLayoutChanging] = useState(false);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const currentSongLyrics = usePlayerStore((s) => s.currentSongLyrics);
  const targetScrollYRef = useRef(0);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [blurDisabled, setBlurDisabled] = useState(false);
  const isUserScrolling = useRef(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 存储每行歌词的 DOM 引用
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lyric = useMemo(() => {
    return (
      ParseVerbatimLyric(currentSongLyrics?.yrc?.lyric) ||
      ParseLyric(currentSongLyrics?.lrc?.lyric)
    );
  }, [currentSongLyrics]);

  const transLyric = useMemo(() => {
    return (
      ParseLyric(currentSongLyrics?.ytlrc?.lyric) ||
      ParseLyric(currentSongLyrics?.tlyric?.lyric) ||
      []
    );
  }, [currentSongLyrics]);

  const romaLyric = useMemo(() => {
    return (
      ParseLyric(currentSongLyrics?.yromalrc?.lyric) ||
      ParseLyric(currentSongLyrics?.romalrc?.lyric) ||
      []
    );
  }, [currentSongLyrics]);

  const transMap = useMemo(() => {
    const map = new Map<number, LyricLine>();
    transLyric?.forEach((t) => map.set(t.lineStart, t));
    return map;
  }, [transLyric]);

  const romaMap = useMemo(() => {
    const map = new Map<number, LyricLine>();
    romaLyric?.forEach((r) => map.set(r.lineStart, r));
    return map;
  }, [romaLyric]);

  // 歌曲变化时滚动到顶部
  useEffect(() => {
    if (!currentSong) return;

    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentSong]);

  const currentTimeMotion = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // 使用 ref 缓存歌词数组和当前索引，避免闭包问题
  const lyricRef = useRef(lyric);
  const currentIndexRef = useRef(-1);
  
  // 同步歌词数组到 ref
  useEffect(() => {
    lyricRef.current = lyric;
  }, [lyric]);

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(
      (state) => state.currentTime,
      (currentTime) => {
        currentTimeMotion.set(currentTime * 1000);

        const lyrics = lyricRef.current;
        if (!lyrics?.length) return;
        
        const currentTimeMs = currentTime * 1000;
        let newIndex = -1;
        for (let i = lyrics.length - 1; i >= 0; i--) {
          if (lyrics[i].lineStart <= currentTimeMs && lyrics[i].lineStart >= 0) {
            newIndex = i;
            break;
          }
        }
        
        // 只在索引变化时更新状态
        if (currentIndexRef.current !== newIndex) {
          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);
        }
      },
    );
    return unsubscribe;
  }, [currentTimeMotion]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLargeJump) {
      const timer = setTimeout(() => {
        setIsLargeJump(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLargeJump]);

  const scrollToCurrentIndex = useCallback(
    (skipAnimation = false) => {
      if (currentIndex < 0 || !containerRef.current) return;

      const targetElement = lyricRefs.current[currentIndex];
      if (!targetElement) return;

      const containerHeight = containerRef.current.clientHeight;
      const offset =
        targetElement.offsetTop -
        containerHeight * LYRIC_FOCUS_RATIO +
        targetElement.clientHeight / 2;

      const newTargetScrollY = -offset;

      if (skipAnimation) {
        targetScrollYRef.current = newTargetScrollY;
        setCurrentScrollY(newTargetScrollY);
        return;
      }

      const jumpDistancePx = Math.abs(
        targetScrollYRef.current - newTargetScrollY,
      );
      if (jumpDistancePx > 150) {
        setIsLargeJump(true);
      }

      targetScrollYRef.current = newTargetScrollY;
      setCurrentScrollY(newTargetScrollY);
    },
    [currentIndex],
  );

  useEffect(() => {
    // 手动滚动时不跳回
    if (isUserScrolling.current) return;
    scrollToCurrentIndex();
  }, [currentIndex, scrollToCurrentIndex]);

  useEffect(() => {
    if (!isScrolling && !isUserScrolling.current) {
      scrollToCurrentIndex();
    }
  }, [isScrolling, scrollToCurrentIndex]);

  const handleUserInteraction = () => {
    isUserScrolling.current = true;
    setBlurDisabled(true);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
      setBlurDisabled(false);
      setIsScrolling(false);
    }, 2000);
  };

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    handleUserInteraction();

    if (!containerRef.current) return;

    const delta = e.deltaY;
    targetScrollYRef.current -= delta;

    const containerHeight = containerRef.current.clientHeight;
    const firstElement = lyricRefs.current[0];
    const lastElement = lyricRefs.current[lyricRefs.current.length - 1];

    if (firstElement && lastElement) {
      const maxScroll = -(
        firstElement.offsetTop -
        containerHeight / 2 +
        firstElement.clientHeight / 2
      );
      const minScroll = -(
        lastElement.offsetTop -
        containerHeight / 2 +
        lastElement.clientHeight / 2
      );

      targetScrollYRef.current = Math.max(
        minScroll,
        Math.min(maxScroll, targetScrollYRef.current),
      );
    }
    setCurrentScrollY(targetScrollYRef.current);
  }

  const visualIndex = useMemo(() => {
    if (!containerRef.current || lyricRefs.current.length === 0)
      return Math.max(0, currentIndex);
    const targetOffset = -currentScrollY;
    const containerHeight = containerRef.current.clientHeight;

    let minDiff = Infinity;
    let bestIndex = Math.max(0, currentIndex);
    for (let i = 0; i < lyricRefs.current.length; i++) {
      const el = lyricRefs.current[i];
      if (el) {
        const offset = el.offsetTop - containerHeight / 2 + el.clientHeight / 2;
        const diff = Math.abs(offset - targetOffset);
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = i;
        }
      }
    }
    return bestIndex;
  }, [currentScrollY, currentIndex]);

  return (
    <div className={cn("h-full w-full relative", className)}>
      <div
        className={cn(
          "h-full w-full flex justify-center overflow-hidden relative",
          className,
        )}
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleUserInteraction}
        style={{
          WebkitMaskImage: MASK_IMAGE,
        }}
      >
        <motion.div
          className="w-full flex flex-col items-start "
          style={{ fontFamily: "var(--app-lyric-font-family, inherit)" }}
        >
          {lyric?.map((lyricLine, idx) => {
            const inWindow =
              Math.abs(idx - visualIndex) <= 10 ||
              Math.abs(idx - currentIndex) <= 5;
            const distance = Math.abs(idx - currentIndex);
            const scrollDelay = distance * LYRIC_CROLL_DELAY;

            const isActive = idx === currentIndex;
            const shouldBlur = !blurDisabled && !isActive;

            const dynamicOpacity = isActive
              ? 1
              : Math.max(0.18, 0.54 - distance * 0.055);
            const dynamicBlur = shouldBlur ? Math.min(10, distance * 1.15) : 0;
            const dynamicScale = isActive
              ? 1
              : Math.max(0.82, 1 - distance * 0.035);

            return (
              <SongLyricLine
                key={idx}
                ref={(el) => {
                  lyricRefs.current[idx] = el;
                }}
                lyricLine={lyricLine}
                transLine={transMap.get(lyricLine.lineStart)}
                romaLine={romaMap.get(lyricLine.lineStart)}
                showTrans={showTrans}
                showRoma={showRoma}
                currentTimeMotion={currentTimeMotion}
                scrollDelay={scrollDelay}
                isActive={isActive}
                opacity={dynamicOpacity}
                blur={dynamicBlur}
                scale={dynamicScale}
                targetScrollY={currentScrollY}
                isScrolling={isScrolling}
                isLargeJump={isLargeJump}
                isLayoutChanging={isLayoutChanging}
                inWindow={inWindow}
              />
            );
          })}
          <div className="w-full h-[50vh] shrink-0 pointer-events-none" />
        </motion.div>
      </div>
      <div className="flex items-center gap-4 absolute bottom-4 right-4">
        {transLyric.length > 0 && (
          <YeeButton
            variant="ghost"
            icon={
              <SFIcon icon={sfTranslate} className="size-6 drop-shadow-md" />
            }
            className={cn(
              "size-10 text-white rounded-full hover:bg-white/5 hover:text-white mix-blend-plus-lighter",
              showTrans &&
                "bg-white/60 text-black/80 hover:bg-white/80 hover:text-black/60",
            )}
            onClick={() => {
              flushSync(() => {
                setIsLayoutChanging(true);
                setShowTrans((prev) => {
                  if (showRoma) setShowRoma(false);
                  return !prev;
                });
              });

              if (!isUserScrolling.current && containerRef.current) {
                const targetElement = lyricRefs.current[currentIndex];
                if (targetElement) {
                  const offset =
                    targetElement.offsetTop -
                    containerRef.current.clientHeight / 2 +
                    targetElement.clientHeight / 2;
                  flushSync(() => {
                    targetScrollYRef.current = -offset;
                    setCurrentScrollY(-offset);
                  });
                }
              }
              setTimeout(() => setIsLayoutChanging(false), 50);
            }}
          />
        )}
        {romaLyric.length > 0 && (
          <YeeButton
            variant="ghost"
            icon={
              <SFIcon
                icon={sfCharacterPhonetic}
                className="size-5 drop-shadow-md"
              />
            }
            className={cn(
              "size-10 text-white rounded-full hover:bg-white/5 hover:text-white mix-blend-plus-lighter",
              showRoma &&
                "bg-white/60 text-black/80 hover:bg-white/80 hover:text-black/60",
            )}
            onClick={() => {
              flushSync(() => {
                setIsLayoutChanging(true);
                setShowRoma((prev) => {
                  if (showTrans) setShowTrans(false);
                  return !prev;
                });
              });

              if (!isUserScrolling.current && containerRef.current) {
                const targetElement = lyricRefs.current[currentIndex];
                if (targetElement) {
                  const offset =
                    targetElement.offsetTop -
                    containerRef.current.clientHeight / 2 +
                    targetElement.clientHeight / 2;
                  flushSync(() => {
                    targetScrollYRef.current = -offset;
                    setCurrentScrollY(-offset);
                  });
                }
              }
              setTimeout(() => setIsLayoutChanging(false), 50);
            }}
          />
        )}
      </div>
    </div>
  );
}

import { forwardRef } from "react";
import React from "react";
import { YeeButton } from "../yee-button";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { sfTranslate, sfCharacterPhonetic } from "@bradleyhodges/sfsymbols";

export const SongLyricLine = forwardRef<
  HTMLDivElement,
  {
    lyricLine: LyricLine;
    transLine?: LyricLine;
    romaLine?: LyricLine;
    showTrans: boolean;
    showRoma: boolean;
    currentTimeMotion: MotionValue<number>;
    scrollDelay: number;
    isActive: boolean;
    opacity: number;
    blur: number;
    scale: number;
    targetScrollY: number;
    isScrolling: boolean;
    isLargeJump: boolean;
    isLayoutChanging?: boolean;
    inWindow: boolean;
  }
>(
  (
    {
      lyricLine,
      transLine,
      romaLine,
      showTrans,
      showRoma,
      currentTimeMotion,
      scrollDelay,
      isActive,
      opacity,
      blur,
      scale,
      targetScrollY,
      isScrolling,
      isLargeJump,
      isLayoutChanging,
      inWindow,
    },
    ref,
  ) => {
    const duration = usePlayerStore((s) => s.duration);
    const seek = usePlayerStore((s) => s.seek);

    function handleClick() {
      seek((lyricLine.lineStart / (duration * 1000)) * 100);
    }

    const hasWords = lyricLine.words && lyricLine.words.length > 0;

    // y 位移动画曲线
    const yTransition = isLayoutChanging
      ? {
          type: "spring" as const,
          stiffness: 120,
          damping: 20,
          mass: 0.8,
          delay: 0,
        }
      : isScrolling
        ? { type: "tween" as const, duration: 0, ease: "linear" as const }
        : isLargeJump
          ? {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.5,
              delay: 0,
            }
          : {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.8,
              delay: scrollDelay,
            };

    // layout 动画曲线
    const layoutTransition = isLayoutChanging
      ? {
          type: "spring" as const,
          stiffness: 170,
          damping: 26,
          mass: 0.8,
          delay: 0,
        }
      : isScrolling
        ? { type: "tween" as const, duration: 0, ease: "linear" as const }
        : isLargeJump
          ? {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.5,
              delay: 0,
            }
          : {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.8,
              delay: scrollDelay,
            };

    if (!inWindow) {
      return (
        <div
          ref={ref}
          className="px-4 py-5 rounded-xl inline-block pointer-events-none transform-gpu will-change-transform"
          style={{ transform: `translateY(${targetScrollY}px)`, opacity: 0 }}
        >
          <span className="w-full text-4xl text-white mix-blend-plus-lighter inline-block font-bold tracking-[-0.04em]">
            {hasWords
              ? lyricLine.words!.map((w, wIdx) => (
                  <span
                    key={wIdx}
                    style={{
                      display: "inline-block",
                      whiteSpace: "pre",
                      fontWeight: "500",
                    }}
                  >
                    {w.char}
                  </span>
                ))
              : lyricLine.lineText}
          </span>
          {showTrans && transLine && (
            <span className="w-full text-2xl mix-blend-plus-lighter inline-block font-medium tracking-tight mt-4">
              {transLine.lineText}
            </span>
          )}
          {showRoma && romaLine && (
            <span className="w-full text-2xl mix-blend-plus-lighter inline-block font-medium tracking-tight mt-4">
              {romaLine.lineText}
            </span>
          )}
        </div>
      );
    }

    return (
      <motion.div
        layout
        ref={ref}
        animate={{ y: targetScrollY }}
        transition={{ layout: layoutTransition, y: yTransition }}
        className="transform-gpu will-change-transform"
      >
        <motion.div
          className="cursor-pointer hover:bg-white/5 px-4 py-5 rounded-xl inline-block transition-colors duration-300 transform-gpu will-change-transform"
          onClick={handleClick}
        >
          <motion.span
            initial={false}
            className="w-full text-4xl text-white/60 mix-blend-plus-lighter inline-block font-bold tracking-[-0.04em] leading-[1.28] transform-gpu will-change-transform"
            animate={{
              filter: `blur(${blur}px)`,
              opacity,
              scale,
              transformOrigin: "left center",
              willChange: "transform",
              y: !hasWords && isActive ? -4 : 0,
            }}
            transition={springShared}
          >
            {hasWords
              ? lyricLine.words!.map((word, wordIdx) => (
                  <VerbatimWord
                    key={wordIdx}
                    word={word}
                    currentTimeMotion={currentTimeMotion}
                  />
                ))
              : lyricLine.lineText}
          </motion.span>

          {showTrans && transLine && (
            <motion.span
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={smoothLinear}
              className="w-full text-2xl mix-blend-plus-lighter inline-block font-medium tracking-tight mt-4"
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                filter: `blur(${blur}px)`,
              }}
            >
              {transLine.lineText}
            </motion.span>
          )}

          {showRoma && romaLine && (
            <motion.span
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={smoothLinear}
              className="w-full text-2xl mix-blend-plus-lighter inline-block font-medium tracking-tight mt-4"
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                filter: `blur(${blur}px)`,
              }}
            >
              {romaLine.lineText}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    );
  },
);

SongLyricLine.displayName = "SongLyricLine";

const VerbatimWord = React.memo(function VerbatimWord({
  word,
  currentTimeMotion,
}: {
  word: LyricWord;
  currentTimeMotion: MotionValue<number>;
}) {
  const endTime = word.startTime + word.duration;

  // 优化：直接使用 useTransform 计算进度
  const rawProgress = useTransform(
    currentTimeMotion,
    [word.startTime, endTime],
    [0, 1],
  );

  // 简化的渐变计算
  const gradientPct = useTransform(rawProgress, (p) => `${(1 - p) * 100}%`);
  
  // 简化的辉光因子计算
  const glowFactor = useTransform(rawProgress, (p) => {
    // 在进度 0.25-0.7 之间辉光最强
    if (p <= 0.25) return p / 0.25;
    if (p >= 0.7) return Math.max(0, 1 - (p - 0.7) / 0.3);
    return 1;
  });
  
  // 使用简化的渐变和辉光
  const backgroundImage = useMotionTemplate`linear-gradient(100deg,
      rgba(255,255,255,0.85) 0%,
      rgba(255,255,255,0.55) calc(100% - ${gradientPct}),
      rgba(255,255,255,0) calc(100% - ${gradientPct} + 12%),
      rgba(255,255,255,0) 100%
    )`;
    
  // 简化的文本阴影
  const textShadow = useMotionTemplate`0 0 ${glowFactor}px rgba(255,255,255,${glowFactor})`;

  return (
    <motion.span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        backgroundImage: backgroundImage,
        color: "rgba(255,255,255,0.4)",
        WebkitTextFillColor: "rgba(255,255,255,0.4)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        willChange: "transform, opacity",
        fontWeight: "500",
        textShadow: textShadow,
        mixBlendMode: "plus-lighter",
      }}
    >
      {word.char}
    </motion.span>
  );
});
