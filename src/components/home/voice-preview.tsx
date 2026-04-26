import { Skeleton } from "@/components/ui/skeleton";
import { creative } from "@/lib/types";
import {
  ArrowDownload24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { Vibrant } from "node-vibrant/browser";
import { GetThumbnail } from "@/lib/utils";
import { motion } from "framer-motion";

export function VoicePreview({ creatives }: { creatives: creative[] }) {
  return (
    <motion.div 
      className="flex flex-col gap-6 basis-[calc((100%-1rem)/2)]"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.05,
          },
        },
      }}
    >
      {creatives.map((creative, index) => (
        <motion.div
          key={creative.creativeId}
          variants={{
            hidden: { opacity: 0, x: -12 },
            visible: {
              opacity: 1,
              x: 0,
              transition: {
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1],
                delay: Math.min(index * 0.06, 0.3),
              },
            },
          }}
        >
          <VoicePreviewItem creative={creative} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function VoicePreviewItem({ creative }: { creative: creative }) {
  const uiElement = creative?.uiElement;
  const title = uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const cover = uiElement?.image?.imageUrl || "";
  const labels = uiElement?.labelTexts;
  const playCount = creative?.creativeExtInfoVO?.playCount;
  const [borderColor, setBorderColor] = useState("transparent");
  const [gradient, setGradient] = useState("linear-gradient(180deg, transparent, transparent)");
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
    if (!creative) return;

    const coverUrl = GetThumbnail(uiElement?.image?.imageUrl || "");
    if (coverUrl) {
      try {
        const v = new Vibrant(coverUrl);
        v.getPalette().then((palette) => {
          const coverColor = palette.LightVibrant?.hex || "transparent";
          const coverColor2 = palette.DarkMuted?.hex || "transparent";
          setBorderColor(coverColor);
          setGradient(`linear-gradient(180deg, ${coverColor}, ${coverColor2})`);
        });
      } catch (error) {
        console.error("Failed to extract color", error);
      }
    }
  }, [creative, uiElement]);

  if (!creative) {
    return (
      <div className="bg-white flex gap-4 justify-between">
        <div className="w-16 h-16 rounded-sm overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="flex-1 flex flex-col gap-2 justify-center">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      </div>
    );
  }

  // 格式化播放次数
  const formatPlayCount = (count?: number) => {
    if (!count) return "";
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  return (
    <div className="flex gap-4 justify-between group">
      <motion.div 
        ref={cardRef}
        className="w-16 h-16 rounded-sm overflow-hidden relative shrink-0 border group cursor-pointer transform-gpu"
        style={{
          "--card-border": borderColor || "transparent",
          "--card-gradient": gradient,
          "--mouse-x": "50%",
          "--mouse-y": "50%",
          "--spotlight-color": "rgba(255, 255, 255, 0.3)",
          background: gradient,
          borderColor: borderColor,
        } as React.CSSProperties}
        onPointerMove={handleMove}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <img
          loading="lazy"
          src={cover}
          alt="Voice cover"
          className="w-16 h-16 object-cover group-hover:brightness-50 transform transition-all duration-300 ease-in-out"
        />

        <motion.div 
          className="cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Play24Filled width={24} height={24} />
        </motion.div>
        
        {/* 光感效果 */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100 z-10"
          style={{
            background: `radial-gradient(250px circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent)`,
          } as React.CSSProperties}
        />
      </motion.div>

      <div className="flex-1 flex flex-col gap-1 justify-center min-w-0">
        <span className="truncate text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {playCount && (
            <span className="flex items-center gap-2">
              {labels![0]} · {formatPlayCount(playCount)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 shrink-0 pr-6">
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          <ArrowDownload24Regular className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          <MoreHorizontal24Regular className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
        </motion.div>
      </div>
    </div>
  );
}
