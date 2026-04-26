import { getRecentAlbum, RecentAlbumData } from "@/lib/services/recent";
import { AlbumItem } from "../album/album-item";
import { Loading } from "../loading";
import { StatePanel } from "../ui/state-panel";
import useSWR from "swr";
import { motion } from "framer-motion";

export function RecentAlbum() {
  const { data, isLoading, error } = useSWR<RecentAlbumData[]>(
    "recentAlbum",
    async () => {
      const res = await getRecentAlbum();
      return res.data.list;
    },
  );

  return (
    <div className="w-full h-full">
      {isLoading && <Loading />}
      {!isLoading && error && (
        <StatePanel
          compact
          title="最近专辑加载失败"
          description="请检查网络或稍后重试。"
        />
      )}
      {!isLoading && !error && data?.length === 0 && (
        <StatePanel compact title="暂无最近专辑" description="浏览或播放专辑后会记录在这里。" />
      )}
      {!isLoading && !error && data && data.length > 0 && (
        <motion.div 
          className="w-full grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.03,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {data.map((album, index) => (
            <motion.div
              key={album.data.id}
              variants={{
                hidden: { opacity: 0, y: 16, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1],
                    delay: Math.min(index * 0.03, 0.4),
                  },
                },
              }}
            >
              <AlbumItem
                album={album.data}
                showArtist={true}
                showDate={false}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
