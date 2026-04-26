import { Album } from "@/lib/types";
import { GetThumbnail, cn, formateDate } from "@/lib/utils";
import { Play24Filled } from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Link } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { motion } from "framer-motion";

export function AlbumItem({
  album,
  showArtist,
  showDate,
}: {
  album: Album;
  showArtist: boolean;
  showDate: boolean;
}) {
  const playList = usePlayerStore((s) => s.playList);
  const openMenu = useContextMenuStore((s) => s.openMenu);

  return (
    <motion.div
      className="w-32 flex flex-col gap-4 transform-gpu"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, "album", album);
      }}
    >
      <div className="size-32 rounded-md overflow-hidden relative drop-shadow-md group cursor-pointer">
        <Link to={`/detail/album?id=${album.id}`}>
          <img
            src={GetThumbnail(album.picUrl!)}
            alt={`${album.name} Cover`}
            loading="lazy"
            className="group-hover:brightness-60 transition-all duration-300 object-cover group-hover:scale-105 transform-gpu"
          />
        </Link>

        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        >
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Play24Filled
              className="size-10 text-white drop-shadow-md hover:text-gray-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playList(album.id, "album");
              }}
            />
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold line-clamp-1 text-md">{album.name}</span>
        {showArtist && (
          <div className="line-clamp-1">
            {album.artists?.map((ar, index) => (
              <Link
                to={`/detail/artist?id=${ar.id}`}
                key={`{ar.id}-${index}`}
                className="text-foreground/60 hover:text-foreground/80 text-sm transition-colors duration-200"
              >
                {ar.name}
                {index !== album.artists!.length - 1 && "、"}
              </Link>
            ))}
          </div>
        )}
        {showDate && (
          <span className="text-foreground/60 text-sm">
            {formateDate(album.publishTime!)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
