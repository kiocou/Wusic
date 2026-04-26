import { Loading } from "@/components/loading";
import { SongList } from "@/components/song/song-list";
import { StatePanel } from "@/components/ui/state-panel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getArtistAllSongs } from "@/lib/services/artist";
import { Song } from "@/lib/types";
import { CollectionsEmpty24Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";

export function ArtistSong({
  artistId,
  searchQuery,
}: {
  artistId: number | string;
  searchQuery?: string;
}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");

  const LIMIT = 50;

  useEffect(() => {
    async function fetchArtistSongs() {
      setLoading(true);
      setError("");
      try {
        const res = await getArtistAllSongs({
          id: artistId.toString(),
          limit: LIMIT,
          offset: offset,
        });
        setSongs((prev) =>
          offset === 0 ? [...res.songDetails] : [...prev, ...res.songDetails],
        );
        setHasMore(res.more);
      } catch (err) {
        console.error(err);
        setError("获取歌手歌曲失败，请稍后重试。");
      } finally {
        setLoading(false);
      }
    }
    fetchArtistSongs();
  }, [artistId, offset]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ar?.some((a) => a.name.toLowerCase().includes(q)) ||
        s.al?.name.toLowerCase().includes(q),
    );
  }, [songs, searchQuery]);

  const loadMoreRef = useInfiniteScroll(
    () => setOffset((prev) => prev + LIMIT),
    { hasMore, loading },
  );

  return (
    <div className="w-full h-full">
      {filteredSongs.length > 0 ? (
        <SongList songList={filteredSongs} showAlbum={true} />
      ) : !loading && (
        <StatePanel
          compact
          icon={<CollectionsEmpty24Regular className="size-6" />}
          title={error ? "加载失败" : searchQuery ? "没有匹配的歌曲" : "暂无歌曲"}
          description={
            error ||
            (searchQuery
              ? "换个关键词试试，或清空当前搜索。"
              : "这个歌手暂时没有可展示的歌曲。")
          }
        />
      )}

      <div ref={loadMoreRef} className="flex justify-center py-4">
        {loading && <Loading />}
        {!hasMore && songs.length > 0 && (
          <span className="text-muted-foreground">没有更多了</span>
        )}
      </div>
    </div>
  );
}
