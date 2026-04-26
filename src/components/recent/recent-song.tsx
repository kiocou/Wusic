import { getRecentSong, RecentSongData } from "@/lib/services/recent";
import { Loading } from "../loading";
import { SongListItem } from "../song/song-list-item";
import useSWR from "swr";
import { Virtuoso } from "react-virtuoso";
import { StatePanel } from "../ui/state-panel";

export function RecentSong() {
  const { data, isLoading, error } = useSWR<RecentSongData[]>(
    "recentSong",
    async () => {
      const res = await getRecentSong();
      return res.data.list;
    },
  );

  return (
    <div className="w-full h-full">
      {isLoading && <Loading />}
      {!isLoading && error && (
        <StatePanel
          compact
          title="最近播放加载失败"
          description="请检查网络或稍后重试。"
        />
      )}
      {!isLoading && !error && data?.length === 0 && (
        <StatePanel compact title="暂无最近播放" description="开始播放歌曲后会记录在这里。" />
      )}
      {!isLoading && !error && data && data.length > 0 && (
        <Virtuoso
          useWindowScroll
          customScrollParent={
            document.getElementById("main-scroll-container") as HTMLElement
          }
          data={data}
          itemContent={(index, song) => (
            <div className="pb-4" style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}>
              <SongListItem
                song={song.data}
                index={index}
                showCover={true}
                showAlbum={true}
              />
            </div>
          )}
        />
      )}
    </div>
  );
}
