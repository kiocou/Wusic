import { PlaylistSongs } from "@/components/playlist/detail/playlist-songs";
import { Loading } from "@/components/loading";
import { StatePanel } from "@/components/ui/state-panel";
import { YeeButton } from "@/components/yee-button";
import { getDailyRecommend } from "@/lib/services/recommend";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Play24Filled } from "@fluentui/react-icons";
import { useEffect, useState } from "react";

export default function DailyRecommendPage() {
  const date = Date.now();
  const day = new Date(date).getDate();
  const month = new Date(date).getMonth() + 1;

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { playQueue } = usePlayerStore();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await getDailyRecommend();
        setSongs(res);
      } catch (err) {
        console.error("获取每日推荐失败", err);
        setError("每日推荐暂时不可用，请稍后再试。");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <p
          className="text-3xl font-bold tracking-tighter drop-shadow-lg"
          style={{ fontFamily: "寒蝉锦书宋" }}
        >
          {month} 月 {day} 日，
        </p>
        <p className="text-lg font-medium text-foreground/60">
          从{songs[0]?.ar?.[0]?.name ?? "今天"}的
          <span style={{ fontFamily: "寒蝉锦书宋" }} className="font-semibold">
            《{songs[0]?.name ?? "推荐歌曲"}》
          </span>
          开始。
        </p>
      </div>

      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
        )}
      >
        <div className="flex gap-4">
          <YeeButton
            variant="outline"
            icon={<Play24Filled className="size-4" />}
            disabled={songs.length === 0}
            onClick={() => playQueue(songs)}
            aria-label="播放每日推荐"
            title="播放每日推荐"
          />
        </div>
      </div>

      {error ? (
        <StatePanel title="加载失败" description={error} />
      ) : (
        <PlaylistSongs songs={songs} query={""} />
      )}
    </div>
  );
}
