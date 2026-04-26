import { SongList } from "@/components/song/song-list";
import { StatePanel } from "@/components/ui/state-panel";
import { Song } from "@/lib/types";
import { CollectionsEmpty24Regular } from "@fluentui/react-icons";
import { useMemo } from "react";

export function PlaylistSongs({
  songs,
  query,
  sort,
}: {
  songs: Song[];
  query: string;
  sort?: string;
}) {
  const filteredAndSortedSongs = useMemo(() => {
    let result = [...songs];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.al?.name.toLowerCase().includes(q) ||
          s.ar?.some((a) => a.name.toLowerCase().includes(q)),
      );
    }

    if (!sort || result.length === 0) return result;

    return [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name, "zh-CN");
        case "artist":
          const artistA = a.ar?.[0]?.name || "";
          const artistB = b.ar?.[0]?.name || "";
          return artistA.localeCompare(artistB, "zh-CN");

        case "album":
          const albumA = a.al?.name || "";
          const albumB = b.al?.name || "";
          return albumA.localeCompare(albumB, "zh-CN");

        case "duration":
          const dtA = a.dt || 0;
          const dtB = b.dt || 0;
          return dtB - dtA;

        case "date":
          return 0;

        default:
          return 0;
      }
    });
  }, [songs, query, sort]);

  return (
    <div className="w-full h-full">
      {filteredAndSortedSongs.length > 0 ? (
        <SongList songList={filteredAndSortedSongs} showAlbum={true} />
      ) : (
        <StatePanel
          compact
          icon={<CollectionsEmpty24Regular className="size-6" />}
          title={songs.length ? "没有匹配的歌曲" : "暂无歌曲"}
          description={
            songs.length
              ? "换个关键词试试，或清空当前搜索。"
              : "这个歌单还没有可播放内容。"
          }
        />
      )}
    </div>
  );
}
