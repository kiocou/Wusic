import { Playlist } from "@/lib/types";
import { Play24Filled } from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Link } from "react-router-dom";
import { YeeButton } from "../yee-button";
import { GetThumbnail } from "@/lib/utils";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { motion } from "framer-motion";

export function PlaylistItem({ playlist }: { playlist: Playlist }) {
  const playList = usePlayerStore((s) => s.playList);
  const openMenu = useContextMenuStore((s) => s.openMenu);

  return (
    <motion.div
      className="flex gap-4 group/item"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -2 }}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, "playlist", playlist);
      }}
    >
      <div className="size-24 relative rounded-md overflow-hidden drop-shadow-md cursor-pointer group">
        <Link to={`/detail/playlist?id=${playlist.id}`}>
          <img
            src={GetThumbnail(playlist.coverImgUrl!)}
            alt={`${playlist.name} cover`}
            className="group-hover:brightness-60 transition-all duration-300 object-cover group-hover:scale-105 transform-gpu"
          />
        </Link>
      </div>
      <div className="flex flex-col justify-between items-start">
        <div className="flex flex-col">
          <span className="font-semibold text-md">{playlist.name}</span>
          <span className="text-foreground/60 text-sm">
            {playlist.creator.nickname}
          </span>
        </div>
        <YeeButton
          variant="outline"
          className="bg-white"
          icon={<Play24Filled className="size-4" />}
          onClick={() => playList(playlist.id, "list")}
        />
      </div>
    </motion.div>
  );
}
