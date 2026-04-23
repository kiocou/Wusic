import { Song } from "@/lib/types";
import { SongListItem } from "./song-list-item";
import { Virtuoso } from "react-virtuoso";
import { motion } from "framer-motion";
import { staggerItem } from "@/styles/animations";

export function SongList({
  songList,
  showCover = true,
  showAlbum = false,
}: {
  songList: Song[];
  showCover?: boolean;
  showAlbum?: boolean;
}) {
  return (
    <Virtuoso
      useWindowScroll
      customScrollParent={
        document.getElementById("main-scroll-container") as HTMLElement
      }
      data={songList}
      itemContent={(index, song) => (
        <motion.div
          custom={index}
          variants={staggerItem}
          initial="hidden"
          animate="show"
          className="pb-4 transform-gpu will-change-transform"
        >
          <SongListItem
            song={song}
            index={index}
            showCover={showCover}
            showAlbum={showAlbum}
          />
        </motion.div>
      )}
    />
  );
}
