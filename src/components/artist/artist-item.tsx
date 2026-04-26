import { Artist } from "@/lib/types";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function ArtistItem({ artist }: { artist: Artist }) {
  return (
    <motion.div
      className="w-32 flex flex-col gap-4 transform-gpu"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/detail/artist?id=${artist.id}`}>
        <motion.div
          className="size-32 rounded-full overflow-hidden relative drop-shadow-md group cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <img
            src={artist.img1v1Url || artist.picUrl || artist.cover!}
            alt={`${artist.name} Cover`}
            loading="lazy"
            className="group-hover:brightness-60 transition duration-300 object-cover group-hover:scale-110 transform-gpu"
          />
        </motion.div>
      </Link>
      <div className="flex flex-col gap-2 items-center">
        <span className="font-semibold line-clamp-1">{artist.name}</span>
      </div>
    </motion.div>
  );
}
