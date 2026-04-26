import { Song } from "@/lib/types";
import { GetThumbnail, cn, formatDuration } from "@/lib/utils";
import { MoreHorizontal24Regular, Play24Filled } from "@fluentui/react-icons";
import { Button } from "../ui/button";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Link } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import type React from "react";
import { AudioLinesIcon } from "./audio-lines-icon";
import { motion } from "framer-motion";

export function SongListItem({
  song,
  index,
  showCover = true,
  showAlbum = true,
}: {
  song: Song;
  index: number;
  showCover: boolean;
  showAlbum?: boolean;
}) {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const gridTemplate = showAlbum
    ? "grid-cols-[1fr_1fr_1fr_52px_26px]"
    : "grid-cols-[1fr_1fr_52px_26px]";

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    openMenu(e.clientX, e.clientY, "song", song);
  }

  const isPlaying = currentSong?.id === song.id;
  const album = song.al ?? song.album;
  const artists = song.ar ?? song.artists ?? [];
  const coverUrl = album?.picUrl ? GetThumbnail(album.picUrl) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index, 20) * 0.02,
        ease: [0.32, 0.72, 0, 1],
      }}
      className={cn(
        "flex-1 flex flex-col hover:bg-[var(--row-hover)] rounded-md",
        index % 2 === 0 && "bg-[var(--row-striped)]",
        "transition-colors duration-200 transform-gpu will-change-transform",
      )}
      onDoubleClick={() => playSong(song)}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={handleContextMenu}
    >
      <div className={`grid ${gridTemplate} items-center px-4 py-3 group`}>
        <div className="flex gap-4 items-center ">
          {showCover ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-10 h-10 relative rounded-sm overflow-hidden shrink-0 group cursor-pointer border transform-gpu"
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={`${album?.name ?? song.name}专辑封面`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-foreground/5 text-foreground/40">
                  <Play24Filled className="size-4" />
                </div>
              )}

              {!isPlaying && (
                <div
                  className="absolute inset-0 group-hover:bg-[var(--image-overlay)] flex justify-center items-center transition-all duration-200"
                  onClick={() => playSong(song)}
                >
                  <Play24Filled className="opacity-0 group-hover:opacity-100 size-4 text-white transition-all duration-200 scale-75 group-hover:scale-100" />
                </div>
              )}
              {isPlaying && (
                <div
                  className="absolute inset-0 bg-[var(--image-overlay)] flex justify-center items-center"
                  onClick={() => togglePlay()}
                >
                  <AudioLinesIcon className="text-white" />
                </div>
              )}
            </motion.div>
          ) : (
            <div className="size-6 flex items-center justify-center text-foreground/40 relative">
              {!isPlaying && (
                <>
                  <span className="group-hover:hidden">{index + 1}</span>
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="hidden group-hover:flex hover:text-foreground/60 cursor-pointer"
                    onClick={() => playSong(song)}
                  >
                    <Play24Filled className="size-4" />
                  </motion.div>
                </>
              )}
              {isPlaying && (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="absolute left-1/2 top-1/2 -translate-1/2 text-black cursor-pointer"
                  onClick={() => togglePlay()}
                >
                  <AudioLinesIcon className="text-foreground/40 hover:text-foreground/60" />
                </motion.div>
              )}
            </div>
          )}
          <span className="line-clamp-1 w-3/4 font-semibold text-sm">
            {song.name}
          </span>
        </div>

        <div className="line-clamp-1 w-3/4">
          {artists.map((ar, idx) => (
            <Link
              key={`${song.id}-${ar.id}-${idx}`}
              to={`/detail/artist?id=${ar.id}`}
            >
              <span className="text-foreground/60 hover:text-foreground/80 cursor-pointer text-sm font-medium transition-colors duration-200">
                {ar.name}
                {idx < artists.length - 1 && "、"}
              </span>
            </Link>
          ))}
        </div>

        {showAlbum &&
          (album?.name ? (
            <Link to={`/detail/album?id=${album.id}`}>
              <span className="line-clamp-1 w-3/4 text-foreground/60 hover:text-foreground/80 cursor-pointer text-sm transition-colors duration-200">
                {album.name}
              </span>
            </Link>
          ) : (
            <span className="line-clamp-1 w-3/4 text-foreground/60 text-sm">
              未知专辑
            </span>
          ))}

        <span className=" text-foreground/40 text-sm">
          {formatDuration((song.dt || 1) / 1000)}
        </span>
        <span>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={handleContextMenu}
            >
              <MoreHorizontal24Regular className="size-4" />
            </Button>
          </motion.div>
        </span>
      </div>
    </motion.div>
  );
}
