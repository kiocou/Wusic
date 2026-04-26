"use client";

import { Resource } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Play28Filled } from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Link } from "react-router-dom";
import { GetThumbnail } from "@/lib/utils";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { useEffect, useRef, useState } from "react";
import { extractColorFromImage } from "@/utils/color-utils";
import { motion } from "framer-motion";

export function PlaylistCard({ resource }: { resource: Resource | null }) {
  const { playList } = usePlayerStore();
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const [borderColor, setBorderColor] = useState("transparent");
  const [gradient, setGradient] = useState("linear-gradient(180deg, transparent, transparent)");
  const cardRef = useRef<HTMLDivElement>(null);

  function handlePlay() {
    if (resource?.resourceId) {
      if (resource?.resourceType !== "song")
        playList(resource.resourceId, resource.resourceType);
    }
  }

  const handleMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  if (!resource) {
    return (
      <div className="w-32 flex flex-col gap-3">
        <div className="w-full h-32 rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Skeleton className="w-full h-4" />

          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    );
  }

  const uiElement = resource.uiElement;
  const title = 
    uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const cover = uiElement?.image?.imageUrl || "";

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
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
      }}
      className="w-36 flex flex-col gap-4 transform-gpu will-change-transform"
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, "playlist", resource);
      }}
    >
      <div
        ref={cardRef}
        className="w-full h-36 rounded-xl overflow-hidden group transition-all duration-300 ease-out hover:shadow-2xl relative transform-gpu will-change-transform"
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
      >
        <div className="w-full h-full relative cursor-pointer group">
          <Link to={`/detail/playlist?id=${resource.resourceId}`} className="block w-full h-full">
            <img
              className="transition duration-500 w-full h-full object-cover group-hover:scale-105 transform-gpu"
              src={GetThumbnail(cover)}
              alt="Album cover"
              loading="lazy"
            />

            <motion.div 
              className="bg-gradient-to-t from-black/70 via-black/30 to-transparent absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-full p-3"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                <Play28Filled
                  className="text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePlay();
                  }}
                />
              </motion.div>
            </motion.div>
          </Link>
          
          {/* 光感效果 */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100 z-10"
            style={{
              background: `radial-gradient(250px circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent)`,
            } as React.CSSProperties}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 w-full overflow-hidden">
        <p className="w-full line-clamp-2 text-sm font-semibold tracking-tight">
          {title.split("|")[0]}
        </p>
      </div>
    </motion.div>
  );
}
