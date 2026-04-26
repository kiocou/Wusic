import { getSongDetail } from "@/lib/services/song";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Resource } from "@/lib/types";
import { GetThumbnail, cn } from "@/lib/utils";
import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { useSongLogic } from "@/hooks/use-song-logic";
import { useEffect, useRef, useState } from "react";
import { extractColorFromImage } from "@/utils/color-utils";
import { motion } from "framer-motion";

export function SongPreview({ resources }: { resources: Resource[] }) {
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
      {resources.map((res, index) => (
        <motion.div
          key={res.resourceId}
          variants={{
            hidden: { opacity: 0, x: -12, scale: 0.98 },
            visible: {
              opacity: 1,
              x: 0,
              scale: 1,
              transition: {
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1],
                delay: Math.min(index * 0.06, 0.3),
              },
            },
          }}
        >
          <SongPreviewItem resource={res} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function SongPreviewItem({ resource }: { resource: Resource }) {
  const { checkIsLiked, handleLike } = useSongLogic();
  const isLiked = checkIsLiked("resource", resource);
  const LikeIcon = isLiked ? Heart24Filled : Heart24Regular;

  const uiElement = resource?.uiElement;
  const resourceExtInfo = resource?.resourceExtInfo;
  const title = uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const artists = resourceExtInfo?.artists || [];
  const cover = uiElement?.image?.imageUrl || "";

  const { playSong } = usePlayerStore();
  const [borderColor, setBorderColor] = useState("transparent");
  const [gradient, setGradient] = useState("linear-gradient(180deg, transparent, transparent)");
  const cardRef = useRef<HTMLDivElement>(null);

  async function handlePlay() {
    const songId = resource.resourceId;
    if (!songId) return;

    const res = await getSongDetail([songId]);
    if (res && res.length > 0) {
      playSong(res[0]);
    }
  }

  const openMenu = useContextMenuStore((s) => s.openMenu);

  const handleMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
    if (!resource) return;

    const coverUrl = GetThumbnail(uiElement?.image?.imageUrl || "");
    if (coverUrl) {
      try {
        extractColorFromImage(coverUrl).then((colors) => {
          setBorderColor(colors.light);
          setGradient(`linear-gradient(180deg, ${colors.light}, ${colors.dark})`);
        });
      } catch (error) {
        console.error("Failed to extract color", error);
      }
    }
  }, [resource, uiElement]);

  return (
    <div
      className={cn("flex gap-4 justify-between items-center group p-3 rounded-xl transition-all duration-300 ease-out hover:bg-accent/30")}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, "resource", resource);
      }}
    >
      <motion.div
        ref={cardRef}
        className="w-16 h-16 rounded-lg overflow-hidden relative cursor-pointer transition-all duration-300 ease-out hover:shadow-lg group transform-gpu"
        style={{
          "--card-border": borderColor || "transparent",
          "--card-gradient": gradient,
          "--mouse-x": "50%",
          "--mouse-y": "50%",
          "--spotlight-color": "rgba(255, 255, 255, 0.3)",
          background: gradient,
          borderColor: borderColor,
        } as React.CSSProperties}
        onClick={handlePlay}
        onPointerMove={handleMove}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <img
          loading="lazy"
          src={GetThumbnail(cover)}
          alt="Album cover"
          className="object-cover transition-all duration-500 ease-out group-hover:scale-105"
        />

        <motion.div 
          className="cursor-pointer bg-gradient-to-t from-black/70 via-black/30 to-transparent absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-full p-2"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Play24Filled
              width={24}
              height={24}
              className="text-white"
            />
          </motion.div>
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
        <span className="text-sm font-semibold tracking-tight line-clamp-1">{title}</span>
        <div className="line-clamp-1">
          {artists.map((ar, idx) => (
            <Link to={`/detail/artist?id=${ar.id}`} key={`${ar.id}-${idx}`} className="transition-colors duration-300 ease-out">
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {ar.name}
                {idx < artists.length - 1 && "、"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transform transition-all duration-300 ease-out">
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          <LikeIcon
            onClick={() => handleLike("resource", resource)}
            className={cn(
              "size-5 text-muted-foreground cursor-pointer hover:text-foreground transition-all duration-300 ease-out",
              isLiked && "text-red-500 hover:text-red-600",
            )}
          />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          <MoreHorizontal24Regular
            className="size-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-300 ease-out"
            onClick={(e) => {
              e.preventDefault();
              openMenu(e.clientX, e.clientY, "resource", resource);
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
