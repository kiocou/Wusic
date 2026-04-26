import { getRecentPlaylist, RecentPlaylistData } from "@/lib/services/recent";
import { Loading } from "../loading";
import { PlaylistItem } from "../playlist/playlist-item";
import { StatePanel } from "../ui/state-panel";
import useSWR from "swr";
import { motion } from "framer-motion";

export function RecentPlaylist() {
  const { data, isLoading, error } = useSWR<RecentPlaylistData[]>(
    "recentPlaylist",
    async () => {
      const res = await getRecentPlaylist();
      return res.data.list;
    },
  );

  return (
    <div className="w-full h-full">
      {isLoading && <Loading />}
      {!isLoading && error && (
        <StatePanel
          compact
          title="最近歌单加载失败"
          description="请检查网络或稍后重试。"
        />
      )}
      {!isLoading && !error && data?.length === 0 && (
        <StatePanel compact title="暂无最近歌单" description="打开歌单后会记录在这里。" />
      )}
      {!isLoading && !error && data && data.length > 0 && (
        <motion.div
          className="w-full grid gap-12"
          style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {data.map((playlist, index) => (
            <motion.div
              key={playlist.data.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1],
                    delay: Math.min(index * 0.04, 0.4),
                  },
                },
              }}
            >
              <PlaylistItem playlist={playlist.data} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
